"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { guardarUtmDeLaUrl, hrefConMarca } from "@/lib/utm";

/**
 * Montado una vez en el layout:
 * - guarda los utm de la URL al entrar y en cada navegación;
 * - al tocar un link de WhatsApp (wa.me) le agrega al mensaje la marca del
 *   anuncio "(ref: …)". Se hace en el click, sobre window en captura, así corre
 *   antes que los listeners de document (MetaPixel y WhatsappEnApps leen el
 *   href ya marcado). Los links siguen siendo <a href> normales.
 */
export function CapturaUtm() {
  const pathname = usePathname();

  useEffect(() => {
    guardarUtmDeLaUrl();
  }, [pathname]);

  useEffect(() => {
    const alClick = (evento: MouseEvent) => {
      try {
        const link = (evento.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
        if (!link || link.hasAttribute("data-whatsapp-directo")) return;
        const marcado = hrefConMarca(link.href);
        if (marcado !== link.href) link.href = marcado;
      } catch {
        // nunca rompe el click
      }
    };
    window.addEventListener("click", alClick, true);
    return () => window.removeEventListener("click", alClick, true);
  }, []);

  return null;
}
