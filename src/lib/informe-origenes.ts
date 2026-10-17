// Orígenes del panel de revisión del ERP que pueden embeber /informe/preview y
// mandarle mensajes: la MISMA lista para frame-ancestors (next.config.ts) y
// para event.origin (lib/informe-preview.ts). Sin imports: lo lee next.config.
// Contrato cerrado en docs/informe-tanda-pagina-publica.md del repo de gestión.
//
// Los deploys de preview de Vercel NO entran: CSP sólo acepta comodines a la
// izquierda y *.vercel.app habilitaría a cualquier proyecto de Vercel.
// http://localhost:3000 (el ERP local) sólo en `next dev`; en producción, nunca.
export const ORIGENES_ERP_PRODUCCION = ["https://softwaretitus.vercel.app", "https://tituscars.vercel.app"];
export const ORIGEN_ERP_LOCAL = "http://localhost:3000";

export function origenesErp(desarrollo: boolean): string[] {
  return desarrollo ? [...ORIGENES_ERP_PRODUCCION, ORIGEN_ERP_LOCAL] : ORIGENES_ERP_PRODUCCION;
}
