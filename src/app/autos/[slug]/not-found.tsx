import Link from "next/link";
import { Button } from "@/components/ui/button";

// Respaldo: normalmente un slug inexistente lo resuelve src/proxy.ts antes de
// llegar acá (reescribe a /ficha-no-disponible/[slug], con autos parecidos).
// Esto cubre el caso raro de un auto que se despublicó hace menos de un
// minuto. Sin headers() ni consultas: Next lo incluye en el árbol de cada
// ficha, y si leyera el request las haría dinámicas.
export default function AutoNoEncontrado() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Este auto ya no está disponible</h1>
      <p className="mt-3 text-muted-foreground">
        Seguramente ya encontró dueño. Mirá los que tenemos ahora.
      </p>
      <Button size="lg" className="mt-6" render={<Link href="/autos" />} nativeButton={false}>
        Ver catálogo
      </Button>
    </div>
  );
}
