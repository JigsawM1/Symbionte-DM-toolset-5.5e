import React from "react";
import { CabeceraPersonaje } from "./CabeceraPersonaje";
import { BarraTacticaPersonaje } from "./BarraTacticaPersonaje";
import { MetricasRapidasPersonaje } from "./MetricasRapidasPersonaje";
import { PanelVitalidadPersonaje } from "./PanelVitalidadPersonaje";
import { PanelAtributosPersonaje } from "./PanelAtributosPersonaje";
import { PanelHabilidadesPersonaje } from "./PanelHabilidadesPersonaje";
import { PanelConjurosPersonaje } from "./PanelConjurosPersonaje";
import { ModalEditarPersonaje } from "./ModalEditarPersonaje";
import { ModalSelectorCompetencias } from "./ModalSelectorCompetencias";
import { ModalResumenDescanso } from "./ModalResumenDescanso";
import { BotonSubPestana } from "./BotonSubPestana";
import { usarHojaPersonaje } from "./usarHojaPersonaje";
import { Swords, Sparkles } from "lucide-react";
import estilos from "./HojaPersonaje.module.css";

interface HojaPersonajeProps {
  alAbrirConfiguracion?: () => void;
}

export const HojaPersonaje: React.FC<HojaPersonajeProps> = ({ alAbrirConfiguracion }) => {
  const {
    personajeActivo,
    statsCalculadas,
    sistemaMagia,
    baseDatosHechizos,
    rondaActual,
    modoTirada,
    modalEdicionAbierto,
    setModalEdicionAbierto,
    modalCompetencias,
    setModalCompetencias,
    modalDescanso,
    setModalDescanso,
    subPestanaActiva,
    setSubPestanaActiva,
    totalConjurosYTrucos,
    actualizarPersonaje,
    alternarInspiracionPersonaje,
    aplicarCondicionPersonaje,
    quitarCondicionPersonaje,
    quitarEfectoPersonaje,
    romperConcentracion,
    vincularMiniaturaTSPersonaje,
    manejarAbrirEdicion,
    manejarCambioModoTirada,
    manejarDescansoCorto,
    manejarDescansoLargo,
    manejarTirarCaracteristica,
    manejarTirarSalvacion,
    manejarTirarHabilidad,
    manejarTirarIniciativa,
    manejarTirarSalvacionMuerte3D,
    manejarTirarDadoGolpe,
    alModificarHP,
    alEstablecerHPActual,
    alModificarHPMaximoEfectivo,
    alModificarHPTemporal,
    alEstablecerDadosGolpeRestantes,
    alEstablecerSalvacionMuerte,
    alReiniciarSalvacionesMuerte,
    alModificarCansancio,
    alAlternarSalvacion,
    alModificarCaracteristicaBase,
    alCiclarGradoHabilidad,
    alGastarEspacio,
    alRecuperarEspacio,
    alRecuperarTodosEspacios,
    alGastarPuntos,
    alRecuperarPuntos,
    alRecuperarTodosPuntos,
    alGastarEspacioPacto,
    alRecuperarEspaciosPacto,
    alEstablecerConcentracion,
    alRomperConcentracion,
    alQuitarTruco,
    alQuitarConjuro,
    alAlternarPreparado
  } = usarHojaPersonaje(alAbrirConfiguracion);

  if (!personajeActivo || !statsCalculadas) {
    return (
      <div className={estilos.contenedorPrincipal}>
        <div className={`${estilos.neoRaised} ${estilos.cajaSinPersonaje}`}>
          <p className={estilos.textoSinPersonaje}>
            No hay ningún personaje activo seleccionado. Ve a la pestaña "Mis Personajes" para crear o activar uno.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className={estilos.contenedorPrincipal}>
      {/* 1. Cabecera e Identidad (Apartado A) */}
      <CabeceraPersonaje
        personaje={personajeActivo}
        alAbrirModalEdicion={manejarAbrirEdicion}
        alVincularMiniaturaTS={(idMini) => vincularMiniaturaTSPersonaje(personajeActivo.id, idMini)}
      />

      {/* 2. Barra Táctica: Descansos, Ventaja/Desventaja y Condiciones */}
      <BarraTacticaPersonaje
        modoTirada={modoTirada}
        condicionesActivas={personajeActivo.condicionesActivas || []}
        efectosActivos={personajeActivo.efectosActivos || []}
        rondaActual={rondaActual}
        hpActual={personajeActivo.hpActual}
        hpMaximo={personajeActivo.hpMaximo || personajeActivo.hpMaximoBase || 10}
        penalizacionArmadura={statsCalculadas.penalizacionArmadura}
        desventajaSigiloArmadura={statsCalculadas.desventajaSigiloArmadura}
        concentracionActiva={personajeActivo.concentracionActiva}
        alCambiarModoTirada={manejarCambioModoTirada}
        alEjecutarDescansoCorto={manejarDescansoCorto}
        alEjecutarDescansoLargo={manejarDescansoLargo}
        alAplicarCondicion={(cond) => aplicarCondicionPersonaje(personajeActivo.id, cond)}
        alQuitarCondicion={(cond) => quitarCondicionPersonaje(personajeActivo.id, cond)}
        alQuitarEfecto={(idEfecto) => quitarEfectoPersonaje(personajeActivo.id, idEfecto)}
        alRomperConcentracion={() => romperConcentracion(personajeActivo.id)}
      />

      {/* 3. Métricas Rápidas: CA, Iniciativa, Velocidad, PB, Inspiración */}
      <MetricasRapidasPersonaje
        personaje={personajeActivo}
        bonoCompetencia={statsCalculadas.bonoCompetencia}
        modDestreza={statsCalculadas.modificadores.destreza}
        claseArmadura={statsCalculadas.claseArmadura}
        penalizacionArmadura={statsCalculadas.penalizacionArmadura}
        bonoVelocidad={statsCalculadas.bonoVelocidadRasgos}
        alTirarIniciativa={manejarTirarIniciativa}
        alAlternarInspiracion={() => alternarInspiracionPersonaje(personajeActivo.id)}
      />

      {/* 4. Barra de Sub-Pestañas Internas (General vs Conjuros) */}
      <div className={estilos.barraSubPestanas}>
        <BotonSubPestana
          activa={subPestanaActiva === "general"}
          etiqueta="Combate y Atributos"
          icono={<Swords size={14} color={subPestanaActiva === "general" ? "var(--pj-texto-cian)" : "var(--pj-texto-terciario)"} />}
          alClick={() => setSubPestanaActiva("general")}
        />

        <BotonSubPestana
          activa={subPestanaActiva === "conjuros"}
          etiqueta="Conjuros y Magia"
          icono={<Sparkles size={14} color={subPestanaActiva === "conjuros" ? "var(--pj-texto-acento)" : "var(--pj-texto-terciario)"} />}
          badge={totalConjurosYTrucos}
          alClick={() => setSubPestanaActiva("conjuros")}
        />
      </div>

      {/* 5. Contenido según Sub-pestaña Activa */}
      {subPestanaActiva === "general" && (
        <>
          {/* Vitalidad y Supervivencia (Apartado C) */}
          <PanelVitalidadPersonaje
            personaje={personajeActivo}
            alModificarHP={alModificarHP}
            alEstablecerHPActual={alEstablecerHPActual}
            alModificarHPMaximoEfectivo={alModificarHPMaximoEfectivo}
            alModificarHPTemporal={alModificarHPTemporal}
            alGastarDadoGolpe={manejarTirarDadoGolpe}
            alEstablecerDadosGolpeRestantes={alEstablecerDadosGolpeRestantes}
            alEstablecerSalvacionMuerte={alEstablecerSalvacionMuerte}
            alReiniciarSalvacionesMuerte={alReiniciarSalvacionesMuerte}
            alModificarCansancio={alModificarCansancio}
            alTirarSalvacionMuerte3D={manejarTirarSalvacionMuerte3D}
          />

          {/* Características y Sentidos Pasivos (Apartado B) */}
          <PanelAtributosPersonaje
            personaje={personajeActivo}
            statsCalculadas={statsCalculadas}
            alTirarCaracteristica={manejarTirarCaracteristica}
            alTirarSalvacion={manejarTirarSalvacion}
            alAlternarSalvacion={alAlternarSalvacion}
            alModificarCaracteristicaBase={alModificarCaracteristicaBase}
          />

          {/* Habilidades y Competencias (Apartado B) */}
          <PanelHabilidadesPersonaje
            key={personajeActivo.id}
            personaje={personajeActivo}
            statsCalculadas={statsCalculadas}
            alTirarHabilidad={manejarTirarHabilidad}
            alCiclarGradoHabilidad={alCiclarGradoHabilidad}
            alAbrirSelectorCompetencias={(categoria) => setModalCompetencias(categoria)}
          />
        </>
      )}

      {subPestanaActiva === "conjuros" && (
        <PanelConjurosPersonaje
          personaje={personajeActivo}
          bonoCompetencia={statsCalculadas.bonoCompetencia}
          modificadores={statsCalculadas.modificadores}
          baseDatosHechizos={baseDatosHechizos}
          sistemaMagia={sistemaMagia}
          penalizacionArmadura={statsCalculadas.penalizacionArmadura}
          alAbrirConfiguracion={manejarAbrirEdicion}
          alGastarEspacio={alGastarEspacio}
          alRecuperarEspacio={alRecuperarEspacio}
          alRecuperarTodosEspacios={alRecuperarTodosEspacios}
          alGastarPuntos={alGastarPuntos}
          alRecuperarPuntos={alRecuperarPuntos}
          alRecuperarTodosPuntos={alRecuperarTodosPuntos}
          alGastarEspacioPacto={alGastarEspacioPacto}
          alRecuperarEspaciosPacto={alRecuperarEspaciosPacto}
          alEstablecerConcentracion={alEstablecerConcentracion}
          alRomperConcentracion={alRomperConcentracion}
          alQuitarTruco={alQuitarTruco}
          alQuitarConjuro={alQuitarConjuro}
          alAlternarPreparado={alAlternarPreparado}
        />
      )}

      {/* Modal Selector de Competencias (Armas, Armaduras, Idiomas, Herramientas) */}
      {modalCompetencias && (
        <ModalSelectorCompetencias
          categoriaInicial={modalCompetencias}
          estadoInicial={{
            competenciasArmasGrupos: (personajeActivo.competenciasArmasGrupos || []) as ("sencillas" | "marciales" | "fuego")[],
            competenciasArmasLista: personajeActivo.competenciasArmasLista || [],
            competenciasArmadurasGrupos: (personajeActivo.competenciasArmadurasGrupos || []) as ("ligeras" | "medias" | "pesadas" | "escudos")[],
            competenciasArmadurasLista: personajeActivo.competenciasArmadurasLista || [],
            idiomasLista: personajeActivo.idiomasLista || [],
            herramientasLista: statsCalculadas?.competenciasEfectivas?.herramientasLista || personajeActivo.herramientasLista || []
          }}
          alGuardar={(nuevas) => {
            actualizarPersonaje(personajeActivo.id, nuevas);
            setModalCompetencias(null);
          }}
          alCerrar={() => setModalCompetencias(null)}
        />
      )}

      {/* Modal de Configuración Base Fallback */}
      {modalEdicionAbierto && (
        <ModalEditarPersonaje personaje={personajeActivo} alGuardar={(cambios) => actualizarPersonaje(personajeActivo.id, cambios)} alCerrar={() => setModalEdicionAbierto(false)} />
      )}

      {/* Modal Resumen de Descanso */}
      <ModalResumenDescanso idPersonaje={personajeActivo.id} abierto={modalDescanso.abierto} tipoDescanso={modalDescanso.tipo} acciones={modalDescanso.acciones} nombrePersonaje={personajeActivo.nombre} alCerrar={() => setModalDescanso((prev) => ({ ...prev, abierto: false }))} />
    </main>
  );
};

export default HojaPersonaje;
