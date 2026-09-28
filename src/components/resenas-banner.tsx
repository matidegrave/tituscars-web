import Image from "next/image";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GOOGLE_PUNTAJE, RESENAS_CANTIDAD, RESENAS_URL } from "@/lib/config";
import { RESENAS_DESTACADAS } from "@/lib/resenas";
import { EstrellasPuntaje } from "@/components/estrellas-puntaje";

export function ResenasBanner() {
  return (
    <section className="bg-brand-light py-16">
      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 text-center">
        <EstrellasPuntaje puntaje={GOOGLE_PUNTAJE} />
        <h2 className="mt-3 text-2xl font-bold tracking-tight">{GOOGLE_PUNTAJE} en Google</h2>
        <p className="mt-1 text-brand-gray">{RESENAS_CANTIDAD} reseñas en Google</p>

        {RESENAS_DESTACADAS.length > 0 && (
          <div className="mt-10 grid w-full grid-cols-1 gap-5 text-left sm:grid-cols-2 lg:grid-cols-3">
            {RESENAS_DESTACADAS.map((r) => (
              <figure
                key={r.nombre}
                className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
              >
                {r.foto && (
                  <div className="relative aspect-[4/3] w-full bg-muted">
                    <Image
                      src={r.foto}
                      alt={`Entrega a ${r.nombre}`}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-brand text-brand" />
                    ))}
                  </div>
                  <blockquote className="flex-1 text-sm text-foreground">“{r.texto}”</blockquote>
                  <figcaption className="text-sm">
                    <span className="font-semibold">{r.nombre}</span>
                    {r.auto && <span className="text-muted-foreground"> · {r.auto}</span>}
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          className="mt-8"
          render={<a href={RESENAS_URL} target="_blank" rel="noopener noreferrer" />}
          nativeButton={false}
        >
          Leer todas las reseñas en Google
        </Button>
      </div>
    </section>
  );
}
