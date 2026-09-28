"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const ZONA_ARRIBA = 150; // px de scroll donde la barra se ve siempre
const TEMBLOR = 8; // movimientos menores se ignoran (inercia de iOS)
const SUBIDA_PARA_MOSTRAR = 40; // cuánto hay que subir para que vuelva

/**
 * Barra del celu en /autos (buscador + Filtros + orden). Es sticky debajo del
 * header: ocupa su lugar en la página (no empuja nada ni mueve el scroll
 * infinito ni la restauración al volver de una ficha). Al bajar se esconde
 * detrás del header; al subir ~40 px reaparece, esté donde esté la lista. En
 * los primeros 150 px se ve siempre. No se esconde con el panel de filtros
 * abierto ni con el teclado del buscador arriba. Un solo listener de scroll
 * pasivo con requestAnimationFrame; nada de APIs nuevas (iOS 16.1, Chrome 109).
 */
export function BarraCatalogoCelu({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const barra = useRef<HTMLDivElement>(null);
  const [oculta, setOculta] = useState(false);
  const [flotando, setFlotando] = useState(false);

  useEffect(() => {
    const el = barra.current;
    if (!el) return;
    let frame = 0;
    let ultimoY = Math.max(window.scrollY, 0);
    let subida = 0;
    let ocultaAhora = false;

    const header = () =>
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--header-h",
        ),
      ) * 16 || 64;

    // Panel de filtros abierto o foco en un campo de la barra (teclado arriba).
    const bloqueada = () =>
      Boolean(document.querySelector('[data-slot="sheet-overlay"]')) ||
      el.contains(document.activeElement);

    const mostrar = (valor: boolean) => {
      if (ocultaAhora === !valor) return;
      ocultaAhora = !valor;
      setOculta(!valor);
    };

    const actualizar = () => {
      frame = 0;
      const y = Math.max(window.scrollY, 0);
      // ¿Está pegada debajo del header (flotando sobre las cards)?
      const pegada = el.getBoundingClientRect().top <= header() + 1 && y > 0;
      setFlotando(pegada);

      if (y < ZONA_ARRIBA || !pegada || bloqueada()) {
        subida = 0;
        ultimoY = y;
        mostrar(true);
        return;
      }
      const delta = y - ultimoY;
      if (Math.abs(delta) < TEMBLOR) return;
      ultimoY = y;
      if (delta > 0) {
        subida = 0;
        mostrar(false);
      } else {
        subida -= delta;
        if (subida >= SUBIDA_PARA_MOSTRAR) mostrar(true);
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(actualizar);
    };

    actualizar();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={barra}
      data-oculta={oculta ? "" : undefined}
      className={cn(
        // Sticky debajo del header (z-40), por encima de las cards. A todo el
        // ancho del celu (sale del padding del contenedor) con el gris del catálogo.
        "sticky top-[var(--header-h)] z-30 -mx-4 bg-zinc-100 px-4 pb-3 pt-3 sm:-mx-6 sm:px-6 lg:hidden",
        "motion-safe:transition-[transform,box-shadow] motion-safe:duration-200",
        oculta && "-translate-y-full",
        flotando && !oculta && "shadow-[0_6px_12px_-6px_rgba(0,0,0,0.18)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
