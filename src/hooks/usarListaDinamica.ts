import { useState, useCallback } from "react";

export interface ItemConNombre {
  nombre: string;
}

export function usarListaDinamica<T extends ItemConNombre>(
  valoresIniciales: T,
  actualizarListaPadre: (nuevaLista: T[]) => void,
  listaActual: T[]
) {
  return usarEditorLista(valoresIniciales, actualizarListaPadre, listaActual, normalizarNombre);
}

function normalizarNombre<T extends ItemConNombre>(item: T): T | null {
  const nombre = item.nombre.trim();
  return nombre ? { ...item, nombre } : null;
}

export function usarEditorLista<T extends object>(
  valoresIniciales: T,
  actualizarListaPadre: (nuevaLista: T[]) => void,
  listaActual: T[],
  normalizarItem: (item: T) => T | null
) {
  const [borrador, setItemForm] = useState<T | null>(null);
  const itemForm = borrador ?? valoresIniciales;
  const [edicionIdx, setEdicionIdx] = useState<number | null>(null);

  const actualizarCampoItem = useCallback(<K extends keyof T>(campo: K, valor: T[K]) => {
    setItemForm((prev) => {
      const item = prev ?? valoresIniciales;
      return Object.is(item[campo], valor) ? prev : { ...item, [campo]: valor };
    });
  }, [valoresIniciales]);

  const limpiarItemForm = useCallback(() => {
    setItemForm(null);
    setEdicionIdx(null);
  }, []);

  const agregarItem = useCallback(() => {
    const itemSaneado = normalizarItem(itemForm);
    if (!itemSaneado) return false;

    if (edicionIdx !== null) {
      const nuevaLista = [...listaActual];
      nuevaLista[edicionIdx] = itemSaneado;
      actualizarListaPadre(nuevaLista);
    } else {
      actualizarListaPadre([...listaActual, itemSaneado]);
    }
    limpiarItemForm();
    return true;
  }, [itemForm, edicionIdx, listaActual, actualizarListaPadre, normalizarItem, limpiarItemForm]);

  const iniciarEdicion = useCallback((idx: number) => {
    const item = listaActual[idx];
    if (!item) return;
    setItemForm(item);
    setEdicionIdx(idx);
  }, [listaActual]);

  const eliminarItem = useCallback((idx: number) => {
    const nuevaLista = listaActual.filter((_, i) => i !== idx);
    actualizarListaPadre(nuevaLista);
    
    if (edicionIdx === idx) limpiarItemForm();
    else if (edicionIdx !== null && edicionIdx > idx) setEdicionIdx(edicionIdx - 1);
  }, [listaActual, actualizarListaPadre, edicionIdx, limpiarItemForm]);

  return {
    itemForm,
    hayBorrador: borrador !== null,
    setItemForm,
    edicionIdx,
    setEdicionIdx,
    actualizarCampoItem,
    limpiarItemForm,
    agregarItem,
    iniciarEdicion,
    cancelarEdicion: limpiarItemForm,
    eliminarItem
  };
}
