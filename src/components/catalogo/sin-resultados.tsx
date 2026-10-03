import Link from "next/link";
import { AutoGrid } from "@/components/auto-grid";
import { AvisoSinStock } from "@/components/catalogo/aviso-sin-stock";
import type { AutoCatalogo } from "@/lib/types";
import type { Prellenado } from "@/lib/aviso-busqueda";

/**
 * Búsqueda sin resultados: nunca pantalla vacía. "¿Quisiste decir…?" si hay
 * una marca/modelo parecido en stock, "Hoy no tenemos {lo buscado}", el botón
 * que abre "Te lo buscamos" prellenado (tanda 49; el cliente nos escribe por
 * WhatsApp de ventas, nosotros no escribimos primero) y hasta 8 autos parecidos.
 */
export function SinResultados({
  buscado,
  sugerencia,
  parecidos,
  hrefAviso,
  prellenado,
  titulo,
}: {
  buscado: string;
  sugerencia: { texto: string; href: string } | null;
  parecidos: AutoCatalogo[];
  /** Sin JS: WhatsApp directo con el texto simple. */
  hrefAviso: string;
  prellenado: Prellenado;
  /** En vez de "Hoy no tenemos {buscado}". */
  titulo?: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      {sugerencia && (
        <p className="text-base">
          ¿Quisiste decir{" "}
          {/* Es una búsqueda (/autos?q=): no se sigue (tanda 46b). */}
          <Link href={sugerencia.href} rel="nofollow" className="font-semibold text-brand underline underline-offset-2">
            {sugerencia.texto}
          </Link>
          ?
        </p>
      )}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 text-center shadow-sm sm:text-left">
        <h2 className="text-xl font-bold tracking-tight">{titulo ?? `Hoy no tenemos ${buscado}`}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Entran autos todas las semanas. Escribinos y te avisamos cuando llegue uno.
        </p>
        <AvisoSinStock hrefSimple={hrefAviso} prellenado={prellenado} origen="sin_resultados" />
      </div>
      {parecidos.length > 0 && (
        <div>
          <h3 className="text-lg font-bold">Estos se le parecen</h3>
          <div className="mt-4">
            <AutoGrid autos={parecidos} />
          </div>
        </div>
      )}
    </div>
  );
}
