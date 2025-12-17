import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cavendish GIG',
  description: 'Plataforma Cavendish GIG',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
