// File: apps/web/app/layout.tsx
// Description: Root layout with font optimization, metadata, and global providers
// Why: Provides consistent HTML structure, optimized fonts, and global context for all pages
// RELEVANT FILES: apps/web/app/providers.tsx, apps/web/app/globals.css

import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap", // Prevents FOIT (Flash of Invisible Text)
  preload: true,
});

export const metadata: Metadata = {
  title: "CE FirstTouch - Welcome First-Time Visitors",
  description:
    "A warm welcome platform connecting first-time visitors with our church community. Register to let us know you're here!",
  keywords: ["church", "first-time visitors", "welcome", "community"],
  authors: [{ name: "CE FirstTouch" }],
  openGraph: {
    title: "CE FirstTouch - Welcome First-Time Visitors",
    description:
      "A warm welcome platform connecting first-time visitors with our church community.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
