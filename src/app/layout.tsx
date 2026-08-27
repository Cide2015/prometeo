import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prometeo | Inteligencia de Licitaciones Públicas y Privadas",
  description:
    "Automatiza la prospección, análisis de viabilidad técnica y financiera, estructuración documental de propuestas y control financiero de procesos licitatorios en SECOP II, TVEC y el sector corporativo privado con agentes de IA.",
  authors: [{ name: "CIDE SAS" }],
  openGraph: {
    title: "Prometeo | Inteligencia de Licitaciones Públicas y Privadas",
    description:
      "SaaS multi-tenant con agentes de IA para SECOP II, TVEC y sector corporativo privado.",
    locale: "es_LA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
