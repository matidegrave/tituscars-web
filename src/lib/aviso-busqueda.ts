import { filtrosAParams, type Filtros } from "@/lib/filtros";
import { nombrePropio, normalizar } from "@/lib/busqueda";
import { formatMiles } from "@/lib/format";

/**
 * "Te lo buscamos" (tanda 49): un solo formulario en toda la web (sin
 * resultados, pie de las fichas y pie de /autos). Sin nombre ni celular: el
 * teléfono llega con el WhatsApp. Acá viven las opciones, el prellenado desde
 * la búsqueda/filtros y el mensaje que se arma. Sin JSX: lo usan también las
 * páginas del servidor.
 */

export type Origen = "sin_resultados" | "pie_ficha" | "pie_autos";

export const PRESUPUESTOS = [
  { valor: "10M", label: "$10M", monto: 10_000_000 },
  { valor: "15M", label: "$15M", monto: 15_000_000 },
  { valor: "20M", label: "$20M", monto: 20_000_000 },
  { valor: "30M", label: "$30M", monto: 30_000_000 },
  { valor: "40M+", label: "$40M+", monto: null },
  { valor: "no_se", label: "No sé", monto: null },
] as const;
export type Presupuesto = (typeof PRESUPUESTOS)[number]["valor"];

export const COMBUSTIBLES = ["Nafta", "Diésel", "GNC", "Híbrido", "Indistinto"] as const;
export const TRANSMISIONES = ["Manual", "Automática", "Indistinto"] as const;
export const CARROCERIAS = ["3p", "5p", "Sedán", "SUV", "Pick-up", "Indistinto"] as const;

export interface DatosAviso {
  modelo: string;
  anioDesde: number | null;
  anioHasta: number | null;
  presupuesto: Presupuesto | null;
  combustible: string | null;
  transmision: string | null;
  carroceria: string | null;
  /** null = no contestó. */
  entrega: boolean | null;
  /** El auto que entrega (tanda 49c): sólo con entrega = true, opcionales. */
  entregaModelo: string;
  entregaAnio: number | null;
  /** Sólo dígitos. */
  entregaKm: string;
  financia: boolean | null;
  detalle: string;
}

/** Lo que se sabe de la búsqueda: prellena el form y se guarda en datos. */
export interface Prellenado {
  datos: Partial<DatosAviso>;
  q?: string;
  /** Query string de los filtros activos ("marca=Toyota&precio_max=20000000"). */
  filtrosActivos?: string;
}

export const VACIO: DatosAviso = {
  modelo: "",
  anioDesde: null,
  anioHasta: null,
  presupuesto: null,
  combustible: null,
  transmision: null,
  carroceria: null,
  entrega: null,
  entregaModelo: "",
  entregaAnio: null,
  entregaKm: "",
  financia: null,
  detalle: "",
};

/** Años de los selects: del actual para atrás. */
export function aniosElegibles(hasta = new Date().getFullYear() + 1, desde = 1990): number[] {
  const lista: number[] = [];
  for (let a = hasta; a >= desde; a--) lista.push(a);
  return lista;
}

// Modelos que la gente busca sin la marca ("vento"): se completa la marca.
// Clave normalizada y sin espacios ni guiones.
const MARCA_DE_MODELO: Record<string, string> = {};
const sumarMarca = (marca: string, modelos: string[]) => {
  for (const m of modelos) MARCA_DE_MODELO[m] = marca;
};
sumarMarca("Volkswagen", ["vento", "virtus", "gol", "goltrend", "golf", "polo", "nivus", "tcross", "taos", "tiguan", "amarok", "saveiro", "up", "suran", "fox", "bora", "passat", "voyage", "sharan", "scirocco"]);
sumarMarca("Toyota", ["corolla", "corollacross", "hilux", "etios", "yaris", "sw4", "rav4", "camry", "prius"]);
sumarMarca("Chevrolet", ["onix", "prisma", "cruze", "tracker", "s10", "spin", "agile", "corsa", "classic", "celta", "trailblazer", "equinox", "montana", "sonic", "cobalt", "aveo", "astra", "vectra", "captiva"]);
sumarMarca("Ford", ["ka", "fiesta", "focus", "ecosport", "ranger", "territory", "kuga", "mondeo", "maverick", "bronco"]);
sumarMarca("Fiat", ["cronos", "argo", "mobi", "toro", "strada", "palio", "siena", "uno", "punto", "pulse", "fastback", "fiorino", "idea", "linea", "500", "ducato"]);
sumarMarca("Renault", ["sandero", "logan", "duster", "kangoo", "clio", "captur", "kwid", "stepway", "oroch", "alaskan", "fluence", "megane", "symbol", "koleos"]);
sumarMarca("Peugeot", ["208", "2008", "308", "3008", "408", "5008", "207", "206", "partner", "expert"]);
sumarMarca("Citroën", ["c3", "c4", "c4cactus", "c4lounge", "berlingo", "c3aircross", "ds3"]);
sumarMarca("Nissan", ["kicks", "versa", "sentra", "frontier", "march", "note", "xtrail", "tiida"]);
sumarMarca("Honda", ["civic", "fit", "city", "hrv", "crv", "wrv"]);
sumarMarca("Jeep", ["renegade", "compass", "commander", "wrangler", "cherokee"]);
sumarMarca("Hyundai", ["creta", "tucson", "hb20", "i10", "santafe"]);
sumarMarca("Kia", ["sportage", "cerato", "rio", "picanto", "seltos", "sorento"]);
sumarMarca("Mercedes-Benz", ["sprinter"]);
sumarMarca("RAM", ["1500", "rampage"]);

/** "vento" -> "Volkswagen Vento"; "toyota corolla" -> "Toyota Corolla". */
export function modeloDesdeTexto(texto: string, marcas: string[] = []): string {
  const limpio = texto.trim().replace(/\s+/g, " ");
  if (!limpio) return "";
  const lindo = nombrePropio(limpio);
  const norm = normalizar(limpio);
  if (marcas.length > 0) {
    const conMarca = marcas.map(nombrePropio).join(" ");
    return norm.includes(normalizar(conMarca)) ? lindo : `${conMarca} ${lindo}`;
  }
  const primera = norm.split(" ")[0] ?? "";
  const marca = MARCA_DE_MODELO[norm.replace(/[\s-]/g, "")] ?? MARCA_DE_MODELO[primera.replace(/-/g, "")];
  if (marca && !norm.includes(normalizar(marca))) return `${marca} ${lindo}`;
  return lindo;
}

function presupuestoDesde(min?: number, max?: number): Presupuesto | null {
  if (max) {
    const chip = PRESUPUESTOS.find((p) => p.monto !== null && p.monto >= max - 1);
    return chip ? chip.valor : "40M+";
  }
  if (min && min >= 40_000_000) return "40M+";
  return null;
}

function unico(valores: string[], mapa: Record<string, string>): string | null {
  if (valores.length !== 1) return null;
  return mapa[normalizar(valores[0])] ?? null;
}

/** Prellenado desde los filtros del catálogo (y la búsqueda de texto). */
export function prellenadoDesdeFiltros(f: Filtros, extra?: { textoBuscado?: string }): Prellenado {
  const marcas = f.marca;
  const texto = [f.modelo.join(" "), f.q ?? ""].filter(Boolean).join(" ");
  const modelo = texto
    ? modeloDesdeTexto(texto, marcas)
    : marcas.length > 0
      ? marcas.map(nombrePropio).join(" / ")
      : extra?.textoBuscado ?? "";
  const params = filtrosAParams({ ...f, q: undefined, orden: "recientes", page: 1 }).toString();
  return {
    datos: {
      modelo,
      anioDesde: f.anioMin ?? null,
      anioHasta: f.anioMax ?? null,
      presupuesto: presupuestoDesde(f.precioMin, f.precioMax),
      combustible: unico(f.combustible, { nafta: "Nafta", diesel: "Diésel", gnc: "GNC", hibrido: "Híbrido" }),
      transmision: unico(f.transmision, { manual: "Manual", automatica: "Automática" }),
      carroceria: unico(f.carroceria, { suv: "SUV", camioneta: "Pick-up" }),
    },
    q: f.q,
    filtrosActivos: params || undefined,
  };
}

function rangoAnios(d: DatosAviso): string | null {
  const { anioDesde: a, anioHasta: b } = d;
  if (a && b) return a === b ? String(a) : `${Math.min(a, b)} a ${Math.max(a, b)}`;
  if (a) return `desde ${a}`;
  if (b) return `hasta ${b}`;
  return null;
}

/** Mensaje de WhatsApp: ordenado, sin emojis y sólo con lo completado. */
export function construirMensaje(d: DatosAviso): string {
  const lineas = [`Hola, estoy buscando un ${d.modelo.trim()}.`];
  const anios = rangoAnios(d);
  if (anios) lineas.push(`Años: ${anios}`);
  const p = PRESUPUESTOS.find((x) => x.valor === d.presupuesto);
  if (p && p.valor === "40M+") lineas.push("Presupuesto: más de $40M");
  else if (p && p.monto) lineas.push(`Presupuesto: hasta ${p.label}`);
  const tecnica = [
    d.combustible && `Combustible: ${d.combustible}`,
    d.transmision && `Transmisión: ${d.transmision}`,
    d.carroceria && `Carrocería: ${d.carroceria}`,
  ].filter(Boolean);
  if (tecnica.length) lineas.push(tecnica.join(" · "));
  const sn = (v: boolean) => (v ? "Sí" : "No");
  // "Entrego: Gol Trend 1.6 2015, 120.000 km" si contó qué auto; si no, "Entrego un auto: Sí".
  const entrego = d.entrega ? autoQueEntrega(d) : "";
  if (entrego) lineas.push(`Entrego: ${entrego}`);
  const pago = [
    d.entrega !== null && !entrego && `Entrego un auto: ${sn(d.entrega)}`,
    d.financia !== null && `Financio: ${sn(d.financia)}`,
  ].filter(Boolean);
  if (pago.length) lineas.push(pago.join(" · "));
  if (d.detalle.trim()) lineas.push(`Detalle: ${d.detalle.trim().replace(/\s+/g, " ")}`);
  lineas.push("Avísenme si entra uno.");
  return lineas.join("\n");
}

function kmValido(d: DatosAviso): number | null {
  const n = Number(d.entregaKm);
  return d.entregaKm && n >= 0 && n <= 2_000_000 ? n : null;
}

function autoQueEntrega(d: DatosAviso): string {
  const modeloYAnio = [d.entregaModelo.trim().replace(/\s+/g, " "), d.entregaAnio].filter(Boolean).join(" ");
  const km = kmValido(d);
  return [modeloYAnio, km !== null ? `${formatMiles(km)} km` : ""].filter(Boolean).join(", ");
}

/** Sin JS (y como texto del link antes de hidratar): el mensaje simple de siempre. */
export function mensajeSimple(buscado: string): string {
  return `Hola, busco ${buscado ? `un ${buscado}` : "un auto"}. Avisenme si les entra uno.`;
}

/** Cuerpo para /api/busqueda-a-medida (mapeo de la tanda 49). */
export function cuerpoBusqueda(
  d: DatosAviso,
  extra: { origen: Origen; q?: string; filtrosActivos?: string; autoSlug?: string; pagina: string; trampa: string }
) {
  const p = PRESUPUESTOS.find((x) => x.valor === d.presupuesto);
  return {
    web: extra.trampa,
    modelos_buscados: d.modelo.trim().slice(0, 300),
    presupuesto_max: p?.monto ?? null,
    entrega_vehiculo: d.entrega === true,
    entrega_modelo: d.entrega ? d.entregaModelo.trim().slice(0, 120) || null : null,
    entrega_anio: d.entrega ? d.entregaAnio : null,
    entrega_km: d.entrega ? kmValido(d) : null,
    financia: d.financia === true,
    contado: false,
    origen: extra.origen,
    pagina: extra.pagina.slice(0, 300),
    auto_slug: extra.autoSlug?.slice(0, 200) ?? null,
    datos: {
      anio_desde: d.anioDesde,
      anio_hasta: d.anioHasta,
      presupuesto: d.presupuesto,
      combustible: d.combustible,
      transmision: d.transmision,
      carroceria: d.carroceria,
      detalle: d.detalle.trim().slice(0, 200) || null,
      q: extra.q?.slice(0, 100) ?? null,
      filtros_activos: extra.filtrosActivos?.slice(0, 500) ?? null,
    },
  };
}
