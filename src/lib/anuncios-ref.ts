import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase";
import { esIdAnuncio, refAnuncio, type CodigosAnuncio } from "@/lib/whatsapp";

/**
 * Códigos cortos de los anuncios de Meta (tanda 53): public.anuncios_ref
 * (ad_id -> codigo "W1"), cargada a mano en la base. Son pocas filas: se trae
 * la tabla entera cacheada 10 min en el servidor, NUNCA una consulta por
 * request (saturación del 30/09). Si falla, el cache sigue sirviendo la
 * versión anterior; sin versión anterior se deja de preguntar 1 min y la ref
 * cae a "A" + últimos 6 dígitos.
 */
const traerCodigos = unstable_cache(
  async (): Promise<CodigosAnuncio> => {
    const { data, error } = await supabase
      .from("anuncios_ref")
      .select("ad_id, codigo")
      .eq("activo", true)
      .abortSignal(AbortSignal.timeout(2000));
    if (error) throw new Error(error.message); // tirar: no cachea el fallo
    const codigos: CodigosAnuncio = {};
    for (const fila of data ?? []) {
      const codigo = String(fila.codigo ?? "").trim();
      if (fila.ad_id && codigo) codigos[String(fila.ad_id).trim()] = codigo;
    }
    return codigos;
  },
  ["anuncios-ref-v1"],
  { revalidate: 600 }
);

let pausadoHasta = 0;

async function codigosAnuncios(): Promise<CodigosAnuncio> {
  if (Date.now() < pausadoHasta) return {};
  try {
    return await traerCodigos();
  } catch (e) {
    pausadoHasta = Date.now() + 60 * 1000;
    console.error("[ANUNCIOS_REF]", e instanceof Error ? e.message : e);
    return {};
  }
}

/** refAnuncio con la tabla: sólo la consulta (cacheada) si utm_content es un ID numérico. */
export async function refAnuncioServidor(utmContent: string | null | undefined): Promise<string | null> {
  const codigos = esIdAnuncio(utmContent) ? await codigosAnuncios() : undefined;
  return refAnuncio(utmContent, codigos);
}
