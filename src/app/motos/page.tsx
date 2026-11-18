import type { Metadata } from "next";
import { SITE_URL } from "@/lib/config";
import type { SearchParamsCatalogo } from "@/lib/filtros";
import { PaginaCatalogo } from "@/app/autos/pagina-catalogo";

// /motos (WEB-MOTOS1): el mismo catálogo que /autos, recortado a
// carroceria = 'moto', con sus propios filtros (cilindrada; sin carrocería,
// combustible ni transmisión). DINÁMICA por lo mismo que /autos (ver
// app/autos/page.tsx). Las fichas siguen en /autos/:slug.

const TITULO = "Motos usadas en Córdoba | Titus Cars";
const DESCRIPCION =
  "Motos usadas en Córdoba con fotos, precio, kilómetros y cilindrada. Recibimos tu auto o tu moto en parte de pago y financiamos. Escribinos por WhatsApp.";

// Canónico siempre /motos; con query, noindex,follow (igual que /autos).
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParamsCatalogo>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const conQuery = Object.values(sp).some((v) => (Array.isArray(v) ? v.length > 0 : !!v));
  return {
    title: { absolute: TITULO },
    description: DESCRIPCION,
    alternates: { canonical: `${SITE_URL}/motos` },
    openGraph: { title: TITULO, description: DESCRIPCION, url: `${SITE_URL}/motos` },
    ...(conQuery ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function MotosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsCatalogo>;
}) {
  return <PaginaCatalogo sp={await searchParams} seccion="motos" />;
}
