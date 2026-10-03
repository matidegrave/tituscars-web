"use client";

import { useId, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WhatsappIcon } from "@/components/icons/whatsapp-icon";
import { linkWhatsapp } from "@/lib/whatsapp";
import {
  CARROCERIAS,
  COMBUSTIBLES,
  PRESUPUESTOS,
  TRANSMISIONES,
  VACIO,
  aniosElegibles,
  construirMensaje,
  cuerpoBusqueda,
  type DatosAviso,
  type Origen,
  type Prellenado,
} from "@/lib/aviso-busqueda";

export interface PropsBusqueda {
  origen: Origen;
  prellenado?: Prellenado;
  /** Si el pedido sale de una ficha, se guarda de cuál. */
  autoSlug?: string;
}

/**
 * "Te lo buscamos" (tanda 49): el único formulario de búsqueda a medida de la
 * web. Sin nombre ni celular (llegan con el WhatsApp); sólo la marca/modelo es
 * obligatoria y el resto son botones. "Enviar por WhatsApp" es un <a> a wa.me
 * de verdad: en el click se guarda en busquedas_web (fetch keepalive, sale
 * antes de saltar a WhatsApp; si falla, WhatsApp abre igual) y la medición
 * global lo cuenta como click_whatsapp/aviso_sin_stock (Lead), con la misma
 * lógica de modo equipo y del panel de TikTok/Instagram que el resto de los
 * WhatsApp. Abrir el form sin enviarlo no cuenta como lead.
 */
export function FormBusqueda({
  origen,
  prellenado,
  autoSlug,
  enHoja = false,
  onCerrar,
}: PropsBusqueda & {
  /** Dentro de la hoja/modal: el cuerpo scrollea y el botón queda fijo abajo. */
  enHoja?: boolean;
  onCerrar?: () => void;
}) {
  const id = useId();
  const [datos, setDatos] = useState<DatosAviso>(() => ({ ...VACIO, ...prellenado?.datos }));
  const [trampa, setTrampa] = useState("");
  const [faltaModelo, setFaltaModelo] = useState(false);
  const [listo, setListo] = useState(false);
  const enviarLink = useRef<HTMLAnchorElement>(null);
  const modeloInput = useRef<HTMLInputElement>(null);
  const [anios] = useState(() => aniosElegibles());

  function set<K extends keyof DatosAviso>(campo: K, valor: DatosAviso[K]) {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  }
  /** Chips de una sola opción: tocar la elegida la deselecciona. */
  function alternar<K extends keyof DatosAviso>(campo: K, valor: DatosAviso[K]) {
    setDatos((prev) => ({ ...prev, [campo]: prev[campo] === valor ? VACIO[campo] : valor }));
  }

  const valido = datos.modelo.trim().length >= 2;
  const link = linkWhatsapp(valido ? construirMensaje(datos) : "");

  function alEnviar(e: React.MouseEvent<HTMLAnchorElement>) {
    // Bot: se hace como que salió bien, sin guardar ni abrir nada.
    if (trampa) {
      e.preventDefault();
      setListo(true);
      return;
    }
    try {
      void fetch("/api/busqueda-a-medida", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify(
          cuerpoBusqueda(datos, {
            origen,
            q: prellenado?.q,
            filtrosActivos: prellenado?.filtrosActivos,
            autoSlug,
            pagina: `${window.location.pathname}${window.location.search}`,
            trampa,
          })
        ),
      }).catch((err) => console.error("busqueda-a-medida", err));
    } catch (err) {
      console.error("busqueda-a-medida", err);
    }
    // Después del click (el <a> tiene que seguir montado para abrir WhatsApp).
    setTimeout(() => setListo(true), 0);
  }

  function alSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valido) {
      setFaltaModelo(true);
      modeloInput.current?.focus();
      return;
    }
    enviarLink.current?.click();
  }

  if (listo) {
    return (
      <div className={`flex flex-col items-center gap-3 py-8 text-center ${enHoja ? "px-4" : ""}`}>
        <CheckCircle2 className="h-10 w-10 text-brand" />
        <p className="text-lg font-bold">¡Listo! Mandanos el mensaje por WhatsApp y te avisamos cuando entre uno.</p>
        {onCerrar && (
          <button
            type="button"
            onClick={onCerrar}
            className="mt-2 h-11 rounded-full border border-border px-6 text-sm font-semibold hover:border-brand"
          >
            Cerrar
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={alSubmit} noValidate className={enHoja ? "flex min-h-0 flex-1 flex-col" : ""}>
      <div className={enHoja ? "min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pb-6 pt-1 sm:px-6" : "space-y-5"}>
        {/* Honeypot: fuera de pantalla y fuera del tab; sólo lo completa un bot. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor={`${id}-web`}>No completar</label>
          <input id={`${id}-web`} name="web" tabIndex={-1} autoComplete="off" value={trampa} onChange={(e) => setTrampa(e.target.value)} />
        </div>

        <div>
          <Label htmlFor={`${id}-modelo`} className="mb-1.5">
            Marca y modelo *
          </Label>
          <Input
            id={`${id}-modelo`}
            ref={modeloInput}
            required
            maxLength={120}
            autoComplete="off"
            placeholder="Ej: Volkswagen Vento"
            value={datos.modelo}
            onChange={(e) => {
              set("modelo", e.target.value);
              if (faltaModelo) setFaltaModelo(false);
            }}
            aria-invalid={faltaModelo}
            aria-describedby={faltaModelo ? `${id}-modelo-ayuda` : undefined}
            className="h-11 bg-background text-base"
          />
          {faltaModelo && (
            <p id={`${id}-modelo-ayuda`} className="mt-1 text-xs text-destructive">
              Contanos qué auto buscás.
            </p>
          )}
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">Años</legend>
          <div className="grid grid-cols-2 gap-3">
            <SelectAnio etiqueta="Desde" valor={datos.anioDesde} anios={anios} onChange={(v) => set("anioDesde", v)} />
            <SelectAnio etiqueta="Hasta" valor={datos.anioHasta} anios={anios} onChange={(v) => set("anioHasta", v)} />
          </div>
        </fieldset>

        <Pregunta titulo="Presupuesto: hasta">
          {PRESUPUESTOS.map((p) => (
            <Pastilla key={p.valor} activa={datos.presupuesto === p.valor} onClick={() => alternar("presupuesto", p.valor)}>
              {p.label}
            </Pastilla>
          ))}
        </Pregunta>

        <Pregunta titulo="Combustible">
          {COMBUSTIBLES.map((c) => (
            <Pastilla key={c} activa={datos.combustible === c} onClick={() => alternar("combustible", c)}>
              {c}
            </Pastilla>
          ))}
        </Pregunta>

        <Pregunta titulo="Transmisión">
          {TRANSMISIONES.map((t) => (
            <Pastilla key={t} activa={datos.transmision === t} onClick={() => alternar("transmision", t)}>
              {t}
            </Pastilla>
          ))}
        </Pregunta>

        <Pregunta titulo="Puertas / carrocería">
          {CARROCERIAS.map((c) => (
            <Pastilla key={c} activa={datos.carroceria === c} onClick={() => alternar("carroceria", c)}>
              {c}
            </Pastilla>
          ))}
        </Pregunta>

        <div className="grid grid-cols-2 gap-4">
          <Pregunta titulo="¿Entregás un auto?">
            <Pastilla activa={datos.entrega === true} onClick={() => alternar("entrega", true)}>Sí</Pastilla>
            <Pastilla activa={datos.entrega === false} onClick={() => alternar("entrega", false)}>No</Pastilla>
          </Pregunta>
          <Pregunta titulo="¿Financiás?">
            <Pastilla activa={datos.financia === true} onClick={() => alternar("financia", true)}>Sí</Pastilla>
            <Pastilla activa={datos.financia === false} onClick={() => alternar("financia", false)}>No</Pastilla>
          </Pregunta>
        </div>

        <div>
          <Label htmlFor={`${id}-detalle`} className="mb-1.5">
            Versión o detalle
          </Label>
          <Input
            id={`${id}-detalle`}
            maxLength={200}
            autoComplete="off"
            placeholder="Ej: Highline, motor 2.0, techo"
            value={datos.detalle}
            onChange={(e) => set("detalle", e.target.value)}
            className="h-11 bg-background text-base"
          />
        </div>
      </div>

      <div
        className={
          enHoja
            ? "border-t border-border bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-5"
            : "mt-6"
        }
      >
        {valido ? (
          <a
            ref={enviarLink}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            data-track-detalle="aviso_sin_stock"
            data-track-slug={autoSlug}
            onClick={alEnviar}
            className={CLASE_ENVIAR}
          >
            <WhatsappIcon className="h-5 w-5" />
            Enviar por WhatsApp
          </a>
        ) : (
          <button type="submit" aria-disabled="true" className={`${CLASE_ENVIAR} opacity-50`}>
            <WhatsappIcon className="h-5 w-5" />
            Enviar por WhatsApp
          </button>
        )}
      </div>
    </form>
  );
}

const CLASE_ENVIAR =
  "flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 text-base font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto sm:px-10";

/** Bloque "¿No encontraste el vehículo que buscás?" del pie de fichas y de /autos. */
export function BusquedaAMedida({
  sobreGris = false,
  className,
  ...props
}: PropsBusqueda & {
  /** Sobre un fondo gris (catálogo) la tarjeta va blanca para despegarse. */
  sobreGris?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <section
      className={`relative rounded-2xl p-6 sm:p-8 ${sobreGris ? "border border-zinc-200 bg-white shadow-sm" : "bg-brand-light"} ${className ?? ""}`}
      aria-labelledby={`${id}-titulo`}
    >
      <h2 id={`${id}-titulo`} className="text-center text-2xl font-black tracking-tight md:text-left">
        ¿No encontraste el vehículo que buscás?
      </h2>
      <p className="mt-2 text-center text-muted-foreground md:text-left">
        Te lo buscamos. Contanos qué auto querés y te avisamos cuando entre uno. Sin costo, sin compromiso.
      </p>
      <div className="mt-6">
        <FormBusqueda {...props} />
      </div>
    </section>
  );
}

function SelectAnio({
  etiqueta,
  valor,
  anios,
  onChange,
}: {
  etiqueta: string;
  valor: number | null;
  anios: number[];
  onChange: (v: number | null) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      {etiqueta}
      <select
        value={valor ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="h-11 w-full rounded-lg border border-input bg-background px-2.5 text-base text-foreground md:text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="">Cualquiera</option>
        {anios.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
    </label>
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
      className={`h-10 rounded-full border px-4 text-sm font-semibold transition-colors ${
        activa ? "border-brand bg-brand text-white" : "border-border bg-background text-foreground hover:border-brand"
      }`}
    >
      {children}
    </button>
  );
}
