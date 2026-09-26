/**
 * ¿Esta request es de la web real? Sólo ahí se escribe tracking (web_eventos,
 * busquedas_web) y se manda a la Conversions API de Meta. En local, en los
 * previews de Vercel o en tituscars-*.vercel.app no se escribe nada: sólo se
 * loguea lo que se habría enviado.
 *
 * Producción real = VERCEL_ENV === "production" Y host tituscars.com.
 */
export const HOST_PRODUCCION = "tituscars.com";

export function hostDe(request: Request): string {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host;
  return host.split(",")[0].trim().toLowerCase().replace(/:\d+$/, "");
}

export function esProduccionReal(request: Request): boolean {
  return process.env.VERCEL_ENV === "production" && hostDe(request) === HOST_PRODUCCION;
}

/** Log de lo que se habría escrito/enviado, cuando no es producción real. */
export function simular(destino: string, datos: unknown, request: Request) {
  console.log(
    `[SIMULADO] ${destino} — no se escribe (entorno ${process.env.VERCEL_ENV ?? "local"}, host ${hostDe(request)}):`,
    JSON.stringify(datos)
  );
}
