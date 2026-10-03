"use client";

import { useState, useSyncExternalStore } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { WhatsappIcon } from "@/components/icons/whatsapp-icon";
import { FormBusqueda, type PropsBusqueda } from "@/components/busqueda-a-medida";

const sinSuscripcion = () => () => {};

const CLASE_BOTON =
  "mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-base font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto";

/**
 * "Avisame cuando entre uno" (tanda 49): abre el form "Te lo buscamos"
 * prellenado con lo que buscó, en una hoja inferior en el celu y en un modal
 * en la compu, sin salir de la página. Sin JS (y hasta hidratar) es el link
 * directo a WhatsApp con el texto simple de siempre. Ya hidratado pasa a ser
 * un <button>: así abrir el form no cuenta como click a WhatsApp (lead).
 */
export function AvisoSinStock({ hrefSimple, ...props }: PropsBusqueda & { hrefSimple: string }) {
  // false en el servidor y al hidratar; true una vez hidratado.
  const hidratado = useSyncExternalStore(sinSuscripcion, () => true, () => false);
  const [abierto, setAbierto] = useState(false);

  const contenido = (
    <>
      <WhatsappIcon className="h-5 w-5" />
      Avisame cuando entre uno
    </>
  );

  if (!hidratado) {
    return (
      <a href={hrefSimple} target="_blank" rel="noopener noreferrer" data-track-detalle="aviso_sin_stock" className={CLASE_BOTON}>
        {contenido}
      </a>
    );
  }

  return (
    <Dialog.Root open={abierto} onOpenChange={setAbierto}>
      <Dialog.Trigger className={CLASE_BOTON}>{contenido}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[80] bg-black/40 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup
          className={
            // Celu: hoja inferior casi a pantalla completa. Compu: modal centrado.
            "fixed inset-x-0 bottom-0 z-[80] flex h-[92dvh] flex-col rounded-t-2xl bg-white text-left shadow-xl outline-none transition-transform duration-200 data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full " +
            "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[90vh] sm:w-[min(40rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:transition-opacity sm:data-[ending-style]:-translate-y-1/2 sm:data-[starting-style]:-translate-y-1/2 sm:data-[ending-style]:opacity-0 sm:data-[starting-style]:opacity-0"
          }
        >
          <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-zinc-300 sm:hidden" aria-hidden="true" />
          <div className="flex shrink-0 items-start justify-between gap-3 px-4 pb-3 pt-3 sm:px-6 sm:pt-5">
            <div>
              <Dialog.Title className="text-xl font-black tracking-tight">Si no encontrás el auto, te lo buscamos</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Revisá los datos y mandanos el pedido por WhatsApp. Te avisamos cuando entre uno.
              </Dialog.Description>
            </div>
            <Dialog.Close aria-label="Cerrar" className="-mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-muted">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <FormBusqueda {...props} enHoja onCerrar={() => setAbierto(false)} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
