"use client";

import { useEffect } from "react";
import { track } from "@/lib/tracking";

export const CLAVE_BUSQUEDA_PENDIENTE = "tc_busqueda";

/**
 * Lo llama el buscador al enviar: la búsqueda se registra al ver los resultados.
 * `pagina`: desde dónde se buscó (el buscador del header, en cualquier página).
 */
export function marcarBusquedaPendiente(q: string, pagina?: string) {
  try {
    sessionStorage.setItem(CLAVE_BUSQUEDA_PENDIENTE, JSON.stringify({ q, t: Date.now(), pagina }));
  } catch {
    // sin sessionStorage no se mide; la búsqueda anda igual
  }
}

/**
 * En /autos: si el buscador acaba de enviar una búsqueda, la registra UNA vez
 * con cuántos autos encontró (resultados, 0 incluido). Así la búsqueda que se
 * convirtió en filtros ("camioneta diesel") o la que no dio nada también
 * quedan medidas con su texto original.
 */
export function TrackBusqueda({ resultados }: { resultados: number }) {
  useEffect(() => {
    try {
      const guardada = sessionStorage.getItem(CLAVE_BUSQUEDA_PENDIENTE);
      if (!guardada) return;
      sessionStorage.removeItem(CLAVE_BUSQUEDA_PENDIENTE);
      const { q, t, pagina } = JSON.parse(guardada) as { q: string; t: number; pagina?: string };
      if (q && Date.now() - t < 60_000) track("busqueda", { q, resultados, pagina });
    } catch {
      // nunca rompe la página
    }
  }, [resultados]);
  return null;
}
