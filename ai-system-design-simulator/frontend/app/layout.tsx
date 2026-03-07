import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import TopNav from "./components/top-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SysArena",
  description: "AI system design interview simulator",
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
        <div className="min-h-screen">
          <TopNav />
          <div className="pt-20">{children}</div>
        </div>
      </body>
    </html>
  );
}
