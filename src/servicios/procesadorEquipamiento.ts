import type { ObjetoInventario } from "@/tipos";
import { generarId } from "@/utiles/generarId";

/**
 * Determina si un objeto representa un Escudo según las reglas de D&D 5.5e.
 */
export function esObjetoEscudo(obj: ObjetoInventario): boolean {
  return obj.categoria === "escudos";
}

/**
 * Determina si un objeto es una Armadura Corporal (Ligera, Mediana o Pesada),
 * excluyendo explícitamente los Escudos.
 */
export function esObjetoArmaduraCorporal(obj: ObjetoInventario): boolean {
  return obj.categoria === "armaduras";
}

/**
 * Determina si un objeto es equipable según sus propiedades o categoría D&D 5.5e
 * (armas, armaduras corporales, escudos o equipo vestible marcado como equipable).
 */
export function esObjetoEquipable(obj: ObjetoInventario): boolean {
  if (obj.equipable === true) return true;
  return obj.categoria === "armas" || obj.categoria === "armaduras" || obj.categoria === "escudos";
}

/**
 * Procesa el equipamiento o desequipamiento de un objeto en el inventario
 * aplicando las reglas oficiales de D&D 5.5e y ergonomía de juego:
 * 1. Regla de Armadura y Escudo: Se puede tener 1 Armadura Corporal y 1 Escudo equipados simultáneamente.
 * 2. Equipamiento Individual: Si un stack tiene cantidad > 1, se equipa 1 unidad y el resto permanece en mochila.
 * 3. Fusión al Desequipar: Si ya existe un objeto idéntico en la mochila, se fusiona incrementando la cantidad.
 */
export function procesarAlternarEquipado(
  inventarioActual: ObjetoInventario[],
  idInstancia: string
): ObjetoInventario[] {
  const objTarget = inventarioActual.find((o) => o.idInstancia === idInstancia);
  if (!objTarget || !esObjetoEquipable(objTarget)) return inventarioActual;

  const vaAEquipar = !objTarget.equipado;

  if (vaAEquipar) {
    // 1. REGLA DE ARMADURA Y ESCUDO (D&D 5.5e):
    // - Un personaje puede portar 1 Armadura Corporal Y 1 Escudo simultáneamente.
    // - Si equipa una Armadura Corporal, desequipa cualquier otra Armadura Corporal previa (preservando el Escudo).
    // - Si equipa un Escudo, desequipa cualquier otro Escudo previo (preservando la Armadura Corporal).
    const targetEsEscudo = esObjetoEscudo(objTarget);
    const targetEsArmaduraCorporal = esObjetoArmaduraCorporal(objTarget);

    let inventarioProcesado = inventarioActual.map((o) => {
      if (o.idInstancia === idInstancia || !o.equipado) return o;

      if (targetEsEscudo && esObjetoEscudo(o)) {
        return { ...o, equipado: false };
      }
      if (targetEsArmaduraCorporal && esObjetoArmaduraCorporal(o)) {
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
          ? { ...o, cantidad: 1, equipado: true, equipable: true }
          : o
      );
      inventarioProcesado.push(copiaResto);
    } else {
      inventarioProcesado = inventarioProcesado.map((o) =>
        o.idInstancia === idInstancia ? { ...o, equipado: true, equipable: true } : o
      );
    }

    return inventarioProcesado;
  }
  // Cada instancia conserva su ubicación, cargas, notas y sintonización al desequiparse.
  return inventarioActual.map((o) => o.idInstancia === idInstancia ? { ...o, equipado: false } : o);
}
