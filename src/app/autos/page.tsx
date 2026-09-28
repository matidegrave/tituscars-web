import type { Metadata } from "next";
import { FiltrosPanel } from "@/components/catalogo/filtros-panel";
import { SITE_URL } from "@/lib/config";
import { FiltrosDrawer } from "@/components/catalogo/filtros-drawer";
import { FiltrosActivos } from "@/components/catalogo/filtros-activos";
import { CondicionTabs } from "@/components/catalogo/condicion-tabs";
import { OrdenSelect } from "@/components/catalogo/orden-select";
import { BarraCatalogoCelu } from "@/components/catalogo/barra-catalogo-celu";
import { CatalogoInfinito } from "@/components/catalogo/catalogo-infinito";
import {
  BuscadorCatalogo,
  ID_RESULTADOS,
} from "@/components/catalogo/buscador-catalogo";
import { EstadoVacio } from "@/components/catalogo/estado-vacio";
import { TrackAlMontar } from "@/components/tracking/track-al-montar";
import { JsonLd } from "@/components/json-ld";
import { jsonLdListaAutos } from "@/lib/json-ld";
import { getAnios, getAutosPaginados, getFacetsBase } from "@/lib/autos";
import { calcularFacets } from "@/lib/facets";
import {
  filtrosAParams,
  parseFiltros,
  type SearchParamsCatalogo,
} from "@/lib/filtros";

export const revalidate = 60;

// Siempre /autos, sin query: filtros, búsqueda y orden son la misma página
// para Google.
export const metadata: Metadata = {
  alternates: { canonical: `${SITE_URL}/autos` },
};

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsCatalogo>;
}) {
  const sp = await searchParams;
  // Scroll infinito: siempre arranca en la primera tanda (un ?page= viejo se ignora).
  const filtros = { ...parseFiltros(sp), page: 1 };
  const claveFiltros = filtrosAParams(filtros).toString();

  const [facetRows, anios, resultado] = await Promise.all([
    getFacetsBase(),
    getAnios(),
    getAutosPaginados(filtros),
  ]);

  const { marcas, hayTransmision, hayCarroceria } = calcularFacets(facetRows);
  const { autos, total } = resultado;

  return (
    // Fondo gris para que las tarjetas blancas se despeguen.
    <div className="bg-zinc-100">
      <TrackAlMontar tipo="vista_catalogo" />
      <JsonLd data={jsonLdListaAutos(autos)} />
      <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <aside className="hidden w-[280px] shrink-0 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:flex lg:max-h-[calc(100vh-var(--header-h)-2rem)] lg:flex-col">
            <FiltrosPanel
              filtros={filtros}
              marcas={marcas}
              anios={anios}
              hayTransmision={hayTransmision}
              hayCarroceria={hayCarroceria}
            />
          </aside>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3 lg:grid lg:grid-cols-[1fr_auto_1fr]">
              <h1 className="text-2xl font-bold tracking-tight">Catálogo</h1>
              <CondicionTabs filtros={filtros} />
              <div className="hidden lg:block lg:justify-self-end">
                <OrdenSelect filtros={filtros} />
              </div>
            </div>

            {/* Celu: buscador a todo el ancho y, debajo, Filtros y orden mitad y
                mitad. Barra sticky que se esconde al bajar y vuelve al subir. */}
            {/* Hija directa de la columna del listado: sticky necesita que su
                contenedor sea el que tiene toda la lista. */}
            <BarraCatalogoCelu className="mt-2">
              <BuscadorCatalogo filtros={filtros} id="filtro-busqueda-celu" />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <FiltrosDrawer
                  filtros={filtros}
                  marcas={marcas}
                  anios={anios}
                  hayTransmision={hayTransmision}
                  hayCarroceria={hayCarroceria}
                />
                <OrdenSelect filtros={filtros} className="bg-background" />
              </div>
            </BarraCatalogoCelu>

            {/* Destino del scroll al buscar (debajo del header fijo). */}
            <div
              id={ID_RESULTADOS}
              className="mt-4 scroll-mt-[calc(var(--header-h)+1rem)]"
            >
              <FiltrosActivos filtros={filtros} />
            </div>

            <div className="mt-4">
              {autos.length > 0 ? (
                <CatalogoInfinito
                  key={claveFiltros}
                  inicial={autos}
                  total={total}
                  filtros={filtros}
                  claveFiltros={claveFiltros}
                />
              ) : (
                <EstadoVacio />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
