# Servicio Técnico CH GROUP

Este repositorio contiene la aplicación para que los huéspedes de CH GROUP puedan reportar incidencias, incluyendo subida segura de imágenes adjuntas.

## Requisitos

- Node.js 20+
- Un bucket S3 compatible **privado** (AWS S3, MinIO, Cloudflare R2, etc.)

## Configuración

1. Copia variables de entorno:

   ```bash
   cp .env.example .env
   ```

2. Completa las credenciales S3 en `.env`.

3. Instala dependencias:

   ```bash
   npm install
   ```

4. Inicia la aplicación:

   ```bash
   npm start
   ```

5. Abre `http://localhost:3000`.

## Seguridad de adjuntos implementada

- Subida por `multipart/form-data` al endpoint backend `/api/incidents`.
- Límite de tamaño configurable (`MAX_FILE_SIZE_BYTES`, por defecto 5MB).
- Validación estricta de tipo por MIME + firma binaria real (JPEG/PNG/WebP).
- Almacenamiento en proveedor S3 compatible con ACL `private`.
- No se envían ni guardan imágenes como Data URL en cliente.
- Registro de metadatos en SQLite (`incident_attachments`):
  - `storage_path`
  - `mime_type`
  - `size_bytes`
  - `checksum_sha256`
- Escaneo/limpieza básica: bloqueo de cabeceras no permitidas y checksum de trazabilidad.
- Mensajes de error claros en español para validaciones de usuario.

## Notas operativas recomendadas

- Mantener el bucket con acceso público bloqueado.
- Servir descargas de adjuntos solo mediante URLs firmadas y de corta duración (no implementado en esta iteración).
- Rotar claves de acceso S3 periódicamente.
