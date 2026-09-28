/**
 * Páginas para Google (tanda 42): /usados/[slug]. Cada una es un filtro fijo
 * del catálogo con su propio H1, title, description y texto:
 * - marca: /usados/toyota (la marca se reconoce por el slug);
 * - carrocería: /usados/camionetas, /suv, /utilitarios, /autos;
 * - caja y combustible: /usados/automaticos, /gnc, /diesel;
 * - precio: /usados/hasta-10-millones ... hasta-30-millones (precio_ars).
 * Siempre sólo usados (condicion=usado): el título lo promete.
 * Con 0 o 1 auto la página existe igual (noindex, parecidos y aviso): una URL
 * que estuvo en el sitemap nunca da 404.
 */

import type { AutoCatalogo, Carroceria } from "@/lib/types";
import { filtrosVacios, urlCatalogo, type Filtros } from "@/lib/filtros";

export const MINIMO_INDEXABLE = 2;
export const TOPES_MILLONES = [10, 15, 20, 30] as const;

export type PaginaUsados =
  | { tipo: "marca"; slug: string; marca: string }
  | {
      tipo: "carroceria";
      slug: string;
      carroceria: NonNullable<Carroceria>;
      nombre: string;
    }
  | { tipo: "automaticos"; slug: "automaticos" }
  | {
      tipo: "combustible";
      slug: "gnc" | "diesel";
      combustible: "GNC" | "Diesel";
    }
  | { tipo: "precio"; slug: string; millones: number };

const CARROCERIAS: Record<
  string,
  { carroceria: NonNullable<Carroceria>; nombre: string }
> = {
  camionetas: { carroceria: "camioneta", nombre: "Camionetas" },
  suv: { carroceria: "suv", nombre: "SUV" },
  utilitarios: { carroceria: "utilitario", nombre: "Utilitarios" },
  autos: { carroceria: "auto", nombre: "Autos" },
};

/** "Mercedes Benz" -> "mercedes-benz". */
export function slugMarca(marca: string): string {
  return marca
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** "mercedes-benz" -> "Mercedes Benz" (para una marca que hoy no está en stock). */
export function nombreDesdeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

/** Las páginas fijas (sin las marcas), en el orden de los links. */
export function paginasFijas(): PaginaUsados[] {
  return [
    ...Object.entries(CARROCERIAS).map(([slug, c]) => ({
      tipo: "carroceria" as const,
      slug,
      ...c,
    })),
    { tipo: "automaticos", slug: "automaticos" },
    { tipo: "combustible", slug: "gnc", combustible: "GNC" },
    { tipo: "combustible", slug: "diesel", combustible: "Diesel" },
    ...TOPES_MILLONES.map((m) => ({
      tipo: "precio" as const,
      slug: `hasta-${m}-millones`,
      millones: m,
    })),
  ];
}

/**
 * Qué página es un slug. `marcas`: las marcas en stock (para reconocerlas
 * con su nombre real). Un slug con forma de marca que hoy no está en stock
 * también es página (noindex): pudo haber estado en el sitemap.
 * null = no es una URL posible (404).
 */
export function resolverPagina(
  slug: string,
  marcas: string[],
): PaginaUsados | null {
  const fija = paginasFijas().find((p) => p.slug === slug);
  if (fija) return fija;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 30) return null;
  const marca =
    marcas.find((m) => slugMarca(m) === slug) ?? nombreDesdeSlug(slug);
  return { tipo: "marca", slug, marca };
}

/** Los filtros del catálogo equivalentes ("Ver todos con filtros"). */
export function filtrosDe(p: PaginaUsados): Filtros {
  const f: Filtros = { ...filtrosVacios(), condicion: "usado" };
  switch (p.tipo) {
    case "marca":
      return { ...f, marca: [p.marca] };
    case "carroceria":
      return { ...f, carroceria: [p.carroceria] };
    case "automaticos":
      return { ...f, transmision: ["automatica"] };
    case "combustible":
      return { ...f, combustible: [p.combustible] };
    case "precio":
      return { ...f, precioMax: p.millones * 1_000_000 };
  }
}

export function hrefCatalogo(p: PaginaUsados): string {
  return urlCatalogo(filtrosDe(p));
}

/** ¿Este auto va en esa página? (para el sitemap y los links, sin consultar de nuevo). */
export function coincide(
  a: Pick<
    AutoCatalogo,
    | "marca"
    | "carroceria"
    | "transmision"
    | "combustible"
    | "precio_ars"
    | "condicion"
  >,
  p: PaginaUsados,
): boolean {
  if (a.condicion !== "usado") return false;
  switch (p.tipo) {
    case "marca":
      return slugMarca(a.marca) === p.slug;
    case "carroceria":
      return a.carroceria === p.carroceria;
    case "automaticos":
      return a.transmision === "automatica";
    case "combustible":
      return a.combustible === p.combustible;
    case "precio":
      return a.precio_ars <= p.millones * 1_000_000;
  }
}

/** "Toyota usados", "Camionetas usadas", "Autos usados hasta 15 millones". */
export function nombrePagina(p: PaginaUsados): string {
  switch (p.tipo) {
    case "marca":
      return `${p.marca} usados`;
    case "carroceria":
      return p.carroceria === "camioneta"
        ? "Camionetas usadas"
        : `${p.nombre} usados`;
    case "automaticos":
      return "Autos automáticos usados";
    case "combustible":
      return p.combustible === "GNC"
        ? "Autos usados con GNC"
        : "Autos diésel usados";
    case "precio":
      return `Autos usados hasta ${p.millones} millones`;
  }
}

/** Texto corto de los links ("Toyota", "Camionetas", "Hasta $15 M"). */
export function etiquetaLink(p: PaginaUsados): string {
  switch (p.tipo) {
    case "marca":
      return p.marca;
    case "carroceria":
      return p.nombre;
    case "automaticos":
      return "Automáticos";
    case "combustible":
      return p.combustible === "GNC" ? "Con GNC" : "Diésel";
    case "precio":
      return `Hasta $${p.millones} M`;
  }
}

export const hrefPagina = (p: PaginaUsados) => `/usados/${p.slug}`;

type AutoParaConteo = Parameters<typeof coincide>[0] & {
  actualizado_en: string;
};

export interface PaginaConStock {
  pagina: PaginaUsados;
  cantidad: number;
  /** actualizado_en del auto más reciente de la página. */
  ultimo: string | null;
}

/**
 * Todas las páginas posibles hoy (las fijas y una por marca en stock) con su
 * cantidad de autos. Las marcas, de la que más autos tiene a la que menos.
 */
export function paginasConStock(autos: AutoParaConteo[]): PaginaConStock[] {
  const marcas = [
    ...new Set(
      autos.filter((a) => a.condicion === "usado").map((a) => a.marca),
    ),
  ];
  const paginas: PaginaUsados[] = [
    ...paginasFijas(),
    ...marcas.map((marca) => ({
      tipo: "marca" as const,
      slug: slugMarca(marca),
      marca,
    })),
  ];
  const conStock = paginas.map((pagina) => {
    const suyos = autos.filter((a) => coincide(a, pagina));
    const ultimo = suyos.reduce<string | null>(
      (max, a) => (!max || a.actualizado_en > max ? a.actualizado_en : max),
      null,
    );
    return { pagina, cantidad: suyos.length, ultimo };
  });
  const fijas = conStock.filter((p) => p.pagina.tipo !== "marca");
  const deMarca = conStock
    .filter((p) => p.pagina.tipo === "marca")
    .sort((a, b) => b.cantidad - a.cantidad);
  return [...fijas, ...deMarca];
}
