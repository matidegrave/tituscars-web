import type { Metadata } from "next";
import Image from "next/image";
import { HeroOscuro } from "@/components/institucional/hero-oscuro";
import { PasosNumerados } from "@/components/institucional/pasos-numerados";
import { WhatsappIcon } from "@/components/icons/whatsapp-icon";
import { linkVenta } from "@/lib/whatsapp";
import { ventaServidor } from "@/lib/whatsapp-servidor";
import { ENTIDADES, SITE_URL } from "@/lib/config";

export const metadata: Metadata = {
  alternates: { canonical: `${SITE_URL}/financiacion` },
  title: "Financiación | Titus Cars",
  description: "Financiá tu próximo auto en Córdoba: trabajamos con bancos y financieras para que pagues en cuotas.",
};

const PASOS = [
  { titulo: "Elegí el auto", texto: "Mirá el catálogo y elegí el que más te guste." },
  { titulo: "Te pre-calificamos", texto: "Por WhatsApp, sin vueltas y sin compromiso." },
  { titulo: "Firmás y te lo llevás", texto: "Cerramos los papeles y salís manejando." },
];

const REQUISITOS = [
  "DNI",
  "Ingresos demostrables",
  "Sin situación crediticia irregular",
];

export default async function FinanciacionPage() {
  // WhatsApp de venta de esta visita: pauta o portales (tanda 51) y ref del anuncio (tanda 52).
  const venta = await ventaServidor();
  return (
    <div>
      <HeroOscuro
        titulo="Financiá tu próximo auto"
        subtitulo="Trabajamos con bancos y financieras para que pagues en cuotas."
      />

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold tracking-tight">Cómo funciona</h2>
        <div className="mt-8">
          <PasosNumerados pasos={PASOS} />
        </div>
      </section>

      {ENTIDADES.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="text-2xl font-bold tracking-tight">Con quién trabajamos</h2>
          <div className="mt-8 grid grid-cols-2 items-center gap-8 sm:grid-cols-4">
            {ENTIDADES.map((e) => (
              <Image
                key={e.nombre}
                src={e.logo}
                alt={e.nombre}
                width={160}
                height={60}
                className="h-auto w-full object-contain grayscale"
              />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-2xl px-4 pb-16">
        <h2 className="text-2xl font-bold tracking-tight">Requisitos típicos</h2>
        <ul className="mt-4 space-y-2 text-sm text-foreground">
          {REQUISITOS.map((r) => (
            <li key={r} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              {r}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Cada entidad tiene sus condiciones. Te contamos las opciones disponibles cuando
          nos escribís.
        </p>
      </section>

      <section className="bg-brand-light px-4 py-16">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <h2 className="text-2xl font-bold tracking-tight">¿Tenés dudas?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Escribinos y te contamos qué opciones de financiación tenés disponibles.
          </p>
          <a
            href={linkVenta(venta, "Hola! Quiero consultar sobre financiación para un auto.")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 text-sm font-semibold text-white hover:opacity-90"
          >
            <WhatsappIcon className="h-4 w-4" />
            Consultar financiación
          </a>
        </div>
      </section>
    </div>
  );
}
