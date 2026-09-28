"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, MoreHorizontal, X } from "lucide-react";
import { telefonoLegible } from "@/lib/config";
import {
  EVENTO_WHATSAPP_APP,
  datosWhatsapp,
  esquemaWhatsapp,
  navegadorDeApp,
  type NavegadorDeApp,
} from "@/lib/whatsapp-apps";

const ESPERA_MS = 1500;

type Panel = { url: string; numero: string; texto: string; app: NavegadorDeApp };

/**
 * Montado una vez en el layout. Sólo actúa en el navegador interno de TikTok,
 * Instagram o Facebook (ver lib/whatsapp-apps.ts); en cualquier otro
 * navegador no hace nada. Cubre todos los links a WhatsApp del sitio (fichas,
 * /links, /consigna, flotante, header) y los formularios.
 * - TikTok bloquea todo salto a WhatsApp (wa.me y whatsapp://, con el toast
 *   "La acción no se pudo completar"): no se intenta; el panel sale al toque.
 * - Instagram / Facebook: se intenta whatsapp://send y, si a los 1,5 s la
 *   página sigue visible, sale el panel.
 * El toque se mide igual como un click_whatsapp (listener de MetaPixel).
 */
export function WhatsappEnApps() {
  const [panel, setPanel] = useState<Panel | null>(null);
  const [copiado, setCopiado] = useState(false);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const app = navegadorDeApp();
    if (!app) return;

    const intentar = (url: string) => {
      const esquema = esquemaWhatsapp(url);
      const datos = datosWhatsapp(url);
      if (!esquema || !datos) {
        window.location.href = url;
        return;
      }
      if (espera.current) clearTimeout(espera.current);
      setCopiado(false);
      const nuevo: Panel = { url, numero: datos.numero, texto: datos.texto, app };
      if (app === "tiktok") {
        setPanel(nuevo);
        return;
      }
      setPanel(null);
      window.location.href = esquema;
      espera.current = setTimeout(() => {
        if (document.visibilityState === "visible") setPanel(nuevo);
      }, ESPERA_MS);
    };

    const alClick = (evento: MouseEvent) => {
      const link = (evento.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || !/^https:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(link.href)) return;
      // El link del propio panel es la última opción: sale tal cual.
      if (link.hasAttribute("data-whatsapp-directo")) return;
      evento.preventDefault();
      intentar(link.href);
    };
    const alPedido = (evento: Event) => {
      const url = (evento as CustomEvent<{ url: string }>).detail?.url;
      if (url) intentar(url);
    };
    // Si WhatsApp se abrió, la página se oculta: no hace falta el panel.
    const alOcultar = () => {
      if (document.visibilityState === "hidden" && espera.current) clearTimeout(espera.current);
    };

    document.addEventListener("click", alClick, true);
    window.addEventListener(EVENTO_WHATSAPP_APP, alPedido);
    document.addEventListener("visibilitychange", alOcultar);
    return () => {
      document.removeEventListener("click", alClick, true);
      window.removeEventListener(EVENTO_WHATSAPP_APP, alPedido);
      document.removeEventListener("visibilitychange", alOcultar);
      if (espera.current) clearTimeout(espera.current);
    };
  }, []);

  if (!panel) return null;
  const legible = telefonoLegible(panel.numero);

  async function copiar(contenido: string) {
    try {
      await navigator.clipboard.writeText(contenido);
      setCopiado(true);
      return;
    } catch {
      // Algunos navegadores de apps no dejan usar el portapapeles moderno.
    }
    const campo = document.createElement("textarea");
    campo.value = contenido;
    campo.setAttribute("readonly", "");
    campo.style.position = "fixed";
    campo.style.opacity = "0";
    document.body.appendChild(campo);
    campo.select();
    try {
      setCopiado(document.execCommand("copy"));
    } finally {
      campo.remove();
    }
  }

  const cerrar = (
    <button
      type="button"
      onClick={() => setPanel(null)}
      aria-label="Cerrar"
      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
    >
      <X className="h-5 w-5" />
    </button>
  );

  if (panel.app === "tiktok") {
    return (
      <div
        role="dialog"
        aria-label="TikTok no deja abrir WhatsApp desde acá"
        className="fixed inset-x-0 bottom-0 z-[80] rounded-t-2xl border-t border-border bg-background px-5 pb-7 pt-6 shadow-2xl"
      >
        {cerrar}
        <p className="pr-8 text-lg font-bold leading-snug">TikTok no deja abrir WhatsApp desde acá</p>
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-muted px-4 py-3">
          <span className="text-base font-semibold leading-snug">
            Tocá <MoreHorizontal className="inline h-5 w-5 align-[-4px]" aria-label="⋯" /> arriba a la derecha → Abrir
            en el navegador
          </span>
          <ArrowUpRight className="ml-auto h-8 w-8 shrink-0 text-brand" aria-hidden="true" />
        </div>
        <button
          type="button"
          onClick={() => void copiar(`${legible}\n${panel.texto}`)}
          className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-[#25D366] px-4 py-3 text-center text-base font-semibold text-white"
        >
          {copiado ? "Copiado. Abrí WhatsApp y pegalo" : "Copiar número y mensaje"}
        </button>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Cómo escribirnos por WhatsApp"
      className="fixed inset-x-0 bottom-0 z-[80] rounded-t-2xl border-t border-border bg-background px-5 pb-6 pt-5 shadow-2xl"
    >
      {cerrar}
      <p className="pr-8 text-base font-semibold">
        Para escribirnos por WhatsApp: tocá ⋯ arriba a la derecha → Abrir en el navegador
      </p>
      <button
        type="button"
        onClick={() => void copiar(legible)}
        className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-[#25D366] text-base font-semibold text-white"
      >
        {copiado ? "¡Número copiado!" : `Copiar número ${legible}`}
      </button>
      <a
        href={panel.url}
        target="_blank"
        rel="noopener noreferrer"
        data-whatsapp-directo
        className="mt-3 block text-center text-sm text-muted-foreground underline underline-offset-2"
      >
        O probá abrir WhatsApp desde acá
      </a>
    </div>
  );
}
