export type TokenStatus = 'valid' | 'invalid' | 'inactive' | 'expired';

export type PublicRoomContext = {
  status: TokenStatus;
  message?: string;
  roomPublicLinkId?: string;
  roomToken?: string;
  apartmentCode?: string;
  apartmentName?: string;
  roomCode?: string;
  roomName?: string;
};

type RoomPublicLinkRow = {
  id: string;
  token: string;
  is_active: boolean;
  expires_at: string | null;
  apartment_code: string | null;
  apartment_name: string | null;
  room_code: string | null;
  room_name: string | null;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function parseExpiryDate(rawValue: string | null): Date | null {
  if (!rawValue) return null;
  const date = new Date(rawValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toPublicContext(row: RoomPublicLinkRow): PublicRoomContext {
  const expiresAt = parseExpiryDate(row.expires_at);

  if (!row.is_active) {
    return {
      status: 'inactive',
      message:
        'Este enlace ha sido desactivado. Contacta con recepción para solicitar un nuevo código QR.',
    };
  }

  if (expiresAt && expiresAt.getTime() < Date.now()) {
    return {
      status: 'expired',
      message:
        'Este enlace ha caducado. Contacta con recepción para solicitar un nuevo código QR.',
    };
  }

  return {
    status: 'valid',
    roomPublicLinkId: row.id,
    roomToken: row.token,
    apartmentCode: row.apartment_code ?? undefined,
    apartmentName: row.apartment_name ?? undefined,
    roomCode: row.room_code ?? undefined,
    roomName: row.room_name ?? undefined,
  };
}

export async function getPublicRoomContext(roomToken: string): Promise<PublicRoomContext> {
  if (!roomToken?.trim()) {
    return {
      status: 'invalid',
      message: 'Enlace no válido. Revisa el código QR o solicita uno nuevo en recepción.',
    };
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return {
      status: 'invalid',
      message:
        'No se pudo validar el enlace en este momento. Inténtalo de nuevo en unos minutos.',
    };
  }

  const endpoint = new URL('/rest/v1/room_public_links', SUPABASE_URL);
  endpoint.searchParams.set(
    'select',
    'id,token,is_active,expires_at,apartment_code,apartment_name,room_code,room_name',
  );
  endpoint.searchParams.set('token', `eq.${roomToken}`);
  endpoint.searchParams.set('limit', '1');

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return {
      status: 'invalid',
      message: 'No fue posible validar el enlace. Inténtalo de nuevo más tarde.',
    };
  }

  const rows = (await response.json()) as RoomPublicLinkRow[];
  const row = rows[0];

  if (!row) {
    return {
      status: 'invalid',
      message: 'No encontramos esta habitación. Verifica el QR o solicita asistencia.',
    };
  }

  return toPublicContext(row);
}
