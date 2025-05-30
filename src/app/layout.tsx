import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DevButton } from "@/components/dev/DevPanel";
import { ErrorBoundary } from "@/lib/monitoring/error-boundary";
import '@/lib/suppress-devtools-errors';

// Initialize monitoring tools in development
if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    import('@/lib/monitoring/network');
    import('@/lib/monitoring/performance');
    import('@/lib/monitoring/browser-devtools').then(({ initBrowserDevTools }) => {
      initBrowserDevTools();
    });
  }
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Poppy Idea Engine",
  description: "Transform thoughts into tangible concepts with AI-powered idea development",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          {children}
          <DevButton />
        </ErrorBoundary>
      </body>
    </html>
  );
}
