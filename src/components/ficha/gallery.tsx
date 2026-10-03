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
import { fotoDeEntrada } from "@/lib/recorrido";

export function FichaGallery({
  fotos,
  alt,
  senado,
  ceroKm,
  disponibilidad,
  slug,
  colores,
}: {
  fotos: Foto[];
  alt: string;
  senado: boolean;
  ceroKm: boolean;
  disponibilidad: AutoCatalogo["disponibilidad"];
  slug: string;
  /** Color promedio de cada foto (por URL): fondo mientras cargan. */
  colores?: Record<string, string>;
}) {
  // Si se llegó tocando una card, su foto (misma URL, ya en caché) se ve al
  // instante debajo de la primera mientras ésta carga. Sólo en navegación del
  // cliente: en una carga directa no hay entrada (y el server tampoco la ve).
  const [fotoCard] = useState(() => fotoDeEntrada(slug));
  const ordenadas = fotos.length > 0 ? [...fotos].sort((a, b) => a.orden - b.orden) : [];
  const [activo, setActivo] = useState(0);
  // Carrusel de la foto principal (swipe): su foto visible es la activa.
  const [apiFoto, setApiFoto] = useState<CarouselApi>();
  const visor = useRef<VisorAbierto | null>(null);
  // Las fotos 2..n del carrusel no van en el primer render: si no, se
  // descargan junto con la primera (la foto LCP) y le sacan ancho de banda.
  // Se montan después del load de la página, o antes si el usuario desliza.
  const [montarResto, setMontarResto] = useState(false);
  useEffect(() => {
    const montar = () => setMontarResto(true);
    if (document.readyState === "complete") {
      const t = setTimeout(montar, 0);
      return () => clearTimeout(t);
    }
    window.addEventListener("load", montar, { once: true });
    return () => window.removeEventListener("load", montar);
  }, []);

  useEffect(() => {
    if (!apiFoto) return;
    const onSelect = () => setActivo(apiFoto.selectedScrollSnap());
    const onArrastre = () => setMontarResto(true);
    apiFoto.on("select", onSelect);
    apiFoto.on("pointerDown", onArrastre);
    return () => {
      apiFoto.off("select", onSelect);
      apiFoto.off("pointerDown", onArrastre);
    };
  }, [apiFoto]);

  // Teclado (tanda 47f): ← y → cambian de foto mientras la galería está en
  // pantalla o tiene el foco, sin tener que hacer click antes. No se capturan
  // con el foco en un campo (buscador, formularios) ni con Alt/Ctrl/Meta (el
  // "atrás" del navegador). En el visor manda PhotoSwipe (← → y Esc). Sin
  // vuelta: en la primera y la última foto se queda (Embla sin loop).
  const galeria = useRef<HTMLDivElement>(null);
  const tiraMiniaturas = useRef<HTMLDivElement>(null);
  const enPantalla = useRef(false);
  useEffect(() => {
    const el = galeria.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver((entradas) => {
      enPantalla.current = entradas.some((e) => e.isIntersecting);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!apiFoto) return;
    function alTeclear(e: KeyboardEvent) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (visor.current) return;
      const foco = document.activeElement as HTMLElement | null;
      if (foco && (foco.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(foco.tagName))) return;
      const conFoco = !!foco && !!galeria.current?.contains(foco);
      if (!enPantalla.current && !conFoco) return;
      e.preventDefault();
      setMontarResto(true);
      if (e.key === "ArrowLeft") apiFoto?.scrollPrev();
      else apiFoto?.scrollNext();
    }
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [apiFoto]);

  // La miniatura activa siempre a la vista: la tira se corre lo justo (como
  // scrollIntoView inline:"nearest"), pero a mano para no mover nunca la página
  // en vertical (scrollIntoView también scrollea los ancestros).
  useEffect(() => {
    const tira = tiraMiniaturas.current;
    const mini = tira?.children[activo] as HTMLElement | undefined;
    if (!tira || !mini) return;
    // La tira es `relative`: offsetLeft de la miniatura ya es relativo a ella.
    const izq = mini.offsetLeft;
    const der = izq + mini.offsetWidth;
    if (izq < tira.scrollLeft) tira.scrollTo({ left: izq, behavior: "smooth" });
    else if (der > tira.scrollLeft + tira.clientWidth)
      tira.scrollTo({ left: der - tira.clientWidth, behavior: "smooth" });
  }, [activo]);

  // Ruedita sobre la tira (tanda 47g): la desplaza a los costados. En las
  // puntas (o si no desborda) el evento sigue y scrollea la página. El gesto
  // horizontal del trackpad lo maneja el navegador solo.
  const hayTira = ordenadas.length > 1;
  useEffect(() => {
    const tira = tiraMiniaturas.current;
    if (!tira) return;
    function alRodar(e: WheelEvent) {
      if (!tira || e.ctrlKey || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      // deltaMode 1 = líneas (Firefox con mouse), 2 = páginas.
      const factor = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? tira.clientWidth : 1;
      const delta = e.deltaY * factor;
      const max = tira.scrollWidth - tira.clientWidth;
      if ((delta < 0 && tira.scrollLeft <= 0) || (delta > 0 && tira.scrollLeft >= max - 1)) return;
      e.preventDefault();
      tira.scrollLeft += delta;
    }
    tira.addEventListener("wheel", alRodar, { passive: false });
    return () => tira.removeEventListener("wheel", alRodar);
  }, [hayTira]);

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
    <div ref={galeria} role="region" aria-label="Fotos del vehículo">
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
                  style={colores?.[foto.url] ? { backgroundColor: colores[foto.url] } : undefined}
                >
                  {i === 0 && fotoCard && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fotoCard} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  )}
                  {/* La primera es la foto LCP: va en el HTML, eager y con prioridad
                      alta (en Next 16 `priority` está deprecado: se usa loading +
                      fetchPriority). Las demás se montan después del load; ahí la
                      anterior y la siguiente a la actual van eager para que el
                      swipe sea instantáneo, y el resto lazy. */}
                  {(i === 0 || montarResto) && (
                    <Image
                      src={foto.url}
                      alt={alt}
                      fill
                      sizes="(min-width: 1024px) 60vw, 100vw"
                      className="object-cover"
                      loading={i === 0 || Math.abs(i - activo) <= 1 ? "eager" : "lazy"}
                      fetchPriority={i === 0 ? "high" : undefined}
                    />
                  )}
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

      {hayTira && (
        <div ref={tiraMiniaturas} className="relative mt-3 flex gap-2 overflow-x-auto pb-1">
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
              {/* Miniatura de 80px: se pide chica (160/256 según la pantalla). Las
                  primeras 5 (las que se ven al entrar) sin esperar al lazy. */}
              <Image
                src={foto.url}
                alt=""
                fill
                sizes="80px"
                loading={i < 5 ? "eager" : "lazy"}
                fetchPriority="low"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

    </div>
  );
}
