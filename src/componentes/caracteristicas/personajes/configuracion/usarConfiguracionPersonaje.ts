import { useState, useEffect } from "react";
import type React from "react";
import type {
  PersonajeJugador,
  Caracteristica,
  Habilidad,
  ClasePersonaje,
  PersonalizacionCaracteristica,
  ClaseLanzadora
} from "@/tipos";
import { resolverGruposYSustitutosCompetencias } from "@/constantes";
import { sincronizarRasgosAutomaticos } from "@/servicios/compendioRasgos";
import {
  detectarTipoLanzador,
  calcularTodosRecursosMagicos
} from "@/servicios/calculadorMagia";
import { construirBuildClase } from "@/servicios/gestorClases";
import { obtenerNombreJugadorActivo } from "@/servicios/sistemaTaleSpire";
import { logger } from "@/utiles/logger";
import {
  sincronizarMagiaMulticlase,
  aplicarCambioClaseNombre,
  aplicarCambioClaseSubclase,
  aplicarCambioClaseNivel,
  aplicarAgregarClase,
  aplicarEliminarClase,
  aplicarCambioNivelTotal,
  aplicarCambioExperiencia
} from "@/servicios/sincronizadorMulticlase";
import type { CategoriaCompetencia } from "../ModalSelectorCompetencias";

export type PestanaConfiguracion = "identidad" | "atributos" | "competencias" | "sentidos" | "magia";

export function usarConfiguracionPersonaje(
  personaje: PersonajeJugador,
  alGuardar: (cambios: Partial<PersonajeJugador>) => void,
  alVolverAFicha: () => void
) {
  const [pestanaActiva, setPestanaActiva] = useState<PestanaConfiguracion>("identidad");

  const [form, setForm] = useState<PersonajeJugador>(() => {
    const armasGrupos = personaje.competenciasArmasGrupos || [];
    const armasLista = personaje.competenciasArmasLista || [];
    const armadurasGrupos = personaje.competenciasArmadurasGrupos || [];
    const armadurasLista = personaje.competenciasArmadurasLista || [];
    const idiomasLista =
      personaje.idiomasLista && personaje.idiomasLista.length > 0
        ? personaje.idiomasLista
        : personaje.idiomas ? personaje.idiomas.split(",").map((s) => s.trim()).filter(Boolean) : ["Común"];
    const herramientasLista =
      personaje.herramientasLista && personaje.herramientasLista.length > 0
        ? personaje.herramientasLista
        : personaje.herramientas ? personaje.herramientas.split(",").map((s) => s.trim()).filter(Boolean) : [];

    const clasesIniciales: ClasePersonaje[] =
      personaje.clases && personaje.clases.length > 0
        ? personaje.clases
        : [
            {
              nombre: personaje.clase || "Guerrero",
              subclase: personaje.subclase || "",
              nivel: personaje.nivel || 1
            }
          ];

    const baseForm: PersonajeJugador = {
      ...personaje,
      clases: clasesIniciales,
      subespecie: personaje.subespecie || "",
      hpMaximoBase: personaje.hpMaximoBase || personaje.hpMaximo || 10,
      competenciasArmasGrupos: armasGrupos,
      competenciasArmasLista: armasLista,
      competenciasArmadurasGrupos: armadurasGrupos,
      competenciasArmadurasLista: armadurasLista,
      idiomasLista,
      herramientasLista,
      personalizacionesHabilidades: personaje.personalizacionesHabilidades || {},
      personalizacionesCaracteristicas: personaje.personalizacionesCaracteristicas || {}
    };

    const sincMagia = sincronizarMagiaMulticlase(
      clasesIniciales,
      baseForm.overrideEspaciosConjuro,
      baseForm.overridePuntosConjuro,
      baseForm.conjurosPreparadosIds || [],
      baseForm.conjurosConocidosIds || [],
      baseForm.trucosConocidosIds || [],
      baseForm.conjurosSiemprePreparadosIds || []
    );

    return {
      ...baseForm,
      ...sincMagia
    };
  });

  const [habilidadEnDetalle, setHabilidadEnDetalle] = useState<{
    clave: Habilidad;
    nombre: string;
  } | null>(null);

  const [caracteristicaEnDetalle, setCaracteristicaEnDetalle] = useState<Caracteristica | null>(null);
  const [modalCompetencias, setModalCompetencias] = useState<CategoriaCompetencia | null>(null);

  useEffect(() => {
    if (!form.jugador || form.jugador.trim() === "") {
      obtenerNombreJugadorActivo()
        .then((nombreDetectado: string | null) => {
          if (nombreDetectado && nombreDetectado.trim() !== "") {
            setForm((prev) => ({ ...prev, jugador: nombreDetectado.trim() }));
          }
        })
        .catch((err: unknown) => {
          logger.error("[usarConfiguracionPersonaje] Error al auto-detectar jugador:", err);
        });
    }
  }, []);

  const actualizarCampo = <K extends keyof PersonajeJugador>(campo: K, valor: PersonajeJugador[K]) => {
    setForm((prev) => {
      const nuevo = { ...prev, [campo]: valor };
      if (campo === "especie" || campo === "subespecie") {
        nuevo.rasgos = sincronizarRasgosAutomaticos(nuevo);
      }
      return nuevo;
    });
  };

  const manejarDetectarJugadorTaleSpire = async () => {
    try {
      const nombreTS = await obtenerNombreJugadorActivo();
      if (nombreTS && nombreTS.trim() !== "") {
        setForm((prev) => ({ ...prev, jugador: nombreTS.trim() }));
      }
    } catch (e: unknown) {
      logger.error("[usarConfiguracionPersonaje] Error al detectar jugador:", e);
    }
  };

  const manejarCambioClaseNombre = (index: number, nuevoNombre: string) => {
    setForm((prev) => aplicarCambioClaseNombre(prev, index, nuevoNombre));
  };

  const manejarCambioClaseSubclase = (index: number, nuevaSubclase: string) => {
    setForm((prev) => aplicarCambioClaseSubclase(prev, index, nuevaSubclase));
  };

  const manejarAplicarBuildSugerida = (index: number) => {
    const claseItem = form.clases?.[index];
    if (!claseItem) return;
    const build = construirBuildClase(claseItem.nombre, claseItem.nivel, claseItem.subclase);
    if (!build) return;

    setForm((prev) => {
      const salvacionesActualizadas = {
        ...prev.competenciasSalvacion,
        fuerza: build.salvacionesCompetentes.includes("fuerza"),
        destreza: build.salvacionesCompetentes.includes("destreza"),
        constitucion: build.salvacionesCompetentes.includes("constitucion"),
        inteligencia: build.salvacionesCompetentes.includes("inteligencia"),
        sabiduria: build.salvacionesCompetentes.includes("sabiduria"),
        carisma: build.salvacionesCompetentes.includes("carisma")
      };

      const resComp = resolverGruposYSustitutosCompetencias(
        [...(prev.competenciasArmasGrupos || []), ...build.competenciasArmas],
        [...(prev.competenciasArmadurasGrupos || []), ...build.competenciasArmaduras]
      );

      return {
        ...prev,
        tipoDadoGolpe: build.dadoGolpe,
        competenciasSalvacion: salvacionesActualizadas,
        competenciasArmas: resComp.competenciasArmas,
        competenciasArmasGrupos: resComp.competenciasArmasGrupos,
        competenciasArmasLista: Array.from(new Set([...(prev.competenciasArmasLista || []), ...resComp.competenciasArmasLista])),
        competenciasArmaduras: resComp.competenciasArmaduras,
        competenciasArmadurasGrupos: resComp.competenciasArmadurasGrupos,
        competenciasArmadurasLista: Array.from(new Set([...(prev.competenciasArmadurasLista || []), ...resComp.competenciasArmadurasLista]))
      };
    });
  };

  const manejarCambioClaseNivel = (index: number, nuevoNivelStr: string) => {
    setForm((prev) => aplicarCambioClaseNivel(prev, index, nuevoNivelStr));
  };

  const manejarAgregarClase = () => {
    setForm((prev) => aplicarAgregarClase(prev));
  };

  const manejarEliminarClase = (index: number) => {
    setForm((prev) => aplicarEliminarClase(prev, index));
  };

  const manejarCambioNivelTotal = (nuevoNivelStr: string) => {
    setForm((prev) => aplicarCambioNivelTotal(prev, nuevoNivelStr));
  };

  const manejarCambioExperiencia = (nuevaXpStr: string) => {
    setForm((prev) => aplicarCambioExperiencia(prev, nuevaXpStr));
  };

  const manejarGuardarCaracteristica = (
    carac: Caracteristica,
    cambios: {
      valorBase: number;
      overrideFijo: number | null;
      competenteSalvacion: boolean;
      personalizacion?: Partial<PersonalizacionCaracteristica>;
    }
  ) => {
    setForm((prev) => ({
      ...prev,
      caracteristicas: { ...prev.caracteristicas, [carac]: cambios.valorBase },
      overridesFijos: { ...prev.overridesFijos, [carac]: cambios.overrideFijo },
      competenciasSalvacion: { ...prev.competenciasSalvacion, [carac]: cambios.competenteSalvacion },
      personalizacionesCaracteristicas: {
        ...prev.personalizacionesCaracteristicas,
        [carac]: {
          ...(prev.personalizacionesCaracteristicas?.[carac] || {}),
          ...(cambios.personalizacion || {})
        }
      }
    }));
    setCaracteristicaEnDetalle(null);
  };

  const manejarGuardarCompetencias = (nuevasCompetencias: {
    competenciasArmasGrupos: ("sencillas" | "marciales" | "fuego")[];
    competenciasArmasLista: string[];
    competenciasArmas: string;
    competenciasArmadurasGrupos: ("ligeras" | "medias" | "pesadas" | "escudos")[];
    competenciasArmadurasLista: string[];
    competenciasArmaduras: string;
    idiomasLista: string[];
    idiomas: string;
    herramientasLista: string[];
    herramientas: string;
  }) => {
    setForm((prev) => ({ ...prev, ...nuevasCompetencias }));
  };

  const manejarAlternarEsLanzador = (nuevoEsLanzador: boolean) => {
    let nuevasClases = form.clasesLanzadoras || [];

    if (nuevoEsLanzador && nuevasClases.length === 0) {
      const detectada = detectarTipoLanzador(form.clase, form.subclase);
      if (detectada) {
        nuevasClases = [{
          clase: form.clase || "Mago",
          nivel: form.nivel || 1,
          tipoLanzador: detectada.tipo,
          habilidadConjuro: detectada.habilidad,
          modeloConjuros: detectada.modelo
        }];
      } else {
        nuevasClases = [{
          clase: form.clase || "Lanzador",
          nivel: form.nivel || 1,
          tipoLanzador: "completo",
          habilidadConjuro: "inteligencia",
          modeloConjuros: "conocidos"
        }];
      }
    }

    const recursos = calcularTodosRecursosMagicos(
      nuevasClases,
      form.overrideEspaciosConjuro,
      form.overridePuntosConjuro
    );

    setForm((prev) => ({
      ...prev,
      esLanzador: nuevoEsLanzador,
      clasesLanzadoras: nuevasClases,
      espaciosConjuroMaximos: nuevoEsLanzador ? recursos.espaciosConjuroMaximos : {},
      puntosConjuroMaximos: nuevoEsLanzador ? recursos.puntosConjuroMaximos : 0,
      nivelConjuroMaximo: nuevoEsLanzador ? recursos.nivelConjuroMaximo : 0,
      espaciosPactoMaximos: nuevoEsLanzador ? recursos.espaciosPactoMaximos : 0,
      nivelEspacioPacto: nuevoEsLanzador ? recursos.nivelEspacioPacto : 0
    }));
  };

  const manejarAgregarClaseLanzadora = () => {
    const detectada = detectarTipoLanzador(form.clase, form.subclase);
    const nuevaClase = {
      clase: form.clase || "Mago",
      nivel: form.nivel || 1,
      tipoLanzador: detectada?.tipo || "completo",
      habilidadConjuro: detectada?.habilidad || "inteligencia",
      modeloConjuros: detectada?.modelo || "conocidos"
    };
    const nuevasClases = [...(form.clasesLanzadoras || []), nuevaClase];
    const recursos = calcularTodosRecursosMagicos(
      nuevasClases,
      form.overrideEspaciosConjuro,
      form.overridePuntosConjuro
    );

    setForm((prev) => ({
      ...prev,
      clasesLanzadoras: nuevasClases,
      espaciosConjuroMaximos: recursos.espaciosConjuroMaximos,
      puntosConjuroMaximos: recursos.puntosConjuroMaximos,
      nivelConjuroMaximo: recursos.nivelConjuroMaximo,
      espaciosPactoMaximos: recursos.espaciosPactoMaximos,
      nivelEspacioPacto: recursos.nivelEspacioPacto
    }));
  };

  const manejarActualizarClaseLanzadora = (
    index: number,
    campo: keyof ClaseLanzadora,
    valor: string | number
  ) => {
    const nuevas = [...(form.clasesLanzadoras || [])];
    nuevas[index] = { ...nuevas[index], [campo]: valor };
    const recursos = calcularTodosRecursosMagicos(
      nuevas,
      form.overrideEspaciosConjuro,
      form.overridePuntosConjuro
    );

    setForm((prev) => ({
      ...prev,
      clasesLanzadoras: nuevas,
      espaciosConjuroMaximos: recursos.espaciosConjuroMaximos,
      puntosConjuroMaximos: recursos.puntosConjuroMaximos,
      nivelConjuroMaximo: recursos.nivelConjuroMaximo,
      espaciosPactoMaximos: recursos.espaciosPactoMaximos,
      nivelEspacioPacto: recursos.nivelEspacioPacto
    }));
  };

  const manejarEliminarClaseLanzadora = (index: number) => {
    const nuevas = (form.clasesLanzadoras || []).filter((_, i) => i !== index);
    const recursos = calcularTodosRecursosMagicos(
      nuevas,
      form.overrideEspaciosConjuro,
      form.overridePuntosConjuro
    );

    setForm((prev) => ({
      ...prev,
      clasesLanzadoras: nuevas,
      espaciosConjuroMaximos: recursos.espaciosConjuroMaximos,
      puntosConjuroMaximos: recursos.puntosConjuroMaximos,
      nivelConjuroMaximo: recursos.nivelConjuroMaximo,
      espaciosPactoMaximos: recursos.espaciosPactoMaximos,
      nivelEspacioPacto: recursos.nivelEspacioPacto
    }));
  };

  const manejarActualizarOverrideEspacios = (nivel: number, cantidad: number) => {
    const overridesActuales = { ...(form.overrideEspaciosConjuro || {}) };
    overridesActuales[String(nivel)] = cantidad;
    const recursos = calcularTodosRecursosMagicos(
      form.clasesLanzadoras || [],
      overridesActuales,
      form.overridePuntosConjuro
    );

    setForm((prev) => ({
      ...prev,
      overrideEspaciosConjuro: overridesActuales,
      espaciosConjuroMaximos: recursos.espaciosConjuroMaximos
    }));
  };

  const manejarActualizarHPMaximoBase = (maxBaseVal: number) => {
    setForm((prev) => ({
      ...prev,
      hpMaximoBase: maxBaseVal,
      hpMaximo: maxBaseVal,
      hpActual: Math.min(prev.hpActual, maxBaseVal)
    }));
  };

  const manejarGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    const formFinal: PersonajeJugador = {
      ...form,
      rasgos: sincronizarRasgosAutomaticos(form)
    };
    alGuardar(formFinal);
    alVolverAFicha();
  };

  return {
    form,
    setForm,
    pestanaActiva,
    setPestanaActiva,
    habilidadEnDetalle,
    setHabilidadEnDetalle,
    caracteristicaEnDetalle,
    setCaracteristicaEnDetalle,
    modalCompetencias,
    setModalCompetencias,
    actualizarCampo,
    manejarDetectarJugadorTaleSpire,
    manejarCambioClaseNombre,
    manejarCambioClaseSubclase,
    manejarAplicarBuildSugerida,
    manejarCambioClaseNivel,
    manejarAgregarClase,
    manejarEliminarClase,
    manejarCambioNivelTotal,
    manejarCambioExperiencia,
    manejarGuardarCaracteristica,
    manejarGuardarCompetencias,
    manejarAlternarEsLanzador,
    manejarAgregarClaseLanzadora,
    manejarActualizarClaseLanzadora,
    manejarEliminarClaseLanzadora,
    manejarActualizarOverrideEspacios,
    manejarActualizarHPMaximoBase,
    manejarGuardar
  };
}
