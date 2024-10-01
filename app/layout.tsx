import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Head from "next/head";
import "./globals.css";

const jetbrains = JetBrains_Mono({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <title>Smit Devrukhkar</title>
      <link rel="icon" href="/favicon.ico" />
      <meta name="description" content="Smit Devrukhkar's personal website" />
      <body className={jetbrains.className}>{children}</body>
    </html>
  );
}
