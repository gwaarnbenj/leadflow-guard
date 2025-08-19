import './globals.css';
export const metadata = {
  title: 'LeadFlow Guard',
  description: 'Lost-leads insurance for your website',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

