import { getAutosPorIds } from "@/lib/autos";
import { demasiadas, dentroDelLimite, ipDe } from "@/lib/rate-limit";

// Datos actuales de los autos guardados en favoritos (/favoritos): los que ya
// no están en stock no vuelven. Sólo lectura; cache corto en la CDN.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  if (!dentroDelLimite(`fichas:${ipDe(request)}`, 30, 60 * 1000)) return demasiadas();
  const ids = (new URL(request.url).searchParams.get("ids") ?? "")
    .split(",")
    .filter((id) => UUID.test(id))
    .slice(0, 60);
  const autos = await getAutosPorIds(ids);
  return Response.json(
    { autos },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=60" } }
  );
}
