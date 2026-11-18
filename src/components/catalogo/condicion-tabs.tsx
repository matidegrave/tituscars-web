import Link from "next/link";
import { urlCatalogo, type Filtros } from "@/lib/filtros";
import type { Condicion } from "@/lib/types";
import { CLASE_GRUPO, claseOpcion } from "@/components/catalogo/seccion-tabs";

const OPCIONES: { value: Condicion | undefined; label: string }[] = [
  { value: undefined, label: "Todos" },
  { value: "usado", label: "Usados" },
  { value: "0km", label: "0 KM" },
];

/** Todos / Usados / 0 KM: links reales (andan sin JS), armados en el servidor. */
export function CondicionTabs({ filtros }: { filtros: Filtros }) {
  return (
    <div className={CLASE_GRUPO}>
      {OPCIONES.map((op) => {
        const activo = filtros.condicion === op.value;
        return (
          <Link
            key={op.label}
            href={urlCatalogo({ ...filtros, condicion: op.value })}
            prefetch={false}
            // Filtro: no se sigue (tanda 46b).
            rel="nofollow"
            aria-current={activo ? "page" : undefined}
            className={claseOpcion(activo)}
          >
            {op.label}
          </Link>
        );
      })}
    </div>
  );
}
