import React, { useState, useEffect } from "react";
import {
  usarEstadoPersonajes,
  usarAccionesPersonajes,
  calcularEstadisticasPersonaje
} from "@/almacen/selectores/usarEstadoPersonajes";
import { usarEstadoConfiguracion } from "@/almacen/selectores/usarEstadoConfiguracion";
import { usarEstadoHomebrew } from "@/almacen/selectores/usarEstadoHomebrew";
import { usarAccionesIniciativa } from "@/almacen/selectores/usarEstadoIniciativa";
import { lanzarDadosTaleSpire, sanitizarEtiqueta, type MetadataIniciativa } from "@/utiles/lanzadorDados";
import { MAPA_HABILIDAD_A_CARACTERISTICA } from "@/constantes";
import type { Caracteristica, Habilidad } from "@/tipos";

import { CabeceraPersonaje } from "./CabeceraPersonaje";
import { BarraTacticaPersonaje, ModoTirada } from "./BarraTacticaPersonaje";
import { MetricasRapidasPersonaje } from "./MetricasRapidasPersonaje";
import { PanelVitalidadPersonaje } from "./PanelVitalidadPersonaje";
import { PanelAtributosPersonaje } from "./PanelAtributosPersonaje";
import { PanelHabilidadesPersonaje } from "./PanelHabilidadesPersonaje";
import { PanelConjurosPersonaje } from "./PanelConjurosPersonaje";
import { ModalEditarPersonaje } from "./ModalEditarPersonaje";
import { ModalSelectorCompetencias, type CategoriaCompetencia } from "./ModalSelectorCompetencias";
import { BotonSubPestana } from "./BotonSubPestana";
import { usarEstadoPersistido } from "@/hooks";
import { Swords, Sparkles } from "lucide-react";
import estilos from "./HojaPersonaje.module.css";

type SubPestanaHoja = "general" | "conjuros";

interface HojaPersonajeProps {
  alAbrirConfiguracion?: () => void;
}

export const HojaPersonaje: React.FC<HojaPersonajeProps> = ({ alAbrirConfiguracion }) => {
  const { personajeActivo } = usarEstadoPersonajes();
  const { tipoTirada, sistemaMagia, pestañaActiva } = usarEstadoConfiguracion();
  const { baseDatosHechizos } = usarEstadoHomebrew();
  const {
    actualizarPersonaje,
    modificarHPPersonaje,
    establecerHPActualPersonaje,
    modificarHPMaximoEfectivoPersonaje,
    modificarHPTemporalPersonaje,
    gastarDadoGolpePersonaje,
    ejecutarDescansoPersonaje,
    alternarInspiracionPersonaje,
    establecerSalvacionesMuertePersonaje,
    reiniciarSalvacionesMuertePersonaje,
    modificarCansancioPersonaje,
    modificarCaracteristicaBasePersonaje,
    alternarSalvacionPersonaje,
    ciclarGradoHabilidadPersonaje,
    aplicarCondicionPersonaje,
    quitarCondicionPersonaje,
    vincularMiniaturaTSPersonaje,

    // Acciones de magia
    gastarEspacioConjuro,
    recuperarEspacioConjuro,
    recuperarTodosEspaciosConjuro,
    gastarPuntosConjuro,
    recuperarPuntosConjuro,
    recuperarTodosPuntosConjuro,
    gastarEspacioPacto,
    recuperarEspaciosPacto,
    establecerConcentracion,
    romperConcentracion,
    quitarTrucoConocido,
    quitarConjuroConocido,
    alternarConjuroPreparado
  } = usarAccionesPersonajes();

  const { establecerTipoTirada } = usarAccionesIniciativa();

  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false);
  const [modalCompetencias, setModalCompetencias] = useState<CategoriaCompetencia | null>(null);
  const [subPestanaActiva, setSubPestanaActiva] = usarEstadoPersistido<SubPestanaHoja>(
    "ts_hoja_subpestana",
    "general"
  );

  // Sincronización explícita si se pulsa la pestaña dedicada "conjuros"
  useEffect(() => {
    if (pestañaActiva === "conjuros") {
      setSubPestanaActiva("conjuros");
    }
  }, [pestañaActiva, setSubPestanaActiva]);

  const manejarAbrirEdicion = () => {
    if (alAbrirConfiguracion) {
      alAbrirConfiguracion();
    } else {
      setModalEdicionAbierto(true);
    }
  };

  if (!personajeActivo) {
    return (
      <div className={estilos.contenedorPrincipal}>
        <div className={`${estilos.neoRaised}`} style={{ padding: 24, textAlign: "center" }}>
          <p style={{ color: "#94a3b8", margin: 0 }}>
            No hay ningún personaje activo seleccionado. Ve a la pestaña "Mis Personajes" para crear o activar uno.
          </p>
        </div>
      </div>
    );
  }

  // 1. Calcular estadísticas derivadas y modificadores
  const statsCalculadas = calcularEstadisticasPersonaje(personajeActivo);

  // 2. Mapeo reactivo del modo de tirada desde el estado global de Zustand (Single Source of Truth)
  const modoTirada: ModoTirada =
    tipoTirada === "ventaja" ? "vent" : tipoTirada === "desventaja" ? "disv" : "plano";

  const manejarCambioModoTirada = (modo: ModoTirada) => {
    const tipoGlobal = modo === "vent" ? "ventaja" : modo === "disv" ? "desventaja" : "plano";
    establecerTipoTirada(tipoGlobal);
  };

  // 3. Lanzadores de Dados 3D a TaleSpire (Homologados con el Combat Tracker del DM)
  const lanzarTiradaD20Personaje = async (
    etiqueta: string,
    bono: number,
    metaIniciativa?: MetadataIniciativa,
    forzarDesventaja?: boolean
  ) => {
    try {
      const nombrePj = personajeActivo.nombre?.trim() || "Personaje";
      const formulaDados = `!${sanitizarEtiqueta(etiqueta)}:1d20${bono >= 0 ? "+" : ""}${bono}`;
      const sufijoLog = forzarDesventaja && modoTirada === "plano" ? " (Desventaja por Armadura)" : "";
      const etiquetaLog = `${nombrePj} - ${etiqueta}${sufijoLog}`;
      
      await lanzarDadosTaleSpire(
        formulaDados,
        etiquetaLog,
        metaIniciativa,
        undefined,
        forzarDesventaja ? "desventaja" : undefined
      );
    } catch (err) {
      console.error("[HojaPersonaje] Error al enviar tirada 3D:", err);
    }
  };

  const penalizacionSinComp = !!statsCalculadas.penalizacionArmadura?.sinCompetencia;

  const manejarTirarCaracteristica = (carac: Caracteristica, etiqueta: string, bono: number) => {
    const desventajaArmadura = penalizacionSinComp && (carac === "fuerza" || carac === "destreza");
    lanzarTiradaD20Personaje(`Prueba de ${etiqueta}`, bono, undefined, desventajaArmadura);
  };

  const manejarTirarSalvacion = (carac: Caracteristica, etiqueta: string, bono: number) => {
    const etiquetaLimpia = etiqueta.replace(/^Salvaci[oó]n(\s+de)?\s+/i, "");
    const desventajaArmadura = penalizacionSinComp && (carac === "fuerza" || carac === "destreza");
    lanzarTiradaD20Personaje(`Salvación de ${etiquetaLimpia}`, bono, undefined, desventajaArmadura);
  };

  const manejarTirarHabilidad = (hab: Habilidad, nombre: string, bono: number) => {
    const caracAsociada = MAPA_HABILIDAD_A_CARACTERISTICA[hab];
    const desventajaArmadura = penalizacionSinComp && (caracAsociada === "fuerza" || caracAsociada === "destreza");
    const desventajaSigilo = hab === "sigilo" && !!statsCalculadas.desventajaSigiloArmadura;
    lanzarTiradaD20Personaje(`Prueba de ${nombre}`, bono, undefined, desventajaArmadura || desventajaSigilo);
  };

  const manejarTirarIniciativa = () => {
    const bonoInic = statsCalculadas.modificadores.destreza + (personajeActivo.iniciativaBono || 0);
    const metaInic: MetadataIniciativa = {
      tipo: "iniciativa",
      criaturaId: personajeActivo.idMiniaturaTS || personajeActivo.id,
      nombrePersonaje: personajeActivo.nombre,
      idMiniaturaTS: personajeActivo.idMiniaturaTS,
      idPersonaje: personajeActivo.id
    };
    lanzarTiradaD20Personaje("Iniciativa", bonoInic, metaInic);
  };

  const manejarTirarSalvacionMuerte3D = async () => {
    const nombrePj = personajeActivo.nombre?.trim() || "Personaje";
    await lanzarDadosTaleSpire("!Salvacion Muerte:1d20", `${nombrePj} - Salvación Muerte`, undefined, {
      tipo: "salvacionMuerte",
      personajeId: personajeActivo.id
    });
  };

  const totalConjurosYTrucos =
    (personajeActivo.trucosConocidosIds?.length || 0) +
    (personajeActivo.conjurosConocidosIds?.length || 0);

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
        hpActual={personajeActivo.hpActual}
        hpMaximo={personajeActivo.hpMaximo || personajeActivo.hpMaximoBase || 10}
        alCambiarModoTirada={manejarCambioModoTirada}
        alEjecutarDescansoCorto={() => ejecutarDescansoPersonaje(personajeActivo.id, "corto", 1)}
        alEjecutarDescansoLargo={() => ejecutarDescansoPersonaje(personajeActivo.id, "largo")}
        alAplicarCondicion={(cond) => aplicarCondicionPersonaje(personajeActivo.id, cond)}
        alQuitarCondicion={(cond) => quitarCondicionPersonaje(personajeActivo.id, cond)}
      />

      {/* 3. Métricas Rápidas: CA, Iniciativa, Velocidad, PB, Inspiración */}
      <MetricasRapidasPersonaje
        personaje={personajeActivo}
        bonoCompetencia={statsCalculadas.bonoCompetencia}
        modDestreza={statsCalculadas.modificadores.destreza}
        claseArmadura={statsCalculadas.claseArmadura}
        penalizacionArmadura={statsCalculadas.penalizacionArmadura}
        alTirarIniciativa={manejarTirarIniciativa}
        alAlternarInspiracion={() => alternarInspiracionPersonaje(personajeActivo.id)}
      />

      {/* 4. Barra de Sub-Pestañas Internas (General vs Conjuros) */}
      <div className={estilos.barraSubPestanas}>
        <BotonSubPestana
          activa={subPestanaActiva === "general"}
          etiqueta="Combate y Atributos"
          icono={<Swords size={14} color={subPestanaActiva === "general" ? "#60a5fa" : "#64748b"} />}
          alClick={() => setSubPestanaActiva("general")}
        />

        <BotonSubPestana
          activa={subPestanaActiva === "conjuros"}
          etiqueta="Conjuros y Magia"
          icono={<Sparkles size={14} color={subPestanaActiva === "conjuros" ? "#818cf8" : "#64748b"} />}
          badge={totalConjurosYTrucos}
          alClick={() => setSubPestanaActiva("conjuros")}
        />
      </div>

      {/* 5. Contenido según Sub-pestaña Activa */}
      {subPestanaActiva === "general" ? (
        <>
          {/* Vitalidad y Supervivencia (Apartado C) */}
          <PanelVitalidadPersonaje
            personaje={personajeActivo}
            alModificarHP={(delta) => modificarHPPersonaje(personajeActivo.id, delta)}
            alEstablecerHPActual={(valor) => establecerHPActualPersonaje(personajeActivo.id, valor)}
            alModificarHPMaximoEfectivo={(valor) => modificarHPMaximoEfectivoPersonaje(personajeActivo.id, valor)}
            alModificarHPTemporal={(valor) => modificarHPTemporalPersonaje(personajeActivo.id, valor)}
            alGastarDadoGolpe={() => gastarDadoGolpePersonaje(personajeActivo.id)}
            alEstablecerSalvacionMuerte={(tipo, valor) =>
              establecerSalvacionesMuertePersonaje(personajeActivo.id, tipo, valor)
            }
            alReiniciarSalvacionesMuerte={() => reiniciarSalvacionesMuertePersonaje(personajeActivo.id)}
            alModificarCansancio={(delta) => modificarCansancioPersonaje(personajeActivo.id, delta)}
            alTirarSalvacionMuerte3D={manejarTirarSalvacionMuerte3D}
          />

          {/* Características y Sentidos Pasivos (Apartado B) */}
          <PanelAtributosPersonaje
            personaje={personajeActivo}
            statsCalculadas={statsCalculadas}
            alTirarCaracteristica={manejarTirarCaracteristica}
            alTirarSalvacion={manejarTirarSalvacion}
            alAlternarSalvacion={(carac) => alternarSalvacionPersonaje(personajeActivo.id, carac)}
            alModificarCaracteristicaBase={(carac, valor) =>
              modificarCaracteristicaBasePersonaje(personajeActivo.id, carac, valor)
            }
          />

          {/* Habilidades y Competencias (Apartado B) */}
          <PanelHabilidadesPersonaje
            personaje={personajeActivo}
            statsCalculadas={statsCalculadas}
            alTirarHabilidad={manejarTirarHabilidad}
            alCiclarGradoHabilidad={(hab) => ciclarGradoHabilidadPersonaje(personajeActivo.id, hab)}
            alAbrirSelectorCompetencias={(categoria) => setModalCompetencias(categoria)}
          />
        </>
      ) : (
        <PanelConjurosPersonaje
          personaje={personajeActivo}
          bonoCompetencia={statsCalculadas.bonoCompetencia}
          modificadores={statsCalculadas.modificadores}
          baseDatosHechizos={baseDatosHechizos}
          sistemaMagia={sistemaMagia}
          penalizacionArmadura={statsCalculadas.penalizacionArmadura}
          alAbrirConfiguracion={manejarAbrirEdicion}
          alGastarEspacio={(niv) => gastarEspacioConjuro(personajeActivo.id, niv)}
          alRecuperarEspacio={(niv) => recuperarEspacioConjuro(personajeActivo.id, niv)}
          alRecuperarTodosEspacios={() => recuperarTodosEspaciosConjuro(personajeActivo.id)}
          alGastarPuntos={(cant) => gastarPuntosConjuro(personajeActivo.id, cant)}
          alRecuperarPuntos={(cant) => recuperarPuntosConjuro(personajeActivo.id, cant)}
          alRecuperarTodosPuntos={() => recuperarTodosPuntosConjuro(personajeActivo.id)}
          alGastarEspacioPacto={() => gastarEspacioPacto(personajeActivo.id)}
          alRecuperarEspaciosPacto={() => recuperarEspaciosPacto(personajeActivo.id)}
          alEstablecerConcentracion={(hId, nom) => establecerConcentracion(personajeActivo.id, hId, nom)}
          alRomperConcentracion={() => romperConcentracion(personajeActivo.id)}
          alQuitarTruco={(hId) => quitarTrucoConocido(personajeActivo.id, hId)}
          alQuitarConjuro={(hId) => quitarConjuroConocido(personajeActivo.id, hId)}
          alAlternarPreparado={(hId) => alternarConjuroPreparado(personajeActivo.id, hId)}
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
            herramientasLista: personajeActivo.herramientasLista || []
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
        <ModalEditarPersonaje
          personaje={personajeActivo}
          alGuardar={(cambios) => actualizarPersonaje(personajeActivo.id, cambios)}
          alCerrar={() => setModalEdicionAbierto(false)}
        />
      )}
    </main>
  );
};

export default HojaPersonaje;
