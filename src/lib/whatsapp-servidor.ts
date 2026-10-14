import { cookies } from "next/headers";
import { COOKIE_EQUIPO, esValorEquipo } from "@/lib/equipo";
import { COOKIE_ANUNCIO, COOKIE_ORIGEN } from "@/lib/origen";
import { refAnuncioServidor } from "@/lib/anuncios-ref";
import { numeroVentas, type Venta } from "@/lib/whatsapp";

/**
 * El WhatsApp de venta de esta visita, leyendo las cookies (layout y páginas):
 * número de pauta o portales (tanda 51) y la ref del anuncio para el mensaje
 * (tanda 52; nunca en modo equipo; con ID numérico, código de anuncios_ref).
 */
export async function ventaServidor(): Promise<Venta> {
  const c = await cookies();
  const equipo = esValorEquipo(c.get(COOKIE_EQUIPO)?.value);
  return {
    numero: numeroVentas(c.get(COOKIE_ORIGEN)?.value),
    ref: equipo ? null : await refAnuncioServidor(c.get(COOKIE_ANUNCIO)?.value),
  };
}
