"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { camposOcultos, urlCatalogo, type Filtros } from "@/lib/filtros";
import { marcarBusquedaPendiente } from "@/components/catalogo/track-busqueda";
import { cn } from "@/lib/utils";

/** Donde arrancan los resultados (chips + listado): destino del scroll al buscar. */
export const ID_RESULTADOS = "resultados";


/**
 * Buscador del catálogo (celu y compu). Mientras se escribe NO se busca nada:
 * sin debounce, sin tocar la URL ni los resultados. Se busca sólo al enviar
 * (Enter, la lupa del teclado o el botón naranja): ahí se aplica el filtro
 * (conservando los demás), aparece el chip, se registra UNA "busqueda" (con
 * cuántos resultados dio, al mostrarlos), se cierra el teclado y se hace
 * scroll suave al inicio de los resultados.
 *
 * Sin JS es un <form method="get" action="/autos"> real con name="q" (y los
 * demás filtros como campos ocultos): el submit anda igual.
 */
export function BuscadorCatalogo({
  filtros,
  id,
  className,
}: {
  filtros: Filtros;
  id: string;
  className?: string;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [texto, setTexto] = useState(filtros.q ?? "");
  const aplicada = filtros.q ?? "";
  const scrollPendiente = useRef(false);

  // Si la búsqueda cambia desde afuera (se sacó el chip, "Limpiar filtros") el
  // input la refleja; y si cambió porque buscamos acá, recién ahora (con los
  // resultados nuevos ya renderizados) se hace el scroll.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTexto(aplicada);
    if (scrollPendiente.current) {
      scrollPendiente.current = false;
      document.getElementById(ID_RESULTADOS)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [aplicada]);

  function ir(q: string) {
    scrollPendiente.current = q !== aplicada;
    router.push(urlCatalogo({ ...filtros, q: q || undefined }), { scroll: false });
  }

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const q = texto.trim();
    input.current?.blur(); // cierra el teclado del celu
    // Se registra en /autos al ver los resultados (con cuántos dio).
    if (q) marcarBusquedaPendiente(q);
    if (q === aplicada) {
      document.getElementById(ID_RESULTADOS)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    ir(q);
  }

  function borrar() {
    setTexto("");
    // Si había una búsqueda aplicada, borrarla vuelve al listado sin ella.
    if (aplicada) ir("");
    else input.current?.focus();
  }

  // Sin JS: los demás filtros viajan como campos ocultos para no perderlos.
  const ocultos = camposOcultos(filtros, ["q"]);

  return (
    <form role="search" method="get" action="/autos" onSubmit={enviar} className={cn("flex", className)}>
      {ocultos.map(([k, v], i) => (
        <input key={`${k}-${i}`} type="hidden" name={k} value={v} />
      ))}
      <label htmlFor={id} className="sr-only">
        Buscar marca, modelo o versión
      </label>
      <div className="relative min-w-0 flex-1">
        <input
          ref={input}
          id={id}
          name="q"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="Marca, modelo o versión"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="h-11 w-full min-w-0 rounded-l-lg border border-r-0 border-border bg-white pl-3 pr-10 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {texto && (
          <button
            type="button"
            onClick={borrar}
            aria-label="Borrar búsqueda"
            className="absolute right-0 top-0 flex h-11 w-10 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <button
        type="submit"
        aria-label="Buscar"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-r-lg bg-brand text-white transition-colors hover:bg-brand/90"
      >
        <Search className="h-5 w-5" />
      </button>
    </form>
  );
}
