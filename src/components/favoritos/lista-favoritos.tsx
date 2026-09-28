"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Loader2 } from "lucide-react";
import { AutoCard } from "@/components/auto-card";
import { WhatsappIcon } from "@/components/icons/whatsapp-icon";
import { leerFavoritos, quitarFavorito, suscribirFavoritos, type Favorito } from "@/lib/favoritos";
import { formatPrecio, tituloAuto } from "@/lib/format";
import { linkWhatsapp } from "@/lib/whatsapp";
import { SITE_URL } from "@/lib/config";
import type { AutoCatalogo } from "@/lib/types";

const sinFavoritos: Favorito[] = [];
const nada = () => () => {};

interface Cargados {
  /** Ids por los que ya se preguntó (los que no volvieron ya no están en stock). */
  pedidos: Set<string>;
  autos: Map<string, AutoCatalogo>;
}

/** "Hola, me interesan estos autos: 1) TITULO AÑO precio link 2) ..." (sin emojis). */
export function mensajeFavoritos(autos: AutoCatalogo[]): string {
  const lista = autos
    .map(
      (a, i) =>
        `${i + 1}) ${tituloAuto(a)} ${a.anio} ${formatPrecio(a.precio, a.moneda)} ${SITE_URL}/autos/${a.slug}`
    )
    .join("\n");
  return `Hola, me interesan estos autos:\n${lista}`;
}

export function ListaFavoritos() {
  const favoritos = useSyncExternalStore(suscribirFavoritos, leerFavoritos, () => sinFavoritos);
  // En el server y al hidratar no se sabe qué hay guardado: "Cargando".
  const hidratado = useSyncExternalStore(nada, () => true, () => false);
  // Datos actuales de los guardados.
  const [cargados, setCargados] = useState<Cargados | null>(null);
  const [error, setError] = useState(false);
  const ids = favoritos.map((f) => f.id).sort().join(",");

  useEffect(() => {
    if (!ids) return;
    let vigente = true;
    fetch(`/api/catalogo/fichas?ids=${ids}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { autos?: AutoCatalogo[] }) => {
        if (vigente)
          setCargados({ pedidos: new Set(ids.split(",")), autos: new Map((d.autos ?? []).map((a) => [a.id, a])) });
      })
      .catch(() => vigente && setError(true));
    return () => {
      vigente = false;
    };
  }, [ids]);

  if (hidratado && favoritos.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center gap-3 py-12 text-center">
        <Heart className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
        <p className="text-muted-foreground">
          Todavía no guardaste autos. Tocá el corazón en los que te gusten y los vas a encontrar acá.
        </p>
        <Link href="/autos" className="mt-2 rounded-lg bg-brand px-4 py-2.5 font-semibold text-white">
          Ver catálogo
        </Link>
      </div>
    );
  }

  // Cargando mientras falte preguntar por alguno (sacar uno no vuelve a "Cargando").
  if (!hidratado || !cargados || favoritos.some((f) => !cargados.pedidos.has(f.id))) {
    return error ? (
      <p className="mt-8 text-muted-foreground">No pudimos cargar tus favoritos. Probá de nuevo en un rato.</p>
    ) : (
      <p className="mt-8 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Cargando tus favoritos…
      </p>
    );
  }

  const enStock = cargados.autos;
  const disponibles = favoritos.map((f) => enStock.get(f.id)).filter((a): a is AutoCatalogo => !!a);

  return (
    <>
      <p className="mt-1 text-muted-foreground">
        {favoritos.length === 1 ? "1 auto guardado" : `${favoritos.length} autos guardados`} en este
        dispositivo.
      </p>

      {disponibles.length > 0 && (
        <a
          href={linkWhatsapp(mensajeFavoritos(disponibles))}
          target="_blank"
          rel="noopener noreferrer"
          data-track-detalle="favoritos"
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 text-base font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto sm:inline-flex"
        >
          <WhatsappIcon className="h-5 w-5" />
          Consultar por mis favoritos
        </a>
      )}

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {favoritos.map((f) => {
          const auto = enStock.get(f.id);
          return auto ? <AutoCard key={f.id} auto={auto} /> : <NoDisponible key={f.id} favorito={f} />;
        })}
      </div>
    </>
  );
}

function NoDisponible({ favorito }: { favorito: Favorito }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 text-muted-foreground">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted grayscale">
        {favorito.foto && (
          <Image
            src={favorito.foto}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover opacity-50"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-2 text-sm font-bold uppercase tracking-tight">{favorito.titulo}</h3>
        <p className="text-sm">{favorito.anio}</p>
        <p className="mt-auto pt-2 text-sm font-semibold">Ya no está disponible</p>
        <button
          type="button"
          onClick={() => quitarFavorito(favorito.id)}
          className="mt-2 self-start rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-foreground hover:bg-muted"
        >
          Quitar
        </button>
      </div>
    </div>
  );
}
