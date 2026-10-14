import { cookies } from "next/headers";
import { COOKIE_EQUIPO, esValorEquipo } from "@/lib/equipo";
import { COOKIE_ANUNCIO, COOKIE_ORIGEN } from "@/lib/origen";
import { numeroVentas, refAnuncio, type Venta } from "@/lib/whatsapp";

/**
 * El WhatsApp de venta de esta visita, leyendo las cookies (layout y páginas):
 * número de pauta o portales (tanda 51) y la ref del anuncio para el mensaje
 * (tanda 52; nunca en modo equipo).
 */
export async function ventaServidor(): Promise<Venta> {
  const c = await cookies();
  const equipo = esValorEquipo(c.get(COOKIE_EQUIPO)?.value);
  return {
    numero: numeroVentas(c.get(COOKIE_ORIGEN)?.value),
    ref: equipo ? null : refAnuncio(c.get(COOKIE_ANUNCIO)?.value),
  };
}
