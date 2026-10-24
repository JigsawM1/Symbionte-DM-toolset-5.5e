import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { solicitarResultadoTirada } from "@/utiles/lanzadorDados";
import { elegirOpcionLanzamiento } from "./elegirVarianteConjuro";

const enCurso = new Set<string>();

/** Conserva un resultado pendiente al cerrar el diálogo y evita pagar o tirar de nuevo al reabrirlo. */
export async function tirarRasgoConResultado(idPersonaje: string, idRasgo: string, formula: string): Promise<void> {
  if (enCurso.has(idPersonaje)) return;
  enCurso.add(idPersonaje);
  const estado = usarAlmacenDM.getState;
  const actual = () => estado().personajes.find(p => p.id === idPersonaje);
  const r = actual()?.rasgos.find(r => r.id === idRasgo);
  if (!r) { enCurso.delete(idPersonaje); return; }
  let idIntento = actual()?.intentoRasgoPendiente?.id;
  try {
    if (r.gastoSegunResultado) {
      if (actual()?.intentoRasgoPendiente?.idRasgo && actual()!.intentoRasgoPendiente!.idRasgo !== idRasgo) return;
      if (!idIntento) {
        idIntento = crypto.randomUUID();
        if (!estado().operarRecursoRasgoPersonaje(idPersonaje, { tipo: "reservarIntento", id: idIntento, idRasgo, formula })) return;
      }
    }
    let resultado = r.gastoSegunResultado ? actual()?.intentoRasgoPendiente?.resultado : undefined;
    if (resultado === undefined) {
      const tirada = await solicitarResultadoTirada({ etiqueta: r.nombre, grupos: [{ nombre: r.nombre, formula: r.gastoSegunResultado ? actual()?.intentoRasgoPendiente?.formula ?? formula : formula }] });
      resultado = tirada.totales[0];
      if (!Number.isFinite(resultado)) throw new Error("No se obtuvo el resultado del dado.");
      if (idIntento && r.gastoSegunResultado) {
        if (!estado().operarRecursoRasgoPersonaje(idPersonaje, { tipo: "anotarIntento", id: idIntento, resultado })) return;
      } else {
        if (!estado().operarRecursoRasgoPersonaje(idPersonaje, { tipo: "usarOpcion", idRasgo })) return;
        estado().agregarNotificacion(`${r.nombre}: ${resultado} × ${r.multiplicadorResultadoManual ?? 1} = ${resultado * (r.multiplicadorResultadoManual ?? 1)}. Aplicación a destinatarios manual.`, "info");
      }
    }
    if (r.gastoSegunResultado && idIntento) {
      const eleccion = await elegirOpcionLanzamiento(idPersonaje, { nombre: r.nombre, etiqueta: "Resolver resultado de la tirada",
        descripcion: `Resultado: ${resultado}. Confirma si el dado convierte el fallo en éxito. Cerrar conserva este resultado pendiente.`,
        opciones: [{ id: "exito", texto: "Convierte el fallo en éxito", detalle: "Gastar la Inspiración reservada" }, { id: "fallo", texto: "El intento sigue fallando", detalle: "Devolver la Inspiración reservada" }] });
      if (eleccion) estado().operarRecursoRasgoPersonaje(idPersonaje, { tipo: "resolverIntento", id: idIntento, exitoso: eleccion === "exito" });
    }
  } catch (error) {
    if (idIntento && actual()?.intentoRasgoPendiente?.resultado === undefined) estado().operarRecursoRasgoPersonaje(idPersonaje, { tipo: "cancelarIntento", id: idIntento });
    estado().agregarNotificacion(error instanceof Error ? error.message : "No se pudo resolver la tirada.", "error");
  } finally { enCurso.delete(idPersonaje); }
}
