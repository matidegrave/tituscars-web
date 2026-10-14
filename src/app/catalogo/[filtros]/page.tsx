import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SITE_URL } from "@/lib/config";
import { aSearchParams, decodificarClave } from "@/lib/filtros";
import { PaginaCatalogo } from "@/app/autos/pagina-catalogo";

// /autos con filtros, servida desde el caché. NO es una URL pública: el proxy
// reescribe /autos?marca=Toyota&orden=km acá (la clave es la query canónica en
// base64url, ver lib/filtros.ts) y el navegador sigue viendo /autos?…. Entrar
// directo a /catalogo/… redirige a /autos (paso 5 del proxy).
//
// ISR: cada combinación se genera en su primera visita y queda en caché 5 min.
export const revalidate = 300;

export function generateStaticParams(): { filtros: string }[] {
  return [];
}

// Una combinación de filtros no se indexa —el canónico manda a /autos— pero
// sus links SÍ se siguen, que es por donde el crawler llega a las fichas
// (tanda 46b; mismo mensaje que el `Disallow: /autos?` de robots.txt).
export const metadata: Metadata = {
  alternates: { canonical: `${SITE_URL}/autos` },
  robots: { index: false, follow: true },
};

export default async function CatalogoFiltradoPage({
  params,
}: {
  params: Promise<{ filtros: string }>;
}) {
  const { filtros } = await params;
  const query = decodificarClave(filtros);
  if (query === null) redirect("/autos");
  return <PaginaCatalogo sp={aSearchParams(query)} />;
}
