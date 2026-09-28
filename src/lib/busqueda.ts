/**
 * Búsqueda flexible del catálogo sobre la columna `busqueda` de la vista
 * catalogo_publico: marca + modelo + versión + año, en minúscula, sin acentos
 * y sin nada que no sea a-z0-9 (ej. "volkswagentcrosstrendline16msi110cv2020").
 *
 * Un auto coincide si `busqueda` contiene el texto buscado compactado entero
 * ("t cross" -> "tcross") o si contiene todos sus tokens por separado ("trend
 * gol" también encuentra el Gol Trend).
 */

/** Alias -> como figura en `busqueda`. Para sumar uno, agregarlo acá. */
export const SINONIMOS: Record<string, string> = {
  vw: "volkswagen",
  chevy: "chevrolet",
  mb: "mercedesbenz",
  mercedes: "mercedesbenz",
  citroen: "citroen",
  peugeot: "peugeot",
};

/** Minúscula, sin acentos y todo lo que no sea a-z0-9 pasa a ser espacio. */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export interface Busqueda {
  /** Todo junto, sin espacios: "t cross" -> "tcross". */
  compacto: string;
  /** Tokens para el modo "contiene todos" (sin los de 1 carácter, salvo que sea el único). */
  tokens: string[];
}

export function prepararBusqueda(q: string | null | undefined): Busqueda | null {
  const todos = normalizar(q ?? "")
    .split(" ")
    .filter(Boolean)
    .map((token) => SINONIMOS[token] ?? token);
  if (todos.length === 0) return null;

  const tokens = todos.length === 1 ? todos : todos.filter((t) => t.length > 1);
  return { compacto: todos.join(""), tokens };
}

// Después de normalizar solo quedan a-z0-9, así que % y _ ya no pueden
// llegar; se escapan igual por si cambia la normalización.
function escaparLike(texto: string): string {
  return texto.replace(/[%_\\]/g, (c) => `\\${c}`);
}

/** Filtro para supabase-js `.or(...)`, o null si no hay nada para buscar. */
export function filtroBusqueda(q: string | null | undefined): string | null {
  const busqueda = prepararBusqueda(q);
  if (!busqueda) return null;

  const condiciones = [`busqueda.ilike.%${escaparLike(busqueda.compacto)}%`];
  const soloElCompacto = busqueda.tokens.length === 1 && busqueda.tokens[0] === busqueda.compacto;
  if (busqueda.tokens.length > 0 && !soloElCompacto) {
    const todos = busqueda.tokens.map((t) => `busqueda.ilike.%${escaparLike(t)}%`);
    condiciones.push(todos.length === 1 ? todos[0] : `and(${todos.join(",")})`);
  }
  return condiciones.join(",");
}

/** La misma regla que filtroBusqueda, en JS (para probarla sin la base). */
export function coincide(busquedaAuto: string, q: string | null | undefined): boolean {
  const busqueda = prepararBusqueda(q);
  if (!busqueda) return true;
  if (busquedaAuto.includes(busqueda.compacto)) return true;
  return busqueda.tokens.length > 0 && busqueda.tokens.every((t) => busquedaAuto.includes(t));
}

// ─── Palabras que son filtros (tanda 39) ────────────────────────────────────
// "camioneta diesel" no busca ese texto: aplica carroceria=camioneta y
// combustible=Diesel, y busca como texto lo que sobre ("hilux automatica" ->
// transmision=automatica + "hilux"). Sin tildes, mayúsculas ni plural.

export interface FiltrosDePalabras {
  carroceria: string[];
  transmision: string[];
  combustible: string[];
  condicion?: "0km" | "usado";
}

type Palabra = Partial<{ carroceria: string; transmision: string; combustible: string; condicion: "0km" | "usado" }>;

const PALABRAS: Record<string, Palabra> = {};
const agregar = (palabras: string[], filtro: Palabra) => {
  for (const p of palabras) PALABRAS[p] = filtro;
};
agregar(["camioneta", "camionetas", "pickup", "pickups"], { carroceria: "camioneta" });
agregar(["suv", "suvs"], { carroceria: "suv" });
agregar(["utilitario", "utilitarios", "furgon", "furgones"], { carroceria: "utilitario" });
agregar(["auto", "autos", "sedan", "sedanes", "hatch", "hatchback", "hatchbacks"], { carroceria: "auto" });
agregar(["moto", "motos"], { carroceria: "moto" });
agregar(
  ["automatico", "automaticos", "automatica", "automaticas", "at", "cvt"],
  { transmision: "automatica" }
);
agregar(["manual", "manuales"], { transmision: "manual" });
agregar(["gnc"], { combustible: "GNC" });
agregar(["diesel", "gasoil"], { combustible: "Diesel" });
agregar(["nafta", "naftero", "naftera"], { combustible: "Nafta" });
agregar(["0km", "nuevo", "nuevos", "nueva", "nuevas"], { condicion: "0km" });
agregar(["usado", "usados", "usada", "usadas"], { condicion: "usado" });

/** Separa de la búsqueda las palabras que son filtros. */
export function interpretarBusqueda(q: string | null | undefined): {
  filtros: FiltrosDePalabras;
  resto: string;
  hayFiltros: boolean;
} {
  // "pick up" y "0 km" vienen en dos palabras: se juntan antes de mirar.
  const tokens = normalizar(q ?? "")
    .replace(/\bpick ups?\b/g, (m) => m.replace(" ", ""))
    .replace(/\b0 km\b/g, "0km")
    .split(" ")
    .filter(Boolean);
  const filtros: FiltrosDePalabras = { carroceria: [], transmision: [], combustible: [] };
  const resto: string[] = [];
  let hayFiltros = false;
  const sumar = (lista: string[], valor?: string) => {
    if (valor && !lista.includes(valor)) lista.push(valor);
  };
  for (const token of tokens) {
    const p = PALABRAS[token];
    if (!p) {
      resto.push(token);
      continue;
    }
    hayFiltros = true;
    sumar(filtros.carroceria, p.carroceria);
    sumar(filtros.transmision, p.transmision);
    sumar(filtros.combustible, p.combustible);
    if (p.condicion) filtros.condicion = p.condicion;
  }
  return { filtros, resto: resto.join(" "), hayFiltros };
}

// ─── "¿Quisiste decir…?" (tanda 39) ─────────────────────────────────────────

/** Distancia de edición (Levenshtein), con corte temprano si supera `tope`. */
export function distancia(a: string, b: string, tope = 3): number {
  if (Math.abs(a.length - b.length) > tope) return tope + 1;
  let previa = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const fila = [i];
    let minimo = i;
    for (let j = 1; j <= b.length; j++) {
      const valor = Math.min(previa[j] + 1, fila[j - 1] + 1, previa[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      fila.push(valor);
      if (valor < minimo) minimo = valor;
    }
    if (minimo > tope) return tope + 1;
    previa = fila;
  }
  return previa[b.length];
}

/** "GOL TREND" -> "Gol Trend", "T-CROSS" -> "T-Cross". */
export function nombrePropio(texto: string): string {
  return texto.toLowerCase().replace(/(^|[\s-])([a-záéíóúñ0-9])/g, (_, sep: string, c: string) => sep + c.toUpperCase());
}

export interface Candidato {
  /** Como se muestra y se busca: "Gol Trend", "Nissan". */
  texto: string;
  cantidad: number;
}

/**
 * La marca o modelo en stock más parecido a lo buscado: distancia de edición
 * <= 2 sobre el texto compactado, o que empiece igual. null si nada se parece.
 */
export function sugerirCorreccion(q: string, candidatos: Candidato[]): Candidato | null {
  const buscado = normalizar(q).replace(/ /g, "");
  if (buscado.length < 3) return null;
  let mejor: { c: Candidato; d: number } | null = null;
  for (const c of candidatos) {
    const compacto = normalizar(c.texto).replace(/ /g, "");
    if (!compacto || compacto === buscado) continue;
    // Primero la distancia real; "empieza igual" sólo como respaldo (vale
    // menos que un error de 2 letras: "gol trens" -> "Gol Trend", no "Gol").
    let d = distancia(buscado, compacto, 2);
    if (d > 2 && (compacto.startsWith(buscado) || buscado.startsWith(compacto))) d = 2.5;
    if (d > 2.5) continue;
    if (!mejor || d < mejor.d || (d === mejor.d && c.cantidad > mejor.c.cantidad)) mejor = { c, d };
  }
  return mejor?.c ?? null;
}

// ─── "Estos se le parecen" (tanda 39) ───────────────────────────────────────

/** Modelos que hoy no suelen estar en stock -> carrocería para mostrar parecidos. */
const CARROCERIA_DE_MODELO: [string[], string][] = [
  [["nivus", "tcross", "taos", "tiguan", "captur", "kicks", "tracker", "creta", "hrv"], "suv"],
  [["vento", "virtus", "cronos", "versa", "corolla"], "auto"],
  [["hiace", "kangoo", "partner", "berlingo", "master"], "utilitario"],
  [["hilux", "amarok", "ranger", "s10", "frontier", "toro"], "camioneta"],
];

export function carroceriaParecida(q: string): string | null {
  const buscado = normalizar(q).replace(/ /g, "");
  if (!buscado) return null;
  for (const [modelos, carroceria] of CARROCERIA_DE_MODELO) {
    if (modelos.some((m) => buscado.includes(m))) return carroceria;
  }
  return null;
}
