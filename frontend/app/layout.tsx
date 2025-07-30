import type { Metadata } from "next";
import { Poppins, Open_Sans } from "next/font/google";
import "./globals.css";
import NavBar from "./NavBar";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-title",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-text",
});

export const metadata: Metadata = {
  title: "Driv'n Cook - Gestion des Franchisés",
  description: "Application de gestion des franchisés Driv'n Cook",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${poppins.variable} ${openSans.variable}`}>
        <NavBar />
        {children}
      </body>
    </html>
  );
} 