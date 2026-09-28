import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Estrellas del puntaje real de Google ("4,8" -> 4 llenas y la quinta llena
 * al 80%). Sin JS: la parte llena es una capa recortada encima de la vacía.
 */
export function EstrellasPuntaje({
  puntaje,
  className,
  estrellaClassName = "h-6 w-6",
}: {
  /** Como se muestra en la web: "4,8". */
  puntaje: string;
  className?: string;
  estrellaClassName?: string;
}) {
  const valor = Math.max(0, Math.min(5, Number(puntaje.replace(",", "."))));
  return (
    <div className={cn("flex gap-1", className)} role="img" aria-label={`${puntaje} de 5 estrellas`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const lleno = Math.max(0, Math.min(1, valor - i));
        return (
          <span key={i} className="relative inline-block">
            <Star className={cn(estrellaClassName, "text-brand/30")} aria-hidden="true" />
            <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${lleno * 100}%` }}>
              <Star className={cn(estrellaClassName, "fill-brand text-brand")} aria-hidden="true" />
            </span>
          </span>
        );
      })}
    </div>
  );
}
