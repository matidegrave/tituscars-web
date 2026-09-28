"use client";

import { useState } from "react";
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
import { contarFiltrosActivos, urlCatalogo, type Filtros } from "@/lib/filtros";
import type { FacetMarca } from "@/lib/facets";

export function FiltrosDrawer({
  filtros,
  marcas,
  anios,
  hayTransmision,
  hayCarroceria,
}: {
  filtros: Filtros;
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

  function abrir() {
    setBorrador(filtros);
    setAbierto(true);
  }

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
          <Button onClick={aplicar} size="lg">
            Ver resultados
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
