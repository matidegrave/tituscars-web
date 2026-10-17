"use client";

import { usePathname } from "next/navigation";

/**
 * No muestra su contenido en ciertas rutas (ej. /links, que va sin header,
 * footer ni botón flotante). Una ruta que termina en "/" vale para todo lo que
 * cuelga de ella ("/informe/" -> /informe/abc). Decide en el render del
 * servidor también, así que sin JS tampoco aparece.
 */
export function OcultarEn({ rutas, children }: { rutas: string[]; children: React.ReactNode }) {
  const pathname = usePathname();
  if (rutas.some((r) => (r.endsWith("/") ? pathname.startsWith(r) : pathname === r))) return null;
  return <>{children}</>;
}
