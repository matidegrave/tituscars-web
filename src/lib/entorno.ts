import { hayMarcaEquipo } from "@/lib/equipo";

/**
 * ¿Se registra esta request? Sólo en la web real y si no es alguien del
 * equipo: ahí se escribe tracking (web_eventos, busquedas_web) y se manda a la
 * Conversions API de Meta. En local, en los previews de Vercel, en
 * tituscars-*.vercel.app o con la marca de equipo (lib/equipo.ts) no se
 * escribe nada: sólo se loguea lo que se habría enviado.
 *
 * Producción real = VERCEL_ENV === "production" Y host tituscars.com.
 */
export const HOST_PRODUCCION = "tituscars.com";

/** Una Request o lo que da headers() en una página (sin url). */
type ConHeaders = { headers: { get(nombre: string): string | null }; url?: string };

export function hostDe(request: ConHeaders): string {
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    (request.url ? new URL(request.url).host : "");
  return host.split(",")[0].trim().toLowerCase().replace(/:\d+$/, "");
}

export function esProduccionReal(request: ConHeaders): boolean {
  return process.env.VERCEL_ENV === "production" && hostDe(request) === HOST_PRODUCCION;
}

export function esEquipo(request: ConHeaders): boolean {
  return hayMarcaEquipo(request.headers.get("cookie"));
}

/** Producción real y no es una visita del equipo. */
export function debeRegistrar(request: ConHeaders): boolean {
  return esProduccionReal(request) && !esEquipo(request);
}

/** Log de lo que se habría escrito/enviado, cuando no se registra. */
export function simular(destino: string, datos: unknown, request: ConHeaders) {
  const motivo = esEquipo(request)
    ? "modo equipo"
    : `entorno ${process.env.VERCEL_ENV ?? "local"}, host ${hostDe(request)}`;
  console.log(`[SIMULADO] ${destino} — no se escribe (${motivo}):`, JSON.stringify(datos));
}
