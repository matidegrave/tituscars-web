/**
 * Herramientas de vendedor (tanda 41, sólo en modo equipo): el texto que el
 * vendedor copia para mandarle a un cliente por WhatsApp, y la selección
 * múltiple de autos (sessionStorage, try/catch: sobrevive a cambiar filtros).
 * Los links NO llevan la marca de equipo (es del dispositivo): la visita del
 * cliente cuenta y queda atribuida al vendedor en utm_campaign.
 */

import { SITE_URL } from "@/lib/config";
import { formatKm } from "@/lib/format";
import type { AutoCatalogo } from "@/lib/types";

/** Lo mínimo de un auto para armar el texto (viene armado desde el servidor). */
export interface AutoParaCliente {
  slug: string;
  /** "TOYOTA COROLLA XEI" */
  titulo: string;
  anio: number;
  /** "45.000 km · Nafta · Automática" */
  datos: string;
  /** "$ 27.500.000" */
  precio: string;
}

/** "45.000 km · Nafta · Automática" (sin el año: va en la primera línea). */
export function datosParaCliente(
  a: Pick<AutoCatalogo, "km" | "combustible" | "transmision">,
): string {
  return [
    formatKm(a.km),
    a.combustible,
    a.transmision === "manual"
      ? "Manual"
      : a.transmision === "automatica"
        ? "Automática"
        : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export const ENCABEZADO_POR_DEFECTO = "Te paso algunas opciones:";

export function linkParaCliente(slug: string, vendedor: string): string {
  const q = new URLSearchParams({
    utm_source: "vendedor",
    utm_medium: "whatsapp",
    utm_campaign: vendedor,
  });
  return `${SITE_URL}/autos/${slug}?${q.toString()}`;
}

/**
 * TOYOTA COROLLA XEI 2022
 * 45.000 km · Nafta · Automática
 * $ 27.500.000
 * https://tituscars.com/autos/SLUG?utm_source=vendedor&utm_medium=whatsapp&utm_campaign=luca
 */
export function textoParaCliente(a: AutoParaCliente, vendedor: string): string {
  return [
    `${a.titulo} ${a.anio}`,
    a.datos,
    a.precio,
    linkParaCliente(a.slug, vendedor),
  ]
    .filter(Boolean)
    .join("\n");
}

/** Varios: encabezado y los autos numerados "1) ...", separados por una línea en blanco. */
export function textoVariosParaCliente(
  autos: AutoParaCliente[],
  vendedor: string,
  encabezado: string,
): string {
  const cuerpo = autos
    .map((a, i) => `${i + 1}) ${textoParaCliente(a, vendedor)}`)
    .join("\n\n");
  const arriba = encabezado.trim();
  return arriba ? `${arriba}\n\n${cuerpo}` : cuerpo;
}

/** Copia al portapapeles; si no hay Clipboard API (o falla), con un textarea. */
export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // sigue con el método viejo
  }
  try {
    const area = document.createElement("textarea");
    area.value = texto;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.left = "0";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, texto.length); // iOS
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

// ─── Selección múltiple ──────────────────────────────────────────────────────

const CLAVE_SELECCION = "tc_seleccion_vendedor";
const EVENTO_SELECCION = "titus:seleccion";
const vacia: AutoParaCliente[] = [];
let cache: { raw: string | null; lista: AutoParaCliente[] } = {
  raw: null,
  lista: vacia,
};

export function leerSeleccion(): AutoParaCliente[] {
  try {
    const raw = sessionStorage.getItem(CLAVE_SELECCION);
    if (raw === cache.raw) return cache.lista;
    const lista = raw ? (JSON.parse(raw) as AutoParaCliente[]) : vacia;
    cache = { raw, lista: Array.isArray(lista) ? lista : vacia };
    return cache.lista;
  } catch {
    return cache.lista;
  }
}

function guardarSeleccion(lista: AutoParaCliente[]) {
  try {
    sessionStorage.setItem(CLAVE_SELECCION, JSON.stringify(lista));
  } catch {
    cache = { raw: null, lista };
  }
  window.dispatchEvent(new Event(EVENTO_SELECCION));
}

export function estaSeleccionado(slug: string): boolean {
  return leerSeleccion().some((a) => a.slug === slug);
}

export function alternarSeleccion(a: AutoParaCliente) {
  const lista = leerSeleccion();
  guardarSeleccion(
    lista.some((x) => x.slug === a.slug)
      ? lista.filter((x) => x.slug !== a.slug)
      : [...lista, a],
  );
}

export function limpiarSeleccion() {
  guardarSeleccion([]);
}

export function suscribirSeleccion(avisar: () => void): () => void {
  window.addEventListener(EVENTO_SELECCION, avisar);
  return () => window.removeEventListener(EVENTO_SELECCION, avisar);
}
