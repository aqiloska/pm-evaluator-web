import './globals.css';

export const metadata = {
  title: 'PM Evaluator',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body className="bg-slate-100 text-slate-900">
        {children}
      </body>
    </html>
  );
}