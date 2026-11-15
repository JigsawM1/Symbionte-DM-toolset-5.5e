import { useState } from "react";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import {
  PlantillaInvocacion,
  EsquemaPlantillaInvocacion,
  AtaqueInvocacion,
  RasgoInvocacion,
  VelocidadEspecialInvocacion
} from "@/tipos";
import { logger } from "@/utiles/logger";
import { usarEditorLista } from "./usarListaDinamica";

export type DatosFormularioInvocacion = Omit<PlantillaInvocacion, "id" | "nombreNormalizado" | "subtiposDisponibles"> & {
  subtiposDisponibles: string;
};

const estadoInicialInvocacion: DatosFormularioInvocacion = {
  nombre: "",
  conjuroAsociado: "",
  nivelMinimo: 2,
  nivelMaximo: 9,
  tipoCriatura: "Espíritu",
  tamano: "Mediano",
  alineacion: "Neutral",
  subtiposDisponibles: "",
  velocidadBase: { caminar: 30, planea: false },
  velocidadesEspeciales: [],
  sentidos: { percepcionPasiva: 10 },
  idiomas: "Entiende los idiomas que tú hablas",
  caracteristicas: {
    fuerza: 14,
    destreza: 14,
    constitucion: 14,
    inteligencia: 10,
    sabiduria: 12,
    carisma: 10
  },
  formulaCA: {
    base: 11,
    sumaNivelConjuro: true,
    bonificadorAdicional: 0
  },
  formulaVida: {
    base: 30,
    porNivel: 10,
    porNivelPorEncimaDelMinimo: true,
    dadoGolpeVisual: ""
  },
  formulaAtaquesPorAccion: "mitad_nivel_abajo",
  ataques: [],
  rasgos: [],
  accionesAdicionales: [],
  reacciones: [],
  fuente: "Homebrew"
};

const ataqueInvocacionInicial: AtaqueInvocacion = {
  nombre: "",
  tipo: "cuerpo_a_cuerpo",
  alcance: "5 pies",
  usaModificadorAtaqueConjuros: true,
  dadosDanoBase: "1d8",
  modificadorDanoFijo: 3,
  sumaNivelAlDano: true,
  tipoDano: "fuerza",
  descripcionExtra: ""
};

const rasgoInvocacionInicial: RasgoInvocacion = {
  nombre: "",
  subtipoRequerido: "",
  uso: "",
  recarga: "",
  descripcion: ""
};

function normalizarAtaque(ataque: AtaqueInvocacion): AtaqueInvocacion | null {
  const nombre = ataque.nombre.trim();
  const dadosDanoBase = ataque.dadosDanoBase.trim();
  if (!nombre || !dadosDanoBase) return null;
  return {
    ...ataque,
    nombre,
    alcance: ataque.alcance.trim() || "5 pies",
    dadosDanoBase,
    tipoDano: ataque.tipoDano.trim() || "fuerza",
    descripcionExtra: ataque.descripcionExtra?.trim() || undefined
  };
}

function normalizarRasgo(rasgo: RasgoInvocacion): RasgoInvocacion | null {
  const nombre = rasgo.nombre.trim();
  const descripcion = rasgo.descripcion.trim();
  if (!nombre || !descripcion) return null;
  return {
    ...rasgo,
    nombre,
    subtipoRequerido: rasgo.subtipoRequerido?.trim() || undefined,
    uso: rasgo.uso?.trim() || undefined,
    recarga: rasgo.recarga?.trim() || undefined,
    descripcion
  };
}

function normalizarVelocidadEspecial(velocidad: VelocidadEspecialInvocacion): VelocidadEspecialInvocacion | null {
  const velocidadTexto = velocidad.velocidadTexto.trim();
  if (!velocidadTexto) return null;
  return { nivelMinimo: Math.max(1, Math.min(9, velocidad.nivelMinimo)), velocidadTexto };
}

/**
 * Hook de estado y acciones para el formulario de creación y edición de invocaciones PJ.
 */
export function usarFormularioInvocacion(idEnEdicion: string | null, alGuardarExitoso: () => void) {
  const [invocacionForm, setInvocacionForm] = useState<DatosFormularioInvocacion>(() => {
    const existente = usarAlmacenDM.getState().baseDatosInvocaciones.find(inv => inv.id === idEnEdicion);
    return existente
      ? { ...existente, subtiposDisponibles: existente.subtiposDisponibles.join(", ") }
      : estadoInicialInvocacion;
  });
  const [subPestana, setSubPestana] = useState<"general" | "escalado" | "habilidades">("general");

  const actualizarCampo = <K extends keyof DatosFormularioInvocacion>(campo: K, valor: DatosFormularioInvocacion[K]) => {
    setInvocacionForm(prev => ({ ...prev, [campo]: valor }));
  };

  const actualizarCaracteristica = (caract: keyof DatosFormularioInvocacion["caracteristicas"], valor: number) => {
    setInvocacionForm(prev => ({
      ...prev,
      caracteristicas: { ...prev.caracteristicas, [caract]: valor }
    }));
  };

  const listaVelocidades = usarEditorLista(
    { nivelMinimo: invocacionForm.nivelMinimo, velocidadTexto: "" },
    items => actualizarCampo("velocidadesEspeciales", items),
    invocacionForm.velocidadesEspeciales,
    normalizarVelocidadEspecial
  );
  const listaAtaques = usarEditorLista(
    ataqueInvocacionInicial, items => actualizarCampo("ataques", items), invocacionForm.ataques, normalizarAtaque
  );
  const listaRasgos = usarEditorLista(
    rasgoInvocacionInicial, items => actualizarCampo("rasgos", items), invocacionForm.rasgos, normalizarRasgo
  );
  const listaAccionesAdicionales = usarEditorLista(
    rasgoInvocacionInicial,
    items => actualizarCampo("accionesAdicionales", items),
    invocacionForm.accionesAdicionales,
    normalizarRasgo
  );
  const listaReacciones = usarEditorLista(
    rasgoInvocacionInicial, items => actualizarCampo("reacciones", items), invocacionForm.reacciones, normalizarRasgo
  );
  const hayBorradores = [listaVelocidades, listaAtaques, listaRasgos, listaAccionesAdicionales, listaReacciones]
    .some(lista => lista.hayBorrador);

  const manejarGuardarInvocacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (hayBorradores) return;
    const { agregarNotificacion, baseDatosInvocaciones, agregarInvocacionHomebrew, actualizarInvocacionHomebrew } = usarAlmacenDM.getState();
    if (!invocacionForm.nombre.trim()) {
      agregarNotificacion("El nombre de la invocación es obligatorio", "error");
      return;
    }
    if (!invocacionForm.conjuroAsociado.trim()) {
      agregarNotificacion("El conjuro asociado es obligatorio", "error");
      return;
    }
    if (idEnEdicion && !baseDatosInvocaciones.some(inv => inv.id === idEnEdicion)) {
      agregarNotificacion("La invocación que estás editando ya no existe", "error");
      return;
    }

    const nivelMin = Math.max(1, Math.min(9, invocacionForm.nivelMinimo));
    const nivelMax = Math.max(nivelMin, Math.min(9, invocacionForm.nivelMaximo));

    try {
      const validada = EsquemaPlantillaInvocacion.parse({
        ...invocacionForm,
        id: idEnEdicion || "temp_inv",
        nombre: invocacionForm.nombre.trim(),
        conjuroAsociado: invocacionForm.conjuroAsociado.trim(),
        subtiposDisponibles: invocacionForm.subtiposDisponibles.split(",").map(s => s.trim()).filter(Boolean),
        nivelMinimo: nivelMin,
        nivelMaximo: nivelMax
      });

      if (idEnEdicion) {
        actualizarInvocacionHomebrew(idEnEdicion, validada);
        agregarNotificacion("¡Invocación PJ actualizada con éxito!", "exito");
      } else {
        agregarInvocacionHomebrew(validada);
        agregarNotificacion("¡Invocación PJ creada con éxito!", "exito");
      }
      alGuardarExitoso();
    } catch (error) {
      logger.error("[FormularioInvocacion] Error al validar plantilla de invocación:", error);
      agregarNotificacion("Revisa los campos de la invocación antes de guardar", "error");
    }
  };

  return {
    invocacionForm,
    subPestana,
    setSubPestana,
    actualizarCampo,
    actualizarCaracteristica,
    hayBorradores,
    listaVelocidades,
    listaAtaques,
    listaRasgos,
    listaAccionesAdicionales,
    listaReacciones,
    manejarGuardarInvocacion
  };
}
