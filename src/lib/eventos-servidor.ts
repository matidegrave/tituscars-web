import { debeRegistrar, simular } from "@/lib/entorno";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { EVENTO_META, type TipoEvento } from "@/lib/tracking";
import { COOKIE_ANUNCIO, limpiarUtm } from "@/lib/origen";
import { refAnuncioServidor } from "@/lib/anuncios-ref";

// Registro de un evento en el servidor: fila en web_eventos y, si hay
// META_CAPI_TOKEN, el mismo evento por la Conversions API de Meta con el
// event_id del Pixel (Meta deduplica). SÓLO en producción real
// (lib/entorno.ts): en local y en previews se loguea y no se escribe nada. Lo usan /api/track (eventos del
// navegador) y las rutas que funcionan sin JS (ej. /consigna/whatsapp).
//
// Datos personales: hoy no viaja ninguno. Si algún día se manda teléfono o
// email, van normalizados y hasheados con SHA-256 (user_data.ph / em), nunca en
// claro.

const GRAPH_VERSION = "v26.0";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type Cuerpo = Record<string, unknown>;

const texto = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
};

/** Entero dentro del rango de la columna (smallint con CHECK), o null. */
const entero = (v: unknown, min: number, max: number): number | null =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max ? v : null;

/** Valores válidos de web_eventos.detalle (ver DatosEvento en lib/tracking.ts). */
const DETALLES = new Set([
  "consulta",
  "disponible",
  "financiar",
  "permuta",
  "interesa",
  "aviso_sin_stock",
  "favoritos",
  "agregar",
  "quitar",
]);

const LINEAS = new Set(["pauta", "portales"]);
/** CHECK de web_eventos.detalle (web_eventos_detalle_largo). */
const DETALLE_MAXIMO = 200;

/**
 * web_eventos.detalle (texto, máx 200). En general, el subtipo solo
 * ("consulta"). En click_whatsapp, un JSON con lo que haya de:
 *   subtipo  — "consulta", "interesa"…;
 *   linea    — "pauta" | "portales" (tanda 51, lo manda el navegador);
 *   anuncio  — utm_content completo de la última llegada paga (tanda 52, de la
 *              cookie tc_anuncio: lo lee el servidor, el Pixel no se toca);
 *   ref      — su código corto ("W1"), el mismo del mensaje de WhatsApp (con
 *              ID numérico de Meta: el código de anuncios_ref, si no "A750443").
 * Ej.: {"subtipo":"consulta","linea":"pauta","anuncio":"W1 Generico Seg","ref":"W1"}.
 * Si pasara de 200 se recorta el anuncio (el ref queda entero).
 * Las filas anteriores a la tanda 51 quedan con el subtipo en texto plano.
 */
async function detalleDe(tipo: TipoEvento, c: Cuerpo, request: Request): Promise<string | null> {
  const subtipo = DETALLES.has(String(c.detalle)) ? String(c.detalle) : null;
  if (tipo !== "click_whatsapp") return subtipo;
  const linea = LINEAS.has(String(c.linea)) ? String(c.linea) : undefined;
  let anuncio = limpiarUtm(leerCookie(request.headers.get("cookie"), COOKIE_ANUNCIO)) || undefined;
  const ref = (await refAnuncioServidor(anuncio)) ?? undefined;
  if (!linea && !anuncio) return subtipo;
  const armar = () => JSON.stringify({ subtipo: subtipo ?? undefined, linea, anuncio, ref });
  let detalle = armar();
  while (detalle.length > DETALLE_MAXIMO && anuncio) {
    anuncio = anuncio.slice(0, -1);
    detalle = armar();
  }
  return detalle.length <= DETALLE_MAXIMO ? detalle : subtipo;
}

function leerCookie(header: string | null, nombre: string): string | undefined {
  const m = header?.match(new RegExp(`(?:^|;\\s*)${nombre}=([^;]+)`));
  if (!m) return undefined;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    // %-escape inválido: como si no estuviera (no se pierde el evento)
    return undefined;
  }
}

export async function guardarEvento(tipo: TipoEvento, c: Cuerpo, request: Request) {
  const autoId = texto(c.auto_id, 36);
  const fila = {
    tipo,
    auto_id: autoId && UUID.test(autoId) ? autoId : null,
    slug: texto(c.slug, 200),
    pagina: texto(c.pagina, 300),
    q: texto(c.q, 200),
    session_id: texto(c.session_id, 64),
    utm_source: texto(c.utm_source, 100),
    utm_medium: texto(c.utm_medium, 100),
    utm_campaign: texto(c.utm_campaign, 150),
    con_fbclid: Boolean(texto(c.fbclid, 500)),
    con_gclid: Boolean(texto(c.gclid, 500)),
    referrer: texto(c.referrer, 300),
    dispositivo: texto(c.dispositivo, 20),
    resultados: entero(c.resultados, 0, 5000),
    posicion: entero(c.posicion, 1, 5000),
    detalle: await detalleDe(tipo, c, request),
  };
  if (!debeRegistrar(request)) return simular("web_eventos", fila, request);
  const db = supabaseAdmin();
  if (!db) return console.error("[TRACK] web_eventos: falta SUPABASE_SERVICE_ROLE_KEY");
  const { error } = await db.from("web_eventos").insert(fila);
  if (error) console.error("[TRACK] web_eventos", error.message);
}

export async function enviarAMeta(tipo: TipoEvento, c: Cuerpo, request: Request) {
  const token = process.env.META_CAPI_TOKEN;
  const dataset = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const nombre = EVENTO_META[tipo];
  const eventId = texto(c.event_id, 64);
  if (!nombre) return;
  if (!debeRegistrar(request)) {
    return simular(`CAPI ${nombre}`, { event_id: eventId, categoria: c.categoria ?? null }, request);
  }
  if (!token || !dataset || !eventId) return;

  const cookies = request.headers.get("cookie");
  const fbclid = texto(c.fbclid, 500);
  const llegada = typeof c.llegada === "number" ? c.llegada : Date.now();
  const fbc = leerCookie(cookies, "_fbc") ?? (fbclid ? `fb.1.${llegada}.${fbclid}` : undefined);

  const custom: Record<string, unknown> = {};
  const autoId = texto(c.auto_id, 36);
  if (autoId) {
    custom.content_ids = [autoId];
    custom.content_type = "vehicle";
  }
  if (typeof c.valor === "number" && c.valor > 0) {
    custom.value = c.valor;
    custom.currency = "ARS";
  }
  const q = texto(c.q, 200);
  if (q) custom.search_string = q;
  const contenido = texto(c.nombre, 100);
  if (contenido) custom.content_name = contenido;
  if (c.con_baja === true) custom.con_baja = true;
  const categoria = texto(c.categoria, 50);
  if (categoria) custom.content_category = categoria;

  const evento = {
    event_name: nombre,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: texto(c.url, 1000) ?? undefined,
    action_source: "website",
    user_data: {
      client_ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
      client_user_agent: request.headers.get("user-agent") ?? undefined,
      fbp: leerCookie(cookies, "_fbp"),
      fbc,
    },
    custom_data: custom,
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${dataset}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [evento] }),
      }
    );
    const respuesta = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    // Queda en los runtime logs: events_received = 1 si Meta lo tomó.
    console.log("[CAPI]", nombre, res.status, JSON.stringify(respuesta));
  } catch (e) {
    console.error("[CAPI]", nombre, e instanceof Error ? e.message : e);
  }
}
