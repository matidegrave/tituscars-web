"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { copiarTexto } from "@/lib/para-cliente";
import { cn } from "@/lib/utils";

/** Botón que copia un texto y muestra "Copiado" en el mismo lugar (2 s). */
export function BotonCopiar({
  texto,
  etiqueta = "Copiar para cliente",
  className,
}: {
  /** Se arma recién al tocar (el vendedor o el encabezado pueden cambiar). */
  texto: () => string;
  etiqueta?: string;
  className?: string;
}) {
  const [estado, setEstado] = useState<"" | "ok" | "error">("");
  useEffect(() => {
    if (!estado) return;
    const t = setTimeout(() => setEstado(""), 2000);
    return () => clearTimeout(t);
  }, [estado]);
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setEstado((await copiarTexto(texto())) ? "ok" : "error");
      }}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-3 text-sm font-medium hover:bg-muted",
        className,
      )}
    >
      {estado === "ok" ? (
        <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4" aria-hidden="true" />
      )}
      <span aria-live="polite">
        {estado === "ok"
          ? "Copiado"
          : estado === "error"
            ? "No se pudo copiar"
            : etiqueta}
      </span>
    </button>
  );
}
