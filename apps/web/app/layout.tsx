import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '../providers/QueryProvider';
import { ToastProvider } from '../providers/ToastProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BugSnap - Visual Bug Capture & Feedback Tool',
  description:
    'Visual bug capture and feedback tool that lets teams report website issues directly on the page where they occur.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          {children}
          <ToastProvider />
        </QueryProvider>
      </body>
    </html>
  );
}
