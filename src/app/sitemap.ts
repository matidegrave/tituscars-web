import type { MetadataRoute } from "next";
import { getAutosParaSitemap } from "@/lib/autos";
import { SITE_URL } from "@/lib/config";
import { getResumenStock } from "@/lib/autos";
import { MINIMO_INDEXABLE, hrefPagina, paginasConStock } from "@/lib/usados";

// Fecha del último cambio de contenido de cada página institucional (de git).
// Actualizarla al editar el texto de la página.
const PAGINAS_ESTATICAS: {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
  /** Sin fecha: la home y el catálogo usan la del último auto modificado. */
  modificada?: string;
}[] = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/autos", changeFrequency: "hourly", priority: 0.9 },
  { path: "/consigna", changeFrequency: "monthly", priority: 0.6, modificada: "2026-09-26" },
  { path: "/financiacion", changeFrequency: "monthly", priority: 0.5, modificada: "2026-09-26" },
  { path: "/nosotros", changeFrequency: "monthly", priority: 0.4, modificada: "2026-09-29" },
  { path: "/contacto", changeFrequency: "monthly", priority: 0.5, modificada: "2026-09-27" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const autos = await getAutosParaSitemap();
  // El catálogo (y la home, que lo muestra) cambia cuando cambia un auto.
  const ultimoAuto = autos.reduce<Date | undefined>((max, a) => {
    const d = new Date(a.actualizado_en);
    return !max || d > max ? d : max;
  }, undefined);

  const estaticas: MetadataRoute.Sitemap = PAGINAS_ESTATICAS.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: p.modificada ? new Date(`${p.modificada}T12:00:00-03:00`) : ultimoAuto,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  const fichas: MetadataRoute.Sitemap = autos.map((a) => ({
    url: `${SITE_URL}/autos/${a.slug}`,
    lastModified: new Date(a.actualizado_en),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Páginas /usados/... (tanda 42): sólo las que tienen 2 autos o más, con la
  // fecha del auto más reciente de cada una.
  const usados: MetadataRoute.Sitemap = paginasConStock(await getResumenStock())
    .filter((p) => p.cantidad >= MINIMO_INDEXABLE)
    .map((p) => ({
      url: `${SITE_URL}${hrefPagina(p.pagina)}`,
      lastModified: p.ultimo ? new Date(p.ultimo) : undefined,
      changeFrequency: "daily",
      priority: 0.8,
    }));

  return [...estaticas, ...usados, ...fichas];
}
