import { unstable_cache } from "next/cache";
import { after } from "next/server";
import type { AutoCatalogo } from "@/lib/types";

/**
 * Color promedio de una foto ("#8a7f75"), de fondo mientras carga (tanda 40:
 * nada de cuadros grises). 7 bytes por foto en el HTML.
 *
 * Se calcula UNA vez por URL (las fotos no cambian: al editar un auto se suben
 * con otro nombre) y queda en el Data Cache para siempre. La página no espera
 * más de ESPERA_MS: las que no llegan salen sin color (el gris de siempre) y
 * se terminan de calcular después de responder (after), para la próxima.
 * Si sharp no carga o la foto falla, simplemente no hay color.
 */

const ESPERA_MS = 150;
const HEX = /^#[0-9a-f]{6}$/;

const calcular = unstable_cache(
  async (url: string): Promise<string> => {
    const r = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(`foto ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    const sharp = (await import("sharp")).default;
    const px = await sharp(buf).resize(1, 1, { fit: "fill" }).removeAlpha().raw().toBuffer();
    return `#${[px[0], px[1], px[2]].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
  },
  ["color-foto-v1"],
  { revalidate: false }
);

function soloFotosNuestras(url: string): boolean {
  try {
    return new URL(url).hostname === "nfkrhkewfusvdxsyuggg.supabase.co";
  } catch {
    return false;
  }
}

/** Colores de esas fotos (por URL); las que no estén listas a tiempo no figuran. */
export async function coloresDeFotos(urls: (string | null | undefined)[]): Promise<Record<string, string>> {
  const unicas = [...new Set(urls.filter((u): u is string => !!u && soloFotosNuestras(u)))];
  if (unicas.length === 0) return {};
  const colores: Record<string, string> = {};
  const trabajos = unicas.map((url) =>
    calcular(url)
      .then((hex) => {
        if (HEX.test(hex)) colores[url] = hex;
      })
      .catch(() => {})
  );
  let tarde = false;
  await Promise.race([
    Promise.all(trabajos),
    new Promise<void>((ok) => setTimeout(() => ((tarde = true), ok()), ESPERA_MS)),
  ]);
  if (tarde) {
    try {
      after(() => Promise.all(trabajos));
    } catch {
      // fuera de una request (build): no hace falta
    }
  }
  return { ...colores };
}

/** Los autos con color_foto (el de su foto principal) cuando está. */
export async function conColores(autos: AutoCatalogo[]): Promise<AutoCatalogo[]> {
  try {
    const colores = await coloresDeFotos(autos.map((a) => a.foto_principal));
    return autos.map((a) => (a.foto_principal && colores[a.foto_principal] ? { ...a, color_foto: colores[a.foto_principal] } : a));
  } catch {
    return autos;
  }
}
