import { contarAutos } from "@/lib/autos";
import { parseFiltros, type SearchParamsCatalogo } from "@/lib/filtros";
import { demasiadas, dentroDelLimite, ipDe } from "@/lib/rate-limit";

// Cuántos autos dan unos filtros: el botón "Ver 23 autos" del panel de
// filtros del celu lo pide cada vez que cambia el borrador. Sólo lectura.
// Cache de 60 s en la CDN: la misma combinación no vuelve a la base.

export async function GET(request: Request) {
  if (!dentroDelLimite(`contar:${ipDe(request)}`, 60, 60 * 1000)) return demasiadas();
  const params = new URL(request.url).searchParams;
  const sp: SearchParamsCatalogo = {};
  for (const clave of new Set(params.keys())) {
    const valores = params.getAll(clave);
    sp[clave] = valores.length > 1 ? valores : valores[0];
  }
  const total = await contarAutos({ ...parseFiltros(sp), page: 1 });
  return Response.json(
    { total },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=60" } }
  );
}
