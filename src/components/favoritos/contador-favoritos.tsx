"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { leerFavoritos, suscribirFavoritos } from "@/lib/favoritos";
import { cn } from "@/lib/utils";

/** Corazón con la cantidad de favoritos en el header (link a /favoritos). */
export function ContadorFavoritos({ className }: { className?: string }) {
  const cantidad = useSyncExternalStore(suscribirFavoritos, () => leerFavoritos().length, () => 0);
  return (
    <Link
      href="/favoritos"
      prefetch={false}
      aria-label={cantidad > 0 ? `Favoritos (${cantidad})` : "Favoritos"}
      className={cn("relative flex h-10 w-10 items-center justify-center text-white", className)}
    >
      <Heart className="h-6 w-6" aria-hidden="true" />
      {cantidad > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold leading-none text-brand">
          {cantidad}
        </span>
      )}
    </Link>
  );
}
