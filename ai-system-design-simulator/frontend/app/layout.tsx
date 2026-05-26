import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import TopNav from "./components/top-nav";
import Providers from "./providers";
import Background3D from "../components/Background3D";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
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
        className={`${spaceGrotesk.variable} ${fraunces.variable} antialiased`}
      >
        <Background3D />
        <Providers>
          <div className="min-h-screen">
            <TopNav />
            <div className="pt-20">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
