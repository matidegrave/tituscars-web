/**
 * "Modo equipo": las visitas del equipo de Titus no se miden. Se activa
 * entrando a cualquier URL con ?equipo=1 (el proxy guarda la cookie
 * tc_equipo=1 por un año y saca el parámetro) y se desactiva con ?equipo=0.
 * Es una marca del DISPOSITIVO, no del link: un link que el equipo comparte a
 * un cliente no la lleva, así que esa visita sí cuenta.
 * Con la marca: no se registra nada en web_eventos ni busquedas_web, no se
 * carga el Pixel y no se manda CAPI. localStorage es el respaldo si la cookie
 * se borra (components/modo-equipo.tsx la vuelve a poner).
 */
export const COOKIE_EQUIPO = "tc_equipo";
export const UN_ANIO_S = 365 * 24 * 60 * 60;

/** Lee la marca de un header Cookie (servidor) o de document.cookie (navegador). */
export function hayMarcaEquipo(cookies: string | null | undefined): boolean {
  return new RegExp(`(?:^|;\\s*)${COOKIE_EQUIPO}=1(?:;|$)`).test(cookies ?? "");
}

/** En el navegador: cookie o, si se borró, el respaldo de localStorage. */
export function esEquipoCliente(): boolean {
  if (typeof document === "undefined") return false;
  if (hayMarcaEquipo(document.cookie)) return true;
  try {
    return localStorage.getItem(COOKIE_EQUIPO) === "1";
  } catch {
    return false;
  }
}
