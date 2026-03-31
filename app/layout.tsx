import type { Metadata } from 'next';
import './styles.css';

export const metadata: Metadata = {
  title: 'Servicio Técnico CH GROUP',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
