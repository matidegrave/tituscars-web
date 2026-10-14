/**
 * Anuncio de origen (utm_source, utm_campaign, utm_content), guardado en
 * sessionStorage para que sobreviva a la navegación por el catálogo. Entrar con
 * utm pisa lo guardado; entrar sin utm lo deja como estaba. Sólo navegador.
 * Es aparte de la sesión de lib/tracking.ts (esa congela los utm del primer
 * landing; acá el último anuncio con utm es el que manda).
 */

const CLAVE_UTM = "titus-utm";
const LARGO_MAX = 100;

export interface UtmGuardado {
  utm_source?: string;
  utm_campaign?: string;
  utm_content?: string;
}

const CAMPOS = ["utm_source", "utm_campaign", "utm_content"] as const;

/** Sin saltos de línea ni espacios de más; vacío si no queda nada. */
function limpiar(valor: string | null): string | undefined {
  const v = (valor ?? "").replace(/\s+/g, " ").trim().slice(0, LARGO_MAX);
  return v || undefined;
}

/** Lo que haya guardado ({} si nada o si sessionStorage está bloqueado). */
export function leerUtm(): UtmGuardado {
  try {
    const crudo = sessionStorage.getItem(CLAVE_UTM);
    return crudo ? (JSON.parse(crudo) as UtmGuardado) : {};
  } catch {
    return {};
  }
}

/** Si la URL actual trae algún utm, lo guarda (pisa lo anterior). Si no, no toca nada. */
export function guardarUtmDeLaUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const nuevo: UtmGuardado = {};
    for (const campo of CAMPOS) {
      const v = limpiar(params.get(campo));
      if (v) nuevo[campo] = v;
    }
    if (Object.keys(nuevo).length === 0) return;
    sessionStorage.setItem(CLAVE_UTM, JSON.stringify(nuevo));
  } catch {
    // sessionStorage bloqueado: sin utm, el resto de la web funciona igual
  }
}
