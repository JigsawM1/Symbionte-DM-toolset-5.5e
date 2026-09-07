import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  usarPersonajeActivo,
  usarAccionesPersonajes,
  calcularEstadisticasPersonaje
} from "@/almacen/selectores/usarEstadoPersonajes";
import {
  usarTipoTirada,
  usarSistemaMagia,
  usarPestanaActiva
} from "@/almacen/selectores/usarEstadoConfiguracion";
import { usarEstadoHomebrew } from "@/almacen/selectores/usarEstadoHomebrew";
import { usarAccionesIniciativa } from "@/almacen/selectores/usarEstadoIniciativa";
import { lanzarDadosTaleSpire, sanitizarEtiqueta, type MetadataIniciativa } from "@/utiles/lanzadorDados";
import { MAPA_HABILIDAD_A_CARACTERISTICA } from "@/constantes";
import { evaluarEfectosCondicionesEnTirada } from "@/servicios/procesadorCondiciones";
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
import { ModalResumenDescanso } from "./ModalResumenDescanso";
import type { AccionDescanso } from "@/servicios/procesadorDescansos";
import { BotonSubPestana } from "./BotonSubPestana";
import { usarEstadoPersistido } from "@/hooks";
import { Swords, Sparkles } from "lucide-react";
import estilos from "./HojaPersonaje.module.css";

type SubPestanaHoja = "general" | "conjuros";

interface HojaPersonajeProps {
  alAbrirConfiguracion?: () => void;
}

export const HojaPersonaje: React.FC<HojaPersonajeProps> = ({ alAbrirConfiguracion }) => {
  const personajeActivo = usarPersonajeActivo();
  const tipoTirada = usarTipoTirada();
  const sistemaMagia = usarSistemaMagia();
  const pestañaActiva = usarPestanaActiva();
  const { baseDatosHechizos } = usarEstadoHomebrew();
  const {
    actualizarPersonaje,
    modificarHPPersonaje,
    establecerHPActualPersonaje,
    modificarHPMaximoEfectivoPersonaje,
    modificarHPTemporalPersonaje,
    gastarDadoGolpePersonaje,
    establecerDadosGolpeRestantesPersonaje,
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
    alternarConjuroPreparado,
    desprepararConjuroPersonaje
  } = usarAccionesPersonajes();

  const { establecerTipoTirada } = usarAccionesIniciativa();

  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false);
  const [modalCompetencias, setModalCompetencias] = useState<CategoriaCompetencia | null>(null);
  const [modalDescanso, setModalDescanso] = useState<{
    abierto: boolean;
    tipo: "corto" | "largo";
    acciones: AccionDescanso[];
  }>({
    abierto: false,
    tipo: "corto",
    acciones: []
  });
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

  const manejarAbrirEdicion = useCallback(() => {
    if (alAbrirConfiguracion) {
      alAbrirConfiguracion();
    } else {
      setModalEdicionAbierto(true);
    }
  }, [alAbrirConfiguracion]);

  // 1. Calcular estadísticas derivadas memoizadas con O(1)
  const statsCalculadas = useMemo(
    () => (personajeActivo ? calcularEstadisticasPersonaje(personajeActivo) : null),
    [personajeActivo]
  );

  // 2. Mapeo reactivo del modo de tirada desde el estado global de Zustand
  const modoTirada: ModoTirada = useMemo(
    () => (tipoTirada === "ventaja" ? "vent" : tipoTirada === "desventaja" ? "disv" : "plano"),
    [tipoTirada]
  );

  const manejarCambioModoTirada = useCallback((modo: ModoTirada) => {
    const tipoGlobal = modo === "vent" ? "ventaja" : modo === "disv" ? "desventaja" : "plano";
    establecerTipoTirada(tipoGlobal);
  }, [establecerTipoTirada]);

  const manejarDescansoCorto = useCallback(() => {
    if (!personajeActivo) return;
    const res = ejecutarDescansoPersonaje(personajeActivo.id, "corto", 0);
    setModalDescanso({
      abierto: true,
      tipo: "corto",
      acciones: res?.acciones || []
    });
  }, [personajeActivo, ejecutarDescansoPersonaje]);

  const manejarDescansoLargo = useCallback(() => {
    if (!personajeActivo) return;
    const res = ejecutarDescansoPersonaje(personajeActivo.id, "largo");
    setModalDescanso({
      abierto: true,
      tipo: "largo",
      acciones: res?.acciones || []
    });
  }, [personajeActivo, ejecutarDescansoPersonaje]);

  // 3. Lanzadores de Dados 3D a TaleSpire (Homologados con el Combat Tracker del DM)
  const lanzarTiradaD20Personaje = useCallback(async (
    etiqueta: string,
    bono: number,
    metaIniciativa?: MetadataIniciativa,
    tipoTiradaCondicion?: "ventaja" | "desventaja" | "plano",
    sufijoMotivo?: string
  ) => {
    if (!personajeActivo) return;
    try {
      const nombrePj = personajeActivo.nombre?.trim() || "Personaje";
      const formulaDados = `!${sanitizarEtiqueta(etiqueta)}:1d20${bono >= 0 ? "+" : ""}${bono}`;
      
      const tieneVentManual = tipoTirada === "ventaja";
      const tieneDisvManual = tipoTirada === "desventaja";
      const tieneVentCond = tipoTiradaCondicion === "ventaja";
      const tieneDisvCond = tipoTiradaCondicion === "desventaja";
      
      const seAnulan = (tieneVentManual && tieneDisvCond) || (tieneDisvManual && tieneVentCond);

      let sufijoLog = "";
      if (seAnulan) {
        sufijoLog = " (Ventaja y Desventaja se anulan -> Tirada Plana)";
      } else if (sufijoMotivo && tipoTirada === "plano") {
        sufijoLog = ` (${sufijoMotivo})`;
      }

      const etiquetaLog = `${nombrePj} - ${etiqueta}${sufijoLog}`;
      
      await lanzarDadosTaleSpire(
        formulaDados,
        etiquetaLog,
        metaIniciativa,
        undefined,
        tipoTiradaCondicion
      );
    } catch (err) {
      console.error("[HojaPersonaje] Error al enviar tirada 3D:", err);
    }
  }, [personajeActivo, tipoTirada]);

  const penalizacionSinComp = !!statsCalculadas?.penalizacionArmadura?.sinCompetencia;
  const desventajaSigiloArmadura = !!statsCalculadas?.desventajaSigiloArmadura;

  const manejarTirarCaracteristica = useCallback((carac: Caracteristica, etiqueta: string, bono: number) => {
    if (!personajeActivo) return;
    const evaluacion = evaluarEfectosCondicionesEnTirada({
      tipo: "caracteristica",
      caracteristica: carac,
      penalizacionArmadura: penalizacionSinComp,
      desventajaSigiloArmadura,
      condicionesActivas: personajeActivo.condicionesActivas,
      personaje: personajeActivo
    });
    const bonoFinal = bono + evaluacion.penalizadorD20;
    const motivos = [...evaluacion.motivosDesventaja, ...evaluacion.motivosVentaja, ...evaluacion.motivosModificadores].join(", ");
    lanzarTiradaD20Personaje(
      `Prueba de ${etiqueta}`,
      bonoFinal,
      undefined,
      evaluacion.modoEfectivo !== "plano" ? evaluacion.modoEfectivo : undefined,
      motivos
    );
  }, [personajeActivo, penalizacionSinComp, desventajaSigiloArmadura, lanzarTiradaD20Personaje]);

  const manejarTirarSalvacion = useCallback((carac: Caracteristica, etiqueta: string, bono: number) => {
    if (!personajeActivo) return;
    const etiquetaLimpia = etiqueta.replace(/^Salvaci[oó]n(\s+de)?\s+/i, "");
    const evaluacion = evaluarEfectosCondicionesEnTirada({
      tipo: "salvacion",
      caracteristica: carac,
      penalizacionArmadura: penalizacionSinComp,
      desventajaSigiloArmadura,
      condicionesActivas: personajeActivo.condicionesActivas,
      personaje: personajeActivo
    });
    const bonoFinal = bono + evaluacion.penalizadorD20;
    const motivos = [...evaluacion.motivosDesventaja, ...evaluacion.motivosVentaja, ...evaluacion.motivosModificadores].join(", ");
    lanzarTiradaD20Personaje(
      `Salvación de ${etiquetaLimpia}`,
      bonoFinal,
      undefined,
      evaluacion.modoEfectivo !== "plano" ? evaluacion.modoEfectivo : undefined,
      motivos
    );
  }, [personajeActivo, penalizacionSinComp, desventajaSigiloArmadura, lanzarTiradaD20Personaje]);

  const manejarTirarHabilidad = useCallback((hab: Habilidad, nombre: string, bono: number) => {
    if (!personajeActivo) return;
    const caracAsociada = MAPA_HABILIDAD_A_CARACTERISTICA[hab];
    const evaluacion = evaluarEfectosCondicionesEnTirada({
      tipo: "caracteristica",
      caracteristica: caracAsociada,
      habilidad: hab,
      penalizacionArmadura: penalizacionSinComp,
      desventajaSigiloArmadura,
      condicionesActivas: personajeActivo.condicionesActivas,
      personaje: personajeActivo
    });
    const bonoFinal = bono + evaluacion.penalizadorD20;
    const motivos = [...evaluacion.motivosDesventaja, ...evaluacion.motivosVentaja, ...evaluacion.motivosModificadores].join(", ");
    lanzarTiradaD20Personaje(
      `Prueba de ${nombre}`,
      bonoFinal,
      undefined,
      evaluacion.modoEfectivo !== "plano" ? evaluacion.modoEfectivo : undefined,
      motivos
    );
  }, [personajeActivo, penalizacionSinComp, desventajaSigiloArmadura, lanzarTiradaD20Personaje]);

  const manejarTirarIniciativa = useCallback(() => {
    if (!personajeActivo || !statsCalculadas) return;
    const evaluacion = evaluarEfectosCondicionesEnTirada({
      tipo: "iniciativa",
      caracteristica: "destreza",
      penalizacionArmadura: penalizacionSinComp,
      desventajaSigiloArmadura,
      condicionesActivas: personajeActivo.condicionesActivas,
      personaje: personajeActivo
    });
    const bonoBase = statsCalculadas.modificadores.destreza + (personajeActivo.iniciativaBono || 0);
    const bonoFinal = bonoBase + evaluacion.penalizadorD20;
    const metaInic: MetadataIniciativa = {
      tipo: "iniciativa",
      criaturaId: personajeActivo.idMiniaturaTS || personajeActivo.id,
      nombrePersonaje: personajeActivo.nombre,
      idMiniaturaTS: personajeActivo.idMiniaturaTS,
      idPersonaje: personajeActivo.id
    };
    lanzarTiradaD20Personaje(
      "Iniciativa",
      bonoFinal,
      metaInic,
      evaluacion.modoEfectivo !== "plano" ? evaluacion.modoEfectivo : undefined
    );
  }, [personajeActivo, statsCalculadas, penalizacionSinComp, desventajaSigiloArmadura, lanzarTiradaD20Personaje]);

  const manejarTirarSalvacionMuerte3D = useCallback(async () => {
    if (!personajeActivo) return;
    const nombrePj = personajeActivo.nombre?.trim() || "Personaje";
    await lanzarDadosTaleSpire("!Salvacion Muerte:1d20", `${nombrePj} - Salvación Muerte`, undefined, {
      tipo: "salvacionMuerte",
      personajeId: personajeActivo.id
    });
  }, [personajeActivo]);

  const totalConjurosYTrucos =
    (personajeActivo?.trucosConocidosIds?.length || 0) +
    (personajeActivo?.conjurosConocidosIds?.length || 0);

  if (!personajeActivo || !statsCalculadas) {
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
        penalizacionArmadura={statsCalculadas.penalizacionArmadura}
        desventajaSigiloArmadura={statsCalculadas.desventajaSigiloArmadura}
        concentracionActiva={personajeActivo.concentracionActiva}
        alCambiarModoTirada={manejarCambioModoTirada}
        alEjecutarDescansoCorto={manejarDescansoCorto}
        alEjecutarDescansoLargo={manejarDescansoLargo}
        alAplicarCondicion={(cond) => aplicarCondicionPersonaje(personajeActivo.id, cond)}
        alQuitarCondicion={(cond) => quitarCondicionPersonaje(personajeActivo.id, cond)}
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
            alEstablecerDadosGolpeRestantes={(val) => establecerDadosGolpeRestantesPersonaje(personajeActivo.id, val)}
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
          alQuitarConjuro={(hId) => desprepararConjuroPersonaje(personajeActivo.id, hId)}
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

      {/* Modal Resumen de Descanso */}
      <ModalResumenDescanso
        abierto={modalDescanso.abierto}
        tipoDescanso={modalDescanso.tipo}
        acciones={modalDescanso.acciones}
        nombrePersonaje={personajeActivo.nombre}
        alCerrar={() => setModalDescanso((prev) => ({ ...prev, abierto: false }))}
      />
    </main>
  );
};

export default HojaPersonaje;
