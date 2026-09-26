import type { Metadata } from "next";
import { SITE_URL } from "@/lib/config";
import { HeroOscuro } from "@/components/institucional/hero-oscuro";
import { PasosNumerados } from "@/components/institucional/pasos-numerados";
import { CotizacionForm } from "@/components/institucional/cotizacion-form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  alternates: { canonical: `${SITE_URL}/consigna` },
  title: "Consigná tu auto | Titus Cars",
  description:
    "Consigna virtual o física en Córdoba: peritamos, publicamos y vendemos tu auto sin que te desprendas de él.",
};

const PASOS = [
  { titulo: "Lo peritamos", texto: "Revisamos el auto y sacamos las fotos profesionales." },
  {
    titulo: "Lo publicamos",
    texto: "En nuestra web, Mercado Libre, Instagram y todos nuestros canales.",
  },
  {
    titulo: "Atendemos las consultas",
    texto: "Filtramos curiosos, coordinamos las visitas con vos.",
  },
  { titulo: "Cerramos la venta", texto: "Nos ocupamos de la transferencia y la gestoría." },
];

const FAQS = [
  {
    pregunta: "¿Tiene costo?",
    respuesta:
      "No. La consigna no tiene costo hasta que el auto se vende. Recién ahí se descuenta la comisión acordada.",
  },
  {
    pregunta: "¿Cuánto tarda en venderse?",
    respuesta:
      "Depende del auto y del precio, pero al publicarlo en todos nuestros canales y mostrarlo activamente, la mayoría se vende en pocas semanas.",
  },
  {
    pregunta: "¿Quién fija el precio?",
    respuesta:
      "Lo definimos juntos: te sugerimos un valor de mercado según el estado del auto, pero la última palabra la tenés vos.",
  },
  {
    pregunta: "¿Qué pasa si me arrepiento?",
    respuesta: "Podés dar de baja la consigna cuando quieras, sin costo ni penalidad.",
  },
  {
    pregunta: "¿Qué papeles necesito?",
    respuesta:
      "DNI, título y cédula del auto. Si tiene prenda o algún trámite pendiente, lo vemos juntos antes de publicarlo.",
  },
];

export default function ConsignaPage() {
  return (
    <div>
      <HeroOscuro
        titulo="Vendé tu auto sin moverlo de tu casa"
        subtitulo="Consigna virtual: vos lo seguís usando, nosotros lo vendemos."
      />

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold tracking-tight">Cómo funciona</h2>
        <div className="mt-8">
          <PasosNumerados pasos={PASOS} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold">Consigna virtual</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              El auto queda con vos: lo seguís usando todos los días mientras nosotros lo
              publicamos y lo vendemos. Ideal si lo usás a diario.
            </p>
            <p className="mt-3 inline-flex rounded-full bg-brand-black px-2.5 py-1 text-xs font-semibold text-white">
              Sin costo hasta que se vende
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold">Consigna física</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              El auto queda en nuestro local: lo mostramos todos los días a quien se acerque.
              Ideal si tenés otro auto para moverte.
            </p>
            <p className="mt-3 inline-flex rounded-full bg-brand-black px-2.5 py-1 text-xs font-semibold text-white">
              Sin costo hasta que se vende
            </p>
          </div>
        </div>
      </section>

      <section className="bg-brand-light px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight">Pedí tu cotización</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Contanos sobre tu auto y te contactamos por WhatsApp.
          </p>
          <div className="mt-6 rounded-xl border border-border bg-card p-6">
            <CotizacionForm storageKey="form-consigna" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-16">
        <h2 className="text-2xl font-bold tracking-tight">Preguntas frecuentes</h2>
        <Accordion className="mt-6">
          {FAQS.map((f) => (
            <AccordionItem key={f.pregunta} value={f.pregunta}>
              <AccordionTrigger>{f.pregunta}</AccordionTrigger>
              <AccordionContent>{f.respuesta}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
