import { supabaseServidor } from "@/lib/supabase-servidor";
import { EVENTO_META, type TipoEvento } from "@/lib/tracking";

// Registro de un evento en el servidor: fila en web_eventos y, si hay
// META_CAPI_TOKEN, el mismo evento por la Conversions API de Meta con el
// event_id del Pixel (Meta deduplica). Lo usan /api/track (eventos del
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

function leerCookie(header: string | null, nombre: string): string | undefined {
  const m = header?.match(new RegExp(`(?:^|;\\s*)${nombre}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}

export async function guardarEvento(tipo: TipoEvento, c: Cuerpo) {
  const autoId = texto(c.auto_id, 36);
  const { error } = await supabaseServidor.from("web_eventos").insert({
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
  });
  if (error) console.error("[TRACK] web_eventos", error.message);
}

export async function enviarAMeta(tipo: TipoEvento, c: Cuerpo, request: Request) {
  const token = process.env.META_CAPI_TOKEN;
  const dataset = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const nombre = EVENTO_META[tipo];
  const eventId = texto(c.event_id, 64);
  if (!token || !dataset || !nombre || !eventId) return;

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
