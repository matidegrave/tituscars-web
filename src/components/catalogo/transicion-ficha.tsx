"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { borrarRecorridoViejo, guardarEntrada } from "@/lib/recorrido";

/** Precarga sólo con conexión rápida y sin ahorro de datos (Safari no informa: se asume rápida). */
export function conexionRapida(): boolean {
  try {
    const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
      .connection;
    if (!c) return true;
    if (c.saveData) return false;
    return !c.effectiveType || c.effectiveType === "4g";
  } catch {
    return false;
  }
}

const MAX_A_LA_VEZ = 6;
const VENTANA_MS = 3000;
const MAX_POR_PAGINA = 36;
const VIGENCIA_PRECARGA_MS = 5 * 60 * 1000;

/**
 * Del listado a la ficha (tanda 40), para todas las cards (a[data-card]):
 * - al tocar una: guarda la entrada (posición si es del listado
 *   [data-listado], foto y título);
 * - si la ficha tarda, muestra enseguida la foto de la card (la misma URL,
 *   ya en caché) en el lugar de la galería hasta que llega;
 * - precarga la ficha de las cards que entran en pantalla: como máximo 6 a
 *   la vez, sólo con conexión rápida y sin Save-Data.
 */
export function TransicionFicha() {
  const router = useRouter();
  const pathname = usePathname();
  const [tocada, setTocada] = useState<{ foto?: string; titulo?: string } | null>(null);
  const timers = useRef<number[]>([]);

  // Al llegar a otra página se saca la foto.
  useEffect(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTocada(null);
  }, [pathname]);

  useEffect(() => {
    borrarRecorridoViejo();
    function alTocar(e: MouseEvent) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const objetivo = e.target as Element | null;
      if (!objetivo || objetivo.closest("button")) return;
      const card = objetivo.closest<HTMLAnchorElement>("a[data-card]");
      if (!card) return;
      const slug = card.dataset.card ?? "";
      const lista = card.closest<HTMLElement>("[data-listado]");
      const img = card.querySelector("img");
      const foto = img?.currentSrc || img?.src || undefined;
      const titulo = card.querySelector("h3")?.textContent ?? undefined;
      guardarEntrada({
        slug,
        posicion: lista ? Number(card.dataset.posicion) || undefined : undefined,
        foto,
        titulo,
      });
      // Si la ficha ya estaba precargada la navegación es instantánea y la
      // foto ni llega a mostrarse; si tarda, aparece a los 120 ms.
      timers.current.push(window.setTimeout(() => setTocada({ foto, titulo }), 120));
      timers.current.push(window.setTimeout(() => setTocada(null), 10000));
    }
    document.addEventListener("click", alTocar);
    return () => document.removeEventListener("click", alTocar);
  }, []);

  // Precarga de las fichas de las cards visibles.
  useEffect(() => {
    if (!conexionRapida() || typeof IntersectionObserver === "undefined") return;
    const hechas = new Map<string, number>();
    const cola: string[] = [];
    const lanzadas: number[] = [];
    let total = 0;
    let bomba = 0;

    function bombear() {
      bomba = 0;
      const ahora = Date.now();
      while (lanzadas.length && ahora - lanzadas[0] > VENTANA_MS) lanzadas.shift();
      while (cola.length && lanzadas.length < MAX_A_LA_VEZ && total < MAX_POR_PAGINA) {
        const slug = cola.shift()!;
        const antes = hechas.get(slug);
        if (antes && ahora - antes < VIGENCIA_PRECARGA_MS) continue;
        hechas.set(slug, ahora);
        lanzadas.push(ahora);
        total++;
        // "full": la ficha es dinámica y sin loading.js; la precarga por
        // defecto no traería nada.
        router.prefetch(`/autos/${slug}`, { kind: "full" } as unknown as Parameters<typeof router.prefetch>[1]);
      }
      if (cola.length && total < MAX_POR_PAGINA) bomba = window.setTimeout(bombear, 500);
    }

    const obs = new IntersectionObserver((entradas) => {
      for (const en of entradas) {
        const slug = (en.target as HTMLElement).dataset.card;
        if (!slug) continue;
        const i = cola.indexOf(slug);
        if (en.isIntersecting && i < 0) cola.push(slug);
        else if (!en.isIntersecting && i >= 0) cola.splice(i, 1);
      }
      if (cola.length && !bomba) bomba = window.setTimeout(bombear, 200);
    });

    const vistas = new WeakSet<Element>();
    function observarNuevas() {
      document.querySelectorAll("a[data-card]").forEach((a) => {
        if (vistas.has(a)) return;
        vistas.add(a);
        obs.observe(a);
      });
    }
    observarNuevas();
    const mo = new MutationObserver(observarNuevas);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      obs.disconnect();
      mo.disconnect();
      clearTimeout(bomba);
    };
  }, [router, pathname]);

  if (!tocada?.foto) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 top-[var(--header-h)] z-30 overflow-hidden bg-white" aria-hidden="true">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={tocada.foto} alt="" className="aspect-[4/3] w-full rounded-xl bg-muted object-cover" />
          </div>
          <div className="lg:col-span-2">
            <p className="text-2xl font-bold uppercase tracking-tight">{tocada.titulo}</p>
            <div className="mt-4 h-8 w-40 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
