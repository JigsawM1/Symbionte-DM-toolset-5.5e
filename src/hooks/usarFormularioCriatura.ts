import { useState, useCallback } from "react";
import { usarAlmacenDM } from "../almacen/usarAlmacenDM";
import { MonstruoBase, RasgoBase, AccionMonstruo, AccionRapida } from "../tipos";
import { parsearVelocidad, parsearSentidos, formatearVelocidad, formatearSentidos } from "../almacen/sanitizacion";
import { usarListaDinamica } from "./usarListaDinamica";

export const estadoInicialCriatura = {
  nombre: "",
  tipo: "Humanoide",
  ca: 10,
  caNotas: "",
  vidaMaxima: 10,
  vidaNotas: "",
  iniciativaBonificador: 0,
  velocidad: "30 pies",
  sentidos: "",
  idiomas: "",
  desafio: "1",
  fuente: "Manual de Monstruos",
  caracteristicas: { fuerza: 10, destreza: 10, constitucion: 10, inteligencia: 10, sabiduria: 10, carisma: 10 },
  salvaciones: {},
  habilidades: {},
  vulnerabilidades: [],
  resistencias: [],
  inmunidadesDaño: [],
  inmunidadesCondicion: [],
  accionesRapidas: [],
  rasgos: [],
  acciones: [],
  reacciones: [],
  accionesLegendarias: []
};

const rasgoInicial: RasgoBase = { nombre: "", descripcion: "", uso: "" };
const accionInicial: Omit<AccionMonstruo, "bonificadorAtaque"> & { bonificadorAtaque: string } = {
  nombre: "",
  descripcion: "",
  bonificadorAtaque: "",
  daño: "",
  uso: ""
};
const reaccionInicial: RasgoBase = { nombre: "", descripcion: "", uso: "" };
const legendariaInicial: RasgoBase = { nombre: "", descripcion: "", uso: "" };
const quickActionInicial: AccionRapida = {
  nombre: "",
  bonificadorAtaque: "+0",
  dadosDaño: "1d6",
  tipoDaño: "fuerza"
};

export function usarFormularioCriatura(idEnEdicion: string | null, alGuardarExitoso: () => void) {
  const { agregarMonstruoHomebrew, actualizarMonstruoHomebrew, agregarNotificacion } = usarAlmacenDM();

  const [monstruoForm, setMonstruoForm] = useState<Omit<MonstruoBase, "id" | "vidaActual">>(estadoInicialCriatura);
  const [subPestanaCriatura, setSubPestanaCriatura] = useState<"general" | "atributos" | "pericias" | "defensas" | "listas">("general");
  const [subDefensas, setSubDefensas] = useState<"inmunidades" | "resistencias" | "vulnerabilidades" | "condiciones">("inmunidades");

  // --- Helpers para actualizar las listas en el monstruoForm ---
  const setRasgosForm = useCallback((nuevosRasgos: RasgoBase[]) => {
    setMonstruoForm((prev) => ({ ...prev, rasgos: nuevosRasgos }));
  }, []);

  const setAccionesForm = useCallback((nuevasAccionesRaw: Array<Omit<AccionMonstruo, "bonificadorAtaque"> & { bonificadorAtaque: string }>) => {
    const accionesSaneadas = nuevasAccionesRaw.map((a) => ({
      nombre: a.nombre,
      descripcion: a.descripcion,
      bonificadorAtaque: a.bonificadorAtaque ? parseInt(a.bonificadorAtaque, 10) : undefined,
      daño: a.daño || undefined,
      uso: a.uso || undefined
    }));
    setMonstruoForm((prev) => ({ ...prev, acciones: accionesSaneadas }));
  }, []);

  const setReaccionesForm = useCallback((nuevasReacciones: RasgoBase[]) => {
    setMonstruoForm((prev) => ({ ...prev, reacciones: nuevasReacciones }));
  }, []);

  const setLegendariasForm = useCallback((nuevasLeg: RasgoBase[]) => {
    setMonstruoForm((prev) => ({ ...prev, accionesLegendarias: nuevasLeg }));
  }, []);

  const setQuickActionsForm = useCallback((nuevasQA: AccionRapida[]) => {
    setMonstruoForm((prev) => ({ ...prev, accionesRapidas: nuevasQA }));
  }, []);

  // --- Listas dinámicas con hook genérico ---
  const listaRasgos = usarListaDinamica(rasgoInicial, setRasgosForm, monstruoForm.rasgos || []);
  
  // Para acciones convertimos temporalmente bonificadorAtaque a string en el estado del subformulario
  const accionesRaw = (monstruoForm.acciones || []).map((a) => ({
    nombre: a.nombre,
    descripcion: a.descripcion,
    bonificadorAtaque: a.bonificadorAtaque !== undefined ? String(a.bonificadorAtaque) : "",
    daño: a.daño || "",
    uso: a.uso || ""
  }));
  const listaAcciones = usarListaDinamica(accionInicial, setAccionesForm, accionesRaw);

  const listaReacciones = usarListaDinamica(reaccionInicial, setReaccionesForm, monstruoForm.reacciones || []);
  const listaLegendarias = usarListaDinamica(legendariaInicial, setLegendariasForm, monstruoForm.accionesLegendarias || []);
  const listaQuickActions = usarListaDinamica(quickActionInicial, setQuickActionsForm, monstruoForm.accionesRapidas || []);

  const limpiarFormulario = useCallback(() => {
    setMonstruoForm(estadoInicialCriatura);
    setSubPestanaCriatura("general");
    setSubDefensas("inmunidades");
    listaRasgos.limpiarItemForm();
    listaAcciones.limpiarItemForm();
    listaReacciones.limpiarItemForm();
    listaLegendarias.limpiarItemForm();
    listaQuickActions.limpiarItemForm();
  }, [
    listaRasgos.limpiarItemForm,
    listaAcciones.limpiarItemForm,
    listaReacciones.limpiarItemForm,
    listaLegendarias.limpiarItemForm,
    listaQuickActions.limpiarItemForm
  ]);

  const cargarCriatura = useCallback((m: MonstruoBase) => {
    setMonstruoForm({
      nombre: m.nombre,
      tipo: m.tipo || "Humanoide",
      ca: m.ca,
      caNotas: m.caNotas || "",
      vidaMaxima: m.vidaMaxima,
      vidaNotas: m.vidaNotas || "",
      iniciativaBonificador: m.iniciativaBonificador || 0,
      velocidad: m.velocidad ? formatearVelocidad(m.velocidad) : "30 pies",
      sentidos: m.sentidos ? formatearSentidos(m.sentidos) : "",
      idiomas: m.idiomas || "",
      desafio: m.desafio || "1",
      fuente: m.fuente || "Manual de Monstruos",
      caracteristicas: m.caracteristicas || { fuerza: 10, destreza: 10, constitucion: 10, inteligencia: 10, sabiduria: 10, carisma: 10 },
      salvaciones: m.salvaciones || {},
      habilidades: m.habilidades || {},
      vulnerabilidades: m.vulnerabilidades || [],
      resistencias: m.resistencias || [],
      inmunidadesDaño: m.inmunidadesDaño || [],
      inmunidadesCondicion: m.inmunidadesCondicion || [],
      accionesRapidas: m.accionesRapidas || [],
      rasgos: m.rasgos || [],
      acciones: m.acciones || [],
      reacciones: m.reacciones || [],
      accionesLegendarias: m.accionesLegendarias || []
    });
    setSubPestanaCriatura("general");
    setSubDefensas("inmunidades");
  }, []);

  const actualizarGeneral = useCallback((campo: string, valor: unknown) => {
    setMonstruoForm((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  const actualizarCaracteristica = useCallback((caract: string, valor: number) => {
    setMonstruoForm((prev) => ({
      ...prev,
      caracteristicas: { ...prev.caracteristicas, [caract]: valor }
    }));
  }, []);

  const actualizarSalvacion = useCallback((caract: string, valor: string) => {
    const num = valor === "" ? undefined : parseInt(valor, 10);
    setMonstruoForm((prev) => {
      const nuevasSalv = { ...prev.salvaciones };
      if (num === undefined) {
        delete nuevasSalv[caract as keyof typeof nuevasSalv];
      } else {
        nuevasSalv[caract as keyof typeof nuevasSalv] = num;
      }
      return { ...prev, salvaciones: nuevasSalv };
    });
  }, []);

  const actualizarHabilidad = useCallback((hab: string, valor: string) => {
    const num = valor === "" ? undefined : parseInt(valor, 10);
    setMonstruoForm((prev) => {
      const nuevasHab = { ...prev.habilidades };
      if (num === undefined) {
        delete nuevasHab[hab as keyof typeof nuevasHab];
      } else {
        nuevasHab[hab as keyof typeof nuevasHab] = num;
      }
      return { ...prev, habilidades: nuevasHab };
    });
  }, []);

  const alternarCheckArray = useCallback((campo: "vulnerabilidades" | "resistencias" | "inmunidadesDaño" | "inmunidadesCondicion", valor: string) => {
    setMonstruoForm((prev) => {
      const arr = prev[campo] || [];
      const nuevoArr = arr.includes(valor)
        ? arr.filter((v) => v !== valor)
        : [...arr, valor];
      return { ...prev, [campo]: nuevoArr };
    });
  }, []);

  const manejarGuardarCriatura = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!monstruoForm.nombre.trim()) {
      agregarNotificacion("El nombre de la criatura es requerido", "advertencia");
      return;
    }

    const velocidadEstructurada = typeof monstruoForm.velocidad === "string"
      ? parsearVelocidad(monstruoForm.velocidad)
      : monstruoForm.velocidad;

    const sentidosEstructurados = typeof monstruoForm.sentidos === "string"
      ? parsearSentidos(monstruoForm.sentidos)
      : monstruoForm.sentidos;

    const monstruoParaGuardar = {
      ...monstruoForm,
      velocidad: velocidadEstructurada,
      sentidos: sentidosEstructurados
    };

    if (idEnEdicion) {
      actualizarMonstruoHomebrew(idEnEdicion, monstruoParaGuardar as any);
      agregarNotificacion("¡Criatura Homebrew actualizada con éxito!", "exito");
    } else {
      agregarMonstruoHomebrew({
        ...monstruoParaGuardar,
        vidaActual: monstruoForm.vidaMaxima
      } as any);
      agregarNotificacion("¡Criatura Homebrew guardada con éxito!", "exito");
    }

    limpiarFormulario();
    alGuardarExitoso();
  }, [monstruoForm, idEnEdicion, agregarMonstruoHomebrew, actualizarMonstruoHomebrew, agregarNotificacion, limpiarFormulario, alGuardarExitoso]);

  return {
    monstruoForm,
    subPestanaCriatura, setSubPestanaCriatura,
    subDefensas, setSubDefensas,
    
    // Mapeo adaptativo compatible con props antiguas para no romper la UI en caliente
    tRasgoNombre: listaRasgos.itemForm.nombre, setTRasgoNombre: (v: string) => listaRasgos.actualizarCampoItem("nombre", v),
    tRasgoDesc: listaRasgos.itemForm.descripcion || "", setTRasgoDesc: (v: string) => listaRasgos.actualizarCampoItem("descripcion", v),
    tRasgoUso: listaRasgos.itemForm.uso || "", setTRasgoUso: (v: string) => listaRasgos.actualizarCampoItem("uso", v),
    rasgoEdicionIdx: listaRasgos.edicionIdx,
    agregarRasgo: listaRasgos.agregarItem,
    iniciarEditarRasgo: listaRasgos.iniciarEdicion,
    cancelarEditarRasgo: listaRasgos.cancelarEdicion,
    eliminarRasgoIdx: listaRasgos.eliminarItem,

    tAccionNombre: listaAcciones.itemForm.nombre, setTAccionNombre: (v: string) => listaAcciones.actualizarCampoItem("nombre", v),
    tAccionDesc: listaAcciones.itemForm.descripcion || "", setTAccionDesc: (v: string) => listaAcciones.actualizarCampoItem("descripcion", v),
    tAccionBono: listaAcciones.itemForm.bonificadorAtaque, setTAccionBono: (v: string) => listaAcciones.actualizarCampoItem("bonificadorAtaque", v),
    tAccionDaño: listaAcciones.itemForm.daño || "", setTAccionDaño: (v: string) => listaAcciones.actualizarCampoItem("daño", v),
    tAccionUso: listaAcciones.itemForm.uso || "", setTAccionUso: (v: string) => listaAcciones.actualizarCampoItem("uso", v),
    accionEdicionIdx: listaAcciones.edicionIdx,
    agregarAccion: listaAcciones.agregarItem,
    iniciarEditarAccion: listaAcciones.iniciarEdicion,
    cancelarEditarAccion: listaAcciones.cancelarEdicion,
    eliminarAccionIdx: listaAcciones.eliminarItem,

    tReaccionNombre: listaReacciones.itemForm.nombre, setTReaccionNombre: (v: string) => listaReacciones.actualizarCampoItem("nombre", v),
    tReaccionDesc: listaReacciones.itemForm.descripcion || "", setTReaccionDesc: (v: string) => listaReacciones.actualizarCampoItem("descripcion", v),
    tReaccionUso: listaReacciones.itemForm.uso || "", setTReaccionUso: (v: string) => listaReacciones.actualizarCampoItem("uso", v),
    reaccionEdicionIdx: listaReacciones.edicionIdx,
    agregarReaccion: listaReacciones.agregarItem,
    iniciarEditarReaccion: listaReacciones.iniciarEdicion,
    cancelarEditarReaccion: listaReacciones.cancelarEdicion,
    eliminarReaccionIdx: listaReacciones.eliminarItem,

    tLegendariaNombre: listaLegendarias.itemForm.nombre, setTLegendariaNombre: (v: string) => listaLegendarias.actualizarCampoItem("nombre", v),
    tLegendariaDesc: listaLegendarias.itemForm.descripcion || "", setTLegendariaDesc: (v: string) => listaLegendarias.actualizarCampoItem("descripcion", v),
    tLegendariaUso: listaLegendarias.itemForm.uso || "", setTLegendariaUso: (v: string) => listaLegendarias.actualizarCampoItem("uso", v),
    legendariaEdicionIdx: listaLegendarias.edicionIdx,
    agregarLegendaria: listaLegendarias.agregarItem,
    iniciarEditarLegendaria: listaLegendarias.iniciarEdicion,
    cancelarEditarLegendaria: listaLegendarias.cancelarEdicion,
    eliminarLegendariaIdx: listaLegendarias.eliminarItem,

    tQNombre: listaQuickActions.itemForm.nombre, setTQNombre: (v: string) => listaQuickActions.actualizarCampoItem("nombre", v),
    tQBono: listaQuickActions.itemForm.bonificadorAtaque || "+0", setTQBono: (v: string) => listaQuickActions.actualizarCampoItem("bonificadorAtaque", v),
    tQDados: listaQuickActions.itemForm.dadosDaño || "1d6", setTQDados: (v: string) => listaQuickActions.actualizarCampoItem("dadosDaño", v),
    tQTipo: listaQuickActions.itemForm.tipoDaño || "fuerza", setTQTipo: (v: string) => listaQuickActions.actualizarCampoItem("tipoDaño", v),
    quickActionEdicionIdx: listaQuickActions.edicionIdx,
    agregarQuickAction: listaQuickActions.agregarItem,
    iniciarEditarQuickAction: listaQuickActions.iniciarEdicion,
    cancelarEditarQuickAction: listaQuickActions.cancelarEdicion,
    eliminarQuickActionIdx: listaQuickActions.eliminarItem,

    actualizarGeneral,
    actualizarCaracteristica,
    actualizarSalvacion,
    actualizarHabilidad,
    alternarCheckArray,
    limpiarFormulario,
    cargarCriatura,
    manejarGuardarCriatura
  };
}
