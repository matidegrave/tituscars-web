import Link from "next/link";
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
    <div className="mx-auto max-w-6xl border-t border-white/10 px-4 py-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-white/50">
        Buscá por
      </p>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
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
    </div>
  );
}
