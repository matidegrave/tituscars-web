import { track } from "@/lib/tracking";

/**
 * Favoritos sin cuenta (tanda 40): en localStorage (try/catch), con una foto
 * de lo necesario para mostrarlos aunque el auto ya no esté en stock.
 * Cambios -> evento "titus:favoritos" (mismo tab) y "storage" (otros tabs).
 */

const CLAVE = "tc_favoritos";
export const EVENTO_FAVORITOS = "titus:favoritos";

export interface Favorito {
  id: string;
  slug: string;
  /** "RENAULT LOGAN INTENSE 1.6" */
  titulo: string;
  anio: number;
  /** Precio ya formateado ("$ 19.000.000"). */
  precio: string;
  foto?: string | null;
  ts: number;
}

let cache: { raw: string | null; lista: Favorito[] } = { raw: null, lista: [] };

export function leerFavoritos(): Favorito[] {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (raw === cache.raw) return cache.lista;
    const lista = raw ? (JSON.parse(raw) as Favorito[]) : [];
    cache = { raw, lista: Array.isArray(lista) ? lista : [] };
    return cache.lista;
  } catch {
    return cache.lista;
  }
}

function guardar(lista: Favorito[]) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista));
  } catch {
    // sin localStorage: queda sólo en memoria hasta recargar
    cache = { raw: null, lista };
  }
  window.dispatchEvent(new Event(EVENTO_FAVORITOS));
}

export function esFavorito(id: string): boolean {
  return leerFavoritos().some((f) => f.id === id);
}

/** Agrega o saca; devuelve si quedó guardado. Registra el evento 'favorito'. */
export function alternarFavorito(f: Omit<Favorito, "ts">): boolean {
  const lista = leerFavoritos();
  const estaba = lista.some((x) => x.id === f.id);
  guardar(estaba ? lista.filter((x) => x.id !== f.id) : [{ ...f, ts: Date.now() }, ...lista]);
  track("favorito", { detalle: estaba ? "quitar" : "agregar", auto_id: f.id, slug: f.slug });
  return !estaba;
}

export function quitarFavorito(id: string) {
  const lista = leerFavoritos();
  const f = lista.find((x) => x.id === id);
  if (!f) return;
  guardar(lista.filter((x) => x.id !== id));
  track("favorito", { detalle: "quitar", auto_id: id, slug: f.slug });
}

/** Para useSyncExternalStore: cambios en este tab y en otros. */
export function suscribirFavoritos(avisar: () => void): () => void {
  const alStorage = (e: StorageEvent) => {
    if (e.key === CLAVE) avisar();
  };
  window.addEventListener(EVENTO_FAVORITOS, avisar);
  window.addEventListener("storage", alStorage);
  return () => {
    window.removeEventListener(EVENTO_FAVORITOS, avisar);
    window.removeEventListener("storage", alStorage);
  };
}
