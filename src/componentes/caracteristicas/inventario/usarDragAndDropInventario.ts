import React, { useState, useEffect } from "react";
import type { ObjetoInventario, TipoContenedor } from "@/tipos";
import type { CriterioOrdenMochila } from "./inventarioConstantes";
import { esObjetoEquipable } from "@/servicios/procesadorEquipamiento";
import { logger } from "@/utiles/logger";

interface ParametrosDragAndDropInventario {
  inventario: ObjetoInventario[];
  alCambiarContenedor?: (idInstancia: string, contenedor: TipoContenedor) => void;
  alAlternarEquipado: (idInstancia: string) => void;
  alReordenarInventario?: (idInstanciaOrigen: string, idInstanciaDestino: string) => void;
  alCambiarOrden?: (orden: CriterioOrdenMochila) => void;
  agregarNotificacion: (mensaje: string, tipo?: "info" | "exito" | "advertencia" | "error") => void;
}

const DESTINOS_MOCHILA = new Set([
  "mochila",
  "consumibles",
  "municion",
  "armas",
  "armaduras",
  "herramientas",
  "magicos",
  "equipo"
]);

export function usarDragAndDropInventario({
  inventario,
  alCambiarContenedor,
  alAlternarEquipado,
  alReordenarInventario,
  alCambiarOrden,
  agregarNotificacion
}: ParametrosDragAndDropInventario) {
  const [zonaDropActiva, setZonaDropActiva] = useState<string | null>(null);
  const [arrastrandoItem, setArrastrandoItem] = useState(false);

  // Limpieza global de seguridad para Drag & Drop
  useEffect(() => {
    if (!arrastrandoItem) return;

    const finalizarArrastreGlobal = () => {
      setArrastrandoItem(false);
      setZonaDropActiva(null);
    };

    window.addEventListener("dragend", finalizarArrastreGlobal);
    window.addEventListener("mouseup", finalizarArrastreGlobal);
    window.addEventListener("drop", finalizarArrastreGlobal);

    return () => {
      window.removeEventListener("dragend", finalizarArrastreGlobal);
      window.removeEventListener("mouseup", finalizarArrastreGlobal);
      window.removeEventListener("drop", finalizarArrastreGlobal);
    };
  }, [arrastrandoItem]);

  const manejarDragOver = (e: React.DragEvent, idSeccion: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (zonaDropActiva !== idSeccion) {
      setZonaDropActiva(idSeccion);
    }
  };

  const manejarDragLeave = (e: React.DragEvent, idSeccion: string) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (zonaDropActiva === idSeccion) {
      setZonaDropActiva(null);
    }
  };

  const manejarDrop = (e: React.DragEvent, destino: string) => {
    e.preventDefault();
    setZonaDropActiva(null);
    setArrastrandoItem(false);
    try {
      const raw = e.dataTransfer.getData("application/json");
      if (!raw) return;
      const payload = JSON.parse(raw) as {
        idInstancia: string;
        nombre: string;
        equipable: boolean;
        equipado: boolean;
        contenedor: TipoContenedor;
      };

      const idInstancia = payload.idInstancia;
      const objActual = inventario.find((o) => o.idInstancia === idInstancia);
      if (!objActual) return;

      if (destino === "equipados") {
        if (!esObjetoEquipable(objActual)) {
          agregarNotificacion(
            `"${objActual.nombre}" no es un objeto equipable (solo armas, armaduras o equipo vestible).`,
            "advertencia"
          );
          return;
        }

        if (objActual.contenedor && objActual.contenedor !== "mochila") {
          alCambiarContenedor?.(idInstancia, "mochila");
        }
        if (!objActual.equipado) {
          alAlternarEquipado(idInstancia);
          agregarNotificacion(`"${objActual.nombre}" equipado.`, "exito");
        }
        return;
      }

      if (destino === "bolsa_contencion" || destino === "montura" || destino === "almacen") {
        if (objActual.equipado) {
          alAlternarEquipado(idInstancia);
          agregarNotificacion(`"${objActual.nombre}" desequipado.`, "info");
        }
        if (objActual.contenedor !== destino) {
          alCambiarContenedor?.(idInstancia, destino as TipoContenedor);
          const nombresCont: Record<string, string> = {
            bolsa_contencion: "Bolsa de Contención",
            montura: "Montura / Carreta",
            almacen: "Almacén / Base"
          };
          agregarNotificacion(
            `"${objActual.nombre}" movido a ${nombresCont[destino]}.`,
            "info"
          );
        }
        return;
      }

      if (DESTINOS_MOCHILA.has(destino)) {
        if (objActual.equipado) {
          alAlternarEquipado(idInstancia);
          agregarNotificacion(`"${objActual.nombre}" desequipado.`, "info");
        }
        if (objActual.contenedor && objActual.contenedor !== "mochila") {
          alCambiarContenedor?.(idInstancia, "mochila");
          agregarNotificacion(`"${objActual.nombre}" movido a Mochila.`, "info");
        }
        return;
      }

      // Reordenación libre dentro de la mochila o soltado sobre ítem equipado
      if (destino.startsWith("item_") && alReordenarInventario) {
        const idDestino = destino.replace("item_", "");
        if (idDestino !== idInstancia) {
          const objDestino = inventario.find((o) => o.idInstancia === idDestino);
          if (objDestino?.equipado && !objActual.equipado) {
            if (!esObjetoEquipable(objActual)) {
              agregarNotificacion(
                `"${objActual.nombre}" no es un objeto equipable (solo armas, armaduras o equipo vestible).`,
                "advertencia"
              );
              return;
            }
            if (objActual.contenedor && objActual.contenedor !== "mochila") {
              alCambiarContenedor?.(idInstancia, "mochila");
            }
            alAlternarEquipado(idInstancia);
            agregarNotificacion(`"${objActual.nombre}" equipado.`, "exito");
            return;
          }

          if (objActual.equipado) {
            alAlternarEquipado(idInstancia);
            agregarNotificacion(`"${objActual.nombre}" desequipado.`, "info");
          }
          if (objActual.contenedor && objActual.contenedor !== "mochila") {
            alCambiarContenedor?.(idInstancia, "mochila");
          }
          alCambiarOrden?.("personalizado");
          alReordenarInventario(idInstancia, idDestino);
        }
      }
    } catch (error) {
      logger.error("Error al procesar drop:", error);
    }
  };

  return {
    zonaDropActiva,
    setZonaDropActiva,
    arrastrandoItem,
    setArrastrandoItem,
    manejarDragOver,
    manejarDragLeave,
    manejarDrop
  };
}
