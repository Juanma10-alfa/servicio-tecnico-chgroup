import { createHash } from 'node:crypto';
import { z } from 'zod';

import { createIncident } from '../../../../lib/server/incidents-store';

const incidentPayloadSchema = z
  .object({
    category: z.string().trim().min(1).max(100),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    message: z.string().trim().min(5).max(2000),
    contact: z.string().trim().max(150).optional(),
    token: z.string().trim().min(8).max(128),
    website: z.string().optional(), // honeypot
    submittedAt: z.coerce.number().optional(), // anti-bot cooldown
  })
  .strict();

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_BY_IP = 15;
const RATE_LIMIT_BY_TOKEN = 8;
const SUBMISSION_COOLDOWN_MS = 5_000;

const requestLogByIp = new Map<string, number[]>();
const requestLogByToken = new Map<string, number[]>();

function cleanupAndCount(map: Map<string, number[]>, key: string, now: number): number {
  const entries = map.get(key) ?? [];
  const validEntries = entries.filter((ts) => now - ts <= RATE_LIMIT_WINDOW_MS);
  map.set(key, validEntries);
  return validEntries.length;
}

function registerHit(map: Map<string, number[]>, key: string, now: number): void {
  const entries = map.get(key) ?? [];
  entries.push(now);
  map.set(key, entries);
}

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return request.headers.get('x-real-ip') ?? '0.0.0.0';
}

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export async function POST(request: Request): Promise<Response> {
  const now = Date.now();
  const clientIp = getClientIp(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Payload JSON inválido.' }, { status: 400 });
  }

  const parsed = incidentPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: 'Validación fallida.',
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const { website, submittedAt, token, ...incidentInput } = parsed.data;

  if (website && website.trim().length > 0) {
    return Response.json({ error: 'Solicitud rechazada.' }, { status: 400 });
  }

  if (submittedAt && now - submittedAt < SUBMISSION_COOLDOWN_MS) {
    return Response.json(
      { error: 'Espera unos segundos antes de enviar la incidencia.' },
      { status: 429 },
    );
  }

  const tokenKey = hashToken(token);
  const ipCount = cleanupAndCount(requestLogByIp, clientIp, now);
  const tokenCount = cleanupAndCount(requestLogByToken, tokenKey, now);

  if (ipCount >= RATE_LIMIT_BY_IP || tokenCount >= RATE_LIMIT_BY_TOKEN) {
    return Response.json(
      {
        error: 'Demasiadas solicitudes. Inténtalo más tarde.',
        retryAfterSeconds: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)),
        },
      },
    );
  }

  registerHit(requestLogByIp, clientIp, now);
  registerHit(requestLogByToken, tokenKey, now);

  const { incident, initialStatus } = await createIncident({
    ...incidentInput,
    token,
    ip: clientIp,
  });

  return Response.json(
    {
      ok: true,
      incident: {
        id: incident.id,
        reference: incident.reference,
        status: initialStatus.status,
        createdAt: incident.createdAt,
      },
    },
    { status: 201 },
  );
}
