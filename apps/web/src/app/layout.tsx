import type { Metadata } from "next";
import { platformConfig } from "../../../../packages/config/src/platform";
import { ConsentBanner } from "../components/consent-banner";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: platformConfig.name, template: `%s — ${platformConfig.name}` },
  description: platformConfig.tagline,
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <ConsentBanner />
      </body>
    </html>
  );
}
