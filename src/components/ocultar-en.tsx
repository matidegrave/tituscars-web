"use client";

import { useRutaVisible } from "@/lib/ruta-visible";

/**
 * No muestra su contenido en ciertas rutas (ej. /links, que va sin header,
 * footer ni botón flotante). Decide en el render del servidor también, así
 * que sin JS tampoco aparece.
 */
export function OcultarEn({ rutas, children }: { rutas: string[]; children: React.ReactNode }) {
  const pathname = useRutaVisible();
  if (rutas.includes(pathname)) return null;
  return <>{children}</>;
}
