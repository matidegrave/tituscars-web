"use client";

import { createContext, useContext } from "react";
import { WHATSAPP_VENTAS } from "@/lib/config";
import type { Venta } from "@/lib/whatsapp";

/**
 * El WhatsApp de venta de esta visita para los componentes de cliente
 * (header, menú, flotante, footer, formularios): número de pauta o portales
 * (tanda 51) y ref del anuncio para el mensaje (tanda 52). Lo resuelve el
 * layout en el servidor con las cookies (ventaServidor) y baja por acá, así el
 * HTML ya sale con el link correcto, sin JS.
 */
const VentaVisita = createContext<Venta>({ numero: WHATSAPP_VENTAS, ref: null });

export function LineaWhatsapp({ venta, children }: { venta: Venta; children: React.ReactNode }) {
  return <VentaVisita.Provider value={venta}>{children}</VentaVisita.Provider>;
}

export function useVenta(): Venta {
  return useContext(VentaVisita);
}
