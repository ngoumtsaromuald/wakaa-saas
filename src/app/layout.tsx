
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Wakaa - Plateforme SaaS pour Micro-Entrepreneurs",
  description: "Transformez la gestion chaotique des commandes WhatsApp en un système structuré et automatisé",
  keywords: "WhatsApp, commandes, micro-entrepreneurs, Cameroun, SaaS, paiements mobiles",
  authors: [{ name: "Wakaa Team" }],
  openGraph: {
    title: "Wakaa - Plateforme SaaS pour Micro-Entrepreneurs",
    description: "Transformez la gestion chaotique des commandes WhatsApp en un système structuré et automatisé",
    type: "website",
    locale: "fr_FR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
            <SonnerToaster position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
