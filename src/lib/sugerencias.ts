import type { FacetMarca } from "@/lib/facets";
import { rutaCatalogo, type Seccion } from "@/lib/filtros";
import { CATEGORIAS_SUGERIDAS, nombrePropio, normalizar, type Sugerencia } from "@/lib/busqueda";

/**
 * Lista chica para las sugerencias del buscador, armada en el servidor con el
 * stock (viene en el HTML): marcas ("Nissan" -> filtro de marca), marca +
 * modelo corto ("Nissan Versa" -> búsqueda de texto; el modelo a veces trae
 * la versión entera, se toma su primera palabra) y categorías.
 */
export function listaSugerencias(marcas: FacetMarca[], seccion?: Seccion): Sugerencia[] {
  const lista: Sugerencia[] = [];
  // En /motos las marcas y modelos son de motos y llevan a /motos (WEB-MOTOS1).
  const ruta = rutaCatalogo({ seccion });
  const modelos = new Map<string, { texto: string; cantidad: number }>();
  for (const m of marcas) {
    const marca = nombrePropio(m.marca);
    lista.push({
      texto: marca,
      cantidad: m.cantidad,
      href: `${ruta}?marca=${encodeURIComponent(m.marca)}`,
      clave: normalizar(m.marca),
    });
    for (const mo of m.modelos) {
      const corto = nombrePropio(mo.modelo.split(/\s+/)[0] ?? mo.modelo);
      const texto = `${marca} ${corto}`;
      const previo = modelos.get(texto);
      modelos.set(texto, { texto, cantidad: (previo?.cantidad ?? 0) + mo.cantidad });
    }
  }
  for (const { texto, cantidad } of modelos.values()) {
    lista.push({ texto, cantidad, href: `${ruta}?q=${encodeURIComponent(texto)}`, clave: normalizar(texto) });
  }
  for (const c of CATEGORIAS_SUGERIDAS) {
    const href = c.query === "carroceria=moto" ? "/motos" : `/autos?${c.query}`;
    lista.push({ texto: c.texto, href, clave: [normalizar(c.texto), ...c.claves].join(" ") });
  }
  return lista;
}
