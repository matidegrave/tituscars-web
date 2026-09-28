"use client";

import { useSyncExternalStore } from "react";
import { BotonFavorito } from "@/components/favoritos/boton-favorito";
import { BotonCopiar } from "@/components/vendedor/copiar-para-cliente";
import { useVendedor } from "@/components/vendedor/use-vendedor";
import {
  alternarSeleccion,
  estaSeleccionado,
  suscribirSeleccion,
  textoParaCliente,
  type AutoParaCliente,
} from "@/lib/para-cliente";

export type DatosCard = AutoParaCliente & { id: string; foto?: string | null };

/**
 * Lo interactivo de una card, afuera del <Link> (un botón dentro de un link
 * no es válido): el corazón de favoritos sobre la foto y, SOLO en modo equipo,
 * la casilla de selección y "Copiar para cliente" debajo de la card.
 */
export function ExtrasCard({ auto }: { auto: DatosCard }) {
  const vendedor = useVendedor();
  const { id, slug, titulo, anio, precio, foto } = auto;
  return (
    <>
      <div className="pointer-events-none absolute inset-x-px top-px aspect-[4/3]">
        <BotonFavorito
          className="pointer-events-auto absolute bottom-2 right-2"
          auto={{ id, slug, titulo, anio, precio, foto }}
        />
      </div>
      {vendedor && <HerramientasVendedor auto={auto} vendedor={vendedor} />}
    </>
  );
}

function HerramientasVendedor({
  auto,
  vendedor,
}: {
  auto: DatosCard;
  vendedor: string;
}) {
  const elegido = useSyncExternalStore(
    suscribirSeleccion,
    () => estaSeleccionado(auto.slug),
    () => false,
  );
  const cliente: AutoParaCliente = {
    slug: auto.slug,
    titulo: auto.titulo,
    anio: auto.anio,
    datos: auto.datos,
    precio: auto.precio,
  };
  return (
    <div className="mt-2 flex items-center gap-2">
      <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm">
        <input
          type="checkbox"
          checked={elegido}
          onChange={() => alternarSeleccion(cliente)}
          className="h-4 w-4 accent-[var(--brand)]"
        />
        Elegir
      </label>
      <BotonCopiar
        className="h-9 flex-1"
        texto={() => textoParaCliente(cliente, vendedor)}
      />
    </div>
  );
}

/** "Copiar para cliente" de la ficha (sólo modo equipo). */
export function CopiarFicha({ auto }: { auto: AutoParaCliente }) {
  const vendedor = useVendedor();
  if (!vendedor) return null;
  return (
    <BotonCopiar
      className="h-11 w-full"
      texto={() => textoParaCliente(auto, vendedor)}
    />
  );
}
