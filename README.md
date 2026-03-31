# Servicio Técnico CH GROUP (Next.js)

Aplicación migrada a **Next.js con App Router** para gestionar incidencias técnicas de forma mobile-first.

## Requisitos

- Node.js 20+
- npm 10+

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Estructura

- `app/`: rutas y API Routes (`app/api/*`).
- `components/`: componentes visuales reutilizables.
- `lib/`: constantes y tipos compartidos.
- `prisma/`: esquema inicial para persistencia.
- `public/`: estáticos públicos.

## Notas

- Tailwind usa compilación estándar con PostCSS (sin CDN en cliente).
- Lógica de validación/recepción se encuentra en `app/api/incidents/*`.
