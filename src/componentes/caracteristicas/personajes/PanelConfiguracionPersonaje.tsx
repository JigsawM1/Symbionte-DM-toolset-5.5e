import React from "react";
import type { PersonajeJugador } from "@/tipos";
import { ModalDetalleHabilidad } from "./ModalDetalleHabilidad";
import { ModalDetalleCaracteristica } from "./ModalDetalleCaracteristica";
import { ModalSelectorCompetencias } from "./ModalSelectorCompetencias";
import {
  PestanaIdentidad,
  PestanaAtributos,
  PestanaCompetencias,
  PestanaSentidosSalud,
  PestanaMagia
} from "./configuracion";
import { usarConfiguracionPersonaje } from "./configuracion/usarConfiguracionPersonaje";
import {
  Save,
  Shield,
  User,
  Award,
  Eye,
  Sparkles
} from "lucide-react";
import estilos from "./configuracion/ConfiguracionPersonaje.module.css";

interface PanelConfiguracionPersonajeProps {
  personaje: PersonajeJugador;
  alGuardar: (cambios: Partial<PersonajeJugador>) => void;
  alVolverAFicha: () => void;
}

/**
 * Componente orquestador ultraligero para la configuración de la hoja de personaje.
 * La lógica de sincronización y estado reside en `usarConfiguracionPersonaje` y `sincronizadorMulticlase`,
 * mientras que cada pestaña se presenta a través de submódulos desacoplados.
 */
export const PanelConfiguracionPersonaje: React.FC<PanelConfiguracionPersonajeProps> = ({
  personaje,
  alGuardar,
  alVolverAFicha
}) => {
  const {
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
  } = usarConfiguracionPersonaje(personaje, alGuardar, alVolverAFicha);

  return (
    <div className={estilos.contenedorPrincipal}>
      {/* Selector de Sub-pestañas Internas */}
      <div className={estilos.barraPestanas}>
        <button
          type="button"
          className={`${estilos.botonPestana} ${
            pestanaActiva === "identidad" ? estilos.botonPestanaActiva : ""
          }`}
          onClick={() => setPestanaActiva("identidad")}
        >
          <User size={12} />
          Identidad
        </button>

        <button
          type="button"
          className={`${estilos.botonPestana} ${
            pestanaActiva === "atributos" ? estilos.botonPestanaActiva : ""
          }`}
          onClick={() => setPestanaActiva("atributos")}
        >
          <Award size={12} />
          Atributos
        </button>

        <button
          type="button"
          className={`${estilos.botonPestana} ${
            pestanaActiva === "competencias" ? estilos.botonPestanaActiva : ""
          }`}
          onClick={() => setPestanaActiva("competencias")}
        >
          <Shield size={12} />
          Competencias
        </button>

        <button
          type="button"
          className={`${estilos.botonPestana} ${
            pestanaActiva === "sentidos" ? estilos.botonPestanaActiva : ""
          }`}
          onClick={() => setPestanaActiva("sentidos")}
        >
          <Eye size={12} />
          Sentidos
        </button>

        <button
          type="button"
          className={`${estilos.botonPestana} ${
            pestanaActiva === "magia" ? estilos.botonPestanaActiva : ""
          }`}
          onClick={() => setPestanaActiva("magia")}
        >
          <Sparkles size={12} />
          Magia
        </button>
      </div>

      {/* Formulario Principal de Configuración */}
      <form onSubmit={manejarGuardar} className={estilos.formularioConfiguracion}>
        {pestanaActiva === "identidad" && (
          <PestanaIdentidad
            form={form}
            alActualizarCampo={actualizarCampo}
            alDetectarJugadorTaleSpire={manejarDetectarJugadorTaleSpire}
            alCambiarClaseNombre={manejarCambioClaseNombre}
            alCambiarClaseSubclase={manejarCambioClaseSubclase}
            alCambiarClaseNivel={manejarCambioClaseNivel}
            alEliminarClase={manejarEliminarClase}
            alAgregarClase={manejarAgregarClase}
            alAplicarBuildSugerida={manejarAplicarBuildSugerida}
            alCambiarNivelTotal={manejarCambioNivelTotal}
            alCambiarExperiencia={manejarCambioExperiencia}
          />
        )}

        {pestanaActiva === "atributos" && (
          <PestanaAtributos
            form={form}
            alAbrirDetalleCaracteristica={(carac) => setCaracteristicaEnDetalle(carac)}
          />
        )}

        {pestanaActiva === "competencias" && (
          <PestanaCompetencias
            form={form}
            alAbrirModalCompetencias={(cat) => setModalCompetencias(cat)}
            alAbrirDetalleHabilidad={(info) => setHabilidadEnDetalle(info)}
          />
        )}

        {pestanaActiva === "sentidos" && (
          <PestanaSentidosSalud
            form={form}
            alActualizarCampo={actualizarCampo}
            alActualizarHPMaximoBase={manejarActualizarHPMaximoBase}
          />
        )}

        {pestanaActiva === "magia" && (
          <PestanaMagia
            form={form}
            alAlternarEsLanzador={manejarAlternarEsLanzador}
            alAgregarClaseLanzadora={manejarAgregarClaseLanzadora}
            alActualizarClaseLanzadora={manejarActualizarClaseLanzadora}
            alEliminarClaseLanzadora={manejarEliminarClaseLanzadora}
            alActualizarOverrideEspacios={manejarActualizarOverrideEspacios}
          />
        )}

        {/* Botones al pie del formulario */}
        <div className={estilos.barraAccionesPie}>
          <button
            type="button"
            className={estilos.botonPestana}
            style={{ border: "1px solid rgba(148, 163, 184, 0.2)", width: "auto", padding: "8px 14px" }}
            onClick={alVolverAFicha}
          >
            Cancelar y Volver
          </button>
          <button type="submit" className={estilos.botonGuardarCambios}>
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
