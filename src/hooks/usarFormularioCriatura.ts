import { useState, useCallback } from "react";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { MonstruoBase, RasgoBase, AccionMonstruo, AccionRapida } from "@/tipos";
import { parsearVelocidad, parsearSentidos, formatearVelocidad, formatearSentidos, sanearMonstruoSentidosYPasiva } from "@/almacen/sanitizacion";
import { desglosarAtaqueRapido, ComponenteDano } from "@/utiles/procesadorAtaques";
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
  tamaño: "",
  alineacion: "",
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
  accionesAdicionales: [],
  reacciones: [],
  accionesLegendariasTotal: "3",
  accionesLegendarias: [],
  equipo: "",
  tesoros: ""
};

const rasgoInicial: RasgoBase = { nombre: "", descripcion: "", uso: "", recarga: "" };
const accionInicial: Omit<AccionMonstruo, "bonificadorAtaque"> & { bonificadorAtaque: string } = {
  nombre: "",
  descripcion: "",
  bonificadorAtaque: "",
  daño: "",
  uso: "",
  recarga: ""
};
const accionAdicionalInicial: Omit<AccionMonstruo, "bonificadorAtaque"> & { bonificadorAtaque: string } = {
  nombre: "",
  descripcion: "",
  bonificadorAtaque: "",
  daño: "",
  uso: "",
  recarga: ""
};
const reaccionInicial: RasgoBase = { nombre: "", descripcion: "", uso: "", recarga: "" };
const legendariaInicial: RasgoBase = { nombre: "", descripcion: "", uso: "", recarga: "" };
const quickActionInicial: AccionRapida = {
  nombre: "",
  bonificadorAtaque: "+0",
  dadosDaño: "1d6",
  tipoDaño: "fuerza",
  recarga: "",
  uso: ""
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
      uso: a.uso || undefined,
      recarga: a.recarga || a.uso || undefined
    }));
    setMonstruoForm((prev) => ({ ...prev, acciones: accionesSaneadas }));
  }, []);

  const setAccionesAdicionalesForm = useCallback((nuevasAccionesRaw: Array<Omit<AccionMonstruo, "bonificadorAtaque"> & { bonificadorAtaque: string }>) => {
    const accionesSaneadas = nuevasAccionesRaw.map((a) => ({
      nombre: a.nombre,
      descripcion: a.descripcion,
      bonificadorAtaque: a.bonificadorAtaque ? parseInt(a.bonificadorAtaque, 10) : undefined,
      daño: a.daño || undefined,
      uso: a.uso || undefined,
      recarga: a.recarga || a.uso || undefined
    }));
    setMonstruoForm((prev) => ({ ...prev, accionesAdicionales: accionesSaneadas }));
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
    uso: a.uso || a.recarga || "",
    recarga: a.recarga || a.uso || ""
  }));
  const listaAcciones = usarListaDinamica(accionInicial, setAccionesForm, accionesRaw);

  const accionesAdicionalesRaw = (monstruoForm.accionesAdicionales || []).map((a) => ({
    nombre: a.nombre,
    descripcion: a.descripcion,
    bonificadorAtaque: a.bonificadorAtaque !== undefined ? String(a.bonificadorAtaque) : "",
    daño: a.daño || "",
    uso: a.uso || a.recarga || "",
    recarga: a.recarga || a.uso || ""
  }));
  const listaAccionesAdicionales = usarListaDinamica(accionAdicionalInicial, setAccionesAdicionalesForm, accionesAdicionalesRaw);

  const listaReacciones = usarListaDinamica(reaccionInicial, setReaccionesForm, monstruoForm.reacciones || []);
  const listaLegendarias = usarListaDinamica(legendariaInicial, setLegendariasForm, monstruoForm.accionesLegendarias || []);
  const listaQuickActions = usarListaDinamica(quickActionInicial, setQuickActionsForm, monstruoForm.accionesRapidas || []);

  // --- Manejo reactivo de múltiples daños en Ataques Rápidos ---
  const [danyosExtraQA, setDanyosExtraQA] = useState<ComponenteDano[]>([]);

  const agregarDanoExtraQA = useCallback(() => {
    setDanyosExtraQA((prev) => [...prev, { dados: "1d6", tipo: "fuego" }]);
  }, []);

  const actualizarDanoExtraQA = useCallback((index: number, campo: keyof ComponenteDano, valor: string) => {
    setDanyosExtraQA((prev) => {
      const copia = [...prev];
      if (copia[index]) {
        copia[index] = { ...copia[index], [campo]: valor };
      }
      return copia;
    });
  }, []);

  const eliminarDanoExtraQA = useCallback((index: number) => {
    setDanyosExtraQA((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const iniciarEditarQuickAction = useCallback((idx: number) => {
    const qa = (monstruoForm.accionesRapidas || [])[idx];
    if (!qa) return;
    listaQuickActions.iniciarEdicion(idx);
    const desglosados = desglosarAtaqueRapido(qa.dadosDaño, qa.tipoDaño);
    if (desglosados.length > 0) {
      listaQuickActions.actualizarCampoItem("dadosDaño", desglosados[0].dados);
      listaQuickActions.actualizarCampoItem("tipoDaño", desglosados[0].tipo);
      setDanyosExtraQA(desglosados.slice(1));
    } else {
      setDanyosExtraQA([]);
    }
  }, [monstruoForm.accionesRapidas, listaQuickActions]);

  const cancelarEditarQuickAction = useCallback(() => {
    listaQuickActions.cancelarEdicion();
    setDanyosExtraQA([]);
  }, [listaQuickActions]);

  const agregarQuickActionPersonalizado = useCallback(() => {
    if (!listaQuickActions.itemForm.nombre.trim()) return;

    const primerDado = (listaQuickActions.itemForm.dadosDaño || "1d6").trim();
    const primerTipo = (listaQuickActions.itemForm.tipoDaño || "fuerza").trim();

    const dadosCombinados = [primerDado, ...danyosExtraQA.map((d) => d.dados.trim()).filter(Boolean)].join(" / ");
    const tiposCombinados = [primerTipo, ...danyosExtraQA.map((d) => d.tipo.trim()).filter(Boolean)].join(" / ");

    const itemSanetizado: AccionRapida = {
      nombre: listaQuickActions.itemForm.nombre.trim(),
      bonificadorAtaque: listaQuickActions.itemForm.bonificadorAtaque || "+0",
      dadosDaño: dadosCombinados,
      tipoDaño: tiposCombinados
    };

    const listaActual = monstruoForm.accionesRapidas || [];
    if (listaQuickActions.edicionIdx !== null) {
      const nuevaLista = [...listaActual];
      nuevaLista[listaQuickActions.edicionIdx] = itemSanetizado;
      setQuickActionsForm(nuevaLista);
      listaQuickActions.setEdicionIdx(null);
    } else {
      setQuickActionsForm([...listaActual, itemSanetizado]);
    }

    listaQuickActions.setItemForm(quickActionInicial);
    setDanyosExtraQA([]);
  }, [listaQuickActions, danyosExtraQA, monstruoForm.accionesRapidas, setQuickActionsForm]);

  const limpiarFormulario = useCallback(() => {
    setMonstruoForm(estadoInicialCriatura);
    setSubPestanaCriatura("general");
    setSubDefensas("inmunidades");
    listaRasgos.limpiarItemForm();
    listaAcciones.limpiarItemForm();
    listaAccionesAdicionales.limpiarItemForm();
    listaReacciones.limpiarItemForm();
    listaLegendarias.limpiarItemForm();
    listaQuickActions.limpiarItemForm();
    setDanyosExtraQA([]);
  }, [
    listaRasgos.limpiarItemForm,
    listaAcciones.limpiarItemForm,
    listaAccionesAdicionales.limpiarItemForm,
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
      tamaño: m.tamaño || "",
      alineacion: m.alineacion || "",
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
      accionesAdicionales: m.accionesAdicionales || [],
      reacciones: m.reacciones || [],
      accionesLegendariasTotal: m.accionesLegendariasTotal !== undefined && m.accionesLegendariasTotal !== null ? String(m.accionesLegendariasTotal) : "3",
      accionesLegendarias: m.accionesLegendarias || [],
      equipo: m.equipo || "",
      tesoros: m.tesoros || ""
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

    const monstruoParaGuardar = sanearMonstruoSentidosYPasiva({
      ...monstruoForm,
      id: idEnEdicion || "",
      velocidad: velocidadEstructurada,
      sentidos: sentidosEstructurados
    } as unknown as MonstruoBase);

    if (idEnEdicion) {
      actualizarMonstruoHomebrew(idEnEdicion, monstruoParaGuardar);
      agregarNotificacion("¡Criatura Homebrew actualizada con éxito!", "exito");
    } else {
      agregarMonstruoHomebrew({
        ...monstruoParaGuardar,
        vidaActual: monstruoForm.vidaMaxima
      });
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

    tAccionAdicionalNombre: listaAccionesAdicionales.itemForm.nombre, setTAccionAdicionalNombre: (v: string) => listaAccionesAdicionales.actualizarCampoItem("nombre", v),
    tAccionAdicionalDesc: listaAccionesAdicionales.itemForm.descripcion || "", setTAccionAdicionalDesc: (v: string) => listaAccionesAdicionales.actualizarCampoItem("descripcion", v),
    tAccionAdicionalBono: listaAccionesAdicionales.itemForm.bonificadorAtaque, setTAccionAdicionalBono: (v: string) => listaAccionesAdicionales.actualizarCampoItem("bonificadorAtaque", v),
    tAccionAdicionalDaño: listaAccionesAdicionales.itemForm.daño || "", setTAccionAdicionalDaño: (v: string) => listaAccionesAdicionales.actualizarCampoItem("daño", v),
    tAccionAdicionalUso: listaAccionesAdicionales.itemForm.uso || "", setTAccionAdicionalUso: (v: string) => listaAccionesAdicionales.actualizarCampoItem("uso", v),
    accionAdicionalEdicionIdx: listaAccionesAdicionales.edicionIdx,
    agregarAccionAdicional: listaAccionesAdicionales.agregarItem,
    iniciarEditarAccionAdicional: listaAccionesAdicionales.iniciarEdicion,
    cancelarEditarAccionAdicional: listaAccionesAdicionales.cancelarEdicion,
    eliminarAccionAdicionalIdx: listaAccionesAdicionales.eliminarItem,

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
    danyosExtraQA,
    agregarDanoExtraQA,
    actualizarDanoExtraQA,
    eliminarDanoExtraQA,
    quickActionEdicionIdx: listaQuickActions.edicionIdx,
    agregarQuickAction: agregarQuickActionPersonalizado,
    iniciarEditarQuickAction,
    cancelarEditarQuickAction,
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
