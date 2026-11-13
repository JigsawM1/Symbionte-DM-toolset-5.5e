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
  sentidos: "Visión en la oscuridad 60 pies, Percepción pasiva 10",
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

export function usarFormularioInvocacion(idEnEdicion: string | null, alGuardarExitoso: () => void) {
  const [invocacionForm, setInvocacionForm] = useState<DatosFormularioInvocacion>(() => {
    const existente = usarAlmacenDM.getState().baseDatosInvocaciones.find(inv => inv.id === idEnEdicion);
    return existente
      ? { ...existente, subtiposDisponibles: existente.subtiposDisponibles.join(", ") }
      : estadoInicialInvocacion;
  });
  const [subPestana, setSubPestana] = useState<"general" | "escalado" | "habilidades">("general");

  const actualizarCampo = <K extends keyof DatosFormularioInvocacion>(
    campo: K,
    valor: DatosFormularioInvocacion[K]
  ) => {
    setInvocacionForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const actualizarCaracteristica = (caract: keyof DatosFormularioInvocacion["caracteristicas"], valor: number) => {
    setInvocacionForm((prev) => ({
      ...prev,
      caracteristicas: { ...prev.caracteristicas, [caract]: valor }
    }));
  };

  const agregarVelocidadEspecial = (vel: VelocidadEspecialInvocacion) => {
    setInvocacionForm((prev) => ({
      ...prev,
      velocidadesEspeciales: [...prev.velocidadesEspeciales, vel]
    }));
  };

  const eliminarVelocidadEspecial = (idx: number) => {
    setInvocacionForm((prev) => ({
      ...prev,
      velocidadesEspeciales: prev.velocidadesEspeciales.filter((_, i) => i !== idx)
    }));
  };

  const agregarAtaque = (ataque: AtaqueInvocacion) => {
    setInvocacionForm((prev) => ({
      ...prev,
      ataques: [...prev.ataques, ataque]
    }));
  };

  const eliminarAtaque = (idx: number) => {
    setInvocacionForm((prev) => ({
      ...prev,
      ataques: prev.ataques.filter((_, i) => i !== idx)
    }));
  };

  const agregarRasgoLista = (
    lista: "rasgos" | "accionesAdicionales" | "reacciones",
    rasgo: RasgoInvocacion
  ) => {
    setInvocacionForm((prev) => ({
      ...prev,
      [lista]: [...prev[lista], rasgo]
    }));
  };

  const eliminarRasgoLista = (
    lista: "rasgos" | "accionesAdicionales" | "reacciones",
    idx: number
  ) => {
    setInvocacionForm((prev) => ({
      ...prev,
      [lista]: prev[lista].filter((_, i) => i !== idx)
    }));
  };

  const manejarGuardarInvocacion = (e: React.FormEvent) => {
    e.preventDefault();
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
    agregarVelocidadEspecial,
    eliminarVelocidadEspecial,
    agregarAtaque,
    eliminarAtaque,
    agregarRasgoLista,
    eliminarRasgoLista,
    manejarGuardarInvocacion
  };
}
