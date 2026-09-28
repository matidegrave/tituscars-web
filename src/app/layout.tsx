import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ResenasBanner } from "@/components/resenas-banner";
import { WhatsappFloatingButton } from "@/components/whatsapp-floating-button";
import { OcultarEn } from "@/components/ocultar-en";
import { VersionGuard } from "@/components/version-guard";
import { MetaPixel } from "@/components/tracking/meta-pixel";
import { ModoEquipo } from "@/components/modo-equipo";
import { WhatsappEnApps } from "@/components/whatsapp-en-apps";
import { TransicionFicha } from "@/components/catalogo/transicion-ficha";
import { COOKIE_EQUIPO } from "@/lib/equipo";
import { SCRIPT_REPORTE_ERRORES } from "@/lib/reporte-errores-script";
import { PIXEL_ID, SNIPPET_PIXEL } from "@/lib/tracking";
import { SITE_URL } from "@/lib/config";

// Una sola fuente (Geist, la de todo el texto), con swap y preload. Geist Mono
// se sacó: no la usaba ningún elemento y se precargaba igual en cada página.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const nombreSitio = process.env.NEXT_PUBLIC_SITE_NAME ?? "Titus Cars";

const titulo = `${nombreSitio} — Autos usados y 0km en Córdoba`;
const descripcion =
  "Catálogo de autos usados y 0km en Córdoba. Peritados, con garantía y consigna virtual.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: titulo,
  description: descripcion,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png" }],
  },
  openGraph: {
    title: titulo,
    description: descripcion,
    type: "website",
    images: [{ url: "/brand/logo-horizontal@2x.png" }],
  },
};

// El Pixel va sólo en el deploy de producción (en local y en los previews, no);
// además el snippet se autolimita al host tituscars.com.
const RUTAS_SIN_MARCO = ["/links"];

const pixelDeProduccion = Boolean(PIXEL_ID) && process.env.VERCEL_ENV === "production";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Con la marca de equipo (lib/equipo.ts) no va el Pixel. El snippet igual lo
  // vuelve a chequear en el navegador (cookie o respaldo en localStorage).
  const equipo = (await cookies()).get(COOKIE_EQUIPO)?.value === "1";
  const pixelActivo = pixelDeProduccion && !equipo;
  return (
    <html
      lang="es"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <head>
        {/* Primero de todo, en ES5: registra errores aunque el bundle no corra. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_REPORTE_ERRORES }} />
        {/* Meta Pixel: la cola (fbq) existe antes de la hidratación; la librería
            se descarga recién después del load, sin competir con la foto. */}
        {pixelActivo && <script dangerouslySetInnerHTML={{ __html: SNIPPET_PIXEL(PIXEL_ID) }} />}
      </head>
      <body className="flex min-h-full flex-col">
        {/* /links (bio de Instagram/TikTok) va sola, sin el marco del sitio. */}
        <OcultarEn rutas={RUTAS_SIN_MARCO}>
          <SiteHeader />
        </OcultarEn>
        <main className="flex-1">{children}</main>
        <OcultarEn rutas={RUTAS_SIN_MARCO}>
          <ResenasBanner />
          <SiteFooter />
          <WhatsappFloatingButton />
        </OcultarEn>
        <VersionGuard />
        <MetaPixel />
        <WhatsappEnApps />
        <TransicionFicha />
        <ModoEquipo />
        {pixelActivo && (
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              alt=""
              src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
            />
          </noscript>
        )}
      </body>
    </html>
  );
}
