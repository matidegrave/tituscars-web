"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { leerRecorrido } from "@/lib/recorrido";
import { conexionRapida } from "@/components/catalogo/transicion-ficha";

const nada = () => () => {};
let cache: { raw: string | null; slugs: string[] | null } = { raw: null, slugs: null };

/** Los slugs del listado del que se vino (sessionStorage), o null. */
function slugsGuardados(): string[] | null {
  const r = leerRecorrido();
  const raw = r ? r.slugs.join(",") : null;
  if (raw !== cache.raw) cache = { raw, slugs: r?.slugs ?? null };
  return cache.slugs;
}

/**
 * "‹ Anterior · 3 de 23 · Siguiente ›" dentro de la misma búsqueda (tanda 40):
 * sale de la lista que guardó el listado al tocar una card. Sin lista (se
 * entró directo, desde Google, desde la home) no se muestra nada. Va en el
 * margen de arriba de la ficha (absoluto: no corre nada al aparecer).
 * Además: deslizar sobre los datos del auto (no sobre la galería) pasa al
 * anterior / siguiente, y la ficha siguiente se precarga.
 */
export function NavegacionFicha({ slug }: { slug: string }) {
  const router = useRouter();
  const slugs = useSyncExternalStore(nada, slugsGuardados, () => null);
  const i = slugs ? slugs.indexOf(slug) : -1;
  const anterior = i > 0 ? slugs![i - 1] : null;
  const siguiente = i >= 0 && i < slugs!.length - 1 ? slugs![i + 1] : null;

  useEffect(() => {
    if (siguiente && conexionRapida()) {
      router.prefetch(`/autos/${siguiente}`, { kind: "full" } as unknown as Parameters<typeof router.prefetch>[1]);
    }
  }, [router, siguiente]);

  useEffect(() => {
    const datos = document.getElementById("ficha-datos");
    if (!datos || i < 0) return;
    let x0 = 0;
    let y0 = 0;
    let activo = false;
    const inicio = (e: TouchEvent) => {
      activo = e.touches.length === 1;
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
    };
    const fin = (e: TouchEvent) => {
      if (!activo) return;
      activo = false;
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      const destino = dx < 0 ? siguiente : anterior;
      if (destino) router.push(`/autos/${destino}`);
    };
    datos.addEventListener("touchstart", inicio, { passive: true });
    datos.addEventListener("touchend", fin, { passive: true });
    return () => {
      datos.removeEventListener("touchstart", inicio);
      datos.removeEventListener("touchend", fin);
    };
  }, [router, i, anterior, siguiente]);

  if (!slugs || i < 0 || slugs.length < 2) return null;
  const clase = "flex items-center gap-0.5 py-1 font-medium text-foreground hover:text-brand";
  return (
    <nav
      aria-label="Otros autos de la búsqueda"
      className="absolute inset-x-4 top-1 flex h-7 items-center justify-center gap-3 text-sm text-muted-foreground lg:justify-start"
    >
      {anterior ? (
        <Link href={`/autos/${anterior}`} prefetch={false} className={clase}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Anterior
        </Link>
      ) : (
        <span className="flex items-center gap-0.5 py-1 opacity-40">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Anterior
        </span>
      )}
      <span aria-hidden="true">·</span>
      <span>
        {i + 1} de {slugs.length}
      </span>
      <span aria-hidden="true">·</span>
      {siguiente ? (
        <Link href={`/autos/${siguiente}`} prefetch={false} className={clase}>
          Siguiente
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <span className="flex items-center gap-0.5 py-1 opacity-40">
          Siguiente
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}
