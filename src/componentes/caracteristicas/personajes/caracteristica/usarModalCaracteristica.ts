import { useState } from "react";
import type { PersonajeJugador, Caracteristica, PersonalizacionCaracteristica } from "@/tipos";
import {
  DESCRIPCIONES_CARACTERISTICAS,
  obtenerBonoCompetenciaPorNivel
} from "@/constantes";
import { calcularModificadorCaracteristica } from "@/servicios/procesadorDescansos";
import { lanzarDadosTaleSpire } from "@/utiles/lanzadorDados";

export const NOMBRES_CARACTERISTICAS: Record<Caracteristica, string> = {
  fuerza: "Fuerza",
  destreza: "Destreza",
  constitucion: "Constitución",
  inteligencia: "Inteligencia",
  sabiduria: "Sabiduría",
  carisma: "Carisma"
};

export const ABREVIATURAS_CARACTERISTICAS: Record<Caracteristica, string> = {
  fuerza: "FUE",
  destreza: "DES",
  constitucion: "CON",
  inteligencia: "INT",
  sabiduria: "SAB",
  carisma: "CAR"
};

export interface ParametrosGuardadoCaracteristica {
  valorBase: number;
  overrideFijo: number | null;
  competenteSalvacion: boolean;
  personalizacion?: Partial<PersonalizacionCaracteristica>;
}

interface PropiedadesHookModalCaracteristica {
  caracteristicaClave: Caracteristica;
  personaje: PersonajeJugador;
  alCerrar: () => void;
  alGuardar: (carac: Caracteristica, cambios: ParametrosGuardadoCaracteristica) => void;
  alTirarCaracteristica?: (carac: Caracteristica, nombre: string, bono: number) => void;
  alTirarSalvacion?: (carac: Caracteristica, nombre: string, bono: number) => void;
}

export const usarModalCaracteristica = ({
  caracteristicaClave,
  personaje,
  alCerrar,
  alGuardar,
  alTirarCaracteristica,
  alTirarSalvacion
}: PropiedadesHookModalCaracteristica) => {
  const [pestanaActiva, setPestanaActiva] = useState<"info" | "personalizar">("info");

  const nombreCarac = NOMBRES_CARACTERISTICAS[caracteristicaClave] || "Característica";
  const abrev = ABREVIATURAS_CARACTERISTICAS[caracteristicaClave] || "ATR";
  const descripcionSalvacionOficial = DESCRIPCIONES_CARACTERISTICAS[caracteristicaClave] || "";

  const customExistente = personaje.personalizacionesCaracteristicas?.[caracteristicaClave];
  const valorBaseActual = personaje.caracteristicas?.[caracteristicaClave] ?? 10;
  const overrideActual = customExistente?.valorFijo ?? personaje.overridesFijos?.[caracteristicaClave] ?? null;
  const esCompetenteActual = !!personaje.competenciasSalvacion?.[caracteristicaClave];

  // Estado del formulario
  const [nombreForm, setNombreForm] = useState<string>(customExistente?.nombrePersonalizado ?? "");
  const [descForm, setDescForm] = useState<string>(
    customExistente?.descripcionPersonalizada ?? descripcionSalvacionOficial
  );
  const [valorBaseForm, setValorBaseForm] = useState<string>(String(valorBaseActual));
  const [overrideForm, setOverrideForm] = useState<string>(
    overrideActual !== null && overrideActual !== undefined ? String(overrideActual) : ""
  );
  const [modExtraForm, setModExtraForm] = useState<string>(
    customExistente?.modificadorExtra !== undefined && customExistente.modificadorExtra !== 0
      ? String(customExistente.modificadorExtra)
      : ""
  );
  const [bonoSalvacionExtraForm, setBonoSalvacionExtraForm] = useState<string>(
    customExistente?.bonoSalvacionExtra !== undefined && customExistente.bonoSalvacionExtra !== 0
      ? String(customExistente.bonoSalvacionExtra)
      : ""
  );
  const [competenteSalvacionForm, setCompetenteSalvacionForm] = useState<boolean>(esCompetenteActual);
  const [notasForm, setNotasForm] = useState<string>(customExistente?.notas ?? "");

  // Cálculos reactivos para preview
  const pb = obtenerBonoCompetenciaPorNivel(personaje.nivel || 1);
  const baseNumPreview = parseInt(valorBaseForm, 10);
  const baseValidaPreview = !isNaN(baseNumPreview) && baseNumPreview >= 1 && baseNumPreview <= 30 ? baseNumPreview : valorBaseActual;
  const overrideNumPreview = overrideForm.trim() !== "" ? parseInt(overrideForm, 10) : null;
  const overrideValidoPreview = overrideNumPreview !== null && !isNaN(overrideNumPreview) && overrideNumPreview >= 1 && overrideNumPreview <= 30 ? overrideNumPreview : null;
  const valorEfectivoPreview = overrideValidoPreview !== null ? overrideValidoPreview : baseValidaPreview;
  const modBasePreview = calcularModificadorCaracteristica(valorEfectivoPreview);
  const modExtraNumPreview = parseInt(modExtraForm, 10) || 0;
  const modTotalPreview = modBasePreview + modExtraNumPreview;
  const bonoSalvExtraNumPreview = parseInt(bonoSalvacionExtraForm, 10) || 0;
  const bonoSalvacionPreview = (competenteSalvacionForm ? modTotalPreview + pb : modTotalPreview) + bonoSalvExtraNumPreview;

  // Valores guardados para tiradas directas
  const valorEfectivoGuardado = overrideActual !== null && overrideActual !== undefined ? overrideActual : valorBaseActual;
  const modBaseGuardado = calcularModificadorCaracteristica(valorEfectivoGuardado);
  const modExtraGuardado = customExistente?.modificadorExtra || 0;
  const modTotalGuardado = modBaseGuardado + modExtraGuardado;
  const bonoSalvExtraGuardado = customExistente?.bonoSalvacionExtra || 0;
  const bonoSalvacionGuardado = (esCompetenteActual ? modTotalGuardado + pb : modTotalGuardado) + bonoSalvExtraGuardado;

  const tituloMostrar = customExistente?.nombrePersonalizado || nombreCarac;
  const descripcionMostrar = customExistente?.descripcionPersonalizada || descripcionSalvacionOficial;

  const cambiarBaseDelta = (delta: number) => {
    const num = parseInt(valorBaseForm, 10);
    const actual = !isNaN(num) ? num : valorBaseActual;
    const nuevo = Math.max(1, Math.min(30, actual + delta));
    setValorBaseForm(String(nuevo));
  };

  const ejecutarTiradaCaracteristica = () => {
    if (alTirarCaracteristica) {
      alTirarCaracteristica(caracteristicaClave, tituloMostrar, modTotalGuardado);
    } else {
      const formula = modTotalGuardado >= 0 ? `1d20+${modTotalGuardado}` : `1d20${modTotalGuardado}`;
      void lanzarDadosTaleSpire(formula, `Prueba de ${abrev}`);
    }
  };

  const ejecutarTiradaSalvacion = () => {
    if (alTirarSalvacion) {
      alTirarSalvacion(caracteristicaClave, tituloMostrar, bonoSalvacionGuardado);
    } else {
      const formula = bonoSalvacionGuardado >= 0 ? `1d20+${bonoSalvacionGuardado}` : `1d20${bonoSalvacionGuardado}`;
      void lanzarDadosTaleSpire(formula, `Salvación de ${abrev}`);
    }
  };

  const manejarGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    const baseNum = parseInt(valorBaseForm, 10);
    const baseFinal = !isNaN(baseNum) && baseNum >= 1 && baseNum <= 30 ? baseNum : valorBaseActual;
    const overrideNum = overrideForm.trim() !== "" ? parseInt(overrideForm, 10) : null;
    const overrideFinal = overrideNum !== null && !isNaN(overrideNum) && overrideNum >= 1 && overrideNum <= 30 ? overrideNum : null;
    const modExtraFinal = parseInt(modExtraForm, 10) || 0;
    const bonoSalvExtraFinal = parseInt(bonoSalvacionExtraForm, 10) || 0;

    alGuardar(caracteristicaClave, {
      valorBase: baseFinal,
      overrideFijo: overrideFinal,
      competenteSalvacion: competenteSalvacionForm,
      personalizacion: {
        nombrePersonalizado: nombreForm.trim() !== "" ? nombreForm.trim() : undefined,
        descripcionPersonalizada: descForm.trim() !== "" ? descForm.trim() : undefined,
        modificadorExtra: modExtraFinal,
        valorFijo: overrideFinal,
        bonoSalvacionExtra: bonoSalvExtraFinal,
        notas: notasForm
      }
    });

    alCerrar();
  };

  return {
    pestanaActiva,
    setPestanaActiva,
    nombreCarac,
    abrev,
    tituloMostrar,
    descripcionMostrar,
    customExistente,
    valorBaseActual,
    overrideActual,
    esCompetenteActual,
    nombreForm,
    setNombreForm,
    descForm,
    setDescForm,
    valorBaseForm,
    setValorBaseForm,
    overrideForm,
    setOverrideForm,
    modExtraForm,
    setModExtraForm,
    bonoSalvacionExtraForm,
    setBonoSalvacionExtraForm,
    competenteSalvacionForm,
    setCompetenteSalvacionForm,
    notasForm,
    setNotasForm,
    pb,
    valorEfectivoPreview,
    modBasePreview,
    modTotalPreview,
    overrideValidoPreview,
    bonoSalvacionPreview,
    valorEfectivoGuardado,
    modBaseGuardado,
    modExtraGuardado,
    modTotalGuardado,
    bonoSalvExtraGuardado,
    bonoSalvacionGuardado,
    cambiarBaseDelta,
    ejecutarTiradaCaracteristica,
    ejecutarTiradaSalvacion,
    manejarGuardar
  };
};
