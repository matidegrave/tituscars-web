/**
 * Textos de las páginas /usados (tanda 42): cada uno con los datos reales de
 * esa página (cantidad, precio más bajo, modelos o marcas que más hay, años),
 * para que no haya dos páginas con el mismo texto ni relleno genérico.
 */

import type { AutoResumen } from "@/lib/autos";
import { DIRECCION_CALLE } from "@/lib/config";
import { formatPrecio } from "@/lib/format";
import { nombrePagina, type PaginaUsados } from "@/lib/usados";

/** Los más repetidos ("Hilux, Corolla y Etios"), por cantidad. */
function masRepetidos(valores: string[], cuantos = 3, final = " y "): string {
  const cuenta = new Map<string, number>();
  for (const v of valores) if (v) cuenta.set(v, (cuenta.get(v) ?? 0) + 1);
  const top = [...cuenta]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, cuantos)
    .map(([v]) => v);
  return top.length <= 1
    ? (top[0] ?? "")
    : `${top.slice(0, -1).join(", ")}${final}${top[top.length - 1]}`;
}

/** Primera palabra del modelo ("Hilux SRV 4x4" -> "Hilux"). */
const modeloCorto = (a: AutoResumen) => a.modelo.split(/\s+/)[0] ?? a.modelo;
const conMarca = (a: AutoResumen) => `${a.marca} ${modeloCorto(a)}`;

function datos(autos: AutoResumen[]) {
  const precios = autos.map((a) => a.precio_ars).filter((p) => p > 0);
  const anios = autos.map((a) => a.anio);
  return {
    n: autos.length,
    desde: precios.length ? formatPrecio(Math.min(...precios), "ARS") : null,
    anioMin: anios.length ? Math.min(...anios) : null,
    anioMax: anios.length ? Math.max(...anios) : null,
  };
}

const plural = (n: number, uno: string, varios: string) =>
  n === 1 ? `1 ${uno}` : `${n} ${varios}`;

/** H1 / title: "Toyota usados en Córdoba". */
export function tituloPagina(p: PaginaUsados): string {
  return `${nombrePagina(p)} en Córdoba`;
}

/** Meta description, con el número real. */
export function descripcionPagina(
  p: PaginaUsados,
  autos: AutoResumen[],
): string {
  const { n, desde } = datos(autos);
  const nombre = nombrePagina(p);
  // "Toyota usados" y "SUV usados" quedan igual; "Camionetas usadas" -> "camionetas usadas".
  const enMinuscula =
    p.tipo === "marca" || /^[A-Z]{2}/.test(nombre)
      ? nombre
      : nombre.charAt(0).toLowerCase() + nombre.slice(1);
  if (n < 2)
    return `${nombre} en Córdoba: hoy hay pocas unidades en stock. Mirá opciones parecidas o escribinos y te avisamos cuando entre una.`;
  const ejemplos =
    p.tipo === "marca"
      ? masRepetidos(autos.map(modeloCorto), 3, ", ")
      : masRepetidos(autos.map(conMarca), 3, ", ");
  return `${n} ${enMinuscula} con fotos y precio en Titus Cars, Córdoba${desde ? `, desde ${desde}` : ""}. ${ejemplos} y más.`;
}

/** Párrafo corto (2-3 líneas) propio de cada página. */
export function textoPagina(p: PaginaUsados, autos: AutoResumen[]): string {
  const { n, desde, anioMin, anioMax } = datos(autos);
  const precio = desde ? `, desde ${desde}` : "";
  const anios =
    anioMin && anioMax && anioMin !== anioMax
      ? ` Hay modelos ${anioMin} a ${anioMax}.`
      : "";
  const automaticos = autos.filter(
    (a) => a.transmision === "automatica",
  ).length;
  const diesel = autos.filter((a) => a.combustible === "Diesel").length;
  if (n === 0) {
    const nombre = nombrePagina(p);
    return `Hoy no tenemos ${p.tipo === "marca" ? nombre : nombre.charAt(0).toLowerCase() + nombre.slice(1)} en stock. Entran autos todas las semanas: escribinos y te avisamos cuando llegue uno.`;
  }
  switch (p.tipo) {
    case "marca":
      return `En Titus Cars hoy hay ${plural(n, `${p.marca} usado`, `${p.marca} usados`)} en stock${precio}: ${masRepetidos(autos.map(modeloCorto))}.${anios} ${n === 1 ? "Tiene fotos reales; se ve" : "Todos con fotos reales; se ven"} en el salón de ${DIRECCION_CALLE}, Córdoba, o con cita.`;
    case "carroceria":
      switch (p.carroceria) {
        case "camioneta":
          return `Pick-ups y camionetas usadas para el trabajo o el campo: ${masRepetidos(autos.map(conMarca))}. ${plural(n, "camioneta", "camionetas")} en stock${precio}${diesel ? `, ${diesel === n ? "todas" : diesel} diésel` : ""}.`;
        case "suv":
          return `SUV usados, más altos y con más baúl que un auto: ${masRepetidos(autos.map(conMarca))}. ${plural(n, "SUV", "SUV")} en stock${precio}${automaticos ? `; ${automaticos === n ? "todos" : automaticos} con caja automática` : ""}.`;
        case "utilitario":
          return `Utilitarios usados para trabajar y cargar: ${masRepetidos(autos.map(conMarca))}. ${plural(n, "utilitario", "utilitarios")} en stock${precio}.${anios}`;
        default:
          return `Autos usados para el día a día, sedanes y hatchbacks: ${masRepetidos(autos.map(conMarca))}. ${plural(n, "auto", "autos")} en stock${precio}.${anios}`;
      }
    case "automaticos":
      return `Autos usados con caja automática, cómodos para la ciudad: ${masRepetidos(autos.map(conMarca))}. ${plural(n, "automático", "automáticos")} en stock${precio}.${anios}`;
    case "combustible":
      return p.combustible === "GNC"
        ? `Autos usados que ya tienen el equipo de GNC instalado, para gastar menos por kilómetro: ${masRepetidos(autos.map(conMarca))}. ${plural(n, "auto", "autos")} en stock${precio}.`
        : `Autos y camionetas diésel usados, de motor gasolero: ${masRepetidos(autos.map(conMarca))}. ${plural(n, "unidad", "unidades")} en stock${precio}.${anios}`;
    case "precio": {
      const marcas = new Set(autos.map((a) => a.marca)).size;
      return `Autos usados de hasta ${p.millones} millones de pesos: ${plural(n, "opción", "opciones")} en stock, de ${
        marcas > 3
          ? `${masRepetidos(
              autos.map((a) => a.marca),
              3,
              ", ",
            )} y otras marcas`
          : masRepetidos(autos.map((a) => a.marca))
      }. El más accesible cuesta ${desde ?? "-"}; una parte se puede financiar.`;
    }
  }
}
