import { useState, useCallback } from "react";

export interface ItemConNombre {
  nombre: string;
}

export function usarListaDinamica<T extends ItemConNombre>(
  valoresIniciales: T,
  actualizarListaPadre: (nuevaLista: T[]) => void,
  listaActual: T[]
) {
  const [itemForm, setItemForm] = useState<T>(valoresIniciales);
  const [edicionIdx, setEdicionIdx] = useState<number | null>(null);

  const actualizarCampoItem = useCallback((campo: keyof T, valor: unknown) => {
    setItemForm((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  const establecerItemForm = useCallback((valores: T) => {
    setItemForm(valores);
  }, []);

  const limpiarItemForm = useCallback(() => {
    setItemForm(valoresIniciales);
    setEdicionIdx(null);
  }, [valoresIniciales]);

  const agregarItem = useCallback(() => {
    if (!itemForm.nombre.trim()) return;

    const itemSanetizado = {
      ...itemForm,
      nombre: itemForm.nombre.trim()
    };

    if (edicionIdx !== null) {
      const nuevaLista = [...listaActual];
      nuevaLista[edicionIdx] = itemSanetizado;
      actualizarListaPadre(nuevaLista);
      setEdicionIdx(null);
    } else {
      actualizarListaPadre([...listaActual, itemSanetizado]);
    }
    setItemForm(valoresIniciales);
  }, [itemForm, edicionIdx, listaActual, valoresIniciales, actualizarListaPadre]);

  const iniciarEdicion = useCallback((idx: number) => {
    const item = listaActual[idx];
    if (!item) return;
    setItemForm(item);
    setEdicionIdx(idx);
  }, [listaActual]);

  const cancelarEdicion = useCallback(() => {
    setItemForm(valoresIniciales);
    setEdicionIdx(null);
  }, [valoresIniciales]);

  const eliminarItem = useCallback((idx: number) => {
    const nuevaLista = listaActual.filter((_, i) => i !== idx);
    actualizarListaPadre(nuevaLista);
    
    // Ajustar el índice de edición de forma segura
    setEdicionIdx((prevIdx) => {
      if (prevIdx === idx) {
        setItemForm(valoresIniciales);
        return null;
      }
      if (prevIdx !== null && prevIdx > idx) {
        return prevIdx - 1;
      }
      return prevIdx;
    });
  }, [listaActual, actualizarListaPadre, valoresIniciales]);

  return {
    itemForm,
    setItemForm,
    edicionIdx,
    setEdicionIdx,
    actualizarCampoItem,
    establecerItemForm,
    limpiarItemForm,
    agregarItem,
    iniciarEdicion,
    cancelarEdicion,
    eliminarItem
  };
}
