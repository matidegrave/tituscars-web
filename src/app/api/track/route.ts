import { after } from "next/server";
import { demasiadas, dentroDelLimite, ipDe } from "@/lib/rate-limit";
import { type TipoEvento } from "@/lib/tracking";
import { enviarAMeta, guardarEvento, type Cuerpo } from "@/lib/eventos-servidor";

// Eventos de medición del navegador (lib/tracking.ts): fila en web_eventos y,
// si hay META_CAPI_TOKEN, el mismo evento por la Conversions API de Meta con
// el event_id del Pixel (Meta deduplica). Responde 204 al instante y hace el
// trabajo después (after), así nunca demora al navegador. El registro en sí
// está en lib/eventos-servidor.ts.

const TIPOS: readonly TipoEvento[] = [
  "vista_auto",
  "click_whatsapp",
  "busqueda",
  "lead_form",
  "click_llamar",
  "compartir",
  "vista_catalogo",
];
const MAXIMO_BYTES = 8 * 1024;

export async function POST(request: Request) {
  // 60 eventos por minuto por IP; pasado eso, 429 sin tocar la base.
  if (!dentroDelLimite(`track:${ipDe(request)}`, 60, 60 * 1000)) return demasiadas();
  try {
    const cuerpo = await request.text();
    if (cuerpo.length > MAXIMO_BYTES) return new Response(null, { status: 204 });
    const c = JSON.parse(cuerpo) as Cuerpo;
    const tipo = c.tipo as TipoEvento;
    if (!TIPOS.includes(tipo)) return new Response(null, { status: 204 });

    after(() => Promise.allSettled([guardarEvento(tipo, c), enviarAMeta(tipo, c, request)]));
  } catch {
    // cuerpo inválido: se ignora
  }
  return new Response(null, { status: 204 });
}
