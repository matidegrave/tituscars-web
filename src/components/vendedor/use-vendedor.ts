"use client";

import { useSyncExternalStore } from "react";
import { vendedorCliente } from "@/lib/equipo";

const nada = () => () => {};

/**
 * Vendedor de este dispositivo ("luca", "equipo") o null si no está el modo
 * equipo. En el servidor y al hidratar es null: las herramientas de vendedor
 * aparecen recién en el navegador y nunca en el HTML de un cliente.
 */
export function useVendedor(): string | null {
  return useSyncExternalStore(nada, vendedorCliente, () => null);
}
