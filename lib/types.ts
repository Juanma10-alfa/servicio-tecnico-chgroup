export type PreferredContact = 'whatsapp' | 'email';

export interface IncidentPayload {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  preferredContact: PreferredContact;
  availability: string[];
  apartment: string;
  room: string;
  incident: string;
  photoBase64?: string;
}
