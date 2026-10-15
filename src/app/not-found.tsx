import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * 404 de toda la web, renderizado en el servidor con header, footer y status
 * 404. Sin headers() ni consultas: Next incluye este componente en el árbol de
 * TODAS las páginas, así que si leyera el request las haría dinámicas a todas.
 * La ficha de un auto que ya no existe tiene su propia página
 * (/ficha-no-disponible/[slug], la reescribe src/proxy.ts).
 */
export default function NoEncontrado() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <h1 className="text-2xl font-bold tracking-tight">No encontramos esta página</h1>
      <p className="mt-3 text-muted-foreground">
        Puede que el link esté mal escrito o que la página ya no exista.
      </p>
      <Button size="lg" className="mt-6" render={<Link href="/autos" />} nativeButton={false}>
        Ver catálogo
      </Button>
    </div>
  );
}
