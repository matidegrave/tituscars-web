"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { AutoGrid } from "@/components/auto-grid";
import { cargarMasAutos } from "@/app/autos/acciones";
import type { Filtros } from "@/lib/filtros";
import type { AutoCatalogo } from "@/lib/types";
import { BusquedaAMedidaDiferida } from "@/components/busqueda-a-medida-diferida";

const PREFIJO = "titus:catalogo:";
const VIGENCIA_MS = 30 * 60 * 1000;

interface Guardado {
  autos: AutoCatalogo[];
  pagina: number;
  scrollY: number;
  ts: number;
}

function leerGuardado(clave: string): Guardado | null {
  try {
    const raw = sessionStorage.getItem(PREFIJO + clave);
    if (!raw) return null;
    sessionStorage.removeItem(PREFIJO + clave);
    const g = JSON.parse(raw) as Guardado;
    return Date.now() - g.ts < VIGENCIA_MS && Array.isArray(g.autos) ? g : null;
  } catch {
    return null;
  }
}

function unir(prev: AutoCatalogo[], nuevos: AutoCatalogo[]): AutoCatalogo[] {
  const ids = new Set(prev.map((a) => a.id));
  return [...prev, ...nuevos.filter((a) => !ids.has(a.id))];
}

/**
 * Scroll infinito: arranca con la primera tanda que renderiza el server y va
 * pidiendo las siguientes al acercarse al final. Al entrar a un auto guarda la
 * lista y la posición, para que "volver" deje a la persona donde estaba.
 */
export function CatalogoInfinito({
  inicial,
  total,
  filtros,
  claveFiltros,
}: {
  inicial: AutoCatalogo[];
  total: number;
  filtros: Filtros;
  claveFiltros: string;
}) {
  const [autos, setAutos] = useState(inicial);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);
  const [agotado, setAgotado] = useState(false);
  const cargandoRef = useRef(false);
  const sentinela = useRef<HTMLDivElement>(null);
  const scrollPendiente = useRef<number | null>(null);

  const hayMas = !agotado && autos.length < total;

  // Sin esto, si la persona está viendo el pie de página cuando llega una
  // tanda, el navegador "ancla" el pie y los autos nuevos quedan arriba, fuera
  // de la vista (y se encadenan todas las tandas). Solo mientras está el catálogo.
  useEffect(() => {
    const html = document.documentElement;
    const antes = html.style.overflowAnchor;
    html.style.overflowAnchor = "none";
    return () => {
      html.style.overflowAnchor = antes;
    };
  }, []);

  // Volver desde la ficha de un auto: restaurar lista y posición.
  useEffect(() => {
    const g = leerGuardado(claveFiltros);
    if (g && g.autos.length > inicial.length) {
      scrollPendiente.current = g.scrollY;
      // sessionStorage no existe en el server: restaurar acá evita el desfasaje de hidratación.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAutos(unir(inicial, g.autos));
      setPagina(g.pagina);
    } else if (g) {
      window.scrollTo(0, g.scrollY);
    }
  }, [claveFiltros, inicial]);

  useEffect(() => {
    if (scrollPendiente.current === null) return;
    const y = scrollPendiente.current;
    scrollPendiente.current = null;
    requestAnimationFrame(() => window.scrollTo(0, y));
  }, [autos]);

  const guardar = useCallback(() => {
    try {
      const g: Guardado = { autos, pagina, scrollY: window.scrollY, ts: Date.now() };
      sessionStorage.setItem(PREFIJO + claveFiltros, JSON.stringify(g));
    } catch {
      // sin sessionStorage: se vuelve arriba, no se rompe nada
    }
  }, [autos, pagina, claveFiltros]);

  const cargarMas = useCallback(async () => {
    if (cargandoRef.current || !hayMas) return;
    cargandoRef.current = true;
    setCargando(true);
    setError(false);
    try {
      const nuevos = await cargarMasAutos(filtros, pagina + 1);
      if (nuevos.length === 0) setAgotado(true);
      setAutos((prev) => unir(prev, nuevos));
      setPagina((p) => p + 1);
    } catch {
      setError(true);
    } finally {
      cargandoRef.current = false;
      setCargando(false);
    }
  }, [filtros, pagina, hayMas]);

  // Se recrea tras cada tanda: observe() dispara de entrada, así que si el
  // final sigue a la vista (pantallas grandes) sigue cargando solo.
  useEffect(() => {
    const el = sentinela.current;
    if (!el || !hayMas || cargando || error) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) cargarMas();
      },
      // Abajo: empieza a cargar 800px antes de llegar al final.
      // Arriba: margen enorme para que un scroll muy rápido que "saltea" el
      // final (flick en el celu, tecla Fin) también cuente como llegar.
      { rootMargin: "100000px 0px 800px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [cargarMas, hayMas, cargando, error]);

  return (
    <>
      <div onClickCapture={guardar}>
        <AutoGrid autos={autos} prioridadPrimera />
      </div>

      <div ref={sentinela} className="mt-8 flex min-h-10 items-center justify-center">
        {cargando && (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando más autos…
          </span>
        )}
        {error && !cargando && (
          <button
            type="button"
            onClick={cargarMas}
            className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            No se pudieron cargar más autos. Reintentar
          </button>
        )}
        {!hayMas && total > inicial.length && (
          <span className="text-sm text-muted-foreground">
            Viste los {autos.length} autos disponibles
          </span>
        )}
      </div>

      {/* Fin del scroll infinito: si no apareció lo que buscaba, lo pide a medida. */}
      {!hayMas && <BusquedaAMedidaDiferida sobreGris className="mx-auto mt-10 max-w-3xl" />}
    </>
  );
}
