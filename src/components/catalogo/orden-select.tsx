"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { camposOcultos, OPCIONES_ORDEN, urlCatalogo, type Filtros } from "@/lib/filtros";
import { FormFiltro, SelectNativo } from "@/components/catalogo/filtro-controles";

/**
 * Orden del catálogo: <select> nativo dentro de un form GET (anda sin JS y en
 * navegadores viejos). Con JS aplica al cambiar, sin recargar.
 */
export function OrdenSelect({
  filtros,
  className,
}: {
  filtros: Filtros;
  className?: string;
}) {
  const router = useRouter();
  return (
    <FormFiltro
      key={filtros.orden}
      ocultos={camposOcultos(filtros, ["orden"])}
      onAplicar={(datos) => router.push(urlCatalogo({ ...filtros, orden: String(datos.get("orden") ?? "") }))}
      className="w-full lg:w-fit"
    >
      <SelectNativo
        name="orden"
        aria-label="Ordenar por"
        defaultValue={filtros.orden}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={cn("h-10 font-medium lg:h-9", className)}
      >
        {OPCIONES_ORDEN.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </SelectNativo>
    </FormFiltro>
  );
}
