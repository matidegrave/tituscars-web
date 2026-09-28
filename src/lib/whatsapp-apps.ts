/**
 * WhatsApp desde el navegador interno de TikTok, Instagram y Facebook: ahí el
 * link wa.me queda en api.whatsapp.com y "Abrir aplicación" falla (el
 * navegador de la app bloquea el salto). En esos navegadores se intenta el
 * esquema directo whatsapp://send y, si la página sigue visible, se muestra
 * un panel con la salida manual (components/whatsapp-en-apps.tsx).
 * Fuera de esos navegadores no cambia nada: wa.me como siempre.
 */

export type NavegadorDeApp = "tiktok" | "instagram" | "facebook";

export function navegadorDeApp(ua?: string): NavegadorDeApp | null {
  const agente = ua ?? (typeof navigator !== "undefined" ? navigator.userAgent : "");
  if (/musical_ly|BytedanceWebview|TikTok/i.test(agente)) return "tiktok";
  if (/Instagram/i.test(agente)) return "instagram";
  if (/FBAN|FBAV|FB_IAB/.test(agente)) return "facebook";
  return null;
}

/** wa.me/NUM?text=T o api.whatsapp.com/send?phone=NUM&text=T -> datos del chat. */
export function datosWhatsapp(url: string): { numero: string; texto: string } | null {
  try {
    const u = new URL(url);
    if (u.hostname === "wa.me") {
      return { numero: u.pathname.replace(/\D/g, ""), texto: u.searchParams.get("text") ?? "" };
    }
    if (u.hostname === "api.whatsapp.com") {
      return { numero: (u.searchParams.get("phone") ?? "").replace(/\D/g, ""), texto: u.searchParams.get("text") ?? "" };
    }
  } catch {
    // URL inválida
  }
  return null;
}

export function esquemaWhatsapp(url: string): string | null {
  const d = datosWhatsapp(url);
  if (!d?.numero) return null;
  return `whatsapp://send?phone=${d.numero}&text=${encodeURIComponent(d.texto)}`;
}

export const EVENTO_WHATSAPP_APP = "titus:whatsapp-app";

/**
 * Para los que abren WhatsApp por código (formularios): en un navegador de app
 * lo resuelve el componente global; si no, devuelve false y se abre wa.me.
 */
export function abrirWhatsappEnApp(url: string): boolean {
  if (!navegadorDeApp()) return false;
  window.dispatchEvent(new CustomEvent(EVENTO_WHATSAPP_APP, { detail: { url } }));
  return true;
}
