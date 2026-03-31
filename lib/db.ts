import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('Falta configurar DATABASE_URL');
}

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});
