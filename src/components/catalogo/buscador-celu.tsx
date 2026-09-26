"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { filtrosAParams, type Filtros } from "@/lib/filtros";
import { track } from "@/lib/tracking";

const DEBOUNCE_MS = 600;
const MINIMO = 2;

function urlCatalogo(filtros: Filtros): string {
  const params = filtrosAParams({ ...filtros, page: 1 });
  return `/autos${params.size > 0 ? `?${params.toString()}` : ""}`;
}

/**
 * Buscador del catálogo en celu.
 * - Mientras se escribe: busca en vivo (600 ms, 2+ caracteres) con ?vivo=1,
 *   que filtra pero no genera el chip ni historial (router.replace).
 * - Al confirmar (Enter / lupa): chip, evento "busqueda" y se cierra el
 *   teclado (blur).
 */
export function BuscadorCelu({ filtros }: { filtros: Filtros }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [texto, setTexto] = useState(filtros.q ?? "");
  const ultimoEnviado = useRef(filtros.q ?? "");

  // Si la búsqueda cambia desde afuera (se sacó el chip, "Limpiar filtros"),
  // el input la refleja. Sin remontarlo: perdería el foco mientras se escribe.
  useEffect(() => {
    const q = filtros.q ?? "";
    if (q !== ultimoEnviado.current) {
      ultimoEnviado.current = q;
      setTexto(q);
    }
  }, [filtros.q]);

  // Búsqueda en vivo
  useEffect(() => {
    const q = texto.trim();
    if (q === ultimoEnviado.current) return;
    if (q.length > 0 && q.length < MINIMO) return;
    const t = setTimeout(() => {
      ultimoEnviado.current = q;
      router.replace(urlCatalogo({ ...filtros, q: q || undefined, vivo: q ? true : undefined }), {
        scroll: false,
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const q = texto.trim();
    ultimoEnviado.current = q;
    input.current?.blur(); // cierra el teclado del celu
    router.push(urlCatalogo({ ...filtros, q: q || undefined, vivo: undefined }));
    if (q.length >= MINIMO) track("busqueda", { q });
  }

  return (
    <form role="search" onSubmit={enviar} className="relative">
      <label htmlFor="filtro-busqueda-celu" className="sr-only">
        Buscar
      </label>
      <input
        ref={input}
        id="filtro-busqueda-celu"
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="Buscar marca, modelo o versión"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className="h-10 w-full min-w-0 rounded-lg border border-border bg-white pl-3 pr-11 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center text-muted-foreground"
      >
        <Search className="h-4 w-4" />
      </button>
    </form>
  );
}
