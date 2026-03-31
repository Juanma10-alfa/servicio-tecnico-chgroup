import { db } from '@/lib/db';

export type Role = 'admin' | 'support';

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  isActive: boolean;
};

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalizedEmail = email.trim().toLowerCase();

  const result = await db.query(
    `
      SELECT id, email, password_hash, role, is_active
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [normalizedEmail],
  );

  if (result.rowCount !== 1) {
    return null;
  }

  const row = result.rows[0];

  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    isActive: row.is_active,
  };
}
