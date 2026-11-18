import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getAutoPorSlug, getResumenStock, getSimilares, getSlugActualPorSufijo } from "@/lib/autos";
import type { AutoCatalogo } from "@/lib/types";
import { bajaDePrecio, esMoto, formatCc, formatKm, formatPrecio, rutaFicha, tituloAuto } from "@/lib/format";
import type { Seccion } from "@/lib/filtros";
import { FichaGallery } from "@/components/ficha/gallery";
import { coloresDeFotos, conColores } from "@/lib/color-foto";
import { datosParaCliente } from "@/lib/para-cliente";
import { FichaTecnica } from "@/components/ficha/ficha-tecnica";
import { WhatsappCta } from "@/components/ficha/whatsapp-bar";
import { Descripcion } from "@/components/ficha/descripcion";
import { VideoSection } from "@/components/ficha/video";
import { Confianza } from "@/components/ficha/confianza";
import { AutoCard } from "@/components/auto-card";
import { CarruselTarjetas } from "@/components/carrusel-tarjetas";
import { JsonLd } from "@/components/json-ld";
import { jsonLdAuto } from "@/lib/json-ld";
import { TrackVistaAuto } from "@/components/tracking/track-vista-auto";
import { Bike, CalendarDays, Car, Fuel, Gauge, Settings2 } from "lucide-react";
import { BusquedaAMedidaDiferida } from "@/components/busqueda-a-medida-diferida";
import { DIRECCION_CALLE, SITE_URL } from "@/lib/config";
import { mensajeConsultaAuto, mensajeConsultaMoto } from "@/lib/whatsapp";
import { PRELLENADO_MOTO } from "@/lib/aviso-busqueda";

// La ficha de un vehículo, compartida por /autos/[slug] y /motos/[slug]
// (WEB-MOTOS2): cada ruta exporta revalidate, dynamicParams y estas funciones.
// ISR: la ficha se arma una vez y se sirve del caché de Vercel. Cuando cambia
// un auto (precio, estado, fotos…) gestión avisa a /api/revalidate y se
// regenera en la siguiente visita; 10 min de respaldo. Las publicadas se
// generan en el build; una nueva se genera en su primera visita
// (dynamicParams). Un slug que ya no existe no llega acá: lo resuelve el proxy
// (308 o 404), que también manda con 301 una moto de /autos a /motos (y al
// revés).

/** Slugs de la sección para el build: motos en /motos, el resto en /autos. */
export async function paramsFicha(seccion: Seccion): Promise<{ slug: string }[]> {
  const autos = await getResumenStock();
  return autos
    .filter((a) => (a.carroceria === "moto") === (seccion === "motos"))
    .map((a) => ({ slug: a.slug }));
}

/**
 * Busca el auto y, si el slug no existe, resuelve antes de renderizar nada:
 * - si el auto cambió de slug (se editó la versión, el año, etc.), 308 al
 *   slug actual, a nivel HTTP;
 * - si no existe más, notFound() (404 con el HTML real de not-found.tsx).
 * Se llama en generateMetadata y al principio de la página.
 */
async function resolverAuto(slug: string, seccion: Seccion): Promise<AutoCatalogo> {
  const auto = await getAutoPorSlug(slug);
  if (auto) {
    // Respaldo del 301 del proxy: una moto en /autos (o un auto en /motos)
    // va a su sección.
    if (esMoto(auto) !== (seccion === "motos")) permanentRedirect(rutaFicha(auto));
    return auto;
  }

  const slugActual = await getSlugActualPorSufijo(slug);
  if (slugActual && slugActual !== slug) {
    const actual = await getAutoPorSlug(slugActual);
    permanentRedirect(actual ? rutaFicha(actual) : `/${seccion}/${slugActual}`);
  }

  notFound();
}

export async function metadataFicha(slug: string): Promise<Metadata> {
  const auto = await getAutoPorSlug(slug);
  if (!auto) return {};

  const titulo = `${tituloAuto(auto)} ${auto.anio}`;
  // Moto: "2023 · 6.000 km · 400 cc · $ 7.700.000" (WEB-MOTOS1).
  const descripcion = [
    String(auto.anio),
    formatKm(auto.km),
    esMoto(auto) ? formatCc(auto.cilindrada) : auto.combustible,
    formatPrecio(auto.precio, auto.moneda),
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    title: `${titulo} | Titus Cars`,
    description: descripcion,
    alternates: { canonical: `${SITE_URL}${rutaFicha(auto)}` },
    openGraph: {
      title: `${titulo} | Titus Cars`,
      description: descripcion,
      type: "website",
      images: auto.foto_principal ? [{ url: auto.foto_principal }] : undefined,
    },
  };
}

export async function PaginaFicha({ slug, seccion }: { slug: string; seccion: Seccion }) {
  const auto = await resolverAuto(slug, seccion);

  const similares = await getSimilares(auto).then(conColores);

  // Link de la ficha para el mensaje de WhatsApp. Siempre el dominio (no el
  // host del request: leer headers() haría la ficha dinámica).
  const urlFicha = `${SITE_URL}${rutaFicha(auto)}`;
  const titulo = tituloAuto(auto);
  const precioFormateado = formatPrecio(auto.precio, auto.moneda);
  const baja = bajaDePrecio(auto);
  const fotos = auto.fotos && auto.fotos.length > 0
    ? auto.fotos
    : auto.foto_principal
      ? [{ url: auto.foto_principal, orden: 0, principal: true }]
      : [];

  const colores = await coloresDeFotos(fotos.map((f) => f.url));

  // Moto (WEB-MOTOS1): datos sin combustible ni transmisión, textos de moto,
  // mensaje de WhatsApp propio y content_category = 'moto' en el Pixel.
  const moto = esMoto(auto);
  const categoria = moto ? "moto" : undefined;
  const vehiculo = moto ? "la moto" : "el";
  const cc = formatCc(auto.cilindrada);
  const otros = moto ? "Otras motos que te pueden interesar" : "Otros autos que te pueden interesar";

  const jsonLd = jsonLdAuto(auto);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-28 sm:pb-8">
      <JsonLd data={jsonLd} />
      <TrackVistaAuto
        datos={{
          auto_id: auto.id,
          slug: auto.slug,
          valor: auto.precio_ars,
          ...(auto.precio_anterior !== null && { con_baja: true }),
          ...(categoria && { categoria }),
        }}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <FichaGallery
            fotos={fotos}
            alt={titulo}
            senado={auto.estado === "senado"}
            ceroKm={auto.condicion === "0km"}
            disponibilidad={auto.disponibilidad}
            slug={auto.slug}
            colores={colores}
          />
        </div>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tight">{titulo}</h1>
            <p className="text-muted-foreground">{auto.anio}</p>
            {baja && (
              <p className="mt-2 text-base text-muted-foreground line-through">{baja.anterior}</p>
            )}
            <p className={baja ? "text-3xl font-black" : "mt-2 text-3xl font-black"}>
              {precioFormateado}
            </p>
            {baja && <p className="mt-1 text-sm font-medium text-emerald-700">Bajó de precio</p>}
            {/* Datos clave de un vistazo (la ficha técnica completa sigue abajo). */}
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-foreground/80">
              <li className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {auto.anio}
              </li>
              {auto.km !== null && (
                <li className="flex items-center gap-1.5">
                  <Gauge className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  {formatKm(auto.km)}
                </li>
              )}
              {moto && cc && (
                <li className="flex items-center gap-1.5">
                  <Bike className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  {cc}
                </li>
              )}
              {auto.combustible && !moto && (
                <li className="flex items-center gap-1.5">
                  <Fuel className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  {auto.combustible}
                </li>
              )}
              {auto.transmision && !moto && (
                <li className="flex items-center gap-1.5">
                  <Settings2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  {auto.transmision === "manual" ? "Manual" : "Automática"}
                </li>
              )}
              {auto.carroceria && !moto && (
                <li className="flex items-center gap-1.5">
                  <Car className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  {auto.carroceria === "suv" ? "SUV" : auto.carroceria.charAt(0).toUpperCase() + auto.carroceria.slice(1)}
                </li>
              )}
            </ul>
            <p className="mt-2 text-sm text-muted-foreground">
              {auto.disponibilidad === "salon"
                ? `Disponible en nuestro salón, ${DIRECCION_CALLE}`
                : `${moto ? "Esta moto" : "Este auto"} se ve con cita previa, escribinos para coordinar`}
            </p>
            {auto.estado === "senado" && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-brand-black px-2.5 py-1 text-sm font-medium text-white">
                {moto ? "Esta moto está señada" : "Este auto está señado"}. Consultanos por unidades similares.
              </p>
            )}
          </div>

          <WhatsappCta
            titulo={titulo}
            trackAuto={{ auto_id: auto.id, slug: auto.slug, valor: auto.precio_ars, categoria }}
            precioFormateado={precioFormateado}
            favorito={{
              id: auto.id,
              slug: auto.slug,
              titulo,
              anio: auto.anio,
              precio: precioFormateado,
              foto: auto.foto_principal,
            }}
            paraCliente={{
              slug: auto.slug,
              titulo,
              anio: auto.anio,
              datos: datosParaCliente(auto),
              precio: precioFormateado,
              moto: esMoto(auto),
            }}
            intenciones={[
              {
                texto: moto ? "Tengo algo para entregar" : "Tengo un auto para entregar",
                detalle: "permuta",
                mensaje: moto
                  ? `Hola, me interesa la moto ${auto.marca} ${auto.modelo} ${auto.anio} y tengo algo para entregar: ${urlFicha}`
                  : `Hola, me interesa el ${titulo} ${auto.anio} y tengo un auto para entregar: ${urlFicha}`,
              },
              {
                texto: "Quiero financiarlo",
                detalle: "financiar",
                mensaje: `Hola, me interesa financiar ${vehiculo} ${titulo} ${auto.anio} (${precioFormateado}). ¿Qué opciones tengo? ${urlFicha}`,
              },
              {
                texto: "¡Me interesa!",
                detalle: "interesa",
                mensaje: moto
                  ? `Hola, me interesa la moto ${auto.marca} ${auto.modelo} ${auto.anio} (${precioFormateado}). ${urlFicha}`
                  : `Hola, me interesa el ${titulo} ${auto.anio} (${precioFormateado}). ${urlFicha}`,
              },
            ]}
            mensajeWhatsapp={
              moto
                ? mensajeConsultaMoto({
                    marca: auto.marca,
                    modelo: auto.modelo,
                    anio: auto.anio,
                    url: urlFicha,
                    conCita: auto.disponibilidad === "cita",
                  })
                : mensajeConsultaAuto({
                    titulo,
                    anio: auto.anio,
                    datos: [formatKm(auto.km), auto.combustible, precioFormateado]
                      .filter(Boolean)
                      .join(" · "),
                    url: urlFicha,
                    conCita: auto.disponibilidad === "cita",
                  })
            }
          />

          <FichaTecnica auto={auto} />
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-12">
        <Descripcion
          publicacion={auto.publicacion_texto}
          items={auto.descripcion_items}
          extra={auto.descripcion_extra}
        />
        <VideoSection videoUrl={auto.video_url} />
        {/* Lo último de la publicación del auto (tanda 47e), antes de la línea naranja. */}
        <Confianza />
      </div>

      {similares.length > 0 && (
        // Separador claro: lo de abajo ya no es este auto.
        <div className="mt-14 border-t-[3px] border-brand pt-10">
          <h2 className="text-lg font-bold">{otros}</h2>
          <div className="mt-4">
            {/* Celu: carrusel (asoma el siguiente, flechas). Desde sm: la grilla. */}
            <CarruselTarjetas etiqueta={otros} grillaDesdeSm>
              {similares.map((a) => (
                <AutoCard key={a.id} auto={a} />
              ))}
            </CarruselTarjetas>
          </div>
        </div>
      )}

      <BusquedaAMedidaDiferida
        origen="pie_ficha"
        autoSlug={auto.slug}
        prellenado={moto ? PRELLENADO_MOTO : undefined}
        className="mt-12"
      />
    </div>
  );
}
