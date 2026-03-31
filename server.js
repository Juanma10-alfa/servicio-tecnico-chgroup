const path = require('path');
const crypto = require('crypto');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const QRCode = require('qrcode');

const PORT = process.env.PORT || 3000;
const BASE_PUBLIC_URL = process.env.BASE_PUBLIC_URL || `http://localhost:${PORT}`;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.sqlite');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));
app.use('/public', express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database(DB_PATH);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

function generateSecureToken() {
  return crypto.randomBytes(16).toString('base64url');
}

function nowIso() {
  return new Date().toISOString();
}

async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      public_id TEXT NOT NULL UNIQUE,
      apartment_name TEXT NOT NULL,
      room_name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS room_public_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL CHECK(status IN ('active', 'inactive')),
      version INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      revoked_at TEXT,
      FOREIGN KEY(room_id) REFERENCES rooms(id)
    )
  `);

  await run('CREATE INDEX IF NOT EXISTS idx_room_public_links_room_id ON room_public_links(room_id)');
  await run('CREATE INDEX IF NOT EXISTS idx_room_public_links_token ON room_public_links(token)');
}

function buildPublicUrl(token) {
  return `${BASE_PUBLIC_URL}/r/${token}`;
}

app.post('/admin/rooms', async (req, res) => {
  try {
    const { apartmentName, roomName } = req.body;
    if (!apartmentName || !roomName) {
      res.status(400).json({ error: 'apartmentName y roomName son obligatorios' });
      return;
    }

    const timestamp = nowIso();
    const publicId = generateSecureToken();
    const insert = await run(
      `INSERT INTO rooms (public_id, apartment_name, room_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [publicId, apartmentName, roomName, timestamp, timestamp]
    );

    const token = generateSecureToken();
    await run(
      `INSERT INTO room_public_links (room_id, token, status, version, created_at, updated_at)
       VALUES (?, ?, 'active', 1, ?, ?)`,
      [insert.lastID, token, timestamp, timestamp]
    );

    res.status(201).json({
      roomPublicId: publicId,
      publicUrl: buildPublicUrl(token)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/admin/public-links', async (req, res) => {
  try {
    const { roomPublicId } = req.body;
    if (!roomPublicId) {
      res.status(400).json({ error: 'roomPublicId es obligatorio' });
      return;
    }

    const room = await get('SELECT id FROM rooms WHERE public_id = ?', [roomPublicId]);
    if (!room) {
      res.status(404).json({ error: 'Habitación no encontrada' });
      return;
    }

    const latest = await get(
      'SELECT version FROM room_public_links WHERE room_id = ? ORDER BY version DESC LIMIT 1',
      [room.id]
    );
    const nextVersion = latest ? latest.version + 1 : 1;
    const token = generateSecureToken();
    const timestamp = nowIso();

    await run(
      `INSERT INTO room_public_links (room_id, token, status, version, created_at, updated_at)
       VALUES (?, ?, 'active', ?, ?, ?)`,
      [room.id, token, nextVersion, timestamp, timestamp]
    );

    res.status(201).json({
      roomPublicId,
      version: nextVersion,
      publicUrl: buildPublicUrl(token)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/admin/public-links/:roomPublicId/regenerate', async (req, res) => {
  try {
    const { roomPublicId } = req.params;
    const room = await get('SELECT id FROM rooms WHERE public_id = ?', [roomPublicId]);
    if (!room) {
      res.status(404).json({ error: 'Habitación no encontrada' });
      return;
    }

    const latest = await get(
      'SELECT version FROM room_public_links WHERE room_id = ? ORDER BY version DESC LIMIT 1',
      [room.id]
    );
    const nextVersion = latest ? latest.version + 1 : 1;
    const timestamp = nowIso();

    await run(
      `UPDATE room_public_links
       SET status = 'inactive', revoked_at = ?, updated_at = ?
       WHERE room_id = ? AND status = 'active'`,
      [timestamp, timestamp, room.id]
    );

    const token = generateSecureToken();
    await run(
      `INSERT INTO room_public_links (room_id, token, status, version, created_at, updated_at)
       VALUES (?, ?, 'active', ?, ?, ?)`,
      [room.id, token, nextVersion, timestamp, timestamp]
    );

    res.json({
      roomPublicId,
      version: nextVersion,
      publicUrl: buildPublicUrl(token)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/admin/qr', async (_req, res) => {
  try {
    const rows = await all(`
      SELECT
        r.public_id AS roomPublicId,
        r.apartment_name AS apartmentName,
        r.room_name AS roomName,
        l.token,
        l.version,
        l.status,
        l.updated_at AS linkUpdatedAt
      FROM rooms r
      LEFT JOIN room_public_links l
        ON l.room_id = r.id
       AND l.version = (
          SELECT MAX(version) FROM room_public_links WHERE room_id = r.id
       )
      ORDER BY r.apartment_name, r.room_name
    `);

    const data = rows.map((row) => ({
      roomPublicId: row.roomPublicId,
      apartmentName: row.apartmentName,
      roomName: row.roomName,
      linkStatus: row.status,
      version: row.version,
      updatedAt: row.linkUpdatedAt,
      publicUrl: row.token ? buildPublicUrl(row.token) : null,
      qr: row.token
        ? {
            png: `${BASE_PUBLIC_URL}/admin/qr/${row.token}.png`,
            svg: `${BASE_PUBLIC_URL}/admin/qr/${row.token}.svg`
          }
        : null
    }));

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/admin/qr/ui', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-qr.html'));
});

async function ensureActiveToken(token) {
  return get(
    `SELECT token FROM room_public_links WHERE token = ? AND status = 'active' LIMIT 1`,
    [token]
  );
}

app.get('/admin/qr/:token.png', async (req, res) => {
  const { token } = req.params;
  const active = await ensureActiveToken(token);
  if (!active) {
    res.status(404).json({ error: 'Token no encontrado o inactivo' });
    return;
  }

  const publicUrl = buildPublicUrl(token);
  const png = await QRCode.toBuffer(publicUrl, { type: 'png', width: 512, margin: 1 });
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Disposition', `attachment; filename="qr-${token}.png"`);
  res.send(png);
});

app.get('/admin/qr/:token.svg', async (req, res) => {
  const { token } = req.params;
  const active = await ensureActiveToken(token);
  if (!active) {
    res.status(404).json({ error: 'Token no encontrado o inactivo' });
    return;
  }

  const publicUrl = buildPublicUrl(token);
  const svg = await QRCode.toString(publicUrl, { type: 'svg', margin: 1 });
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Content-Disposition', `attachment; filename="qr-${token}.svg"`);
  res.send(svg);
});

app.get('/r/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const link = await get(
      `SELECT
        l.token,
        l.status,
        l.version,
        r.public_id AS roomPublicId,
        r.apartment_name AS apartmentName,
        r.room_name AS roomName
      FROM room_public_links l
      JOIN rooms r ON r.id = l.room_id
      WHERE l.token = ?
      LIMIT 1`,
      [token]
    );

    if (!link || link.status !== 'active') {
      res.status(404).json({ error: 'Link público inválido o expirado' });
      return;
    }

    res.json({
      roomPublicId: link.roomPublicId,
      apartmentName: link.apartmentName,
      roomName: link.roomName,
      version: link.version
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error inicializando DB:', error);
    process.exit(1);
  });
