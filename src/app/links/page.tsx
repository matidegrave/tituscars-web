import type { Metadata } from "next";
import Image from "next/image";
import {
  DIRECCION,
  GOOGLE_PUNTAJE,
  INSTAGRAM_URL,
  MAPS_COMO_LLEGAR,
  RESENAS_URL,
  TIKTOK_URL,
  WHATSAPP_CONSIGNAS,
} from "@/lib/config";
import { linkWhatsapp } from "@/lib/whatsapp";
import { WhatsappIcon } from "@/components/icons/whatsapp-icon";
import {
  GoogleMapsIcon,
  InstagramColorIcon,
  TikTokColorIcon,
  TitusIsologo,
} from "@/components/icons/marcas";
import { TrackAlMontar } from "@/components/tracking/track-al-montar";

// /links: la página de la bio de Instagram y TikTok (reemplaza al Linktree).
// Sin el marco del sitio (layout: OcultarEn), links <a> puros (anda sin JS) y
// fuera de Google: noindex y fuera del sitemap. Logos de marca como SVG inline.

export const metadata: Metadata = {
  title: { absolute: "Titus Cars · Links" },
  description:
    "WhatsApp, catálogo y redes de Titus Cars, autos usados en Córdoba.",
  robots: { index: false, follow: true },
};

const UTM = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
];

type Estilo = "naranja" | "verde";

const ESTILOS: Record<Estilo, string> = {
  naranja: "bg-brand text-white hover:bg-brand-dark",
  verde: "bg-[#25D366] text-white hover:bg-[#1ebe5a]",
};

/**
 * Logo a color dentro de un círculo blanco (mismo tamaño que el isologo de
 * "Ver catálogo"), así se lee sobre el naranja.
 */
function EnCirculo({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white">
      {children}
    </span>
  );
}

interface Boton {
  texto: string;
  href: string;
  estilo: Estilo;
  icono: React.ReactNode;
  externo?: boolean;
  /** Algo chico a la derecha (ej. el puntaje). */
  extra?: string;
  /**
   * Aclaración que sigue al texto en la misma línea si entra; si el botón es
   * angosto, va debajo y más chica (container query sobre el botón).
   */
  subtexto?: string;
}

export default async function LinksPage({ searchParams }: PageProps<"/links">) {
  const sp = await searchParams;

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

  const icono = "h-7 w-7";
  const logo = "h-[18px] w-[18px]";
  const botones: Boton[] = [
    {
      texto: "Ver catálogo",
      subtexto: "(vehículos disponibles)",
      href: interno("/autos"),
      estilo: "naranja",
      icono: <TitusIsologo className={icono} />,
    },
    {
      texto: "Quiero comprar un auto",
      href: linkWhatsapp("Hola! Quiero comprar un auto."),
      estilo: "verde",
      icono: <WhatsappIcon className="h-6 w-6" />,
      externo: true,
    },
    {
      texto: "Quiero vender / consignar mi auto",
      href: linkWhatsapp("Hola! Quiero vender mi auto.", WHATSAPP_CONSIGNAS),
      estilo: "verde",
      icono: <WhatsappIcon className="h-6 w-6" />,
      externo: true,
    },
    {
      texto: "Ubicación",
      href: MAPS_COMO_LLEGAR,
      estilo: "naranja",
      icono: (
        <EnCirculo>
          <GoogleMapsIcon className={logo} />
        </EnCirculo>
      ),
      externo: true,
    },
    {
      texto: "Reseñas",
      href: RESENAS_URL,
      estilo: "naranja",
      icono: (
        <EnCirculo>
          <GoogleMapsIcon className={logo} />
        </EnCirculo>
      ),
      externo: true,
      extra: `${GOOGLE_PUNTAJE} ★`,
    },
    {
      texto: "Conocenos en Instagram",
      href: INSTAGRAM_URL,
      estilo: "naranja",
      icono: (
        <EnCirculo>
          <InstagramColorIcon className={logo} />
        </EnCirculo>
      ),
      externo: true,
    },
    {
      texto: "Conocenos en TikTok",
      href: TIKTOK_URL,
      estilo: "naranja",
      icono: (
        <EnCirculo>
          <TikTokColorIcon className={logo} />
        </EnCirculo>
      ),
      externo: true,
    },
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

        <nav
          aria-label="Links de Titus Cars"
          className="mt-8 flex flex-col gap-3"
        >
          {botones.map((b) => (
            <a
              key={b.texto}
              href={b.href}
              {...(b.externo
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className={`@container relative flex min-h-14 w-full items-center justify-center rounded-xl px-11 py-3 text-center text-[15px] font-semibold sm:px-14 sm:text-base shadow-sm transition-colors ${ESTILOS[b.estilo]}`}
            >
              {/* Ícono a la izquierda y texto centrado en todo el ancho. */}
              <span className="absolute left-4 top-1/2 flex -translate-y-1/2 items-center">
                {b.icono}
              </span>
              {b.subtexto ? (
                // Una línea si entra con aire (276 px de contenido: lo que mide
                // "Ver catálogo (vehículos disponibles)" a 15 px + 8 px por lado para
                // no quedar pegado al ícono);
                // si no, la aclaración abajo y más chica. Cada parte es
                // nowrap: nunca se corta una palabra ni se sale del botón.
                <span className="flex flex-col items-center leading-tight @min-[276px]:flex-row @min-[276px]:gap-x-[0.3em]">
                  <span className="whitespace-nowrap">{b.texto}</span>{" "}
                  <span className="whitespace-nowrap text-xs font-medium @min-[276px]:text-[1em] @min-[276px]:font-semibold">
                    {b.subtexto}
                  </span>
                </span>
              ) : (
                b.texto
              )}
              {b.extra && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-white">
                  {b.extra}
                </span>
              )}
            </a>
          ))}
        </nav>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {DIRECCION}
        </p>
      </div>
    </div>
  );
}
