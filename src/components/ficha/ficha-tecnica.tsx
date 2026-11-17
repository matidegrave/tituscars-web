import type { ReactNode } from "react";
import { BadgeCheck, Calendar, Gauge, Fuel, Cog, Car, Bike } from "lucide-react";
import { esMoto, formatCc, formatKm } from "@/lib/format";
import type { AutoCatalogo } from "@/lib/types";

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function FichaTecnica({ auto }: { auto: AutoCatalogo }) {
  const filas: { icono: ReactNode; etiqueta: string; valor: ReactNode }[] = [
    { icono: <Calendar className="h-5 w-5" />, etiqueta: "Año", valor: auto.anio },
  ];

  const km = formatKm(auto.km);
  if (km) {
    filas.push({ icono: <Gauge className="h-5 w-5" />, etiqueta: "Kilómetros", valor: km });
  }

  // Moto (WEB-MOTOS1): año, km, cilindrada y condición.
  const moto = esMoto(auto);
  const cc = formatCc(auto.cilindrada);
  if (moto && cc) {
    filas.push({ icono: <Bike className="h-5 w-5" />, etiqueta: "Cilindrada", valor: cc });
  }

  if (auto.combustible && !moto) {
    filas.push({
      icono: <Fuel className="h-5 w-5" />,
      etiqueta: "Combustible",
      valor: auto.combustible,
    });
  }

  if (auto.transmision && !moto) {
    filas.push({
      icono: <Cog className="h-5 w-5" />,
      etiqueta: "Transmisión",
      valor: auto.transmision === "manual" ? "Manual" : "Automática",
    });
  }

  if (auto.carroceria && !moto) {
    filas.push({
      icono: <Car className="h-5 w-5" />,
      etiqueta: "Carrocería",
      valor: capitalizar(auto.carroceria),
    });
  }

  filas.push({
    icono: <BadgeCheck className="h-5 w-5" />,
    etiqueta: "Condición",
    valor: auto.condicion === "0km" ? "0 KM" : "Usado",
  });

  return (
    <div>
      <h2 className="text-lg font-bold">Ficha técnica</h2>
      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {filas.map((fila) => (
          <div key={fila.etiqueta} className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              {fila.icono}
            </span>
            <div>
              <dt className="text-xs text-muted-foreground">{fila.etiqueta}</dt>
              <dd className="text-sm font-medium">{fila.valor}</dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}
