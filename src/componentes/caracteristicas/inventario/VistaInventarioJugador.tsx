import React, { useMemo, useCallback } from "react";
import { Backpack, User } from "lucide-react";
import type { PersonajeJugador, ObjetoJuego, ObjetoInventario } from "@/tipos";
import {
  usarEstadoPersonajes,
  usarAccionesPersonajes,
  calcularEstadisticasPersonaje
} from "@/almacen/selectores/usarEstadoPersonajes";
import { usarEstadoHomebrew } from "@/almacen/selectores/usarEstadoHomebrew";
import { usarAccionesConfiguracion } from "@/almacen/selectores/usarEstadoConfiguracion";
import { OBJETOS_INICIALES } from "@/utiles/datosIniciales";
import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import { PanelInventarioPersonaje } from "@/componentes/caracteristicas/personajes/PanelInventarioPersonaje";
import { detectarInfoConsumible, evaluarFormulaDados } from "@/servicios/procesadorConsumibles";
import { lanzarDadosTaleSpire, sanitizarEtiqueta } from "@/utiles/lanzadorDados";
import { desduplicarEntidades } from "@/utiles/busquedaTolerante";
import estilos from "./VistaInventarioJugador.module.css";

export const VistaInventarioJugador: React.FC = () => {
  const { personajes, idPersonajeActivo } = usarEstadoPersonajes();
  const { objetosHomebrew } = usarEstadoHomebrew();
  const { agregarNotificacion } = usarAccionesConfiguracion();
  const {
    seleccionarPersonajeActivo,
    agregarObjetoInventario,
    quitarObjetoInventario,
    modificarCantidadObjeto,
    alternarEquipadoObjeto,
    alternarSintonizadoObjeto,
    actualizarNotasObjeto,
    actualizarObjetoInventario,
    modificarCargasObjeto,
    cambiarContenedorObjeto,
    desempaquetarPaquete,
    establecerMonedas,
    modificarMoneda,
    aplicarCuracionPersonaje
  } = usarAccionesPersonajes();

  // Base de datos completa sin duplicados (Compendio Oficial + Objetos Homebrew)
  const baseDatosObjetos = useMemo<ObjetoJuego[]>(() => {
    return desduplicarEntidades(OBJETOS_INICIALES, objetosHomebrew);
  }, [objetosHomebrew]);

  // Obtener personaje activo o fallback al primero
  const personajeActivo = useMemo<PersonajeJugador | null>(() => {
    return (
      personajes.find((p: PersonajeJugador) => p.id === idPersonajeActivo) ||
      personajes[0] ||
      null
    );
  }, [personajes, idPersonajeActivo]);

  const statsCalculadas = useMemo(() => {
    if (!personajeActivo) return null;
    return calcularEstadisticasPersonaje(personajeActivo);
  }, [personajeActivo]);

  // Acción Rápida "Usar" Consumible / Poción (D&D 5.5e)
  const manejarUsarConsumible = useCallback(async (objeto: ObjetoInventario) => {
    if (!personajeActivo) return;
    const info = detectarInfoConsumible(objeto.nombre, objeto.notas);

    // 1. Reducir 1 unidad del inventario
    modificarCantidadObjeto(personajeActivo.id, objeto.idInstancia, -1);

    // 2. Si es curativo, calcular tirada de sanación, tirar en TaleSpire y curar al personaje
    if (info.esCurativo && info.formulaCuracion) {
      const puntosCurados = evaluarFormulaDados(info.formulaCuracion);
      aplicarCuracionPersonaje(personajeActivo.id, puntosCurados);

      const etiquetaTaleSpire = `!Curación ${sanitizarEtiqueta(objeto.nombre)}:${info.formulaCuracion}`;
      const log = `${personajeActivo.nombre} usa ${objeto.nombre} y recupera ${puntosCurados} Puntos de Golpe`;
      try {
        await lanzarDadosTaleSpire(etiquetaTaleSpire, log);
      } catch (err) {
        console.error("[VistaInventarioJugador] Error al tirar curación a TaleSpire:", err);
      }

      agregarNotificacion(
        `¡${objeto.nombre} consumida! Has recuperado +${puntosCurados} PV.`,
        "exito"
      );
    } else {
      // Consumible no curativo (consumo de recurso / aplicación de efecto)
      agregarNotificacion(`Has consumido 1× "${objeto.nombre}".`, "info");
    }
  }, [personajeActivo, modificarCantidadObjeto, aplicarCuracionPersonaje, agregarNotificacion]);

  if (!personajeActivo || !statsCalculadas) {
    return (
      <div className={estilos.contenedorGeneral}>
        <div className={estilos.tarjetaVacia}>
          No hay personaje seleccionado. Selecciona o crea uno en la pestaña de Características.
        </div>
      </div>
    );
  }

  return (
    <div className={estilos.contenedorGeneral}>
      {/* Cabecera del Panel con selector de personaje */}
      <div className={estilos.cabeceraInventario}>
        <div className={estilos.filaTitulo}>
          <div className={estilos.grupoTitulo}>
            <Backpack size={18} color="#f59e0b" />
            <h2 className={estilos.tituloTexto}>Inventario de Aventuras</h2>
            <span className={estilos.contadorBadge}>
              {personajeActivo.inventario?.length || 0}
            </span>
          </div>

          {/* Selector de personaje si hay más de 1 */}
          {personajes.length > 1 && (
            <div className={estilos.selectorPersonaje}>
              <User size={13} color="#94a3b8" />
              <SelectorDesplegable<string>
                valor={personajeActivo.id}
                alCambiar={(id) => seleccionarPersonajeActivo(id)}
                tamano="compacto"
                opciones={personajes.map((p: PersonajeJugador) => ({
                  valor: p.id,
                  etiqueta: `${p.nombre} (${p.clase || "PJ"})`
                }))}
              />
            </div>
          )}
        </div>
      </div>

      {/* Panel táctico de Inventario con sus 6 secciones */}
      <PanelInventarioPersonaje
        personaje={personajeActivo}
        statsCalculadas={statsCalculadas}
        baseDatosObjetos={baseDatosObjetos}
        alAgregarObjeto={(obj) => {
          if (Array.isArray(obj)) {
            obj.forEach((item) => agregarObjetoInventario(personajeActivo.id, item));
          } else {
            agregarObjetoInventario(personajeActivo.id, obj);
          }
        }}
        alQuitarObjeto={(idInst) => quitarObjetoInventario(personajeActivo.id, idInst)}
        alModificarCantidad={(idInst, delta) => modificarCantidadObjeto(personajeActivo.id, idInst, delta)}
        alAlternarEquipado={(idInst) => alternarEquipadoObjeto(personajeActivo.id, idInst)}
        alAlternarSintonizado={(idInst) => alternarSintonizadoObjeto(personajeActivo.id, idInst)}
        alActualizarNotas={(idInst, notas) => actualizarNotasObjeto(personajeActivo.id, idInst, notas)}
        alActualizarObjeto={(idInst, cambios) => actualizarObjetoInventario(personajeActivo.id, idInst, cambios)}
        alModificarCargas={(idInst, delta) => modificarCargasObjeto(personajeActivo.id, idInst, delta)}
        alCambiarContenedor={(idInst, c) => cambiarContenedorObjeto(personajeActivo.id, idInst, c)}
        alDesempaquetarPaquete={(idInst) => {
          desempaquetarPaquete(personajeActivo.id, idInst, baseDatosObjetos);
          agregarNotificacion("¡Paquete desempaquetado con éxito en tu mochila!", "exito");
        }}
        alEstablecerMonedas={(monedas) => establecerMonedas(personajeActivo.id, monedas)}
        alModificarMoneda={(tipo, delta) => modificarMoneda(personajeActivo.id, tipo, delta)}
        alUsarObjeto={manejarUsarConsumible}
      />
    </div>
  );
};

export default VistaInventarioJugador;
