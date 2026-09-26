"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMiles, parseMiles } from "@/lib/format";
import { cn } from "@/lib/utils";
import { filtrosAParams, ORDEN_DEFECTO, PRECIO_PRESETS, toggleEnArray, type Filtros } from "@/lib/filtros";
import { modelosParaMarcas, type FacetMarca } from "@/lib/facets";
import { track } from "@/lib/tracking";

const COMBUSTIBLES = ["Nafta", "Diesel", "GNC", "Híbrido"];
const TRANSMISIONES: { value: string; label: string }[] = [
  { value: "manual", label: "Manual" },
  { value: "automatica", label: "Automática" },
];
const CARROCERIAS: { value: string; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "camioneta", label: "Camioneta" },
  { value: "suv", label: "SUV" },
  { value: "utilitario", label: "Utilitario" },
  { value: "moto", label: "Moto" },
];
const KM_OPCIONES = [50000, 100000, 150000, 200000];
const TODOS = "__todos__";

export function BusquedaInput({
  id = "filtro-busqueda",
  valorInicial,
  onBuscar,
  placeholder = "Marca, modelo o versión",
  sinLabel = false,
  inputClassName = "h-9",
}: {
  id?: string;
  valorInicial: string;
  onBuscar: (valor: string) => void;
  placeholder?: string;
  /** Sin el "Buscar" arriba (queda solo para lectores de pantalla). */
  sinLabel?: boolean;
  inputClassName?: string;
}) {
  const [busqueda, setBusqueda] = useState(valorInicial);

  useEffect(() => {
    if (busqueda === valorInicial) return;
    const timeout = setTimeout(() => {
      onBuscar(busqueda);
      const q = busqueda.trim();
      if (q.length >= 2) track("busqueda", { q });
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

  return (
    <div>
      <Label htmlFor={id} className={sinLabel ? "sr-only" : "mb-1.5 text-xs text-muted-foreground"}>
        Buscar
      </Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          placeholder={placeholder}
          className={cn("pl-8", inputClassName)}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>
    </div>
  );
}

/** Opción con tilde: toda la fila es tocable y alta para el dedo. */
function OpcionTilde({
  checked,
  onToggle,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:text-brand">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="size-[18px] shrink-0 cursor-pointer accent-brand"
      />
      <span>{children}</span>
    </label>
  );
}

/**
 * Categoría de filtro desplegable (tipo acordeón). Arranca abierta solo si
 * tiene algo elegido, para que el panel se vea corto y ordenado.
 */
function Seccion({
  titulo,
  activos = 0,
  children,
}: {
  titulo: string;
  activos?: number;
  children: React.ReactNode;
}) {
  const [abierta, setAbierta] = useState(activos > 0);

  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => setAbierta((a) => !a)}
        aria-expanded={abierta}
        className="flex w-full items-center justify-between gap-2 py-3 text-left transition-colors hover:text-brand"
      >
        <span className="flex items-center gap-2 font-semibold">
          {titulo}
          {activos > 0 && (
            <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
              {activos}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-brand transition-transform",
            abierta && "rotate-180"
          )}
        />
      </button>
      {abierta && <div className="pb-4">{children}</div>}
    </div>
  );
}

export function FiltrosPanel({
  filtros,
  marcas,
  anios,
  hayTransmision,
  hayCarroceria,
  onCambiar,
}: {
  filtros: Filtros;
  marcas: FacetMarca[];
  anios: number[];
  hayTransmision: boolean;
  hayCarroceria: boolean;
  /**
   * Panel del celu: cada cambio va a un borrador local y se aplica todo junto
   * con "Ver resultados". Sin esto (compu), cada cambio navega al instante.
   */
  onCambiar?: (nuevo: Filtros) => void;
}) {
  const router = useRouter();

  function ir(nuevo: Filtros) {
    if (onCambiar) {
      onCambiar(nuevo);
      return;
    }
    const params = filtrosAParams({ ...nuevo, page: 1 });
    router.push(`/autos${params.size > 0 ? `?${params.toString()}` : ""}`);
  }

  // Al filtrar por precio, el que busca por plata quiere ver los autos en
  // orden de precio: si el orden sigue en el de defecto, pasa a menor precio.
  function irConPrecio(precioMin?: number, precioMax?: number) {
    const orden =
      (precioMin || precioMax) && filtros.orden === ORDEN_DEFECTO ? "precio_asc" : filtros.orden;
    ir({ ...filtros, precioMin, precioMax, orden });
  }

  const presetActivo = PRECIO_PRESETS.find(
    (p) => p.min === filtros.precioMin && p.max === filtros.precioMax
  );

  const modelosDisponibles = modelosParaMarcas(marcas, filtros.marca);
  const anioMinValue = filtros.anioMin ? String(filtros.anioMin) : TODOS;
  const anioMaxValue = filtros.anioMax ? String(filtros.anioMax) : TODOS;

  const itemsAnioDesde: Record<string, string> = { [TODOS]: "Desde" };
  const itemsAnioHasta: Record<string, string> = { [TODOS]: "Hasta" };
  for (const a of anios) {
    itemsAnioDesde[String(a)] = String(a);
    itemsAnioHasta[String(a)] = String(a);
  }

  const itemsKm: Record<string, string> = { [TODOS]: "Cualquiera" };
  for (const km of KM_OPCIONES) itemsKm[String(km)] = `Hasta ${formatMiles(km)} km`;

  return (
    // El buscador queda fijo arriba; solo la lista de filtros scrollea debajo.
    <div className="flex min-h-0 flex-1 flex-col text-sm">
      {!onCambiar && (
        <div className="shrink-0 pb-4">
          <BusquedaInput
            key={filtros.q ?? ""}
            valorInicial={filtros.q ?? ""}
            onBuscar={(valor) => ir({ ...filtros, q: valor || undefined })}
          />
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden border-t border-border pr-1">

      <Seccion
        titulo="Precio"
        activos={(filtros.precioMin || filtros.precioMax ? 1 : 0) + (filtros.baja ? 1 : 0)}
      >
        <OpcionTilde
          checked={Boolean(filtros.baja)}
          onToggle={() => ir({ ...filtros, baja: filtros.baja ? undefined : true })}
        >
          Bajaron de precio
        </OpcionTilde>
        <div className="mt-1 flex flex-col gap-1">
          {PRECIO_PRESETS.map((preset) => {
            const activo = presetActivo === preset;
            return (
              <button
                key={preset.label}
                type="button"
                aria-pressed={activo}
                onClick={() =>
                  activo ? irConPrecio(undefined, undefined) : irConPrecio(preset.min, preset.max)
                }
                className={cn(
                  "rounded-lg px-3 py-2 text-left transition-colors",
                  activo
                    ? "bg-brand font-semibold text-white"
                    : "hover:text-brand"
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <p className="mb-1.5 mt-4 text-xs text-muted-foreground">O elegí tu rango</p>
        <div className="grid grid-cols-2 gap-2">
          <Input
            inputMode="numeric"
            placeholder="Mínimo"
            className="h-9"
            value={!presetActivo && filtros.precioMin ? formatMiles(filtros.precioMin) : ""}
            onChange={(e) => irConPrecio(parseMiles(e.target.value), filtros.precioMax)}
          />
          <Input
            inputMode="numeric"
            placeholder="Máximo"
            className="h-9"
            value={!presetActivo && filtros.precioMax ? formatMiles(filtros.precioMax) : ""}
            onChange={(e) => irConPrecio(filtros.precioMin, parseMiles(e.target.value))}
          />
        </div>
      </Seccion>

      {hayCarroceria && (
        <Seccion titulo="Carrocería" activos={filtros.carroceria.length}>
          <div className="flex flex-col gap-1">
            {CARROCERIAS.map((c) => (
              <OpcionTilde
                key={c.value}
                checked={filtros.carroceria.includes(c.value)}
                onToggle={() =>
                  ir({
                    ...filtros,
                    carroceria: toggleEnArray(filtros.carroceria, c.value),
                  })
                }
              >
                {c.label}
              </OpcionTilde>
            ))}
          </div>
        </Seccion>
      )}

      {marcas.length > 0 && (
        <Seccion titulo="Marca" activos={filtros.marca.length}>
          <div className="flex flex-col gap-1">
            {marcas.map((m) => (
              <OpcionTilde
                key={m.marca}
                checked={filtros.marca.includes(m.marca)}
                onToggle={() =>
                  ir({ ...filtros, marca: toggleEnArray(filtros.marca, m.marca) })
                }
              >
                {m.marca} ({m.cantidad})
              </OpcionTilde>
            ))}
          </div>
        </Seccion>
      )}

      {filtros.marca.length > 0 && modelosDisponibles.length > 0 && (
        <Seccion titulo="Modelo" activos={filtros.modelo.length}>
          <div className="flex flex-col gap-1">
            {modelosDisponibles.map((m) => (
              <OpcionTilde
                key={m.modelo}
                checked={filtros.modelo.includes(m.modelo)}
                onToggle={() =>
                  ir({ ...filtros, modelo: toggleEnArray(filtros.modelo, m.modelo) })
                }
              >
                {m.modelo} ({m.cantidad})
              </OpcionTilde>
            ))}
          </div>
        </Seccion>
      )}

      {anios.length > 0 && (
        <Seccion titulo="Año" activos={(filtros.anioMin || filtros.anioMax ? 1 : 0)}>
          <div className="grid grid-cols-2 gap-2">
            <Select
              items={itemsAnioDesde}
              value={anioMinValue}
              onValueChange={(v) =>
                ir({ ...filtros, anioMin: v && v !== TODOS ? Number(v) : undefined })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Desde" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Desde</SelectItem>
                {anios.map((a) => (
                  <SelectItem key={a} value={String(a)}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              items={itemsAnioHasta}
              value={anioMaxValue}
              onValueChange={(v) =>
                ir({ ...filtros, anioMax: v && v !== TODOS ? Number(v) : undefined })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Hasta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Hasta</SelectItem>
                {anios.map((a) => (
                  <SelectItem key={a} value={String(a)}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Seccion>
      )}

      <Seccion titulo="Kilómetros" activos={(filtros.kmMax ? 1 : 0)}>
        <Select
          items={itemsKm}
          value={filtros.kmMax ? String(filtros.kmMax) : TODOS}
          onValueChange={(v) =>
            ir({ ...filtros, kmMax: v && v !== TODOS ? Number(v) : undefined })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Cualquiera" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Cualquiera</SelectItem>
            {KM_OPCIONES.map((km) => (
              <SelectItem key={km} value={String(km)}>
                Hasta {formatMiles(km)} km
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Seccion>

      <Seccion titulo="Combustible" activos={filtros.combustible.length}>
        <div className="flex flex-col gap-1">
          {COMBUSTIBLES.map((c) => (
            <OpcionTilde
              key={c}
              checked={filtros.combustible.includes(c)}
              onToggle={() =>
                ir({ ...filtros, combustible: toggleEnArray(filtros.combustible, c) })
              }
            >
              {c}
            </OpcionTilde>
          ))}
        </div>
      </Seccion>

      {hayTransmision && (
        <Seccion titulo="Transmisión" activos={filtros.transmision.length}>
          <div className="flex flex-col gap-1">
            {TRANSMISIONES.map((t) => (
              <OpcionTilde
                key={t.value}
                checked={filtros.transmision.includes(t.value)}
                onToggle={() =>
                  ir({
                    ...filtros,
                    transmision: toggleEnArray(filtros.transmision, t.value),
                  })
                }
              >
                {t.label}
              </OpcionTilde>
            ))}
          </div>
        </Seccion>
      )}

      </div>
    </div>
  );
}
