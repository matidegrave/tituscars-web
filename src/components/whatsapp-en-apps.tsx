"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { telefonoLegible } from "@/lib/config";
import {
  EVENTO_WHATSAPP_APP,
  datosWhatsapp,
  esquemaWhatsapp,
  navegadorDeApp,
} from "@/lib/whatsapp-apps";

const ESPERA_MS = 1500;

/**
 * Montado una vez en el layout. Sólo actúa en el navegador interno de TikTok,
 * Instagram o Facebook (ver lib/whatsapp-apps.ts): cualquier link a WhatsApp
 * del sitio (fichas, /links, /consigna, flotante, header) y los formularios
 * intentan whatsapp://send; si a los 1,5 s la página sigue visible (la app no
 * se abrió), aparece un panel abajo con cómo salir al navegador, "Copiar
 * número" y el link wa.me de siempre. El click igual se mide (click_whatsapp),
 * lo registra el listener de MetaPixel.
 */
export function WhatsappEnApps() {
  const [panel, setPanel] = useState<{ url: string; numero: string } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!navegadorDeApp()) return;

    const intentar = (url: string) => {
      const esquema = esquemaWhatsapp(url);
      const datos = datosWhatsapp(url);
      if (!esquema || !datos) {
        window.location.href = url;
        return;
      }
      if (espera.current) clearTimeout(espera.current);
      setPanel(null);
      setCopiado(false);
      window.location.href = esquema;
      espera.current = setTimeout(() => {
        if (document.visibilityState === "visible") setPanel({ url, numero: datos.numero });
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

  async function copiar() {
    try {
      await navigator.clipboard.writeText(legible);
      setCopiado(true);
      return;
    } catch {
      // Algunos navegadores de apps no dejan usar el portapapeles moderno.
    }
    const campo = document.createElement("textarea");
    campo.value = legible;
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

  return (
    <div
      role="dialog"
      aria-label="Cómo escribirnos por WhatsApp"
      className="fixed inset-x-0 bottom-0 z-[80] rounded-t-2xl border-t border-border bg-background px-5 pb-6 pt-5 shadow-2xl"
    >
      <button
        type="button"
        onClick={() => setPanel(null)}
        aria-label="Cerrar"
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
      >
        <X className="h-5 w-5" />
      </button>
      <p className="pr-8 text-base font-semibold">
        Para escribirnos por WhatsApp: tocá ⋯ arriba a la derecha → Abrir en el navegador
      </p>
      <button
        type="button"
        onClick={() => void copiar()}
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
