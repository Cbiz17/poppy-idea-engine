import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DevButton } from "@/components/dev/DevPanel";
import { DevToolsInitializer } from "@/components/dev/DevToolsInitializer";
import { ErrorBoundary } from "@/lib/monitoring/error-boundary";

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
          <DevToolsInitializer />
          {children}
          {process.env.NODE_ENV === 'development' && <DevButton />}
        </ErrorBoundary>
      </body>
    </html>
  );
}