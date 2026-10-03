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
import { mensajeSimple, prellenadoDesdeFiltros } from "@/lib/aviso-busqueda";
import { TrackAlMontar } from "@/components/tracking/track-al-montar";
import { JsonLd } from "@/components/json-ld";
import { jsonLdListaAutos } from "@/lib/json-ld";
import { redirect } from "next/navigation";
import {
  getAnios,
  getAutosPaginados,
  getFacetsBase,
  getUltimosIngresos,
} from "@/lib/autos";
import { SinResultados } from "@/components/catalogo/sin-resultados";
import { TrackBusqueda } from "@/components/catalogo/track-busqueda";
import {
  carroceriaParecida,
  interpretarBusqueda,
  nombrePropio,
  normalizar,
  sugerirCorreccion,
} from "@/lib/busqueda";
import { linkWhatsapp } from "@/lib/whatsapp";
import { listaSugerencias } from "@/lib/sugerencias";
import type { AutoCatalogo } from "@/lib/types";
import { conColores } from "@/lib/color-foto";
import { calcularFacets } from "@/lib/facets";
import {
  filtrosAParams,
  filtrosVacios,
  parseFiltros,
  urlCatalogo,
  type Filtros,
  type SearchParamsCatalogo,
} from "@/lib/filtros";

export const revalidate = 60;

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
  const sp = await searchParams;
  // Scroll infinito: siempre arranca en la primera tanda (un ?page= viejo se ignora).
  const filtros = { ...parseFiltros(sp), page: 1 };

  // Palabras de la búsqueda que son filtros ("camioneta diesel", "hilux
  // automatica"): se aplican como filtros y se busca el resto como texto.
  // Redirección en el servidor: anda igual sin JS.
  if (filtros.q) {
    const { filtros: f, resto, hayFiltros } = interpretarBusqueda(filtros.q);
    if (hayFiltros) {
      const unir = (a: string[], b: string[]) => [...a, ...b.filter((v) => !a.includes(v))];
      redirect(
        urlCatalogo({
          ...filtros,
          q: resto || undefined,
          carroceria: unir(filtros.carroceria, f.carroceria),
          transmision: unir(filtros.transmision, f.transmision),
          combustible: unir(filtros.combustible, f.combustible),
          condicion: f.condicion ?? filtros.condicion,
        })
      );
    }
  }

  const claveFiltros = filtrosAParams(filtros).toString();

  const [facetRows, anios, resultado] = await Promise.all([
    getFacetsBase(),
    getAnios(),
    getAutosPaginados(filtros).then(async (r) => ({ ...r, autos: await conColores(r.autos) })),
  ]);

  const { marcas, hayTransmision, hayCarroceria } = calcularFacets(facetRows);
  const { autos, total } = resultado;
  const sugerencias = listaSugerencias(marcas);

  // Búsqueda sin resultados: "¿Quisiste decir…?" y autos parecidos.
  let sinResultados: {
    sugerencia: { texto: string; href: string } | null;
    parecidos: AutoCatalogo[];
  } | null = null;
  if (total === 0 && filtros.q) {
    // Candidatos: marcas y modelos en stock. El modelo a veces trae la versión
    // entera ("T-Cross Trendline 1.6 Msi"): también cuentan su primera palabra
    // y las dos primeras ("T-Cross", "Onix Joy"), sumando cantidades.
    const porTexto = new Map<string, number>();
    const sumarCandidato = (texto: string, cantidad: number) => {
      const t = nombrePropio(texto.trim());
      if (t) porTexto.set(t, (porTexto.get(t) ?? 0) + cantidad);
    };
    for (const m of marcas) {
      sumarCandidato(m.marca, m.cantidad);
      for (const mo of m.modelos) {
        const palabras = mo.modelo.split(/\s+/);
        sumarCandidato(mo.modelo, mo.cantidad);
        if (palabras.length > 1) sumarCandidato(palabras[0], mo.cantidad);
        if (palabras.length > 2) sumarCandidato(palabras.slice(0, 2).join(" "), mo.cantidad);
      }
    }
    const candidatos = [...porTexto].map(([texto, cantidad]) => ({ texto, cantidad }));
    const correccion = sugerirCorreccion(filtros.q, candidatos);
    const compacto = normalizar(filtros.q).replace(/ /g, "");
    const marca = marcas.find((m) => compacto.includes(normalizar(m.marca).replace(/ /g, "")));
    const carroceria = carroceriaParecida(filtros.q);
    const buscarParecidos = (f: Partial<Filtros>) =>
      getAutosPaginados({ ...filtrosVacios(), ...f }).then((r) => conColores(r.autos.slice(0, 8)));
    const parecidos = marca
      ? await buscarParecidos({ marca: [marca.marca] })
      : carroceria
        ? await buscarParecidos({ carroceria: [carroceria] })
        : await getUltimosIngresos(8).then(conColores);
    sinResultados = {
      sugerencia: correccion
        ? { texto: correccion.texto, href: urlCatalogo({ ...filtros, q: correccion.texto }) }
        : null,
      parecidos,
    };
  }

  return (
    // Fondo gris para que las tarjetas blancas se despeguen.
    <div className="bg-zinc-100">
      <TrackAlMontar tipo="vista_catalogo" />
      {/* Una por URL (key): registra la búsqueda recién enviada con su total. */}
      <TrackBusqueda key={claveFiltros} resultados={total} />
      <JsonLd data={jsonLdListaAutos(autos)} />
      <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <aside className="hidden w-[280px] shrink-0 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:flex lg:max-h-[calc(100vh-var(--header-h)-2rem)] lg:flex-col">
            <FiltrosPanel
              filtros={filtros}
              marcas={marcas}
              sugerencias={sugerencias}
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
              <BuscadorCatalogo filtros={filtros} id="filtro-busqueda-celu" sugerencias={sugerencias} />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <FiltrosDrawer
                  filtros={filtros}
                  marcas={marcas}
                  anios={anios}
                  hayTransmision={hayTransmision}
                  hayCarroceria={hayCarroceria}
                  total={total}
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
              {sinResultados ? (
                <SinResultados
                  buscado={filtros.q ?? ""}
                  sugerencia={sinResultados.sugerencia}
                  parecidos={sinResultados.parecidos}
                  hrefAviso={linkWhatsapp(mensajeSimple(filtros.q ?? ""))}
                  prellenado={prellenadoDesdeFiltros(filtros)}
                />
              ) : autos.length > 0 ? (
                <CatalogoInfinito
                  key={claveFiltros}
                  inicial={autos}
                  total={total}
                  filtros={filtros}
                  claveFiltros={claveFiltros}
                />
              ) : (
                <EstadoVacio prellenado={prellenadoDesdeFiltros(filtros)} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
