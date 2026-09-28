"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { formatMiles, parseMiles } from "@/lib/format";
import {
  camposOcultos,
  ORDEN_DEFECTO,
  PRECIO_PRESETS,
  toggleEnArray,
  urlCatalogo,
  type Filtros,
} from "@/lib/filtros";
import { modelosParaMarcas, type FacetMarca } from "@/lib/facets";
import { BuscadorCatalogo } from "@/components/catalogo/buscador-catalogo";
import {
  FormFiltro,
  OpcionBoton,
  OpcionLink,
  Seccion,
  SelectNativo,
} from "@/components/catalogo/filtro-controles";

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

const numeroDe = (datos: FormData, campo: string): number | undefined => {
  const v = datos.get(campo);
  return typeof v === "string" ? parseMiles(v) : undefined;
};

/**
 * Filtros del catálogo (sidebar de la compu y panel del celu). Cada opción es
 * un link o un form GET armado en el render (filtro-controles.tsx): filtra
 * aunque el JS no corra o falle. Con JS, en la compu navega sin recargar; en
 * el celu (onCambiar) junta los cambios en un borrador que se aplica con
 * "Ver resultados".
 */
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
    router.push(urlCatalogo(nuevo));
  }

  /** Link de una opción: en la compu navega solo; en el celu, al borrador. */
  const opcion = (nuevo: Filtros) => ({
    href: urlCatalogo(nuevo),
    onElegir: onCambiar ? () => onCambiar(nuevo) : undefined,
  });

  // Al filtrar por precio, el que busca por plata quiere ver los autos en
  // orden de precio: si el orden sigue en el de defecto, pasa a menor precio.
  const conPrecio = (precioMin?: number, precioMax?: number): Filtros => ({
    ...filtros,
    precioMin,
    precioMax,
    orden:
      (precioMin || precioMax) && filtros.orden === ORDEN_DEFECTO ? "precio_asc" : filtros.orden,
  });

  const presetActivo = PRECIO_PRESETS.find(
    (p) => p.min === filtros.precioMin && p.max === filtros.precioMax
  );

  const modelosDisponibles = modelosParaMarcas(marcas, filtros.marca);

  return (
    // El buscador queda fijo arriba; solo la lista de filtros scrollea debajo.
    <div className="flex min-h-0 flex-1 flex-col text-sm">
      {!onCambiar && (
        <div className="shrink-0 pb-4">
          <BuscadorCatalogo filtros={filtros} id="filtro-busqueda" />
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden border-t border-border pr-1">
        <Seccion
          titulo="Precio"
          activos={(filtros.precioMin || filtros.precioMax ? 1 : 0) + (filtros.baja ? 1 : 0)}
        >
          <OpcionLink
            checked={Boolean(filtros.baja)}
            {...opcion({ ...filtros, baja: filtros.baja ? undefined : true })}
          >
            Bajaron de precio
          </OpcionLink>
          <div className="mt-1 flex flex-col gap-1">
            {PRECIO_PRESETS.map((preset) => {
              const activo = presetActivo === preset;
              return (
                <OpcionBoton
                  key={preset.label}
                  activo={activo}
                  {...opcion(activo ? conPrecio(undefined, undefined) : conPrecio(preset.min, preset.max))}
                >
                  {preset.label}
                </OpcionBoton>
              );
            })}
          </div>
          <p className="mb-1.5 mt-4 text-xs text-muted-foreground">O elegí tu rango</p>
          {/* key: si el rango cambia desde afuera (chip, preset), los campos se rearman. */}
          <FormFiltro
            key={`${filtros.precioMin ?? ""}-${filtros.precioMax ?? ""}`}
            ocultos={[
              ...camposOcultos(filtros, ["precio_min", "precio_max", "orden"]),
              ...(filtros.orden === ORDEN_DEFECTO
                ? ([["orden", "precio_asc"]] as [string, string][])
                : ([["orden", filtros.orden]] as [string, string][])),
            ]}
            botonSiempre
            onAplicar={(datos) => ir(conPrecio(numeroDe(datos, "precio_min"), numeroDe(datos, "precio_max")))}
          >
            <div className="grid grid-cols-2 gap-2">
              <Input
                name="precio_min"
                inputMode="numeric"
                placeholder="Mínimo"
                aria-label="Precio mínimo"
                className="h-9"
                defaultValue={!presetActivo && filtros.precioMin ? formatMiles(filtros.precioMin) : ""}
                onChange={(e) => (e.currentTarget.value = formatMiles(e.currentTarget.value))}
              />
              <Input
                name="precio_max"
                inputMode="numeric"
                placeholder="Máximo"
                aria-label="Precio máximo"
                className="h-9"
                defaultValue={!presetActivo && filtros.precioMax ? formatMiles(filtros.precioMax) : ""}
                onChange={(e) => (e.currentTarget.value = formatMiles(e.currentTarget.value))}
              />
            </div>
          </FormFiltro>
        </Seccion>

        {hayCarroceria && (
          <Seccion titulo="Carrocería" activos={filtros.carroceria.length}>
            <div className="flex flex-col gap-1">
              {CARROCERIAS.map((c) => (
                <OpcionLink
                  key={c.value}
                  checked={filtros.carroceria.includes(c.value)}
                  {...opcion({ ...filtros, carroceria: toggleEnArray(filtros.carroceria, c.value) })}
                >
                  {c.label}
                </OpcionLink>
              ))}
            </div>
          </Seccion>
        )}

        {marcas.length > 0 && (
          <Seccion titulo="Marca" activos={filtros.marca.length}>
            <div className="flex flex-col gap-1">
              {marcas.map((m) => (
                <OpcionLink
                  key={m.marca}
                  checked={filtros.marca.includes(m.marca)}
                  {...opcion({ ...filtros, marca: toggleEnArray(filtros.marca, m.marca) })}
                >
                  {m.marca} ({m.cantidad})
                </OpcionLink>
              ))}
            </div>
          </Seccion>
        )}

        {filtros.marca.length > 0 && modelosDisponibles.length > 0 && (
          <Seccion titulo="Modelo" activos={filtros.modelo.length}>
            <div className="flex flex-col gap-1">
              {modelosDisponibles.map((m) => (
                <OpcionLink
                  key={m.modelo}
                  checked={filtros.modelo.includes(m.modelo)}
                  {...opcion({ ...filtros, modelo: toggleEnArray(filtros.modelo, m.modelo) })}
                >
                  {m.modelo} ({m.cantidad})
                </OpcionLink>
              ))}
            </div>
          </Seccion>
        )}

        {anios.length > 0 && (
          <Seccion titulo="Año" activos={filtros.anioMin || filtros.anioMax ? 1 : 0}>
            <FormFiltro
              key={`${filtros.anioMin ?? ""}-${filtros.anioMax ?? ""}`}
              ocultos={camposOcultos(filtros, ["anio_min", "anio_max", "anio"])}
              onAplicar={(datos) =>
                ir({
                  ...filtros,
                  anioMin: Number(datos.get("anio_min")) || undefined,
                  anioMax: Number(datos.get("anio_max")) || undefined,
                })
              }
            >
              <div className="grid grid-cols-2 gap-2">
                <SelectNativo
                  name="anio_min"
                  aria-label="Año desde"
                  defaultValue={filtros.anioMin ? String(filtros.anioMin) : ""}
                  onChange={(e) => e.currentTarget.form?.requestSubmit()}
                >
                  <option value="">Desde</option>
                  {anios.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </SelectNativo>
                <SelectNativo
                  name="anio_max"
                  aria-label="Año hasta"
                  defaultValue={filtros.anioMax ? String(filtros.anioMax) : ""}
                  onChange={(e) => e.currentTarget.form?.requestSubmit()}
                >
                  <option value="">Hasta</option>
                  {anios.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </SelectNativo>
              </div>
            </FormFiltro>
          </Seccion>
        )}

        <Seccion titulo="Kilómetros" activos={filtros.kmMax ? 1 : 0}>
          <FormFiltro
            key={filtros.kmMax ?? ""}
            ocultos={camposOcultos(filtros, ["km_max"])}
            onAplicar={(datos) => ir({ ...filtros, kmMax: numeroDe(datos, "km_max") })}
          >
            <SelectNativo
              name="km_max"
              aria-label="Kilómetros"
              defaultValue={filtros.kmMax ? String(filtros.kmMax) : ""}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
            >
              <option value="">Cualquiera</option>
              {KM_OPCIONES.map((km) => (
                <option key={km} value={km}>
                  Hasta {formatMiles(km)} km
                </option>
              ))}
            </SelectNativo>
          </FormFiltro>
        </Seccion>

        <Seccion titulo="Combustible" activos={filtros.combustible.length}>
          <div className="flex flex-col gap-1">
            {COMBUSTIBLES.map((c) => (
              <OpcionLink
                key={c}
                checked={filtros.combustible.includes(c)}
                {...opcion({ ...filtros, combustible: toggleEnArray(filtros.combustible, c) })}
              >
                {c}
              </OpcionLink>
            ))}
          </div>
        </Seccion>

        {hayTransmision && (
          <Seccion titulo="Transmisión" activos={filtros.transmision.length}>
            <div className="flex flex-col gap-1">
              {TRANSMISIONES.map((t) => (
                <OpcionLink
                  key={t.value}
                  checked={filtros.transmision.includes(t.value)}
                  {...opcion({ ...filtros, transmision: toggleEnArray(filtros.transmision, t.value) })}
                >
                  {t.label}
                </OpcionLink>
              ))}
            </div>
          </Seccion>
        )}
      </div>
    </div>
  );
}
