import type { StateCreator } from "zustand";
import type { EstadoDM } from "@/almacen/usarAlmacenDM";
import type { ObjetoInventario } from "@/tipos";
import { contarSintonizaciones, desempaquetarPaqueteInventario } from "@/servicios/calculadorInventario";
import { procesarAlternarEquipado } from "@/servicios/procesadorEquipamiento";
import { mutarPersonaje } from "../helpers/mutarPersonaje";
import type { SubSliceInventario } from "./slicePersonajesTipos";

export const crearSubSliceInventario: StateCreator<
  EstadoDM,
  [],
  [],
  SubSliceInventario
> = (set) => ({
  agregarObjetoInventario: (idPj, objeto) => {
    mutarPersonaje(set, idPj, (pj) => {
      const inventarioActual = pj.inventario || [];
      const normalizar = (s: string) => s.toLowerCase().trim();
      const contNuevo = objeto.contenedor || "mochila";

      // Buscar si ya existe un objeto IDÉNTICO NO EQUIPADO en el mismo contenedor para fusionar
      const indiceExistente = inventarioActual.findIndex((o) => {
        if (o.equipado || objeto.equipado) return false;
        const contExistente = o.contenedor || "mochila";
        if (contExistente !== contNuevo) return false;

        // Si ambos provienen del compendio y tienen idObjeto válido
        if (
          o.idObjeto &&
          objeto.idObjeto &&
          !o.idObjeto.startsWith("obj_custom") &&
          !objeto.idObjeto.startsWith("obj_custom")
        ) {
          return o.idObjeto === objeto.idObjeto;
        }
        // Comparación por nombre normalizado y tipo principal
        return (
          normalizar(o.nombre) === normalizar(objeto.nombre) &&
          o.tipoPrincipal === objeto.tipoPrincipal
        );
      });

      if (indiceExistente !== -1) {
        const copia = [...inventarioActual];
        const exist = copia[indiceExistente];
        copia[indiceExistente] = {
          ...exist,
          cantidad: (exist.cantidad || 1) + (objeto.cantidad || 1)
        };
        return {
          ...pj,
          inventario: copia
        };
      }

      return {
        ...pj,
        inventario: [...inventarioActual, objeto]
      };
    });
  },

  reordenarInventario: (idPj, idInstanciaOrigen, idInstanciaDestino) => {
    mutarPersonaje(set, idPj, (pj) => {
      const inventarioActual = [...(pj.inventario || [])];
      const indiceOrigen = inventarioActual.findIndex((o) => o.idInstancia === idInstanciaOrigen);
      const indiceDestino = inventarioActual.findIndex((o) => o.idInstancia === idInstanciaDestino);

      if (indiceOrigen === -1 || indiceDestino === -1 || indiceOrigen === indiceDestino) {
        return pj;
      }

      const [objetoMovido] = inventarioActual.splice(indiceOrigen, 1);
      inventarioActual.splice(indiceDestino, 0, objetoMovido);

      return {
        ...pj,
        inventario: inventarioActual
      };
    });
  },

  quitarObjetoInventario: (idPj, idInstancia) => {
    mutarPersonaje(set, idPj, (pj) => ({
      ...pj,
      inventario: (pj.inventario || []).filter((o) => o.idInstancia !== idInstancia)
    }));
  },

  modificarCantidadObjeto: (idPj, idInstancia, delta) => {
    mutarPersonaje(set, idPj, (pj) => {
      const inventarioActual = pj.inventario || [];
      const actualizado = inventarioActual
        .map((o) => {
          if (o.idInstancia !== idInstancia) return o;
          const nuevaCantidad = o.cantidad + delta;
          return nuevaCantidad <= 0 ? null : { ...o, cantidad: nuevaCantidad };
        })
        .filter((o): o is ObjetoInventario => o !== null);
      return {
        ...pj,
        inventario: actualizado
      };
    });
  },

  alternarEquipadoObjeto: (idPj, idInstancia) => {
    mutarPersonaje(set, idPj, (pj) => ({
      ...pj,
      inventario: procesarAlternarEquipado(pj.inventario || [], idInstancia)
    }));
  },

  alternarSintonizadoObjeto: (idPj, idInstancia) => {
    mutarPersonaje(set, idPj, (pj) => {
      const inventarioActual = pj.inventario || [];
      const objTarget = inventarioActual.find((o) => o.idInstancia === idInstancia);
      if (!objTarget || !objTarget.sintonizacionRequerida) return pj;

      const totalSintonizados = contarSintonizaciones(inventarioActual);
      // Si no está sintonizado y ya hay 3 activos, bloquear la sintonización
      if (!objTarget.sintonizado && totalSintonizados >= 3) {
        return pj;
      }

      return {
        ...pj,
        inventario: inventarioActual.map((o) =>
          o.idInstancia === idInstancia ? { ...o, sintonizado: !o.sintonizado } : o
        )
      };
    });
  },

  actualizarNotasObjeto: (idPj, idInstancia, notas) => {
    mutarPersonaje(set, idPj, (pj) => ({
      ...pj,
      inventario: (pj.inventario || []).map((o) =>
        o.idInstancia === idInstancia ? { ...o, notas } : o
      )
    }));
  },

  actualizarObjetoInventario: (idPj, idInstancia, cambios) => {
    mutarPersonaje(set, idPj, (pj) => ({
      ...pj,
      inventario: (pj.inventario || []).map((o) =>
        o.idInstancia === idInstancia ? { ...o, ...cambios } : o
      )
    }));
  },

  modificarCargasObjeto: (idPj, idInstancia, delta) => {
    mutarPersonaje(set, idPj, (pj) => ({
      ...pj,
      inventario: (pj.inventario || []).map((o) => {
        if (o.idInstancia !== idInstancia || o.cargasMaximas === undefined) return o;
        const actuales = o.cargasActuales !== undefined ? o.cargasActuales : o.cargasMaximas;
        const nuevas = Math.max(0, Math.min(o.cargasMaximas, actuales + delta));
        return { ...o, cargasActuales: nuevas };
      })
    }));
  },

  cambiarContenedorObjeto: (idPj, idInstancia, contenedor) => {
    mutarPersonaje(set, idPj, (pj) => ({
      ...pj,
      inventario: (pj.inventario || []).map((o) => {
        if (o.idInstancia !== idInstancia) return o;
        // Si se traslada a un contenedor no-mochila (Bolsa de Contención, Montura, Almacén),
        // se desequipa automáticamente si estaba equipado.
        const desequipar = contenedor !== "mochila";
        return {
          ...o,
          contenedor,
          equipado: desequipar ? false : o.equipado
        };
      })
    }));
  },

  desempaquetarPaquete: (idPj, idInstancia, baseDatosObjetos) => {
    mutarPersonaje(set, idPj, (pj) => ({
      ...pj,
      inventario: desempaquetarPaqueteInventario(pj.inventario || [], idInstancia, baseDatosObjetos)
    }));
  },

  establecerMonedas: (idPj, monedas) => {
    mutarPersonaje(set, idPj, (pj) => {
      const actual = pj.bolsaMonedas || { pc: 0, pp: 0, pe: 0, po: 0, ppt: 0 };
      return {
        ...pj,
        bolsaMonedas: {
          pc: Math.max(0, monedas.pc !== undefined ? monedas.pc : actual.pc),
          pp: Math.max(0, monedas.pp !== undefined ? monedas.pp : actual.pp),
          pe: Math.max(0, monedas.pe !== undefined ? monedas.pe : actual.pe),
          po: Math.max(0, monedas.po !== undefined ? monedas.po : actual.po),
          ppt: Math.max(0, monedas.ppt !== undefined ? monedas.ppt : actual.ppt)
        }
      };
    });
  },

  modificarMoneda: (idPj, tipo, delta) => {
    mutarPersonaje(set, idPj, (pj) => {
      const actual = pj.bolsaMonedas || { pc: 0, pp: 0, pe: 0, po: 0, ppt: 0 };
      const valorActual = actual[tipo] || 0;
      const nuevoValor = Math.max(0, valorActual + delta);
      return {
        ...pj,
        bolsaMonedas: {
          ...actual,
          [tipo]: nuevoValor
        }
      };
    });
  }
});
