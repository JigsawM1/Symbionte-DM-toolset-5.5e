import React, { useState, useMemo, useEffect } from "react";
import { Clock, MapPin, Layers, X, Edit2, Dices, ChevronLeft, Zap, Sparkles, AlertTriangle } from "lucide-react";
import { lanzarDadosTaleSpire } from "@/utiles/lanzadorDados";
import {
  calcularFormulaEscalada,
  extraerDadosBaseTruco,
  calcularInfoTruco,
  construirFormulaTaleSpireTruco
} from "@/utiles/utilesConjuros";
import { HechizoBase } from "@/tipos";
import { obtenerOpcionesLanzamientoConjuro } from "@/servicios/calculadorMagia";
import { SelectorDesplegable } from "@/componentes/comunes";
import type { ModoLanzamiento } from "@/servicios/servicioLanzamientoConjuros";
import estilosClases from "./FichaHechizo.module.css";

interface FichaHechizoProps {
  hechizo: HechizoBase;
  onClose: () => void;
  onEditar?: () => void;
  onAtras?: () => void;
  alLanzar?: (modo: ModoLanzamiento, nivelLanzamiento?: number) => Promise<boolean | void>;
  onLanzarConjuro?: (nivelLanzamiento: number) => void;
  onLanzarRitual?: () => void;
  nombrePersonaje?: string;
  nivelPersonaje?: number;
  bonoAtaqueMagico?: number;
  esLanzadorPacto?: boolean;
  nivelEspacioPacto?: number;
  espaciosPactoMaximos?: number;
  espaciosConjuroMaximos?: Record<string, number>;
  nivelConjuroMaximo?: number;
  sistemaMagia?: "espacios" | "puntos";
  ocultarLanzamiento?: boolean;
  bloqueadoPorArmadura?: boolean;
  motivoBloqueoArmadura?: string;
  permitirUpcastLibre?: boolean;
}

export const FichaHechizo: React.FC<FichaHechizoProps> = React.memo(({
  hechizo,
  onClose,
  onEditar,
  onAtras,
  alLanzar,
  onLanzarConjuro,
  onLanzarRitual,
  nombrePersonaje,
  nivelPersonaje = 1,
  bonoAtaqueMagico,
  esLanzadorPacto = false,
  nivelEspacioPacto = 0,
  espaciosPactoMaximos = 0,
  espaciosConjuroMaximos = {},
  nivelConjuroMaximo = 0,
  sistemaMagia = "espacios",
  ocultarLanzamiento = false,
  bloqueadoPorArmadura = false,
  motivoBloqueoArmadura,
  permitirUpcastLibre
}) => {
  const nivelBase = hechizo.nivel;
  const esTruco = nivelBase === 0;

  // Si no se pasaron restricciones de ranuras del personaje (modo DM / Compendio), permitir upcasting libre
  const esUpcastLibreEfectivo =
    permitirUpcastLibre ??
    (Object.keys(espaciosConjuroMaximos).length === 0 && !esLanzadorPacto);

  // Obtener opciones de nivel válidas (respetando ranuras reales, pacto fijo y multiclase o modo libre DM)
  const opcionesLanzamiento = useMemo(() => {
    return obtenerOpcionesLanzamientoConjuro({
      nivelHechizo: nivelBase,
      espaciosConjuroMaximos,
      nivelConjuroMaximo,
      sistemaMagia,
      esLanzadorPacto,
      nivelEspacioPacto,
      espaciosPactoMaximos,
      permitirUpcastLibre: esUpcastLibreEfectivo
    });
  }, [
    nivelBase,
    espaciosConjuroMaximos,
    nivelConjuroMaximo,
    sistemaMagia,
    esLanzadorPacto,
    nivelEspacioPacto,
    espaciosPactoMaximos,
    esUpcastLibreEfectivo
  ]);

  const [nivelLanzamiento, setNivelLanzamiento] = useState<number>(() => {
    return opcionesLanzamiento[0]?.nivel ?? (nivelBase > 0 ? nivelBase : 1);
  });

  useEffect(() => {
    if (opcionesLanzamiento.length > 0) {
      const existe = opcionesLanzamiento.some((opt) => opt.nivel === nivelLanzamiento);
      if (!existe) {
        setNivelLanzamiento(opcionesLanzamiento[0].nivel);
      }
    }
  }, [opcionesLanzamiento, nivelLanzamiento]);

  // Escalado de trucos según el nivel de personaje (dados o múltiples ataques/rayos)
  const dadosTrucoBase = esTruco ? extraerDadosBaseTruco(hechizo) : "";
  const infoTruco = esTruco ? calcularInfoTruco(hechizo, nivelPersonaje) : null;

  // Calcular dados válidos reales del conjuro SIN fallbacks inventados
  const dadosBaseValidos = esTruco
    ? (infoTruco?.formula || dadosTrucoBase || "")
    : (hechizo.dadosDaño && hechizo.dadosDaño !== "N/A" ? hechizo.dadosDaño : "");

  // Comprobar si el hechizo es escalable a niveles superiores con dados adicionales
  const esEscalable =
    nivelBase > 0 &&
    !!hechizo.dadosDañoNivelSuperior &&
    hechizo.dadosDañoNivelSuperior !== "N/A";

  const formulaEscalada = esEscalable && dadosBaseValidos
    ? calcularFormulaEscalada(dadosBaseValidos, hechizo.dadosDañoNivelSuperior || "", nivelBase, nivelLanzamiento)
    : { formula: dadosBaseValidos, adicionalText: "" };

  const tieneAtaque =
    hechizo.requiereAtaque === true ||
    (!!hechizo.ataqueCd &&
      hechizo.ataqueCd !== "N/A" &&
      hechizo.ataqueCd !== "none" &&
      (hechizo.ataqueCd.toUpperCase().includes("ATAQUE") || hechizo.ataqueCd.toUpperCase().includes("ATTACK")));

  const tieneCDSalvacion =
    !!hechizo.cdSalvacion &&
    hechizo.cdSalvacion !== "N/A" &&
    hechizo.cdSalvacion !== "none";

  const tieneDano =
    !!dadosBaseValidos &&
    dadosBaseValidos !== "N/A" &&
    dadosBaseValidos !== "none";

  const tieneMecanicasCombate = tieneAtaque || tieneCDSalvacion || tieneDano || esEscalable;

  // Manejar el lanzamiento de dados en TaleSpire
  const manejarLanzamientoDados = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (bloqueadoPorArmadura) {
      return;
    }

    if (alLanzar) {
      await alLanzar(esTruco ? "truco" : "espacio", nivelLanzamiento);
      if (onLanzarConjuro) {
        onLanzarConjuro(nivelLanzamiento);
      }
      return;
    }

    const prefijoPj = nombrePersonaje ? `${nombrePersonaje} - ` : "";

    if (esTruco) {
      const res = construirFormulaTaleSpireTruco(
        hechizo,
        nivelPersonaje,
        bonoAtaqueMagico,
        nombrePersonaje || "Personaje"
      );
      lanzarDadosTaleSpire(res.formulaTaleSpire, res.etiquetaLog);
    } else {
      const tipoDanoText = hechizo.tipoDaño && hechizo.tipoDaño !== "N/A"
        ? ` (${hechizo.tipoDaño})`
        : "";

      const formulaDano =
        nivelLanzamiento > nivelBase && esEscalable
          ? formulaEscalada.formula
          : dadosBaseValidos;

      let formulaFinalTaleSpire = "";
      if (tieneAtaque && bonoAtaqueMagico !== undefined) {
        const bonoSigno = bonoAtaqueMagico >= 0 ? `+${bonoAtaqueMagico}` : `${bonoAtaqueMagico}`;
        if (formulaDano) {
          formulaFinalTaleSpire = `!Ataque ${hechizo.nombre}:1d20${bonoSigno}/Daño${tipoDanoText}:${formulaDano}`;
        } else {
          formulaFinalTaleSpire = `!Ataque ${hechizo.nombre}:1d20${bonoSigno}`;
        }
      } else if (formulaDano) {
        formulaFinalTaleSpire = `!Daño ${hechizo.nombre}${tipoDanoText}:${formulaDano}`;
      } else {
        formulaFinalTaleSpire = `!Lanzar Conjuro:${hechizo.nombre}`;
      }

      const etiquetaLog = `${prefijoPj}Conjuro: ${hechizo.nombre}${
        nivelLanzamiento > nivelBase ? ` [Niv ${nivelLanzamiento}]` : ""
      }${tipoDanoText}`;

      lanzarDadosTaleSpire(formulaFinalTaleSpire, etiquetaLog);
    }

    // Si se abrió desde la hoja de personaje, descontar el recurso y registrar concentración
    if (onLanzarConjuro) {
      onLanzarConjuro(nivelLanzamiento);
    }
  };

  // Lanzamiento como Ritual (D&D 2024: +10 min, sin gastar ranuras)
  const manejarLanzamientoRitual = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (bloqueadoPorArmadura) {
      return;
    }

    if (alLanzar) {
      await alLanzar("ritual", nivelLanzamiento);
      if (onLanzarRitual) {
        onLanzarRitual();
      }
      return;
    }

    const prefijoPj = nombrePersonaje ? `${nombrePersonaje} - ` : "";
    const tipoDanoText = hechizo.tipoDaño && hechizo.tipoDaño !== "N/A" ? ` (${hechizo.tipoDaño})` : "";
    const formulaDano = dadosBaseValidos;

    let formulaFinalTaleSpire = "";
    if (tieneAtaque && bonoAtaqueMagico !== undefined) {
      const bonoSigno = bonoAtaqueMagico >= 0 ? `+${bonoAtaqueMagico}` : `${bonoAtaqueMagico}`;
      if (formulaDano) {
        formulaFinalTaleSpire = `!Ataque ${hechizo.nombre}:1d20${bonoSigno}/Daño${tipoDanoText}:${formulaDano}`;
      } else {
        formulaFinalTaleSpire = `!Ataque ${hechizo.nombre}:1d20${bonoSigno}`;
      }
    } else if (formulaDano) {
      formulaFinalTaleSpire = `!Daño Ritual ${hechizo.nombre}${tipoDanoText}:${formulaDano}`;
    } else {
      formulaFinalTaleSpire = `!Lanzar Ritual:${hechizo.nombre} (+10 min)`;
    }

    const etiquetaLog = `${prefijoPj}Ritual: ${hechizo.nombre} (+10 min, sin ranura)${tipoDanoText}`;
    lanzarDadosTaleSpire(formulaFinalTaleSpire, etiquetaLog);

    if (onLanzarRitual) {
      onLanzarRitual();
    }
  };

  return (
    <div className={estilosClases.contenedorFicha} onClick={(e) => e.stopPropagation()}>
      {/* Cabecera de la Ficha */}
      <div className={estilosClases.cabecera}>
        <div className={estilosClases.cabeceraIzquierda}>
          {onAtras && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAtras();
              }}
              className={estilosClases.botonAtras}
              title="Volver atrás"
              type="button"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          <span className={estilosClases.metaNivel}>
            NIV {hechizo.nivel === 0 ? "TRUCO" : hechizo.nivel}
          </span>
          <span className={estilosClases.titulo}>{hechizo.nombre}</span>
        </div>
        <div className={estilosClases.cabeceraDerecha}>
          {onEditar && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditar();
              }}
              className={estilosClases.botonEditar}
              title="Editar conjuro"
              type="button"
            >
              <Edit2 size={13} />
            </button>
          )}
          <button onClick={onClose} className={estilosClases.botonCerrar} title="Cerrar detalles" type="button">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Cuerpo de la Ficha */}
      <div className={estilosClases.cuerpo}>
        {/* Fila de Propiedades Visuales */}
        <div className={estilosClases.filaChips}>
          {hechizo.concentracion && (
            <span className={estilosClases.chipConcentracion}>CONCENTRACIÓN</span>
          )}
          {hechizo.ritual && (
            <span className={estilosClases.chipRitual}>RITUAL</span>
          )}
          <span className={estilosClases.chipEscuela}>{hechizo.escuela.toUpperCase()}</span>
        </div>

        {/* Grid de Metadatos D&D */}
        <div className={estilosClases.gridMetadatos}>
          <div className={estilosClases.metaItem}>
            <Clock size={13} className={estilosClases.iconoMeta} />
            <div>
              <div className={estilosClases.metaLabel}>TIEMPO</div>
              <div className={estilosClases.metaValor}>{hechizo.tiempoLanzamiento}</div>
            </div>
          </div>
          <div className={estilosClases.metaItem}>
            <MapPin size={13} className={estilosClases.iconoMeta} />
            <div>
              <div className={estilosClases.metaLabel}>ALCANCE</div>
              <div className={estilosClases.metaValor}>{hechizo.alcance}</div>
            </div>
          </div>
          <div className={estilosClases.metaItem}>
            <Layers size={13} className={estilosClases.iconoMeta} />
            <div>
              <div className={estilosClases.metaLabel}>COMPONENTES</div>
              <div className={estilosClases.metaValor}>{hechizo.componentes}</div>
            </div>
          </div>
          <div className={estilosClases.metaItem}>
            <Clock size={13} className={estilosClases.iconoMeta} />
            <div>
              <div className={estilosClases.metaLabel}>DURACIÓN</div>
              <div className={estilosClases.metaValor}>{hechizo.duracion || "Instantáneo"}</div>
            </div>
          </div>
        </div>

        {/* Materiales si existen */}
        {hechizo.materiales && (
          <div className={estilosClases.seccionFicha}>
            <div className={estilosClases.seccionTitulo}>MATERIALES</div>
            <div className={estilosClases.textoMateriales}>{hechizo.materiales}</div>
          </div>
        )}

        {/* MECÁNICAS DE COMBATE (Daño / CD / Upcasting / Mejora de Truco / Lanzamiento) */}
        {!ocultarLanzamiento && (tieneMecanicasCombate || onLanzarConjuro) && (
          <div className={estilosClases.cajaCombate}>
            <div className={estilosClases.tituloCombate}>
              {tieneMecanicasCombate ? "Mecánicas de Combate Integradas" : "Lanzamiento del Conjuro"}
            </div>
            
            <div className={estilosClases.gridCombate}>
              {tieneAtaque && (
                <div className={estilosClases.combateItem}>
                  <span className={estilosClases.combateLabel}>Efecto/Ataque: </span>
                  <strong className={estilosClases.colorActivo}>{hechizo.ataqueCd}</strong>
                </div>
              )}
              {tieneCDSalvacion && (
                <div className={estilosClases.combateItem}>
                  <span className={estilosClases.combateLabel}>CD Salvación: </span>
                  <strong className={estilosClases.colorAlerta}>CD {hechizo.cdSalvacion}</strong>
                </div>
              )}
              {tieneDano && (
                <div className={estilosClases.combateItem} style={{ gridColumn: (esEscalable || esTruco) ? "1 / -1" : "auto" }}>
                  <span className={estilosClases.combateLabel}>
                    {esTruco && infoTruco?.esAtaqueMultiple && infoTruco.cantidadAtaques > 1
                      ? "Ataques de Rayos: "
                      : esTruco
                      ? "Daño del Truco: "
                      : "Daño Base: "}
                  </span>
                  <strong className={estilosClases.colorDano}>
                    {esTruco && infoTruco ? (
                      <>
                        {infoTruco.etiquetaVisual}
                        {infoTruco.multiplicador > 1 && !infoTruco.esAtaqueMultiple && (
                          <span style={{ fontSize: 11, color: "#93c5fd", fontWeight: 600, marginLeft: 6 }}>
                            ({infoTruco.multiplicador}x dado base {infoTruco.base} • Nv.{nivelPersonaje})
                          </span>
                        )}
                      </>
                    ) : (
                      hechizo.dadosDaño || dadosBaseValidos
                    )}
                    {hechizo.tipoDaño && hechizo.tipoDaño !== "N/A" ? ` (${hechizo.tipoDaño})` : ""}
                  </strong>
                </div>
              )}
            </div>

            {/* Panel de Upcasting Interactivo para conjuros de nivel 1+ */}
            {nivelBase > 0 && (esEscalable || onLanzarConjuro) && (
              <div className={estilosClases.seccionUpcast}>
                <div className={estilosClases.lineaDivisoria}></div>
                <div className={estilosClases.upcastSelectContenedor}>
                  <span className={estilosClases.upcastLabel}>Lanzar con Ranura:</span>
                  {opcionesLanzamiento.length > 1 ? (
                    <div style={{ minWidth: "140px" }}>
                      <SelectorDesplegable
                        valor={String(nivelLanzamiento)}
                        alCambiar={(val) => setNivelLanzamiento(Number(val))}
                        opciones={opcionesLanzamiento.map((opt) => ({
                          valor: String(opt.nivel),
                          etiqueta: opt.etiqueta
                        }))}
                        tamano="compacto"
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        backgroundColor: opcionesLanzamiento[0]?.tipo === "pacto"
                          ? "rgba(168, 85, 247, 0.15)"
                          : "rgba(148, 163, 184, 0.1)",
                        color: opcionesLanzamiento[0]?.tipo === "pacto" ? "#d8b4fe" : "#cbd5e1",
                        border: opcionesLanzamiento[0]?.tipo === "pacto"
                          ? "1px solid rgba(168, 85, 247, 0.35)"
                          : "1px solid rgba(148, 163, 184, 0.2)",
                        borderRadius: 4,
                        padding: "4px 8px"
                      }}
                      title={
                        opcionesLanzamiento[0]?.tipo === "pacto"
                          ? "Lanzamiento automático con ranura de Pacto de nivel fijo (Brujo)"
                          : `Lanzamiento con ranura de Nivel ${opcionesLanzamiento[0]?.nivel || nivelBase}`
                      }
                    >
                      {opcionesLanzamiento[0]?.etiqueta || `Nivel ${nivelBase}`}
                    </div>
                  )}
                </div>
                {nivelLanzamiento > nivelBase && esEscalable && (
                  <div className={estilosClases.formulasVista}>
                    <span className={estilosClases.formulaTotal}>{formulaEscalada.formula}</span>
                    <span className={estilosClases.formulaDetalle}>{formulaEscalada.adicionalText}</span>
                  </div>
                )}
              </div>
            )}

            {/* Banner de Advertencia por Armadura sin Competencia */}
            {bloqueadoPorArmadura && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  borderRadius: 6,
                  color: "#fca5a5",
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 8
                }}
              >
                <AlertTriangle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
                <span>
                  {motivoBloqueoArmadura || "No puedes lanzar conjuros mientras vistas armadura o portes escudo sin competencia."}
                </span>
              </div>
            )}

            {/* Botón de Lanzamiento a TaleSpire */}
            <button
              onClick={manejarLanzamientoDados}
              disabled={bloqueadoPorArmadura}
              className={nivelLanzamiento > nivelBase && esEscalable ? estilosClases.botonTirarUpcast : estilosClases.botonTirarCombate}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                opacity: bloqueadoPorArmadura ? 0.45 : 1,
                cursor: bloqueadoPorArmadura ? "not-allowed" : "pointer"
              }}
              title={bloqueadoPorArmadura ? (motivoBloqueoArmadura || "Bloqueado por armadura sin competencia") : undefined}
              type="button"
            >
              {tieneDano || tieneAtaque ? <Dices size={16} /> : <Zap size={16} />}
              <span>
                {esTruco && infoTruco?.esAtaqueMultiple && infoTruco.cantidadAtaques > 1
                  ? `Tirar ${infoTruco.etiquetaVisual} en TaleSpire`
                  : tieneDano
                  ? `Tirar Daño en TaleSpire ${
                      esTruco && infoTruco?.formula
                        ? `(${infoTruco.formula})`
                        : nivelLanzamiento > nivelBase && esEscalable
                        ? `(Nivel ${nivelLanzamiento})`
                        : ""
                    }`
                  : tieneAtaque
                  ? `Tirar Ataque en TaleSpire ${bonoAtaqueMagico !== undefined ? `(${bonoAtaqueMagico >= 0 ? "+" : ""}${bonoAtaqueMagico})` : ""}`
                  : `Lanzar Conjuro en TaleSpire ${nivelLanzamiento > nivelBase ? `(Nivel ${nivelLanzamiento})` : ""}`}
              </span>
            </button>

            {/* Botón Lanzamiento como Ritual */}
            {hechizo.ritual && !esTruco && (
              <button
                onClick={manejarLanzamientoRitual}
                disabled={bloqueadoPorArmadura}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  backgroundColor: "rgba(168, 85, 247, 0.15)",
                  border: "1px solid rgba(168, 85, 247, 0.4)",
                  borderRadius: 6,
                  color: "#d8b4fe",
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "8px 14px",
                  cursor: bloqueadoPorArmadura ? "not-allowed" : "pointer",
                  opacity: bloqueadoPorArmadura ? 0.45 : 1,
                  marginTop: 6,
                  width: "100%"
                }}
                title={bloqueadoPorArmadura ? (motivoBloqueoArmadura || "Bloqueado por armadura sin competencia") : undefined}
                onMouseEnter={(e) => {
                  if (!bloqueadoPorArmadura) e.currentTarget.style.backgroundColor = "rgba(168, 85, 247, 0.25)";
                }}
                onMouseLeave={(e) => {
                  if (!bloqueadoPorArmadura) e.currentTarget.style.backgroundColor = "rgba(168, 85, 247, 0.15)";
                }}
                type="button"
              >
                <Sparkles size={15} />
                <span>Lanzar como Ritual (+10 min, sin gastar ranura)</span>
              </button>
            )}
          </div>
        )}

        {/* Descripción */}
        <div className={estilosClases.seccionFicha}>
          <div className={estilosClases.seccionTitulo}>DESCRIPCIÓN DEL CONJURO</div>
          <div 
            className={estilosClases.textoDescripcion} 
            dangerouslySetInnerHTML={{ __html: hechizo.descripcion }} 
          />
        </div>

        {/* Niveles superiores estático informativo si existe */}
        {hechizo.descNivelSuperior && (
          <div className={estilosClases.seccionFicha}>
            <div className={estilosClases.seccionTitulo}>EFECTO A NIVELES SUPERIORES</div>
            <div 
              className={estilosClases.textoDescripcion} 
              style={{ fontStyle: "italic" }}
              dangerouslySetInnerHTML={{ __html: hechizo.descNivelSuperior }}
            />
          </div>
        )}

        {/* Clases disponibles si existen */}
        {hechizo.clases && hechizo.clases.length > 0 && (
          <div className={estilosClases.seccionFicha}>
            <div className={estilosClases.seccionTitulo}>CLASES QUE PUEDEN UTILIZAR ESTE CONJURO</div>
            <div className={estilosClases.filaClases}>
              {hechizo.clases.map((clase) => (
                <span key={clase} className={estilosClases.chipClase}>
                  {clase}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
