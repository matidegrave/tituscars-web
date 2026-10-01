import Link from "next/link";
import { AutoCard } from "@/components/auto-card";
import { CarruselTarjetas } from "@/components/carrusel-tarjetas";
import type { AutoCatalogo } from "@/lib/types";

/** Carrusel de la home ("Destacados", "Bajaron de precio"), con tarjeta final al catálogo. */
export function FeaturedCarousel({
  autos,
  totalEnStock,
  verMas,
  etiqueta = "Autos destacados",
}: {
  autos: AutoCatalogo[];
  totalEnStock: number;
  /** Tarjeta final. Por defecto, "Ver más vehículos disponibles" a /autos. */
  verMas?: { href: string; titulo: string; detalle: string };
  etiqueta?: string;
}) {
  const final = verMas ?? {
    href: "/autos",
    titulo: "Ver más vehículos disponibles",
    detalle: `${totalEnStock} autos en stock`,
  };
  if (autos.length === 0) return null;

  return (
    <CarruselTarjetas etiqueta={etiqueta}>
      {autos.map((auto) => (
        <AutoCard key={auto.id} auto={auto} />
      ))}
      {/* Cierre del carrusel: lleva al catálogo completo. */}
      <Link
        href={final.href}
        className="group flex h-full min-h-72 flex-col items-center justify-center gap-2 rounded-xl border border-brand-black bg-brand-black p-6 text-center text-white transition-colors hover:border-brand"
      >
        <span className="text-xl font-black leading-tight">{final.titulo}</span>
        <span className="text-sm text-white/60">{final.detalle}</span>
        <span aria-hidden className="mt-2 text-3xl text-brand transition-transform group-hover:translate-x-1">
          →
        </span>
      </Link>
    </CarruselTarjetas>
  );
}
