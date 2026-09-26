export type Combustible = "Nafta" | "Diesel" | "GNC" | "Híbrido";
export type Transmision = "manual" | "automatica" | null;
export type Carroceria =
  | "auto"
  | "camioneta"
  | "suv"
  | "utilitario"
  | "moto"
  | null;
export type Condicion = "usado" | "0km";
export type Estado = "activo" | "senado";
export type Moneda = "ARS" | "USD";

export interface DescripcionItem {
  grupo: string;
  texto: string;
}

export interface Foto {
  url: string;
  orden: number;
  principal: boolean;
}

export interface AutoCatalogo {
  id: string;
  slug: string;
  marca: string;
  modelo: string;
  version: string | null;
  anio: number;
  km: number | null;
  color: string | null;
  color_hex: string | null;
  combustible: Combustible | null;
  transmision: Transmision;
  carroceria: Carroceria;
  condicion: Condicion;
  moneda: Moneda;
  precio: number;
  precio_ars: number;
  /**
   * Baja de precio reciente (la calcula la vista): null salvo que el último
   * cambio haya sido una baja de 1–30 % hace menos de 30 días. Nunca subas.
   */
  precio_anterior: number | null;
  /** precio_anterior convertido a ARS, como precio_ars. */
  precio_anterior_ars: number | null;
  precio_bajo_en: string | null;
  estado: Estado;
  destacado_web: boolean;
  descripcion_items: DescripcionItem[] | null;
  descripcion_extra: string | null;
  /** Texto de publicación armado en el legajo de gestión (ver lib/descripcion.ts). */
  publicacion_texto: string | null;
  video_url: string | null;
  fecha_ingreso: string;
  actualizado_en: string;
  foto_principal: string | null;
  fotos: Foto[] | null;
  disponibilidad: "salon" | "cita";
}
