"use client";

import { useState, useSyncExternalStore } from "react";
import { BotonCopiar } from "@/components/vendedor/copiar-para-cliente";
import { useVendedor } from "@/components/vendedor/use-vendedor";
import {
  ENCABEZADO_POR_DEFECTO,
  leerSeleccion,
  limpiarSeleccion,
  suscribirSeleccion,
  textoVariosParaCliente,
  type AutoParaCliente,
} from "@/lib/para-cliente";

const ninguno: AutoParaCliente[] = [];
const vacia = () => ninguno;

/**
 * Barra fija abajo con los autos elegidos (sólo modo equipo):
 * "3 seleccionados · Copiar para cliente · Limpiar", con el encabezado
 * editable arriba. La selección vive en sessionStorage: sobrevive a cambiar
 * filtros y a entrar a una ficha.
 */
export function BarraSeleccion() {
  const vendedor = useVendedor();
  const seleccion = useSyncExternalStore(
    suscribirSeleccion,
    leerSeleccion,
    vacia,
  );
  const [encabezado, setEncabezado] = useState(ENCABEZADO_POR_DEFECTO);
  if (!vendedor || seleccion.length === 0) return null;
  return (
    <div
      role="region"
      aria-label="Autos elegidos para un cliente"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_16px_rgba(0,0,0,0.12)] backdrop-blur"
    >
      {/* Celu: cantidad + Limpiar, encabezado y el botón a todo el ancho. Compu: una fila. */}
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex items-center justify-between gap-2 sm:order-2">
          <span className="whitespace-nowrap text-sm font-semibold">
            {seleccion.length} {seleccion.length === 1 ? "seleccionado" : "seleccionados"}
          </span>
          <button
            type="button"
            onClick={limpiarSeleccion}
            className="h-9 shrink-0 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted"
          >
            Limpiar
          </button>
        </div>
        <label className="flex min-w-0 flex-1 items-center gap-2 text-sm sm:order-1">
          <span className="shrink-0 text-muted-foreground">Encabezado</span>
          <input
            value={encabezado}
            onChange={(e) => setEncabezado(e.target.value)}
            className="h-10 min-w-0 flex-1 rounded-lg border border-border px-3 text-base sm:text-sm"
          />
        </label>
        <BotonCopiar
          className="h-11 w-full whitespace-nowrap border-brand bg-brand text-white hover:bg-brand/90 sm:order-3 sm:w-auto"
          texto={() => textoVariosParaCliente(seleccion, vendedor, encabezado)}
        />
      </div>
    </div>
  );
}
