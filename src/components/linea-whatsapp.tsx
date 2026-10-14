"use client";

import { createContext, useContext } from "react";
import { WHATSAPP_VENTAS } from "@/lib/config";

/**
 * El WhatsApp de venta de esta visita (pauta o portales, tanda 51) para los
 * componentes de cliente: header, menú, flotante, footer, formularios. Lo
 * resuelve el layout en el servidor con la cookie (numeroVentasServidor) y
 * baja por acá, así el HTML ya sale con el número correcto, sin JS.
 */
const NumeroVentas = createContext<string>(WHATSAPP_VENTAS);

export function LineaWhatsapp({ numero, children }: { numero: string; children: React.ReactNode }) {
  return <NumeroVentas.Provider value={numero}>{children}</NumeroVentas.Provider>;
}

export function useNumeroVentas(): string {
  return useContext(NumeroVentas);
}
