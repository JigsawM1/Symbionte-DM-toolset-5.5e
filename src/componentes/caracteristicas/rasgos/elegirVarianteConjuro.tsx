import { createRoot } from "react-dom/client";
import { DialogoVariante, type OpcionesDialogoLanzamiento } from "./DialogoVarianteConjuro";
import { logger } from "@/utiles/logger";

const pendientes = new Set<string>();

/** La elección se solicita desde el lanzador común, incluida cualquier tarjeta de conjuro. */
export function elegirOpcionLanzamiento(idPersonaje: string, opciones: OpcionesDialogoLanzamiento): Promise<string | undefined> {
  if (pendientes.has(idPersonaje) || typeof document === "undefined") return Promise.resolve(undefined);
  pendientes.add(idPersonaje);
  return new Promise(resolve => {
    const contenedor = document.createElement("div");
    document.body.append(contenedor);
    let raiz: ReturnType<typeof createRoot> | null = null;
    let resuelto = false;
    const finalizar = (valor?: string) => {
      if (resuelto) return;
      resuelto = true;
      pendientes.delete(idPersonaje);
      resolve(valor);
      setTimeout(() => {
        try {
          raiz?.unmount();
        } catch (err) {
          logger.error("[elegirOpcionLanzamiento] Error al desmontar raíz de diálogo:", err);
        } finally {
          contenedor.remove();
        }
      }, 0);
    };

    try {
      raiz = createRoot(contenedor);
      raiz.render(<DialogoVariante {...opciones} resolver={finalizar} />);
    } catch (err) {
      logger.error("[elegirOpcionLanzamiento] Error al montar raíz de diálogo:", err);
      finalizar(undefined);
    }
  });
}

export async function elegirVarianteConjuro(idPersonaje: string, nombre: string): Promise<boolean | undefined> {
  const eleccion = await elegirOpcionLanzamiento(idPersonaje, { nombre, etiqueta: `Duración de ${nombre}`,
    descripcion: "Elige la duración para este lanzamiento antes de gastar recursos.", opciones: [
      { id: "normal", texto: "Duración normal con concentración" }, { id: "breve", texto: "1 minuto sin concentración" }
    ] });
  return eleccion === undefined ? undefined : eleccion === "breve";
}
