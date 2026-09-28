import Link from "next/link";
import { getResumenStock } from "@/lib/autos";
import {
  MINIMO_INDEXABLE,
  etiquetaLink,
  hrefPagina,
  paginasConStock,
  type PaginaConStock,
} from "@/lib/usados";
import { cn } from "@/lib/utils";

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

const PARA_LA_HOME = [
  "camionetas",
  "suv",
  "automaticos",
  "hasta-15-millones",
  "hasta-20-millones",
];

/** Home: 6-8 links chicos debajo de los accesos rápidos (3 marcas + tipos + precio). */
export async function LinksUsadosHome({ className }: { className?: string }) {
  const paginas = await indexables();
  const marcas = paginas.filter((p) => p.pagina.tipo === "marca").slice(0, 3);
  const otras = PARA_LA_HOME.map((s) =>
    paginas.find((p) => p.pagina.slug === s),
  ).filter((p): p is PaginaConStock => !!p);
  const items = [...marcas, ...otras].slice(0, 8);
  if (items.length === 0) return null;
  return (
    <nav aria-label="Buscá por" className={cn("text-sm", className)}>
      <ul className="flex flex-wrap gap-x-3 gap-y-1.5 text-muted-foreground">
        {items.map(({ pagina }) => (
          <li key={pagina.slug}>
            <Link
              href={hrefPagina(pagina)}
              prefetch={false}
              className="underline-offset-2 hover:text-foreground hover:underline"
            >
              {pagina.tipo === "marca"
                ? `${pagina.marca} usados`
                : etiquetaLink(pagina)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
