import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevForge — Software Development Agency",
  description:
    "DevForge is a senior-only software studio. Submit your project, track status, and watch ideas ship — React, Next.js, Firebase.",
  keywords: [
    "DevForge",
    "software agency",
    "React",
    "Next.js",
    "Firebase",
    "web development",
  ],
  icons: {
    icon: "https://res.cloudinary.com/dhd06wdov/image/upload/v1784282735/ChatGPT_Image_Jul_17_2026_05_03_17_PM_adkeeh.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-ink-950 text-ink-100 min-h-screen`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
