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
