import { leerDatos, leerResumen, type Informe } from "@/lib/informe";

/**
 * Vista previa del informe en el panel de revisión del ERP (iframe a
 * /informe/preview + postMessage). CONTRATO CERRADO: docs/informe-tanda-pagina-publica.md
 * del repo de gestión, sección «Vista previa del panel de revisión del ERP».
 * Ninguno de los dos lados lo cambia sin cambiar ese doc primero.
 * Orígenes del ERP: lib/informe-origenes.ts (también los usa next.config.ts).
 */
export { origenesErp } from "@/lib/informe-origenes";

const PREFIJO = "titus.informe.preview.";
export const TIPO_LISTA = `${PREFIJO}lista`;
export const TIPO_DATOS = `${PREFIJO}datos`;
export const TIPO_RENDERIZADO = `${PREFIJO}renderizado`;
export const TIPO_ERROR = `${PREFIJO}error`;
export const VERSION = 1;

export const SIN_DATOS = "no llegaron los datos de la vista previa";

type Obj = Record<string, unknown>;
const esObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Pasos 3 a 7 del contrato sobre un mensaje que ya vino de window.parent y de
 * un origen de la lista (pasos 1 y 2, en la página). Devuelve el informe listo
 * para InformeVista o el motivo exacto del error.
 */
export function validarDatos(msg: unknown): { informe: Informe } | { error: string } {
  if (!esObj(msg)) return { error: "el mensaje no es un objeto" };
  if (msg.tipo !== TIPO_DATOS) return { error: `tipo de mensaje inesperado: ${JSON.stringify(msg.tipo ?? null)}` };
  if (msg.version !== VERSION) return { error: `versión de contrato no soportada: ${JSON.stringify(msg.version ?? null)}` };

  const informe = msg.informe;
  if (!esObj(informe)) return { error: "falta informe" };
  const d = informe.datos;
  if (!esObj(d)) return { error: "falta informe.datos" };
  if (d.version !== 1) return { error: "informe.datos.version tiene que ser 1" };
  if (typeof d.vehiculo !== "string") return { error: "falta informe.datos.vehiculo" };
  const periodo = esObj(d.periodo) ? d.periodo : null;
  if (typeof periodo?.desde !== "string") return { error: "falta informe.datos.periodo.desde" };
  if (typeof periodo?.hasta !== "string") return { error: "falta informe.datos.periodo.hasta" };
  if (!esObj(d.numeros)) return { error: "falta informe.datos.numeros" };
  if (!Array.isArray(d.serie)) return { error: "falta informe.datos.serie" };
  if ("interno" in d) return { error: "datos.interno no puede llegar a la vista previa" };
  if (typeof informe.resumen !== "string" && informe.resumen !== null) {
    return { error: "informe.resumen tiene que ser texto o null" };
  }

  // Lo mismo que lee /informe/[token]: si algo más no sirve, se nombra el campo.
  const leido = leerDatos(d);
  if ("falta" in leido) return { error: `falta o no es válido informe.datos.${leido.falta}` };
  return { informe: { datos: leido.datos, resumen: leerResumen(informe.resumen) } };
}
