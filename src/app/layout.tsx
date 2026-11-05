import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TP2 - Gestion des rôles",
  description: "Next.js + Prisma : rôles et contrôle d'accès",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
