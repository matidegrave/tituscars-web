import type { Metadata } from "next";
import { MapPin, Clock } from "lucide-react";
import { WhatsappIcon } from "@/components/icons/whatsapp-icon";
import { InstagramIcon } from "@/components/icons/social-icons";
import { linkWhatsapp } from "@/lib/whatsapp";
import {
  HORARIOS,
  INSTAGRAM_URL,
  RESENAS_URL,
  DIRECCION,
  SITE_URL,
  TELEFONO_DISPLAY,
  MAPS_COMO_LLEGAR,
} from "@/lib/config";

export const metadata: Metadata = {
  alternates: { canonical: `${SITE_URL}/contacto` },
  title: "Contacto | Titus Cars",
  description: "Dirección, WhatsApp y horarios de Titus Cars en Córdoba.",
};

const CONSULTA_TITULO = `Titus Cars, ${DIRECCION}`;
const MAPS_EMBED_SRC = `https://www.google.com/maps?q=${encodeURIComponent(CONSULTA_TITULO)}&output=embed`;
const MAPS_DIRECCIONES = MAPS_COMO_LLEGAR;

export default function ContactoPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Contacto</h1>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div>
              <p className="font-medium">Dirección</p>
              <a
                href={MAPS_DIRECCIONES}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground underline underline-offset-2 hover:text-brand"
              >
                {DIRECCION}
              </a>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-3">
            <WhatsappIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div>
              <p className="font-medium">WhatsApp</p>
              <a
                href={linkWhatsapp()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground underline underline-offset-2 hover:text-brand"
              >
                {TELEFONO_DISPLAY}
              </a>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div>
              <p className="font-medium">Horarios</p>
              <p className="text-sm text-muted-foreground">{HORARIOS}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={linkWhatsapp()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 text-sm font-semibold text-white hover:opacity-90"
            >
              <WhatsappIcon className="h-4 w-4" />
              WhatsApp
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border px-5 text-sm font-semibold hover:border-brand hover:text-brand"
            >
              <InstagramIcon className="h-4 w-4" />
              Instagram
            </a>
            <a
              href={MAPS_DIRECCIONES}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border px-5 text-sm font-semibold hover:border-brand hover:text-brand"
            >
              <MapPin className="h-4 w-4" />
              Cómo llegar
            </a>
          </div>

          <a
            href={RESENAS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block text-sm text-muted-foreground underline underline-offset-2 hover:text-brand"
          >
            Ver reseñas en Google
          </a>
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <iframe
            src={MAPS_EMBED_SRC}
            title="Ubicación de Titus Cars en el mapa"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-80 w-full lg:h-full lg:min-h-[360px]"
          />
        </div>
      </div>
    </div>
  );
}
