import type { Metadata } from "next";
import "@/app/globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getBaseUrl } from "@/lib/seo";
import { GoogleConsentDefaults } from "@/components/analytics/GoogleConsentDefaults";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { CookieConsentBanner } from "@/components/privacy/CookieConsentBanner";

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Mapa do Ativo | Do ativo ao patrimônio",
    template: "%s | Mapa do Ativo"
  },
  description:
    "Analise ações e FIIs, compare indicadores, simule cenários e organize sua carteira com clareza.",
  keywords: [
    "ações brasileiras",
    "cotação de ações",
    "indicadores fundamentalistas",
    "dividend yield",
    "P/L",
    "P/VP",
    "ROE",
    "fundamentos de ações",
    "fundos imobiliários",
    "FIIs"
  ],
  applicationName: "Mapa do Ativo",
  authors: [{ name: "Mapa do Ativo" }],
  creator: "Mapa do Ativo",
  publisher: "Mapa do Ativo",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"]
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Mapa do Ativo",
    description: "Do ativo ao patrimônio: dados para analisar ativos e ferramentas para acompanhar carteira.",
    url: baseUrl,
    siteName: "Mapa do Ativo",
    locale: "pt_BR",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Mapa do Ativo",
    description: "Do ativo ao patrimônio: dados para analisar ativos e ferramentas para acompanhar carteira."
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1
    }
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="pt-BR">
      <head>
        <GoogleConsentDefaults />
      </head>
      <body className="min-h-screen antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
        <GoogleAnalytics measurementId={measurementId} />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
