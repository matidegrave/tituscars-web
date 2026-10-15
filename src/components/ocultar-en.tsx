"use client";

import { usePathname } from "next/navigation";

/**
 * No muestra su contenido en ciertas rutas (ej. /links, que va sin header,
 * footer ni botón flotante). Decide en el render del servidor también, así
 * que sin JS tampoco aparece.
 */
export function OcultarEn({ rutas, children }: { rutas: string[]; children: React.ReactNode }) {
  const pathname = usePathname();
  if (rutas.includes(pathname)) return null;
  return <>{children}</>;
}
