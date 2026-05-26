import React, { useState } from "react";
import { usarAlmacenDM, ObjetoHomebrew } from "../almacen/usarAlmacenDM";
import { MonstruoBase, HechizoBase, MONSTRUOS_INICIALES, HECHIZOS_INICIALES } from "../utiles/datosIniciales";
import { Plus, Trash2, Shield, Heart, Sparkles, BookOpen, Swords, Edit2, X, Clock, MapPin, Layers, Coins, Scale } from "lucide-react";

const TIPOS_DAÑO_DND = [
  "ácido", "adamantina", "contundente", "contundente no mágico",
  "cortante", "cortante no mágico", "fuerza", "frío", "fuego",
  "mágico", "necrótico", "perforante", "perforante no mágico",
  "plata", "psíquico", "radiante", "relámpago", "trueno", "veneno"
];

const CONDICIONES_DND = [
  "agarrado", "apresado", "asustado", "aturdido", "cansancio",
  "cegado", "derribado", "ensordecido", "envenenado", "hechizado",
  "incapacitado", "inconsciente", "invisible", "paralizado", "petrificado"
];

const CLASES_DND = [
  "Bardo", "Brujo", "Clérigo", "Druida", "Explorador", "Hechicero", "Mago", "Paladín", "Artífice"
];

const HABILIDADES_LISTA = [
  { clave: "acrobacias", nombre: "Acrobacias" },
  { clave: "manejoAnimales", nombre: "Manejo Animales" },
  { clave: "arcanos", nombre: "Arcanos" },
  { clave: "atletismo", nombre: "Atletismo" },
  { clave: "engaño", nombre: "Engaño" },
  { clave: "historia", nombre: "Historia" },
  { clave: "perspicacia", nombre: "Perspicacia" },
  { clave: "intimidacion", nombre: "Intimidación" },
  { clave: "investigacion", nombre: "Investigación" },
  { clave: "medicina", nombre: "Medicina" },
  { clave: "naturaleza", nombre: "Naturaleza" },
  { clave: "percepcion", nombre: "Percepción" },
  { clave: "interpretacion", nombre: "Interpretación" },
  { clave: "persuasion", nombre: "Persuasión" },
  { clave: "religion", nombre: "Religión" },
  { clave: "juegoManos", nombre: "Juego de Manos" },
  { clave: "sigilo", nombre: "Sigilo" },
  { clave: "supervivencia", nombre: "Supervivencia" }
];

const CARACTERISTICAS_CLAVES = [
  { clave: "fuerza", etiqueta: "FUE" },
  { clave: "destreza", etiqueta: "DES" },
  { clave: "constitucion", etiqueta: "CON" },
  { clave: "inteligencia", etiqueta: "INT" },
  { clave: "sabiduria", etiqueta: "SAB" },
  { clave: "carisma", etiqueta: "CAR" }
];

/** Calcula el número de filas necesarias para mostrar todo el texto sin scroll */
const calcFilas = (valor: string, minFilas = 2, maxFilas = 20): number => {
  if (!valor) return minFilas;
  const lineas = valor.split("\n").length;
  const porLongitud = Math.ceil(valor.length / 80);
  return Math.min(maxFilas, Math.max(minFilas, lineas, porLongitud));
};

export const CreadorHomebrew: React.FC = () => {
  const {
    baseDatosMonstruos,
    baseDatosHechizos,
    objetosHomebrew,
    agregarMonstruoHomebrew,
    agregarHechizoHomebrew,
    agregarObjetoHomebrew,
    actualizarMonstruoHomebrew,
    actualizarHechizoHomebrew,
    actualizarObjetoHomebrew,
    eliminarMonstruoHomebrew,
    eliminarHechizoHomebrew,
    eliminarObjetoHomebrew,
    modoHomebrew,
    establecerModoHomebrew
  } = usarAlmacenDM();

  const [tipoHomebrew, setTipoHomebrew] = useState<"criatura" | "hechizo" | "objeto">("criatura");
  const [idEnEdicion, setIdEnEdicion] = useState<string | null>(null);
  const [idObjetoDetalle, setIdObjetoDetalle] = useState<string | null>(null);
  const [idHechizoDetalleCreador, setIdHechizoDetalleCreador] = useState<string | null>(null);

  // --- Sub-navegación local del formulario de Criaturas ---
  const [subPestanaCriatura, setSubPestanaCriatura] = useState<"general" | "atributos" | "pericias" | "defensas" | "listas">("general");

  const cancelarEdicion = () => {
    setIdEnEdicion(null);
    setMonstruoForm(estadoInicialCriatura);
    setSubPestanaCriatura("general");
    setHNombre("");
    setHNivel(1);
    setHEscuela("Evocación");
    setHTiempo("1 acción");
    setHAlcance("60 pies");
    setHDescripcion("");
    setHDescNivelSuperior("");
    setHMateriales("");
    setHCompVerbal(true);
    setHCompSomatico(true);
    setHCompMaterial(false);
    setHRitual("No");
    setHDuracion("INSTANTÁNEO");
    setHConcentracion("No");
    setHClases([]);
    setHAtaqueCd("N/A");
    setHDadosDaño("");
    setHDadosDañoNivelSuperior("");
    setHCdSalvacion("N/A");
    setHAgregarModificador("No");
    setHTipoDaño("N/A");
    setONombre("");
    setORareza("Común");
    setOPropiedades("");
    setODescripcion("");
    setOCategoria("ARMA");
    setOCostoValor(0);
    setOCostoUnidad("PO");
    setOPeso("");
    setOTipoArma("SIMPLE");
    setOEstiloAtaque("CUERPO A CUERPO");
    setOAlcance("");
    setOPropiedadesArma([]);
    setODadosDaño("");
    setOTipoDaño("N/A");
    setOBonoAtaque("");
    setOBonoDaño("");
    setOBonosMagicos([]);
    setRasgoEdicionIdx(null);
    setAccionEdicionIdx(null);
    setReaccionEdicionIdx(null);
    setLegendariaEdicionIdx(null);
    setQuickActionEdicionIdx(null);
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
    establecerModoHomebrew("lista");
  };

  const cambiarTipoHomebrew = (tipo: "criatura" | "hechizo" | "objeto") => {
    setTipoHomebrew(tipo);
    cancelarEdicion();
  };

  const iniciarEdicionCriatura = (m: MonstruoBase) => {
    setIdEnEdicion(m.id);
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
    establecerModoHomebrew("crear");
  };

  const iniciarEdicionHechizo = (h: HechizoBase) => {
    setIdEnEdicion(h.id);
    setHNombre(h.nombre);
    setHNivel(h.nivel);
    setHEscuela(h.escuela);
    setHTiempo(h.tiempoLanzamiento);
    setHAlcance(h.alcance);
    setHDescripcion(h.descripcion);
    setHDescNivelSuperior(h.descNivelSuperior || "");
    setHMateriales(h.materiales || "");
    setHCompVerbal(h.componentesSeleccionados?.verbal ?? true);
    setHCompSomatico(h.componentesSeleccionados?.somatico ?? true);
    setHCompMaterial(h.componentesSeleccionados?.material ?? false);
    setHRitual(h.ritual === true || h.ritual === "Sí" || h.ritual === "Si" ? "Sí" : "No");
    setHDuracion(h.duracion || "INSTANTÁNEO");
    setHConcentracion(h.concentracion === true || h.concentracion === "Sí" || h.concentracion === "Si" ? "Sí" : "No");
    setHClases(h.clases || []);
    setHAtaqueCd(h.ataqueCd || "N/A");
    setHDadosDaño(h.dadosDaño || "");
    setHDadosDañoNivelSuperior(h.dadosDañoNivelSuperior || "");
    setHCdSalvacion(h.cdSalvacion || "N/A");
    setHAgregarModificador(h.agregarModificadorHabilidad === true || h.agregarModificadorHabilidad as any === "Sí" || h.agregarModificadorHabilidad as any === "Si" ? "Sí" : "No");
    setHTipoDaño(h.tipoDaño || "N/A");
    establecerModoHomebrew("crear");
  };

  const iniciarEdicionObjeto = (o: ObjetoHomebrew) => {
    setIdEnEdicion(o.id);
    setONombre(o.nombre);
    setORareza(o.rareza);
    setOPropiedades(o.propiedades);
    setODescripcion(o.descripcion);
    setOCategoria(o.categoria || "ARMA");
    setOCostoValor(o.costoValor || 0);
    setOCostoUnidad(o.costoUnidad || "PO");
    setOPeso(o.peso || "");
    setOTipoArma(o.tipoArma || "SIMPLE");
    setOEstiloAtaque(o.estiloAtaque || "CUERPO A CUERPO");
    setOAlcance(o.alcance || "");
    setOPropiedadesArma(o.propiedadesArma || []);
    setODadosDaño(o.dadosDaño || "");
    setOTipoDaño(o.tipoDaño || "N/A");
    setOBonoAtaque(o.bonoAtaque || "");
    setOBonoDaño(o.bonoDaño || "");
    setOBonosMagicos(o.bonosMagicos || []);
    establecerModoHomebrew("crear");
  };
  
  // --- Sub-navegación de la pestaña Defensas ---
  const [subDefensas, setSubDefensas] = useState<"inmunidades" | "resistencias" | "vulnerabilidades" | "condiciones">("inmunidades");

  // --- Estado Único del Formulario de Criatura ---
  const estadoInicialCriatura = {
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

  const [monstruoForm, setMonstruoForm] = useState<Omit<MonstruoBase, "id" | "vidaActual">>(estadoInicialCriatura);

  // --- Estados para items dinámicos ---
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

  // --- Estados de Formulario de Hechizos ---
  const [hNombre, setHNombre] = useState("");
  const [hNivel, setHNivel] = useState(1);
  const [hEscuela, setHEscuela] = useState("Evocación");
  const [hTiempo, setHTiempo] = useState("1 acción");
  const [hAlcance, setHAlcance] = useState("60 pies");
  const [hDescripcion, setHDescripcion] = useState("");
  
  // Nuevos estados avanzados de Hechizos
  const [hDescNivelSuperior, setHDescNivelSuperior] = useState("");
  const [hMateriales, setHMateriales] = useState("");
  const [hCompVerbal, setHCompVerbal] = useState(true);
  const [hCompSomatico, setHCompSomatico] = useState(true);
  const [hCompMaterial, setHCompMaterial] = useState(false);
  const [hRitual, setHRitual] = useState("No");
  const [hDuracion, setHDuracion] = useState("INSTANTÁNEO");
  const [hConcentracion, setHConcentracion] = useState("No");
  const [hClases, setHClases] = useState<string[]>([]);
  const [hAtaqueCd, setHAtaqueCd] = useState("N/A");
  const [hDadosDaño, setHDadosDaño] = useState("");
  const [hDadosDañoNivelSuperior, setHDadosDañoNivelSuperior] = useState("");
  const [hCdSalvacion, setHCdSalvacion] = useState("N/A");
  const [hAgregarModificador, setHAgregarModificador] = useState("No");
  const [hTipoDaño, setHTipoDaño] = useState("N/A");

  // --- Estados de Formulario de Objetos ---
  const [oNombre, setONombre] = useState("");
  const [oRareza, setORareza] = useState("Común");
  const [oPropiedades, setOPropiedades] = useState("");
  const [oDescripcion, setODescripcion] = useState("");

  // Nuevos estados avanzados de Objetos (Equipamiento)
  const [oCategoria, setOCategoria] = useState("ARMA");
  const [oCostoValor, setOCostoValor] = useState<number>(0);
  const [oCostoUnidad, setOCostoUnidad] = useState("PO");
  const [oPeso, setOPeso] = useState("");
  const [oTipoArma, setOTipoArma] = useState("SIMPLE");
  const [oEstiloAtaque, setOEstiloAtaque] = useState("CUERPO A CUERPO");
  const [oAlcance, setOAlcance] = useState("");
  const [oPropiedadesArma, setOPropiedadesArma] = useState<string[]>([]);
  const [oDadosDaño, setODadosDaño] = useState("");
  const [oTipoDaño, setOTipoDaño] = useState("N/A");
  const [oBonoAtaque, setOBonoAtaque] = useState("");
  const [oBonoDaño, setOBonoDaño] = useState("");
  const [oBonosMagicos, setOBonosMagicos] = useState<{ categoria: string; bono: string; valor: number }[]>([]);

  // Estados locales para el creador dinámico de Bonos Mágicos
  const [oNuevoBonoCategoria, setONuevoBonoCategoria] = useState("CA");
  const [oNuevoBonoBono, setONuevoBonoBono] = useState("CA");
  const [oNuevoBonoValor, setONuevoBonoValor] = useState(0);

  // --- Filtro de Búsqueda para Creaciones Persistidas ---
  const [filtroBusqueda, setFiltroBusqueda] = useState("");

  // --- Auxiliares de Formulario de Criaturas ---
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

  // --- Agregar y Editar Elementos Dinámicos ---
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

  const agregarBonoMagico = () => {
    if (!oNuevoBonoBono.trim()) return;
    setOBonosMagicos((prev) => [
      ...prev,
      {
        categoria: oNuevoBonoCategoria,
        bono: oNuevoBonoBono.trim(),
        valor: oNuevoBonoValor
      }
    ]);
    setONuevoBonoValor(0);
  };

  const eliminarBonoMagicoIdx = (idx: number) => {
    setOBonosMagicos((prev) => prev.filter((_, i) => i !== idx));
  };

  // --- Envío de Formularios ---
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
      alert("¡Criatura Homebrew guardada con éxito en español!");
    }

    cancelarEdicion();
  };

  const manejarGuardarHechizo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hNombre.trim()) return;

    const componentesGenerados: string[] = [];
    if (hCompVerbal) componentesGenerados.push("V");
    if (hCompSomatico) componentesGenerados.push("S");
    if (hCompMaterial) {
      if (hMateriales.trim()) {
        componentesGenerados.push(`M (${hMateriales.trim()})`);
      } else {
        componentesGenerados.push("M");
      }
    }
    const componentesTxt = componentesGenerados.join(", ") || "Ninguno";

    const payload = {
      nombre: hNombre.trim(),
      nivel: hNivel,
      escuela: hEscuela.trim(),
      tiempoLanzamiento: hTiempo.trim(),
      alcance: hAlcance.trim(),
      componentes: componentesTxt,
      descripcion: hDescripcion.trim(),
      descNivelSuperior: hDescNivelSuperior.trim() || undefined,
      materiales: hMateriales.trim() || undefined,
      componentesSeleccionados: {
        verbal: hCompVerbal,
        somatico: hCompSomatico,
        material: hCompMaterial
      },
      ritual: hRitual === "Sí",
      duracion: hDuracion.trim(),
      concentracion: hConcentracion === "Sí",
      clases: hClases,
      ataqueCd: hAtaqueCd,
      dadosDaño: hDadosDaño.trim() || undefined,
      dadosDañoNivelSuperior: hDadosDañoNivelSuperior.trim() || undefined,
      cdSalvacion: hCdSalvacion,
      agregarModificadorHabilidad: hAgregarModificador === "Sí",
      tipoDaño: hTipoDaño
    };

    if (idEnEdicion) {
      actualizarHechizoHomebrew(idEnEdicion, payload);
      alert("¡Hechizo Homebrew actualizado con éxito!");
    } else {
      agregarHechizoHomebrew(payload);
      alert("¡Hechizo Homebrew guardado con éxito!");
    }

    cancelarEdicion();
  };

  const manejarGuardarObjeto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oNombre.trim()) return;

    let propTxt = oPropiedades.trim();
    if (!propTxt) {
      const parts: string[] = [];
      parts.push(oCategoria);
      if (oPeso) parts.push(`${oPeso} lb.`);
      if (oCostoValor > 0) parts.push(`${oCostoValor} ${oCostoUnidad}`);
      if (oCategoria === "ARMA") {
        if (oTipoArma) parts.push(oTipoArma);
        if (oEstiloAtaque) parts.push(oEstiloAtaque);
        if (oAlcance) parts.push(`Alcance ${oAlcance}`);
        if (oDadosDaño) parts.push(`${oDadosDaño} ${oTipoDaño}`);
      }
      propTxt = parts.join(", ");
    }

    const payload = {
      nombre: oNombre.trim(),
      rareza: oRareza,
      propiedades: propTxt,
      descripcion: oDescripcion.trim(),
      categoria: oCategoria,
      costoValor: oCostoValor,
      costoUnidad: oCostoUnidad,
      peso: oPeso.trim() || undefined,
      tipoArma: oCategoria === "ARMA" ? oTipoArma : undefined,
      estiloAtaque: oCategoria === "ARMA" ? oEstiloAtaque : undefined,
      alcance: oCategoria === "ARMA" ? oAlcance.trim() : undefined,
      propiedadesArma: oCategoria === "ARMA" ? oPropiedadesArma : undefined,
      dadosDaño: oCategoria === "ARMA" ? oDadosDaño.trim() : undefined,
      tipoDaño: oCategoria === "ARMA" ? oTipoDaño : undefined,
      bonoAtaque: oCategoria === "ARMA" ? oBonoAtaque.trim() : undefined,
      bonoDaño: oCategoria === "ARMA" ? oBonoDaño.trim() : undefined,
      bonosMagicos: oBonosMagicos
    };

    if (idEnEdicion) {
      actualizarObjetoHomebrew(idEnEdicion, payload);
      alert("¡Objeto Homebrew actualizado con éxito!");
    } else {
      agregarObjetoHomebrew(payload);
      alert("¡Objeto Homebrew guardado con éxito!");
    }

    cancelarEdicion();
  };

  // Filtrar creaciones homebrew por exclusión de datos por defecto de fábrica
  const idsInicialesMonstruos = new Set(MONSTRUOS_INICIALES.map((m) => m.id));
  const idsInicialesHechizos = new Set(HECHIZOS_INICIALES.map((h) => h.id));
  const monstruosHomebrewSinFiltro = baseDatosMonstruos.filter((m) => !idsInicialesMonstruos.has(m.id));
  const hechizosHomebrewSinFiltro = baseDatosHechizos.filter((h) => !idsInicialesHechizos.has(h.id));

  const monstruosHomebrew = monstruosHomebrewSinFiltro.filter((m) =>
    m.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase())
  );
  const hechizosHomebrew = hechizosHomebrewSinFiltro.filter((h) =>
    h.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase())
  );
  const objetosHomebrewFiltrados = objetosHomebrew.filter((o) =>
    o.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase())
  );

  return (
    <div style={estilos.contenedorHomebrew}>
      <style>{`
        .hb-input:focus, .hb-select:focus, .hb-textarea:focus {
          border-color: var(--color-borde-cian) !important;
          box-shadow: 0 0 0 2px rgba(0, 245, 212, 0.18) !important;
          outline: none !important;
        }
        .hb-input::placeholder, .hb-textarea::placeholder {
          color: var(--color-texto-apagado);
          opacity: 0.6;
          font-style: italic;
        }
        .hb-btn-nav:hover {
          background-color: rgba(0, 245, 212, 0.12) !important;
          border-color: var(--color-borde-cian) !important;
          color: var(--color-borde-cian) !important;
        }
        .hb-btn-tab:hover {
          background-color: rgba(0, 245, 212, 0.08) !important;
          color: var(--color-borde-cian) !important;
        }
        .hb-btn-add:hover {
          filter: brightness(1.15);
          transform: translateY(-1px);
          box-shadow: 0 3px 10px rgba(0, 245, 212, 0.25);
        }
        .hb-btn-add { transition: all 0.15s ease; }
        .hb-btn-sub:hover { background-color: rgba(0, 245, 212, 0.15) !important; border-color: var(--color-borde-cian) !important; }
        .hb-check-pill input[type='checkbox'] { display: none; }
        .hb-check-pill input[type='checkbox']:checked + span {
          background-color: rgba(0, 245, 212, 0.25) !important;
          border-color: var(--color-borde-cian) !important;
          color: var(--color-borde-cian) !important;
        }
        .hb-item-card:hover { border-color: rgba(0,245,212,0.4) !important; background-color: rgba(0,245,212,0.04) !important; }
      `}</style>
      {/* Selector de sub-sección homebrew principal */}
      <div style={estilos.subNavegacion}>
        <button
          onClick={() => cambiarTipoHomebrew("criatura")}
          style={{
            ...estilos.subBotonNav,
            ...(tipoHomebrew === "criatura" ? estilos.subBotonNavActivo : {})
          }}
        >
          <Swords size={14} />
          Criaturas Homebrew ({monstruosHomebrew.length})
        </button>

        <button
          onClick={() => cambiarTipoHomebrew("hechizo")}
          style={{
            ...estilos.subBotonNav,
            ...(tipoHomebrew === "hechizo" ? estilos.subBotonNavActivo : {})
          }}
        >
          <BookOpen size={14} />
          Hechizos Homebrew ({hechizosHomebrew.length})
        </button>

        <button
          onClick={() => cambiarTipoHomebrew("objeto")}
          style={{
            ...estilos.subBotonNav,
            ...(tipoHomebrew === "objeto" ? estilos.subBotonNavActivo : {})
          }}
        >
          <Sparkles size={14} />
          Objetos Mágicos ({objetosHomebrew.length})
        </button>
      </div>

      {/* Selector de Modo Homebrew (Pestañas Crear / Listado) */}
      <div style={estilos.pestanasModoHomebrew}>
        <button
          type="button"
          onClick={() => establecerModoHomebrew("crear")}
          style={{
            ...estilos.botonModoHomebrew,
            ...(modoHomebrew === "crear" ? estilos.botonModoHomebrewActivo : {})
          }}
        >
          <Plus size={13} />
          <span>{idEnEdicion ? "Modo Edición" : "Crear Nuevo"}</span>
        </button>
        <button
          type="button"
          onClick={() => establecerModoHomebrew("lista")}
          style={{
            ...estilos.botonModoHomebrew,
            ...(modoHomebrew === "lista" ? estilos.botonModoHomebrewActivo : {})
          }}
        >
          <Edit2 size={13} />
          <span>Ver / Editar Existentes ({tipoHomebrew === "criatura" ? monstruosHomebrew.length : tipoHomebrew === "hechizo" ? hechizosHomebrew.length : objetosHomebrewFiltrados.length})</span>
        </button>
      </div>

      {/* Grid de Creación: Formulario a la izquierda (ancho flex) | Lista a la derecha */}
      <div style={estilos.cuerpoSeccion}>
        
        {/* FORMULARIOS */}
        {modoHomebrew === "crear" && (
          <div style={estilos.panelFormulario}>
          <div style={estilos.cabeceraPanel}>
            {idEnEdicion ? `EDITANDO CONTENIDO (ID: ${idEnEdicion})` : "CREAR CONTENIDO NUEVO"}
          </div>

          {/* FORMULARIO CRIATURA EXTENDIDO */}
          {tipoHomebrew === "criatura" && (
            <form onSubmit={manejarGuardarCriatura} style={estilos.formularioBrutal}>
              
              {/* Pestañas internas del creador de Criaturas */}
              <div style={estilos.subPestanasCriatura}>
                <button
                  type="button"
                  onClick={() => setSubPestanaCriatura("general")}
                  style={{ ...estilos.subPestanaCriaturaBoton, ...(subPestanaCriatura === "general" ? estilos.subPestanaCriaturaBotonActiva : {}) }}
                >
                  General
                </button>
                <button
                  type="button"
                  onClick={() => setSubPestanaCriatura("atributos")}
                  style={{ ...estilos.subPestanaCriaturaBoton, ...(subPestanaCriatura === "atributos" ? estilos.subPestanaCriaturaBotonActiva : {}) }}
                >
                  Atribs/Salv
                </button>
                <button
                  type="button"
                  onClick={() => setSubPestanaCriatura("pericias")}
                  style={{ ...estilos.subPestanaCriaturaBoton, ...(subPestanaCriatura === "pericias" ? estilos.subPestanaCriaturaBotonActiva : {}) }}
                >
                  Habilidades
                </button>
                <button
                  type="button"
                  onClick={() => setSubPestanaCriatura("defensas")}
                  style={{ ...estilos.subPestanaCriaturaBoton, ...(subPestanaCriatura === "defensas" ? estilos.subPestanaCriaturaBotonActiva : {}) }}
                >
                  Defensas
                </button>
                <button
                  type="button"
                  onClick={() => setSubPestanaCriatura("listas")}
                  style={{ ...estilos.subPestanaCriaturaBoton, ...(subPestanaCriatura === "listas" ? estilos.subPestanaCriaturaBotonActiva : {}) }}
                >
                  Listas/Ataques
                </button>
              </div>

              {/* SECCIÓN GENERAL */}
              {subPestanaCriatura === "general" && (
                <div style={estilos.seccionContenido}>
                  <div style={estilos.filaDobleForm}>
                    <div style={estilos.campoForm}>
                      <label style={estilos.labelForm}>Nombre del Monstruo:</label>
                      <input
                        type="text"
                        value={monstruoForm.nombre}
                        onChange={(e) => actualizarGeneral("nombre", e.target.value)}
                        placeholder="Ej. Dragón de Hielo"
                        style={estilos.inputForm}
                        required
                      />
                    </div>
                    <div style={estilos.campoForm}>
                      <label style={estilos.labelForm}>Tipo de Criatura:</label>
                      <select
                        value={monstruoForm.tipo}
                        onChange={(e) => actualizarGeneral("tipo", e.target.value)}
                        style={estilos.selectForm}
                      >
                        <option value="Humanoide">Humanoide</option>
                        <option value="Monstruosidad">Monstruosidad</option>
                        <option value="No Muerto">No Muerto</option>
                        <option value="Dragón">Dragón</option>
                        <option value="Bestia">Bestia</option>
                        <option value="Constructo">Constructo</option>
                        <option value="Elemental">Elemental</option>
                        <option value="Hada">Hada</option>
                        <option value="Fata">Fata</option>
                        <option value="Gigante">Gigante</option>
                        <option value="Aberración">Aberración</option>
                        <option value="Celestial">Celestial</option>
                        <option value="Infiando">Infiando</option>
                        <option value="Planta">Planta</option>
                        <option value="Limo">Limo</option>
                      </select>
                    </div>
                  </div>

                  <div style={estilos.filaTripleForm}>
                    <div style={estilos.campoForm}>
                      <label style={estilos.labelForm}><Shield size={12} /> CA:</label>
                      <input
                        type="number"
                        value={monstruoForm.ca}
                        onChange={(e) => actualizarGeneral("ca", parseInt(e.target.value, 10) || 10)}
                        style={estilos.inputForm}
                        min={1}
                      />
                    </div>
                    <div style={estilos.campoForm}>
                      <label style={estilos.labelForm}>Notas CA:</label>
                      <input
                        type="text"
                        value={monstruoForm.caNotas || ""}
                        onChange={(e) => actualizarGeneral("caNotas", e.target.value)}
                        placeholder="ej. natural"
                        style={estilos.inputForm}
                      />
                    </div>
                    <div style={estilos.campoForm}>
                      <label style={estilos.labelForm}><Heart size={12} /> HP Máx:</label>
                      <input
                        type="number"
                        value={monstruoForm.vidaMaxima}
                        onChange={(e) => actualizarGeneral("vidaMaxima", parseInt(e.target.value, 10) || 10)}
                        style={estilos.inputForm}
                        min={1}
                      />
                    </div>
                  </div>

                  <div style={estilos.filaTripleForm}>
                    <div style={estilos.campoForm}>
                      <label style={estilos.labelForm}>Notas Vida:</label>
                      <input
                        type="text"
                        value={monstruoForm.vidaNotas || ""}
                        onChange={(e) => actualizarGeneral("vidaNotas", e.target.value)}
                        placeholder="ej. 8d8+16"
                        style={estilos.inputForm}
                      />
                    </div>
                    <div style={estilos.campoForm}>
                      <label style={estilos.labelForm}>Bonif. Inic:</label>
                      <input
                        type="number"
                        value={monstruoForm.iniciativaBonificador}
                        onChange={(e) => actualizarGeneral("iniciativaBonificador", parseInt(e.target.value, 10) || 0)}
                        style={estilos.inputForm}
                      />
                    </div>
                    <div style={estilos.campoForm}>
                      <label style={estilos.labelForm}>Velocidad:</label>
                      <input
                        type="text"
                        value={monstruoForm.velocidad}
                        onChange={(e) => actualizarGeneral("velocidad", e.target.value)}
                        placeholder="ej. 30 pies, volar 60"
                        style={estilos.inputForm}
                      />
                    </div>
                  </div>

                  <div style={estilos.filaDobleForm}>
                    <div style={estilos.campoForm}>
                      <label style={estilos.labelForm}>Desafío (CR):</label>
                      <input
                        type="text"
                        value={monstruoForm.desafio}
                        onChange={(e) => actualizarGeneral("desafio", e.target.value)}
                        placeholder="Ej. 5 o 1/2"
                        style={estilos.inputForm}
                      />
                    </div>
                    <div style={estilos.campoForm}>
                      <label style={estilos.labelForm}>Fuente:</label>
                      <input
                        type="text"
                        value={monstruoForm.fuente}
                        onChange={(e) => actualizarGeneral("fuente", e.target.value)}
                        placeholder="Ej. Manual de Monstruos"
                        style={estilos.inputForm}
                      />
                    </div>
                  </div>

                  <div style={estilos.campoForm}>
                    <label style={estilos.labelForm}>Sentidos:</label>
                    <input
                      type="text"
                      value={monstruoForm.sentidos || ""}
                      onChange={(e) => actualizarGeneral("sentidos", e.target.value)}
                      placeholder="Ej. visión en la oscuridad 60 pies, Percepción pasiva 12"
                      style={estilos.inputForm}
                    />
                  </div>

                  <div style={estilos.campoForm}>
                    <label style={estilos.labelForm}>Idiomas:</label>
                    <input
                      type="text"
                      value={monstruoForm.idiomas || ""}
                      onChange={(e) => actualizarGeneral("idiomas", e.target.value)}
                      placeholder="Ej. Común, Dracónico"
                      style={estilos.inputForm}
                    />
                  </div>
                </div>
              )}

              {/* SECCIÓN ATRIBUTOS Y SALVACIONES */}
              {subPestanaCriatura === "atributos" && (
                <div style={estilos.seccionContenido}>
                  <div style={estilos.cabeceraMiniSeccion}>ATRIBUTOS BÁSICOS</div>
                  <div style={estilos.filaSeisForm}>
                    {CARACTERISTICAS_CLAVES.map(({ clave, etiqueta }) => (
                      <div key={clave} style={estilos.campoMiniForm}>
                        <label style={estilos.labelMiniForm}>{etiqueta}</label>
                        <input
                          type="number"
                          value={monstruoForm.caracteristicas[clave as keyof typeof monstruoForm.caracteristicas]}
                          onChange={(e) => actualizarCaracteristica(clave, parseInt(e.target.value, 10) || 10)}
                          style={estilos.inputMiniForm}
                          min={0}
                          max={30}
                        />
                        <span style={estilos.modificadorPrevisualizado}>
                          {Math.floor((monstruoForm.caracteristicas[clave as keyof typeof monstruoForm.caracteristicas] - 10) / 2) >= 0 ? "+" : ""}
                          {Math.floor((monstruoForm.caracteristicas[clave as keyof typeof monstruoForm.caracteristicas] - 10) / 2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={estilos.cabeceraMiniSeccion}>TIRADAS DE SALVACIÓN (Modificador Neto)</div>
                  <div style={estilos.filaSeisForm}>
                    {CARACTERISTICAS_CLAVES.map(({ clave, etiqueta }) => (
                      <div key={`salv_${clave}`} style={estilos.campoMiniForm}>
                        <label style={estilos.labelMiniForm}>{etiqueta}</label>
                        <input
                          type="number"
                          value={monstruoForm.salvaciones?.[clave as keyof typeof monstruoForm.salvaciones] ?? ""}
                          onChange={(e) => actualizarSalvacion(clave, e.target.value)}
                          placeholder="—"
                          style={estilos.inputMiniForm}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={estilos.notaAyuda}>
                    * Deja en blanco las salvaciones si la criatura no tiene un bonificador especial de salvación.
                  </div>
                </div>
              )}

              {/* SECCIÓN PERICIAS / HABILIDADES (18) */}
              {subPestanaCriatura === "pericias" && (
                <div style={estilos.seccionContenido}>
                  <div style={estilos.cabeceraMiniSeccion}>MODIFICADORES DE HABILIDADES (Pericias)</div>
                  <div style={estilos.gridHabilidades}>
                    {HABILIDADES_LISTA.map(({ clave, nombre }) => (
                      <div key={clave} style={estilos.itemHabilidadFila}>
                        <span style={estilos.habilidadNombreEtiqueta}>{nombre}:</span>
                        <input
                          type="number"
                          value={monstruoForm.habilidades?.[clave as keyof typeof monstruoForm.habilidades] ?? ""}
                          onChange={(e) => actualizarHabilidad(clave, e.target.value)}
                          placeholder="—"
                          style={estilos.inputHabilidad}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={estilos.notaAyuda}>
                    * Rellena únicamente las habilidades en las que el monstruo esté entrenado o posea bonificadores.
                  </div>
                </div>
              )}

              {/* SECCIÓN DEFENSAS, VULNERABILIDADES, RESISTENCIAS, CONDICIONES */}
              {subPestanaCriatura === "defensas" && (
                <div style={estilos.seccionContenido}>
                  <div style={estilos.selectorDefensasNavegacion}>
                    <button
                      type="button"
                      onClick={() => setSubDefensas("inmunidades")}
                      style={{ ...estilos.subDefBoton, ...(subDefensas === "inmunidades" ? estilos.subDefBotonActivo : {}) }}
                    >
                      Inm. Daño ({monstruoForm.inmunidadesDaño?.length || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubDefensas("resistencias")}
                      style={{ ...estilos.subDefBoton, ...(subDefensas === "resistencias" ? estilos.subDefBotonActivo : {}) }}
                    >
                      Res. Daño ({monstruoForm.resistencias?.length || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubDefensas("vulnerabilidades")}
                      style={{ ...estilos.subDefBoton, ...(subDefensas === "vulnerabilidades" ? estilos.subDefBotonActivo : {}) }}
                    >
                      Vuln. Daño ({monstruoForm.vulnerabilidades?.length || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubDefensas("condiciones")}
                      style={{ ...estilos.subDefBoton, ...(subDefensas === "condiciones" ? estilos.subDefBotonActivo : {}) }}
                    >
                      Inm. Condic ({monstruoForm.inmunidadesCondicion?.length || 0})
                    </button>
                  </div>

                  <div style={estilos.contenedorChecksDefensas}>
                    {/* INMUNIDADES AL DAÑO */}
                    {subDefensas === "inmunidades" && (
                      <div style={estilos.gridCheckboxMini}>
                        {TIPOS_DAÑO_DND.map((daño) => (
                          <label key={`inm_${daño}`} style={estilos.labelCheckMini}>
                            <input
                              type="checkbox"
                              checked={monstruoForm.inmunidadesDaño?.includes(daño) || false}
                              onChange={() => alternarCheckArray("inmunidadesDaño", daño)}
                              style={estilos.checkMini}
                            />
                            {daño}
                          </label>
                        ))}
                      </div>
                    )}

                    {/* RESISTENCIAS AL DAÑO */}
                    {subDefensas === "resistencias" && (
                      <div style={estilos.gridCheckboxMini}>
                        {TIPOS_DAÑO_DND.map((daño) => (
                          <label key={`res_${daño}`} style={estilos.labelCheckMini}>
                            <input
                              type="checkbox"
                              checked={monstruoForm.resistencias?.includes(daño) || false}
                              onChange={() => alternarCheckArray("resistencias", daño)}
                              style={estilos.checkMini}
                            />
                            {daño}
                          </label>
                        ))}
                      </div>
                    )}

                    {/* VULNERABILIDADES AL DAÑO */}
                    {subDefensas === "vulnerabilidades" && (
                      <div style={estilos.gridCheckboxMini}>
                        {TIPOS_DAÑO_DND.map((daño) => (
                          <label key={`vuln_${daño}`} style={estilos.labelCheckMini}>
                            <input
                              type="checkbox"
                              checked={monstruoForm.vulnerabilidades?.includes(daño) || false}
                              onChange={() => alternarCheckArray("vulnerabilidades", daño)}
                              style={estilos.checkMini}
                            />
                            {daño}
                          </label>
                        ))}
                      </div>
                    )}

                    {/* INMUNIDADES A CONDICIONES */}
                    {subDefensas === "condiciones" && (
                      <div style={estilos.gridCheckboxMini}>
                        {CONDICIONES_DND.map((cond) => (
                          <label key={`cond_${cond}`} style={estilos.labelCheckMini}>
                            <input
                              type="checkbox"
                              checked={monstruoForm.inmunidadesCondicion?.includes(cond) || false}
                              onChange={() => alternarCheckArray("inmunidadesCondicion", cond)}
                              style={estilos.checkMini}
                            />
                            {cond}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECCIÓN LISTAS DINÁMICAS (RASGOS, ACCIONES, ACCIONES LEGENDARIAS, ACCIONES RÁPIDAS) */}
              {subPestanaCriatura === "listas" && (
                <div style={estilos.seccionContenidoListas}>
                  
                  {/* ACCIONES RÁPIDAS (1-click attacks) */}
                  <div style={estilos.bloqueDinamicoForm}>
                    <div style={estilos.tituloBloqueDinamico}>
                      {quickActionEdicionIdx !== null ? "EDITANDO ATAQUE RÁPIDO" : `ATAQUES RÁPIDOS DE 1 CLIC (${monstruoForm.accionesRapidas?.length || 0})`}
                    </div>
                    <div style={estilos.filaAgregarRapido}>
                      <input
                        type="text"
                        value={tQNombre}
                        onChange={(e) => setTQNombre(e.target.value)}
                        placeholder="Nombre Ataque (ej. Garra)"
                        style={estilos.inputDinamicoMediano}
                      />
                      <input
                        type="text"
                        value={tQBono}
                        onChange={(e) => setTQBono(e.target.value)}
                        placeholder="Bono (+5)"
                        style={estilos.inputDinamicoMini}
                      />
                      <input
                        type="text"
                        value={tQDados}
                        onChange={(e) => setTQDados(e.target.value)}
                        placeholder="Dados (2d6+3)"
                        style={estilos.inputDinamicoMini}
                      />
                      <select
                        value={tQTipo}
                        onChange={(e) => setTQTipo(e.target.value)}
                        style={estilos.selectDinamicoMini}
                      >
                        {TIPOS_DAÑO_DND.map((d) => (
                          <option key={`qa_daño_${d}`} value={d}>{d}</option>
                        ))}
                      </select>
                      <button 
                        type="button" 
                        onClick={agregarQuickAction} 
                        style={{
                          ...estilos.botonAgregarDinamico,
                          backgroundColor: quickActionEdicionIdx !== null ? "var(--color-exito)" : undefined
                        }}
                        title={quickActionEdicionIdx !== null ? "Guardar Cambios" : "Agregar Ataque"}
                      >
                        {quickActionEdicionIdx !== null ? "✓" : "+"}
                      </button>
                      {quickActionEdicionIdx !== null && (
                        <button 
                          type="button" 
                          onClick={cancelarEditarQuickAction} 
                          style={{
                            ...estilos.botonAgregarDinamico,
                            backgroundColor: "var(--color-daño)"
                          }}
                          title="Cancelar Edición"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    {/* Lista previsualizada */}
                    {monstruoForm.accionesRapidas && monstruoForm.accionesRapidas.length > 0 && (
                      <div style={estilos.listaDinamicaVisual}>
                        {monstruoForm.accionesRapidas.map((qa, idx) => (
                          <div key={`qa_v_${idx}`} style={estilos.itemDinamicoVisual}>
                            <span><strong>{qa.nombre}</strong>: {qa.bonificadorAtaque} | {qa.dadosDaño} ({qa.tipoDaño})</span>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button 
                                type="button" 
                                onClick={() => iniciarEditarQuickAction(idx)} 
                                style={{ ...estilos.botonEliminarDinamico, color: "var(--color-borde-cian)" }}
                                title="Editar Ataque Rápido"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => eliminarQuickActionIdx(idx)} 
                                style={estilos.botonEliminarDinamico}
                                title="Eliminar Ataque Rápido"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* RASGOS PASIVOS */}
                  <div style={estilos.bloqueDinamicoForm}>
                    <div style={estilos.tituloBloqueDinamico}>
                      {rasgoEdicionIdx !== null ? "EDITANDO RASGO PASIVO" : `RASGOS Y HABILIDADES PASIVAS (${monstruoForm.rasgos?.length || 0})`}
                    </div>
                    <div style={estilos.camposDinamicosGrupo}>
                      <input
                        type="text"
                        value={tRasgoNombre}
                        onChange={(e) => setTRasgoNombre(e.target.value)}
                        placeholder="Nombre del rasgo"
                        style={estilos.inputDinamicoLargo}
                      />
                      <input
                        type="text"
                        value={tRasgoUso}
                        onChange={(e) => setTRasgoUso(e.target.value)}
                        placeholder="Uso opcional (ej. 3/día)"
                        style={estilos.inputDinamicoMediano}
                      />
                      <textarea
                        value={tRasgoDesc}
                        onChange={(e) => setTRasgoDesc(e.target.value)}
                        placeholder="Descripción detallada del rasgo..."
                        style={estilos.textareaDinamico}
                        rows={calcFilas(tRasgoDesc, 3)}
                      />
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button 
                          type="button" 
                          onClick={agregarRasgo} 
                          style={{
                            ...estilos.botonAgregarCompleto,
                            flex: 1,
                            backgroundColor: rasgoEdicionIdx !== null ? "var(--color-exito)" : undefined
                          }}
                        >
                          {rasgoEdicionIdx !== null ? "Guardar Cambios del Rasgo" : "Agregar Rasgo"}
                        </button>
                        {rasgoEdicionIdx !== null && (
                          <button 
                            type="button" 
                            onClick={cancelarEditarRasgo} 
                            style={{
                              ...estilos.botonAgregarCompleto,
                              width: "100px",
                              backgroundColor: "var(--color-daño)"
                            }}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Lista pasivos */}
                    {monstruoForm.rasgos && monstruoForm.rasgos.length > 0 && (
                      <div style={estilos.listaDinamicaVisual}>
                        {monstruoForm.rasgos.map((r, idx) => (
                          <div key={`r_v_${idx}`} style={estilos.itemDinamicoVisual}>
                            <div style={{ flex: 1, marginRight: "10px" }}>
                              <strong>{r.nombre} {r.uso ? `(${r.uso})` : ""}</strong>:
                              <div style={{ fontSize: "11px", color: "var(--color-texto-secundario)", whiteSpace: "pre-wrap" }}>{r.descripcion}</div>
                            </div>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button 
                                type="button" 
                                onClick={() => iniciarEditarRasgo(idx)} 
                                style={{ ...estilos.botonEliminarDinamico, color: "var(--color-borde-cian)" }}
                                title="Editar Rasgo"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => eliminarRasgoIdx(idx)} 
                                style={estilos.botonEliminarDinamico}
                                title="Eliminar Rasgo"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ACCIONES Y ATAQUES */}
                  <div style={estilos.bloqueDinamicoForm}>
                    <div style={estilos.tituloBloqueDinamico}>
                      {accionEdicionIdx !== null ? "EDITANDO ACCIÓN PRINCIPAL" : `ACCIONES Y ATAQUES PRINCIPALES (${monstruoForm.acciones?.length || 0})`}
                    </div>
                    <div style={estilos.camposDinamicosGrupo}>
                      <div style={estilos.filaCamposAlineados}>
                        <input
                          type="text"
                          value={tAccionNombre}
                          onChange={(e) => setTAccionNombre(e.target.value)}
                          placeholder="Nombre de la acción"
                          style={estilos.inputDinamicoMediano}
                        />
                        <input
                          type="number"
                          value={tAccionBono}
                          onChange={(e) => setTAccionBono(e.target.value)}
                          placeholder="Bono (+5)"
                          style={estilos.inputDinamicoMini}
                        />
                        <input
                          type="text"
                          value={tAccionDaño}
                          onChange={(e) => setTAccionDaño(e.target.value)}
                          placeholder="Daño (1d8+3)"
                          style={estilos.inputDinamicoMini}
                        />
                        <input
                          type="text"
                          value={tAccionUso}
                          onChange={(e) => setTAccionUso(e.target.value)}
                          placeholder="Recarga (5-6)"
                          style={estilos.inputDinamicoMini}
                        />
                      </div>
                      <textarea
                        value={tAccionDesc}
                        onChange={(e) => setTAccionDesc(e.target.value)}
                        placeholder="Descripción detallada de la acción o ataque..."
                        style={estilos.textareaDinamico}
                        rows={calcFilas(tAccionDesc, 3)}
                      />
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button 
                          type="button" 
                          onClick={agregarAccion} 
                          style={{
                            ...estilos.botonAgregarCompleto,
                            flex: 1,
                            backgroundColor: accionEdicionIdx !== null ? "var(--color-exito)" : undefined
                          }}
                        >
                          {accionEdicionIdx !== null ? "Guardar Cambios de la Acción" : "Agregar Acción"}
                        </button>
                        {accionEdicionIdx !== null && (
                          <button 
                            type="button" 
                            onClick={cancelarEditarAccion} 
                            style={{
                              ...estilos.botonAgregarCompleto,
                              width: "100px",
                              backgroundColor: "var(--color-daño)"
                            }}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Lista acciones */}
                    {monstruoForm.acciones && monstruoForm.acciones.length > 0 && (
                      <div style={estilos.listaDinamicaVisual}>
                        {monstruoForm.acciones.map((a, idx) => (
                          <div key={`a_v_${idx}`} style={estilos.itemDinamicoVisual}>
                            <div style={{ flex: 1, marginRight: "10px" }}>
                              <strong>{a.nombre} {a.uso ? `(${a.uso})` : ""}</strong>:
                              <span style={{ fontSize: "11px", marginLeft: "5px", color: "var(--color-borde-cian)" }}>
                                {a.bonificadorAtaque ? `+${a.bonificadorAtaque}` : ""} {a.daño ? `| ${a.daño}` : ""}
                              </span>
                              <div style={{ fontSize: "11px", color: "var(--color-texto-secundario)", whiteSpace: "pre-wrap" }}>{a.descripcion}</div>
                            </div>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button 
                                type="button" 
                                onClick={() => iniciarEditarAccion(idx)} 
                                style={{ ...estilos.botonEliminarDinamico, color: "var(--color-borde-cian)" }}
                                title="Editar Acción"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => eliminarAccionIdx(idx)} 
                                style={estilos.botonEliminarDinamico}
                                title="Eliminar Acción"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* REACCIONES */}
                  <div style={estilos.bloqueDinamicoForm}>
                    <div style={estilos.tituloBloqueDinamico}>
                      {reaccionEdicionIdx !== null ? "EDITANDO REACCIÓN" : `REACCIONES (${monstruoForm.reacciones?.length || 0})`}
                    </div>
                    <div style={estilos.camposDinamicosGrupo}>
                      <input
                        type="text"
                        value={tReaccionNombre}
                        onChange={(e) => setTReaccionNombre(e.target.value)}
                        placeholder="Nombre de la reacción"
                        style={estilos.inputDinamicoLargo}
                      />
                      <input
                        type="text"
                        value={tReaccionUso}
                        onChange={(e) => setTReaccionUso(e.target.value)}
                        placeholder="Uso opcional (ej. 1/ronda)"
                        style={estilos.inputDinamicoMediano}
                      />
                      <textarea
                        value={tReaccionDesc}
                        onChange={(e) => setTReaccionDesc(e.target.value)}
                        placeholder="Descripción detallada de la reacción..."
                        style={estilos.textareaDinamico}
                        rows={calcFilas(tReaccionDesc, 3)}
                      />
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button 
                          type="button" 
                          onClick={agregarReaccion} 
                          style={{
                            ...estilos.botonAgregarCompleto,
                            flex: 1,
                            backgroundColor: reaccionEdicionIdx !== null ? "var(--color-exito)" : undefined
                          }}
                        >
                          {reaccionEdicionIdx !== null ? "Guardar Cambios de la Reacción" : "Agregar Reacción"}
                        </button>
                        {reaccionEdicionIdx !== null && (
                          <button 
                            type="button" 
                            onClick={cancelarEditarReaccion} 
                            style={{
                              ...estilos.botonAgregarCompleto,
                              width: "100px",
                              backgroundColor: "var(--color-daño)"
                            }}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Lista reacciones */}
                    {monstruoForm.reacciones && monstruoForm.reacciones.length > 0 && (
                      <div style={estilos.listaDinamicaVisual}>
                        {monstruoForm.reacciones.map((r, idx) => (
                          <div key={`rec_v_${idx}`} style={estilos.itemDinamicoVisual}>
                            <div style={{ flex: 1, marginRight: "10px" }}>
                              <strong>{r.nombre} {r.uso ? `(${r.uso})` : ""}</strong>:
                              <div style={{ fontSize: "11px", color: "var(--color-texto-secundario)", whiteSpace: "pre-wrap" }}>{r.descripcion}</div>
                            </div>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button 
                                type="button" 
                                onClick={() => iniciarEditarReaccion(idx)} 
                                style={{ ...estilos.botonEliminarDinamico, color: "var(--color-borde-cian)" }}
                                title="Editar Reacción"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => eliminarReaccionIdx(idx)} 
                                style={estilos.botonEliminarDinamico}
                                title="Eliminar Reacción"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ACCIONES LEGENDARIAS */}
                  <div style={estilos.bloqueDinamicoForm}>
                    <div style={estilos.tituloBloqueDinamico}>
                      {legendariaEdicionIdx !== null ? "EDITANDO ACCIÓN LEGENDARIA" : `ACCIONES LEGENDARIAS (${monstruoForm.accionesLegendarias?.length || 0})`}
                    </div>
                    <div style={estilos.camposDinamicosGrupo}>
                      <input
                        type="text"
                        value={tLegendariaNombre}
                        onChange={(e) => setTLegendariaNombre(e.target.value)}
                        placeholder="Nombre de la acción legendaria"
                        style={estilos.inputDinamicoLargo}
                      />
                      <input
                        type="text"
                        value={tLegendariaUso}
                        onChange={(e) => setTLegendariaUso(e.target.value)}
                        placeholder="Costo en acciones (ej. consume 2 acciones)"
                        style={estilos.inputDinamicoMediano}
                      />
                      <textarea
                        value={tLegendariaDesc}
                        onChange={(e) => setTLegendariaDesc(e.target.value)}
                        placeholder="Descripción detallada de la acción legendaria..."
                        style={estilos.textareaDinamico}
                        rows={calcFilas(tLegendariaDesc, 3)}
                      />
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button 
                          type="button" 
                          onClick={agregarLegendaria} 
                          style={{
                            ...estilos.botonAgregarCompleto,
                            flex: 1,
                            backgroundColor: legendariaEdicionIdx !== null ? "var(--color-exito)" : undefined
                          }}
                        >
                          {legendariaEdicionIdx !== null ? "Guardar Cambios Legendaria" : "Agregar Acción Legendaria"}
                        </button>
                        {legendariaEdicionIdx !== null && (
                          <button 
                            type="button" 
                            onClick={cancelarEditarLegendaria} 
                            style={{
                              ...estilos.botonAgregarCompleto,
                              width: "100px",
                              backgroundColor: "var(--color-daño)"
                            }}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Lista legendarias */}
                    {monstruoForm.accionesLegendarias && monstruoForm.accionesLegendarias.length > 0 && (
                      <div style={estilos.listaDinamicaVisual}>
                        {monstruoForm.accionesLegendarias.map((l, idx) => (
                          <div key={`leg_v_${idx}`} style={estilos.itemDinamicoVisual}>
                            <div style={{ flex: 1, marginRight: "10px" }}>
                              <strong>{l.nombre} {l.uso ? `(${l.uso})` : ""}</strong>:
                              <div style={{ fontSize: "11px", color: "var(--color-texto-secundario)", whiteSpace: "pre-wrap" }}>{l.descripcion}</div>
                            </div>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button 
                                type="button" 
                                onClick={() => iniciarEditarLegendaria(idx)} 
                                style={{ ...estilos.botonEliminarDinamico, color: "var(--color-borde-cian)" }}
                                title="Editar Acción Legendaria"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => eliminarLegendariaIdx(idx)} 
                                style={estilos.botonEliminarDinamico}
                                title="Eliminar Acción Legendaria"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* Botón de Enviar General (Siempre Visible abajo) */}
              <div style={estilos.grupoBotonesAccion}>
                <button type="submit" style={estilos.botonEnviarBrutal}>
                  <Plus size={15} />
                  {idEnEdicion ? "Guardar Cambios en la Criatura" : "Guardar Criatura D&D 5.5e Completa"}
                </button>
                {idEnEdicion && (
                  <button type="button" onClick={cancelarEdicion} style={estilos.botonCancelarBrutal}>
                    Cancelar Edición
                  </button>
                )}
              </div>
            </form>
          )}

          {/* FORMULARIO HECHIZO */}
          {tipoHomebrew === "hechizo" && (
            <form onSubmit={manejarGuardarHechizo} style={estilos.formularioBrutal}>
              <div style={estilos.filaDobleForm}>
                <div style={estilos.campoForm}>
                  <label style={estilos.labelForm}>Nombre del Conjuro:</label>
                  <input
                    type="text"
                    value={hNombre}
                    onChange={(e) => setHNombre(e.target.value)}
                    placeholder="Ej. Bola de Fuego"
                    style={estilos.inputForm}
                    required
                  />
                </div>
                <div style={estilos.campoForm}>
                  <label style={estilos.labelForm}>Nivel del Hechizo:</label>
                  <select
                    value={hNivel}
                    onChange={(e) => setHNivel(parseInt(e.target.value, 10) || 0)}
                    style={estilos.selectForm}
                  >
                    <option value={0}>Truco (Cantrip)</option>
                    <option value={1}>Nivel 1</option>
                    <option value={2}>Nivel 2</option>
                    <option value={3}>Nivel 3</option>
                    <option value={4}>Nivel 4</option>
                    <option value={5}>Nivel 5</option>
                    <option value={6}>Nivel 6</option>
                    <option value={7}>Nivel 7</option>
                    <option value={8}>Nivel 8</option>
                    <option value={9}>Nivel 9</option>
                  </select>
                </div>
              </div>

              <div style={estilos.filaTripleForm}>
                <div style={estilos.campoForm}>
                  <label style={estilos.labelForm}>Escuela:</label>
                  <input
                    type="text"
                    value={hEscuela}
                    onChange={(e) => setHEscuela(e.target.value)}
                    placeholder="Evocación"
                    style={estilos.inputForm}
                  />
                </div>
                <div style={estilos.campoForm}>
                  <label style={estilos.labelForm}>Tiempo Lanzamiento:</label>
                  <input
                    type="text"
                    value={hTiempo}
                    onChange={(e) => setHTiempo(e.target.value)}
                    placeholder="1 acción"
                    style={estilos.inputForm}
                  />
                </div>
                <div style={estilos.campoForm}>
                  <label style={estilos.labelForm}>Alcance:</label>
                  <input
                    type="text"
                    value={hAlcance}
                    onChange={(e) => setHAlcance(e.target.value)}
                    placeholder="150 pies"
                    style={estilos.inputForm}
                  />
                </div>
              </div>

              <div style={estilos.filaTripleForm}>
                <div style={estilos.campoForm}>
                  <label style={estilos.labelForm}>Duración:</label>
                  <input
                    type="text"
                    value={hDuracion}
                    onChange={(e) => setHDuracion(e.target.value)}
                    placeholder="Instantáneo"
                    style={estilos.inputForm}
                  />
                </div>
                <div style={estilos.campoForm}>
                  <label style={estilos.labelForm}>Concentración:</label>
                  <select
                    value={hConcentracion}
                    onChange={(e) => setHConcentracion(e.target.value)}
                    style={estilos.selectForm}
                  >
                    <option value="No">No</option>
                    <option value="Sí">Sí</option>
                  </select>
                </div>
                <div style={estilos.campoForm}>
                  <label style={estilos.labelForm}>Ritual:</label>
                  <select
                    value={hRitual}
                    onChange={(e) => setHRitual(e.target.value)}
                    style={estilos.selectForm}
                  >
                    <option value="No">No</option>
                    <option value="Sí">Sí</option>
                  </select>
                </div>
              </div>

              {/* COMPONENTES DE CONJURO */}
              <div style={estilos.bloqueDinamicoForm}>
                <div style={estilos.tituloBloqueDinamico}>COMPONENTES DE CONJURO</div>
                <div style={estilos.filaCheckboxes}>
                  <label style={estilos.labelCheckbox}>
                    <input
                      type="checkbox"
                      checked={hCompVerbal}
                      onChange={(e) => setHCompVerbal(e.target.checked)}
                      style={estilos.checkMini}
                    />
                    <span>Verbal (V)</span>
                  </label>
                  <label style={estilos.labelCheckbox}>
                    <input
                      type="checkbox"
                      checked={hCompSomatico}
                      onChange={(e) => setHCompSomatico(e.target.checked)}
                      style={estilos.checkMini}
                    />
                    <span>Somático (S)</span>
                  </label>
                  <label style={estilos.labelCheckbox}>
                    <input
                      type="checkbox"
                      checked={hCompMaterial}
                      onChange={(e) => setHCompMaterial(e.target.checked)}
                      style={estilos.checkMini}
                    />
                    <span>Material (M)</span>
                  </label>
                </div>
                {hCompMaterial && (
                  <div style={estilos.campoForm}>
                    <label style={estilos.labelForm}>Materiales Detallados:</label>
                    <input
                      type="text"
                      value={hMateriales}
                      onChange={(e) => setHMateriales(e.target.value)}
                      placeholder="Ej. una pizca de azufre y guano de murciélago"
                      style={estilos.inputForm}
                    />
                  </div>
                )}
              </div>

              {/* CLASES QUE LO APRENDEN */}
              <div style={estilos.bloqueDinamicoForm}>
                <div style={estilos.tituloBloqueDinamico}>CLASES DISPONIBLES</div>
                <div style={estilos.gridClasesDnd}>
                  {CLASES_DND.map((clase) => {
                    const estaSeleccionada = hClases.includes(clase);
                    return (
                      <label key={clase} style={estilos.labelCheckbox}>
                        <input
                          type="checkbox"
                          checked={estaSeleccionada}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setHClases((prev) => [...prev, clase]);
                            } else {
                              setHClases((prev) => prev.filter((c) => c !== clase));
                            }
                          }}
                          style={estilos.checkMini}
                        />
                        <span>{clase}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* MECÁNICAS DE COMBATE */}
              <div style={{ ...estilos.bloqueDinamicoForm, borderColor: "rgba(0,245,212,0.25)" }}>
                <div style={{ ...estilos.tituloBloqueDinamico, color: "var(--color-borde-cian)" }}>MECÁNICAS DE COMBATE (D&D 5.5e / 2024)</div>
                
                <div style={estilos.filaDobleForm}>
                  <div style={estilos.campoForm}>
                    <label style={estilos.labelForm}>Ataque o CD:</label>
                    <select
                      value={hAtaqueCd}
                      onChange={(e) => setHAtaqueCd(e.target.value)}
                      style={estilos.selectForm}
                    >
                      <option value="N/A">N/A</option>
                      <option value="ATAQUE">Ataque</option>
                      <option value="CD">CD (Dificultad)</option>
                    </select>
                  </div>
                  <div style={estilos.campoForm}>
                    <label style={estilos.labelForm}>CD de Salvación (Atributo):</label>
                    <select
                      value={hCdSalvacion}
                      onChange={(e) => setHCdSalvacion(e.target.value)}
                      style={estilos.selectForm}
                    >
                      <option value="N/A">N/A</option>
                      <option value="Fuerza">Fuerza (FUE)</option>
                      <option value="Destreza">Destreza (DES)</option>
                      <option value="Constitución">Constitución (CON)</option>
                      <option value="Inteligencia">Inteligencia (INT)</option>
                      <option value="Sabiduría">Sabiduría (SAB)</option>
                      <option value="Carisma">Carisma (CAR)</option>
                    </select>
                  </div>
                </div>

                <div style={estilos.filaDobleForm}>
                  <div style={estilos.campoForm}>
                    <label style={estilos.labelForm}>Dados de Daño:</label>
                    <input
                      type="text"
                      value={hDadosDaño}
                      onChange={(e) => setHDadosDaño(e.target.value)}
                      placeholder="Ej. 8d6"
                      style={estilos.inputForm}
                    />
                  </div>
                  <div style={estilos.campoForm}>
                    <label style={estilos.labelForm}>Dados Daño Nivel Superior:</label>
                    <input
                      type="text"
                      value={hDadosDañoNivelSuperior}
                      onChange={(e) => setHDadosDañoNivelSuperior(e.target.value)}
                      placeholder="Ej. 1d6"
                      style={estilos.inputForm}
                    />
                  </div>
                </div>

                <div style={estilos.filaDobleForm}>
                  <div style={estilos.campoForm}>
                    <label style={estilos.labelForm}>Tipo de Daño:</label>
                    <select
                      value={hTipoDaño}
                      onChange={(e) => setHTipoDaño(e.target.value)}
                      style={estilos.selectForm}
                    >
                      <option value="N/A">N/A</option>
                      {TIPOS_DAÑO_DND.map((t) => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div style={estilos.campoForm}>
                    <label style={estilos.labelForm}>Sumar Mod. Habilidad al Daño:</label>
                    <select
                      value={hAgregarModificador}
                      onChange={(e) => setHAgregarModificador(e.target.value)}
                      style={estilos.selectForm}
                    >
                      <option value="No">No</option>
                      <option value="Sí">Sí</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={estilos.campoForm}>
                <label style={estilos.labelForm}>Descripción / Efectos:</label>
                <textarea
                  value={hDescripcion}
                  onChange={(e) => setHDescripcion(e.target.value)}
                  placeholder="Escribe la descripción del conjuro..."
                  style={estilos.textareaBrutal}
                  rows={calcFilas(hDescripcion, 5, 25)}
                  required
                />
              </div>

              <div style={estilos.campoForm}>
                <label style={estilos.labelForm}>A Niveles Superiores (Descripción Opcional):</label>
                <textarea
                  value={hDescNivelSuperior}
                  onChange={(e) => setHDescNivelSuperior(e.target.value)}
                  placeholder="Ej. Cuando lanzas este hechizo usando un espacio de conjuro de nivel 4 o superior, el daño aumenta en 1d6 por cada nivel..."
                  style={estilos.textareaBrutal}
                  rows={calcFilas(hDescNivelSuperior, 3, 12)}
                />
              </div>

              <div style={estilos.grupoBotonesAccion}>
                <button type="submit" style={estilos.botonEnviarBrutal}>
                  <Plus size={15} />
                  {idEnEdicion ? "Guardar Cambios en el Hechizo" : "Guardar Hechizo Homebrew"}
                </button>
                {idEnEdicion && (
                  <button type="button" onClick={cancelarEdicion} style={estilos.botonCancelarBrutal}>
                    Cancelar Edición
                  </button>
                )}
              </div>
            </form>
          )}

          {/* FORMULARIO OBJETO */}
          {tipoHomebrew === "objeto" && (
            <form onSubmit={manejarGuardarObjeto} style={estilos.formularioBrutal}>
              <div style={estilos.filaDobleForm}>
                <div style={estilos.campoForm}>
                  <label style={estilos.labelForm}>Nombre del Objeto:</label>
                  <input
                    type="text"
                    value={oNombre}
                    onChange={(e) => setONombre(e.target.value)}
                    placeholder="Ej. Espada Flamígera"
                    style={estilos.inputForm}
                    required
                  />
                </div>
                <div style={estilos.campoForm}>
                  <label style={estilos.labelForm}>Categoría del Equipo:</label>
                  <select
                    value={oCategoria}
                    onChange={(e) => setOCategoria(e.target.value)}
                    style={estilos.selectForm}
                  >
                    <option value="ARMA">Arma</option>
                    <option value="ARMADURA">Armadura</option>
                    <option value="ACCESORIO">Accesorio / Maravilloso</option>
                    <option value="POCIÓN">Poción</option>
                    <option value="PERGAMINO">Pergamino</option>
                    <option value="ANILLO">Anillo</option>
                    <option value="BASTÓN">Bastón</option>
                    <option value="VARITA">Varita</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
              </div>

              <div style={estilos.filaTripleForm}>
                <div style={estilos.campoForm}>
                  <label style={estilos.labelForm}>Rareza:</label>
                  <select value={oRareza} onChange={(e) => setORareza(e.target.value)} style={estilos.selectForm}>
                    <option value="Común">Común</option>
                    <option value="Poco Común">Poco Común</option>
                    <option value="Raro">Raro</option>
                    <option value="Muy Raro">Muy Raro</option>
                    <option value="Legendario">Legendario</option>
                    <option value="Artefacto">Artefacto</option>
                  </select>
                </div>
                <div style={estilos.campoForm}>
                  <label style={estilos.labelForm}>Costo:</label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      type="number"
                      value={oCostoValor}
                      onChange={(e) => setOCostoValor(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      style={{ ...estilos.inputForm, width: "65%" }}
                    />
                    <select
                      value={oCostoUnidad}
                      onChange={(e) => setOCostoUnidad(e.target.value)}
                      style={{ ...estilos.selectForm, width: "35%" }}
                    >
                      <option value="PC">PC</option>
                      <option value="PP">PP</option>
                      <option value="PE">PE</option>
                      <option value="PO">PO</option>
                      <option value="PPT">PPT</option>
                    </select>
                  </div>
                </div>
                <div style={estilos.campoForm}>
                  <label style={estilos.labelForm}>Peso (lb.):</label>
                  <input
                    type="text"
                    value={oPeso}
                    onChange={(e) => setOPeso(e.target.value)}
                    placeholder="Ej. 3 lb"
                    style={estilos.inputForm}
                  />
                </div>
              </div>

              {/* DETALLES DE ARMA (SÓLO SI CATEGORÍA ES ARMA) */}
              {oCategoria === "ARMA" && (
                <div style={{ ...estilos.bloqueDinamicoForm, borderColor: "rgba(255,165,0,0.3)" }}>
                  <div style={{ ...estilos.tituloBloqueDinamico, color: "var(--color-advertencia)" }}>PROPIEDADES TÁCTICAS DEL ARMA</div>
                  
                  <div style={estilos.filaTripleForm}>
                    <div style={estilos.campoForm}>
                      <label style={estilos.labelForm}>Tipo de Arma:</label>
                      <select
                        value={oTipoArma}
                        onChange={(e) => setOTipoArma(e.target.value)}
                        style={estilos.selectForm}
                      >
                        <option value="SIMPLE">Arma Simple</option>
                        <option value="MARCIAL">Arma Marcial</option>
                        <option value="N/A">N/A</option>
                      </select>
                    </div>
                    <div style={estilos.campoForm}>
                      <label style={estilos.labelForm}>Estilo de Ataque:</label>
                      <select
                        value={oEstiloAtaque}
                        onChange={(e) => setOEstiloAtaque(e.target.value)}
                        style={estilos.selectForm}
                      >
                        <option value="CUERPO A CUERPO">Cuerpo a Cuerpo</option>
                        <option value="A DISTANCIA">A Distancia</option>
                        <option value="N/A">N/A</option>
                      </select>
                    </div>
                    <div style={estilos.campoForm}>
                      <label style={estilos.labelForm}>Alcance:</label>
                      <input
                        type="text"
                        value={oAlcance}
                        onChange={(e) => setOAlcance(e.target.value)}
                        placeholder="Ej. 20/60 pies"
                        style={estilos.inputForm}
                      />
                    </div>
                  </div>

                  <div style={estilos.filaDobleForm}>
                    <div style={estilos.campoForm}>
                      <label style={estilos.labelForm}>Dados de Daño:</label>
                      <input
                        type="text"
                        value={oDadosDaño}
                        onChange={(e) => setODadosDaño(e.target.value)}
                        placeholder="Ej. 1d8"
                        style={estilos.inputForm}
                      />
                    </div>
                    <div style={estilos.campoForm}>
                      <label style={estilos.labelForm}>Tipo de Daño:</label>
                      <select
                        value={oTipoDaño}
                        onChange={(e) => setOTipoDaño(e.target.value)}
                        style={estilos.selectForm}
                      >
                        <option value="N/A">N/A</option>
                        {TIPOS_DAÑO_DND.map((t) => (
                          <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={estilos.filaDobleForm}>
                    <div style={estilos.campoForm}>
                      <label style={estilos.labelForm}>Bonificador Mágico Ataque:</label>
                      <input
                        type="text"
                        value={oBonoAtaque}
                        onChange={(e) => setOBonoAtaque(e.target.value)}
                        placeholder="Ej. +1"
                        style={estilos.inputForm}
                      />
                    </div>
                    <div style={estilos.campoForm}>
                      <label style={estilos.labelForm}>Bonificador Mágico Daño:</label>
                      <input
                        type="text"
                        value={oBonoDaño}
                        onChange={(e) => setOBonoDaño(e.target.value)}
                        placeholder="Ej. +1"
                        style={estilos.inputForm}
                      />
                    </div>
                  </div>

                  {/* CHECKBOXES PROPIEDADES DE ARMAS */}
                  <div style={{ marginTop: "6px" }}>
                    <div style={{ ...estilos.labelForm, marginBottom: "8px" }}>Propiedades del Arma:</div>
                    <div style={estilos.gridClasesDnd}>
                      {[
                        "Sutil", "Versátil", "Pesado", "Ligero", "Carga", "Alcance", "Arrojadiza", 
                        "A dos manos", "Plateado", "Especial", "Munición", "Improvisada", "Sintonización", "Tiene Cargas"
                      ].map((prop) => {
                        const estaChecked = oPropiedadesArma.includes(prop);
                        return (
                          <label key={prop} style={estilos.labelCheckbox}>
                            <input
                              type="checkbox"
                              checked={estaChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setOPropiedadesArma((prev) => [...prev, prop]);
                                } else {
                                  setOPropiedadesArma((prev) => prev.filter((p) => p !== prop));
                                }
                              }}
                              style={estilos.checkMini}
                            />
                            <span>{prop}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* SECCIÓN DE BONOS MÁGICOS DINÁMICOS */}
              <div style={estilos.bloqueDinamicoForm}>
                <div style={estilos.tituloBloqueDinamico}>BONOS MÁGICOS DINÁMICOS AL PERSONAJE</div>
                
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 30%" }}>
                    <label style={estilos.labelForm}>Categoría del Bono:</label>
                    <select
                      value={oNuevoBonoCategoria}
                      onChange={(e) => setONuevoBonoCategoria(e.target.value)}
                      style={estilos.selectForm}
                    >
                      <option value="CA">Clase de Armadura (CA)</option>
                      <option value="CARACTERÍSTICA">Característica / Atributo</option>
                      <option value="SALVACIÓN">Salvación</option>
                      <option value="HABILIDAD">Pericia / Habilidad</option>
                      <option value="OTRO">Otro Bono</option>
                    </select>
                  </div>
                  <div style={{ flex: "1 1 30%" }}>
                    <label style={estilos.labelForm}>Nombre / Atributo:</label>
                    <input
                      type="text"
                      value={oNuevoBonoBono}
                      onChange={(e) => setONuevoBonoBono(e.target.value)}
                      placeholder="Ej. Fuerza, Sigilo, CA"
                      style={estilos.inputForm}
                    />
                  </div>
                  <div style={{ flex: "1 1 15%" }}>
                    <label style={estilos.labelForm}>Valor:</label>
                    <input
                      type="number"
                      value={oNuevoBonoValor}
                      onChange={(e) => setONuevoBonoValor(parseInt(e.target.value) || 0)}
                      style={estilos.inputForm}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={agregarBonoMagico}
                    style={{ ...estilos.botonAgregarDinamico, alignSelf: "flex-end" }}
                  >
                    + Agregar
                  </button>
                </div>

                {/* LISTA DE BONOS MÁGICOS APLICADOS */}
                {oBonosMagicos.length > 0 && (
                  <div style={estilos.listaDinamicaVisual}>
                    {oBonosMagicos.map((bono, idx) => (
                      <div key={`bono_${idx}`} style={estilos.itemDinamicoVisual}>
                        <div style={{ fontSize: "12.5px" }}>
                          <span style={{ color: "var(--color-advertencia)", fontWeight: "bold" }}>[{bono.categoria}]</span> {bono.bono}: <strong>{bono.valor >= 0 ? `+${bono.valor}` : bono.valor}</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarBonoMagicoIdx(idx)}
                          style={estilos.botonEliminarDinamico}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={estilos.campoForm}>
                <label style={estilos.labelForm}>Descripción Detallada:</label>
                <textarea
                  value={oDescripcion}
                  onChange={(e) => setODescripcion(e.target.value)}
                  placeholder="Escribe la historia o efectos mágicos detallados..."
                  style={estilos.textareaBrutal}
                  rows={calcFilas(oDescripcion, 5, 25)}
                  required
                />
              </div>

              <div style={estilos.campoForm}>
                <label style={estilos.labelForm}>Propiedades Rápidas (Opcional):</label>
                <input
                  type="text"
                  value={oPropiedades}
                  onChange={(e) => setOPropiedades(e.target.value)}
                  placeholder="Ej. Espada Larga, Raro, Sintonización. Deja en blanco para autogenerar."
                  style={estilos.inputForm}
                />
              </div>

              <div style={estilos.grupoBotonesAccion}>
                <button type="submit" style={estilos.botonEnviarBrutal}>
                  <Plus size={15} />
                  {idEnEdicion ? "Guardar Cambios en el Objeto" : "Guardar Objeto Homebrew"}
                </button>
                {idEnEdicion && (
                  <button type="button" onClick={cancelarEdicion} style={estilos.botonCancelarBrutal}>
                    Cancelar Edición
                  </button>
                )}
              </div>
            </form>
          )}

        </div>
        )}

        {/* LISTADOS DE ELEMENTOS CREADOS (PERSISTIDOS) */}
        {modoHomebrew === "lista" && (
          <div style={estilos.panelLista}>
          <div style={estilos.cabeceraPanel}>CREACIONES PERSISTIDAS ({tipoHomebrew === "criatura" ? monstruosHomebrew.length : tipoHomebrew === "hechizo" ? hechizosHomebrew.length : objetosHomebrewFiltrados.length})</div>
          
          {/* BUSCADOR INTERACTIVO EN EL PANEL DE HOMEBREW */}
          <div style={estilos.cajaBuscadorHomebrew}>
            <input
              type="text"
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
              placeholder={`Filtrar ${tipoHomebrew === "criatura" ? "criaturas" : tipoHomebrew === "hechizo" ? "hechizos" : "objetos"}...`}
              style={estilos.inputBuscadorHomebrew}
            />
            {filtroBusqueda && (
              <button
                onClick={() => setFiltroBusqueda("")}
                style={estilos.botonLimpiarBusquedaHomebrew}
              >
                Limpiar
              </button>
            )}
          </div>

          <div style={estilos.contenedorScrollLista}>
            
            {tipoHomebrew === "criatura" && (
              monstruosHomebrew.length === 0 ? (
                <div style={estilos.textoListaVacia}>No se encontraron criaturas.</div>
              ) : (
                monstruosHomebrew.map((m) => (
                  <div key={m.id} style={estilos.itemListaBrutal}>
                    <div style={estilos.itemInfoLista}>
                      <span style={estilos.itemNombre}>{m.nombre}</span>
                      <span style={estilos.itemSub}>
                        {m.tipo} | CA: <span className="dato-numerico">{m.ca}</span> | HP: <span className="dato-numerico">{m.vidaMaxima}</span> | CR: {m.desafio}
                      </span>
                    </div>
                    <div style={estilos.grupoBotonesItem}>
                      <button
                        onClick={() => iniciarEdicionCriatura(m)}
                        style={estilos.botonEditarItem}
                        title="Editar creación"
                        type="button"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (idEnEdicion === m.id) cancelarEdicion();
                          eliminarMonstruoHomebrew(m.id);
                        }}
                        style={estilos.botonEliminarItem}
                        title="Eliminar de la base de datos"
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )
            )}

            {tipoHomebrew === "hechizo" && (
              hechizosHomebrew.length === 0 ? (
                <div style={estilos.textoListaVacia}>No se encontraron hechizos.</div>
              ) : (
                hechizosHomebrew.map((h) => (
                  <div key={h.id} style={estilos.itemListaBrutal}>
                    <div
                      style={{ ...estilos.itemInfoLista, cursor: "pointer" }}
                      onClick={() => setIdHechizoDetalleCreador(h.id)}
                      title="Ver detalles del hechizo"
                    >
                      <span style={estilos.itemNombre}>{h.nombre}</span>
                      <span style={estilos.itemSub}>
                        Nivel: <span className="dato-numerico">{h.nivel}</span> | {h.escuela} | {h.alcance}
                      </span>
                    </div>
                    <div style={estilos.grupoBotonesItem}>
                      <button
                        onClick={() => iniciarEdicionHechizo(h)}
                        style={estilos.botonEditarItem}
                        title="Editar creación"
                        type="button"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (idEnEdicion === h.id) cancelarEdicion();
                          eliminarHechizoHomebrew(h.id);
                        }}
                        style={estilos.botonEliminarItem}
                        title="Eliminar de la base de datos"
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )
            )}

            {tipoHomebrew === "objeto" && (
              objetosHomebrewFiltrados.length === 0 ? (
                <div style={estilos.textoListaVacia}>No se encontraron objetos mágicos.</div>
              ) : (
                objetosHomebrewFiltrados.map((o) => (
                  <div key={o.id} style={estilos.itemListaBrutal}>
                    <div
                      style={{ ...estilos.itemInfoLista, cursor: "pointer" }}
                      onClick={() => setIdObjetoDetalle(o.id)}
                      title="Ver detalles del objeto mágico"
                    >
                      <span style={estilos.itemNombre}>{o.nombre}</span>
                      <span style={estilos.itemSub}>
                        Rareza: {o.rareza} {o.propiedades ? `| Prop.: ${o.propiedades}` : ""}
                      </span>
                    </div>
                    <div style={estilos.grupoBotonesItem}>
                      <button
                        onClick={() => iniciarEdicionObjeto(o)}
                        style={estilos.botonEditarItem}
                        title="Editar creación"
                        type="button"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (idEnEdicion === o.id) cancelarEdicion();
                          eliminarObjetoHomebrew(o.id);
                        }}
                        style={estilos.botonEliminarItem}
                        title="Eliminar de la base de datos"
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )
            )}

      </div>
    </div>
    )}
  </div>

  {/* Overlay Detalle Hechizo en Creador */}
      {idHechizoDetalleCreador && (() => {
        const hechizo = baseDatosHechizos.find(h => h.id === idHechizoDetalleCreador);
        if (!hechizo) return null;
        return (
          <div style={estilos.panelDetalleOverlay}>
            <div style={estilos.cabeceraDetalle}>
              <div style={estilos.cabeceraDetalleIzquierda}>
                <span style={estilos.hechizoNivelOverlay}>
                  NIVEL {hechizo.nivel === 0 ? "TRUCO" : hechizo.nivel}
                </span>
                <span style={estilos.nombreHechizoOverlay}>{hechizo.nombre}</span>
              </div>
              <button
                onClick={() => setIdHechizoDetalleCreador(null)}
                style={estilos.botonCerrarDetalle}
              >
                <X size={15} />
              </button>
            </div>
            <div style={estilos.cuerpoDetalle}>
              {/* Grid Metadatos */}
              <div style={estilos.gridMetadatos}>
                <div style={estilos.metaItem}>
                  <Clock size={12} style={estilos.iconoDetalle} />
                  <div>
                    <div style={estilos.metaLabel}>TIEMPO DE LANZAMIENTO</div>
                    <div style={estilos.metaValor}>{hechizo.tiempoLanzamiento}</div>
                  </div>
                </div>
                <div style={estilos.metaItem}>
                  <MapPin size={12} style={estilos.iconoDetalle} />
                  <div>
                    <div style={estilos.metaLabel}>ALCANCE / RANGO</div>
                    <div style={estilos.metaValor}>{hechizo.alcance}</div>
                  </div>
                </div>
                <div style={estilos.metaItem}>
                  <Layers size={12} style={estilos.iconoDetalle} />
                  <div>
                    <div style={estilos.metaLabel}>COMPONENTES</div>
                    <div style={estilos.metaValor}>{hechizo.componentes}</div>
                  </div>
                </div>
                <div style={estilos.metaItem}>
                  <Clock size={12} style={estilos.iconoDetalle} />
                  <div>
                    <div style={estilos.metaLabel}>DURACIÓN</div>
                    <div style={estilos.metaValor}>{hechizo.duracion || "Instantáneo"}</div>
                  </div>
                </div>
              </div>

              {/* Fila de propiedades visuales adicionales */}
              <div style={estilos.filaPropiedadesEspeciales}>
                {(hechizo.concentracion === true || hechizo.concentracion === "Sí" || hechizo.concentracion === "Si") && (
                  <span style={estilos.chipConcentracion}>CONCENTRACIÓN</span>
                )}
                {(hechizo.ritual === true || hechizo.ritual === "Sí" || hechizo.ritual === "Si") && (
                  <span style={estilos.chipRitual}>RITUAL</span>
                )}
                <span style={estilos.chipEscuela}>{hechizo.escuela}</span>
              </div>

              {/* Mostrar materiales detallados si existen */}
              {hechizo.materiales && (
                <div style={{ ...estilos.seccionDescripcionFicha, marginTop: "4px" }}>
                  <div style={estilos.descripcionTituloFicha}>MATERIALES DE LANZAMIENTO</div>
                  <div style={{ ...estilos.descripcionCuerpoFicha, fontSize: "11px", color: "var(--color-texto-secundario)", fontStyle: "italic" }}>
                    {hechizo.materiales}
                  </div>
                </div>
              )}

              {/* MECÁNICAS DE COMBATE (Si tiene ataque, CD o daño) */}
              {((hechizo.ataqueCd && hechizo.ataqueCd !== "N/A") || 
                (hechizo.dadosDaño) || 
                (hechizo.cdSalvacion && hechizo.cdSalvacion !== "N/A")) && (
                <div style={{
                  backgroundColor: "rgba(0, 245, 212, 0.05)",
                  border: "1.5px solid var(--color-borde-cian)",
                  padding: "8px",
                  borderRadius: "4px",
                  marginTop: "6px"
                }}>
                  <div style={{ fontSize: "10px", fontWeight: "bold", color: "var(--color-borde-cian)", marginBottom: "6px", textTransform: "uppercase" }}>
                    Mecánicas de Combate Integradas (D&D 5.5e)
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                    {hechizo.ataqueCd && hechizo.ataqueCd !== "N/A" && (
                      <div style={{ fontSize: "11px" }}>
                        <span style={{ color: "var(--color-texto-secundario)" }}>Ataque/Efecto: </span>
                        <strong style={{ color: "var(--color-activo)" }}>{hechizo.ataqueCd}</strong>
                      </div>
                    )}
                    {hechizo.cdSalvacion && hechizo.cdSalvacion !== "N/A" && (
                      <div style={{ fontSize: "11px" }}>
                        <span style={{ color: "var(--color-texto-secundario)" }}>CD Salvación: </span>
                        <strong style={{ color: "#ffcc00" }}>CD {hechizo.cdSalvacion}</strong>
                      </div>
                    )}
                    {hechizo.dadosDaño && (
                      <div style={{ fontSize: "11px" }}>
                        <span style={{ color: "var(--color-texto-secundario)" }}>Daño: </span>
                        <strong style={{ color: "#ff7675" }}>{hechizo.dadosDaño} {hechizo.tipoDaño && hechizo.tipoDaño !== "N/A" ? `(${hechizo.tipoDaño})` : ""}</strong>
                      </div>
                    )}
                    {hechizo.dadosDañoNivelSuperior && (
                      <div style={{ fontSize: "11px" }}>
                        <span style={{ color: "var(--color-texto-secundario)" }}>Daño Niv. Superior: </span>
                        <strong style={{ color: "#74b9ff" }}>+{hechizo.dadosDañoNivelSuperior}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Descripción Completa */}
              <div style={estilos.seccionDescripcionFicha}>
                <div style={estilos.descripcionTituloFicha}>DESCRIPCIÓN DEL CONJURO</div>
                <div style={estilos.descripcionCuerpoFicha}>
                  {hechizo.descripcion}
                </div>
              </div>

              {/* A niveles superiores si existe */}
              {hechizo.descNivelSuperior && (
                <div style={estilos.seccionDescripcionFicha}>
                  <div style={{ ...estilos.descripcionTituloFicha, color: "var(--color-activo)" }}>A NIVELES SUPERIORES</div>
                  <div style={{ ...estilos.descripcionCuerpoFicha, color: "var(--color-texto-secundario)" }}>
                    {hechizo.descNivelSuperior}
                  </div>
                </div>
              )}

              {/* Clases disponibles si existen */}
              {hechizo.clases && hechizo.clases.length > 0 && (
                <div style={{ ...estilos.seccionDescripcionFicha, marginTop: "8px" }}>
                  <div style={estilos.descripcionTituloFicha}>CLASES QUE PUEDEN UTILIZAR ESTE CONJURO</div>
                  <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "4px" }}>
                    {hechizo.clases.map((clase) => (
                      <span key={clase} style={{
                        fontSize: "9px",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid var(--color-borde-brutal)",
                        color: "var(--color-texto-principal)",
                        padding: "1px 5px",
                        borderRadius: "2px"
                      }}>
                        {clase}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Overlay Detalle Objeto en Creador */}
      {idObjetoDetalle && (() => {
        const objeto = objetosHomebrew.find(o => o.id === idObjetoDetalle);
        if (!objeto) return null;
        return (
          <div style={estilos.panelDetalleOverlay}>
            <div style={estilos.cabeceraDetalle}>
              <div style={estilos.cabeceraDetalleIzquierda}>
                <span style={{
                  ...estilos.hechizoNivelOverlay,
                  backgroundColor: "rgba(255, 118, 117, 0.1)",
                  border: "1px solid #ff7675",
                  color: "#ff7675"
                }}>
                  {objeto.categoria || "OBJETO"}
                </span>
                <span style={estilos.nombreHechizoOverlay}>{objeto.nombre}</span>
              </div>
              <button
                onClick={() => setIdObjetoDetalle(null)}
                style={estilos.botonCerrarDetalle}
              >
                <X size={15} />
              </button>
            </div>
            <div style={estilos.cuerpoDetalle}>
              {/* Grid Metadatos */}
              <div style={estilos.gridMetadatos}>
                <div style={estilos.metaItem}>
                  <Sparkles size={12} style={estilos.iconoDetalle} />
                  <div>
                    <div style={estilos.metaLabel}>RAREZA</div>
                    <div style={estilos.metaValor}>{objeto.rareza || "Común"}</div>
                  </div>
                </div>
                {objeto.costoValor !== undefined && objeto.costoValor > 0 && (
                  <div style={estilos.metaItem}>
                    <Coins size={12} style={estilos.iconoDetalle} />
                    <div>
                      <div style={estilos.metaLabel}>VALOR / COSTE</div>
                      <div style={estilos.metaValor}>{objeto.costoValor} {objeto.costoUnidad || "PO"}</div>
                    </div>
                  </div>
                )}
                {objeto.peso && (
                  <div style={estilos.metaItem}>
                    <Scale size={12} style={estilos.iconoDetalle} />
                    <div>
                      <div style={estilos.metaLabel}>PESO</div>
                      <div style={estilos.metaValor}>{objeto.peso}</div>
                    </div>
                  </div>
                )}
                {objeto.alcance && (
                  <div style={estilos.metaItem}>
                    <MapPin size={12} style={estilos.iconoDetalle} />
                    <div>
                      <div style={estilos.metaLabel}>ALCANCE</div>
                      <div style={estilos.metaValor}>{objeto.alcance}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fila de propiedades visuales adicionales */}
              <div style={estilos.filaPropiedadesEspeciales}>
                {objeto.tipoArma && objeto.tipoArma !== "N/A" && (
                  <span style={estilos.chipConcentracion}>ARMA {objeto.tipoArma}</span>
                )}
                {objeto.estiloAtaque && objeto.estiloAtaque !== "N/A" && (
                  <span style={estilos.chipRitual}>{objeto.estiloAtaque}</span>
                )}
                {objeto.propiedades && (
                  <span style={estilos.chipEscuela}>{objeto.propiedades}</span>
                )}
              </div>

              {/* MECÁNICAS DE COMBATE DE ARMA (Si es arma y tiene daño o bonos) */}
              {(objeto.dadosDaño || objeto.bonoAtaque || objeto.bonoDaño) && (
                <div style={{
                  backgroundColor: "rgba(255, 118, 117, 0.05)",
                  border: "1.5px solid #ff7675",
                  padding: "8px",
                  borderRadius: "4px",
                  marginTop: "6px"
                }}>
                  <div style={{ fontSize: "10px", fontWeight: "bold", color: "#ff7675", marginBottom: "6px", textTransform: "uppercase" }}>
                    Propiedades de Combate del Arma (D&D 5.5e)
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                    {objeto.dadosDaño && (
                      <div style={{ fontSize: "11px" }}>
                        <span style={{ color: "var(--color-texto-secundario)" }}>Daño base: </span>
                        <strong style={{ color: "#ff7675" }}>{objeto.dadosDaño} {objeto.tipoDaño && objeto.tipoDaño !== "N/A" ? `(${objeto.tipoDaño})` : ""}</strong>
                      </div>
                    )}
                    {objeto.bonoAtaque && (
                      <div style={{ fontSize: "11px" }}>
                        <span style={{ color: "var(--color-texto-secundario)" }}>Bono Ataque Mágico: </span>
                        <strong style={{ color: "#ffcc00" }}>+{objeto.bonoAtaque}</strong>
                      </div>
                    )}
                    {objeto.bonoDaño && (
                      <div style={{ fontSize: "11px" }}>
                        <span style={{ color: "var(--color-texto-secundario)" }}>Bono Daño Mágico: </span>
                        <strong style={{ color: "#ff7675" }}>+{objeto.bonoDaño}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Propiedades del arma en badges */}
              {objeto.propiedadesArma && objeto.propiedadesArma.length > 0 && (
                <div style={{ ...estilos.seccionDescripcionFicha, marginTop: "8px" }}>
                  <div style={estilos.descripcionTituloFicha}>PROPIEDADES TÁCTICAS DEL ARMA</div>
                  <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "4px" }}>
                    {objeto.propiedadesArma.map((prop) => (
                      <span key={prop} style={{
                        fontSize: "9px",
                        backgroundColor: "rgba(255, 118, 117, 0.1)",
                        border: "1px solid rgba(255, 118, 117, 0.3)",
                        color: "#ff7675",
                        padding: "1px 5px",
                        borderRadius: "2px"
                      }}>
                        {prop}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bonificaciones Mágicas Dinámicas */}
              {objeto.bonosMagicos && objeto.bonosMagicos.length > 0 && (
                <div style={{ ...estilos.seccionDescripcionFicha, marginTop: "8px" }}>
                  <div style={estilos.descripcionTituloFicha}>BONOS MÁGICOS Y MEJORAS ACTIVAS</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                    {objeto.bonosMagicos.map((bono, idx) => (
                      <div key={idx} style={{
                        fontSize: "11px",
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "4px 8px",
                        backgroundColor: "rgba(0, 245, 212, 0.05)",
                        border: "1px solid var(--color-borde-cian)",
                        borderRadius: "3px"
                      }}>
                        <span style={{ color: "var(--color-texto-secundario)" }}>
                          {bono.categoria} {bono.bono ? `(${bono.bono})` : ""}
                        </span>
                        <strong style={{ color: "var(--color-activo)" }}>
                          +{bono.valor}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Descripción Completa */}
              <div style={estilos.seccionDescripcionFicha}>
                <div style={estilos.descripcionTituloFicha}>DESCRIPCIÓN DEL OBJETO MÁGICO</div>
                <div style={estilos.descripcionCuerpoFicha}>
                  {objeto.descripcion}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

const estilos: { [key: string]: React.CSSProperties } = {
  contenedorHomebrew: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    width: "100%",
    backgroundColor: "var(--color-fondo-profundo)",
    padding: "6px",
    overflowY: "auto",
    position: "relative"
  },
  subNavegacion: {
    display: "flex",
    flexDirection: "row",
    gap: "6px",
    backgroundColor: "var(--color-fondo-panel)",
    borderBottom: "2px solid var(--color-borde-brutal)",
    padding: "8px",
    flexShrink: 0
  },
  subBotonNav: {
    backgroundColor: "var(--color-fondo-tarjeta)",
    border: "1px solid var(--color-borde-brutal)",
    color: "var(--color-texto-secundario)",
    fontSize: "12.5px",
    fontWeight: "600",
    padding: "7px 14px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
    borderRadius: "6px",
    transition: "all 0.15s ease"
  },
  subBotonNavActivo: {
    backgroundColor: "var(--color-primario-brillante)",
    borderColor: "var(--color-borde-cian)",
    color: "#ffffff",
    boxShadow: "0 2px 8px rgba(0,245,212,0.3)"
  },
  pestanasModoHomebrew: {
    display: "flex",
    flexDirection: "row",
    gap: "6px",
    backgroundColor: "var(--color-fondo-panel)",
    borderBottom: "1px solid var(--color-borde-brutal)",
    padding: "6px 8px",
    flexShrink: 0
  },
  botonModoHomebrew: {
    flex: 1,
    backgroundColor: "var(--color-fondo-tarjeta)",
    border: "1px solid var(--color-borde-brutal)",
    color: "var(--color-texto-secundario)",
    fontSize: "12.5px",
    padding: "7px 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    cursor: "pointer",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    borderRadius: "5px",
    transition: "all 0.15s ease"
  },
  botonModoHomebrewActivo: {
    backgroundColor: "var(--color-primario-brillante)",
    borderColor: "var(--color-borde-cian)",
    color: "#ffffff",
    boxShadow: "0 2px 8px rgba(0,245,212,0.25)"
  },
  cuerpoSeccion: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: "10px",
    flexGrow: 1,
    padding: "8px",
    overflowY: "auto"
  },
  panelFormulario: {
    flex: "1 1 360px",
    backgroundColor: "var(--color-fondo-panel)",
    border: "1px solid var(--color-borde-brutal)",
    borderRadius: "8px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "calc(100vh - 120px)",
    overflowY: "auto"
  },
  cabeceraPanel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "var(--color-borde-cian)",
    borderBottom: "2px solid var(--color-borde-cian)",
    paddingBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: "4px",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  formularioBrutal: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  subPestanasCriatura: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: "5px",
    borderBottom: "2px solid var(--color-borde-brutal)",
    paddingBottom: "8px",
    marginBottom: "8px"
  },
  subPestanaCriaturaBoton: {
    backgroundColor: "var(--color-fondo-tarjeta)",
    border: "1px solid var(--color-borde-brutal)",
    color: "var(--color-texto-secundario)",
    fontSize: "11.5px",
    fontWeight: "600",
    padding: "5px 11px",
    cursor: "pointer",
    textTransform: "uppercase",
    borderRadius: "4px",
    letterSpacing: "0.04em",
    transition: "all 0.12s ease"
  },
  subPestanaCriaturaBotonActiva: {
    backgroundColor: "var(--color-primario)",
    color: "#ffffff",
    borderColor: "var(--color-borde-cian)",
    boxShadow: "0 2px 6px rgba(0,245,212,0.2)"
  },
  seccionContenido: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "4px 0"
  },
  seccionContenidoListas: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxHeight: "440px",
    overflowY: "auto",
    paddingRight: "6px"
  },
  filaDobleForm: {
    display: "flex",
    flexDirection: "row",
    gap: "10px"
  },
  filaTripleForm: {
    display: "flex",
    flexDirection: "row",
    gap: "10px"
  },
  filaSeisForm: {
    display: "flex",
    flexDirection: "row",
    gap: "4px",
    justifyContent: "space-between",
    backgroundColor: "var(--color-fondo-tarjeta)",
    padding: "10px 8px",
    border: "1px solid var(--color-borde-brutal)",
    borderRadius: "6px"
  },
  campoForm: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    gap: "5px"
  },
  campoMiniForm: {
    display: "flex",
    flexDirection: "column",
    width: "16%",
    alignItems: "center",
    gap: "4px"
  },
  labelForm: {
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--color-texto-secundario)",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    letterSpacing: "0.01em"
  },
  labelMiniForm: {
    fontSize: "11px",
    fontWeight: "700",
    color: "var(--color-borde-cian)",
    fontFamily: "var(--fuente-codigo)",
    letterSpacing: "0.05em"
  },
  inputForm: {
    fontSize: "13px",
    padding: "7px 10px",
    width: "100%",
    backgroundColor: "var(--color-fondo-tarjeta)",
    border: "1.5px solid var(--color-borde-brutal)",
    borderRadius: "5px",
    color: "var(--color-texto-principal)",
    outline: "none",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease"
  },
  inputMiniForm: {
    fontSize: "13px",
    padding: "5px 3px",
    width: "46px",
    textAlign: "center",
    backgroundColor: "var(--color-fondo-profundo)",
    border: "1.5px solid var(--color-borde-brutal)",
    borderRadius: "4px",
    color: "var(--color-texto-principal)",
    outline: "none"
  },
  modificadorPrevisualizado: {
    fontSize: "12px",
    fontWeight: "bold",
    color: "var(--color-borde-cian)",
    marginTop: "1px"
  },
  selectForm: {
    fontSize: "13px",
    padding: "6px 10px",
    height: "34px",
    width: "100%",
    backgroundColor: "var(--color-fondo-tarjeta)",
    border: "1.5px solid var(--color-borde-brutal)",
    borderRadius: "5px",
    color: "var(--color-texto-principal)",
    outline: "none",
    cursor: "pointer",
    transition: "border-color 0.15s ease"
  },
  textareaBrutal: {
    backgroundColor: "var(--color-fondo-panel)",
    border: "1.5px solid var(--color-borde-brutal)",
    borderRadius: "5px",
    color: "var(--color-texto-principal)",
    fontSize: "13px",
    padding: "8px 10px",
    width: "100%",
    outline: "none",
    fontFamily: "inherit",
    lineHeight: "1.5",
    resize: "vertical"
  },
  cabeceraMiniSeccion: {
    fontSize: "11.5px",
    fontWeight: "700",
    color: "var(--color-borde-cian)",
    letterSpacing: "0.08em",
    marginTop: "8px",
    marginBottom: "6px",
    textTransform: "uppercase",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  gridHabilidades: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "6px 12px",
    backgroundColor: "var(--color-fondo-tarjeta)",
    padding: "10px",
    border: "1px solid var(--color-borde-brutal)",
    borderRadius: "6px"
  },
  itemHabilidadFila: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "2px 0"
  },
  habilidadNombreEtiqueta: {
    fontSize: "12.5px",
    color: "var(--color-texto-secundario)",
    fontWeight: "500"
  },
  inputHabilidad: {
    fontSize: "13px",
    padding: "4px 3px",
    width: "46px",
    textAlign: "center",
    backgroundColor: "var(--color-fondo-profundo)",
    border: "1.5px solid var(--color-borde-brutal)",
    borderRadius: "4px",
    color: "var(--color-texto-principal)",
    outline: "none"
  },
  selectorDefensasNavegacion: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: "5px",
    borderBottom: "1px solid var(--color-borde-brutal)",
    paddingBottom: "8px",
    marginBottom: "8px"
  },
  subDefBoton: {
    fontSize: "11.5px",
    fontWeight: "600",
    backgroundColor: "var(--color-fondo-tarjeta)",
    border: "1px solid var(--color-borde-brutal)",
    color: "var(--color-texto-secundario)",
    padding: "5px 10px",
    cursor: "pointer",
    borderRadius: "4px",
    transition: "all 0.12s ease"
  },
  subDefBotonActivo: {
    backgroundColor: "var(--color-primario-brillante)",
    color: "#ffffff",
    borderColor: "var(--color-borde-cian)",
    boxShadow: "0 2px 6px rgba(0,245,212,0.2)"
  },
  contenedorChecksDefensas: {
    backgroundColor: "var(--color-fondo-tarjeta)",
    border: "1px solid var(--color-borde-brutal)",
    borderRadius: "5px",
    padding: "10px",
    maxHeight: "200px",
    overflowY: "auto"
  },
  gridCheckboxMini: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "6px 4px"
  },
  labelCheckMini: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "5px",
    fontSize: "12px",
    color: "var(--color-texto-secundario)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    cursor: "pointer",
    padding: "2px 0"
  },
  checkMini: {
    margin: 0,
    width: "13px",
    height: "13px",
    cursor: "pointer",
    accentColor: "var(--color-borde-cian)"
  },
  bloqueDinamicoForm: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--color-fondo-tarjeta)",
    border: "1px solid var(--color-borde-brutal)",
    borderRadius: "7px",
    padding: "12px",
    gap: "8px"
  },
  tituloBloqueDinamico: {
    fontSize: "11px",
    fontWeight: "700",
    color: "var(--color-borde-cian)",
    borderBottom: "1px solid var(--color-borde-brutal)",
    paddingBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.07em"
  },
  filaAgregarRapido: {
    display: "flex",
    flexDirection: "row",
    gap: "6px",
    alignItems: "center",
    flexWrap: "wrap"
  },
  inputDinamicoMini: {
    fontSize: "13px",
    padding: "6px 7px",
    width: "68px",
    backgroundColor: "var(--color-fondo-profundo)",
    border: "1.5px solid var(--color-borde-brutal)",
    borderRadius: "4px",
    color: "var(--color-texto-principal)",
    outline: "none"
  },
  inputDinamicoMediano: {
    fontSize: "13px",
    padding: "6px 8px",
    width: "130px",
    backgroundColor: "var(--color-fondo-profundo)",
    border: "1.5px solid var(--color-borde-brutal)",
    borderRadius: "4px",
    color: "var(--color-texto-principal)",
    outline: "none"
  },
  inputDinamicoLargo: {
    fontSize: "13px",
    padding: "6px 9px",
    width: "100%",
    backgroundColor: "var(--color-fondo-profundo)",
    border: "1.5px solid var(--color-borde-brutal)",
    borderRadius: "4px",
    color: "var(--color-texto-principal)",
    outline: "none"
  },
  selectDinamicoMini: {
    fontSize: "12.5px",
    padding: "0px 6px",
    height: "30px",
    width: "85px",
    backgroundColor: "var(--color-fondo-profundo)",
    border: "1.5px solid var(--color-borde-brutal)",
    borderRadius: "4px",
    color: "var(--color-texto-principal)",
    outline: "none"
  },
  botonAgregarDinamico: {
    backgroundColor: "var(--color-primario)",
    border: "1px solid var(--color-borde-cian)",
    color: "#ffffff",
    padding: "5px 10px",
    fontSize: "13px",
    fontWeight: "bold",
    cursor: "pointer",
    borderRadius: "4px"
  },
  camposDinamicosGrupo: {
    display: "flex",
    flexDirection: "column",
    gap: "7px"
  },
  filaCamposAlineados: {
    display: "flex",
    flexDirection: "row",
    gap: "7px",
    width: "100%"
  },
  textareaDinamico: {
    fontSize: "12.5px",
    padding: "7px 9px",
    width: "100%",
    backgroundColor: "var(--color-fondo-profundo)",
    border: "1.5px solid var(--color-borde-brutal)",
    borderRadius: "4px",
    color: "var(--color-texto-principal)",
    outline: "none",
    fontFamily: "inherit",
    lineHeight: "1.45",
    resize: "vertical"
  },
  botonAgregarCompleto: {
    backgroundColor: "var(--color-primario)",
    border: "1px solid var(--color-borde-cian)",
    color: "#ffffff",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    alignSelf: "flex-end",
    borderRadius: "4px"
  },
  listaDinamicaVisual: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    backgroundColor: "var(--color-fondo-profundo)",
    padding: "6px",
    maxHeight: "170px",
    overflowY: "auto",
    border: "1px solid var(--color-borde-brutal)",
    borderRadius: "5px"
  },
  itemDinamicoVisual: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "var(--color-fondo-tarjeta)",
    padding: "6px 9px",
    fontSize: "12px",
    borderRadius: "4px",
    border: "1px solid transparent",
    transition: "all 0.12s ease"
  },
  botonEliminarDinamico: {
    background: "none",
    border: "none",
    color: "var(--color-peligro)",
    cursor: "pointer",
    padding: "2px"
  },
  botonEnviarBrutal: {
    background: "linear-gradient(135deg, var(--color-primario-brillante) 0%, var(--color-primario) 100%)",
    border: "1px solid var(--color-borde-cian)",
    color: "#ffffff",
    padding: "11px",
    fontSize: "13.5px",
    fontWeight: "700",
    marginTop: "10px",
    width: "100%",
    cursor: "pointer",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    borderRadius: "6px",
    boxShadow: "0 3px 12px rgba(0,245,212,0.2)"
  },
  panelLista: {
    flex: "1 1 250px",
    backgroundColor: "var(--color-fondo-panel)",
    border: "1px solid var(--color-borde-brutal)",
    borderRadius: "8px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    maxHeight: "calc(100vh - 120px)",
    height: "100%",
    overflowY: "auto"
  },
  contenedorScrollLista: {
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    flexGrow: 1,
    gap: "6px"
  },
  textoListaVacia: {
    fontSize: "13px",
    color: "var(--color-texto-apagado)",
    textAlign: "center",
    padding: "40px 20px",
    fontStyle: "italic",
    lineHeight: "1.6"
  },
  itemListaBrutal: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "var(--color-fondo-tarjeta)",
    border: "1px solid var(--color-borde-brutal)",
    borderRadius: "6px",
    padding: "9px 12px",
    transition: "all 0.12s ease"
  },
  itemInfoLista: {
    display: "flex",
    flexDirection: "column",
    gap: "3px"
  },
  itemNombre: {
    fontSize: "13.5px",
    fontWeight: "700",
    color: "var(--color-texto-principal)"
  },
  itemSub: {
    fontSize: "11.5px",
    color: "var(--color-texto-secundario)"
  },
  botonEliminarItem: {
    background: "none",
    border: "none",
    color: "var(--color-peligro)",
    cursor: "pointer",
    padding: "5px",
    display: "flex",
    alignItems: "center",
    borderRadius: "4px"
  },
  botonEditarItem: {
    background: "none",
    border: "none",
    color: "var(--color-borde-cian)",
    cursor: "pointer",
    padding: "5px",
    display: "flex",
    alignItems: "center",
    borderRadius: "4px"
  },
  grupoBotonesItem: {
    display: "flex",
    flexDirection: "row",
    gap: "4px",
    alignItems: "center"
  },
  grupoBotonesAccion: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "12px",
    width: "100%"
  },
  botonCancelarBrutal: {
    backgroundColor: "var(--color-fondo-tarjeta)",
    border: "1px solid var(--color-borde-brutal)",
    color: "var(--color-texto-secundario)",
    padding: "9px",
    fontSize: "12.5px",
    fontWeight: "600",
    width: "100%",
    cursor: "pointer",
    textTransform: "uppercase",
    textAlign: "center",
    borderRadius: "6px",
    letterSpacing: "0.04em"
  },
  cajaBuscadorHomebrew: {
    display: "flex",
    flexDirection: "row",
    gap: "6px",
    width: "100%",
    marginBottom: "6px"
  },
  inputBuscadorHomebrew: {
    flexGrow: 1,
    fontSize: "13px",
    padding: "7px 10px",
    backgroundColor: "var(--color-fondo-profundo)",
    border: "1.5px solid var(--color-borde-brutal)",
    borderRadius: "5px",
    color: "var(--color-texto-principal)",
    outline: "none"
  },
  botonLimpiarBusquedaHomebrew: {
    fontSize: "12px",
    padding: "7px 10px",
    backgroundColor: "var(--color-fondo-tarjeta)",
    border: "1px solid var(--color-borde-brutal)",
    borderRadius: "5px",
    color: "var(--color-texto-secundario)",
    cursor: "pointer"
  },
  panelDetalleOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    height: "85%",
    zIndex: 100,
    borderTop: "3px solid var(--color-borde-brutal)",
    borderLeft: "3px solid var(--color-borde-brutal)",
    borderRight: "3px solid var(--color-borde-brutal)",
    backgroundColor: "var(--color-fondo-profundo)",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 -10px 25px rgba(0, 0, 0, 0.6)",
    borderTopLeftRadius: "12px",
    borderTopRightRadius: "12px"
  },
  cabeceraDetalle: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "var(--color-fondo-tarjeta)",
    borderBottom: "1px solid var(--color-borde-brutal)",
    padding: "6px 12px",
    height: "28px"
  },
  cabeceraDetalleIzquierda: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "8px"
  },
  hechizoNivelOverlay: {
    fontSize: "9px",
    fontWeight: "bold",
    color: "#ffcc00",
    border: "1px solid #ffcc00",
    padding: "0 4px",
    fontFamily: "var(--fuente-codigo)"
  },
  nombreHechizoOverlay: {
    fontSize: "13px",
    fontWeight: "bold",
    color: "var(--color-texto-principal)"
  },
  botonCerrarDetalle: {
    background: "none",
    border: "none",
    color: "var(--color-texto-secundario)",
    cursor: "pointer",
    padding: "2px",
    display: "flex",
    alignItems: "center"
  },
  cuerpoDetalle: {
    flexGrow: 1,
    overflowY: "auto",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  gridMetadatos: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    backgroundColor: "var(--color-fondo-tarjeta)",
    border: "1.5px solid var(--color-borde-brutal)",
    padding: "8px"
  },
  metaItem: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "8px"
  },
  metaLabel: {
    fontSize: "8px",
    color: "var(--color-texto-apagado)",
    fontWeight: "bold"
  },
  metaValor: {
    fontSize: "11px",
    color: "var(--color-texto-principal)",
    fontWeight: "bold"
  },
  filaPropiedadesEspeciales: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: "6px"
  },
  chipConcentracion: {
    fontSize: "9px",
    backgroundColor: "rgba(255, 204, 0, 0.15)",
    border: "1px solid #ffcc00",
    color: "#ffcc00",
    padding: "1px 6px",
    fontWeight: "bold"
  },
  chipRitual: {
    fontSize: "9px",
    backgroundColor: "rgba(0, 245, 212, 0.15)",
    border: "1px solid var(--color-borde-cian)",
    color: "var(--color-borde-cian)",
    padding: "1px 6px",
    fontWeight: "bold"
  },
  chipEscuela: {
    fontSize: "9px",
    backgroundColor: "rgba(95, 93, 187, 0.15)",
    border: "1px solid rgba(95, 93, 187, 0.4)",
    color: "#a29bfe",
    padding: "1px 6px",
    textTransform: "uppercase",
    fontWeight: "bold"
  },
  seccionDescripcionFicha: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  descripcionTituloFicha: {
    fontSize: "10px",
    fontWeight: "bold",
    color: "var(--color-borde-cian)",
    letterSpacing: "0.05em",
    borderBottom: "1.5px solid var(--color-borde-brutal)",
    paddingBottom: "2px"
  },
  descripcionCuerpoFicha: {
    fontSize: "11.5px",
    color: "var(--color-texto-principal)",
    lineHeight: "1.45",
    whiteSpace: "pre-line",
    textAlign: "justify"
  },
  iconoDetalle: {
    color: "var(--color-borde-cian)"
  },

  /* ---- Nuevos tokens para unificación completa ---- */
  notaAyuda: {
    fontSize: "11.5px",
    color: "var(--color-texto-apagado)",
    marginTop: "4px",
    fontStyle: "italic",
    lineHeight: "1.4"
  },
  filaCheckboxes: {
    display: "flex",
    flexDirection: "row",
    gap: "18px",
    flexWrap: "wrap",
    padding: "4px 0"
  },
  labelCheckbox: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "7px",
    cursor: "pointer",
    fontSize: "13px",
    color: "var(--color-texto-secundario)",
    fontWeight: "500",
    userSelect: "none"
  },
  gridClasesDnd: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "6px 10px"
  }
} as { [key: string]: React.CSSProperties };
