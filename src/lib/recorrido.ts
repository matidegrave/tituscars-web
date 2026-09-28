/**
 * Del listado a la ficha (tanda 40), todo en sessionStorage con try/catch:
 * - recorrido: los slugs en el orden en que se mostraban (con su clave de
 *   filtros), para "‹ Anterior · 3 de 23 · Siguiente ›" en la ficha;
 * - entrada: la card tocada (posición, foto y título), para medir la
 *   posición en vista_auto y mostrar la foto al instante.
 */

const CLAVE_RECORRIDO = "tc_recorrido";
const CLAVE_ENTRADA = "tc_entrada_ficha";
const VIGENCIA_RECORRIDO_MS = 60 * 60 * 1000;
const VIGENCIA_ENTRADA_MS = 60 * 1000;

export interface Recorrido {
  slugs: string[];
  /** filtrosAParams(...).toString() del listado. */
  clave: string;
  ts: number;
}

export interface EntradaFicha {
  slug: string;
  /** Sólo desde el listado /autos (1 = primera card). */
  posicion?: number;
  foto?: string;
  titulo?: string;
  ts: number;
}

export function guardarRecorrido(slugs: string[], clave: string) {
  try {
    sessionStorage.setItem(CLAVE_RECORRIDO, JSON.stringify({ slugs, clave, ts: Date.now() } satisfies Recorrido));
  } catch {
    // sin sessionStorage: la ficha no muestra anterior/siguiente
  }
}

export function leerRecorrido(): Recorrido | null {
  try {
    const r = JSON.parse(sessionStorage.getItem(CLAVE_RECORRIDO) ?? "null") as Recorrido | null;
    return r && Array.isArray(r.slugs) && Date.now() - r.ts < VIGENCIA_RECORRIDO_MS ? r : null;
  } catch {
    return null;
  }
}

// Copia en memoria: la galería de la ficha la lee al montarse (navegación
// del lado del cliente) sin esperar un efecto.
let entradaEnMemoria: EntradaFicha | null = null;

export function guardarEntrada(e: Omit<EntradaFicha, "ts">) {
  entradaEnMemoria = { ...e, ts: Date.now() };
  try {
    sessionStorage.setItem(CLAVE_ENTRADA, JSON.stringify({ ...e, ts: Date.now() }));
  } catch {
    // nada
  }
}

/** La entrada de esta ficha (si se llegó tocando una card hace poco). Se consume. */
export function tomarEntrada(slug: string): EntradaFicha | null {
  try {
    const e = JSON.parse(sessionStorage.getItem(CLAVE_ENTRADA) ?? "null") as EntradaFicha | null;
    if (!e || e.slug !== slug || Date.now() - e.ts > VIGENCIA_ENTRADA_MS) return null;
    sessionStorage.removeItem(CLAVE_ENTRADA);
    return e;
  } catch {
    return null;
  }
}

/** La foto de la card tocada para esta ficha (sin consumir la entrada). */
export function fotoDeEntrada(slug: string): string | undefined {
  const e = entradaEnMemoria;
  return e && e.slug === slug && Date.now() - e.ts < VIGENCIA_ENTRADA_MS ? e.foto : undefined;
}
