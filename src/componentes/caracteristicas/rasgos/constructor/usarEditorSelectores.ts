import { useState } from "react";
import type { SelectorRasgo, OpcionSelector } from "@/tipos";
import { generarId } from "@/utiles/generarId";
import type { ActualizarBorradorRasgo } from "./usarConstructorRasgo";
export function usarEditorSelectores(actualizarBorrador: ActualizarBorradorRasgo) {
    const [modoCreandoSelector, setModoCreandoSelector] = useState<boolean>(false);
    const [nuevoSelectorEtiqueta, setNuevoSelectorEtiqueta] = useState<string>("");
    const [nuevoSelectorTipo, setNuevoSelectorTipo] = useState<"unico" | "multiple">("unico");
    const [nuevoSelectorMax, setNuevoSelectorMax] = useState<number>(1);
    const [nuevoSelectorVisualizacion, setNuevoSelectorVisualizacion] = useState<"normal" | "lista">("normal");
    const [nuevoOpcionesTexto, setNuevoOpcionesTexto] = useState<string>("");
    const manejarAgregarSelector = () => {
        if (!nuevoSelectorEtiqueta.trim())
            return;
        const nombresOpciones = nuevoOpcionesTexto
            .split(/[\n,]/)
            .map((s) => s.trim())
            .filter(Boolean);
        const opciones: OpcionSelector[] = nombresOpciones.map((nom) => ({
            id: generarId("opt"),
            nombre: nom,
            descripcion: ""
        }));
        const nuevoSel: SelectorRasgo = {
            id: generarId("sel"),
            etiqueta: nuevoSelectorEtiqueta.trim(),
            tipo: nuevoSelectorTipo,
            visualizacion: nuevoSelectorVisualizacion,
            maxSelecciones: nuevoSelectorTipo === "multiple" ? Math.max(1, nuevoSelectorMax) : 1,
            opciones,
            valorActual: []
        };
        actualizarBorrador("selectores", (prev) => [...prev, nuevoSel]);
        setNuevoSelectorEtiqueta("");
        setNuevoOpcionesTexto("");
        setNuevoSelectorTipo("unico");
        setNuevoSelectorMax(1);
        setNuevoSelectorVisualizacion("normal");
        setModoCreandoSelector(false);
    };
    const manejarEliminarSelector = (idSel: string) => {
        actualizarBorrador("selectores", (prev) => prev.filter((s) => s.id !== idSel));
    };
    return { modoCreandoSelector, setModoCreandoSelector, nuevoSelectorEtiqueta, setNuevoSelectorEtiqueta, nuevoSelectorTipo, setNuevoSelectorTipo, nuevoSelectorMax, setNuevoSelectorMax, nuevoSelectorVisualizacion, setNuevoSelectorVisualizacion, nuevoOpcionesTexto, setNuevoOpcionesTexto, manejarAgregarSelector, manejarEliminarSelector };
}
