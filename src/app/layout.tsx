import { Outfit } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import ConditionalAuthGuard from '@/components/ConditionalAuthGuard';

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <SidebarProvider>
            <ConditionalAuthGuard>
              {children}
            </ConditionalAuthGuard>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
