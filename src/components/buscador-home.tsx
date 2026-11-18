"use client";

import { useState } from "react";
import { BuscadorCatalogo } from "@/components/catalogo/buscador-catalogo";
import {
  CLASE_GRUPO,
  SECCIONES,
  claseOpcion,
} from "@/components/catalogo/seccion-tabs";
import { filtrosVacios, type Seccion } from "@/lib/filtros";
import type { Sugerencia } from "@/lib/busqueda";

/**
 * Buscador de la home en el celu con Autos | Motos arriba (WEB-MOTOS3): el
 * selector cambia dónde busca (/autos o /motos) y qué sugiere. Sin JS queda
 * en Autos y el buscador anda igual.
 */
export function BuscadorHome({
  sugerencias,
  conMotos,
}: {
  sugerencias: Record<Seccion, Sugerencia[]>;
  conMotos: boolean;
}) {
  const [seccion, setSeccion] = useState<Seccion>("autos");
  return (
    <div className="flex flex-col gap-3">
      {conMotos && (
        <div
          role="group"
          aria-label="Buscar autos o motos"
          className={CLASE_GRUPO}
        >
          {SECCIONES.map((s) => (
            <button
              key={s.value}
              type="button"
              aria-pressed={s.value === seccion}
              onClick={() => setSeccion(s.value)}
              className={claseOpcion(s.value === seccion)}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
      <BuscadorCatalogo
        filtros={filtrosVacios(seccion)}
        id="buscador-home"
        sugerencias={sugerencias[seccion]}
      />
    </div>
  );
}
