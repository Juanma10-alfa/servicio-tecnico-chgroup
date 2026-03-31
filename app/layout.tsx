import type { Metadata } from 'next';
import { Montserrat, Pacifico } from 'next/font/google';
import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat'
});

const pacifico = Pacifico({
  subsets: ['latin'],
  variable: '--font-pacifico',
  weight: '400'
});

export const metadata: Metadata = {
  title: 'Servicio Técnico CH GROUP',
  description: 'Reporte móvil de incidencias técnicas para apartamentos CH GROUP'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${montserrat.variable} ${pacifico.variable} font-sans`}>{children}</body>
    </html>
  );
}
