import type { Condicion } from "@/lib/types";

export const POR_PAGINA = 24;

// Rangos fijos de precio del catálogo, pensados para el stock real (cada uno
// agrupa ~10 autos). El máximo es "N - 1" para que un auto de exactamente
// $20M no caiga en dos rangos a la vez.
export const PRECIO_PRESETS: { label: string; min?: number; max?: number }[] = [
  { label: "Hasta $15M", min: undefined, max: 14_999_999 },
  { label: "$15M a $20M", min: 15_000_000, max: 19_999_999 },
  { label: "$20M a $25M", min: 20_000_000, max: 24_999_999 },
  { label: "$25M a $30M", min: 25_000_000, max: 29_999_999 },
  { label: "$30M a $40M", min: 30_000_000, max: 39_999_999 },
  { label: "Más de $40M", min: 40_000_000, max: undefined },
];

export const ORDEN_DEFECTO = "recientes";

export const OPCIONES_ORDEN: { value: string; label: string }[] = [
  { value: "recientes", label: "Más recientes" },
  { value: "precio_asc", label: "Menor precio" },
  { value: "precio_desc", label: "Mayor precio" },
  { value: "nuevos", label: "Año más nuevo" },
  { value: "km", label: "Menos km" },
  { value: "baja", label: "Bajaron de precio" },
];

export interface Filtros {
  q?: string;
  marca: string[];
  modelo: string[];
  anioMin?: number;
  anioMax?: number;
  precioMin?: number;
  precioMax?: number;
  kmMax?: number;
  combustible: string[];
  transmision: string[];
  carroceria: string[];
  condicion?: Condicion;
  /** Sólo autos con baja de precio reciente (?baja=1). */
  baja?: boolean;
  /**
   * La búsqueda viene del tipeo en vivo del celu (?vivo=1): filtra igual, pero
   * no muestra el chip hasta que se confirma con Enter o la lupa.
   */
  vivo?: boolean;
  orden: string;
  page: number;
}

// searchParams tal como llegan a un Server Component: cada valor puede ser
// string, string[] (si la key se repite en la URL) o undefined.
export type SearchParamsCatalogo = Record<string, string | string[] | undefined>;

function aArray(v?: string | string[]): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function aNumero(v?: string | string[]): number | undefined {
  const valor = Array.isArray(v) ? v[0] : v;
  if (!valor) return undefined;
  const n = Number(valor);
  return Number.isFinite(n) ? n : undefined;
}

export function parseFiltros(sp: SearchParamsCatalogo): Filtros {
  // ?anio= viene del buscador de la home (un solo año) -> anio_min = anio_max
  const anioUnico = aNumero(sp.anio);
  const condicionRaw = Array.isArray(sp.condicion) ? sp.condicion[0] : sp.condicion;

  return {
    q: (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() || undefined,
    marca: aArray(sp.marca),
    modelo: aArray(sp.modelo),
    anioMin: aNumero(sp.anio_min) ?? anioUnico,
    anioMax: aNumero(sp.anio_max) ?? anioUnico,
    precioMin: aNumero(sp.precio_min),
    precioMax: aNumero(sp.precio_max),
    kmMax: aNumero(sp.km_max),
    combustible: aArray(sp.combustible),
    transmision: aArray(sp.transmision),
    carroceria: aArray(sp.carroceria),
    condicion: condicionRaw === "usado" || condicionRaw === "0km" ? condicionRaw : undefined,
    baja: (Array.isArray(sp.baja) ? sp.baja[0] : sp.baja) === "1" || undefined,
    vivo: (Array.isArray(sp.vivo) ? sp.vivo[0] : sp.vivo) === "1" || undefined,
    orden: (Array.isArray(sp.orden) ? sp.orden[0] : sp.orden) || ORDEN_DEFECTO,
    page: Math.max(1, aNumero(sp.page) ?? 1),
  };
}

export function filtrosAParams(f: Filtros): URLSearchParams {
  const p = new URLSearchParams();

  if (f.q) p.set("q", f.q);
  for (const m of f.marca) p.append("marca", m);
  for (const m of f.modelo) p.append("modelo", m);
  if (f.anioMin) p.set("anio_min", String(f.anioMin));
  if (f.anioMax) p.set("anio_max", String(f.anioMax));
  if (f.precioMin) p.set("precio_min", String(f.precioMin));
  if (f.precioMax) p.set("precio_max", String(f.precioMax));
  if (f.kmMax) p.set("km_max", String(f.kmMax));
  for (const c of f.combustible) p.append("combustible", c);
  for (const t of f.transmision) p.append("transmision", t);
  for (const c of f.carroceria) p.append("carroceria", c);
  if (f.condicion) p.set("condicion", f.condicion);
  if (f.baja) p.set("baja", "1");
  if (f.q && f.vivo) p.set("vivo", "1");
  if (f.orden && f.orden !== ORDEN_DEFECTO) p.set("orden", f.orden);
  if (f.page && f.page > 1) p.set("page", String(f.page));

  return p;
}

export function filtrosVacios(): Filtros {
  return {
    marca: [],
    modelo: [],
    combustible: [],
    transmision: [],
    carroceria: [],
    orden: ORDEN_DEFECTO,
    page: 1,
  };
}

export function contarFiltrosActivos(f: Filtros): number {
  let n = 0;
  if (f.q) n += 1;
  n += f.marca.length;
  n += f.modelo.length;
  if (f.anioMin || f.anioMax) n += 1;
  if (f.precioMin || f.precioMax) n += 1;
  if (f.kmMax) n += 1;
  n += f.combustible.length;
  n += f.transmision.length;
  n += f.carroceria.length;
  if (f.condicion) n += 1;
  if (f.baja) n += 1;
  return n;
}

export function toggleEnArray(lista: string[], valor: string): string[] {
  return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];
}
