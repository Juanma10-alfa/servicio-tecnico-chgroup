export const APARTMENTS = [
  'Jacinto Aquenza',
  'Galicia',
  'Aragón',
  'Gaspar',
  'Marina Escalera 7',
  'Marina Escalera 9'
] as const;

export const ROOM_OPTIONS = ['HAB 1', 'HAB 2', 'HAB 3', 'HAB 4', 'HAB 5'] as const;

export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123';
