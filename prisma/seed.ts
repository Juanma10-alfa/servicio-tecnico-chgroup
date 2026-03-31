import { PrismaClient, IncidentStatus, Severity } from '@prisma/client';
import { randomBytes } from 'node:crypto';

const prisma = new PrismaClient();

function secureToken(prefix: string) {
  return `${prefix}_${randomBytes(24).toString('hex')}`;
}

async function main() {
  const [manager, technician] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'manager@chgroup.com' },
      update: { fullName: 'Marta López', role: 'MANAGER' },
      create: {
        email: 'manager@chgroup.com',
        fullName: 'Marta López',
        role: 'MANAGER',
      },
    }),
    prisma.user.upsert({
      where: { email: 'tecnico@chgroup.com' },
      update: { fullName: 'Diego Pérez', role: 'TECHNICIAN' },
      create: {
        email: 'tecnico@chgroup.com',
        fullName: 'Diego Pérez',
        role: 'TECHNICIAN',
      },
    }),
  ]);

  const apartment = await prisma.apartment.upsert({
    where: { internalCode: 'CH-MAD-001' },
    update: {
      name: 'CH Atocha Central',
      address: 'Calle de Atocha 48, Madrid',
    },
    create: {
      internalCode: 'CH-MAD-001',
      name: 'CH Atocha Central',
      address: 'Calle de Atocha 48, Madrid',
    },
  });

  const room101 = await prisma.room.upsert({
    where: {
      apartmentId_number: {
        apartmentId: apartment.id,
        number: '101',
      },
    },
    update: { name: 'Suite Interior 101' },
    create: {
      apartmentId: apartment.id,
      number: '101',
      name: 'Suite Interior 101',
    },
  });

  const room102 = await prisma.room.upsert({
    where: {
      apartmentId_number: {
        apartmentId: apartment.id,
        number: '102',
      },
    },
    update: { name: 'Suite Exterior 102' },
    create: {
      apartmentId: apartment.id,
      number: '102',
      name: 'Suite Exterior 102',
    },
  });

  const [link101, link102] = await Promise.all([
    prisma.roomPublicLink.upsert({
      where: { token: 'seed_room101_token' },
      update: { isActive: true },
      create: {
        roomId: room101.id,
        token: 'seed_room101_token',
        isActive: true,
      },
    }),
    prisma.roomPublicLink.upsert({
      where: { token: 'seed_room102_token' },
      update: { isActive: true },
      create: {
        roomId: room102.id,
        token: 'seed_room102_token',
        isActive: true,
      },
    }),
  ]);

  await prisma.roomPublicLink.create({
    data: {
      roomId: room101.id,
      token: secureToken('room101'),
      isActive: true,
    },
  });

  const incident = await prisma.incident.create({
    data: {
      roomId: room101.id,
      publicLinkId: link101.id,
      reportedByUserId: manager.id,
      assignedToUserId: technician.id,
      category: 'Fontanería',
      guestMessage: 'La ducha pierde agua por la base y moja todo el baño.',
      guestContact: '+34 600 123 456',
      internalNotes: 'Revisar junta de goma y posible recambio del sifón.',
      severity: Severity.HIGH,
      status: IncidentStatus.IN_PROGRESS,
      acknowledgedAt: new Date(),
      startedAt: new Date(),
    },
  });

  await prisma.incidentComment.createMany({
    data: [
      {
        incidentId: incident.id,
        authorId: manager.id,
        message: 'Huésped en la habitación hasta las 18:00. Coordinar visita antes.',
        isInternal: true,
      },
      {
        incidentId: incident.id,
        authorId: technician.id,
        message: 'Solicitado recambio, pendiente llegada de proveedor.',
        isInternal: true,
      },
    ],
  });

  await prisma.incidentStatusHistory.createMany({
    data: [
      {
        incidentId: incident.id,
        fromStatus: null,
        toStatus: IncidentStatus.NEW,
        changedByUserId: manager.id,
        note: 'Incidencia creada desde enlace público de habitación.',
      },
      {
        incidentId: incident.id,
        fromStatus: IncidentStatus.NEW,
        toStatus: IncidentStatus.IN_REVIEW,
        changedByUserId: manager.id,
        note: 'Recepción validó el reporte del huésped.',
      },
      {
        incidentId: incident.id,
        fromStatus: IncidentStatus.IN_REVIEW,
        toStatus: IncidentStatus.IN_PROGRESS,
        changedByUserId: technician.id,
        note: 'Técnico asignado y visita iniciada.',
      },
    ],
  });

  await prisma.incidentAttachment.create({
    data: {
      incidentId: incident.id,
      uploadedByUserId: technician.id,
      fileName: 'ducha-fuga-101.jpg',
      fileUrl: 'https://cdn.example.com/incidents/ducha-fuga-101.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 281043,
    },
  });

  await prisma.incident.create({
    data: {
      roomId: room102.id,
      publicLinkId: link102.id,
      category: 'Climatización',
      guestMessage: 'El aire acondicionado no enfría correctamente.',
      guestContact: 'guest.room102@example.com',
      severity: Severity.MEDIUM,
      status: IncidentStatus.NEW,
      internalNotes: 'Esperando revisión inicial.',
    },
  });

  console.log('Seed completed successfully.');
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
