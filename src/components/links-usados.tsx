import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { getResumenStock } from "@/lib/autos";
import {
  MINIMO_INDEXABLE,
  etiquetaLink,
  hrefPagina,
  paginasConStock,
  type PaginaConStock,
} from "@/lib/usados";

/** Sólo las páginas indexables (2 autos o más): no se enlaza a una noindex. */
async function indexables(): Promise<PaginaConStock[]> {
  try {
    return paginasConStock(await getResumenStock()).filter(
      (p) => p.cantidad >= MINIMO_INDEXABLE,
    );
  } catch {
    return [];
  }
}

/** Footer: "Buscá por" marcas principales, tipos y rangos de precio (tanda 42). */
export async function BuscaPorFooter() {
  const paginas = await indexables();
  if (paginas.length === 0) return null;
  const grupos = [
    {
      titulo: "Marcas",
      items: paginas.filter((p) => p.pagina.tipo === "marca").slice(0, 8),
    },
    {
      titulo: "Tipos",
      items: paginas.filter((p) =>
        ["carroceria", "automaticos", "combustible"].includes(p.pagina.tipo),
      ),
    },
    {
      titulo: "Precio",
      items: paginas.filter((p) => p.pagina.tipo === "precio"),
    },
  ].filter((g) => g.items.length > 0);
  return (
    // Plegado con <details> nativo (anda sin JS): cerrado, una línea discreta.
    // Los links quedan en el HTML igual (SEO: los únicos links a /usados/*).
    <details className="group mx-auto max-w-6xl border-t border-white/10 px-4 py-4">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm text-white/50 hover:text-white/80 [&::-webkit-details-marker]:hidden">
        Buscá por marca, tipo o precio
        <ChevronDown
          className="h-4 w-4 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="mt-4 grid gap-4 pb-2 sm:grid-cols-3">
        {grupos.map((g) => (
          <nav
            key={g.titulo}
            aria-label={`Buscá por ${g.titulo.toLowerCase()}`}
          >
            <p className="text-xs text-white/40">{g.titulo}</p>
            <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-white/70">
              {g.items.map(({ pagina }) => (
                <li key={pagina.slug}>
                  <Link
                    href={hrefPagina(pagina)}
                    prefetch={false}
                    className="hover:text-brand"
                  >
                    {etiquetaLink(pagina)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </details>
  );
}
