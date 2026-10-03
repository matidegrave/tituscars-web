import type { Metadata } from "next";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import {
  getAutosPaginados,
  getResumenStock,
  getUltimosIngresos,
} from "@/lib/autos";
import { conColores } from "@/lib/color-foto";
import { SITE_URL } from "@/lib/config";
import { filtrosAParams, filtrosVacios } from "@/lib/filtros";
import { jsonLdListaAutos } from "@/lib/json-ld";
import {
  coincide,
  filtrosDe,
  hrefCatalogo,
  MINIMO_INDEXABLE,
  nombrePagina,
  resolverPagina,
  type PaginaUsados,
} from "@/lib/usados";
import {
  descripcionPagina,
  textoPagina,
  tituloPagina,
} from "@/lib/usados-textos";
import { linkWhatsapp } from "@/lib/whatsapp";
import { CatalogoInfinito } from "@/components/catalogo/catalogo-infinito";
import { SinResultados } from "@/components/catalogo/sin-resultados";
import { prellenadoDesdeFiltros } from "@/lib/aviso-busqueda";
import { AutoGrid } from "@/components/auto-grid";
import { JsonLd } from "@/components/json-ld";
import { TrackAlMontar } from "@/components/tracking/track-al-montar";
import type { AutoCatalogo } from "@/lib/types";

// Páginas para Google (tanda 42): "toyota usados córdoba", "camionetas
// usadas córdoba", "autos usados hasta 15 millones córdoba". Ver lib/usados.ts.
// Con menos de 2 autos: noindex, parecidos y aviso (nunca 404).

export const revalidate = 60;

async function cargar(slug: string) {
  const resumen = await getResumenStock();
  const pagina = resolverPagina(slug, [
    ...new Set(resumen.map((a) => a.marca)),
  ]);
  // El proxy sólo deja pasar slugs con forma válida: esto no debería pasar.
  const p: PaginaUsados = pagina ?? { tipo: "marca", slug, marca: slug };
  return { p, autosPagina: resumen.filter((a) => coincide(a, p)) };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { p, autosPagina } = await cargar(slug);
  const titulo = `${tituloPagina(p)} | Titus Cars`;
  const descripcion = descripcionPagina(p, autosPagina);
  return {
    title: { absolute: titulo },
    description: descripcion,
    alternates: { canonical: `${SITE_URL}/usados/${p.slug}` },
    robots:
      autosPagina.length >= MINIMO_INDEXABLE
        ? undefined
        : { index: false, follow: true },
    openGraph: {
      title: titulo,
      description: descripcion,
      url: `${SITE_URL}/usados/${p.slug}`,
      type: "website",
    },
  };
}

/** Para 0 o 1 auto: los de la misma carrocería del que hay, o los últimos ingresos. */
async function parecidos(
  p: PaginaUsados,
  autos: AutoCatalogo[],
): Promise<AutoCatalogo[]> {
  const base = { ...filtrosVacios(), condicion: "usado" as const };
  const uno = autos[0];
  const lista = uno?.carroceria
    ? (await getAutosPaginados({ ...base, carroceria: [uno.carroceria] })).autos
    : p.tipo === "precio"
      ? (
          await getAutosPaginados({
            ...base,
            precioMax: p.millones * 1_500_000,
            orden: "precio_asc",
          })
        ).autos
      : await getUltimosIngresos(12);
  const otros = lista.filter((a) => a.id !== uno?.id);
  // Si no queda ninguno (ej. la única moto), los últimos ingresos.
  const elegidos = otros.length > 0 ? otros : (await getUltimosIngresos(9)).filter((a) => a.id !== uno?.id);
  return conColores(elegidos.slice(0, 8));
}

export default async function UsadosPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { p, autosPagina } = await cargar(slug);
  const filtros = filtrosDe(p);
  const resultado = await getAutosPaginados(filtros);
  const autos = await conColores(resultado.autos);
  const { total } = resultado;
  const nombre = nombrePagina(p);
  const pocos = total < MINIMO_INDEXABLE;
  const similares = pocos ? await parecidos(p, autos) : [];
  const buscado =
    p.tipo === "marca"
      ? `un ${p.marca} usado`
      : nombre.charAt(0).toLowerCase() + nombre.slice(1);

  return (
    <div className="bg-zinc-100">
      <TrackAlMontar tipo="vista_catalogo" />
      {autos.length > 0 && (
        <JsonLd data={jsonLdListaAutos(autos, tituloPagina(p))} />
      )}
      <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6">
        <nav aria-label="Ruta" className="text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Inicio
          </Link>
          {" / "}
          <Link href="/autos" className="hover:text-foreground">
            Catálogo
          </Link>
          {" / "}
          <span className="text-foreground">{nombre}</span>
        </nav>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {tituloPagina(p)}
            </h1>
            <p className="mt-2 text-base text-foreground/80">
              {textoPagina(p, autosPagina)}
            </p>
          </div>
          <Link
            href={hrefCatalogo(p)}
            className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-semibold hover:bg-muted"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Ver todos con filtros
          </Link>
        </div>

        <div className="mt-6">
          {total >= MINIMO_INDEXABLE ? (
            <CatalogoInfinito
              key={p.slug}
              inicial={autos}
              total={total}
              filtros={filtros}
              claveFiltros={`usados:${filtrosAParams(filtros).toString()}`}
            />
          ) : (
            <div className="flex flex-col gap-8">
              {autos.length > 0 && <AutoGrid autos={autos} prioridadPrimera />}
              <SinResultados
                buscado={buscado}
                titulo={
                  autos.length > 0
                    ? "Por ahora es el único en stock"
                    : undefined
                }
                sugerencia={null}
                parecidos={similares}
                hrefAviso={linkWhatsapp(
                  `Hola, busco ${buscado}. Avisenme si les entra uno.`,
                )}
                prellenado={prellenadoDesdeFiltros(filtros)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
