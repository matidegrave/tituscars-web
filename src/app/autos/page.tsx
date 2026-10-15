import type { Metadata } from "next";
import { SITE_URL } from "@/lib/config";
import { PaginaCatalogo } from "@/app/autos/pagina-catalogo";

// /autos SIN filtros: estática, se regenera cada 5 min (ISR). No lee
// searchParams (eso la haría dinámica): una URL con filtros, el proxy la
// reescribe a /catalogo/[filtros], que es otra página con su propio caché. Una
// URL con query que no son filtros (utm_*, fbclid, ?page= viejo) cae acá.
export const revalidate = 300;

// Canónico /autos: filtros, búsqueda y orden son la misma página para Google.
export const metadata: Metadata = {
  alternates: { canonical: `${SITE_URL}/autos` },
};

export default function CatalogoPage() {
  return <PaginaCatalogo sp={{}} />;
}
