"use client";

import { useEffect, useState } from "react";
import { Check, Share2 } from "lucide-react";
import { WhatsappIcon } from "@/components/icons/whatsapp-icon";
import { EstrellasPuntaje } from "@/components/estrellas-puntaje";
import { AvisoHorario } from "@/components/aviso-horario";
import { GOOGLE_PUNTAJE, RESENAS_CANTIDAD, RESENAS_URL } from "@/lib/config";
import { track } from "@/lib/tracking";
import { BotonFavorito } from "@/components/favoritos/boton-favorito";
import type { Favorito } from "@/lib/favoritos";
import { CopiarFicha } from "@/components/vendedor/herramientas-card";
import type { AutoParaCliente } from "@/lib/para-cliente";

/** true si copió el link (sin share nativo); false si usó el share o falló. */
async function compartir(titulo: string): Promise<boolean> {
  const url = window.location.href;

  if (navigator.share) {
    try {
      await navigator.share({ title: titulo, url });
    } catch {
      // el usuario canceló el share nativo, no hacemos nada
    }
    return false;
  }

  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Botones de WhatsApp de la ficha: son <a href> reales con el link ya armado
 * en el servidor, así funcionan aunque el JS del navegador no corra.
 */
export function WhatsappCta({
  titulo,
  precioFormateado,
  hrefWhatsapp,
  intenciones,
  trackAuto,
  favorito,
  paraCliente,
}: {
  titulo: string;
  precioFormateado: string;
  hrefWhatsapp: string;
  /** Consultas con intención (disponible / financiar / permuta), al WhatsApp de ventas. */
  intenciones: { texto: string; href: string; detalle: string }[];
  /** Datos del auto para el click_whatsapp / Lead (los lee MetaPixel del link). */
  trackAuto: { auto_id: string; slug: string; valor: number };
  /** Datos para guardarlo en favoritos (corazón al lado de compartir). */
  favorito: Omit<Favorito, "ts">;
  /** "Copiar para cliente" (sólo se ve en modo equipo). */
  paraCliente: AutoParaCliente;
}) {
  // "Link copiado" en el mismo botón (antes era un toast: el Toaster sumaba
  // ~9 KB de JS a todas las páginas sólo para este aviso).
  const [copiado, setCopiado] = useState(false);
  useEffect(() => {
    if (!copiado) return;
    const t = setTimeout(() => setCopiado(false), 2000);
    return () => clearTimeout(t);
  }, [copiado]);

  const handleCompartir = async () => {
    track("compartir", { auto_id: trackAuto.auto_id, slug: trackAuto.slug });
    if (await compartir(titulo)) setCopiado(true);
  };
  const datosTrack = {
    "data-track-auto-id": trackAuto.auto_id,
    "data-track-slug": trackAuto.slug,
    "data-track-valor": String(trackAuto.valor),
  };

  return (
    <>
      <a
        href={RESENAS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="-mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <EstrellasPuntaje puntaje={GOOGLE_PUNTAJE} estrellaClassName="h-4 w-4" className="gap-0.5" />
        <span>
          {GOOGLE_PUNTAJE} · {RESENAS_CANTIDAD} reseñas en Google
        </span>
      </a>
      <div className="flex gap-2">
        <a
          href={hrefWhatsapp}
          {...datosTrack}
          data-track-detalle="consulta"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-[#25D366] text-base font-semibold text-white transition-opacity hover:opacity-90"
        >
          <WhatsappIcon className="h-5 w-5" />
          Consultar por WhatsApp
        </a>
        <button
          type="button"
          onClick={() => void handleCompartir()}
          aria-label={copiado ? "Link copiado" : "Compartir"}
          className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-muted"
        >
          {copiado ? <Check className="h-5 w-5 text-emerald-600" /> : <Share2 className="h-5 w-5" />}
          <span
            role="status"
            className={`pointer-events-none absolute -top-9 right-0 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background ${copiado ? "" : "hidden"}`}
          >
            {copiado ? "Link copiado" : ""}
          </span>
        </button>
        <BotonFavorito auto={favorito} variante="ficha" />
      </div>
      <CopiarFicha auto={paraCliente} />

      {/* Consultas con intención: mensaje prearmado según lo que quiere saber. */}
      <div className="-mt-3 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
        {intenciones.map((i) => (
          <a
            key={i.detalle}
            href={i.href}
            {...datosTrack}
            data-track-detalle={i.detalle}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 whitespace-nowrap rounded-lg border border-[#25D366] px-3.5 py-2 text-sm font-semibold text-[#1a9e4b] transition-colors hover:bg-[#25D366]/10"
          >
            {i.texto}
          </a>
        ))}
      </div>
      <AvisoHorario className="-mt-3" />

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:hidden">
        <span className="text-lg font-black">{precioFormateado}</span>
        <a
          href={hrefWhatsapp}
          {...datosTrack}
          data-track-detalle="consulta"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 flex-1 max-w-[65%] items-center justify-center gap-2 rounded-lg bg-[#25D366] text-sm font-semibold text-white"
        >
          <WhatsappIcon className="h-4 w-4" />
          Consultar
        </a>
      </div>
    </>
  );
}
