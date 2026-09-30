import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Geometria Analítica Dojo',
  description:
    'Conceito primeiro. Conta depois. Seu treino de geometria com tutor e ledger locais.',
  robots: { index: false, follow: false },
  icons: { icon: '/favicon.svg' },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='pt-BR'>
      <body>{children}</body>
    </html>
  );
}
