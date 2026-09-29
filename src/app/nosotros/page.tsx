import type { Metadata } from "next";
import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { InstagramIcon, YoutubeIcon, TikTokIcon } from "@/components/icons/social-icons";
import { WhatsappIcon } from "@/components/icons/whatsapp-icon";
import { ReelEmbed } from "@/components/nosotros/reel-embed";
import { getTotalEnStock } from "@/lib/autos";
import {
  AUTOS_VENDIDOS,
  DIRECCION,
  GOOGLE_PUNTAJE,
  HORARIOS,
  INSTAGRAM_URL,
  MAPS_COMO_LLEGAR,
  SITE_URL,
  TIKTOK_URL,
  YOUTUBE_URL,
} from "@/lib/config";
import { DIVERSION, HISTORIA, type VideoInstagram } from "@/lib/historia";
import { linkWhatsapp } from "@/lib/whatsapp";

// /nosotros (tanda 44): la historia de Titus en una línea de tiempo con sus
// reels de Instagram, que se ven dentro de la página (ReelEmbed: fachada
// liviana, el iframe recién al tocar). Conserva el texto de "Quiénes somos",
// los números y las redes de la versión anterior.

export const metadata: Metadata = {
  alternates: { canonical: `${SITE_URL}/nosotros` },
  title: "Nosotros | Titus Cars",
  description:
    "La historia de Titus Cars: desde el primer auto que compramos hasta nuestro local en Av. Duarte Quirós 3996, Córdoba. Autos usados peritados y consigna virtual.",
};

export const revalidate = 60;

/** 1 video: solo. 2 o más: fila horizontal con scroll-snap (sin librerías). */
function Videos({ videos, fecha }: { videos: VideoInstagram[]; fecha?: string }) {
  if (videos.length === 1) return <ReelEmbed video={videos[0]} fecha={fecha} className="mt-4" />;
  return (
    <div className="-mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2">
      {videos.map((v) => (
        <div key={v.id} className="w-[78%] max-w-[300px] shrink-0 snap-start">
          <ReelEmbed video={v} fecha={fecha} />
        </div>
      ))}
    </div>
  );
}

export default async function NosotrosPage() {
  const enStock = await getTotalEnStock();

  const numeros = [
    { valor: `+${AUTOS_VENDIDOS}`, label: "Autos vendidos" },
    { valor: GOOGLE_PUNTAJE, label: "En Google" },
    { valor: `${enStock}`, label: "Autos en stock" },
  ];

  const redes = [
    { href: INSTAGRAM_URL, label: "Instagram", Icono: InstagramIcon },
    { href: TIKTOK_URL, label: "TikTok", Icono: TikTokIcon },
    { href: YOUTUBE_URL, label: "YouTube", Icono: YoutubeIcon },
  ];

  return (
    <div className="overflow-x-hidden">
      {/* Hero: la historia + quiénes somos (el texto de antes). */}
      <section className="mx-auto max-w-3xl px-4 pb-10 pt-12 sm:pt-16">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Nuestra historia</h1>
        <p className="mt-2 text-lg font-medium text-brand">Del primer auto al local soñado.</p>
        {/* TODO (Agustín): reemplazar este texto por el definitivo. */}
        <div className="mt-4 space-y-3 text-muted-foreground">
          <p>
            Titus Cars es una agencia de autos usados en Córdoba. Trabajamos con vehículos peritados, con
            garantía escrita y gestoría propia para que comprar o vender un auto sea simple, sin vueltas.
          </p>
          <p>
            Nuestro diferencial es la consigna virtual: vendemos tu auto sin que dejes de usarlo. Nos
            ocupamos de peritar, publicar en todos nuestros canales, atender las consultas y cerrar la venta,
            mientras vos seguís con tu día a día.
          </p>
        </div>
        <Link
          href="/autos"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-brand px-6 text-base font-semibold text-white hover:bg-brand/90"
        >
          Ver autos disponibles
        </Link>
      </section>

      {/* Línea de tiempo */}
      <section aria-label="Línea de tiempo" className="mx-auto max-w-3xl px-4 pb-6">
        <ol className="relative border-l-2 border-brand/30 pl-6 sm:pl-8">
          {HISTORIA.map((c, i) => (
            <li key={`${c.fecha}-${i}`} className="relative pb-12 last:pb-4">
              <span
                aria-hidden="true"
                className="absolute -left-[33px] top-1 h-4 w-4 rounded-full border-4 border-white bg-brand shadow sm:-left-[41px]"
              />
              <p className="text-sm font-semibold uppercase tracking-wide text-brand">{c.fecha}</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight">{c.titulo}</h2>
              <Videos videos={c.videos} fecha={c.fecha} />
              {c.extra && (
                <a
                  href={c.extra.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm font-medium text-brand underline-offset-2 hover:underline"
                >
                  {c.extra.texto}
                </a>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* Diversión */}
      <section className="bg-zinc-100 py-14">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-2xl font-bold tracking-tight">Y en el medio, nos divertimos</h2>
          <p className="mt-2 text-muted-foreground">
            Trabajar es muy importante pero nunca hay que dejar de divertirse y pasarla bien
          </p>
          <Videos videos={DIVERSION} />
        </div>
      </section>

      {/* Números (de la versión anterior) */}
      <section className="bg-brand-black py-14 text-white">
        <div className="mx-auto grid max-w-4xl grid-cols-3 gap-6 px-4 text-center">
          {numeros.map((n) => (
            <div key={n.label}>
              <p className="text-3xl font-black text-brand sm:text-4xl">{n.valor}</p>
              <p className="mt-1 text-sm text-white/70">{n.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cierre: dirección, horarios, redes y WhatsApp */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-2xl font-bold tracking-tight">Vení a conocernos</h2>
        <ul className="mt-4 space-y-3 text-foreground/80">
          <li className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
            <span>
              {DIRECCION}.{" "}
              <a
                href={MAPS_COMO_LLEGAR}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand underline-offset-2 hover:underline"
              >
                Cómo llegar
              </a>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
            <span>{HORARIOS}</span>
          </li>
        </ul>
        <a
          href={linkWhatsapp()}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-6 text-base font-semibold text-white transition-opacity hover:opacity-90 sm:inline-flex sm:w-auto"
        >
          <WhatsappIcon className="h-5 w-5" />
          Escribinos por WhatsApp
        </a>

        <h3 className="mt-10 text-lg font-bold tracking-tight">Seguinos</h3>
        <div className="mt-3 flex items-center gap-4">
          {redes.map(({ href, label, Icono }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground hover:border-brand hover:text-brand"
            >
              <Icono className="h-5 w-5" />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
