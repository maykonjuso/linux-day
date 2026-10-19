import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Linux Day Arena',
  description: 'Workshop gamificado de Linux: slides, quiz e terminal no mesmo lugar.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
