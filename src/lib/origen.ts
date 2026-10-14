/**
 * Origen de la visita (tanda 51): las que vienen de un anuncio de Meta caen en
 * el WhatsApp de pauta y no en el de portales, para medir la conversión de la
 * inversión.
 *
 * La señal es SÓLO utm_medium=paid (con cualquier utm_source: ig, fb, th,
 * fb-FeaturedOfferings…). fbclid NO sirve: Instagram orgánico también lo trae.
 * El proxy guarda la cookie tc_origen=pauta por 7 días y la renueva cada vez
 * que se vuelve a entrar por un anuncio. Una visita orgánica posterior no la
 * borra: sigue siendo el mismo cliente que trajo la pauta.
 */
export const COOKIE_ORIGEN = "tc_origen";
export const VALOR_PAUTA = "pauta";
export const SIETE_DIAS_S = 7 * 24 * 60 * 60;

/** La URL es la de un anuncio pago (utm_medium=paid). */
export function esLlegadaDePauta(params: URLSearchParams): boolean {
  return params.get("utm_medium")?.trim().toLowerCase() === "paid";
}

/** Con la cookie de pauta. */
export function esPauta(valorCookie: string | null | undefined): boolean {
  return valorCookie === VALOR_PAUTA;
}

/**
 * Anuncio y campaña de la última llegada por pauta (tanda 52): utm_content en
 * tc_anuncio y utm_campaign en tc_campana, mismas reglas que tc_origen (7
 * días; una llegada paga nueva los pisa, una visita sin utm no los toca). Con
 * el anuncio, los mensajes de WhatsApp de venta terminan en " (ref: W1)"
 * (refAnuncio en lib/whatsapp.ts).
 */
export const COOKIE_ANUNCIO = "tc_anuncio";
export const COOKIE_CAMPANA = "tc_campana";

/** Valor de utm para guardar: sólo letras, números, espacio y - _ . : / | +, máx 60. "" si no queda nada. */
export function limpiarUtm(valor: string | null | undefined): string {
  return (valor ?? "")
    .normalize("NFC")
    .replace(/[^\p{L}\p{N} \-_.:/|+]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60)
    .trim();
}
