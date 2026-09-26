import Link from "next/link";
import { X } from "lucide-react";
import { filtrosAParams, PRECIO_PRESETS, type Filtros } from "@/lib/filtros";
import { formatMiles } from "@/lib/format";

const LABEL_TRANSMISION: Record<string, string> = {
  manual: "Manual",
  automatica: "Automática",
};

const LABEL_CARROCERIA: Record<string, string> = {
  auto: "Auto",
  camioneta: "Camioneta",
  suv: "SUV",
  utilitario: "Utilitario",
  moto: "Moto",
};

interface Chip {
  key: string;
  label: string;
  filtrosSinEsto: Filtros;
}

function href(f: Filtros): string {
  const params = filtrosAParams({ ...f, page: 1 });
  return `/autos${params.size > 0 ? `?${params.toString()}` : ""}`;
}

export function FiltrosActivos({ filtros }: { filtros: Filtros }) {
  const chips: Chip[] = [];

  // La búsqueda en vivo del celu (?vivo=1) no genera chip hasta confirmarla.
  if (filtros.q && !filtros.vivo) {
    chips.push({
      key: "q",
      label: `"${filtros.q}"`,
      filtrosSinEsto: { ...filtros, q: undefined },
    });
  }

  for (const m of filtros.marca) {
    chips.push({
      key: `marca-${m}`,
      label: m,
      filtrosSinEsto: { ...filtros, marca: filtros.marca.filter((v) => v !== m) },
    });
  }

  for (const m of filtros.modelo) {
    chips.push({
      key: `modelo-${m}`,
      label: m,
      filtrosSinEsto: { ...filtros, modelo: filtros.modelo.filter((v) => v !== m) },
    });
  }

  if (filtros.anioMin || filtros.anioMax) {
    const label =
      filtros.anioMin && filtros.anioMax
        ? filtros.anioMin === filtros.anioMax
          ? String(filtros.anioMin)
          : `${filtros.anioMin}–${filtros.anioMax}`
        : filtros.anioMin
          ? `Desde ${filtros.anioMin}`
          : `Hasta ${filtros.anioMax}`;

    chips.push({
      key: "anio",
      label,
      filtrosSinEsto: { ...filtros, anioMin: undefined, anioMax: undefined },
    });
  }

  if (filtros.precioMin || filtros.precioMax) {
    const preset = PRECIO_PRESETS.find(
      (p) => p.min === filtros.precioMin && p.max === filtros.precioMax
    );
    const label = preset
      ? preset.label
      : filtros.precioMin && filtros.precioMax
        ? `$ ${formatMiles(filtros.precioMin)} - $ ${formatMiles(filtros.precioMax)}`
        : filtros.precioMin
          ? `Desde $ ${formatMiles(filtros.precioMin)}`
          : `Hasta $ ${formatMiles(filtros.precioMax!)}`;

    chips.push({
      key: "precio",
      label,
      filtrosSinEsto: { ...filtros, precioMin: undefined, precioMax: undefined },
    });
  }

  if (filtros.kmMax) {
    chips.push({
      key: "km",
      label: `Hasta ${formatMiles(filtros.kmMax)} km`,
      filtrosSinEsto: { ...filtros, kmMax: undefined },
    });
  }

  for (const c of filtros.combustible) {
    chips.push({
      key: `combustible-${c}`,
      label: c,
      filtrosSinEsto: {
        ...filtros,
        combustible: filtros.combustible.filter((v) => v !== c),
      },
    });
  }

  for (const t of filtros.transmision) {
    chips.push({
      key: `transmision-${t}`,
      label: LABEL_TRANSMISION[t] ?? t,
      filtrosSinEsto: {
        ...filtros,
        transmision: filtros.transmision.filter((v) => v !== t),
      },
    });
  }

  for (const c of filtros.carroceria) {
    chips.push({
      key: `carroceria-${c}`,
      label: LABEL_CARROCERIA[c] ?? c,
      filtrosSinEsto: {
        ...filtros,
        carroceria: filtros.carroceria.filter((v) => v !== c),
      },
    });
  }

  if (filtros.condicion) {
    chips.push({
      key: "condicion",
      label: filtros.condicion === "0km" ? "0 KM" : "Usados",
      filtrosSinEsto: { ...filtros, condicion: undefined },
    });
  }

  if (filtros.baja) {
    chips.push({
      key: "baja",
      label: "Bajaron de precio",
      filtrosSinEsto: { ...filtros, baja: undefined },
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={href(chip.filtrosSinEsto)}
          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/15"
        >
          {chip.label}
          <X className="h-3.5 w-3.5" />
        </Link>
      ))}
      <Link
        href="/autos"
        className="text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        Limpiar todo
      </Link>
    </div>
  );
}
