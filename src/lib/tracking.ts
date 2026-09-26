/**
 * Medición: una sola función, track(), que dispara las tres capas a la vez,
 * sin bloquear la UI y sin tirar errores nunca:
 *   1. Meta Pixel en el navegador (fbq), con un eventID;
 *   2. /api/track (sendBeacon): fila en web_eventos y, si hay token, el mismo
 *      evento por la Conversions API con el MISMO event_id (Meta deduplica);
 *   3. contexto de la sesión: session_id, UTM, fbclid/gclid del primer
 *      landing y dispositivo, adjuntos a todos los eventos.
 * Sólo navegador.
 */

export type TipoEvento =
  | "vista_auto"
  | "click_whatsapp"
  | "busqueda"
  | "lead_form"
  | "click_llamar"
  | "compartir"
  | "vista_catalogo";

export interface DatosEvento {
  auto_id?: string;
  slug?: string;
  q?: string;
  /** Precio en pesos (value de Meta). */
  valor?: number;
  /** content_name de Meta (ej. "busqueda_a_medida"). */
  nombre?: string;
  /** El auto tenía baja de precio (va a Meta; web_eventos no tiene columna). */
  con_baja?: boolean;
  /** content_category de Meta (ej. "consignacion"). */
  categoria?: string;
}

/** Evento estándar de Meta para cada tipo propio (los que no están, sólo van a web_eventos). */
export const EVENTO_META: Partial<Record<TipoEvento, string>> = {
  vista_auto: "ViewContent",
  busqueda: "Search",
  click_whatsapp: "Lead",
  lead_form: "Lead",
};

export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  push?: unknown;
  loaded?: boolean;
  version?: string;
};
declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

/**
 * Código base OFICIAL de Meta, tal cual (crea window.fbq, carga fbevents.js,
 * init y el PageView de la carga). Va como <script> en el <head> del layout,
 * así window.fbq existe antes de la hidratación y ningún evento que se
 * dispare al entrar (ViewContent) se pierde.
 */
export const SNIPPET_PIXEL = (id: string) =>
  `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');fbq('track','PageView');`;

/** El fbq del snippet oficial (sin stub propio). null si no hay Pixel. */
function fbq(): Fbq | null {
  if (!PIXEL_ID || typeof window === "undefined") return null;
  return window.fbq ?? null;
}

/** PageView del Pixel en una navegación del App Router (la de la carga la manda el snippet). */
export function pageView() {
  try {
    fbq()?.("track", "PageView");
  } catch {
    // nunca rompe la página
  }
}

// ─── Contexto de la sesión ───────────────────────────────────────────────────

const CLAVE_SESION = "titus-tracking";

interface Sesion {
  session_id: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  fbclid?: string;
  gclid?: string;
  /** Momento del landing, para armar fbc si llegó con fbclid. */
  llegada: number;
}

function uuid(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    // sigue abajo
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

let sesionEnMemoria: Sesion | null = null;

/** La sesión se arma en el primer landing (UTM y clids de ESA URL) y se reusa. */
function sesion(): Sesion {
  if (sesionEnMemoria) return sesionEnMemoria;
  try {
    const guardada = sessionStorage.getItem(CLAVE_SESION);
    if (guardada) return (sesionEnMemoria = JSON.parse(guardada) as Sesion);
  } catch {
    // sessionStorage bloqueado: la sesión vive sólo en memoria
  }
  const params = new URLSearchParams(window.location.search);
  const nueva: Sesion = {
    session_id: uuid(),
    utm_source: params.get("utm_source") ?? undefined,
    utm_medium: params.get("utm_medium") ?? undefined,
    utm_campaign: params.get("utm_campaign") ?? undefined,
    fbclid: params.get("fbclid") ?? undefined,
    gclid: params.get("gclid") ?? undefined,
    llegada: Date.now(),
  };
  try {
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(nueva));
  } catch {
    // idem
  }
  return (sesionEnMemoria = nueva);
}

function dispositivo(): "mobile" | "desktop" {
  try {
    return window.matchMedia("(max-width: 767px), (pointer: coarse)").matches ? "mobile" : "desktop";
  } catch {
    return "desktop";
  }
}

// ─── track() ─────────────────────────────────────────────────────────────────

export function track(tipo: TipoEvento, datos: DatosEvento = {}) {
  try {
    if (typeof window === "undefined") return;
    const eventId = uuid();
    const s = sesion();

    // 1. Pixel
    const nombreMeta = EVENTO_META[tipo];
    if (nombreMeta) {
      const custom: Record<string, unknown> = {};
      if (datos.auto_id) {
        custom.content_ids = [datos.auto_id];
        custom.content_type = "vehicle";
      }
      if (typeof datos.valor === "number" && datos.valor > 0) {
        custom.value = datos.valor;
        custom.currency = "ARS";
      }
      if (datos.q) custom.search_string = datos.q;
      if (datos.nombre) custom.content_name = datos.nombre;
      if (datos.con_baja) custom.con_baja = true;
      if (datos.categoria) custom.content_category = datos.categoria;
      fbq()?.("track", nombreMeta, custom, { eventID: eventId });
    }

    // 2. Servidor (web_eventos + Conversions API). sendBeacon sobrevive a que
    // se abra otra pestaña o se cambie de página.
    const cuerpo = JSON.stringify({
      tipo,
      event_id: eventId,
      ...datos,
      url: window.location.href,
      pagina: `${window.location.pathname}${window.location.search}`,
      referrer: document.referrer || undefined,
      session_id: s.session_id,
      utm_source: s.utm_source,
      utm_medium: s.utm_medium,
      utm_campaign: s.utm_campaign,
      fbclid: s.fbclid,
      gclid: s.gclid,
      llegada: s.llegada,
      dispositivo: dispositivo(),
    });
    const enviado =
      typeof navigator.sendBeacon === "function" &&
      navigator.sendBeacon("/api/track", new Blob([cuerpo], { type: "application/json" }));
    if (!enviado) {
      void fetch("/api/track", {
        method: "POST",
        body: cuerpo,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // la medición nunca rompe la página
  }
}
