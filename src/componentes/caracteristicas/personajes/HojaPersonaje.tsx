import React, { useState } from "react";
import {
  usarEstadoPersonajes,
  usarAccionesPersonajes,
  calcularEstadisticasPersonaje
} from "@/almacen/selectores/usarEstadoPersonajes";
import { usarEstadoConfiguracion } from "@/almacen/selectores/usarEstadoConfiguracion";
import { usarAccionesIniciativa } from "@/almacen/selectores/usarEstadoIniciativa";
import { lanzarDadosTaleSpire, sanitizarEtiqueta } from "@/utiles/lanzadorDados";
import type { Caracteristica, Habilidad } from "@/tipos";

import { CabeceraPersonaje } from "./CabeceraPersonaje";
import { BarraTacticaPersonaje, ModoTirada } from "./BarraTacticaPersonaje";
import { MetricasRapidasPersonaje } from "./MetricasRapidasPersonaje";
import { PanelVitalidadPersonaje } from "./PanelVitalidadPersonaje";
import { PanelAtributosPersonaje } from "./PanelAtributosPersonaje";
import { PanelHabilidadesPersonaje } from "./PanelHabilidadesPersonaje";
import { ModalEditarPersonaje } from "./ModalEditarPersonaje";

import estilos from "./HojaPersonaje.module.css";

export const HojaPersonaje: React.FC = () => {
  const { personajeActivo } = usarEstadoPersonajes();
  const { tipoTirada } = usarEstadoConfiguracion();
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
    vincularMiniaturaTSPersonaje
  } = usarAccionesPersonajes();

  const { establecerTipoTirada } = usarAccionesIniciativa();

  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false);

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
  const lanzarTiradaD20Personaje = async (etiqueta: string, bono: number) => {
    try {
      const nombrePj = personajeActivo.nombre?.trim() || "Personaje";
      const formulaDados = `!${sanitizarEtiqueta(etiqueta)}:1d20${bono >= 0 ? "+" : ""}${bono}`;
      const etiquetaLog = `${nombrePj} - ${etiqueta}`;
      await lanzarDadosTaleSpire(formulaDados, etiquetaLog);
    } catch (err) {
      console.error("[HojaPersonaje] Error al enviar tirada 3D:", err);
    }
  };

  const manejarTirarCaracteristica = (_carac: Caracteristica, etiqueta: string, bono: number) => {
    lanzarTiradaD20Personaje(`Prueba de ${etiqueta}`, bono);
  };

  const manejarTirarSalvacion = (_carac: Caracteristica, etiqueta: string, bono: number) => {
    const etiquetaLimpia = etiqueta.replace(/^Salvaci[oó]n(\s+de)?\s+/i, "");
    lanzarTiradaD20Personaje(`Salvación de ${etiquetaLimpia}`, bono);
  };

  const manejarTirarHabilidad = (_hab: Habilidad, nombre: string, bono: number) => {
    lanzarTiradaD20Personaje(`Prueba de ${nombre}`, bono);
  };

  const manejarTirarIniciativa = () => {
    const bonoInic = statsCalculadas.modificadores.destreza + (personajeActivo.iniciativaBono || 0);
    lanzarTiradaD20Personaje("Iniciativa", bonoInic);
  };

  const manejarTirarSalvacionMuerte3D = async () => {
    // Enviamos el dado 3D a la bandeja de TaleSpire y esperamos a que caiga físicamente
    const nombrePj = personajeActivo.nombre?.trim() || "Personaje";
    await lanzarDadosTaleSpire("!Salvacion Muerte:1d20", `${nombrePj} - Salvación Muerte`, undefined, {
      tipo: "salvacionMuerte",
      personajeId: personajeActivo.id
    });
  };

  return (
    <main className={estilos.contenedorPrincipal}>
      {/* 1. Cabecera e Identidad (Apartado A) */}
      <CabeceraPersonaje
        personaje={personajeActivo}
        alAbrirModalEdicion={() => setModalEdicionAbierto(true)}
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
        alTirarIniciativa={manejarTirarIniciativa}
        alAlternarInspiracion={() => alternarInspiracionPersonaje(personajeActivo.id)}
      />

      {/* 4. Vitalidad y Supervivencia (Apartado C) */}
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

      {/* 5. Características y Sentidos Pasivos (Apartado B) */}
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

      {/* 6. Habilidades y Competencias (Apartado B) */}
      <PanelHabilidadesPersonaje
        personaje={personajeActivo}
        statsCalculadas={statsCalculadas}
        alTirarHabilidad={manejarTirarHabilidad}
        alCiclarGradoHabilidad={(hab) => ciclarGradoHabilidadPersonaje(personajeActivo.id, hab)}
      />

      {/* Modal de Configuración Base */}
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
