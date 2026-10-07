"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { filtrosVacios, urlCatalogo } from "@/lib/filtros";
import { paginaSinCampana } from "@/lib/tracking";
import { marcarBusquedaPendiente } from "@/components/catalogo/track-busqueda";
import { cn } from "@/lib/utils";

/** Buscadores de /autos: en /autos la lupa del header lleva ahí en vez de abrir otro. */
const BUSCADOR_DE_LA_PAGINA = { compu: "filtro-busqueda", celu: "filtro-busqueda-celu" } as const;

/**
 * Lupa del header (tanda 50), en todas las páginas. Compu: al lado del logo
 * despliega un campo de ~320 px en el mismo header (el menú de texto se oculta
 * mientras tanto, así nada se corre). Celu: a la izquierda del corazón, abre
 * una barra naranja a todo el ancho debajo del header, con una X para cerrar.
 *
 * Es un <details> con un <form method="get" action="/autos"> y name="q": sin
 * JS se abre y busca igual. Con JS la lupa abre el <details> y pone el foco
 * en el mismo toque (así iOS abre el teclado); Enter o la lupa van a
 * /autos?q=… por el router, con la misma búsqueda del catálogo (normalización,
 * sinónimos, "¿Quisiste decir…?"), y la "busqueda" se registra allá con la
 * página desde donde se buscó. Esc o un clic afuera lo cierran.
 * En /autos no abre otro buscador: lleva el foco al de la página.
 */
export function BuscadorHeader({
  variante,
  menuAbierto,
  onAbrir,
  className,
}: {
  variante: "compu" | "celu";
  /** Con el menú del celu abierto, el buscador se cierra. */
  menuAbierto?: boolean;
  /** Avisa al header que se abrió (para cerrar el menú). */
  onAbrir?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const detalles = useRef<HTMLDetailsElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const [abierto, setAbierto] = useState(false);
  const id = `buscador-header-${variante}`;

  function cerrar(devolverFoco = false) {
    const d = detalles.current;
    if (!d?.open) return;
    d.open = false;
    if (devolverFoco) d.querySelector("summary")?.focus();
  }

  function alTocarLupa(e: React.MouseEvent) {
    e.preventDefault();
    const d = detalles.current;
    if (!d) return;
    if (d.open) {
      cerrar();
      return;
    }
    if (pathname === "/autos") {
      const dePagina = document.getElementById(BUSCADOR_DE_LA_PAGINA[variante]) as HTMLInputElement | null;
      if (dePagina) {
        dePagina.focus();
        dePagina.select();
        // La barra del celu se esconde al bajar: con el foco adentro vuelve a mostrarse.
        window.dispatchEvent(new Event("scroll"));
        return;
      }
    }
    // Abrir y enfocar en el mismo toque: si el foco llegara después (en un
    // efecto), iOS no abre el teclado.
    d.open = true;
    const input = campo.current;
    if (input) {
      if (pathname === "/autos") input.value = new URLSearchParams(window.location.search).get("q") ?? "";
      input.focus();
    }
    onAbrir?.();
  }

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = (campo.current?.value ?? "").trim();
    // Se registra en /autos al ver los resultados, con la página de origen.
    if (q) marcarBusquedaPendiente(q, paginaSinCampana());
    campo.current?.blur(); // cierra el teclado del celu
    cerrar();
    router.push(urlCatalogo({ ...filtrosVacios(), q: q || undefined }));
  }

  // Esc y clic afuera lo cierran (sólo mientras está abierto).
  useEffect(() => {
    if (!abierto) return;
    const afuera = (e: PointerEvent) => {
      if (!detalles.current?.contains(e.target as Node)) cerrar();
    };
    document.addEventListener("pointerdown", afuera);
    return () => document.removeEventListener("pointerdown", afuera);
  }, [abierto]);

  // Al cambiar de página o abrir el menú del celu, se cierra.
  useEffect(() => {
    cerrar();
  }, [pathname]);
  useEffect(() => {
    if (menuAbierto) cerrar();
  }, [menuAbierto]);

  return (
    <details
      ref={detalles}
      data-buscador-header={variante}
      onToggle={(e) => setAbierto(e.currentTarget.open)}
      onKeyDown={(e) => {
        if (e.key === "Escape") cerrar(true);
      }}
      className={cn(variante === "compu" ? "relative" : "", className)}
    >
      <summary
        aria-label={abierto ? "Cerrar buscador" : "Buscar autos"}
        onClick={alTocarLupa}
        className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full text-white hover:bg-white/10 [&::-webkit-details-marker]:hidden"
      >
        <Search className="h-5 w-5" aria-hidden="true" />
      </summary>
      <form
        role="search"
        method="get"
        action="/autos"
        onSubmit={enviar}
        className={
          variante === "compu"
            ? "absolute left-full top-1/2 z-10 ml-1 flex w-80 -translate-y-1/2"
            : "absolute inset-x-0 top-full flex gap-2 bg-brand px-4 pb-3 pt-1 shadow-[0_6px_12px_-6px_rgba(0,0,0,0.25)]"
        }
      >
        <label htmlFor={id} className="sr-only">
          Buscar marca, modelo o versión
        </label>
        <div className="relative flex min-w-0 flex-1">
          <input
            ref={campo}
            id={id}
            name="q"
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            maxLength={100}
            placeholder="Marca, modelo o versión"
            className={cn(
              "w-full min-w-0 rounded-lg border-0 bg-white pl-3 pr-11 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-white/60 [&::-webkit-search-cancel-button]:appearance-none",
              variante === "compu" ? "h-10 md:text-sm" : "h-11"
            )}
          />
          <button
            type="submit"
            aria-label="Buscar"
            className="absolute right-0 top-0 flex h-full w-11 items-center justify-center rounded-r-lg text-brand hover:bg-zinc-100"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {variante === "celu" && (
          <button
            type="button"
            aria-label="Cerrar buscador"
            onClick={() => cerrar(true)}
            className="flex h-11 w-10 shrink-0 items-center justify-center text-white"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        )}
      </form>
    </details>
  );
}
