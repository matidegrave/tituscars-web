import type { Metadata } from "next";
import { SITE_URL } from "@/lib/config";
import type { SearchParamsCatalogo } from "@/lib/filtros";
import { PaginaCatalogo } from "@/app/autos/pagina-catalogo";

// /autos es DINÁMICA a propósito: lee los filtros de searchParams. Probamos
// hacerla estática y servir cada combinación de filtros desde el caché con un
// rewrite del proxy (/catalogo/[clave], 14-oct) y el router de Next la rompió:
// con /autos estática, al navegar a /autos?q=focus o cambiar el orden asume que
// la página no depende de la query, reusa la que tiene y los resultados no
// cambian hasta recargar. Las consultas igual salen del caché de datos.
// Test: e2e/catalogo-navegacion.mjs.

// Siempre /autos, sin query: filtros, búsqueda y orden son la misma página
// para Google.
//
// Y CON QUERY, `noindex,follow` (tanda 46b): una combinación de filtros no es
// una página que valga la pena indexar —el canónico ya manda a /autos— pero sus
// links SÍ se siguen, que es por donde el crawler llega a las fichas. Es el
// mismo mensaje que el `Disallow: /autos?` de robots.txt, para el crawler que
// igual entró (un link externo, un sitemap viejo).
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParamsCatalogo>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const conQuery = Object.values(sp).some((v) => (Array.isArray(v) ? v.length > 0 : !!v));
  return {
    alternates: { canonical: `${SITE_URL}/autos` },
    ...(conQuery ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsCatalogo>;
}) {
  return <PaginaCatalogo sp={await searchParams} />;
}
