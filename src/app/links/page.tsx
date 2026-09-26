import type { Metadata } from "next";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { getAutosConBaja } from "@/lib/autos";
import {
  DIRECCION,
  INSTAGRAM_URL,
  MAPS_COMO_LLEGAR,
  TIKTOK_URL,
  WHATSAPP_CONSIGNAS,
  YOUTUBE_URL,
} from "@/lib/config";
import { linkWhatsapp } from "@/lib/whatsapp";
import { InstagramIcon, TikTokIcon, YoutubeIcon } from "@/components/icons/social-icons";
import { TrackAlMontar } from "@/components/tracking/track-al-montar";

// /links: la página de la bio de Instagram y TikTok (reemplaza al Linktree).
// Sin el marco del sitio (layout: OcultarEn), links <a> puros (anda sin JS) y
// fuera de Google: noindex y fuera del sitemap.

export const metadata: Metadata = {
  title: { absolute: "Titus Cars · Links" },
  description: "WhatsApp, catálogo y redes de Titus Cars, autos usados en Córdoba.",
  robots: { index: false, follow: true },
};

const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

export default async function LinksPage({ searchParams }: PageProps<"/links">) {
  const sp = await searchParams;
  const conBaja = await getAutosConBaja(2);

  // Los links internos conservan los utm_* con que se llegó (?utm_source=instagram
  // o tiktok), así la visita al catálogo sigue atribuida a la red.
  const utm = new URLSearchParams();
  for (const k of UTM) {
    const v = Array.isArray(sp[k]) ? sp[k][0] : sp[k];
    if (v) utm.set(k, v.slice(0, 150));
  }
  const interno = (ruta: string) => {
    if (utm.size === 0) return ruta;
    return `${ruta}${ruta.includes("?") ? "&" : "?"}${utm.toString()}`;
  };

  const botones: { texto: string; href: string; externo?: boolean }[] = [
    { texto: "Quiero comprar un auto", href: linkWhatsapp("Hola! Quiero comprar un auto."), externo: true },
    {
      texto: "Quiero vender / consignar mi auto",
      href: linkWhatsapp("Hola! Quiero vender mi auto.", WHATSAPP_CONSIGNAS),
      externo: true,
    },
    { texto: "Ver catálogo", href: interno("/autos") },
    ...(conBaja.length >= 2 ? [{ texto: "Bajaron de precio", href: interno("/autos?baja=1") }] : []),
    { texto: "Consigná tu auto", href: interno("/consigna") },
  ];

  const redes = [
    { label: "Instagram", href: INSTAGRAM_URL, icono: <InstagramIcon className="h-5 w-5" /> },
    { label: "TikTok", href: TIKTOK_URL, icono: <TikTokIcon className="h-5 w-5" /> },
    { label: "YouTube", href: YOUTUBE_URL, icono: <YoutubeIcon className="h-5 w-5" /> },
    { label: "Cómo llegar (Google Maps)", href: MAPS_COMO_LLEGAR, icono: <MapPin className="h-5 w-5" /> },
  ];

  return (
    <div className="flex min-h-dvh flex-col items-center bg-brand-light px-4 pb-10 pt-10">
      <TrackAlMontar tipo="vista_catalogo" />
      <div className="w-full max-w-md">
        <header className="flex flex-col items-center text-center">
          <Image
            src="/brand/logo-horizontal.svg"
            alt="Titus Cars"
            width={200}
            height={58}
            loading="eager"
            className="h-12 w-auto"
          />
          <h1 className="mt-4 text-base font-semibold text-foreground/80">
            Titus Cars · Autos usados en Córdoba
          </h1>
        </header>

        <nav aria-label="Links de Titus Cars" className="mt-8 flex flex-col gap-3">
          {botones.map((b) => (
            <a
              key={b.texto}
              href={b.href}
              {...(b.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="flex min-h-14 w-full items-center justify-center rounded-xl bg-brand px-4 py-3 text-center text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark active:bg-brand-dark"
            >
              {b.texto}
            </a>
          ))}
        </nav>

        <div className="mt-8 flex items-center justify-center gap-3">
          {redes.map((r) => (
            <a
              key={r.label}
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={r.label}
              title={r.label}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-foreground/80 shadow-sm transition-colors hover:text-brand"
            >
              {r.icono}
            </a>
          ))}
        </div>
        <a
          href={MAPS_COMO_LLEGAR}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block text-center text-sm text-muted-foreground underline-offset-2 hover:underline"
        >
          {DIRECCION}
        </a>
      </div>
    </div>
  );
}
