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
  "favorito",
];
const MAXIMO_BYTES = 8 * 1024;

// NINGÚN BOT MIDE (tanda 46). El crawler de Meta Ads ejecuta el JS de cada
// página que recorre, así que disparaba este endpoint una vez por combinación
// de filtros: ~4.000 filas basura en `web_eventos` cada 15 minutos, que además
// ensuciaban las métricas de la web. El proxy ya lo corta por user-agent, pero
// la puerta se cierra también acá: es el único lugar por el que se escribe, y
// cualquier bot que no esté en esa lista igual tiene que rebotar.
//
// Responde 204 como siempre —un bot no tiene que enterarse de nada— pero sin
// tocar la base ni mandarle el evento a Meta.
const BOTS = ["bot", "crawler", "spider", "meta-external", "facebookexternalhit"];

function esBot(request: Request): boolean {
  const ua = (request.headers.get("user-agent") ?? "").toLowerCase();
  return BOTS.some((b) => ua.includes(b));
}

export async function POST(request: Request) {
  // Un bot no mide: 204 y listo, sin insert.
  if (esBot(request)) return new Response(null, { status: 204 });
  // 60 eventos por minuto por IP; pasado eso, 429 sin tocar la base.
  if (!dentroDelLimite(`track:${ipDe(request)}`, 60, 60 * 1000)) return demasiadas();
  try {
    const cuerpo = await request.text();
    if (cuerpo.length > MAXIMO_BYTES) return new Response(null, { status: 204 });
    const c = JSON.parse(cuerpo) as Cuerpo;
    const tipo = c.tipo as TipoEvento;
    if (!TIPOS.includes(tipo)) return new Response(null, { status: 204 });

    after(() => Promise.allSettled([guardarEvento(tipo, c, request), enviarAMeta(tipo, c, request)]));
  } catch {
    // cuerpo inválido: se ignora
  }
  return new Response(null, { status: 204 });
}
