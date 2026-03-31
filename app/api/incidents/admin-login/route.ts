import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ADMIN_PASSWORD } from '@/lib/constants';

const adminSchema = z.object({
  password: z.string().min(1)
});

export async function POST(request: Request) {
  const body = await request.json();
  const result = adminSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ message: 'Solicitud inválida.' }, { status: 400 });
  }

  if (result.data.password !== ADMIN_PASSWORD) {
    return NextResponse.json({ message: 'Contraseña incorrecta.' }, { status: 401 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
