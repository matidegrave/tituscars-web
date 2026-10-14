import { supabase } from "@/lib/supabase";
import type { CodigosAnuncio } from "@/lib/whatsapp";

// ad_id de Meta -> código corto ("W1") de public.anuncios_ref, para el mensaje
// de WhatsApp que arma el navegador (components/linea-whatsapp.tsx). Estática
// con revalidación cada 10 min: la sirve el caché de Vercel, nunca una
// consulta por visita (saturación del 30/09). Si la consulta falla queda {} y
// la ref cae a "A" + últimos 6 dígitos.
export const revalidate = 600;

export async function GET() {
  const codigos: CodigosAnuncio = {};
  try {
    const { data, error } = await supabase
      .from("anuncios_ref")
      .select("ad_id, codigo")
      .eq("activo", true)
      .abortSignal(AbortSignal.timeout(2000));
    if (error) throw new Error(error.message);
    for (const fila of data ?? []) {
      const codigo = String(fila.codigo ?? "").trim();
      if (fila.ad_id && codigo) codigos[String(fila.ad_id).trim()] = codigo;
    }
  } catch (e) {
    console.error("[ANUNCIOS_REF]", e instanceof Error ? e.message : e);
  }
  return Response.json(codigos);
}
