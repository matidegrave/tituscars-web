import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative flex min-h-[85vh] flex-col justify-end overflow-hidden bg-brand-black px-4 pb-10 pt-32 text-white sm:min-h-[90vh]">
      <Image
        src="/brand/local-frente.webp"
        alt="Frente del local de Titus Cars en Córdoba"
        fill
        loading="eager"
        fetchPriority="high"
        sizes="100vw"
        className="object-cover object-center"
      />
      {/* Oscurece abajo (texto) y deja ver el local arriba. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          {/* La marca completa dentro del único H1 de la home (SEO de "titus cars"). */}
          <span className="mb-3 block text-sm font-semibold uppercase tracking-[0.2em] text-white/70 sm:text-base">
            Titus Cars · Autos usados en Córdoba
          </span>
          Tu próximo auto está en <span className="text-brand">TITUS.</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-white/70">
          Usados peritados y con garantía en Córdoba
        </p>
        <Button
          size="lg"
          className="mt-6 h-12 rounded-full px-6 text-base"
          render={<Link href="/autos" />}
          nativeButton={false}
        >
          Ver catálogo
        </Button>
      </div>
    </section>
  );
}
