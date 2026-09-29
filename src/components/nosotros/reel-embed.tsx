"use client";

import { useEffect, useRef, useState } from "react";
import { urlEmbed, urlInstagram, type VideoInstagram } from "@/lib/historia";
import { cn } from "@/lib/utils";

/** Se monta el iframe cuando la tarjeta está a menos de esto de la pantalla (sólo vertical). */
const MARGEN_MONTAR = "600px 0px";
/** Y se desmonta (vuelve el placeholder) cuando queda más lejos que esto: memoria de celus viejos. */
const MARGEN_DESMONTAR = "2500px 0px";

/**
 * Reel de Instagram dentro de la página (tanda 44b): un solo toque, el play de
 * Instagram. El iframe de /embed/ (sin embed.js) se monta solo cuando la
 * tarjeta se acerca a la pantalla y se desmonta cuando queda lejos. En los
 * carruseles horizontales cuenta recién cuando el ítem entra en vista (el
 * carrusel recorta: IntersectionObserver lo ve afuera).
 * Mientras tanto, un placeholder gris con pulso (no parece un botón). Sin JS
 * o sin IntersectionObserver, ese placeholder es un link al reel.
 * Abajo, siempre, "¿No carga? Verlo en Instagram": los reels con música con
 * derechos a veces no se reproducen embebidos.
 */
export function ReelEmbed({ video, fecha, className }: { video: VideoInstagram; fecha?: string; className?: string }) {
  const caja = useRef<HTMLDivElement>(null);
  const [montado, setMontado] = useState(false);
  // Hasta que el iframe termina de cargar se ve el gris con pulso (no un recuadro blanco).
  const [cargado, setCargado] = useState(false);
  const url = urlInstagram(video);

  useEffect(() => {
    const el = caja.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const cerca = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) setMontado(true);
      },
      { rootMargin: MARGEN_MONTAR }
    );
    const lejos = new IntersectionObserver(
      (entradas) => {
        if (entradas.every((e) => !e.isIntersecting)) {
          setMontado(false);
          setCargado(false);
        }
      },
      { rootMargin: MARGEN_DESMONTAR }
    );
    cerca.observe(el);
    // Para desmontar cuenta sólo la distancia vertical: en un carrusel se mira
    // la fila entera (el ítem que salió por el costado no se desmonta; si no,
    // al volver a él se recargaría el reel).
    lejos.observe(el.closest("[data-carrusel]") ?? el);
    return () => {
      cerca.disconnect();
      lejos.disconnect();
    };
  }, []);

  return (
    <div className={cn("w-full max-w-[340px]", className)}>
      {/* Misma proporción para el placeholder y el iframe: el cambio no mueve nada. */}
      <div
        ref={caja}
        className={cn(
          "aspect-[9/17] w-full max-w-[400px] rounded-2xl",
          !cargado && "bg-zinc-200 motion-safe:animate-pulse"
        )}
      >
        {montado ? (
          <iframe
            src={urlEmbed(video)}
            title={`Video de Titus Cars en Instagram${fecha ? ` (${fecha})` : ""}`}
            allow="autoplay; encrypted-media; picture-in-picture; clipboard-write"
            allowFullScreen
            loading="lazy"
            onLoad={() => setCargado(true)}
            className={cn("block h-full w-full rounded-2xl", cargado ? "border border-border bg-white" : "opacity-0")}
          />
        ) : (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Ver en Instagram${fecha ? ` (${fecha})` : ""}`}
            className="block h-full w-full rounded-2xl"
          />
        )}
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1.5 inline-block text-xs text-muted-foreground hover:text-foreground"
      >
        ¿No carga? Verlo en Instagram
      </a>
    </div>
  );
}
