"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { WhatsappIcon } from "@/components/icons/whatsapp-icon";
import { WHATSAPP_CONSIGNAS } from "@/lib/config";
import { linkWhatsapp } from "@/lib/whatsapp";
import { formatMiles, parseMiles } from "@/lib/format";
import { track } from "@/lib/tracking";
import {
  COTIZACION_VACIA as VACIO,
  LABEL_MODALIDAD,
  mensajeConsigna,
  type DatosCotizacion,
  type Modalidad,
} from "@/lib/cotizacion";

const ITEMS_MODALIDAD: Record<string, string> = {
  virtual: LABEL_MODALIDAD.virtual,
  fisica: LABEL_MODALIDAD.fisica,
  no_se: LABEL_MODALIDAD.no_se,
};

/**
 * Formulario "Pedí tu cotización" de /consigna: arma el mensaje y abre el
 * WhatsApp de consignaciones.
 * - Con JS: abre wa.me directo (window.open) y registra lead_form.
 * - Sin JS (o antes de hidratar): es un <form> real que postea a
 *   /consigna/whatsapp, que arma el mismo mensaje y redirige. Los obligatorios
 *   los valida el navegador (required).
 */
export function CotizacionForm({
  storageKey,
  textoBoton = "Enviar por WhatsApp",
}: {
  /** Clave propia de sessionStorage: cada página guarda lo suyo por separado. */
  storageKey: string;
  textoBoton?: string;
}) {
  const [datos, setDatos] = useState<DatosCotizacion>(VACIO);
  const [cargado, setCargado] = useState(false);
  const [enviado, setEnviado] = useState(false);

  // Recupera lo que haya quedado guardado (si el usuario volvió a la página).
  // Va en un efecto (no en el estado inicial) a propósito: leer sessionStorage
  // durante el render rompería la hidratación, porque el servidor siempre
  // arranca vacío y no puede saber qué hay en el navegador de esa visita.
  useEffect(() => {
    try {
      const guardado = sessionStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (guardado) setDatos({ ...VACIO, ...JSON.parse(guardado) });
    } catch {
      // sessionStorage puede fallar (privado, bloqueado): el form arranca vacío.
    }
    setCargado(true);
  }, [storageKey]);

  // Guarda en cada cambio, recién después de haber leído lo anterior (para no
  // pisar un borrador guardado con el estado vacío del primer render).
  useEffect(() => {
    if (!cargado) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(datos));
    } catch {
      // Nada que hacer: el form sigue funcionando, sólo no persiste.
    }
  }, [datos, cargado, storageKey]);

  function set<K extends keyof DatosCotizacion>(campo: K, valor: DatosCotizacion[K]) {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  }

  const valido =
    datos.marca.trim() !== "" &&
    datos.modelo.trim() !== "" &&
    datos.nombre.trim() !== "" &&
    datos.telefono.trim() !== "";

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!valido) return;
    track("lead_form", { categoria: "consignacion" });
    window.open(
      linkWhatsapp(mensajeConsigna(datos), WHATSAPP_CONSIGNAS),
      "_blank",
      "noopener,noreferrer"
    );
    setEnviado(true);
  }

  return (
    <form
      action="/consigna/whatsapp"
      method="post"
      target="_blank"
      onSubmit={enviar}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cot-marca" className="mb-1.5">
            Marca *
          </Label>
          <Input
            id="cot-marca"
            name="marca"
            required
            value={datos.marca}
            onChange={(e) => set("marca", e.target.value)}
            placeholder="Fiat"
          />
        </div>
        <div>
          <Label htmlFor="cot-modelo" className="mb-1.5">
            Modelo *
          </Label>
          <Input
            id="cot-modelo"
            name="modelo"
            required
            value={datos.modelo}
            onChange={(e) => set("modelo", e.target.value)}
            placeholder="Cronos"
          />
        </div>
        <div>
          <Label htmlFor="cot-anio" className="mb-1.5">
            Año
          </Label>
          <Input
            id="cot-anio"
            name="anio"
            inputMode="numeric"
            value={datos.anio}
            onChange={(e) => set("anio", e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="2021"
          />
        </div>
        <div>
          <Label htmlFor="cot-km" className="mb-1.5">
            Kilómetros
          </Label>
          <Input
            id="cot-km"
            name="km"
            inputMode="numeric"
            value={formatMiles(datos.km)}
            onChange={(e) => set("km", String(parseMiles(e.target.value) ?? ""))}
            placeholder="80.000"
          />
        </div>
        <div>
          <Label htmlFor="cot-nombre" className="mb-1.5">
            Tu nombre *
          </Label>
          <Input
            id="cot-nombre"
            name="nombre"
            required
            value={datos.nombre}
            onChange={(e) => set("nombre", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="cot-telefono" className="mb-1.5">
            Tu WhatsApp *
          </Label>
          <Input
            id="cot-telefono"
            name="telefono"
            required
            inputMode="tel"
            value={datos.telefono}
            onChange={(e) => set("telefono", e.target.value)}
            placeholder="351 123 4567"
          />
        </div>

        <div className="col-span-2">
            <Label className="mb-1.5">¿Cómo preferís consignarlo?</Label>
            <Select
              name="modalidad"
              items={{ "": "Elegí una opción", ...ITEMS_MODALIDAD }}
              value={datos.modalidad}
              onValueChange={(v) => set("modalidad", (v ?? "") as Modalidad | "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Elegí una opción" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LABEL_MODALIDAD).map(([valor, label]) => (
                  <SelectItem key={valor} value={valor}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
      </div>

      {/* Deshabilitado sólo con JS: sin JS, el navegador valida los required. */}
      <Button type="submit" size="lg" className="w-full gap-2 sm:w-fit" disabled={cargado && !valido}>
        <WhatsappIcon className="h-4 w-4" />
        {textoBoton}
      </Button>

      {enviado && (
        <p className="text-sm text-muted-foreground">
          Se abrió WhatsApp con tu mensaje. Si no se abrió, revisá que el navegador no lo haya bloqueado.
        </p>
      )}
    </form>
  );
}
