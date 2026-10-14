import { usePathname } from "next/navigation";

/**
 * usePathname, pero con la ruta que ve el cliente: /catalogo/<clave> es el
 * rewrite interno de /autos?<filtros> (src/proxy.ts) y para la interfaz es
 * /autos. Next genera esa página con su ruta interna y en el navegador la URL
 * es /autos: si los componentes usaran usePathname tal cual, el HTML del
 * servidor y el del navegador no coincidirían (error de hidratación).
 */
export function useRutaVisible(): string {
  const pathname = usePathname();
  return pathname.startsWith("/catalogo/") ? "/autos" : pathname;
}
