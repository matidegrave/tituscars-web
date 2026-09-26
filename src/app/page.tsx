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
import { SITE_URL } from "@/lib/config";

export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: `${SITE_URL}/` },
};

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
