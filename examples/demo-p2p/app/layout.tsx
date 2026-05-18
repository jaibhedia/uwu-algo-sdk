import "./globals.css";
import { Inter } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata = {
  title: "uWu SDK · Demo P2P",
  description:
    "Minimal P2P-style demo of @uwu-protocol/checkout — pay INR, get an on-chain proof on Algorand.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      style={{
        ["--font-sans" as string]: inter.style.fontFamily,
        ["--font-display" as string]: GeistSans.style.fontFamily,
        ["--font-mono" as string]: GeistMono.style.fontFamily,
      }}
      className={`${inter.variable} ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body>
        <div className="bg-grid" aria-hidden />
        <div className="bg-atmosphere" aria-hidden />
        {children}
      </body>
    </html>
  );
}
