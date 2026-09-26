/**
 * <script type="application/ld+json"> renderizado en el servidor. El "<" se
 * escapa como \u003c: un "</script>" dentro de algún texto (una descripción,
 * por ejemplo) no puede cerrar el script antes de tiempo.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
