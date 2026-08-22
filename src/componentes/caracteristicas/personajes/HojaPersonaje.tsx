import React, { useState } from "react";
import {
  usarEstadoPersonajes,
  usarAccionesPersonajes,
  calcularEstadisticasPersonaje
} from "@/almacen/selectores/usarEstadoPersonajes";
import { usarAccionesIniciativa } from "@/almacen/selectores/usarEstadoIniciativa";
import { lanzarDadosTaleSpire } from "@/utiles/lanzadorDados";
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

  const [modoTirada, setModoTirada] = useState<ModoTirada>("plano");
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

  // 2. Manejador para cambiar el modo de tirada y sincronizarlo con el lanzador de dados
  const manejarCambioModoTirada = (modo: ModoTirada) => {
    setModoTirada(modo);
    const tipoGlobal = modo === "vent" ? "ventaja" : modo === "disv" ? "desventaja" : "plano";
    establecerTipoTirada(tipoGlobal);
  };

  // 3. Lanzadores de Dados 3D a TaleSpire
  const ejecutarTirada3D = async (etiqueta: string, bono: number) => {
    try {
      const signo = bono >= 0 ? "+" : "";
      const formula = bono !== 0 ? `1d20${signo}${bono}` : "1d20";
      await lanzarDadosTaleSpire(formula, etiqueta);
    } catch (err) {
      console.error("[HojaPersonaje] Error al enviar tirada 3D:", err);
    }
  };

  const manejarTirarCaracteristica = (_carac: Caracteristica, etiqueta: string, bono: number) => {
    ejecutarTirada3D(`Prueba ${etiqueta}`, bono);
  };

  const manejarTirarSalvacion = (_carac: Caracteristica, etiqueta: string, bono: number) => {
    ejecutarTirada3D(etiqueta, bono);
  };

  const manejarTirarHabilidad = (_hab: Habilidad, nombre: string, bono: number) => {
    ejecutarTirada3D(`Prueba ${nombre}`, bono);
  };

  const manejarTirarIniciativa = () => {
    const bonoInic = statsCalculadas.modificadores.destreza + (personajeActivo.iniciativaBono || 0);
    ejecutarTirada3D("Iniciativa", bonoInic);
  };

  const manejarTirarSalvacionMuerte3D = async () => {
    // Enviamos el dado 3D a la bandeja de TaleSpire y esperamos a que caiga físicamente
    await lanzarDadosTaleSpire("1d20", "Salvación Muerte", undefined, {
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
