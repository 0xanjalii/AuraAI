import type { Metadata } from "next";
import { Inter } from "next/font/google";
import VoiceProviderWrapper from "@/components/VoiceProviderWrapper";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aura — Voice-Controlled Project Management",
  description: "A fully voice-controlled project board inspired by Linear and powered by ElevenLabs voice AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col font-sans bg-canvas text-text-primary antialiased">
        <VoiceProviderWrapper>
          {children}
        </VoiceProviderWrapper>
      </body>
    </html>
  );
}
