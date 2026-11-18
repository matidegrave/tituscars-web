import Link from "next/link";
import type { Seccion, SearchParamsCatalogo } from "@/lib/filtros";
import type { Condicion } from "@/lib/types";

/** Estilo de las pastillas segmentadas del catálogo (Autos | Motos, Todos | Usados | 0 KM). */
export const CLASE_GRUPO = "inline-flex w-fit items-center gap-1 rounded-lg bg-muted p-[3px]";
export function claseOpcion(activo: boolean): string {
  return `rounded-md px-3 py-1 text-sm font-medium transition-colors ${
    activo ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
  }`;
}

export const SECCIONES: { value: Seccion; label: string; ruta: "/autos" | "/motos" }[] = [
  { value: "autos", label: "Autos", ruta: "/autos" },
  { value: "motos", label: "Motos", ruta: "/motos" },
];

const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

/** Los utm_* con que se llegó, para que el cambio de sección siga atribuido. */
export function utmDe(sp: SearchParamsCatalogo): [string, string][] {
  const out: [string, string][] = [];
  for (const k of UTM) {
    const v = Array.isArray(sp[k]) ? sp[k][0] : sp[k];
    if (v) out.push([k, v.slice(0, 150)]);
  }
  return out;
}

/**
 * Autos | Motos (WEB-MOTOS3): links reales, armados en el servidor. Al cambiar
 * de sección se conserva Todos/Usados/0 KM y los utm; el resto de los filtros
 * no (marca, carrocería, cilindrada… no valen de una sección a la otra).
 */
export function SeccionTabs({
  seccion,
  condicion,
  utm,
}: {
  seccion: Seccion;
  condicion?: Condicion;
  utm: [string, string][];
}) {
  return (
    <nav aria-label="Autos o motos" className={CLASE_GRUPO}>
      {SECCIONES.map((s) => {
        const activo = s.value === seccion;
        const p = new URLSearchParams(condicion ? [["condicion", condicion], ...utm] : utm);
        const query = p.toString();
        return (
          <Link
            key={s.value}
            href={query ? `${s.ruta}?${query}` : s.ruta}
            prefetch={false}
            // Con query (condición/utm) es una variante filtrada: no se sigue.
            rel={query ? "nofollow" : undefined}
            aria-current={activo ? "page" : undefined}
            className={claseOpcion(activo)}
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
