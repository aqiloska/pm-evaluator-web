import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PM Evaluator',
  description: 'Project manager selection and evaluation framework',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans text-slate-900 antialiased">{children}</body>
    </html>
  );
}
