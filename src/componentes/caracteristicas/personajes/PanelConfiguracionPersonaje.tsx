import React, { useState, useEffect } from "react";
import type {
  PersonajeJugador,
  Caracteristica,
  Habilidad,
  ClasePersonaje,
  PersonalizacionCaracteristica
} from "@/tipos";
import {
  HABILIDADES_LISTA,
  CARACTERISTICAS_CLAVES,
  CLASES_DND,
  ALINEAMIENTOS_DND,
  DESCRIPCIONES_CARACTERISTICAS,
  obtenerDadoGolpePorClase,
  obtenerRangoExperienciaPorNivel,
  obtenerNivelPorExperiencia,
  obtenerBonoCompetenciaPorNivel
} from "@/constantes";
import { calcularModificadorCaracteristica } from "@/servicios/procesadorDescansos";
import {
  detectarTipoLanzador,
  calcularTodosRecursosMagicos,
  obtenerConjurosSubclasePersonaje
} from "@/servicios/calculadorMagia";
import { coincideHechizoId } from "@/almacen/slices/slicePersonajes";
import ts from "@/utiles/TaleSpireAdapter";
import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import { SelectorSugerencias } from "@/componentes/comunes/SelectorSugerencias";
import { ModalDetalleHabilidad } from "./ModalDetalleHabilidad";
import { ModalDetalleCaracteristica } from "./ModalDetalleCaracteristica";
import {
  ModalSelectorCompetencias,
  CategoriaCompetencia
} from "./ModalSelectorCompetencias";
import {
  Save,
  Shield,
  User,
  Award,
  Eye,
  Sparkles,
  Swords,
  Languages,
  Wrench,
  Sliders,
  Settings,
  Plus,
  Trash2,
  X
} from "lucide-react";

import estilos from "./HojaPersonaje.module.css";

interface PanelConfiguracionPersonajeProps {
  personaje: PersonajeJugador;
  alGuardar: (cambios: Partial<PersonajeJugador>) => void;
  alVolverAFicha: () => void;
}

type PestanaConfiguracion = "identidad" | "atributos" | "competencias" | "sentidos" | "magia";

export const PanelConfiguracionPersonaje: React.FC<PanelConfiguracionPersonajeProps> = ({
  personaje,
  alGuardar,
  alVolverAFicha
}) => {
  const [pestanaActiva, setPestanaActiva] = useState<PestanaConfiguracion>("identidad");

  // Helper de sincronización automática de magia para multiclase
  const sincronizarMagiaMulticlase = (
    clases: ClasePersonaje[],
    overrideEspacios?: Record<string, number> | null,
    overridePuntos?: number | null,
    prepPrevios: string[] = [],
    conocPrevios: string[] = [],
    trucosPrevios: string[] = [],
    siemprePrepPrevios: string[] = []
  ): Partial<PersonajeJugador> => {
    const clasesLanzadoras = clases
      .map((c) => {
        const info = detectarTipoLanzador(c.nombre, c.subclase);
        if (!info) return null;
        return {
          clase: c.nombre || "Lanzador",
          nivel: c.nivel,
          tipoLanzador: info.tipo,
          habilidadConjuro: info.habilidad,
          modeloConjuros: info.modelo
        };
      })
      .filter(Boolean) as import("@/tipos").ClaseLanzadora[];

    const resSubclase = obtenerConjurosSubclasePersonaje(clases);
    const siemprePrep = Array.from(new Set(resSubclase.conjuros || []));
    const viejosSiemprePrep = siemprePrepPrevios || [];

    const eliminadosSubclase = viejosSiemprePrep.filter(
      (viejo) => !siemprePrep.some((nuevo) => coincideHechizoId(viejo, nuevo))
    );

    const prepFinales = prepPrevios.filter(
      (p) => !eliminadosSubclase.some((elim) => coincideHechizoId(p, elim))
    );
    siemprePrep.forEach((nuevo) => {
      if (!prepFinales.some((p) => coincideHechizoId(p, nuevo))) {
        prepFinales.push(nuevo);
      }
    });

    const conocFinales = conocPrevios.filter(
      (c) => !eliminadosSubclase.some((elim) => coincideHechizoId(c, elim))
    );
    siemprePrep.forEach((nuevo) => {
      if (!conocFinales.some((c) => coincideHechizoId(c, nuevo))) {
        conocFinales.push(nuevo);
      }
    });

    const trucosFinales = [...trucosPrevios];
    (resSubclase.trucos || []).forEach((t) => {
      if (!trucosFinales.some((tr) => coincideHechizoId(tr, t))) {
        trucosFinales.push(t);
      }
    });

    if (clasesLanzadoras.length > 0) {
      const recursos = calcularTodosRecursosMagicos(clasesLanzadoras, overrideEspacios, overridePuntos);
      return {
        esLanzador: true,
        clasesLanzadoras,
        espaciosConjuroMaximos: recursos.espaciosConjuroMaximos,
        puntosConjuroMaximos: recursos.puntosConjuroMaximos,
        nivelConjuroMaximo: recursos.nivelConjuroMaximo,
        espaciosPactoMaximos: recursos.espaciosPactoMaximos,
        nivelEspacioPacto: recursos.nivelEspacioPacto,
        conjurosSiemprePreparadosIds: siemprePrep,
        conjurosPreparadosIds: prepFinales,
        conjurosConocidosIds: conocFinales,
        trucosConocidosIds: trucosFinales
      };
    }

    return {
      esLanzador: false,
      clasesLanzadoras: [],
      espaciosConjuroMaximos: {},
      puntosConjuroMaximos: 0,
      nivelConjuroMaximo: 0,
      espaciosPactoMaximos: 0,
      nivelEspacioPacto: 0,
      conjurosSiemprePreparadosIds: siemprePrep,
      conjurosPreparadosIds: prepFinales,
      conjurosConocidosIds: conocFinales,
      trucosConocidosIds: trucosFinales
    };
  };

  const generarNombreClaseResumen = (clases: ClasePersonaje[]): string => {
    if (clases.length === 0) return "Guerrero";
    if (clases.length === 1) return clases[0].nombre;
    return clases.map((c) => `${c.nombre} ${c.nivel}`).join(" / ");
  };

  const generarSubclaseResumen = (clases: ClasePersonaje[]): string => {
    return clases.map((c) => c.subclase).filter(Boolean).join(" / ");
  };

  // Estado del formulario
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

    // Auto-detección inicial de magia desde las clases
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

  // Auto-detección inicial silenciosa del nombre del jugador si el campo está en blanco
  useEffect(() => {
    if (!form.jugador || form.jugador.trim() === "") {
      ts.players
        .obtenerNombreJugadorLocal()
        .then((nombreDetectado: string | null) => {
          if (nombreDetectado && nombreDetectado.trim() !== "") {
            setForm((prev) => ({ ...prev, jugador: nombreDetectado.trim() }));
          }
        })
        .catch((err: unknown) => {
          console.error("[PanelConfiguracion] Error en auto-detección inicial de jugador:", err);
        });
    }
  }, []);

  const actualizarCampo = <K extends keyof PersonajeJugador>(campo: K, valor: PersonajeJugador[K]) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  // Acción manual para refrescar el nombre del jugador desde TaleSpire
  const manejarDetectarJugadorTaleSpire = async () => {
    try {
      const nombreTS = await ts.players.obtenerNombreJugadorLocal();
      if (nombreTS && nombreTS.trim() !== "") {
        setForm((prev) => ({ ...prev, jugador: nombreTS.trim() }));
      }
    } catch (e: unknown) {
      console.error("[PanelConfiguracion] Error al detectar jugador:", e);
    }
  };

  // =============================================================
  // GESTIÓN DE MULTICLASE Y SINCRONIZACIÓN BIDIRECCIONAL NIVEL / XP
  // =============================================================

  const manejarCambioClaseNombre = (index: number, nuevoNombre: string) => {
    setForm((prev) => {
      const clases = [...(prev.clases || [])];
      if (!clases[index]) return prev;
      clases[index] = { ...clases[index], nombre: nuevoNombre };

      const dadoSugerido = index === 0 ? obtenerDadoGolpePorClase(nuevoNombre.trim()) : prev.tipoDadoGolpe;
      const sincMagia = sincronizarMagiaMulticlase(
        clases,
        prev.overrideEspaciosConjuro,
        prev.overridePuntosConjuro,
        prev.conjurosPreparadosIds,
        prev.conjurosConocidosIds,
        prev.trucosConocidosIds,
        prev.conjurosSiemprePreparadosIds
      );

      return {
        ...prev,
        clases,
        clase: generarNombreClaseResumen(clases),
        tipoDadoGolpe: dadoSugerido,
        ...sincMagia
      };
    });
  };

  const manejarCambioClaseSubclase = (index: number, nuevaSubclase: string) => {
    setForm((prev) => {
      const clases = [...(prev.clases || [])];
      if (!clases[index]) return prev;
      clases[index] = { ...clases[index], subclase: nuevaSubclase };

      const sincMagia = sincronizarMagiaMulticlase(
        clases,
        prev.overrideEspaciosConjuro,
        prev.overridePuntosConjuro,
        prev.conjurosPreparadosIds,
        prev.conjurosConocidosIds,
        prev.trucosConocidosIds,
        prev.conjurosSiemprePreparadosIds
      );

      return {
        ...prev,
        clases,
        subclase: generarSubclaseResumen(clases),
        ...sincMagia
      };
    });
  };

  const manejarCambioClaseNivel = (index: number, nuevoNivelStr: string) => {
    setForm((prev) => {
      const clases = [...(prev.clases || [])];
      if (!clases[index]) return prev;

      const sumaOtros = clases.reduce((acc, c, i) => (i === index ? acc : acc + (c.nivel || 1)), 0);
      const maxNivelParaEstaClase = Math.max(1, 20 - sumaOtros);
      const nivParsed = parseInt(nuevoNivelStr, 10);
      const nivSeguro = isNaN(nivParsed) ? 1 : Math.max(1, Math.min(maxNivelParaEstaClase, nivParsed));

      clases[index] = { ...clases[index], nivel: nivSeguro };

      const nivelTotal = Math.min(20, Math.max(1, sumaOtros + nivSeguro));
      const rangoXP = obtenerRangoExperienciaPorNivel(nivelTotal);
      let experienciaAjustada = prev.experiencia;

      if (experienciaAjustada < rangoXP.min || experienciaAjustada > rangoXP.max) {
        experienciaAjustada = rangoXP.min;
      }

      const sincMagia = sincronizarMagiaMulticlase(
        clases,
        prev.overrideEspaciosConjuro,
        prev.overridePuntosConjuro,
        prev.conjurosPreparadosIds,
        prev.conjurosConocidosIds,
        prev.trucosConocidosIds,
        prev.conjurosSiemprePreparadosIds
      );

      return {
        ...prev,
        clases,
        nivel: nivelTotal,
        experiencia: experienciaAjustada,
        clase: generarNombreClaseResumen(clases),
        dadosGolpeTotal: nivelTotal,
        dadosGolpeRestantes: Math.min(prev.dadosGolpeRestantes, nivelTotal),
        ...sincMagia
      };
    });
  };

  const manejarAgregarClase = () => {
    setForm((prev) => {
      const clases = [...(prev.clases || [])];
      const nivelTotalActual = clases.reduce((acc, c) => acc + (c.nivel || 1), 0);
      if (nivelTotalActual >= 20) return prev; // Límite máximo de nivel 20 alcanzado

      const nuevaClase: ClasePersonaje = {
        nombre: "Guerrero",
        subclase: "",
        nivel: 1
      };
      const nuevasClases = [...clases, nuevaClase];
      const nuevoNivelTotal = Math.min(20, nivelTotalActual + 1);
      const rangoXP = obtenerRangoExperienciaPorNivel(nuevoNivelTotal);
      let experienciaAjustada = prev.experiencia;
      if (experienciaAjustada < rangoXP.min || experienciaAjustada > rangoXP.max) {
        experienciaAjustada = rangoXP.min;
      }

      const sincMagia = sincronizarMagiaMulticlase(
        nuevasClases,
        prev.overrideEspaciosConjuro,
        prev.overridePuntosConjuro,
        prev.conjurosPreparadosIds,
        prev.conjurosConocidosIds,
        prev.trucosConocidosIds,
        prev.conjurosSiemprePreparadosIds
      );

      return {
        ...prev,
        clases: nuevasClases,
        nivel: nuevoNivelTotal,
        experiencia: experienciaAjustada,
        clase: generarNombreClaseResumen(nuevasClases),
        subclase: generarSubclaseResumen(nuevasClases),
        dadosGolpeTotal: nuevoNivelTotal,
        dadosGolpeRestantes: Math.min(prev.dadosGolpeRestantes, nuevoNivelTotal),
        ...sincMagia
      };
    });
  };

  const manejarEliminarClase = (index: number) => {
    setForm((prev) => {
      const clases = [...(prev.clases || [])];
      if (clases.length <= 1) return prev; // Mantener al menos una clase
      const nuevasClases = clases.filter((_, i) => i !== index);
      const nuevoNivelTotal = Math.max(1, nuevasClases.reduce((acc, c) => acc + (c.nivel || 1), 0));
      const rangoXP = obtenerRangoExperienciaPorNivel(nuevoNivelTotal);
      let experienciaAjustada = prev.experiencia;
      if (experienciaAjustada < rangoXP.min || experienciaAjustada > rangoXP.max) {
        experienciaAjustada = rangoXP.min;
      }

      const sincMagia = sincronizarMagiaMulticlase(
        nuevasClases,
        prev.overrideEspaciosConjuro,
        prev.overridePuntosConjuro,
        prev.conjurosPreparadosIds,
        prev.conjurosConocidosIds,
        prev.trucosConocidosIds,
        prev.conjurosSiemprePreparadosIds
      );

      return {
        ...prev,
        clases: nuevasClases,
        nivel: nuevoNivelTotal,
        experiencia: experienciaAjustada,
        clase: generarNombreClaseResumen(nuevasClases),
        subclase: generarSubclaseResumen(nuevasClases),
        dadosGolpeTotal: nuevoNivelTotal,
        dadosGolpeRestantes: Math.min(prev.dadosGolpeRestantes, nuevoNivelTotal),
        ...sincMagia
      };
    });
  };

  // Sincronización inteligente Nivel Total -> XP, Clases y Magia
  const manejarCambioNivelTotal = (nuevoNivelStr: string) => {
    const niv = Math.max(1, Math.min(20, parseInt(nuevoNivelStr, 10) || 1));
    const rangoXP = obtenerRangoExperienciaPorNivel(niv);

    setForm((prev) => {
      const clases = [...(prev.clases || [])];
      let nuevasClases: ClasePersonaje[] = [];

      if (clases.length <= 1) {
        nuevasClases = [{ ...(clases[0] || { nombre: "Guerrero", subclase: "" }), nivel: niv }];
      } else {
        const sumaOtros = clases.slice(1).reduce((acc, c) => acc + (c.nivel || 1), 0);
        if (niv > sumaOtros) {
          nuevasClases = [{ ...clases[0], nivel: niv - sumaOtros }, ...clases.slice(1)];
        } else {
          // Si el nuevo nivel total es menor o igual a los secundarios, dejamos 1 en clase primaria
          nuevasClases = [{ ...clases[0], nivel: 1 }];
          let restante = niv - 1;
          for (let i = 1; i < clases.length; i++) {
            if (restante <= 0) break;
            const asignado = Math.min(clases[i].nivel, restante);
            nuevasClases.push({ ...clases[i], nivel: Math.max(1, asignado) });
            restante -= asignado;
          }
        }
      }

      let experienciaAjustada = prev.experiencia;
      if (experienciaAjustada < rangoXP.min || experienciaAjustada > rangoXP.max) {
        experienciaAjustada = rangoXP.min;
      }

      const sincMagia = sincronizarMagiaMulticlase(
        nuevasClases,
        prev.overrideEspaciosConjuro,
        prev.overridePuntosConjuro,
        prev.conjurosPreparadosIds,
        prev.conjurosConocidosIds,
        prev.trucosConocidosIds,
        prev.conjurosSiemprePreparadosIds
      );

      return {
        ...prev,
        nivel: niv,
        clases: nuevasClases,
        clase: generarNombreClaseResumen(nuevasClases),
        experiencia: experienciaAjustada,
        dadosGolpeTotal: niv,
        dadosGolpeRestantes: Math.min(prev.dadosGolpeRestantes, niv),
        ...sincMagia
      };
    });
  };

  // Sincronización inteligente XP -> Nivel, Clases y Magia
  const manejarCambioExperiencia = (nuevaXpStr: string) => {
    const xpVal = Math.max(0, parseInt(nuevaXpStr, 10) || 0);
    const nivelSugerido = obtenerNivelPorExperiencia(xpVal);

    setForm((prev) => {
      let nuevasClases = [...(prev.clases || [])];

      if (nivelSugerido !== prev.nivel) {
        if (nuevasClases.length <= 1) {
          nuevasClases = [{ ...(nuevasClases[0] || { nombre: "Guerrero", subclase: "" }), nivel: nivelSugerido }];
        } else {
          const sumaOtros = nuevasClases.slice(1).reduce((acc, c) => acc + (c.nivel || 1), 0);
          if (nivelSugerido > sumaOtros) {
            nuevasClases = [{ ...nuevasClases[0], nivel: nivelSugerido - sumaOtros }, ...nuevasClases.slice(1)];
          } else {
            nuevasClases = [{ ...nuevasClases[0], nivel: 1 }, ...nuevasClases.slice(1).map((c) => ({ ...c, nivel: 1 }))];
          }
        }
      }

      const sincMagia = sincronizarMagiaMulticlase(
        nuevasClases,
        prev.overrideEspaciosConjuro,
        prev.overridePuntosConjuro,
        prev.conjurosPreparadosIds,
        prev.conjurosConocidosIds,
        prev.trucosConocidosIds,
        prev.conjurosSiemprePreparadosIds
      );

      return {
        ...prev,
        experiencia: xpVal,
        nivel: nivelSugerido,
        clases: nuevasClases,
        clase: generarNombreClaseResumen(nuevasClases),
        dadosGolpeTotal: nivelSugerido,
        dadosGolpeRestantes: Math.min(prev.dadosGolpeRestantes, nivelSugerido),
        ...sincMagia
      };
    });
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
      caracteristicas: {
        ...prev.caracteristicas,
        [carac]: cambios.valorBase
      },
      overridesFijos: {
        ...prev.overridesFijos,
        [carac]: cambios.overrideFijo
      },
      competenciasSalvacion: {
        ...prev.competenciasSalvacion,
        [carac]: cambios.competenteSalvacion
      },
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
    setForm((prev) => ({
      ...prev,
      ...nuevasCompetencias
    }));
  };

  // -------------------------------------------------------------
  // GUARDAR FORMULARIO
  // -------------------------------------------------------------
  const manejarGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    alGuardar(form);
    alVolverAFicha();
  };


  return (
    <div className={estilos.contenedorPrincipal} style={{ gap: 14 }}>
      {/* Selector de Sub-pestañas Internas */}
      <div className={estilos.barraPestañasModal} style={{ margin: 0 }}>

        <button
          type="button"
          className={`${estilos.botonPestañaModal} ${
            pestanaActiva === "identidad" ? estilos.botonPestañaModalActiva : ""
          }`}
          onClick={() => setPestanaActiva("identidad")}
        >
          <User size={12} />
          Identidad
        </button>

        <button
          type="button"
          className={`${estilos.botonPestañaModal} ${
            pestanaActiva === "atributos" ? estilos.botonPestañaModalActiva : ""
          }`}
          onClick={() => setPestanaActiva("atributos")}
        >
          <Award size={12} />
          Atributos
        </button>

        <button
          type="button"
          className={`${estilos.botonPestañaModal} ${
            pestanaActiva === "competencias" ? estilos.botonPestañaModalActiva : ""
          }`}
          onClick={() => setPestanaActiva("competencias")}
        >
          <Shield size={12} />
          Competencias
        </button>

        <button
          type="button"
          className={`${estilos.botonPestañaModal} ${
            pestanaActiva === "sentidos" ? estilos.botonPestañaModalActiva : ""
          }`}
          onClick={() => setPestanaActiva("sentidos")}
        >
          <Eye size={12} />
          Sentidos
        </button>

        <button
          type="button"
          className={`${estilos.botonPestañaModal} ${
            pestanaActiva === "magia" ? estilos.botonPestañaModalActiva : ""
          }`}
          onClick={() => setPestanaActiva("magia")}
        >
          <Sparkles size={12} />
          Magia
        </button>
      </div>

      {/* Formulario Principal de Configuración */}
      <form
        onSubmit={manejarGuardar}
        className={`${estilos.neoRaised}`}
        style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16 }}
      >
        {/* PESTAÑA 1: IDENTIDAD */}
        {pestanaActiva === "identidad" && (
          <>
            <div className={estilos.filaFormulario}>
              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Nombre del Personaje</label>
                <input
                  type="text"
                  className={estilos.inputFormulario}
                  value={form.nombre}
                  onChange={(e) => actualizarCampo("nombre", e.target.value)}
                  required
                />
              </div>

              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Nombre del Jugador</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    type="text"
                    className={estilos.inputFormulario}
                    value={form.jugador}
                    onChange={(e) => actualizarCampo("jugador", e.target.value)}
                    placeholder="Ej. Nombre del Jugador"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className={estilos.neoButton}
                    onClick={manejarDetectarJugadorTaleSpire}
                    title="Auto-detectar tu nombre desde TaleSpire"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      padding: "0 10px",
                      color: "#38bdf8",
                      borderColor: "rgba(56, 189, 248, 0.4)"
                    }}
                  >
                    <Sparkles size={13} />
                    Detectar
                  </button>
                </div>
              </div>
            </div>

            {/* SECCIÓN MULTICLASE */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                padding: "12px 14px",
                borderRadius: 6,
                backgroundColor: "#0c111a",
                border: "1px solid rgba(148, 163, 184, 0.15)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Award size={14} color="#60a5fa" />
                  <strong style={{ fontSize: 12, color: "#f1f5f9" }}>
                    Clases y Progresión Multiclase
                  </strong>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      fontSize: 11,
                      backgroundColor: form.nivel >= 20 ? "#3b151e" : "#18202e",
                      color: form.nivel >= 20 ? "#fca5a5" : "#60a5fa",
                      border: form.nivel >= 20 ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid rgba(96, 165, 250, 0.3)",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontWeight: 800
                    }}
                  >
                    Nivel Global: {form.nivel} / 20
                  </span>
                </div>
              </div>

              {/* Lista de Clases Multiclase */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(form.clases || [{ nombre: form.clase || "Guerrero", subclase: form.subclase || "", nivel: form.nivel || 1 }]).map(
                  (claseItem, index) => {
                    const sumaOtros = (form.clases || []).reduce(
                      (acc, c, i) => (i === index ? acc : acc + (c.nivel || 1)),
                      0
                    );
                    const maxNivelClase = Math.max(1, 20 - sumaOtros);

                    return (
                      <div
                        key={index}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(140px, 1.2fr) minmax(130px, 1fr) 90px auto",
                          gap: 8,
                          alignItems: "center",
                          backgroundColor: "#111622",
                          padding: "8px 10px",
                          borderRadius: 6,
                          border: "1px solid rgba(148, 163, 184, 0.12)"
                        }}
                      >
                        <div>
                          <label style={{ fontSize: 10, color: "#94a3b8", display: "block", marginBottom: 3 }}>
                            Clase #{index + 1}
                          </label>
                          <SelectorSugerencias
                            valor={claseItem.nombre}
                            alCambiar={(nuevoNombre) => manejarCambioClaseNombre(index, nuevoNombre)}
                            opciones={CLASES_DND}
                            placeholder="Clase..."
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 10, color: "#94a3b8", display: "block", marginBottom: 3 }}>
                            Subclase
                          </label>
                          <input
                            type="text"
                            className={estilos.inputFormulario}
                            value={claseItem.subclase || ""}
                            onChange={(e) => manejarCambioClaseSubclase(index, e.target.value)}
                            placeholder="Ej. Campeón..."
                            style={{ height: 34, fontSize: 11 }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 10, color: "#94a3b8", display: "block", marginBottom: 3 }}>
                            Nivel (Max {maxNivelClase})
                          </label>
                          <input
                            type="number"
                            className={estilos.inputFormulario}
                            value={claseItem.nivel}
                            onChange={(e) => manejarCambioClaseNivel(index, e.target.value)}
                            min="1"
                            max={maxNivelClase}
                            required
                            style={{ height: 34, textAlign: "center", fontWeight: 700, fontSize: 12 }}
                          />
                        </div>

                        <div style={{ paddingTop: 16 }}>
                          {(form.clases || []).length > 1 ? (
                            <button
                              type="button"
                              onClick={() => manejarEliminarClase(index)}
                              title="Eliminar clase"
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 4,
                                backgroundColor: "#201317",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                color: "#fca5a5",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <div style={{ width: 34 }} />
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {/* Botón para Añadir Multiclase */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                  {(form.nivel || 1) >= 20
                    ? "Alcanzaste el nivel máximo total de 20."
                    : `Puedes asignar hasta ${20 - (form.nivel || 1)} niveles más en otras clases.`}
                </span>

                <button
                  type="button"
                  className={estilos.neoButton}
                  onClick={manejarAgregarClase}
                  disabled={(form.nivel || 1) >= 20}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    padding: "6px 12px",
                    color: (form.nivel || 1) >= 20 ? "#64748b" : "#60a5fa",
                    borderColor: (form.nivel || 1) >= 20 ? "rgba(100, 116, 139, 0.2)" : "rgba(96, 165, 250, 0.4)",
                    cursor: (form.nivel || 1) >= 20 ? "not-allowed" : "pointer"
                  }}
                >
                  <Plus size={13} />
                  Añadir Multiclase
                </button>
              </div>
            </div>

            {/* FILA DE NIVEL GLOBAL Y EXPERIENCIA BIDIRECCIONAL */}
            <div className={estilos.filaFormulario}>
              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Nivel Global Total (1 - 20)</label>
                <input
                  type="number"
                  className={estilos.inputFormulario}
                  value={form.nivel}
                  onChange={(e) => manejarCambioNivelTotal(e.target.value)}
                  min="1"
                  max="20"
                  required
                  style={{ fontWeight: 800, color: "#60a5fa" }}
                />
              </div>

              <div className={estilos.campoFormulario}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label className={estilos.labelFormulario} style={{ margin: 0 }}>
                    Puntos de Experiencia (PX)
                  </label>
                  <span
                    style={{
                      fontSize: 10,
                      backgroundColor: "#161f2e",
                      color: "#93c5fd",
                      padding: "1px 6px",
                      borderRadius: 4,
                      fontWeight: 700,
                      border: "1px solid rgba(96, 165, 250, 0.2)"
                    }}
                  >
                    Rango Nv. {form.nivel}: {obtenerRangoExperienciaPorNivel(form.nivel || 1).texto}
                  </span>
                </div>
                <input
                  type="number"
                  className={estilos.inputFormulario}
                  value={form.experiencia}
                  onChange={(e) => manejarCambioExperiencia(e.target.value)}
                  min="0"
                  style={{ fontWeight: 700 }}
                />
              </div>
            </div>

            {/* ESPECIE, SUBESPECIE, TRASFONDO Y ALINEACIÓN */}
            <div className={estilos.filaFormulario}>
              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Especie / Raza</label>
                <input
                  type="text"
                  className={estilos.inputFormulario}
                  value={form.especie}
                  onChange={(e) => actualizarCampo("especie", e.target.value)}
                  placeholder="Ej. Humano, Elfo, Enano..."
                />
              </div>

              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Subespecie / Legado / Linaje</label>
                <input
                  type="text"
                  className={estilos.inputFormulario}
                  value={form.subespecie || ""}
                  onChange={(e) => actualizarCampo("subespecie", e.target.value)}
                  placeholder="Ej. Alto elfo, Enano de las colinas, Dracónido rojo..."
                />
              </div>
            </div>

            <div className={estilos.filaFormulario}>
              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Trasfondo</label>
                <input
                  type="text"
                  className={estilos.inputFormulario}
                  value={form.trasfondo}
                  onChange={(e) => actualizarCampo("trasfondo", e.target.value)}
                  placeholder="Ej. Soldado, Erudito..."
                />
              </div>

              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Alineamiento</label>
                <SelectorDesplegable
                  valor={form.alineacion}
                  alCambiar={(val) => actualizarCampo("alineacion", val)}
                  opciones={ALINEAMIENTOS_DND}
                  tamano="normal"
                />
              </div>
            </div>

            <div className={estilos.filaFormulario}>
              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Miniatura 3D en Tablero</label>
                <div
                  style={{
                    height: 38,
                    fontSize: 11,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "0 10px",
                    borderRadius: 4,
                    backgroundColor: form.idMiniaturaTS
                      ? "rgba(16, 185, 129, 0.1)"
                      : "rgba(255, 255, 255, 0.03)",
                    border: form.idMiniaturaTS
                      ? "1px solid #10b981"
                      : "1px solid var(--color-borde-brutal)",
                    color: form.idMiniaturaTS ? "#10b981" : "var(--color-texto-apagado)"
                  }}
                  title="Auto-detectada automáticamente si la miniatura en el tablero tiene el mismo nombre que tu personaje"
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: form.idMiniaturaTS ? "#10b981" : "#64748b"
                    }}
                  />
                  {form.idMiniaturaTS ? "Auto-detectada en Tablero" : "Sin Miniatura en Tablero"}
                </div>
              </div>

              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>URL de Imagen de Avatar (Token)</label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {form.avatarUrl ? (
                    <img
                      src={form.avatarUrl}
                      alt="Vista previa"
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        objectFit: "cover",
                        flexShrink: 0,
                        border: "1px solid #818cf8"
                      }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : null}
                  <input
                    type="url"
                    className={estilos.inputFormulario}
                    value={form.avatarUrl || ""}
                    onChange={(e) => actualizarCampo("avatarUrl", e.target.value)}
                    placeholder="https://ejemplo.com/retrato.png"
                    style={{ flexGrow: 1 }}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* PESTAÑA 2: ATRIBUTOS Y OVERRIDES */}
        {pestanaActiva === "atributos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Banner Informativo Superior */}
            <div
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
                border: "1px solid rgba(148, 163, 184, 0.14)",
                backgroundColor: "#0e131d"
              }}
            >
              <span style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>
                Puntuaciones base, <strong>Overrides Fijos</strong> y <strong>Personalización</strong> de atributos.
              </span>
              <span
                style={{
                  fontSize: 11,
                  backgroundColor: "#161f2e",
                  color: "#cbd5e1",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontWeight: 700,
                  whiteSpace: "nowrap"
                }}
              >
                PB: +{obtenerBonoCompetenciaPorNivel(form.nivel || 1)}
              </span>
            </div>

            {/* Grid 2 Columnas de Tarjetas de Atributos */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 10
              }}
            >
              {CARACTERISTICAS_CLAVES.map(({ clave }) => {
                const carac = clave as Caracteristica;
                const custom = form.personalizacionesCaracteristicas?.[carac];
                const valorBase = form.caracteristicas?.[carac] ?? 10;
                const override = custom?.valorFijo ?? form.overridesFijos?.[carac] ?? null;
                const esCompetente = !!form.competenciasSalvacion?.[carac];
                const pb = obtenerBonoCompetenciaPorNivel(form.nivel || 1);

                const valorEfectivo = override !== null && override !== undefined ? override : valorBase;
                const modBase = calcularModificadorCaracteristica(valorEfectivo);
                const modExtra = custom?.modificadorExtra || 0;
                const modTotal = modBase + modExtra;
                const bonoSalvExtra = custom?.bonoSalvacionExtra || 0;
                const bonoSalvTotal = (esCompetente ? modTotal + pb : modTotal) + bonoSalvExtra;
                const descripcionSalvacion = custom?.descripcionPersonalizada || DESCRIPCIONES_CARACTERISTICAS[carac] || "";

                const nombreCompleto =
                  carac === "fuerza"
                    ? "Fuerza"
                    : carac === "destreza"
                    ? "Destreza"
                    : carac === "constitucion"
                    ? "Constitución"
                    : carac === "inteligencia"
                    ? "Inteligencia"
                    : carac === "sabiduria"
                    ? "Sabiduría"
                    : "Carisma";

                const abreviatura =
                  carac === "fuerza"
                    ? "FUE"
                    : carac === "destreza"
                    ? "DES"
                    : carac === "constitucion"
                    ? "CON"
                    : carac === "inteligencia"
                    ? "INT"
                    : carac === "sabiduria"
                    ? "SAB"
                    : "CAR";

                const tituloMostrar = custom?.nombrePersonalizado || nombreCompleto;

                return (
                  <div
                    key={carac}
                    className={estilos.neoRaised}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 8,
                      backgroundColor: "#111622",
                      border: override !== null ? "1px solid rgba(168, 85, 247, 0.3)" : "1px solid rgba(148, 163, 184, 0.12)"
                    }}
                  >
                    <div>
                      {/* Cabecera de la Tarjeta: Badge + Nombre + Modificador */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 4,
                              backgroundColor: "#18202e",
                              border: "1px solid rgba(148, 163, 184, 0.2)",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#cbd5e1",
                              fontWeight: 800,
                              fontSize: 11
                            }}
                          >
                            {abreviatura}
                          </span>
                          <div>
                            <strong style={{ fontSize: 13, color: "#f1f5f9", display: "block" }}>
                              {tituloMostrar}
                            </strong>
                            <span style={{ fontSize: 10, color: "#94a3b8" }}>
                              Base: <strong style={{ color: "#cbd5e1" }}>{valorBase}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Modificador con Puntuación Final */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            backgroundColor: "#0d121c",
                            padding: "3px 8px",
                            borderRadius: 4,
                            border: "1px solid rgba(148, 163, 184, 0.14)"
                          }}
                        >
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 800,
                              color: modTotal >= 0 ? "#60a5fa" : "#fca5a5"
                            }}
                          >
                            {modTotal >= 0 ? `+${modTotal}` : modTotal}
                          </span>
                          <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
                            ({valorEfectivo})
                          </span>
                        </div>
                      </div>

                      {/* Badges de Salvación, Mod Extra y Override */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                        {override !== null && (
                          <span
                            style={{
                              fontSize: 10,
                              backgroundColor: "#201335",
                              color: "#d8b4fe",
                              border: "1px solid rgba(168, 85, 247, 0.3)",
                              padding: "2px 6px",
                              borderRadius: 4,
                              fontWeight: 700
                            }}
                          >
                            Fijo: {override}
                          </span>
                        )}

                        {modExtra !== 0 && (
                          <span
                            style={{
                              fontSize: 10,
                              backgroundColor: "#1e1b4b",
                              color: "#a5b4fc",
                              border: "1px solid rgba(129, 140, 248, 0.3)",
                              padding: "2px 6px",
                              borderRadius: 4,
                              fontWeight: 700
                            }}
                          >
                            Mod: {modExtra >= 0 ? `+${modExtra}` : modExtra}
                          </span>
                        )}

                        <span
                          style={{
                            fontSize: 10,
                            backgroundColor: esCompetente ? "#132135" : "#0d121c",
                            color: esCompetente ? "#93c5fd" : "#94a3b8",
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontWeight: 600,
                            border: esCompetente ? "1px solid rgba(96, 165, 250, 0.3)" : "1px solid rgba(148, 163, 184, 0.1)"
                          }}
                        >
                          Salv: {bonoSalvTotal >= 0 ? `+${bonoSalvTotal}` : bonoSalvTotal} {esCompetente ? "(+PB)" : ""}
                        </span>
                      </div>

                      {/* Caja de Uso de Salvación */}
                      <div
                        style={{
                          backgroundColor: "#0a0e16",
                          borderLeft: "3px solid #334155",
                          padding: "6px 8px",
                          borderRadius: 4,
                          marginBottom: 4
                        }}
                      >
                        <span style={{ fontSize: 11, color: "#cbd5e1", lineHeight: 1.35, display: "block" }}>
                          {descripcionSalvacion}
                        </span>
                      </div>
                    </div>

                    {/* Botón de Configuración Táctico y Sobrio */}
                    <button
                      type="button"
                      onClick={() => setCaracteristicaEnDetalle(carac)}
                      style={{
                        width: "100%",
                        padding: "5px 10px",
                        borderRadius: 4,
                        backgroundColor: "#18202f",
                        border: "1px solid rgba(148, 163, 184, 0.18)",
                        color: "#cbd5e1",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        boxSizing: "border-box"
                      }}
                    >
                      <Settings size={12} color="#94a3b8" />
                      Configurar / Desglose
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}




        {/* PESTAÑA 3: COMPETENCIAS Y HABILIDADES */}
        {pestanaActiva === "competencias" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Grid 2x2 de Tarjetas Resumen de Competencias */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 10
              }}
            >
              {/* Tarjeta Armas */}
              <div
                className={estilos.neoRaised}
                style={{
                  padding: "10px 12px",
                  borderRadius: 6,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 8,
                  backgroundColor: "#111622",
                  border: "1px solid rgba(148, 163, 184, 0.12)"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Swords size={14} color="#94a3b8" />
                      <strong style={{ fontSize: 12, color: "#f1f5f9" }}>Competencias con Armas</strong>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        backgroundColor: "#18202e",
                        color: "#cbd5e1",
                        border: "1px solid rgba(148, 163, 184, 0.18)",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontWeight: 700
                      }}
                    >
                      {form.competenciasArmasLista?.length || 0} armas
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: "#cbd5e1", margin: 0, lineHeight: 1.4 }}>
                    {form.competenciasArmas || "Sin competencias seleccionadas"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setModalCompetencias("armas")}
                  style={{
                    width: "100%",
                    padding: "5px 10px",
                    borderRadius: 4,
                    backgroundColor: "#18202f",
                    border: "1px solid rgba(148, 163, 184, 0.18)",
                    color: "#cbd5e1",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6
                  }}
                >
                  <Settings size={12} color="#94a3b8" />
                  Gestionar Armas
                </button>
              </div>

              {/* Tarjeta Armaduras */}
              <div
                className={estilos.neoRaised}
                style={{
                  padding: "10px 12px",
                  borderRadius: 6,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 8,
                  backgroundColor: "#111622",
                  border: "1px solid rgba(148, 163, 184, 0.12)"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Shield size={14} color="#94a3b8" />
                      <strong style={{ fontSize: 12, color: "#f1f5f9" }}>Competencias con Armaduras</strong>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        backgroundColor: "#18202e",
                        color: "#cbd5e1",
                        border: "1px solid rgba(148, 163, 184, 0.18)",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontWeight: 700
                      }}
                    >
                      {form.competenciasArmadurasLista?.length || 0} armaduras
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: "#cbd5e1", margin: 0, lineHeight: 1.4 }}>
                    {form.competenciasArmaduras || "Sin competencias seleccionadas"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setModalCompetencias("armaduras")}
                  style={{
                    width: "100%",
                    padding: "5px 10px",
                    borderRadius: 4,
                    backgroundColor: "#18202f",
                    border: "1px solid rgba(148, 163, 184, 0.18)",
                    color: "#cbd5e1",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6
                  }}
                >
                  <Settings size={12} color="#94a3b8" />
                  Gestionar Armaduras
                </button>
              </div>

              {/* Tarjeta Idiomas */}
              <div
                className={estilos.neoRaised}
                style={{
                  padding: "10px 12px",
                  borderRadius: 6,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 8,
                  backgroundColor: "#111622",
                  border: "1px solid rgba(148, 163, 184, 0.12)"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Languages size={14} color="#94a3b8" />
                      <strong style={{ fontSize: 12, color: "#f1f5f9" }}>Idiomas Conocidos</strong>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        backgroundColor: "#18202e",
                        color: "#cbd5e1",
                        border: "1px solid rgba(148, 163, 184, 0.18)",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontWeight: 700
                      }}
                    >
                      {form.idiomasLista?.length || 0} idiomas
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: "#cbd5e1", margin: 0, lineHeight: 1.4 }}>
                    {form.idiomas || "Común"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setModalCompetencias("idiomas")}
                  style={{
                    width: "100%",
                    padding: "5px 10px",
                    borderRadius: 4,
                    backgroundColor: "#18202f",
                    border: "1px solid rgba(148, 163, 184, 0.18)",
                    color: "#cbd5e1",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6
                  }}
                >
                  <Settings size={12} color="#94a3b8" />
                  Gestionar Idiomas
                </button>
              </div>

              {/* Tarjeta Herramientas */}
              <div
                className={estilos.neoRaised}
                style={{
                  padding: "10px 12px",
                  borderRadius: 6,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 8,
                  backgroundColor: "#111622",
                  border: "1px solid rgba(148, 163, 184, 0.12)"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Wrench size={14} color="#94a3b8" />
                      <strong style={{ fontSize: 12, color: "#f1f5f9" }}>Herramientas e Instrumentos</strong>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        backgroundColor: "#18202e",
                        color: "#cbd5e1",
                        border: "1px solid rgba(148, 163, 184, 0.18)",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontWeight: 700
                      }}
                    >
                      {form.herramientasLista?.length || 0} herramientas
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: "#cbd5e1", margin: 0, lineHeight: 1.4 }}>
                    {form.herramientas || "Ninguna"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setModalCompetencias("herramientas")}
                  style={{
                    width: "100%",
                    padding: "5px 10px",
                    borderRadius: 4,
                    backgroundColor: "#18202f",
                    border: "1px solid rgba(148, 163, 184, 0.18)",
                    color: "#cbd5e1",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6
                  }}
                >
                  <Settings size={12} color="#94a3b8" />
                  Gestionar Herramientas
                </button>
              </div>
            </div>

            {/* SECCIÓN HABILIDADES (18) */}
            <div className={estilos.campoFormulario} style={{ marginTop: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Sliders size={14} color="#94a3b8" />
                  <label className={estilos.labelFormulario} style={{ margin: 0, fontSize: 11, color: "#f1f5f9" }}>
                    Habilidades e Inspector de Desglose (18)
                  </label>
                </div>
                <span style={{ fontSize: 10, color: "#94a3b8", display: "inline-flex", alignItems: "center", gap: 3 }}>
                  Clic en <Settings size={10} style={{ display: "inline-block" }} /> para ver desglose matemático o personalizar
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                  gap: 8
                }}
              >
                {HABILIDADES_LISTA.map(({ clave, nombre }) => {
                  const hab = clave as Habilidad;
                  const custom = form.personalizacionesHabilidades?.[hab];
                  const grado = form.gradosHabilidades?.[hab] || "ninguna";
                  const titulo = custom?.nombrePersonalizado || nombre;

                  const colorGrado =
                    grado === "pericia"
                      ? "#d8b4fe"
                      : grado === "competente"
                      ? "#93c5fd"
                      : grado === "medio"
                      ? "#86efac"
                      : "#64748b";

                  const etiquetaGrado =
                    grado === "pericia"
                      ? "Pericia (2x PB)"
                      : grado === "competente"
                      ? "Competente (1x PB)"
                      : grado === "medio"
                      ? "Medio bono"
                      : "Sin competencia";

                  return (
                    <div
                      key={hab}
                      className={estilos.neoRaised}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 6,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: 11,
                        backgroundColor: "#111622",
                        border: "1px solid rgba(148, 163, 184, 0.12)"
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontWeight: 700, color: "#f1f5f9" }}>{titulo}</span>
                        <span style={{ fontSize: 9, color: colorGrado, fontWeight: 600 }}>
                          {etiquetaGrado}
                          {custom?.modificadorExtra ? ` (+${custom.modificadorExtra})` : ""}
                          {custom?.valorFijo !== null && custom?.valorFijo !== undefined ? ` [Fijo: ${custom.valorFijo}]` : ""}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setHabilidadEnDetalle({ clave: hab, nombre })}
                        style={{
                          padding: "4px 8px",
                          fontSize: 10,
                          backgroundColor: "#18202f",
                          border: "1px solid rgba(148, 163, 184, 0.18)",
                          color: "#cbd5e1",
                          borderRadius: 4,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        <Settings size={10} color="#94a3b8" />
                        Editar
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}


        {/* PESTAÑA 4: SENTIDOS Y SALUD BASE */}
        {pestanaActiva === "sentidos" && (
          <>
            <div className={estilos.filaFormulario}>
              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>HP Máximo Base (Verdadero)</label>
                <input
                  type="number"
                  className={estilos.inputFormulario}
                  value={form.hpMaximoBase || 10}
                  onChange={(e) => {
                    const maxBaseVal = Math.max(1, parseInt(e.target.value, 10) || 1);
                    setForm((prev) => ({
                      ...prev,
                      hpMaximoBase: maxBaseVal,
                      hpMaximo: maxBaseVal,
                      hpActual: Math.min(prev.hpActual, maxBaseVal)
                    }));
                  }}
                  min="1"
                  required
                />
              </div>

              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Tipo de Dado de Golpe (Sugerencia)</label>
                <SelectorSugerencias
                  valor={form.tipoDadoGolpe}
                  alCambiar={(val) =>
                    actualizarCampo("tipoDadoGolpe", val as "d6" | "d8" | "d10" | "d12")
                  }
                  opciones={["d6", "d8", "d10", "d12", "d4", "d20"]}
                  placeholder="d6, d8, d10, d12..."
                />
              </div>
            </div>

            <div className={estilos.filaFormulario}>
              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Clase de Armadura (CA Base)</label>
                <input
                  type="number"
                  className={estilos.inputFormulario}
                  value={form.ca}
                  onChange={(e) => actualizarCampo("ca", parseInt(e.target.value, 10) || 10)}
                  min="1"
                />
              </div>

              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Notas de CA</label>
                <input
                  type="text"
                  className={estilos.inputFormulario}
                  value={form.caNotas}
                  onChange={(e) => actualizarCampo("caNotas", e.target.value)}
                  placeholder="Ej. Cota de malla + Escudo"
                />
              </div>
            </div>

            <div className={estilos.filaFormulario}>
              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Bonificador Extra de Iniciativa</label>
                <input
                  type="number"
                  className={estilos.inputFormulario}
                  value={form.iniciativaBono}
                  onChange={(e) =>
                    actualizarCampo("iniciativaBono", parseInt(e.target.value, 10) || 0)
                  }
                />
              </div>

              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Velocidad Base</label>
                <input
                  type="text"
                  className={estilos.inputFormulario}
                  value={
                    typeof form.velocidad === "string"
                      ? form.velocidad
                      : `${form.velocidad.caminar} pies`
                  }
                  onChange={(e) => actualizarCampo("velocidad", e.target.value)}
                  placeholder="Ej. 30 pies, volar 60 pies"
                />
              </div>
            </div>

            <div className={estilos.campoFormulario}>
              <label className={estilos.labelFormulario}>Sentidos Especiales</label>
              <input
                type="text"
                className={estilos.inputFormulario}
                value={typeof form.sentidos === "string" ? form.sentidos : ""}
                onChange={(e) => actualizarCampo("sentidos", e.target.value)}
                placeholder="Ej. Visión en la oscuridad 60 pies"
              />
            </div>
          </>
        )}

        {/* PESTAÑA 5: MAGIA Y CONJUROS */}
        {pestanaActiva === "magia" && (
          <>
            {/* Interruptor de Lanzador */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#161e2c",
                border: "1px solid rgba(148, 163, 184, 0.14)",
                borderRadius: 6,
                padding: "12px 14px"
              }}
            >
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>
                  Habilitar Lanzamiento de Conjuros
                </span>
                <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
                  Activa la pestaña de conjuros, espacios de magia y reserva de maná.
                </p>
              </div>

              <input
                type="checkbox"
                checked={form.esLanzador}
                onChange={(e) => {
                  const nuevoEsLanzador = e.target.checked;
                  let nuevasClases = form.clasesLanzadoras || [];

                  // Si se activa y no tiene clases lanzadoras, autoconfigurar con la clase actual
                  if (nuevoEsLanzador && nuevasClases.length === 0) {
                    const detectada = detectarTipoLanzador(form.clase, form.subclase);
                    if (detectada) {
                      nuevasClases = [
                        {
                          clase: form.clase || "Mago",
                          nivel: form.nivel || 1,
                          tipoLanzador: detectada.tipo,
                          habilidadConjuro: detectada.habilidad,
                          modeloConjuros: detectada.modelo
                        }
                      ];
                    } else {
                      nuevasClases = [
                        {
                          clase: form.clase || "Lanzador",
                          nivel: form.nivel || 1,
                          tipoLanzador: "completo",
                          habilidadConjuro: "inteligencia",
                          modeloConjuros: "conocidos"
                        }
                      ];
                    }
                  }

                  const recursos = calcularTodosRecursosMagicos(nuevasClases, form.overrideEspaciosConjuro, form.overridePuntosConjuro);

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
                }}
                style={{ width: 18, height: 18, cursor: "pointer" }}
              />
            </div>

            {form.esLanzador && (
              <>
                {/* Configuración de Clases Lanzadoras */}
                <div
                  style={{
                    backgroundColor: "#161e2c",
                    border: "1px solid rgba(148, 163, 184, 0.14)",
                    borderRadius: 6,
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", textTransform: "uppercase" }}>
                      Clases Lanzadoras de Magia
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        const detectada = detectarTipoLanzador(form.clase, form.subclase);
                        const nuevaClase = {
                          clase: form.clase || "Mago",
                          nivel: form.nivel || 1,
                          tipoLanzador: detectada?.tipo || "completo",
                          habilidadConjuro: detectada?.habilidad || "inteligencia",
                          modeloConjuros: detectada?.modelo || "conocidos"
                        };
                        const nuevasClases = [...(form.clasesLanzadoras || []), nuevaClase];
                        const recursos = calcularTodosRecursosMagicos(nuevasClases, form.overrideEspaciosConjuro, form.overridePuntosConjuro);

                        setForm((prev) => ({
                          ...prev,
                          clasesLanzadoras: nuevasClases,
                          espaciosConjuroMaximos: recursos.espaciosConjuroMaximos,
                          puntosConjuroMaximos: recursos.puntosConjuroMaximos,
                          nivelConjuroMaximo: recursos.nivelConjuroMaximo,
                          espaciosPactoMaximos: recursos.espaciosPactoMaximos,
                          nivelEspacioPacto: recursos.nivelEspacioPacto
                        }));
                      }}
                      style={{
                        backgroundColor: "#1e293b",
                        border: "1px solid rgba(96, 165, 250, 0.3)",
                        borderRadius: 4,
                        color: "#93c5fd",
                        fontSize: 11,
                        padding: "3px 8px",
                        cursor: "pointer"
                      }}
                    >
                      + Añadir Clase
                    </button>
                  </div>

                  {(form.clasesLanzadoras || []).map((claseItem, idx) => (
                    <div
                      key={`clase-lan-${idx}`}
                      style={{
                        backgroundColor: "#0b0f16",
                        border: "1px solid rgba(148, 163, 184, 0.1)",
                        borderRadius: 6,
                        padding: 10,
                        display: "grid",
                        gridTemplateColumns: "1.2fr 0.8fr 1fr 1fr auto",
                        gap: 8,
                        alignItems: "center"
                      }}
                    >
                      {/* Nombre de la clase */}
                      <input
                        type="text"
                        value={claseItem.clase}
                        onChange={(e) => {
                          const val = e.target.value;
                          const nuevas = [...form.clasesLanzadoras];
                          nuevas[idx] = { ...nuevas[idx], clase: val };
                          const recursos = calcularTodosRecursosMagicos(nuevas, form.overrideEspaciosConjuro, form.overridePuntosConjuro);
                          setForm((prev) => ({
                            ...prev,
                            clasesLanzadoras: nuevas,
                            espaciosConjuroMaximos: recursos.espaciosConjuroMaximos,
                            puntosConjuroMaximos: recursos.puntosConjuroMaximos,
                            nivelConjuroMaximo: recursos.nivelConjuroMaximo,
                            espaciosPactoMaximos: recursos.espaciosPactoMaximos,
                            nivelEspacioPacto: recursos.nivelEspacioPacto
                          }));
                        }}
                        placeholder="Clase"
                        style={{
                          backgroundColor: "#161e2c",
                          border: "1px solid rgba(148, 163, 184, 0.2)",
                          borderRadius: 4,
                          color: "#f1f5f9",
                          fontSize: 11,
                          padding: "4px 6px"
                        }}
                      />

                      {/* Nivel en la clase */}
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={claseItem.nivel}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 1;
                          const nuevas = [...form.clasesLanzadoras];
                          nuevas[idx] = { ...nuevas[idx], nivel: val };
                          const recursos = calcularTodosRecursosMagicos(nuevas, form.overrideEspaciosConjuro, form.overridePuntosConjuro);
                          setForm((prev) => ({
                            ...prev,
                            clasesLanzadoras: nuevas,
                            espaciosConjuroMaximos: recursos.espaciosConjuroMaximos,
                            puntosConjuroMaximos: recursos.puntosConjuroMaximos,
                            nivelConjuroMaximo: recursos.nivelConjuroMaximo,
                            espaciosPactoMaximos: recursos.espaciosPactoMaximos,
                            nivelEspacioPacto: recursos.nivelEspacioPacto
                          }));
                        }}
                        style={{
                          backgroundColor: "#161e2c",
                          border: "1px solid rgba(148, 163, 184, 0.2)",
                          borderRadius: 4,
                          color: "#f1f5f9",
                          fontSize: 11,
                          padding: "4px 6px",
                          textAlign: "center"
                        }}
                      />

                      {/* Tipo de lanzador */}
                      <SelectorDesplegable<import("@/tipos").TipoLanzador>
                        valor={claseItem.tipoLanzador}
                        alCambiar={(val) => {
                          const nuevas = [...form.clasesLanzadoras];
                          nuevas[idx] = { ...nuevas[idx], tipoLanzador: val };
                          const recursos = calcularTodosRecursosMagicos(nuevas, form.overrideEspaciosConjuro, form.overridePuntosConjuro);
                          setForm((prev) => ({
                            ...prev,
                            clasesLanzadoras: nuevas,
                            espaciosConjuroMaximos: recursos.espaciosConjuroMaximos,
                            puntosConjuroMaximos: recursos.puntosConjuroMaximos,
                            nivelConjuroMaximo: recursos.nivelConjuroMaximo,
                            espaciosPactoMaximos: recursos.espaciosPactoMaximos,
                            nivelEspacioPacto: recursos.nivelEspacioPacto
                          }));
                        }}
                        tamano="compacto"
                        opciones={[
                          { valor: "completo", etiqueta: "Completo (×1)" },
                          { valor: "medio", etiqueta: "Medio (÷2)" },
                          { valor: "tercio", etiqueta: "Tercio (÷3)" },
                          { valor: "pacto", etiqueta: "Pacto (Brujo)" }
                        ]}
                      />

                      {/* Habilidad de conjuro */}
                      <SelectorDesplegable<Caracteristica>
                        valor={claseItem.habilidadConjuro || "inteligencia"}
                        alCambiar={(val) => {
                          const nuevas = [...form.clasesLanzadoras];
                          nuevas[idx] = { ...nuevas[idx], habilidadConjuro: val };
                          setForm((prev) => ({ ...prev, clasesLanzadoras: nuevas }));
                        }}
                        tamano="compacto"
                        opciones={[
                          { valor: "inteligencia", etiqueta: "Inteligencia" },
                          { valor: "sabiduria", etiqueta: "Sabiduría" },
                          { valor: "carisma", etiqueta: "Carisma" }
                        ]}
                      />

                      {/* Botón Eliminar */}
                      <button
                        type="button"
                        onClick={() => {
                          const nuevas = form.clasesLanzadoras.filter((_, i) => i !== idx);
                          const recursos = calcularTodosRecursosMagicos(nuevas, form.overrideEspaciosConjuro, form.overridePuntosConjuro);
                          setForm((prev) => ({
                            ...prev,
                            clasesLanzadoras: nuevas,
                            espaciosConjuroMaximos: recursos.espaciosConjuroMaximos,
                            puntosConjuroMaximos: recursos.puntosConjuroMaximos,
                            nivelConjuroMaximo: recursos.nivelConjuroMaximo,
                            espaciosPactoMaximos: recursos.espaciosPactoMaximos,
                            nivelEspacioPacto: recursos.nivelEspacioPacto
                          }));
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          padding: 4
                        }}
                        title="Eliminar clase"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Overrides Manuales de Espacios */}
                <div
                  style={{
                    backgroundColor: "#161e2c",
                    border: "1px solid rgba(148, 163, 184, 0.14)",
                    borderRadius: 6,
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", textTransform: "uppercase" }}>
                    Overrides Manuales de Espacios de Conjuro
                  </span>
                  <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
                    Establece cantidades fijas por nivel si juegas con reglas caseras o deseas modificar los calculados.
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                    {Array.from({ length: 9 }).map((_, i) => {
                      const nv = i + 1;
                      const valActual =
                        form.overrideEspaciosConjuro?.[String(nv)] ??
                        form.espaciosConjuroMaximos?.[String(nv)] ??
                        0;

                      return (
                        <div key={`override-nv-${nv}`} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <span style={{ fontSize: 10, color: "#94a3b8", textAlign: "center" }}>
                            Nivel {nv}
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={10}
                            value={valActual}
                            onChange={(e) => {
                              const cant = parseInt(e.target.value, 10) || 0;
                              const overridesActuales = { ...(form.overrideEspaciosConjuro || {}) };
                              overridesActuales[String(nv)] = cant;
                              const recursos = calcularTodosRecursosMagicos(form.clasesLanzadoras, overridesActuales, form.overridePuntosConjuro);

                              setForm((prev) => ({
                                ...prev,
                                overrideEspaciosConjuro: overridesActuales,
                                espaciosConjuroMaximos: recursos.espaciosConjuroMaximos
                              }));
                            }}
                            style={{
                              backgroundColor: "#0b0f16",
                              border: "1px solid rgba(148, 163, 184, 0.2)",
                              borderRadius: 4,
                              color: "#f1f5f9",
                              fontSize: 11,
                              padding: "4px",
                              textAlign: "center"
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Botones al pie del formulario */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            borderTop: "1px solid rgba(148, 163, 184, 0.15)",
            paddingTop: 14,
            marginTop: 8
          }}
        >
          <button type="button" className={estilos.neoButton} onClick={alVolverAFicha}>
            Cancelar y Volver
          </button>
          <button
            type="submit"
            className={estilos.neoButton}
            style={{
              backgroundColor: "#2563eb",
              borderColor: "#60a5fa",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <Save size={14} />
            Guardar Cambios
          </button>
        </div>
      </form>

      {/* Modal Inspector / Personalización de Habilidad */}
      {habilidadEnDetalle && (
        <ModalDetalleHabilidad
          habilidadClave={habilidadEnDetalle.clave}
          nombreHabilidad={habilidadEnDetalle.nombre}
          personaje={form}
          alCerrar={() => setHabilidadEnDetalle(null)}
          alGuardarPersonalizacion={(hab, grado, personalizacion) => {
            setForm((prev) => ({
              ...prev,
              gradosHabilidades: {
                ...prev.gradosHabilidades,
                [hab]: grado
              },
              personalizacionesHabilidades: {
                ...prev.personalizacionesHabilidades,
                [hab]: {
                  ...(prev.personalizacionesHabilidades?.[hab] || {
                    modificadorExtra: 0,
                    valorFijo: null,
                    notas: ""
                  }),
                  ...personalizacion
                }
              }
            }));
            setHabilidadEnDetalle(null);
          }}
        />
      )}

      {/* Modal Selector de Competencias (Armas, Armaduras, Idiomas, Herramientas) */}
      {modalCompetencias && (
        <ModalSelectorCompetencias
          categoriaInicial={modalCompetencias}
          estadoInicial={{
            competenciasArmasGrupos: (form.competenciasArmasGrupos || []) as ("sencillas" | "marciales" | "fuego")[],
            competenciasArmasLista: form.competenciasArmasLista || [],
            competenciasArmadurasGrupos: (form.competenciasArmadurasGrupos || []) as ("ligeras" | "medias" | "pesadas" | "escudos")[],
            competenciasArmadurasLista: form.competenciasArmadurasLista || [],
            idiomasLista: form.idiomasLista || [],
            herramientasLista: form.herramientasLista || []
          }}
          alGuardar={manejarGuardarCompetencias}
          alCerrar={() => setModalCompetencias(null)}
        />
      )}

      {/* Modal Inspector / Personalización de Característica */}
      {caracteristicaEnDetalle && (
        <ModalDetalleCaracteristica
          caracteristicaClave={caracteristicaEnDetalle}
          personaje={form}
          alCerrar={() => setCaracteristicaEnDetalle(null)}
          alGuardar={manejarGuardarCaracteristica}
        />
      )}
    </div>
  );
};

export default PanelConfiguracionPersonaje;


