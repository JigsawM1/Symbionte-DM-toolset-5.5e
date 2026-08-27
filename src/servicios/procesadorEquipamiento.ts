import type { ObjetoInventario } from "@/tipos";
import { generarId } from "@/utiles/generarId";

/**
 * Procesa el equipamiento o desequipamiento de un objeto en el inventario
 * aplicando las reglas oficiales de D&D 5.5e y ergonomía de juego:
 * 1. Regla de Armadura Única: Solo una armadura puede estar equipada simultáneamente.
 * 2. Equipamiento Individual: Si un stack tiene cantidad > 1, se equipa 1 unidad y el resto permanece en mochila.
 * 3. Fusión al Desequipar: Si ya existe un objeto idéntico en la mochila, se fusiona incrementando la cantidad.
 */
export function procesarAlternarEquipado(
  inventarioActual: ObjetoInventario[],
  idInstancia: string
): ObjetoInventario[] {
  const objTarget = inventarioActual.find((o) => o.idInstancia === idInstancia);
  if (!objTarget || !objTarget.equipable) return inventarioActual;

  const vaAEquipar = !objTarget.equipado;
  const normalizar = (s: string) => s.toLowerCase().trim();

  if (vaAEquipar) {
    // 1. REGLA DE ARMADURA ÚNICA: Solo se puede tener una Armadura equipada
    let inventarioProcesado = inventarioActual.map((o) => {
      if (
        objTarget.tipoPrincipal === "Armadura" &&
        o.tipoPrincipal === "Armadura" &&
        o.idInstancia !== idInstancia &&
        o.equipado
      ) {
        return { ...o, equipado: false };
      }
      return o;
    });

    // 2. EQUIPAMIENTO INDIVIDUAL: Si tiene cantidad > 1, equipar 1 unidad y dejar el resto en mochila
    if (objTarget.cantidad > 1) {
      const copiaResto: ObjetoInventario = {
        ...objTarget,
        idInstancia: generarId("inv"),
        cantidad: objTarget.cantidad - 1,
        equipado: false
      };

      inventarioProcesado = inventarioProcesado.map((o) =>
        o.idInstancia === idInstancia
          ? { ...o, cantidad: 1, equipado: true }
          : o
      );
      inventarioProcesado.push(copiaResto);
    } else {
      inventarioProcesado = inventarioProcesado.map((o) =>
        o.idInstancia === idInstancia ? { ...o, equipado: true } : o
      );
    }

    return inventarioProcesado;
  } else {
    // Va a desequipar (volver a la mochila): Si ya existe un objeto idéntico en mochila, fusionar sumando cantidad
    const indiceMochila = inventarioActual.findIndex(
      (o) =>
        !o.equipado &&
        o.idInstancia !== idInstancia &&
        ((o.idObjeto &&
          objTarget.idObjeto &&
          !o.idObjeto.startsWith("obj_custom") &&
          !objTarget.idObjeto.startsWith("obj_custom") &&
          o.idObjeto === objTarget.idObjeto) ||
          (normalizar(o.nombre) === normalizar(objTarget.nombre) &&
            o.tipoPrincipal === objTarget.tipoPrincipal))
    );

    if (indiceMochila !== -1) {
      const idTargetMochila = inventarioActual[indiceMochila].idInstancia;
      const nuevoInventario = inventarioActual
        .filter((o) => o.idInstancia !== idInstancia)
        .map((o) => {
          if (o.idInstancia === idTargetMochila) {
            return { ...o, cantidad: (o.cantidad || 1) + (objTarget.cantidad || 1) };
          }
          return o;
        });
      return nuevoInventario;
    } else {
      return inventarioActual.map((o) =>
        o.idInstancia === idInstancia ? { ...o, equipado: false } : o
      );
    }
  }
}
