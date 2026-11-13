import { useState, useCallback } from "react";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { usarAccionesHomebrew, usarAccionesConfiguracion } from "@/almacen/selectores";
import {
  MonstruoBase,
  RasgoBase,
  AccionMonstruo,
  AccionRapida,
  VelocidadEstructurada,
  SentidosEstructurados
} from "@/tipos";
import { parsearVelocidad, parsearSentidos, sanearMonstruoSentidosYPasiva } from "@/almacen/sanitizacion";
import {
  desglosarAtaqueRapido,
  ComponenteDano,
  extraerDatosAtaqueParaAtaqueRapido,
  ParametrosExtraccionAtaque
} from "@/utiles/procesadorAtaques";
import { usarListaDinamica } from "./usarListaDinamica";

export const estadoInicialCriatura = {
  nombre: "",
  tipo: "Humanoide",
  ca: 10,
  caNotas: "",
  vidaMaxima: 10,
  vidaNotas: "",
  iniciativaBonificador: 0,
  velocidad: { caminar: 30, planea: false } as VelocidadEstructurada,
  sentidos: { percepcionPasiva: 10 } as SentidosEstructurados,
  tamaño: "",
  alineacion: "",
  idiomas: "",
  desafio: "1",
  fuente: "Manual de Monstruos",
  caracteristicas: { fuerza: 10, destreza: 10, constitucion: 10, inteligencia: 10, sabiduria: 10, carisma: 10 },
  salvaciones: {} as MonstruoBase["salvaciones"],
  habilidades: {} as MonstruoBase["habilidades"],
  vulnerabilidades: [] as string[],
  resistencias: [] as string[],
  inmunidadesDaño: [] as string[],
  inmunidadesCondicion: [] as string[],
  accionesRapidas: [] as AccionRapida[],
  rasgos: [] as RasgoBase[],
  acciones: [] as AccionMonstruo[],
  accionesAdicionales: [] as AccionMonstruo[],
  reacciones: [] as RasgoBase[],
  accionesLegendariasTotal: "3",
  accionesLegendarias: [] as RasgoBase[],
  equipo: "",
  tesoros: ""
};

type AccionFormulario = Omit<AccionMonstruo, "bonificadorAtaque"> & { bonificadorAtaque?: string };
const rasgoInicial: AccionFormulario = { nombre: "", descripcion: "", uso: "", recarga: "" };

const accionInicial: AccionFormulario = {
  nombre: "",
  descripcion: "",
  bonificadorAtaque: "",
  daño: "",
  uso: "",
  recarga: ""
};
const quickActionInicial: AccionRapida = {
  nombre: "",
  bonificadorAtaque: "+0",
  dadosDaño: "1d6",
  tipoDaño: "fuerza",
  recarga: "",
  uso: ""
};

function accionAFormulario(a: AccionMonstruo): AccionFormulario {
  return {
    nombre: a.nombre,
    descripcion: a.descripcion,
    bonificadorAtaque: a.bonificadorAtaque !== undefined ? String(a.bonificadorAtaque) : "",
    daño: a.daño || "",
    uso: a.uso || "",
    recarga: a.recarga || ""
  };
}

function accionAModelo(a: AccionFormulario): AccionMonstruo {
  return {
    nombre: a.nombre,
    descripcion: a.descripcion,
    bonificadorAtaque: a.bonificadorAtaque ? parseInt(a.bonificadorAtaque, 10) : undefined,
    daño: a.daño || undefined,
    uso: a.uso || undefined,
    recarga: a.recarga || undefined
  };
}

function datosDeCriatura(m: MonstruoBase): typeof estadoInicialCriatura {
  return {
    nombre: m.nombre,
    tipo: m.tipo || "Humanoide",
    ca: m.ca,
    caNotas: m.caNotas || "",
    vidaMaxima: m.vidaMaxima,
    vidaNotas: m.vidaNotas || "",
    iniciativaBonificador: m.iniciativaBonificador || 0,
    velocidad: typeof m.velocidad === "string"
      ? parsearVelocidad(m.velocidad)
      : (m.velocidad || { caminar: 30, planea: false }),
    sentidos: typeof m.sentidos === "string"
      ? parsearSentidos(m.sentidos)
      : (m.sentidos || { percepcionPasiva: 10 }),
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
  };
}

export function usarFormularioCriatura(idEnEdicion: string | null, alGuardarExitoso: () => void) {
  const { agregarMonstruoHomebrew, actualizarMonstruoHomebrew } = usarAccionesHomebrew();
  const { agregarNotificacion } = usarAccionesConfiguracion();

  const [monstruoForm, setMonstruoForm] = useState<Omit<MonstruoBase, "id" | "vidaActual">>(() => {
    const criatura = usarAlmacenDM.getState().baseDatosMonstruos.find(m => m.id === idEnEdicion);
    return criatura ? datosDeCriatura(criatura) : estadoInicialCriatura;
  });
  const [subPestanaCriatura, setSubPestanaCriatura] = useState<"general" | "atributos" | "pericias" | "defensas" | "listas">("general");
  const [subDefensas, setSubDefensas] = useState<"inmunidades" | "resistencias" | "vulnerabilidades" | "condiciones">("inmunidades");

  // --- Helpers para actualizar las listas en el monstruoForm ---
  const setRasgosForm = useCallback((nuevosRasgos: RasgoBase[]) => {
    setMonstruoForm((prev) => ({ ...prev, rasgos: nuevosRasgos }));
  }, []);

  const setAccionesForm = useCallback((nuevasAccionesRaw: AccionFormulario[]) => {
    const accionesSaneadas = nuevasAccionesRaw.map(accionAModelo);
    setMonstruoForm((prev) => ({ ...prev, acciones: accionesSaneadas }));
  }, []);

  const setAccionesAdicionalesForm = useCallback((nuevasAccionesRaw: AccionFormulario[]) => {
    const accionesSaneadas = nuevasAccionesRaw.map(accionAModelo);
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
  const accionesRaw = (monstruoForm.acciones || []).map(accionAFormulario);
  const listaAcciones = usarListaDinamica(accionInicial, setAccionesForm, accionesRaw);

  const accionesAdicionalesRaw = (monstruoForm.accionesAdicionales || []).map(accionAFormulario);
  const listaAccionesAdicionales = usarListaDinamica(accionInicial, setAccionesAdicionalesForm, accionesAdicionalesRaw);

  const listaReacciones = usarListaDinamica(rasgoInicial, setReaccionesForm, monstruoForm.reacciones || []);
  const listaLegendarias = usarListaDinamica(rasgoInicial, setLegendariasForm, monstruoForm.accionesLegendarias || []);
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
      tipoDaño: tiposCombinados,
      uso: listaQuickActions.itemForm.uso?.trim() || undefined,
      recarga: listaQuickActions.itemForm.recarga?.trim() || undefined
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

  const preRellenarAtaqueRapido = useCallback((accion: ParametrosExtraccionAtaque) => {
    if (!accion.nombre?.trim() && !accion.daño?.trim() && !accion.descripcion?.trim()) {
      agregarNotificacion("No hay datos suficientes del ataque para pre-rellenar", "advertencia");
      return;
    }

    const extraido = extraerDatosAtaqueParaAtaqueRapido(accion);

    listaQuickActions.actualizarCampoItem("nombre", extraido.nombre);
    listaQuickActions.actualizarCampoItem("bonificadorAtaque", extraido.bonificadorAtaque);
    listaQuickActions.actualizarCampoItem("dadosDaño", extraido.dadosDaño);
    listaQuickActions.actualizarCampoItem("tipoDaño", extraido.tipoDaño);
    setDanyosExtraQA(extraido.danosAdicionales);

    if (listaQuickActions.edicionIdx !== null) {
      listaQuickActions.setEdicionIdx(null);
    }

    agregarNotificacion(
      `Ataque rápido pre-rellenado con "${extraido.nombre}". Puedes revisarlo y pulsar "+" para agregarlo.`,
      "info"
    );
  }, [listaQuickActions, agregarNotificacion]);

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
    }) as MonstruoBase;

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
    
    listaRasgos,
    listaAcciones,
    listaAccionesAdicionales,
    listaReacciones,
    listaLegendarias,
    listaQuickActions,
    danyosExtraQA,
    agregarDanoExtraQA,
    actualizarDanoExtraQA,
    eliminarDanoExtraQA,
    agregarQuickAction: agregarQuickActionPersonalizado,
    iniciarEditarQuickAction,
    cancelarEditarQuickAction,
    preRellenarAtaqueRapido,

    actualizarGeneral,
    actualizarCaracteristica,
    actualizarSalvacion,
    actualizarHabilidad,
    alternarCheckArray,
    manejarGuardarCriatura
  };
}
