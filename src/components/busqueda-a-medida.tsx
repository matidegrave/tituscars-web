"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { linkWhatsapp } from "@/lib/whatsapp";
import { track } from "@/lib/tracking";
import { formatMiles, formatPrecio, parseMiles } from "@/lib/format";

const PRESUPUESTO_MIN = 5_000_000;
const PRESUPUESTO_MAX = 50_000_000;
const PRESUPUESTO_PASO = 500_000;

type Pago = "contado" | "financiado" | "ambos";

const OPCIONES_PAGO: { valor: Pago; label: string; texto: string }[] = [
  { valor: "contado", label: "Contado", texto: "Contado" },
  { valor: "financiado", label: "Financiado", texto: "Financiado" },
  { valor: "ambos", label: "Parte contado, parte financiado", texto: "Parte y parte" },
];

/**
 * ninguno: no tocó el presupuesto (no se envía).
 * valor: eligió o escribió un monto (puede ser mayor al tope de la barra).
 * tope: dejó la barra en el extremo derecho sin escribir ("Más de $50M").
 */
type ModoPresupuesto = "ninguno" | "valor" | "tope";

interface Datos {
  nombre: string;
  celular: string;
  modelos: string;
  /** null = todavía no respondió la pregunta. */
  entrega: boolean | null;
  entregaModelo: string;
  entregaAnio: string;
  entregaKm: string;
  pago: Pago | null;
  modoPresupuesto: ModoPresupuesto;
  presupuesto: number;
  observaciones: string;
  /** Campo trampa: una persona no lo ve; si viene lleno es un bot. */
  trampa: string;
}

const VACIO: Datos = {
  nombre: "",
  celular: "",
  modelos: "",
  entrega: null,
  entregaModelo: "",
  entregaAnio: "",
  entregaKm: "",
  pago: null,
  modoPresupuesto: "ninguno",
  presupuesto: (PRESUPUESTO_MIN + PRESUPUESTO_MAX) / 2,
  observaciones: "",
  trampa: "",
};

const TEXTO_TOPE = "Presupuesto: más de $50M.";

/** La barra no puede salir de su rango, aunque el monto escrito sí. */
function valorBarra(d: Datos): number {
  if (d.modoPresupuesto === "tope") return PRESUPUESTO_MAX;
  return Math.min(Math.max(d.presupuesto, PRESUPUESTO_MIN), PRESUPUESTO_MAX);
}

function observacionesAGuardar(d: Datos): string | null {
  const partes = [d.modoPresupuesto === "tope" ? TEXTO_TOPE : "", d.observaciones.trim()];
  return partes.filter(Boolean).join(" ").slice(0, 1000) || null;
}

function anioValido(texto: string): number | null {
  const n = Number(texto);
  return texto && n >= 1950 && n <= 2100 ? n : null;
}

function kmValido(texto: string): number | null {
  const n = Number(texto);
  return texto && n >= 0 && n <= 2_000_000 ? n : null;
}

function construirMensaje(d: Datos, autoTitulo?: string): string {
  const lineas = [`Hola! Soy ${d.nombre.trim()}. Quiero que me busquen un auto a medida.`];
  if (autoTitulo) lineas.push(`Lo pido desde la ficha del ${autoTitulo}.`);
  if (d.modelos.trim()) lineas.push(`Busco: ${d.modelos.trim()}.`);
  if (d.entrega === false) lineas.push("Entrega vehículo: No.");
  if (d.entrega) {
    const entrego = [
      d.entregaModelo.trim(),
      anioValido(d.entregaAnio),
      kmValido(d.entregaKm) !== null ? `${formatMiles(d.entregaKm)} km` : null,
    ]
      .filter(Boolean)
      .join(", ");
    lineas.push(`Entrega vehículo: Sí${entrego ? ` (${entrego})` : ""}.`);
  }
  const pago = OPCIONES_PAGO.find((o) => o.valor === d.pago);
  if (pago) lineas.push(`Pago: ${pago.texto}.`);
  if (d.modoPresupuesto === "valor") {
    lineas.push(`Presupuesto máximo: ${formatPrecio(d.presupuesto, "ARS")}.`);
  } else if (d.modoPresupuesto === "tope") {
    lineas.push(TEXTO_TOPE);
  }
  if (d.observaciones.trim()) lineas.push(`Observaciones: ${d.observaciones.trim()}`);
  lineas.push(`Mi celular: ${d.celular.trim()}`);
  return lineas.join("\n");
}

export function BusquedaAMedida({
  autoSlug,
  autoTitulo,
  sobreGris = false,
  className,
}: {
  /** Si el form está en la ficha de un auto, se guarda de dónde vino el pedido. */
  autoSlug?: string;
  autoTitulo?: string;
  /** Sobre un fondo gris (catálogo) la tarjeta va blanca para despegarse. */
  sobreGris?: boolean;
  className?: string;
}) {
  const [datos, setDatos] = useState<Datos>(VACIO);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);

  function set<K extends keyof Datos>(campo: K, valor: Datos[K]) {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  }

  function moverBarra(valor: number) {
    setDatos((prev) => ({
      ...prev,
      presupuesto: valor,
      modoPresupuesto: valor >= PRESUPUESTO_MAX ? "tope" : "valor",
    }));
  }

  function escribirMonto(texto: string) {
    const valor = parseMiles(texto);
    setDatos((prev) =>
      valor === undefined
        ? { ...prev, modoPresupuesto: "ninguno" }
        : { ...prev, presupuesto: Math.min(valor, 999_999_999_999), modoPresupuesto: "valor" }
    );
  }

  // Mismas reglas que valida /api/busqueda-a-medida: celular de 8 a 15 dígitos
  // (se pueden escribir espacios, guiones, paréntesis y +).
  const digitosCelular = datos.celular.replace(/\D/g, "").length;
  const celularValido = /^[\d\s()+-]*$/.test(datos.celular) && digitosCelular >= 8 && digitosCelular <= 15;
  const valido = datos.nombre.trim().length >= 2 && celularValido;

  async function enviar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valido || enviando) return;

    // Bot: se hace como que salió bien, sin guardar ni abrir nada.
    if (datos.trampa) {
      setListo(true);
      return;
    }

    setEnviando(true);
    // La pestaña se abre ya, en el clic: si se abriera después de esperar a la
    // base, el navegador la bloquearía como popup. Cuando termina el insert se
    // la manda a WhatsApp.
    const pestana = window.open("", "_blank");

    let guardado = false;
    try {
      const res = await fetch("/api/busqueda-a-medida", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          web: datos.trampa,
          nombre: datos.nombre.trim().slice(0, 80),
          celular: datos.celular.trim(),
          modelos_buscados: datos.modelos.trim().slice(0, 300) || null,
          entrega_vehiculo: datos.entrega === true,
          entrega_modelo: datos.entrega ? datos.entregaModelo.trim().slice(0, 120) || null : null,
          entrega_anio: datos.entrega ? anioValido(datos.entregaAnio) : null,
          entrega_km: datos.entrega ? kmValido(datos.entregaKm) : null,
          financia: datos.pago === "financiado" || datos.pago === "ambos",
          contado: datos.pago === "contado" || datos.pago === "ambos",
          presupuesto_max: datos.modoPresupuesto === "valor" ? datos.presupuesto : null,
          observaciones: observacionesAGuardar(datos),
          pagina: `${window.location.pathname}${window.location.search}`.slice(0, 300),
          auto_slug: autoSlug?.slice(0, 200) ?? null,
        }),
      });
      guardado = res.ok;
      if (!res.ok) console.error("busqueda-a-medida", res.status);
    } catch (e) {
      console.error("busqueda-a-medida", e);
    }
    if (guardado) track("lead_form", { nombre: "busqueda_a_medida", slug: autoSlug });

    // Salga bien o mal el insert, el pedido llega igual por WhatsApp.
    const link = linkWhatsapp(construirMensaje(datos, autoTitulo));
    if (pestana) {
      pestana.opener = null;
      pestana.location.href = link;
    } else {
      window.open(link, "_blank", "noopener,noreferrer");
    }

    setEnviando(false);
    setListo(true);
  }

  return (
    <section
      className={`rounded-2xl p-6 sm:p-8 ${sobreGris ? "border border-zinc-200 bg-white shadow-sm" : "bg-brand-light"} ${className ?? ""}`}
      aria-labelledby="busqueda-a-medida-titulo"
    >
      {listo ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CheckCircle2 className="h-10 w-10 text-brand" />
          <p className="text-lg font-bold">
            ¡Listo! Ya recibimos tu búsqueda, te escribimos a la brevedad.
          </p>
        </div>
      ) : (
        <>
          <h2
            id="busqueda-a-medida-titulo"
            className="text-center text-2xl font-black tracking-tight md:text-left"
          >
            ¿No encontraste el vehículo que buscás?
          </h2>
          <p className="mt-2 text-center text-muted-foreground md:text-left">
            Te buscamos tu auto a medida. Dejanos tus preferencias y te lo conseguimos. Sin
            costo, sin compromiso.
          </p>

          <form onSubmit={enviar} className="mt-6 space-y-5">
            {/* Honeypot: fuera de pantalla y fuera del tab; sólo lo completa un bot. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label htmlFor="bam-web">No completar</label>
              <input
                id="bam-web"
                name="web"
                tabIndex={-1}
                autoComplete="off"
                value={datos.trampa}
                onChange={(e) => set("trampa", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="bam-nombre" className="mb-1.5">
                  Nombre *
                </Label>
                <Input
                  id="bam-nombre"
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  value={datos.nombre}
                  onChange={(e) => set("nombre", e.target.value)}
                  className="h-10 bg-background"
                />
              </div>
              <div>
                <Label htmlFor="bam-celular" className="mb-1.5">
                  Celular *
                </Label>
                <Input
                  id="bam-celular"
                  required
                  minLength={8}
                  maxLength={30}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="351 123 4567"
                  value={datos.celular}
                  onChange={(e) => set("celular", e.target.value)}
                  aria-invalid={datos.celular.trim() !== "" && !celularValido}
                  aria-describedby="bam-celular-ayuda"
                  className="h-10 bg-background"
                />
                {datos.celular.trim() !== "" && !celularValido && (
                  <p id="bam-celular-ayuda" className="mt-1 text-xs text-destructive">
                    Con código de área, sólo números (de 8 a 15).
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="bam-modelos" className="mb-1.5">
                Modelos buscados
              </Label>
              <Input
                id="bam-modelos"
                maxLength={300}
                placeholder="Ej.: Toyota Corolla, VW Vento"
                value={datos.modelos}
                onChange={(e) => set("modelos", e.target.value)}
                className="h-10 bg-background"
              />
            </div>

            <Pregunta titulo="¿Tenés un vehículo para entregar?">
              <Pastilla activa={datos.entrega === true} onClick={() => set("entrega", true)}>
                Sí
              </Pastilla>
              <Pastilla activa={datos.entrega === false} onClick={() => set("entrega", false)}>
                No
              </Pastilla>
            </Pregunta>

            {datos.entrega && (
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-background p-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="bam-entrega-modelo" className="mb-1.5">
                    Modelo
                  </Label>
                  <Input
                    id="bam-entrega-modelo"
                    maxLength={120}
                    placeholder="Ej.: Fiat Cronos 1.3"
                    value={datos.entregaModelo}
                    onChange={(e) => set("entregaModelo", e.target.value)}
                    className="h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="bam-entrega-anio" className="mb-1.5">
                    Año
                  </Label>
                  <Input
                    id="bam-entrega-anio"
                    inputMode="numeric"
                    placeholder="2020"
                    value={datos.entregaAnio}
                    onChange={(e) =>
                      set("entregaAnio", e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    className="h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="bam-entrega-km" className="mb-1.5">
                    Km
                  </Label>
                  <Input
                    id="bam-entrega-km"
                    inputMode="numeric"
                    placeholder="80.000"
                    value={formatMiles(datos.entregaKm)}
                    onChange={(e) =>
                      set("entregaKm", String(parseMiles(e.target.value) ?? "").slice(0, 7))
                    }
                    className="h-10"
                  />
                </div>
              </div>
            )}

            <Pregunta titulo="¿Cómo pensás pagarlo?">
              {OPCIONES_PAGO.map((op) => (
                <Pastilla
                  key={op.valor}
                  activa={datos.pago === op.valor}
                  onClick={() => set("pago", op.valor)}
                >
                  {op.label}
                </Pastilla>
              ))}
            </Pregunta>

            <div>
              <Label htmlFor="bam-presupuesto-monto">Presupuesto máximo</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Mové la barra o escribí el monto.
              </p>
              <div className="mt-2 flex items-baseline gap-2 text-3xl font-black sm:text-4xl">
                {datos.modoPresupuesto === "tope" && <span className="shrink-0">Más de</span>}
                <span className="shrink-0">$</span>
                <input
                  id="bam-presupuesto-monto"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="0"
                  value={datos.modoPresupuesto === "ninguno" ? "" : formatMiles(datos.presupuesto)}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => escribirMonto(e.target.value)}
                  className="w-full min-w-0 bg-transparent outline-none placeholder:text-muted-foreground/50 focus-visible:underline focus-visible:decoration-brand focus-visible:decoration-2 focus-visible:underline-offset-4"
                />
              </div>
              <input
                type="range"
                min={PRESUPUESTO_MIN}
                max={PRESUPUESTO_MAX}
                step={PRESUPUESTO_PASO}
                value={valorBarra(datos)}
                onChange={(e) => moverBarra(Number(e.target.value))}
                aria-label="Presupuesto máximo"
                aria-valuetext={
                  datos.modoPresupuesto === "ninguno"
                    ? "Sin definir"
                    : datos.modoPresupuesto === "tope"
                      ? "Más de $50M"
                      : formatPrecio(datos.presupuesto, "ARS")
                }
                className="mt-3 w-full cursor-pointer accent-brand"
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>$5M</span>
                <span>+$50M</span>
              </div>
            </div>

            <div>
              <Label htmlFor="bam-observaciones" className="mb-1.5">
                Observaciones
              </Label>
              <textarea
                id="bam-observaciones"
                rows={3}
                maxLength={1000}
                placeholder="Color, versión, cantidad de puertas, lo que quieras contarnos"
                value={datos.observaciones}
                onChange={(e) => set("observaciones", e.target.value)}
                className="w-full resize-y rounded-lg border border-input bg-background px-2.5 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={!valido || enviando}
              className="h-12 w-full rounded-full text-base sm:w-auto sm:px-10"
            >
              {enviando ? "Enviando…" : "Enviar"}
            </Button>
          </form>
        </>
      )}
    </section>
  );
}

function Pregunta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{titulo}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Pastilla({
  activa,
  onClick,
  children,
}: {
  activa: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={activa}
      onClick={onClick}
      className={`h-10 rounded-full border px-5 text-sm font-semibold transition-colors ${
        activa
          ? "border-brand bg-brand text-white"
          : "border-border bg-background text-foreground hover:border-brand"
      }`}
    >
      {children}
    </button>
  );
}
