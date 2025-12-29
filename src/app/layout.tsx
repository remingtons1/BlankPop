import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "BlankPop - Start blank. Make it yours.",
  description: "Design custom merchandise with AI in ChatGPT. Create unique t-shirts, hoodies, and more—then buy instantly without leaving the chat.",
  keywords: ["custom merchandise", "AI design", "print on demand", "ChatGPT", "custom t-shirts"],
  openGraph: {
    title: "BlankPop - Start blank. Make it yours.",
    description: "Design custom merchandise with AI in ChatGPT. Create unique t-shirts, hoodies, and more.",
    url: "https://blankpop.online",
    siteName: "BlankPop",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BlankPop - Start blank. Make it yours.",
    description: "Design custom merchandise with AI in ChatGPT.",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
