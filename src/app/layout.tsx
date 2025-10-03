import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import DesktopNavbar from "@/components/DesktopNavbar";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Toolbox — Convert & Compress",
    template: "%s — Toolbox",
  },
  description: "Free tools to convert between formats and compress files: images, documents, video, and audio.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Toolbox — Convert & Compress",
    description: "Free tools to convert between formats and compress files: images, documents, video, and audio.",
    url: siteUrl,
    siteName: "Toolbox",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Toolbox - Convert & Compress",
    description: "Free tools to convert between formats and compress files.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white min-h-screen flex flex-col`}
        suppressHydrationWarning={true}
      >
        {/* Mobile Navbar */}
        <Navbar />
        {/* Desktop Navbar */}
        <DesktopNavbar />
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
