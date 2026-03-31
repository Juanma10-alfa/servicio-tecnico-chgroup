require('dotenv').config();

const crypto = require('crypto');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const multer = require('multer');
const Database = require('better-sqlite3');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const MAX_FILE_SIZE_BYTES = Number(process.env.MAX_FILE_SIZE_BYTES || 5 * 1024 * 1024);
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

const db = new Database(path.join(__dirname, 'database.sqlite'));

db.exec(`
  CREATE TABLE IF NOT EXISTS incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    guest_phone TEXT NOT NULL,
    preferred_contact TEXT NOT NULL,
    availability TEXT,
    apartment TEXT NOT NULL,
    room TEXT NOT NULL,
    incident TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS incident_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_id INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    checksum_sha256 TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (incident_id) REFERENCES incidents(id)
  );
`);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1
  }
});

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || ''
  }
});

function isValidImageSignature(buffer, mimeType) {
  if (!buffer || buffer.length < 12) return false;

  const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const png =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;
  const webp =
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP';

  const mimeToMagic = {
    'image/jpeg': jpeg,
    'image/png': png,
    'image/webp': webp
  };

  return !!mimeToMagic[mimeType];
}

function validateIncidentBody(body) {
  const requiredFields = [
    'guest-name',
    'guest-email',
    'guest-phone',
    'preferred-contact',
    'apartment',
    'room',
    'incident'
  ];

  for (const field of requiredFields) {
    if (!body[field] || String(body[field]).trim() === '') {
      return `El campo "${field}" es obligatorio.`;
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body['guest-email'])) {
    return 'El correo electrónico no tiene un formato válido.';
  }

  if (!/^\d{9}$/.test(body['guest-phone'])) {
    return 'El teléfono debe tener exactamente 9 dígitos.';
  }

  return null;
}

app.post('/api/incidents', upload.single('incident-photo'), async (req, res) => {
  try {
    const bodyError = validateIncidentBody(req.body);
    if (bodyError) {
      return res.status(400).json({ error: bodyError });
    }

    const availability = Array.isArray(req.body.availability)
      ? req.body.availability.join(',')
      : req.body.availability || '';

    const insertIncident = db.prepare(`
      INSERT INTO incidents (
        guest_name,
        guest_email,
        guest_phone,
        preferred_contact,
        availability,
        apartment,
        room,
        incident
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const incidentResult = insertIncident.run(
      req.body['guest-name'].trim(),
      req.body['guest-email'].trim(),
      req.body['guest-phone'].trim(),
      req.body['preferred-contact'].trim(),
      availability,
      req.body.apartment.trim(),
      req.body.room.trim(),
      req.body.incident.trim()
    );

    if (req.file) {
      const { mimetype, size, buffer, originalname } = req.file;

      if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
        return res.status(400).json({
          error: 'Tipo de archivo no permitido. Solo se aceptan imágenes JPEG, PNG o WebP.'
        });
      }

      if (!isValidImageSignature(buffer, mimetype)) {
        return res.status(400).json({
          error: 'El archivo no coincide con un formato de imagen válido (JPEG/PNG/WebP).'
        });
      }

      const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
      const extension = path.extname(originalname).toLowerCase() || `.${mimetype.split('/')[1]}`;
      const objectKey = `incidents/${incidentResult.lastInsertRowid}/${Date.now()}-${crypto.randomUUID()}${extension}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: objectKey,
          Body: buffer,
          ContentType: mimetype,
          ACL: 'private',
          Metadata: {
            checksum_sha256: checksum
          }
        })
      );

      // Escaneo/limpieza básica: rechazo de dobles cabeceras binarias anómalas y checksum para trazabilidad.
      const suspiciousPatterns = ['4d5a', '25504446']; // MZ (exe), PDF
      const firstBytesHex = buffer.subarray(0, 4).toString('hex');
      if (suspiciousPatterns.includes(firstBytesHex)) {
        return res.status(400).json({
          error: 'El archivo parece contener contenido no permitido.'
        });
      }

      const insertAttachment = db.prepare(`
        INSERT INTO incident_attachments (
          incident_id,
          storage_path,
          mime_type,
          size_bytes,
          checksum_sha256
        ) VALUES (?, ?, ?, ?, ?)
      `);

      insertAttachment.run(
        incidentResult.lastInsertRowid,
        objectKey,
        mimetype,
        size,
        checksum
      );
    }

    return res.status(201).json({
      message: 'Incidencia registrada correctamente.',
      incidentId: incidentResult.lastInsertRowid
    });
  } catch (error) {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: `El archivo supera el límite permitido de ${Math.floor(MAX_FILE_SIZE_BYTES / (1024 * 1024))} MB.`
      });
    }

    return res.status(500).json({
      error: 'No se pudo procesar la incidencia en este momento.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
