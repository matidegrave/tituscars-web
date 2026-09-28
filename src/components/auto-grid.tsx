import { AutoCard } from "@/components/auto-card";
import type { AutoCatalogo } from "@/lib/types";

export function AutoGrid({
  autos,
  mensajeVacio = "No encontramos autos con esos filtros.",
  prioridadPrimera = false,
}: {
  autos: AutoCatalogo[];
  mensajeVacio?: string;
  /** La primera card es la foto LCP de la página (listado /autos). */
  prioridadPrimera?: boolean;
}) {
  if (autos.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        {mensajeVacio}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {autos.map((auto, i) => (
        <AutoCard key={auto.id} auto={auto} prioridad={prioridadPrimera && i === 0} posicion={i + 1} />
      ))}
    </div>
  );
}
