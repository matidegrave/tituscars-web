"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { camposOcultos, urlCatalogo, type Filtros } from "@/lib/filtros";
import { filtrarSugerencias, type Sugerencia } from "@/lib/busqueda";
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
 * Sugerencias (tanda 40): desde 2 letras, un desplegable con hasta 6 marcas /
 * modelos en stock y categorías. Salen de `sugerencias` (lista chica que ya
 * viene en el HTML): ningún pedido al servidor por tecla. Tocar una lleva
 * directo al listado filtrado; en la compu, flechas y Enter.
 *
 * Sin JS es un <form method="get" action="/autos"> real con name="q" (y los
 * demás filtros como campos ocultos): el submit anda igual.
 */
export function BuscadorCatalogo({
  filtros,
  id,
  className,
  sugerencias = [],
}: {
  filtros: Filtros;
  id: string;
  className?: string;
  sugerencias?: Sugerencia[];
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [texto, setTexto] = useState(filtros.q ?? "");
  const aplicada = filtros.q ?? "";
  const scrollPendiente = useRef(false);
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState(-1);
  const opciones = abierto ? filtrarSugerencias(texto, sugerencias) : [];
  const idLista = `${id}-sugerencias`;

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

  function elegir(s: Sugerencia) {
    setAbierto(false);
    setActiva(-1);
    input.current?.blur();
    router.push(s.href);
  }

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (abierto && activa >= 0 && opciones[activa]) {
      elegir(opciones[activa]);
      return;
    }
    setAbierto(false);
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

  function teclado(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!opciones.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiva((a) => (a + 1) % opciones.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiva((a) => (a <= 0 ? opciones.length - 1 : a - 1));
    } else if (e.key === "Escape") {
      setAbierto(false);
      setActiva(-1);
    }
  }

  function borrar() {
    setTexto("");
    setAbierto(false);
    // Si había una búsqueda aplicada, borrarla vuelve al listado sin ella.
    if (aplicada) ir("");
    else input.current?.focus();
  }

  // Sin JS: los demás filtros viajan como campos ocultos para no perderlos.
  const ocultos = camposOcultos(filtros, ["q"]);

  return (
    <form role="search" method="get" action="/autos" onSubmit={enviar} className={cn("relative flex", className)}>
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
          role="combobox"
          aria-expanded={opciones.length > 0}
          aria-controls={idLista}
          aria-autocomplete="list"
          aria-activedescendant={activa >= 0 && opciones[activa] ? `${idLista}-${activa}` : undefined}
          placeholder="Marca, modelo o versión"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setAbierto(true);
            setActiva(-1);
          }}
          onFocus={() => setAbierto(true)}
          // Se cierra un rato después: si el toque fue en una sugerencia, llega primero.
          onBlur={() => setTimeout(() => setAbierto(false), 150)}
          onKeyDown={teclado}
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

      {opciones.length > 0 && (
        <ul
          id={idLista}
          role="listbox"
          aria-label="Sugerencias"
          className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-white py-1 shadow-lg"
        >
          {opciones.map((s, i) => (
            <li
              key={s.href}
              id={`${idLista}-${i}`}
              role="option"
              aria-selected={i === activa}
              // mousedown (y no click): llega antes del blur del input.
              onMouseDown={(e) => {
                e.preventDefault();
                elegir(s);
              }}
              onMouseEnter={() => setActiva(i)}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-sm",
                i === activa ? "bg-muted" : ""
              )}
            >
              <span className="truncate">{s.texto}</span>
              {s.cantidad !== undefined && <span className="shrink-0 text-muted-foreground">({s.cantidad})</span>}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
