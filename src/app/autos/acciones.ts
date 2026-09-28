"use server";

import { getAutosPaginados } from "@/lib/autos";
import { conColores } from "@/lib/color-foto";
import type { Filtros } from "@/lib/filtros";
import type { AutoCatalogo } from "@/lib/types";

/** Siguiente tanda del scroll infinito del catálogo (solo lectura del catálogo público). */
export async function cargarMasAutos(filtros: Filtros, page: number): Promise<AutoCatalogo[]> {
  const pagina = Number.isFinite(page) ? Math.min(Math.max(1, Math.floor(page)), 500) : 1;
  const { autos } = await getAutosPaginados({ ...filtros, page: pagina });
  return conColores(autos);
}
