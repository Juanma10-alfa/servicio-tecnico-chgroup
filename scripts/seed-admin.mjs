import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Pool } = pg;

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const role = process.env.ADMIN_ROLE ?? 'admin';
const connectionString = process.env.DATABASE_URL;

if (!email || !password || !connectionString) {
  throw new Error('Debes definir DATABASE_URL, ADMIN_EMAIL y ADMIN_PASSWORD');
}

const pool = new Pool({ connectionString });
const hash = await bcrypt.hash(password, 12);

await pool.query(
  `
  INSERT INTO users (email, password_hash, role, is_active)
  VALUES ($1, $2, $3, true)
  ON CONFLICT (email)
  DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, is_active = true, updated_at = NOW()
`,
  [email.toLowerCase(), hash, role],
);

await pool.end();
console.log(`Usuario ${email} actualizado correctamente.`);
