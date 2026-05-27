import { useState } from "react";
import { usarAlmacenDM } from "../almacen/usarAlmacenDM";
import { MonstruoBase } from "../tipos";

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

export function usarFormularioCriatura(idEnEdicion: string | null, alGuardarExitoso: () => void) {
  const { agregarMonstruoHomebrew, actualizarMonstruoHomebrew } = usarAlmacenDM();

  const [monstruoForm, setMonstruoForm] = useState<Omit<MonstruoBase, "id" | "vidaActual">>(estadoInicialCriatura);
  const [subPestanaCriatura, setSubPestanaCriatura] = useState<"general" | "atributos" | "pericias" | "defensas" | "listas">("general");
  const [subDefensas, setSubDefensas] = useState<"inmunidades" | "resistencias" | "vulnerabilidades" | "condiciones">("inmunidades");

  // --- Estados para items dinámicos locales ---
  const [tRasgoNombre, setTRasgoNombre] = useState("");
  const [tRasgoDesc, setTRasgoDesc] = useState("");
  const [tRasgoUso, setTRasgoUso] = useState("");

  const [tAccionNombre, setTAccionNombre] = useState("");
  const [tAccionDesc, setTAccionDesc] = useState("");
  const [tAccionBono, setTAccionBono] = useState("");
  const [tAccionDaño, setTAccionDaño] = useState("");
  const [tAccionUso, setTAccionUso] = useState("");

  const [tReaccionNombre, setTReaccionNombre] = useState("");
  const [tReaccionDesc, setTReaccionDesc] = useState("");
  const [tReaccionUso, setTReaccionUso] = useState("");

  const [tLegendariaNombre, setTLegendariaNombre] = useState("");
  const [tLegendariaDesc, setTLegendariaDesc] = useState("");
  const [tLegendariaUso, setTLegendariaUso] = useState("");

  const [tQNombre, setTQNombre] = useState("");
  const [tQBono, setTQBono] = useState("+0");
  const [tQDados, setTQDados] = useState("1d6");
  const [tQTipo, setTQTipo] = useState("fuerza");

  // --- Estados de Índices para Edición de Items Dinámicos ---
  const [rasgoEdicionIdx, setRasgoEdicionIdx] = useState<number | null>(null);
  const [accionEdicionIdx, setAccionEdicionIdx] = useState<number | null>(null);
  const [reaccionEdicionIdx, setReaccionEdicionIdx] = useState<number | null>(null);
  const [legendariaEdicionIdx, setLegendariaEdicionIdx] = useState<number | null>(null);
  const [quickActionEdicionIdx, setQuickActionEdicionIdx] = useState<number | null>(null);

  const limpiarFormulario = () => {
    setMonstruoForm(estadoInicialCriatura);
    setSubPestanaCriatura("general");
    setSubDefensas("inmunidades");
    setTRasgoNombre("");
    setTRasgoDesc("");
    setTRasgoUso("");
    setTAccionNombre("");
    setTAccionDesc("");
    setTAccionBono("");
    setTAccionDaño("");
    setTAccionUso("");
    setTReaccionNombre("");
    setTReaccionDesc("");
    setTReaccionUso("");
    setTLegendariaNombre("");
    setTLegendariaDesc("");
    setTLegendariaUso("");
    setTQNombre("");
    setTQBono("+0");
    setTQDados("1d6");
    setRasgoEdicionIdx(null);
    setAccionEdicionIdx(null);
    setReaccionEdicionIdx(null);
    setLegendariaEdicionIdx(null);
    setQuickActionEdicionIdx(null);
  };

  const cargarCriatura = (m: MonstruoBase) => {
    setMonstruoForm({
      nombre: m.nombre,
      tipo: m.tipo || "Humanoide",
      ca: m.ca,
      caNotas: m.caNotas || "",
      vidaMaxima: m.vidaMaxima,
      vidaNotas: m.vidaNotas || "",
      iniciativaBonificador: m.iniciativaBonificador || 0,
      velocidad: m.velocidad || "30 pies",
      sentidos: m.sentidos || "",
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
  };

  const actualizarGeneral = (campo: string, valor: any) => {
    setMonstruoForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const actualizarCaracteristica = (caract: string, valor: number) => {
    setMonstruoForm((prev) => ({
      ...prev,
      caracteristicas: { ...prev.caracteristicas, [caract]: valor }
    }));
  };

  const actualizarSalvacion = (caract: string, valor: string) => {
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
  };

  const actualizarHabilidad = (hab: string, valor: string) => {
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
  };

  const alternarCheckArray = (campo: "vulnerabilidades" | "resistencias" | "inmunidadesDaño" | "inmunidadesCondicion", valor: string) => {
    setMonstruoForm((prev) => {
      const arr = prev[campo] || [];
      const nuevoArr = arr.includes(valor)
        ? arr.filter((v) => v !== valor)
        : [...arr, valor];
      return { ...prev, [campo]: nuevoArr };
    });
  };

  // --- Métodos de agregación de items dinámicos ---
  const agregarRasgo = () => {
    if (!tRasgoNombre.trim() || !tRasgoDesc.trim()) return;
    
    if (rasgoEdicionIdx !== null) {
      setMonstruoForm((prev) => {
        const nuevosRasgos = [...(prev.rasgos || [])];
        nuevosRasgos[rasgoEdicionIdx] = {
          nombre: tRasgoNombre.trim(),
          descripcion: tRasgoDesc.trim(),
          uso: tRasgoUso.trim() || undefined
        };
        return { ...prev, rasgos: nuevosRasgos };
      });
      setRasgoEdicionIdx(null);
    } else {
      setMonstruoForm((prev) => ({
        ...prev,
        rasgos: [...(prev.rasgos || []), { nombre: tRasgoNombre.trim(), descripcion: tRasgoDesc.trim(), uso: tRasgoUso.trim() || undefined }]
      }));
    }
    setTRasgoNombre("");
    setTRasgoDesc("");
    setTRasgoUso("");
  };

  const iniciarEditarRasgo = (idx: number) => {
    const r = monstruoForm.rasgos?.[idx];
    if (!r) return;
    setTRasgoNombre(r.nombre);
    setTRasgoDesc(r.descripcion);
    setTRasgoUso(r.uso || "");
    setRasgoEdicionIdx(idx);
  };

  const cancelarEditarRasgo = () => {
    setTRasgoNombre("");
    setTRasgoDesc("");
    setTRasgoUso("");
    setRasgoEdicionIdx(null);
  };

  const eliminarRasgoIdx = (idx: number) => {
    setMonstruoForm((prev) => ({
      ...prev,
      rasgos: prev.rasgos.filter((_, i) => i !== idx)
    }));
    if (rasgoEdicionIdx === idx) {
      cancelarEditarRasgo();
    } else if (rasgoEdicionIdx !== null && rasgoEdicionIdx > idx) {
      setRasgoEdicionIdx(rasgoEdicionIdx - 1);
    }
  };

  const agregarAccion = () => {
    if (!tAccionNombre.trim() || !tAccionDesc.trim()) return;
    
    if (accionEdicionIdx !== null) {
      setMonstruoForm((prev) => {
        const nuevasAcciones = [...(prev.acciones || [])];
        nuevasAcciones[accionEdicionIdx] = {
          nombre: tAccionNombre.trim(),
          descripcion: tAccionDesc.trim(),
          bonificadorAtaque: tAccionBono ? parseInt(tAccionBono, 10) : undefined,
          daño: tAccionDaño.trim() || undefined,
          uso: tAccionUso.trim() || undefined
        };
        return { ...prev, acciones: nuevasAcciones };
      });
      setAccionEdicionIdx(null);
    } else {
      setMonstruoForm((prev) => ({
        ...prev,
        acciones: [...(prev.acciones || []), {
          nombre: tAccionNombre.trim(),
          descripcion: tAccionDesc.trim(),
          bonificadorAtaque: tAccionBono ? parseInt(tAccionBono, 10) : undefined,
          daño: tAccionDaño.trim() || undefined,
          uso: tAccionUso.trim() || undefined
        }]
      }));
    }
    setTAccionNombre("");
    setTAccionDesc("");
    setTAccionBono("");
    setTAccionDaño("");
    setTAccionUso("");
  };

  const iniciarEditarAccion = (idx: number) => {
    const a = monstruoForm.acciones?.[idx];
    if (!a) return;
    setTAccionNombre(a.nombre);
    setTAccionDesc(a.descripcion);
    setTAccionBono(a.bonificadorAtaque ? String(a.bonificadorAtaque) : "");
    setTAccionDaño(a.daño || "");
    setTAccionUso(a.uso || "");
    setAccionEdicionIdx(idx);
  };

  const cancelarEditarAccion = () => {
    setTAccionNombre("");
    setTAccionDesc("");
    setTAccionBono("");
    setTAccionDaño("");
    setTAccionUso("");
    setAccionEdicionIdx(null);
  };

  const eliminarAccionIdx = (idx: number) => {
    setMonstruoForm((prev) => ({
      ...prev,
      acciones: prev.acciones.filter((_, i) => i !== idx)
    }));
    if (accionEdicionIdx === idx) {
      cancelarEditarAccion();
    } else if (accionEdicionIdx !== null && accionEdicionIdx > idx) {
      setAccionEdicionIdx(accionEdicionIdx - 1);
    }
  };

  const agregarReaccion = () => {
    if (!tReaccionNombre.trim() || !tReaccionDesc.trim()) return;
    
    if (reaccionEdicionIdx !== null) {
      setMonstruoForm((prev) => {
        const nuevasReacciones = [...(prev.reacciones || [])];
        nuevasReacciones[reaccionEdicionIdx] = {
          nombre: tReaccionNombre.trim(),
          descripcion: tReaccionDesc.trim(),
          uso: tReaccionUso.trim() || undefined
        };
        return { ...prev, reacciones: nuevasReacciones };
      });
      setReaccionEdicionIdx(null);
    } else {
      setMonstruoForm((prev) => ({
        ...prev,
        reacciones: [...(prev.reacciones || []), { nombre: tReaccionNombre.trim(), descripcion: tReaccionDesc.trim(), uso: tReaccionUso.trim() || undefined }]
      }));
    }
    setTReaccionNombre("");
    setTReaccionDesc("");
    setTReaccionUso("");
  };

  const iniciarEditarReaccion = (idx: number) => {
    const r = monstruoForm.reacciones?.[idx];
    if (!r) return;
    setTReaccionNombre(r.nombre);
    setTReaccionDesc(r.descripcion);
    setTReaccionUso(r.uso || "");
    setReaccionEdicionIdx(idx);
  };

  const cancelarEditarReaccion = () => {
    setTReaccionNombre("");
    setTReaccionDesc("");
    setTReaccionUso("");
    setReaccionEdicionIdx(null);
  };

  const eliminarReaccionIdx = (idx: number) => {
    setMonstruoForm((prev) => ({
      ...prev,
      reacciones: (prev.reacciones || []).filter((_, i) => i !== idx)
    }));
    if (reaccionEdicionIdx === idx) {
      cancelarEditarReaccion();
    } else if (reaccionEdicionIdx !== null && reaccionEdicionIdx > idx) {
      setReaccionEdicionIdx(reaccionEdicionIdx - 1);
    }
  };

  const agregarLegendaria = () => {
    if (!tLegendariaNombre.trim() || !tLegendariaDesc.trim()) return;
    
    if (legendariaEdicionIdx !== null) {
      setMonstruoForm((prev) => {
        const nuevasLeg = [...(prev.accionesLegendarias || [])];
        nuevasLeg[legendariaEdicionIdx] = {
          nombre: tLegendariaNombre.trim(),
          descripcion: tLegendariaDesc.trim(),
          uso: tLegendariaUso.trim() || undefined
        };
        return { ...prev, accionesLegendarias: nuevasLeg };
      });
      setLegendariaEdicionIdx(null);
    } else {
      setMonstruoForm((prev) => ({
        ...prev,
        accionesLegendarias: [...(prev.accionesLegendarias || []), { nombre: tLegendariaNombre.trim(), descripcion: tLegendariaDesc.trim(), uso: tLegendariaUso.trim() || undefined }]
      }));
    }
    setTLegendariaNombre("");
    setTLegendariaDesc("");
    setTLegendariaUso("");
  };

  const iniciarEditarLegendaria = (idx: number) => {
    const l = monstruoForm.accionesLegendarias?.[idx];
    if (!l) return;
    setTLegendariaNombre(l.nombre);
    setTLegendariaDesc(l.descripcion);
    setTLegendariaUso(l.uso || "");
    setLegendariaEdicionIdx(idx);
  };

  const cancelarEditarLegendaria = () => {
    setTLegendariaNombre("");
    setTLegendariaDesc("");
    setTLegendariaUso("");
    setLegendariaEdicionIdx(null);
  };

  const eliminarLegendariaIdx = (idx: number) => {
    setMonstruoForm((prev) => ({
      ...prev,
      accionesLegendarias: (prev.accionesLegendarias || []).filter((_, i) => i !== idx)
    }));
    if (legendariaEdicionIdx === idx) {
      cancelarEditarLegendaria();
    } else if (legendariaEdicionIdx !== null && legendariaEdicionIdx > idx) {
      setLegendariaEdicionIdx(legendariaEdicionIdx - 1);
    }
  };

  const agregarQuickAction = () => {
    if (!tQNombre.trim()) return;
    
    if (quickActionEdicionIdx !== null) {
      setMonstruoForm((prev) => {
        const nuevasQA = [...(prev.accionesRapidas || [])];
        nuevasQA[quickActionEdicionIdx] = {
          nombre: tQNombre.trim(),
          bonificadorAtaque: tQBono,
          dadosDaño: tQDados,
          tipoDaño: tQTipo
        };
        return { ...prev, accionesRapidas: nuevasQA };
      });
      setQuickActionEdicionIdx(null);
    } else {
      setMonstruoForm((prev) => ({
        ...prev,
        accionesRapidas: [...(prev.accionesRapidas || []), {
          nombre: tQNombre.trim(),
          bonificadorAtaque: tQBono,
          dadosDaño: tQDados,
          tipoDaño: tQTipo
        }]
      }));
    }
    setTQNombre("");
    setTQBono("+0");
    setTQDados("1d6");
  };

  const iniciarEditarQuickAction = (idx: number) => {
    const qa = monstruoForm.accionesRapidas?.[idx];
    if (!qa) return;
    setTQNombre(qa.nombre);
    setTQBono(qa.bonificadorAtaque || "+0");
    setTQDados(qa.dadosDaño || "1d6");
    setTQTipo(qa.tipoDaño || "cortante");
    setQuickActionEdicionIdx(idx);
  };

  const cancelarEditarQuickAction = () => {
    setTQNombre("");
    setTQBono("+0");
    setTQDados("1d6");
    setQuickActionEdicionIdx(null);
  };

  const eliminarQuickActionIdx = (idx: number) => {
    setMonstruoForm((prev) => ({
      ...prev,
      accionesRapidas: (prev.accionesRapidas || []).filter((_, i) => i !== idx)
    }));
  };

  const manejarGuardarCriatura = (e: React.FormEvent) => {
    e.preventDefault();
    if (!monstruoForm.nombre.trim()) {
      alert("El nombre de la criatura es requerido");
      return;
    }

    if (idEnEdicion) {
      actualizarMonstruoHomebrew(idEnEdicion, monstruoForm);
      alert("¡Criatura Homebrew actualizada con éxito!");
    } else {
      agregarMonstruoHomebrew({
        ...monstruoForm,
        vidaActual: monstruoForm.vidaMaxima
      });
      alert("¡Criatura Homebrew guardada con éxito!");
    }

    limpiarFormulario();
    alGuardarExitoso();
  };

  return {
    monstruoForm,
    subPestanaCriatura, setSubPestanaCriatura,
    subDefensas, setSubDefensas,
    tRasgoNombre, setTRasgoNombre,
    tRasgoDesc, setTRasgoDesc,
    tRasgoUso, setTRasgoUso,
    tAccionNombre, setTAccionNombre,
    tAccionDesc, setTAccionDesc,
    tAccionBono, setTAccionBono,
    tAccionDaño, setTAccionDaño,
    tAccionUso, setTAccionUso,
    tReaccionNombre, setTReaccionNombre,
    tReaccionDesc, setTReaccionDesc,
    tReaccionUso, setTReaccionUso,
    tLegendariaNombre, setTLegendariaNombre,
    tLegendariaDesc, setTLegendariaDesc,
    tLegendariaUso, setTLegendariaUso,
    tQNombre, setTQNombre,
    tQBono, setTQBono,
    tQDados, setTQDados,
    tQTipo, setTQTipo,
    rasgoEdicionIdx,
    accionEdicionIdx,
    reaccionEdicionIdx,
    legendariaEdicionIdx,
    quickActionEdicionIdx,
    actualizarGeneral,
    actualizarCaracteristica,
    actualizarSalvacion,
    actualizarHabilidad,
    alternarCheckArray,
    agregarRasgo,
    iniciarEditarRasgo,
    cancelarEditarRasgo,
    eliminarRasgoIdx,
    agregarAccion,
    iniciarEditarAccion,
    cancelarEditarAccion,
    eliminarAccionIdx,
    agregarReaccion,
    iniciarEditarReaccion,
    cancelarEditarReaccion,
    eliminarReaccionIdx,
    agregarLegendaria,
    iniciarEditarLegendaria,
    cancelarEditarLegendaria,
    eliminarLegendariaIdx,
    agregarQuickAction,
    iniciarEditarQuickAction,
    cancelarEditarQuickAction,
    eliminarQuickActionIdx,
    limpiarFormulario,
    cargarCriatura,
    manejarGuardarCriatura
  };
}
