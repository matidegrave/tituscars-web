"use client";

import { useEffect } from "react";
import { track, type DatosEvento } from "@/lib/tracking";
import { tomarEntrada } from "@/lib/recorrido";

/**
 * vista_auto de la ficha. Si se llegó tocando una card del listado, suma la
 * posición de esa card (1 = primera).
 */
export function TrackVistaAuto({ datos }: { datos: DatosEvento & { slug: string } }) {
  const clave = JSON.stringify(datos);
  useEffect(() => {
    const d = JSON.parse(clave) as DatosEvento & { slug: string };
    const entrada = tomarEntrada(d.slug);
    track("vista_auto", entrada?.posicion ? { ...d, posicion: entrada.posicion } : d);
  }, [clave]);
  return null;
}
