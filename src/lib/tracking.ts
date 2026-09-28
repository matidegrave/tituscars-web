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

import { esEquipoCliente } from "@/lib/equipo";

export type TipoEvento =
  | "vista_auto"
  | "click_whatsapp"
  | "busqueda"
  | "lead_form"
  | "click_llamar"
  | "compartir"
  | "vista_catalogo"
  | "favorito";

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
  /** busqueda: cuántos autos encontró (0 incluido). */
  resultados?: number;
  /** vista_auto desde el listado: posición de la card tocada (1 = primera). */
  posicion?: number;
  /**
   * Subtipo. click_whatsapp: consulta | disponible | financiar | permuta |
   * aviso_sin_stock | favoritos. favorito: agregar | quitar.
   */
  detalle?: string;
}

/** Evento estándar de Meta para cada tipo propio (los que no están, sólo van a web_eventos). */
export const EVENTO_META: Partial<Record<TipoEvento, string>> = {
  vista_auto: "ViewContent",
  busqueda: "Search",
  click_whatsapp: "Lead",
  lead_form: "Lead",
};

export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
/** El Pixel sólo se inicializa en este host (ver lib/entorno.ts). */
const HOST_PIXEL = "tituscars.com";

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
 * Código base de Meta con una sola diferencia: la cola window.fbq, el init y el
 * PageView se registran YA (en el <head>, antes de la hidratación: ningún
 * evento se pierde), pero la librería fbevents.js se descarga recién cuando la
 * página es interactiva (como strategy="afterInteractive": la pide
 * <MetaPixel /> al hidratar, vía window.__cargarPixel), así no compite con la
 * foto principal. Si el JS de la página no llegara a correr, se descarga igual
 * en el load. ES5, igual que el original.
 * Sólo corre en tituscars.com y sin la marca de equipo (lib/equipo.ts): en
 * localhost, en un preview de vercel.app o en el celu de alguien del equipo no
 * se crea window.fbq y track() no le manda nada a Meta.
 */
export const SNIPPET_PIXEL = (id: string) =>
  `if(location.hostname==='${HOST_PIXEL}'&&!function(){try{return/(?:^|;\\s*)tc_equipo=1(?:;|$)/.test(document.cookie)||localStorage.getItem('tc_equipo')==='1'}catch(x){return!1}}()){!function(f,b,e,v,n){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];var c=!1;f.__cargarPixel=function(){if(c)return;c=!0;var t=b.createElement(e);t.async=!0;t.src=v;var s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)};f.addEventListener('load',function(){setTimeout(f.__cargarPixel,0)})}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');fbq('track','PageView')}`;

/** Descarga fbevents.js (una sola vez). La llama <MetaPixel /> al hidratar. */
export function cargarPixel() {
  try {
    (window as Window & { __cargarPixel?: () => void }).__cargarPixel?.();
  } catch {
    // nunca rompe la página
  }
}

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

/**
 * Ruta + query de la página, sin los parámetros de campaña (utm_*, fbclid,
 * gclid): esos ya viajan en sus propias columnas. Así /links?utm_source=ig
 * queda como pagina "/links".
 */
function paginaSinCampana(): string {
  const params = new URLSearchParams(window.location.search);
  for (const k of [...params.keys()]) if (/^utm_|^fbclid$|^gclid$/.test(k)) params.delete(k);
  const q = params.toString();
  return `${window.location.pathname}${q ? `?${q}` : ""}`;
}

// ─── track() ─────────────────────────────────────────────────────────────────

export function track(tipo: TipoEvento, datos: DatosEvento = {}) {
  try {
    if (typeof window === "undefined") return;
    // Visitas del equipo: ni Pixel ni /api/track (web_eventos / CAPI).
    if (esEquipoCliente()) return;
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
      pagina: paginaSinCampana(),
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
