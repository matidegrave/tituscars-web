import { formatMiles } from "@/lib/format";

// Formulario "Pedí tu cotización" (/consigna): datos, etiquetas y el mensaje de
// WhatsApp. Sin "use client": lo usan el formulario y la ruta del servidor que
// arma el link cuando el navegador no corre JS.

export type Modalidad = "virtual" | "fisica" | "no_se";

export const LABEL_MODALIDAD: Record<Modalidad, string> = {
  virtual: "Virtual",
  fisica: "Física",
  no_se: "No sé todavía",
};

export interface DatosCotizacion {
  marca: string;
  modelo: string;
  anio: string;
  km: string;
  nombre: string;
  telefono: string;
  modalidad: Modalidad | "";
}

export const COTIZACION_VACIA: DatosCotizacion = {
  marca: "",
  modelo: "",
  anio: "",
  km: "",
  nombre: "",
  telefono: "",
  modalidad: "",
};

export function esModalidad(valor: unknown): valor is Modalidad {
  return typeof valor === "string" && valor in LABEL_MODALIDAD;
}

/**
 * "Hola! Quiero consignar mi auto: Fiat Cronos 2021, 80.000 km. Modalidad:
 * Virtual. Soy Juan." Los campos vacíos se omiten sin dejar comas colgando.
 * El teléfono no va: es el mismo número desde el que escribe.
 */
export function mensajeConsigna(d: DatosCotizacion): string {
  const auto = [d.marca, d.modelo, d.anio].map((p) => p.trim()).filter(Boolean).join(" ");
  const km = formatMiles(d.km);
  const nombre = d.nombre.trim();
  const descripcion = [auto, km && `${km} km`].filter(Boolean).join(", ");
  return [
    "Hola!",
    descripcion ? `Quiero consignar mi auto: ${descripcion}.` : "Quiero consignar mi auto.",
    d.modalidad && `Modalidad: ${LABEL_MODALIDAD[d.modalidad]}.`,
    nombre && `Soy ${nombre}.`,
  ]
    .filter(Boolean)
    .join(" ");
}
