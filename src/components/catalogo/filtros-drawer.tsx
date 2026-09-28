"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { FiltrosPanel } from "@/components/catalogo/filtros-panel";
import { contarFiltrosActivos, filtrosAParams, urlCatalogo, type Filtros } from "@/lib/filtros";
import type { FacetMarca } from "@/lib/facets";

export function FiltrosDrawer({
  filtros,
  marcas,
  anios,
  hayTransmision,
  hayCarroceria,
  total,
}: {
  filtros: Filtros;
  /** Autos que dan los filtros actuales (para el botón al abrir). */
  total: number;
  marcas: FacetMarca[];
  anios: number[];
  hayTransmision: boolean;
  hayCarroceria: boolean;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  // Los toques se acumulan acá y se aplican juntos con "Ver resultados": si
  // cada tilde navegara, la lista se re-renderiza mientras el cliente sigue
  // tocando y el toque siguiente cae en otra fila.
  const [borrador, setBorrador] = useState<Filtros>(filtros);
  const cantidadActivos = contarFiltrosActivos(filtros);

  // Recuento en vivo del borrador ("Ver 23 autos"). Arranca con el total de
  // la página; cada cambio del borrador pide /api/catalogo/contar (sólo
  // lectura, cacheado en la CDN). null = contando.
  const [cantidad, setCantidad] = useState<number | null>(total);
  const claveBorrador = filtrosAParams({ ...borrador, page: 1 }).toString();
  const claveActual = filtrosAParams({ ...filtros, page: 1 }).toString();

  useEffect(() => {
    if (!abierto) return;
    if (claveBorrador === claveActual) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCantidad(total);
      return;
    }
    let vigente = true;
    setCantidad(null);
    const t = setTimeout(() => {
      fetch(`/api/catalogo/contar?${claveBorrador}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { total?: number } | null) => {
          if (vigente) setCantidad(typeof d?.total === "number" ? d.total : -1);
        })
        .catch(() => vigente && setCantidad(-1));
    }, 250);
    return () => {
      vigente = false;
      clearTimeout(t);
    };
  }, [abierto, claveBorrador, claveActual, total]);

  function abrir() {
    setBorrador(filtros);
    setAbierto(true);
  }

  // -1: no se pudo contar -> el botón de siempre.
  const textoBoton =
    cantidad === null || cantidad < 0
      ? "Ver resultados"
      : cantidad === 0
        ? "Sin resultados, probá sacar un filtro"
        : `Ver ${cantidad} ${cantidad === 1 ? "auto" : "autos"}`;

  function aplicar() {
    router.push(urlCatalogo(borrador));
    setAbierto(false);
  }

  return (
    <Sheet open={abierto} onOpenChange={setAbierto}>
      <Button
        variant="outline"
        className="h-10 w-full justify-center gap-2 lg:hidden"
        onClick={abrir}
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filtros{cantidadActivos > 0 ? ` (${cantidadActivos})` : ""}
      </Button>

      <SheetContent side="bottom" className="max-h-[85vh]">
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
          <FiltrosPanel
            filtros={borrador}
            onCambiar={setBorrador}
            marcas={marcas}
            anios={anios}
            hayTransmision={hayTransmision}
            hayCarroceria={hayCarroceria}
          />
        </div>

        <SheetFooter>
          <Button onClick={aplicar} size="lg" disabled={cantidad === 0}>
            {textoBoton}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
