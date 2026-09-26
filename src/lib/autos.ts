import { cache } from "react";
import { supabase } from "@/lib/supabase";
import type { AutoCatalogo } from "@/lib/types";
import { POR_PAGINA, type Filtros } from "@/lib/filtros";
import { filtroBusqueda } from "@/lib/busqueda";
import { porcentajeBaja } from "@/lib/format";
import type { FacetRow } from "@/lib/facets";

const TABLA = "catalogo_publico";

// Los señados no se muestran en la web (ni catálogo, ni home, ni ficha, ni
// sitemap): cada consulta a la vista los excluye con .neq("estado", "senado").

export async function getTotalEnStock(): Promise<number> {
  const { count } = await supabase.from(TABLA).select("*", { count: "exact", head: true }).neq("estado", "senado");
  return count ?? 0;
}

export interface AutoParaSitemap {
  slug: string;
  actualizado_en: string;
}

/** Slug + fecha de actualización de cada auto, para el sitemap (tanda 7). */
export async function getAutosParaSitemap(): Promise<AutoParaSitemap[]> {
  const { data } = await supabase.from(TABLA).select("slug, actualizado_en").neq("estado", "senado");
  return data ?? [];
}

export async function getDestacados(limite = 8): Promise<AutoCatalogo[]> {
  const { data: destacados } = await supabase
    .from(TABLA)
    .select("*")
    .neq("estado", "senado")
    .eq("destacado_web", true)
    .order("fecha_ingreso", { ascending: false })
    .limit(limite);

  if (destacados && destacados.length > 0) {
    return destacados;
  }

  const { data: recientes } = await supabase
    .from(TABLA)
    .select("*")
    .neq("estado", "senado")
    .order("fecha_ingreso", { ascending: false })
    .limit(limite);

  return recientes ?? [];
}

export async function getUltimosIngresos(limite = 12): Promise<AutoCatalogo[]> {
  const { data } = await supabase
    .from(TABLA)
    .select("*")
    .neq("estado", "senado")
    .order("fecha_ingreso", { ascending: false })
    .limit(limite);

  return data ?? [];
}

export async function getAnios(): Promise<number[]> {
  const { data } = await supabase.from(TABLA).select("anio").neq("estado", "senado");
  const set = new Set((data ?? []).map((r) => r.anio as number));
  return Array.from(set).sort((a, b) => b - a);
}

export interface ResultadoCatalogo {
  autos: AutoCatalogo[];
  total: number;
}

export async function getAutosPaginados(filtros: Filtros): Promise<ResultadoCatalogo> {
  let query = supabase.from(TABLA).select("*", { count: "exact" }).neq("estado", "senado");

  // Búsqueda flexible sobre la columna `busqueda` (ver lib/busqueda.ts).
  const busqueda = filtroBusqueda(filtros.q);
  if (busqueda) query = query.or(busqueda);

  if (filtros.marca.length > 0) query = query.in("marca", filtros.marca);
  if (filtros.modelo.length > 0) query = query.in("modelo", filtros.modelo);
  if (filtros.anioMin) query = query.gte("anio", filtros.anioMin);
  if (filtros.anioMax) query = query.lte("anio", filtros.anioMax);
  if (filtros.precioMin) query = query.gte("precio_ars", filtros.precioMin);
  if (filtros.precioMax) query = query.lte("precio_ars", filtros.precioMax);
  if (filtros.kmMax) query = query.lte("km", filtros.kmMax);
  if (filtros.combustible.length > 0) query = query.in("combustible", filtros.combustible);
  if (filtros.transmision.length > 0) query = query.in("transmision", filtros.transmision);
  if (filtros.carroceria.length > 0) query = query.in("carroceria", filtros.carroceria);
  if (filtros.condicion) query = query.eq("condicion", filtros.condicion);
  if (filtros.baja) query = query.not("precio_anterior", "is", null);

  const desde = (filtros.page - 1) * POR_PAGINA;
  const hasta = desde + POR_PAGINA - 1;

  // "Bajaron de precio": primero los que bajaron, por % de baja; después el
  // resto por fecha. El % no es una columna, así que se ordena acá: se traen
  // todos los que pasan los filtros (el catálogo es chico) y se pagina en JS.
  if (filtros.orden === "baja") {
    const { data } = await query
      .order("fecha_ingreso", { ascending: false })
      .order("id", { ascending: true });
    const autos = ((data ?? []) as AutoCatalogo[])
      .map((auto, i) => ({ auto, i, pct: porcentajeBaja(auto) }))
      .sort((a, b) => b.pct - a.pct || a.i - b.i)
      .map((x) => x.auto);
    return { autos: autos.slice(desde, hasta + 1), total: autos.length };
  }

  switch (filtros.orden) {
    case "precio_asc":
      query = query.order("precio_ars", { ascending: true });
      break;
    case "precio_desc":
      query = query.order("precio_ars", { ascending: false });
      break;
    case "nuevos":
      query = query.order("anio", { ascending: false });
      break;
    case "km":
      query = query.order("km", { ascending: true });
      break;
    default:
      // Por defecto: lo último que se subió primero.
      query = query.order("fecha_ingreso", { ascending: false });
  }

  // Desempate estable: sin esto, autos con el mismo precio/fecha pueden
  // repetirse o saltearse entre tandas del scroll infinito.
  query = query.order("id", { ascending: true });

  const { data, count } = await query.range(desde, hasta);

  return { autos: data ?? [], total: count ?? 0 };
}

/** Autos con baja de precio reciente, de mayor a menor % de baja (home). */
export async function getAutosConBaja(limite = 8): Promise<AutoCatalogo[]> {
  const { data } = await supabase
    .from(TABLA)
    .select("*")
    .neq("estado", "senado")
    .not("precio_anterior", "is", null);
  return ((data ?? []) as AutoCatalogo[])
    .sort((a, b) => porcentajeBaja(b) - porcentajeBaja(a))
    .slice(0, limite);
}

export async function getFacetsBase(): Promise<FacetRow[]> {
  const { data } = await supabase
    .from(TABLA)
    .select("marca, modelo, combustible, transmision, carroceria").neq("estado", "senado");

  return data ?? [];
}

// cache(): generateMetadata y la página de la ficha piden el mismo auto en la
// misma request; así se consulta una sola vez.
export const getAutoPorSlug = cache(
  async (slug: string): Promise<AutoCatalogo | null> => {
    const { data } = await supabase
      .from(TABLA)
      .select("*")
      .neq("estado", "senado")
      .eq("slug", slug)
      .maybeSingle();

    return data;
  }
);

/**
 * Slug actual de un auto a partir de un slug viejo. El slug se arma con
 * marca + modelo + versión + año + los primeros 6 caracteres del id, así que
 * si se edita el auto cambia todo menos ese sufijo: se busca el auto cuyo slug
 * termina igual y cuyo id empieza con él. Solo si hay exactamente uno.
 */
export const getSlugActualPorSufijo = cache(
  async (slugViejo: string): Promise<string | null> => {
    const sufijo = slugViejo.match(/-([0-9a-f]{6})$/i)?.[1]?.toLowerCase();
    if (!sufijo) return null;

    const { data } = await supabase
      .from(TABLA)
      .select("id, slug")
      .neq("estado", "senado")
      .like("slug", `%-${sufijo}`)
      .limit(2);

    const candidatos = (data ?? []).filter((a) => String(a.id).startsWith(sufijo));
    return candidatos.length === 1 ? (candidatos[0].slug as string) : null;
  }
);

function aSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Autos para ofrecer en el 404 de una ficha (auto vendido o despublicado). El
 * auto ya no está en la vista, así que no hay precio para comparar: la marca
 * y el modelo se sacan del slug viejo. Primero mismo modelo, después misma
 * marca y, si no alcanza, los últimos ingresos.
 */
export async function getSimilaresParaSlug(
  slugViejo: string,
  limite = 4
): Promise<AutoCatalogo[]> {
  const { data } = await supabase
    .from(TABLA)
    .select("*")
    .neq("estado", "senado")
    .order("fecha_ingreso", { ascending: false });
  const autos = (data ?? []) as AutoCatalogo[];

  const slug = aSlug(slugViejo);
  const deLaMarca = autos.filter((a) => slug.startsWith(`${aSlug(a.marca)}-`));
  const delModelo = deLaMarca.filter((a) =>
    slug.startsWith(`${aSlug(a.marca)}-${aSlug(a.modelo)}-`)
  );

  const resultado: AutoCatalogo[] = [];
  for (const auto of [...delModelo, ...deLaMarca, ...autos]) {
    if (resultado.length >= limite) break;
    if (!resultado.some((r) => r.id === auto.id)) resultado.push(auto);
  }
  return resultado;
}

export async function getSimilares(
  auto: AutoCatalogo,
  limite = 4
): Promise<AutoCatalogo[]> {
  const resultado: AutoCatalogo[] = [];
  const idsUsados = new Set<string>([auto.id]);

  const { data: porMarca } = await supabase
    .from(TABLA)
    .select("*")
    .neq("estado", "senado")
    .eq("marca", auto.marca)
    .neq("id", auto.id)
    .order("fecha_ingreso", { ascending: false })
    .limit(limite);

  for (const item of porMarca ?? []) {
    resultado.push(item);
    idsUsados.add(item.id);
  }

  if (resultado.length < limite && auto.carroceria) {
    const { data: porCarroceria } = await supabase
      .from(TABLA)
      .select("*")
      .neq("estado", "senado")
      .eq("carroceria", auto.carroceria)
      .neq("id", auto.id)
      .order("fecha_ingreso", { ascending: false })
      .limit(limite);

    for (const item of porCarroceria ?? []) {
      if (resultado.length >= limite) break;
      if (idsUsados.has(item.id)) continue;
      resultado.push(item);
      idsUsados.add(item.id);
    }
  }

  if (resultado.length < limite) {
    const { data: recientes } = await supabase
      .from(TABLA)
      .select("*")
      .neq("estado", "senado")
      .neq("id", auto.id)
      .order("fecha_ingreso", { ascending: false })
      .limit(limite + idsUsados.size);

    for (const item of recientes ?? []) {
      if (resultado.length >= limite) break;
      if (idsUsados.has(item.id)) continue;
      resultado.push(item);
      idsUsados.add(item.id);
    }
  }

  return resultado.slice(0, limite);
}
