"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Carrusel de tarjetas sin librerías (tanda 47): scroll horizontal nativo con
 * scroll-snap, así se desliza con el dedo aunque no haya JS.
 * - Celu: cada tarjeta ocupa ~85% del ancho y asoma la siguiente.
 * - Flechas naranjas sobre las fotos (avanzan una tarjeta): la izquierda no
 *   está en el primer ítem y la derecha no está en el último. Si entran
 *   todas, no hay flechas. Aparecen recién con JS.
 * - grillaDesdeSm: desde sm deja de ser carrusel y es la grilla de siempre
 *   (ficha: "Otros autos que te pueden interesar").
 */
export function CarruselTarjetas({
  children,
  grillaDesdeSm = false,
  etiqueta,
}: {
  children: ReactNode;
  grillaDesdeSm?: boolean;
  /** aria-label de la lista. */
  etiqueta: string;
}) {
  const pista = useRef<HTMLUListElement>(null);
  const [listo, setListo] = useState(false);
  const [alInicio, setAlInicio] = useState(true);
  const [alFinal, setAlFinal] = useState(true);

  useEffect(() => {
    const el = pista.current;
    if (!el) return;
    const medir = () => {
      setAlInicio(el.scrollLeft <= 4);
      setAlFinal(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
    };
    medir();
    setListo(true);
    el.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", medir);
    return () => {
      el.removeEventListener("scroll", medir);
      window.removeEventListener("resize", medir);
    };
  }, []);

  function mover(sentido: 1 | -1) {
    const el = pista.current;
    const item = el?.firstElementChild as HTMLElement | null;
    if (!el || !item) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    el.scrollBy({ left: sentido * (item.offsetWidth + gap), behavior: "smooth" });
  }

  const flecha =
    "pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#ff5500] text-white shadow-md transition-opacity hover:opacity-90";

  return (
    <div className="relative">
      <ul
        ref={pista}
        aria-label={etiqueta}
        className={cn(
          "-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "[&>li]:flex [&>li]:w-[85%] [&>li]:shrink-0 [&>li]:snap-start [&>li>*]:w-full",
          grillaDesdeSm
            ? "sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 xl:grid-cols-4 sm:[&>li]:w-auto"
            : "sm:[&>li]:w-[calc((100%-1rem)/2)] lg:[&>li]:w-[calc((100%-2rem)/3)] xl:[&>li]:w-[calc((100%-3rem)/4)]"
        )}
      >
        {Children.map(children, (hijo) => (
          <li>{hijo}</li>
        ))}
      </ul>

      {/* Franja del alto de las fotos (4:3 del ancho de una tarjeta): las
          flechas quedan centradas sobre ellas. */}
      {listo && !(alInicio && alFinal) && (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between",
            "aspect-[160/102] sm:aspect-[8/3] lg:aspect-[4/1] xl:aspect-[16/3]",
            grillaDesdeSm && "sm:hidden"
          )}
        >
          <span className="-ml-1">
            {!alInicio && (
              <button type="button" onClick={() => mover(-1)} aria-label="Anterior" className={flecha}>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </span>
          <span className="-mr-1">
            {!alFinal && (
              <button type="button" onClick={() => mover(1)} aria-label="Siguiente" className={flecha}>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
