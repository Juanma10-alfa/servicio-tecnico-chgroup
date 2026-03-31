# Servicio Técnico CH GROUP

Este repositorio contiene la página web para que los huéspedes de CH GROUP puedan reportar incidencias en sus habitaciones o apartamentos.

## Uso

1. Abre el archivo `index.html` en tu navegador.
2. Selecciona el apartamento y la habitación correspondiente.
3. Describe la incidencia y envía el formulario.
4. Verás un mensaje de confirmación con el tiempo máximo de espera de dos días.

La web está optimizada para dispositivos móviles, por lo que se recomienda escanear el código QR disponible en cada habitación para acceder rápidamente al formulario.

## API interna de incidencias

Se añadió un endpoint interno `POST /api/public/incidents` (estilo Next.js Route Handler) con:

- Validación de payload con Zod (`category`, `severity`, `message`, `contact` opcional y `token` obligatorio).
- Generación de referencia en servidor (`INC-YYYYMMDD-#####`).
- Persistencia en una base de datos JSON local (`data/incidents-db.json`).
- Registro de estado inicial en `incident_status_history` con estado `NEW`.
- Protección anti-abuso básica: rate limiting por IP/token + honeypot (`website`) + cooldown (`submittedAt`).
