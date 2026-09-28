/**
 * Del listado a la ficha (tanda 40), en sessionStorage con try/catch: la
 * card tocada (posición, foto y título), para medir la posición en
 * vista_auto y mostrar la foto al instante.
 * (La lista para "Anterior / Siguiente" se sacó en la tanda 43.)
 */

const CLAVE_ENTRADA = "tc_entrada_ficha";
const VIGENCIA_ENTRADA_MS = 60 * 1000;

export interface EntradaFicha {
  slug: string;
  /** Sólo desde el listado /autos (1 = primera card). */
  posicion?: number;
  foto?: string;
  titulo?: string;
  ts: number;
}

/** Borra la lista de "Anterior / Siguiente" que guardaba la tanda 40. */
export function borrarRecorridoViejo() {
  try {
    sessionStorage.removeItem("tc_recorrido");
  } catch {
    // nada
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
