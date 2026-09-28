"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Controles de los filtros del catálogo que funcionan SIN JS (y con JS roto o
// en navegadores viejos): cada opción es un <a href> real y cada campo un
// <form method="get" action="/autos">, con la URL armada en el render (sale en
// el HTML del servidor). El JS sólo mejora: navega sin recargar o, en el panel
// del celu, junta los cambios en un borrador.

/**
 * Categoría desplegable con <details>: se abre y cierra sin JS. Arranca
 * abierta sólo si tiene algo elegido.
 */
export function Seccion({
  titulo,
  activos = 0,
  children,
}: {
  titulo: string;
  activos?: number;
  children: React.ReactNode;
}) {
  return (
    <details className="group border-b border-border" open={activos > 0}>
      <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-2 py-3 text-left transition-colors hover:text-brand [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2 font-semibold">
          {titulo}
          {activos > 0 && (
            <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
              {activos}
            </span>
          )}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-brand transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-4">{children}</div>
    </details>
  );
}

/**
 * Opción con tilde como link: toda la fila es tocable. En el panel del celu
 * (borrador) el click no navega: avisa el cambio con onElegir.
 */
export function OpcionLink({
  checked,
  href,
  onElegir,
  children,
}: {
  checked: boolean;
  href: string;
  /** Si está, el click no navega (panel del celu): junta el cambio. */
  onElegir?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      role="checkbox"
      aria-checked={checked}
      onClick={(e) => {
        if (!onElegir) return;
        e.preventDefault();
        onElegir();
      }}
      className="flex min-h-11 items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:text-brand"
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-[18px] shrink-0 items-center justify-center rounded-[4px] border",
          checked ? "border-brand bg-brand text-white" : "border-zinc-400 bg-white"
        )}
      >
        {checked && (
          <svg viewBox="0 0 16 16" className="size-3 fill-none stroke-current stroke-[2.5]">
            <path d="M3.5 8.5l3 3 6-7" />
          </svg>
        )}
      </span>
      <span>{children}</span>
    </Link>
  );
}

/** Opción como botón-link (rangos de precio). */
export function OpcionBoton({
  activo,
  href,
  onElegir,
  children,
}: {
  activo: boolean;
  href: string;
  onElegir?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      aria-current={activo ? "true" : undefined}
      onClick={(e) => {
        if (!onElegir) return;
        e.preventDefault();
        onElegir();
      }}
      className={cn(
        "rounded-lg px-3 py-2 text-left transition-colors",
        activo ? "bg-brand font-semibold text-white" : "hover:text-brand"
      )}
    >
      {children}
    </Link>
  );
}

/**
 * <form method="get" action="/autos"> con los demás filtros como campos
 * ocultos. Con JS, onAplicar recibe los datos y el submit no recarga.
 * "Aplicar": siempre si botonSiempre (mínimo/máximo); si no, sólo sin JS
 * (<noscript>: los selects aplican solos al cambiar, y así el botón no
 * aparece y desaparece al hidratar, que movería la página).
 */
export function FormFiltro({
  ocultos,
  onAplicar,
  botonSiempre = false,
  className,
  children,
}: {
  ocultos: [string, string][];
  onAplicar: (datos: FormData) => void;
  botonSiempre?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const boton = (
    <button
      type="submit"
      className="mt-2 h-9 w-full rounded-lg border border-brand text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-white"
    >
      Aplicar
    </button>
  );
  return (
    <form
      method="get"
      action="/autos"
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        onAplicar(new FormData(e.currentTarget));
      }}
    >
      {ocultos.map(([k, v], i) => (
        <input key={`${k}-${i}`} type="hidden" name={k} value={v} />
      ))}
      {children}
      {botonSiempre ? boton : <noscript>{boton}</noscript>}
    </form>
  );
}

/** <select> nativo con el estilo del sitio (anda sin JS y en cualquier navegador). */
export function SelectNativo({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(
          "h-9 w-full appearance-none rounded-lg border border-input bg-white pl-2.5 pr-8 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          className
        )}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
