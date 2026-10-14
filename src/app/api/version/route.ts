// Versión del build que está sirviendo el servidor. El VersionGuard del
// navegador la compara con la suya: si difieren, la pestaña quedó vieja.
// Estática: el valor es fijo para cada build y cada deploy la regenera, así
// que la sirve el caché de Vercel sin invocar una función (antes era
// force-dynamic: una invocación por pestaña cada 5 min y al volver a ella).
export const dynamic = "force-static";

export function GET() {
  return Response.json({ v: process.env.NEXT_PUBLIC_BUILD_ID });
}
