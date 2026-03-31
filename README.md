# Servicio Técnico CH GROUP

Proyecto migrado a Next.js (App Router) con autenticación administrativa usando Auth.js/NextAuth.

## Requisitos

- Node.js 20+
- PostgreSQL

## Variables de entorno

Crea un archivo `.env.local` con:

```bash
DATABASE_URL=postgres://usuario:password@localhost:5432/servicio_tecnico
AUTH_SECRET=tu_secreto_largo_y_aleatorio
AUTH_URL=http://localhost:3000
ADMIN_EMAIL=admin@chgroup.com
ADMIN_PASSWORD=TuPasswordSegura123
```

## Configuración inicial

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Ejecuta el schema SQL en tu base de datos usando `db/schema.sql`.
3. Crea o actualiza el usuario administrador:
   ```bash
   npm run seed:admin
   ```
4. Levanta el servidor:
   ```bash
   npm run dev
   ```

## Acceso administrativo

- Login: `/admin/login`
- Panel: `/admin`
- Todas las rutas `/admin/*` requieren sesión server-side con rol `admin`.

## Seguridad implementada

- Login con proveedor `Credentials` de Auth.js.
- Contraseñas persistidas en tabla `users` con hash `bcrypt`.
- Verificación de sesión en `middleware` y guardas server-side en layout/páginas.
- Mensajes de error de autenticación genéricos en español.
- Sin secretos ni validaciones de contraseña en cliente.
