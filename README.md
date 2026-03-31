# Servicio Técnico CH GROUP

Este repositorio contiene la web de incidencias y ahora también un backend para gestionar enlaces públicos por habitación con rotación de token y generación de QR.

## Requisitos

- Node.js 18+

## Ejecutar

```bash
npm install
npm start
```

Servidor por defecto en `http://localhost:3000`.

## Seguridad de links públicos

- Tokens criptográficamente seguros con `crypto.randomBytes(16)` (128 bits).
- Ninguna ruta pública usa IDs secuenciales internos.
- Rotación de token con invalidación inmediata de links previos.

## Modelo `room_public_links`

Campos:

- `status` (`active` / `inactive`)
- `version`
- `created_at`
- `updated_at`
- `revoked_at`

## Endpoints principales

### Crear habitación (genera token inicial activo)

```http
POST /admin/rooms
Content-Type: application/json

{
  "apartmentName": "Galicia",
  "roomName": "HAB 1"
}
```

### Crear un nuevo link público para habitación

```http
POST /admin/public-links
Content-Type: application/json

{
  "roomPublicId": "<id-publico-no-secuencial>"
}
```

### Regenerar token e invalidar links activos previos

```http
POST /admin/public-links/:roomPublicId/regenerate
```

### Listar habitaciones + URL pública + descargas QR

```http
GET /admin/qr
```

UI simple:

```http
GET /admin/qr/ui
```

### Descargar QR

```http
GET /admin/qr/:token.png
GET /admin/qr/:token.svg
```

### Ruta pública de habitación (sin IDs internos)

```http
GET /r/:token
```
