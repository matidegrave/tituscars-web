import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BusquedaAMedida } from "@/components/busqueda-a-medida";
import type { Prellenado } from "@/lib/aviso-busqueda";

/** Filtros sin resultados: "Te lo buscamos" prellenado con los filtros (tanda 49). */
export function EstadoVacio({ prellenado }: { prellenado: Prellenado }) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <SearchX className="h-10 w-10 text-muted-foreground" />
      <p className="mt-4 text-base font-medium">No encontramos autos con esos filtros</p>
      <Button
        variant="outline"
        className="mt-4"
        render={<Link href="/autos" />}
        nativeButton={false}
      >
        Limpiar filtros
      </Button>

      <BusquedaAMedida origen="sin_resultados" prellenado={prellenado} sobreGris className="mt-10 w-full max-w-3xl text-left" />
    </div>
  );
}
