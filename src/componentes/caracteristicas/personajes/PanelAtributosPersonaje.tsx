import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import React, { useState, useMemo } from "react";
import type { PersonajeJugador, Caracteristica, Habilidad } from "@/tipos";
import { CARACTERISTICAS_CLAVES } from "@/constantes";
import type { EstadisticasCalculadasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import { evaluarEfectosCondicionesEnTirada } from "@/servicios/procesadorCondiciones";
import { AlertTriangle, Sparkles } from "lucide-react";
import { HABILIDADES_LISTA } from "@/constantes/homebrewConstantes";
import { MAPA_HABILIDAD_A_CARACTERISTICA } from "@/constantes/personajeConstantes";
import { obtenerHabilidadesConFuerzaRasgos } from "@/servicios/rasgos/evaluadorSalvacionesRasgos";
import { FilaHabilidadPersonaje } from "./FilaHabilidadPersonaje";
import estilos from "./AtributosPersonaje.module.css";

interface PanelAtributosPersonajeProps {
  personaje: PersonajeJugador;
  statsCalculadas: EstadisticasCalculadasPersonaje;
  alTirarHabilidad: (hab: Habilidad, nombre: string, bono: number, caracteristica?: Caracteristica) => void;
  alCiclarGradoHabilidad: (hab: Habilidad) => void;
  alTirarCaracteristica: (carac: Caracteristica, nombre: string, bono: number) => void;
  alTirarSalvacion: (carac: Caracteristica, nombre: string, bono: number) => void;
  alAlternarSalvacion: (carac: Caracteristica) => void;
  alModificarCaracteristicaBase: (carac: Caracteristica, valor: number) => void;
}

const PanelAtributosPersonajeComponent: React.FC<PanelAtributosPersonajeProps> = ({
  personaje,
  statsCalculadas,
  alTirarHabilidad,
  alCiclarGradoHabilidad,
  alTirarCaracteristica,
  alTirarSalvacion,
  alAlternarSalvacion,
  alModificarCaracteristicaBase
}) => {
  const { modificadores, salvaciones } = statsCalculadas;

  // Estado local para permitir escribir libremente y dejar el campo vacío antes de confirmar
  const [campoEnEdicion, setCampoEnEdicion] = useState<Caracteristica | null>(null);

  const habilidadesConFuerza = useMemo(() => obtenerHabilidadesConFuerzaRasgos(personaje), [personaje]);

  const penalizacionSinComp = !!statsCalculadas.penalizacionArmadura?.sinCompetencia;

  return (
    <section aria-label="Atributos y habilidades" className={estilos.seccionAtributos}>
      <div className={estilos.encabezadoSeccion}>
        <h2>ATRIBUTOS Y HABILIDADES</h2>
        <div className={estilos.leyenda}>
          <span className={estilos.itemLeyenda}>
            <span className={`${estilos.dotLeyenda} ${estilos.puntoGradoVacio}`} /> BASE
          </span>
          <span className={estilos.itemLeyenda}>
            <span className={`${estilos.dotLeyenda} ${estilos.puntoGradoCompetente}`} /> COMPETENTE
          </span>
          <span className={estilos.itemLeyenda}>
            <span className={`${estilos.dotLeyenda} ${estilos.puntoGradoPericia}`} /> PERICIA
          </span>
        </div>
      </div>

      <div className={estilos.gridAtributos}>
        {CARACTERISTICAS_CLAVES.map(({ clave, etiqueta }) => {
          const carac = clave as Caracteristica;
          const override = personaje.overridesFijos?.[carac];
          const mod = modificadores[carac] || 0;
          const modTexto = mod >= 0 ? `+${mod}` : `${mod}`;
          const bonoSalvacion = salvaciones[carac] || 0;
          const salvTexto = bonoSalvacion >= 0 ? `+${bonoSalvacion}` : `${bonoSalvacion}`;
          const tieneCompetenciaSalv = personaje.competenciasSalvacion?.[carac] || false;

          // Evaluación integral de condiciones activas y rasgos para Característica y Salvación
          const evalCarac = evaluarEfectosCondicionesEnTirada({
            tipo: "caracteristica",
            caracteristica: carac,
            penalizacionArmadura: penalizacionSinComp,
            condicionesActivas: personaje.condicionesActivas,
            personaje: personaje
          });

          const evalSalv = evaluarEfectosCondicionesEnTirada({
            tipo: "salvacion",
            caracteristica: carac,
            penalizacionArmadura: penalizacionSinComp,
            condicionesActivas: personaje.condicionesActivas,
            personaje: personaje
          });

          const motivosCarac = [
            ...evalCarac.motivosDesventaja,
            ...evalCarac.motivosVentaja,
            ...evalCarac.motivosModificadores
          ].join(", ");

          const motivosSalv = [
            ...evalSalv.motivosDesventaja,
            ...evalSalv.motivosVentaja,
            ...evalSalv.motivosModificadores
          ].join(", ");

          let tooltipAtributo = `Prueba de ${etiqueta} (${modTexto}). Haz clic para tirar en 3D.`;
          if (evalCarac.tieneDesventaja) {
            tooltipAtributo = `Prueba de ${etiqueta} (${modTexto}). DESVENTAJA por: ${evalCarac.motivosDesventaja.join(", ")}. Clic para tirar.`;
          } else if (evalCarac.tieneVentaja) {
            tooltipAtributo = `Prueba de ${etiqueta} (${modTexto}). VENTAJA por: ${evalCarac.motivosVentaja.join(", ")}. Clic para tirar.`;
          }

          const puntBase = personaje.caracteristicas?.[carac] ?? 10;
          const puntEfectiva = statsCalculadas.puntuacionesEfectivas?.[carac] ?? puntBase;
          const tieneBono = puntEfectiva !== puntBase;
          const diferencia = puntEfectiva - puntBase;
          const valorMostrar =
            override !== null && override !== undefined
              ? override
              : campoEnEdicion === carac
              ? puntBase
              : puntEfectiva;

          const tooltipTexto =
            override !== null && override !== undefined
              ? `Override fijo activo: ${override}. Modifica en configuración.`
              : tieneBono
              ? `Puntuación efectiva: ${puntEfectiva} (Base: ${puntBase} ${diferencia > 0 ? `+${diferencia}` : `${diferencia}`} por Rasgos). Clic para editar base.`
              : "Puntuación base. Clic para modificar directamente.";

          const habilidadesAtributo = HABILIDADES_LISTA.filter(
            ({ clave: c }) => MAPA_HABILIDAD_A_CARACTERISTICA[c as Habilidad] === carac
          );

          return (
            <div
              key={carac}
              className={estilos.tarjetaAtributo}
              data-atributo={carac}
            >
              {/* Bloque Izquierdo: Nombre grande (FUE, DES, etc.) y Puntuación debajo */}
              <div className={estilos.cabeceraAtributoColumna}>
                <div className={estilos.filaTituloAtributo}>
                  <h3 className={estilos.nombreAtributo} title={etiqueta}>
                    {etiqueta.slice(0, 3).toUpperCase()}
                  </h3>
                  {evalCarac.tieneDesventaja && (
                    <span title={`Desventaja en pruebas por: ${motivosCarac}`}>
                      <AlertTriangle size={11} color="var(--pj-texto-oro)" />
                    </span>
                  )}
                  {evalCarac.tieneVentaja && !evalCarac.tieneDesventaja && (
                    <span title={`Ventaja en pruebas por: ${motivosCarac}`}>
                      <Sparkles size={11} color="var(--pj-texto-cian)" />
                    </span>
                  )}
                </div>

                <label className={estilos.puntuacion}>
                  <span>Puntuación</span>
                  <CampoNumerico
                    aria-label={`Puntuación de ${etiqueta}`}
                    className={estilos.badgePuntuacionBase}
                    data-bono={tieneBono && (override === null || override === undefined)}
                    value={valorMostrar}
                    valorBase={puntBase}
                    readOnly={override !== null && override !== undefined}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onFocus={() => setCampoEnEdicion(carac)}
                    alConfirmar={(valor) => alModificarCaracteristicaBase(carac, valor)}
                    onBlur={() => setCampoEnEdicion(null)}
                    title={tooltipTexto}
                    identidad={personaje.id}
                    min={1}
                    max={30}
                  />
                </label>
              </div>

              {/* Botón rectangular prominente de modificador a la derecha */}
              <button
                type="button"
                className={`${estilos.circuloModificador} ${mod < 0 ? estilos.modificadorNegativo : ""}`}
                title={tooltipAtributo}
                aria-label={`Tirar ${etiqueta} (${modTexto})`}
                onClick={() => alTirarCaracteristica(carac, etiqueta, mod)}
              >
                <span className={estilos.textoModificador}>{modTexto}</span>
              </button>

              {/* Fila de Salvación: Check aislado a la izquierda y Tirada a la derecha */}
              <div
                className={estilos.filaSalvacionAtributo}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  aria-label={`Competencia en salvación de ${etiqueta}`}
                  aria-pressed={tieneCompetenciaSalv}
                  className={estilos.botonToggleSalvacion}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    alAlternarSalvacion(carac);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  title={
                    tieneCompetenciaSalv
                      ? "Competente en Salvación (Clic para desactivar)"
                      : "Sin competencia (Clic para activar)"
                  }
                >
                  <div
                    className={`${estilos.puntoCompetenciaSalvacion} ${
                      tieneCompetenciaSalv ? estilos.puntoCompetenciaActivo : ""
                    }`}
                  />
                </button>

                <button
                  type="button"
                  className={`${estilos.botonTextoSalvacion} ${
                    tieneCompetenciaSalv ? estilos.textoSalvacionCompetente : ""
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    alTirarSalvacion(carac, `Salvación de ${etiqueta}`, bonoSalvacion);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  title={
                    evalSalv.tieneDesventaja
                      ? `Tirada de Salvación de ${etiqueta} (${salvTexto}). DESVENTAJA por: ${motivosSalv}. Clic para tirar en 3D.`
                      : evalSalv.tieneVentaja
                      ? `Tirada de Salvación de ${etiqueta} (${salvTexto}). VENTAJA por: ${motivosSalv}. Clic para tirar en 3D.`
                      : `Tirada de Salvación de ${etiqueta} (${salvTexto}). Clic para tirar en 3D.`
                  }
                >
                  <span>SALVACIÓN {etiqueta.slice(0, 3).toUpperCase()}</span>
                  <strong>{salvTexto}</strong>
                  {evalSalv.tieneDesventaja && (
                    <AlertTriangle size={10} color="var(--pj-texto-oro)" className={estilos.iconoInlineSalvacion} />
                  )}
                  {evalSalv.tieneVentaja && !evalSalv.tieneDesventaja && (
                    <Sparkles size={10} color="var(--pj-texto-cian)" className={estilos.iconoInlineSalvacion} />
                  )}
                </button>
              </div>

              {/* Habilidades asociadas al atributo */}
              {habilidadesAtributo.length > 0 ? (
                habilidadesAtributo.map(({ clave: c, nombre }) => (
                  <FilaHabilidadPersonaje
                    key={`${personaje.id}:${c}`}
                    hab={c as Habilidad}
                    nombre={nombre}
                    personaje={personaje}
                    statsCalculadas={statsCalculadas}
                    habilidadesConFuerza={habilidadesConFuerza}
                    alTirarHabilidad={alTirarHabilidad}
                    alCiclarGradoHabilidad={alCiclarGradoHabilidad}
                  />
                ))
              ) : (
                <div className={estilos.sinHabilidadesNativas}>
                  <span>Sin habilidades nativas</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export const PanelAtributosPersonaje = React.memo(PanelAtributosPersonajeComponent);
