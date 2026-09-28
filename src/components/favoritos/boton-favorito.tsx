"use client";

import { useSyncExternalStore } from "react";
import { Heart } from "lucide-react";
import { alternarFavorito, esFavorito, suscribirFavoritos, type Favorito } from "@/lib/favoritos";
import { cn } from "@/lib/utils";

/**
 * Corazón para guardar un auto en favoritos (localStorage, sin cuenta).
 * "card": redondo sobre la foto de la card; "ficha": botón con borde al lado
 * de compartir. Sin JS no hace nada (es un extra).
 */
export function BotonFavorito({
  auto,
  variante = "card",
  className,
}: {
  auto: Omit<Favorito, "ts">;
  variante?: "card" | "ficha";
  className?: string;
}) {
  const guardado = useSyncExternalStore(suscribirFavoritos, () => esFavorito(auto.id), () => false);
  return (
    <button
      type="button"
      aria-pressed={guardado}
      aria-label={guardado ? "Quitar de favoritos" : "Guardar en favoritos"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        alternarFavorito(auto);
      }}
      className={cn(
        "flex shrink-0 items-center justify-center transition-colors",
        variante === "card"
          ? "h-9 w-9 rounded-full bg-white/90 shadow-sm hover:bg-white"
          : "h-12 w-12 rounded-lg border border-border hover:bg-muted",
        className
      )}
    >
      <Heart
        className={cn("h-5 w-5", guardado ? "fill-brand text-brand" : "text-foreground/70")}
        aria-hidden="true"
      />
    </button>
  );
}
