import type { AutoCatalogo } from "@/lib/types";

/**
 * Cartel "En salón" (verde) / "Con cita previa" (naranja; va en mayúsculas). En la card se achica
 * desde sm; en la ficha queda siempre del tamaño de la card en celu.
 */
export function PastillaDisponibilidad({
  disponibilidad,
  chicaDesdeSm = false,
}: {
  disponibilidad: AutoCatalogo["disponibilidad"];
  chicaDesdeSm?: boolean;
}) {
  const color = disponibilidad === "salon" ? "bg-[#16A34A]" : "bg-brand";
  const tamano = chicaDesdeSm ? "sm:px-2 sm:py-0.5 sm:text-[10px]" : "";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm ${color} ${tamano}`}
    >
      {disponibilidad === "salon" ? "En salón" : "Con cita previa"}
    </span>
  );
}
