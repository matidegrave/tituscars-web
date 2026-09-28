/**
 * "Modo equipo": las visitas del equipo de Titus no se miden. Se activa
 * entrando a cualquier URL con ?equipo=1 (el proxy guarda la cookie
 * tc_equipo=1 por un año y saca el parámetro) y se desactiva con ?equipo=0.
 * Es una marca del DISPOSITIVO, no del link: un link que el equipo comparte a
 * un cliente no la lleva, así que esa visita sí cuenta.
 * Con la marca: no se registra nada en web_eventos ni busquedas_web, no se
 * carga el Pixel y no se manda CAPI. localStorage es el respaldo si la cookie
 * se borra (components/modo-equipo.tsx la vuelve a poner).
 *
 * Vendedor (tanda 41): ?equipo=1&v=luca guarda también el nombre en la misma
 * marca: el valor pasa a ser "1.luca" (minúsculas, sólo letras, máx 20). Sin v
 * queda "1" (vendedor "equipo"). Con el nombre se arman los links que copia
 * el vendedor para sus clientes (utm_campaign=luca).
 */
export const COOKIE_EQUIPO = "tc_equipo";
export const UN_ANIO_S = 365 * 24 * 60 * 60;

/** "1" o "1.luca". */
const VALOR_EQUIPO = /^1(?:\.([a-z]{1,20}))?$/;
const MARCA_EN_COOKIES = new RegExp(`(?:^|;\\s*)${COOKIE_EQUIPO}=(1(?:\\.[a-z]{1,20})?)(?:;|$)`);

/** Nombre de vendedor válido: minúsculas, sólo letras (sin tildes), máx 20. "" si no queda nada. */
export function limpiarVendedor(v: string | null | undefined): string {
  return (v ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .slice(0, 20);
}

/** Valor de la marca para ese vendedor ("1" o "1.luca"). */
export function valorEquipo(vendedor: string | null | undefined): string {
  const v = limpiarVendedor(vendedor);
  return v ? `1.${v}` : "1";
}

export function esValorEquipo(valor: string | null | undefined): boolean {
  return VALOR_EQUIPO.test(valor ?? "");
}

/** Lee la marca de un header Cookie (servidor) o de document.cookie (navegador). */
export function hayMarcaEquipo(cookies: string | null | undefined): boolean {
  return MARCA_EN_COOKIES.test(cookies ?? "");
}

/** En el navegador: el valor de la marca (cookie o respaldo), o null si no es del equipo. */
export function valorEquipoCliente(): string | null {
  if (typeof document === "undefined") return null;
  const enCookie = document.cookie.match(MARCA_EN_COOKIES)?.[1];
  if (enCookie) return enCookie;
  try {
    const guardado = localStorage.getItem(COOKIE_EQUIPO);
    return esValorEquipo(guardado) ? guardado : null;
  } catch {
    return null;
  }
}

/** En el navegador: cookie o, si se borró, el respaldo de localStorage. */
export function esEquipoCliente(): boolean {
  return valorEquipoCliente() !== null;
}

/** Vendedor de este dispositivo: "luca", "equipo" (sin nombre) o null (no es del equipo). */
export function vendedorCliente(): string | null {
  const valor = valorEquipoCliente();
  if (!valor) return null;
  return valor.match(VALOR_EQUIPO)?.[1] ?? "equipo";
}
