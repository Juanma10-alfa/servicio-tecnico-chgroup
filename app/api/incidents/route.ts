import { NextResponse } from 'next/server';
import { z } from 'zod';

const incidentSchema = z.object({
  guestName: z.string().min(3, 'El nombre es obligatorio.'),
  guestEmail: z.string().email('Correo electrónico inválido.'),
  guestPhone: z.string().regex(/^\d{9}$/, 'Teléfono inválido, usa 9 dígitos.'),
  preferredContact: z.enum(['whatsapp', 'email']),
  availability: z.array(z.string()).min(1, 'Selecciona al menos una franja horaria.'),
  apartment: z.string().min(1, 'Selecciona un apartamento.'),
  room: z.string().min(1, 'Selecciona una habitación.'),
  incident: z.string().min(10, 'Describe la incidencia con más detalle.')
});

export async function POST(request: Request) {
  const body = await request.json();
  const result = incidentSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0]?.message ?? 'Datos inválidos.' },
      { status: 400 }
    );
  }

  const reference = `INC-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;

  return NextResponse.json(
    {
      message: 'Incidencia registrada correctamente.',
      reference
    },
    { status: 201 }
  );
}
