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
          {([
            [estilos.puntoGradoVacio, "BASE"],
            [estilos.puntoGradoMedio, "MEDIO"],
            [estilos.puntoGradoCompetente, "COMP"],
            [estilos.puntoGradoPericia, "PERICIA"]
          ] as const).map(([clasePunto, texto]) => (
            <span key={texto} className={estilos.itemLeyenda}>
              <span className={`${estilos.dotLeyenda} ${clasePunto}`} /> {texto}
            </span>
          ))}
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

          const evalCarac = evaluarEfectosCondicionesEnTirada({
            tipo: "caracteristica", caracteristica: carac, penalizacionArmadura: penalizacionSinComp,
            condicionesActivas: personaje.condicionesActivas, personaje
          });
          const evalSalv = evaluarEfectosCondicionesEnTirada({
            tipo: "salvacion", caracteristica: carac, penalizacionArmadura: penalizacionSinComp,
            condicionesActivas: personaje.condicionesActivas, personaje
          });
          const motivosCarac = [...evalCarac.motivosDesventaja, ...evalCarac.motivosVentaja, ...evalCarac.motivosModificadores].join(", ");
          const motivosSalv = [...evalSalv.motivosDesventaja, ...evalSalv.motivosVentaja, ...evalSalv.motivosModificadores].join(", ");

          const tooltipAtributo = evalCarac.tieneDesventaja
            ? `Prueba de ${etiqueta} (${modTexto}). DESVENTAJA por: ${evalCarac.motivosDesventaja.join(", ")}. Clic para tirar.`
            : evalCarac.tieneVentaja
            ? `Prueba de ${etiqueta} (${modTexto}). VENTAJA por: ${evalCarac.motivosVentaja.join(", ")}. Clic para tirar.`
            : `Prueba de ${etiqueta} (${modTexto}). Haz clic para tirar en 3D.`;

          const puntBase = personaje.caracteristicas?.[carac] ?? 10;
          const puntEfectiva = statsCalculadas.puntuacionesEfectivas?.[carac] ?? puntBase;
          const tieneBono = puntEfectiva !== puntBase;
          const diferencia = puntEfectiva - puntBase;
          const valorMostrar = override !== null && override !== undefined ? override : campoEnEdicion === carac ? puntBase : puntEfectiva;
          const tooltipTexto = override !== null && override !== undefined
            ? `Override fijo activo: ${override}. Modifica en configuración.`
            : tieneBono
            ? `Puntuación efectiva: ${puntEfectiva} (Base: ${puntBase} ${diferencia > 0 ? `+${diferencia}` : `${diferencia}`} por Rasgos). Clic para editar base.`
            : "Puntuación base. Clic para modificar directamente.";

          const habilidadesAtributo = HABILIDADES_LISTA.filter(
            ({ clave: c }) => MAPA_HABILIDAD_A_CARACTERISTICA[c as Habilidad] === carac
          );

          const esPrimario = tieneCompetenciaSalv || mod >= 3;

          return (
            <div
              key={carac}
              className={estilos.tarjetaAtributo}
              data-atributo={carac}
            >
              {/* Cabecera en una sola fila: Sigla + Puntuación a la izquierda | Botón Modificador a la derecha */}
              <div className={estilos.cabeceraAtributoFila}>
                <div className={estilos.filaTituloAtributo}>
                  <h3 className={estilos.nombreAtributo} title={etiqueta}>
                    {etiqueta.slice(0, 3).toUpperCase()}
                  </h3>
                  <label className={estilos.puntuacion}>
                    <span className="u-sr-only">Puntuación</span>
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
                  {evalCarac.tieneDesventaja && (
                    <span title={`Desventaja en pruebas por: ${motivosCarac}`}>
                      <AlertTriangle size={12} color="var(--pj-texto-oro)" />
                    </span>
                  )}
                  {evalCarac.tieneVentaja && !evalCarac.tieneDesventaja && (
                    <span title={`Ventaja en pruebas por: ${motivosCarac}`}>
                      <Sparkles size={12} color="var(--pj-texto-cian)" />
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className={`${estilos.circuloModificador} ${
                    mod < 0
                      ? estilos.modificadorNegativo
                      : esPrimario
                      ? estilos.modificadorPrimario
                      : mod === 0
                      ? estilos.modificadorNeutro
                      : ""
                  }`}
                  title={tooltipAtributo}
                  aria-label={`Tirar ${etiqueta} (${modTexto})`}
                  onClick={() => alTirarCaracteristica(carac, etiqueta, mod)}
                >
                  <span className={estilos.textoModificador}>{modTexto}</span>
                </button>
              </div>

              {/* Fila de Salvación: Check aislado a la izquierda y Tirada con píldora a la derecha */}
              <div
                className={`${estilos.filaSalvacionAtributo} ${
                  tieneCompetenciaSalv ? estilos.filaSalvacionCompetente : ""
                }`}
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
                  <span>Salvación</span>
                  {evalSalv.tieneDesventaja && (
                    <AlertTriangle size={11} color="var(--pj-texto-oro)" className={estilos.iconoInlineSalvacion} />
                  )}
                  {evalSalv.tieneVentaja && !evalSalv.tieneDesventaja && (
                    <Sparkles size={11} color="var(--pj-texto-cian)" className={estilos.iconoInlineSalvacion} />
                  )}
                  <strong
                    className={estilos.pillBonoSalvacion}
                    data-competente={tieneCompetenciaSalv}
                    data-negativo={bonoSalvacion < 0}
                  >
                    {salvTexto}
                  </strong>
                </button>
              </div>

              {/* Cuerpo de Habilidades que estira al 100% la tarjeta para igualar la fila 2x3 */}
              <div className={estilos.cuerpoHabilidadesAtributo}>
                {habilidadesAtributo.length > 0 ? (
                  <>
                    {habilidadesAtributo.map(({ clave: c, nombre }) => (
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
                    ))}
                    {carac === "fuerza" && (
                      <div className={estilos.resumenTacticoAtributo}>
                        <span>Carga máx. / Empujar</span>
                        <strong>{puntEfectiva * 15} lb / {puntEfectiva * 30} lb</strong>
                      </div>
                    )}
                  </>
                ) : (
                  <div className={estilos.sinHabilidadesNativas}>
                    <span>Sin habilidades asociadas</span>
                    <small className={estilos.subtextoSinHabilidades}>
                      Concentración {salvTexto} · PG/Nivel {modTexto}
                    </small>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export const PanelAtributosPersonaje = React.memo(PanelAtributosPersonajeComponent);
