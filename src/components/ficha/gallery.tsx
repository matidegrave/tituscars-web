"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { abrirVisorFotos, type VisorAbierto } from "@/components/ficha/visor-fotos";
import { PastillaDisponibilidad } from "@/components/pastilla-disponibilidad";
import type { AutoCatalogo, Foto } from "@/lib/types";

export function FichaGallery({
  fotos,
  alt,
  senado,
  ceroKm,
  disponibilidad,
}: {
  fotos: Foto[];
  alt: string;
  senado: boolean;
  ceroKm: boolean;
  disponibilidad: AutoCatalogo["disponibilidad"];
}) {
  const ordenadas = fotos.length > 0 ? [...fotos].sort((a, b) => a.orden - b.orden) : [];
  const [activo, setActivo] = useState(0);
  // Carrusel de la foto principal (swipe): su foto visible es la activa.
  const [apiFoto, setApiFoto] = useState<CarouselApi>();
  const visor = useRef<VisorAbierto | null>(null);

  useEffect(() => {
    if (!apiFoto) return;
    const onSelect = () => setActivo(apiFoto.selectedScrollSnap());
    apiFoto.on("select", onSelect);
    return () => {
      apiFoto.off("select", onSelect);
    };
  }, [apiFoto]);

  // Visor a pantalla completa (PhotoSwipe, se carga recién al abrirlo). Al
  // cerrarlo, la ficha queda en la foto que se estaba viendo.
  const abriendo = useRef(false);
  async function abrirVisor(indice: number, origen: HTMLElement | null) {
    // Mientras se descarga PhotoSwipe (la primera vez), un segundo toque no abre otro.
    if (visor.current || abriendo.current) return;
    abriendo.current = true;
    const miniatura = origen?.querySelector("img")?.currentSrc;
    try {
      visor.current = await abrirVisorFotos({
        urls: ordenadas.map((f) => f.url),
        indice,
        alt,
        miniatura,
        alCambiar: (i) => setActivo(i),
        alCerrar: (i) => {
          visor.current = null;
          apiFoto?.scrollTo(i, true);
        },
      });
    } finally {
      abriendo.current = false;
    }
  }

  useEffect(() => () => visor.current?.cerrar(), []);

  if (ordenadas.length === 0) {
    return (
      <div className="aspect-[4/3] w-full rounded-xl bg-muted" aria-hidden="true" />
    );
  }

  return (
    <div>
      <div className="relative">
        {/* Se desliza con el dedo; un toque sin deslizar abre el visor (Embla no
            dispara el click cuando hubo arrastre). */}
        <Carousel setApi={setApiFoto} className="overflow-hidden rounded-xl bg-muted">
          <CarouselContent className="ml-0">
            {ordenadas.map((foto, i) => (
              <CarouselItem key={foto.url + i} className="pl-0">
                <button
                  type="button"
                  onClick={(e) => void abrirVisor(i, e.currentTarget)}
                  aria-label={`Ver foto ${i + 1} de ${ordenadas.length} en grande`}
                  className="relative block aspect-[4/3] w-full"
                >
                  {/* La primera va con prioridad alta (en Next 16 `priority` está
                      deprecado: se usa loading + fetchPriority); la anterior y la siguiente
                      a la actual se piden ya (eager) para que el swipe sea
                      instantáneo; el resto, lazy. */}
                  <Image
                    src={foto.url}
                    alt={alt}
                    fill
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    className="object-cover"
                    loading={i === 0 || Math.abs(i - activo) <= 1 ? "eager" : "lazy"}
                    fetchPriority={i === 0 ? "high" : undefined}
                  />
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
          {senado && (
            <span className="rounded-md bg-brand-black px-2 py-1 text-xs font-bold uppercase tracking-wide text-white">
              Señado
            </span>
          )}
          {ceroKm && (
            <span className="rounded-md bg-brand px-2 py-1 text-xs font-bold uppercase tracking-wide text-white">
              0 KM
            </span>
          )}
        </div>
        <div className="pointer-events-none absolute right-3 top-3">
          <PastillaDisponibilidad disponibilidad={disponibilidad} />
        </div>
        {ordenadas.length > 1 && (
          <span className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white">
            {activo + 1} / {ordenadas.length}
          </span>
        )}
      </div>

      {ordenadas.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {ordenadas.map((foto, i) => (
            <button
              key={foto.url + i}
              type="button"
              onClick={() => {
                setActivo(i);
                apiFoto?.scrollTo(i);
              }}
              className={`relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-lg border-2 ${
                i === activo ? "border-primary" : "border-transparent"
              }`}
            >
              {/* Miniatura de 80px: se pide chica y en calidad baja. Las
                  primeras 5 (las que se ven al entrar) sin esperar al lazy. */}
              <Image
                src={foto.url}
                alt=""
                fill
                sizes="80px"
                quality={50}
                loading={i < 5 ? "eager" : "lazy"}
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

    </div>
  );
}
