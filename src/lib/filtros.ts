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

// Motos (WEB-MOTOS1): otra escala de precios (hoy el stock de motos va de $5M
// a $8M); misma regla del "N - 1".
export const PRECIO_PRESETS_MOTOS: { label: string; min?: number; max?: number }[] = [
  { label: "Hasta $5M", min: undefined, max: 4_999_999 },
  { label: "$5M a $8M", min: 5_000_000, max: 7_999_999 },
  { label: "$8M a $12M", min: 8_000_000, max: 11_999_999 },
  { label: "Más de $12M", min: 12_000_000, max: undefined },
];

/**
 * Sección del catálogo (WEB-MOTOS1): /autos (todo menos motos) o /motos
 * (carroceria = 'moto'). No viaja en la query: la pone la página.
 */
export type Seccion = "autos" | "motos";

export function presetsPrecio(seccion?: Seccion) {
  return seccion === "motos" ? PRECIO_PRESETS_MOTOS : PRECIO_PRESETS;
}

/** Rangos de cilindrada de /motos (?cc=), uno a la vez. */
export const CILINDRADA_RANGOS: { value: string; label: string; min?: number; max?: number }[] = [
  { value: "hasta-150", label: "Hasta 150 cc", max: 150 },
  { value: "151-299", label: "151 a 299 cc", min: 151, max: 299 },
  { value: "300-599", label: "300 a 599 cc", min: 300, max: 599 },
  { value: "600-mas", label: "600 cc o más", min: 600 },
];

export const ORDEN_DEFECTO = "recientes";

export const OPCIONES_ORDEN: { value: string; label: string }[] = [
  { value: "recientes", label: "Más recientes" },
  { value: "precio_asc", label: "Menor precio" },
  { value: "precio_desc", label: "Mayor precio" },
  { value: "nuevos", label: "Año más nuevo" },
  { value: "km", label: "Menos km" },
  { value: "baja", label: "Bajaron de precio" },
  { value: "salon", label: "En salón primero" },
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
  /** Rango de cilindrada (CILINDRADA_RANGOS.value), sólo en /motos. */
  cc?: string;
  /** undefined = /autos. */
  seccion?: Seccion;
  /** Sólo autos con baja de precio reciente (?baja=1). */
  baja?: boolean;
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

/**
 * Montos (precio, km): sólo los dígitos, así un form sin JS puede mandar
 * "15.000.000" tal como se escribe.
 */
function aMonto(v?: string | string[]): number | undefined {
  const valor = Array.isArray(v) ? v[0] : v;
  const digitos = valor?.replace(/\D/g, "");
  return digitos ? Number(digitos) : undefined;
}

export function parseFiltros(sp: SearchParamsCatalogo, seccion?: Seccion): Filtros {
  // ?anio= viene del buscador de la home (un solo año) -> anio_min = anio_max
  const anioUnico = aNumero(sp.anio);
  const condicionRaw = Array.isArray(sp.condicion) ? sp.condicion[0] : sp.condicion;
  const ccRaw = Array.isArray(sp.cc) ? sp.cc[0] : sp.cc;
  const motos = seccion === "motos";

  return {
    q: (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() || undefined,
    marca: aArray(sp.marca),
    modelo: aArray(sp.modelo),
    anioMin: aNumero(sp.anio_min) ?? anioUnico,
    anioMax: aNumero(sp.anio_max) ?? anioUnico,
    precioMin: aMonto(sp.precio_min),
    precioMax: aMonto(sp.precio_max),
    kmMax: aMonto(sp.km_max),
    combustible: aArray(sp.combustible),
    transmision: aArray(sp.transmision),
    carroceria: aArray(sp.carroceria),
    condicion: condicionRaw === "usado" || condicionRaw === "0km" ? condicionRaw : undefined,
    cc: motos && CILINDRADA_RANGOS.some((r) => r.value === ccRaw) ? ccRaw : undefined,
    ...(motos ? { seccion } : {}),
    baja: (Array.isArray(sp.baja) ? sp.baja[0] : sp.baja) === "1" || undefined,
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
  if (f.cc) p.set("cc", f.cc);
  if (f.baja) p.set("baja", "1");
  if (f.orden && f.orden !== ORDEN_DEFECTO) p.set("orden", f.orden);
  if (f.page && f.page > 1) p.set("page", String(f.page));

  return p;
}

/**
 * URL del catálogo con estos filtros (página 1). Sin URLSearchParams.size: no
 * existe en Chrome < 113 ni Safari < 17, y ahí "size > 0" daba false y todos
 * los filtros navegaban a /autos pelado (bug de los filtros en Win7 / iOS 16).
 */
export function urlCatalogo(f: Filtros): string {
  const ruta = rutaCatalogo(f);
  const query = filtrosAParams({ ...f, page: 1 }).toString();
  return query ? `${ruta}?${query}` : ruta;
}

/** /autos o /motos según la sección de los filtros. */
export function rutaCatalogo(f: Pick<Filtros, "seccion">): "/autos" | "/motos" {
  return f.seccion === "motos" ? "/motos" : "/autos";
}

/** "auto"/"autos" o "moto"/"motos", para los textos del catálogo. */
export function nombreVehiculo(f: Pick<Filtros, "seccion">, cantidad = 2): string {
  const motos = f.seccion === "motos";
  return cantidad === 1 ? (motos ? "moto" : "auto") : motos ? "motos" : "autos";
}

/**
 * Campos ocultos para un <form method="get" action="/autos" o "/motos"> que cambia sólo
 * algunos filtros: todos los demás parámetros actuales (sin JS no se pierden).
 */
export function camposOcultos(f: Filtros, sin: string[]): [string, string][] {
  const p = filtrosAParams({ ...f, page: 1 });
  for (const clave of sin) p.delete(clave);
  return [...p.entries()];
}

export function filtrosVacios(seccion?: Seccion): Filtros {
  return {
    ...(seccion === "motos" ? { seccion } : {}),
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
  if (f.cc) n += 1;
  if (f.baja) n += 1;
  return n;
}

export function toggleEnArray(lista: string[], valor: string): string[] {
  return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];
}

