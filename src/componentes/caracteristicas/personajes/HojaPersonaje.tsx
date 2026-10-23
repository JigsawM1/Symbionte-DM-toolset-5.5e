import React from "react";
import { CabeceraPersonaje } from "./CabeceraPersonaje";
import { BarraTacticaPersonaje } from "./BarraTacticaPersonaje";
import { MetricasRapidasPersonaje } from "./MetricasRapidasPersonaje";
import { PanelVitalidadPersonaje } from "./PanelVitalidadPersonaje";
import { PanelAtributosPersonaje } from "./PanelAtributosPersonaje";
import { PanelCompetenciasPersonaje } from "./PanelCompetenciasPersonaje";
import { SentidosPasivosPersonaje } from "./SentidosPasivosPersonaje";
import { PanelConjurosPersonaje } from "./PanelConjurosPersonaje";
import { ModalSelectorCompetencias } from "./ModalSelectorCompetencias";
import { ModalResumenDescanso } from "./ModalResumenDescanso";
import { BotonSubPestana } from "./BotonSubPestana";
import { usarHojaPersonaje } from "./usarHojaPersonaje";
import { Swords, Sparkles, PawPrint } from "lucide-react";
import { PanelFormaSalvaje } from "./PanelFormaSalvaje";
import estilos from "./HojaPersonaje.module.css";

interface HojaPersonajeProps {
  alAbrirConfiguracion: () => void;
}

export const HojaPersonaje: React.FC<HojaPersonajeProps> = ({ alAbrirConfiguracion }) => {
  const {
    personajeActivo,
    statsCalculadas,
    sistemaMagia,
    baseDatosHechizos,
    rondaActual,
    modoTirada,
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
    alGastarPuntos,
    alRecuperarPuntos,
    alGastarEspacioPacto,
    alRecuperarEspaciosPacto,
    alRomperConcentracion,
    alQuitarTruco,
    alQuitarConjuro,
    alAlternarPreparado,
    establecerFormasConocidasDruida,
    transformarEnFormaSalvaje,
    revertirFormaSalvaje
  } = usarHojaPersonaje();

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

  const esDruida = Boolean(
    personajeActivo.clase?.toLowerCase().includes("druida") ||
    personajeActivo.clases?.some((cls) => cls.nombre.toLowerCase().includes("druida")) ||
    personajeActivo.rasgos?.some((r) => r.nombre.toLowerCase().trim() === "forma salvaje")
  );

  return (
    <main className={estilos.contenedorPrincipal}>
      {/* 1. Cabecera e Identidad (Apartado A) */}
      <CabeceraPersonaje
        personaje={personajeActivo}
        alAbrirModalEdicion={alAbrirConfiguracion}
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

        <SentidosPasivosPersonaje pasivas={statsCalculadas.pasivas} />

      {/* 4. Barra de Sub-Pestañas Internas (General vs Conjuros) */}
      <div className={estilos.barraSubPestanas}>
        <BotonSubPestana
          activa={subPestanaActiva === "general"}
          etiqueta="COMBATE Y ATRIBUTOS"
          icono={<Swords size={14} color={subPestanaActiva === "general" ? "var(--pj-texto-cian)" : "var(--pj-texto-terciario)"} />}
          alClick={() => setSubPestanaActiva("general")}
        />

        <BotonSubPestana
          activa={subPestanaActiva === "conjuros"}
          etiqueta="CONJUROS Y MAGIA"
          icono={<Sparkles size={14} color={subPestanaActiva === "conjuros" ? "var(--pj-texto-acento)" : "var(--pj-texto-terciario)"} />}
          badge={totalConjurosYTrucos}
          alClick={() => setSubPestanaActiva("conjuros")}
        />

        {esDruida && (
          <BotonSubPestana
            activa={subPestanaActiva === "formaSalvaje"}
            etiqueta="FORMA SALVAJE"
            icono={<PawPrint size={14} color={subPestanaActiva === "formaSalvaje" ? "#22c55e" : "var(--pj-texto-terciario)"} />}
            badge={personajeActivo.formaSalvaje?.formaActivaId ? "Activa" : undefined}
            alClick={() => setSubPestanaActiva("formaSalvaje")}
          />
        )}
      </div>

      {/* 5. Contenido según Sub-pestaña Activa */}
      {subPestanaActiva === "general" && (
        <>
          {/* Vitalidad y Supervivencia (Apartado C) */}
          <PanelVitalidadPersonaje
            key={`vitalidad:${personajeActivo.id}`}
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

          {/* Atributos, salvaciones y habilidades agrupadas */}
          <PanelAtributosPersonaje
            key={`atributos:${personajeActivo.id}`}
            alTirarHabilidad={manejarTirarHabilidad}
            alCiclarGradoHabilidad={alCiclarGradoHabilidad}
            personaje={personajeActivo}
            statsCalculadas={statsCalculadas}
            alTirarCaracteristica={manejarTirarCaracteristica}
            alTirarSalvacion={manejarTirarSalvacion}
            alAlternarSalvacion={alAlternarSalvacion}
            alModificarCaracteristicaBase={alModificarCaracteristicaBase}
          />

          {/* Competencias de equipo, herramientas e idiomas */}
          <PanelCompetenciasPersonaje
            personaje={personajeActivo}
            statsCalculadas={statsCalculadas}
            alAbrirSelectorCompetencias={(categoria) => setModalCompetencias(categoria)}
          />
        </>
      )}

      {subPestanaActiva === "formaSalvaje" && esDruida && (
        <PanelFormaSalvaje
          personaje={personajeActivo}
          alTransformar={(idBestia) => transformarEnFormaSalvaje(personajeActivo.id, idBestia)}
          alRevertir={() => revertirFormaSalvaje(personajeActivo.id)}
          alGuardarFormasConocidas={(formas) => establecerFormasConocidasDruida(personajeActivo.id, formas)}
        />
      )}

      {subPestanaActiva === "conjuros" && (
        <PanelConjurosPersonaje
          personaje={personajeActivo}
          bonoCompetencia={statsCalculadas.bonoCompetencia}
          modificadores={statsCalculadas.modificadores}
          baseDatosHechizos={baseDatosHechizos}
          sistemaMagia={sistemaMagia}
          penalizacionArmadura={statsCalculadas.penalizacionArmadura}
          alAbrirConfiguracion={alAbrirConfiguracion}
          alGastarEspacio={alGastarEspacio}
          alRecuperarEspacio={alRecuperarEspacio}
          alGastarPuntos={alGastarPuntos}
          alRecuperarPuntos={alRecuperarPuntos}
          alGastarEspacioPacto={alGastarEspacioPacto}
          alRecuperarEspaciosPacto={alRecuperarEspaciosPacto}
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

      {/* Modal Resumen de Descanso */}
      <ModalResumenDescanso idPersonaje={personajeActivo.id} abierto={modalDescanso.abierto} tipoDescanso={modalDescanso.tipo} acciones={modalDescanso.acciones} nombrePersonaje={personajeActivo.nombre} alCerrar={() => setModalDescanso((prev) => ({ ...prev, abierto: false }))} />
    </main>
  );
};

export default HojaPersonaje;
