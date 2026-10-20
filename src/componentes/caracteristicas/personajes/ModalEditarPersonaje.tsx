import { FormularioNumerico } from "@/componentes/comunes/FormularioNumerico";
import React, { useState, useMemo } from "react";
import type {
  PersonajeJugador,
  Caracteristica,
  Habilidad,
  GradoCompetencia
} from "@/tipos";
import {
  obtenerDadoGolpePorClase,
  obtenerExperienciaMinimaPorNivel
} from "@/constantes";
import { sincronizarRasgosAutomaticos } from "@/servicios/compendioRasgos";
import { obtenerCatalogoEspecies, obtenerSubespeciesDeEspecie } from "@/servicios/gestorEspecies";
import type { OpcionSugerencia } from "@/componentes/comunes/SelectorSugerencias";
import { X, Save, Shield, User, Award, Eye } from "lucide-react";
import { PestanaIdentidadEdicion } from "./subcomponentes/PestanaIdentidadEdicion";
import { PestanaAtributosEdicion } from "./subcomponentes/PestanaAtributosEdicion";
import { PestanaCompetenciasEdicion } from "./subcomponentes/PestanaCompetenciasEdicion";
import { PestanaSentidosEdicion } from "./subcomponentes/PestanaSentidosEdicion";
import estilos from "./HojaPersonaje.module.css";

interface ModalEditarPersonajeProps {
  personaje: PersonajeJugador;
  alGuardar: (cambios: Partial<PersonajeJugador>) => void;
  alCerrar: () => void;
}

type PestañaModal = "identidad" | "atributos" | "competencias" | "sentidos";

export const ModalEditarPersonaje: React.FC<ModalEditarPersonajeProps> = ({
  personaje,
  alGuardar,
  alCerrar
}) => {
  const [pestañaActiva, setPestañaActiva] = useState<PestañaModal>("identidad");

  // Estado local para edición segura
  const [form, setForm] = useState<PersonajeJugador>({
    ...personaje,
    hpMaximoBase: personaje.hpMaximoBase || personaje.hpMaximo || 10
  });

  const opcionesEspecies = useMemo<OpcionSugerencia[]>(() => {
    return obtenerCatalogoEspecies().map((esp) => {
      const tamanoStr = esp.tamanoOpciones ? esp.tamanoOpciones.join("/") : esp.tamanoPorDefecto || "Mediano";
      const subtitulo = `${esp.tipoCriatura || "Humanoide"} • ${tamanoStr} • ${esp.velocidadBase} pies`;
      return {
        valor: esp.nombre,
        etiqueta: esp.nombre,
        subtitulo
      };
    });
  }, []);

  const opcionesSubespecies = useMemo<OpcionSugerencia[]>(() => {
    const subespecies = obtenerSubespeciesDeEspecie(form.especie);
    return subespecies.map((sub) => ({
      valor: sub.nombre,
      etiqueta: sub.nombre,
      subtitulo: sub.descripcion || undefined
    }));
  }, [form.especie]);

  const actualizarCampo = <K extends keyof PersonajeJugador>(campo: K, valor: PersonajeJugador[K]) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const manejarCambioEspecie = (nuevaEsp: string) => {
    actualizarCampo("especie", nuevaEsp);
    const subs = obtenerSubespeciesDeEspecie(nuevaEsp);
    if (subs.length > 0 && !subs.some((s) => s.nombre.toLowerCase() === (form.subespecie || "").toLowerCase())) {
      actualizarCampo("subespecie", subs[0].nombre);
    }
  };

  const manejarCambioClase = (nuevaClase: string) => {
    // Asignar el dado de golpe sugerido según la clase elegida (manteniendo libre modificación)
    const dadoSugerido = obtenerDadoGolpePorClase(nuevaClase.trim());
    setForm((prev) => ({
      ...prev,
      clase: nuevaClase,
      tipoDadoGolpe: dadoSugerido
    }));
  };

  const manejarCambioNivel = (nuevoNivelStr: string) => {
    const niv = Math.max(1, Math.min(20, parseInt(nuevoNivelStr, 10) || 1));
    const xpMinima = obtenerExperienciaMinimaPorNivel(niv);

    setForm((prev) => ({
      ...prev,
      nivel: niv,
      dadosGolpeTotal: niv,
      dadosGolpeRestantes: Math.min(prev.dadosGolpeRestantes, niv),
      experiencia: Math.max(prev.experiencia, xpMinima)
    }));
  };

  const actualizarCaracteristicaBase = (carac: Caracteristica, valor: number) => {
    setForm((prev) => ({
      ...prev,
      caracteristicas: {
        ...prev.caracteristicas,
        [carac]: Math.max(1, Math.min(30, valor || 10))
      }
    }));
  };

  const actualizarOverrideFijo = (carac: Caracteristica, valor: number | null) => {
    setForm((prev) => ({
      ...prev,
      overridesFijos: {
        ...prev.overridesFijos,
        [carac]: valor
      }
    }));
  };

  const alternarCompetenciaSalvacion = (carac: Caracteristica) => {
    setForm((prev) => ({
      ...prev,
      competenciasSalvacion: {
        ...prev.competenciasSalvacion,
        [carac]: !prev.competenciasSalvacion?.[carac]
      }
    }));
  };

  const actualizarGradoHabilidad = (hab: Habilidad, grado: GradoCompetencia) => {
    setForm((prev) => ({
      ...prev,
      gradosHabilidades: {
        ...prev.gradosHabilidades,
        [hab]: grado
      }
    }));
  };

  const manejarGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    alGuardar({
      ...form,
      rasgos: sincronizarRasgosAutomaticos(form)
    });
    alCerrar();
  };

  return (
    <div className={estilos.overlayModal} onClick={alCerrar}>
      <div className={estilos.cuerpoModal} onClick={(e) => e.stopPropagation()}>
        {/* Cabecera del Modal */}
        <div className={estilos.cabeceraModal}>
          <span className={estilos.tituloModal}>Configuración de Ficha: {personaje.nombre}</span>
          <button
            type="button"
            className={estilos.botonConfigurarPj}
            onClick={alCerrar}
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Barra de Sub-pestañas */}
        <div className={estilos.barraPestañasModal}>
          <button
            type="button"
            className={`${estilos.botonPestañaModal} ${
              pestañaActiva === "identidad" ? estilos.botonPestañaModalActiva : ""
            }`}
            onClick={() => setPestañaActiva("identidad")}
          >
            <User size={14} style={{ marginRight: 4 }} />
            Identidad
          </button>

          <button
            type="button"
            className={`${estilos.botonPestañaModal} ${
              pestañaActiva === "atributos" ? estilos.botonPestañaModalActiva : ""
            }`}
            onClick={() => setPestañaActiva("atributos")}
          >
            <Award size={14} style={{ marginRight: 4 }} />
            Atributos y Overrides
          </button>

          <button
            type="button"
            className={`${estilos.botonPestañaModal} ${
              pestañaActiva === "competencias" ? estilos.botonPestañaModalActiva : ""
            }`}
            onClick={() => setPestañaActiva("competencias")}
          >
            <Shield size={14} style={{ marginRight: 4 }} />
            Competencias
          </button>

          <button
            type="button"
            className={`${estilos.botonPestañaModal} ${
              pestañaActiva === "sentidos" ? estilos.botonPestañaModalActiva : ""
            }`}
            onClick={() => setPestañaActiva("sentidos")}
          >
            <Eye size={14} style={{ marginRight: 4 }} />
            Sentidos y Salud Base
          </button>
        </div>

        {/* Contenido de la Pestaña Activa */}
        <FormularioNumerico onSubmit={manejarGuardar} className={estilos.contenidoPestañaModal}>
          {/* PESTAÑA 1: IDENTIDAD */}
          {pestañaActiva === "identidad" && (
            <PestanaIdentidadEdicion
              form={form}
              opcionesEspecies={opcionesEspecies}
              opcionesSubespecies={opcionesSubespecies}
              actualizarCampo={actualizarCampo}
              manejarCambioClase={manejarCambioClase}
              manejarCambioNivel={manejarCambioNivel}
              alCambiarEspecie={manejarCambioEspecie}
            />
          )}

          {/* PESTAÑA 2: ATRIBUTOS Y MODIFICADORES */}
          {pestañaActiva === "atributos" && (
            <PestanaAtributosEdicion
              form={form}
              actualizarCaracteristicaBase={actualizarCaracteristicaBase}
              actualizarOverrideFijo={actualizarOverrideFijo}
            />
          )}

          {/* PESTAÑA 3: COMPETENCIAS */}
          {pestañaActiva === "competencias" && (
            <PestanaCompetenciasEdicion
              form={form}
              alternarCompetenciaSalvacion={alternarCompetenciaSalvacion}
              actualizarGradoHabilidad={actualizarGradoHabilidad}
              actualizarCampo={actualizarCampo}
            />
          )}

          {/* PESTAÑA 4: SENTIDOS, COMBATE Y SALUD */}
          {pestañaActiva === "sentidos" && (
            <PestanaSentidosEdicion
              form={form}
              setForm={setForm}
              actualizarCampo={actualizarCampo}
            />
          )}

          {/* Pie del Modal con botones */}
          <div className={estilos.pieModal}>
            <button
              type="button"
              className={estilos.neoButton}
              onClick={alCerrar}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`${estilos.neoButton} ${estilos.botonGuardarEdicionPj}`}
            >
              <Save size={14} className={estilos.iconoGuardarMargen} />
              Guardar Cambios
            </button>
          </div>
        </FormularioNumerico>
      </div>
    </div>
  );
};
