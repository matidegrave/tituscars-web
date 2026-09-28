import Link from "next/link";
import { cn } from "@/lib/utils";
import { ORDEN_DEFECTO, toggleEnArray, urlCatalogo, type Filtros } from "@/lib/filtros";

const HASTA_15M = 14_999_999;

/**
 * Fila de accesos rápidos (en /autos y en la home del celu): links reales,
 * armados en el servidor con los filtros actuales (anda sin JS). Un chip
 * activo se ve lleno y al tocarlo se quita; los demás filtros se mantienen.
 */
export function AccesosRapidos({
  filtros,
  hayBaja,
  hayCeroKm,
  className,
}: {
  filtros: Filtros;
  /** Hay 2 o más autos con baja de precio. */
  hayBaja: boolean;
  /** Hay stock 0 KM. */
  hayCeroKm: boolean;
  className?: string;
}) {
  const hasta15 = filtros.precioMax === HASTA_15M && !filtros.precioMin;
  const chips: { texto: string; activo: boolean; nuevo: Filtros }[] = [
    {
      texto: "Hasta $15M",
      activo: hasta15,
      nuevo: hasta15
        ? { ...filtros, precioMax: undefined }
        : {
            ...filtros,
            precioMin: undefined,
            precioMax: HASTA_15M,
            orden: filtros.orden === ORDEN_DEFECTO ? "precio_asc" : filtros.orden,
          },
    },
    {
      texto: "Camionetas",
      activo: filtros.carroceria.includes("camioneta"),
      nuevo: { ...filtros, carroceria: toggleEnArray(filtros.carroceria, "camioneta") },
    },
    {
      texto: "SUV",
      activo: filtros.carroceria.includes("suv"),
      nuevo: { ...filtros, carroceria: toggleEnArray(filtros.carroceria, "suv") },
    },
    {
      texto: "Automáticos",
      activo: filtros.transmision.includes("automatica"),
      nuevo: { ...filtros, transmision: toggleEnArray(filtros.transmision, "automatica") },
    },
    {
      texto: "GNC",
      activo: filtros.combustible.includes("GNC"),
      nuevo: { ...filtros, combustible: toggleEnArray(filtros.combustible, "GNC") },
    },
    ...(hayBaja
      ? [{ texto: "Bajaron de precio", activo: Boolean(filtros.baja), nuevo: { ...filtros, baja: filtros.baja ? undefined : true } }]
      : []),
    ...(hayCeroKm
      ? [
          {
            texto: "0 KM",
            activo: filtros.condicion === "0km",
            nuevo: { ...filtros, condicion: filtros.condicion === "0km" ? undefined : ("0km" as const) },
          },
        ]
      : []),
  ];

  return (
    <nav
      aria-label="Accesos rápidos"
      className={cn(
        "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0 [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {chips.map((c) => (
        <Link
          key={c.texto}
          href={urlCatalogo(c.nuevo)}
          prefetch={false}
          aria-current={c.activo ? "true" : undefined}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
            c.activo
              ? "border-brand bg-brand text-white"
              : "border-zinc-300 bg-white text-foreground hover:border-brand hover:text-brand"
          )}
        >
          {c.texto}
        </Link>
      ))}
    </nav>
  );
}
