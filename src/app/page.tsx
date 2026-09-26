import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import { FeaturedCarousel } from "@/components/featured-carousel";
import { BeneficiosBanner } from "@/components/beneficios-banner";
import { AccesosBlock } from "@/components/accesos-block";
import { AutoGrid } from "@/components/auto-grid";
import { JsonLd } from "@/components/json-ld";
import { jsonLdConcesionaria } from "@/lib/json-ld";
import {
  getAutosConBaja,
  getDestacados,
  getTotalEnStock,
  getUltimosIngresos,
} from "@/lib/autos";
import { DIRECCION_AVENIDA, SITE_URL } from "@/lib/config";

export const revalidate = 60;

// Título y descripción propios de la home (los que Google muestra al buscar
// "titus cars"). La cantidad de autos sale del stock real: "+100" sólo si hay
// 100 o más.
export async function generateMetadata(): Promise<Metadata> {
  const total = await getTotalEnStock();
  const cantidad = total >= 100 ? "+100" : String(total);
  const titulo = `Titus Cars | Autos usados en Córdoba — Agencia en ${DIRECCION_AVENIDA}`;
  const descripcion = `Agencia de autos usados en Córdoba. ${cantidad} autos con fotos y precio, financiación, permutas y consignación. Escribinos por WhatsApp.`;
  return {
    title: { absolute: titulo },
    description: descripcion,
    alternates: { canonical: `${SITE_URL}/` },
    openGraph: { title: titulo, description: descripcion, url: `${SITE_URL}/` },
  };
}

export default async function HomePage() {
  const [destacados, ultimosIngresos, totalEnStock, conBaja] = await Promise.all([
    getDestacados(8),
    getUltimosIngresos(12),
    getTotalEnStock(),
    getAutosConBaja(100),
  ]);

  const jsonLd = jsonLdConcesionaria();

  return (
    <>
      <JsonLd data={jsonLd} />
      <Hero />

      <section className="bg-zinc-100">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold tracking-tight md:text-left">Destacados</h2>
          <div className="mt-6">
            <FeaturedCarousel autos={destacados} totalEnStock={totalEnStock} />
          </div>
        </div>
      </section>

      {conBaja.length >= 2 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold tracking-tight md:text-left">
            Bajaron de precio
          </h2>
          <div className="mt-6">
            <FeaturedCarousel
              autos={conBaja.slice(0, 8)}
              totalEnStock={totalEnStock}
              verMas={{
                href: "/autos?baja=1",
                titulo: "Ver todos los que bajaron",
                detalle: `${conBaja.length} autos bajaron de precio`,
              }}
            />
          </div>
        </section>
      )}

      <BeneficiosBanner />

      <AccesosBlock />

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="text-center text-2xl font-bold tracking-tight md:text-left">
          Últimos ingresos
        </h2>
        <div className="mt-6">
          <AutoGrid autos={ultimosIngresos} />
        </div>
      </section>
    </>
  );
}
