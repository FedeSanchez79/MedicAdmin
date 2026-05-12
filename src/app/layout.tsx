import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MedicAdmin',
  description: 'Panel de administración para MedicData y MedicProfessionals',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
