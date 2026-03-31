import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'incidents-db.json');

type IncidentStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface IncidentRecord {
  id: string;
  reference: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  contact: string | null;
  token: string;
  createdAt: string;
  createdFromIp: string;
}

export interface IncidentStatusHistoryRecord {
  id: string;
  incidentId: string;
  status: IncidentStatus;
  note: string;
  createdAt: string;
}

interface IncidentDatabase {
  incidents: IncidentRecord[];
  incident_status_history: IncidentStatusHistoryRecord[];
}

const DEFAULT_DB: IncidentDatabase = {
  incidents: [],
  incident_status_history: [],
};

async function ensureDbFile(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(DB_PATH, 'utf8');
  } catch {
    await writeFile(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), 'utf8');
  }
}

async function readDb(): Promise<IncidentDatabase> {
  await ensureDbFile();
  const raw = await readFile(DB_PATH, 'utf8');

  try {
    return JSON.parse(raw) as IncidentDatabase;
  } catch {
    return structuredClone(DEFAULT_DB);
  }
}

async function writeDb(db: IncidentDatabase): Promise<void> {
  await ensureDbFile();
  await writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

function buildIncidentReference(now: Date): string {
  const yyyymmdd = now.toISOString().slice(0, 10).replaceAll('-', '');
  const suffix = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');

  return `INC-${yyyymmdd}-${suffix}`;
}

export async function createIncident(input: {
  category: string;
  severity: IncidentRecord['severity'];
  message: string;
  contact?: string;
  token: string;
  ip: string;
}): Promise<{ incident: IncidentRecord; initialStatus: IncidentStatusHistoryRecord }> {
  const now = new Date();
  const db = await readDb();

  const incident: IncidentRecord = {
    id: randomUUID(),
    reference: buildIncidentReference(now),
    category: input.category,
    severity: input.severity,
    message: input.message,
    contact: input.contact?.trim() ? input.contact.trim() : null,
    token: input.token,
    createdAt: now.toISOString(),
    createdFromIp: input.ip,
  };

  const initialStatus: IncidentStatusHistoryRecord = {
    id: randomUUID(),
    incidentId: incident.id,
    status: 'NEW',
    note: 'Incidencia creada desde endpoint público.',
    createdAt: now.toISOString(),
  };

  db.incidents.push(incident);
  db.incident_status_history.push(initialStatus);
  await writeDb(db);

  return { incident, initialStatus };
}
