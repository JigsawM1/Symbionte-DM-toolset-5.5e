import React, { useState, useRef, useEffect } from "react";
import { Trash2, Heart, Swords, Dices } from "lucide-react";
import { CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import { MonstruoBase, CONDICIONES_2024, EFECTOS_PREDEFINIDOS } from "@/utiles/datosIniciales";
import { ChipCondicion } from "@/componentes/comunes";
import { formatearVelocidad } from "@/almacen/sanitizacion";
import { esNombreVacioODot } from "@/servicios/resolutorCriaturas";
import { formatearDetalleAtaqueRapido } from "@/utiles/procesadorAtaques";
import type { PasivasCombatePJ } from "@/tipos/sync";
import { InsigniasPasivasJugador } from "./InsigniasPasivasJugador";
import estilosClases from "./TarjetaCriaturaIniciativa.module.css";

interface TarjetaCriaturaIniciativaProps {
  criatura: CriaturaIniciativa;
  esTurnoActivo: boolean;
  estaSeleccionadaEnTS?: boolean;
  plantilla: MonstruoBase | null;
  pasivasJugador?: PasivasCombatePJ | null;
  onEliminar: () => void;
  onSeleccionar: () => void;
  onCurar: (cantidad: number) => void;
  onDañar: (cantidad: number) => void;
  onCambiarTempHP: (cantidad: number) => void;
  onAñadirCondicion: (condicion: string) => void;
  onQuitarCondicion: (condicion: string) => void;
  onAñadirEfecto: (nombre: string, duracion: number, opciones?: { concentracion?: boolean }) => void;
  onQuitarEfecto: (efectoId: string) => void;
  onLanzarIniciativa: () => void;
  onEstablecerIniciativa: (nuevaIniciativa: number) => void;
  onEstablecerVidaMaxima?: (nuevaVidaMaxima: number) => void;
  onLanzarAtaqueRapido: (ataqueNombre: string, bonoAtaque: string, dadosDaño: string, tipoDaño: string) => void;
  obtenerPercepcionPasiva: (plantilla: MonstruoBase | null) => number;
  rondaActual?: number;
}

function obtenerCondicionesVisibles(condiciones: string[] = [], efectos: { nombre: string; concentracion?: boolean }[] = []): string[] {
  const tieneConcentracion = efectos.some(
    (ef) => ef.concentracion || ef.nombre.toLowerCase().startsWith("concentra")
  );
  const nombresEfectosSet = new Set<string>();
  efectos.forEach((ef) => {
    nombresEfectosSet.add(ef.nombre.toLowerCase().trim());
    nombresEfectosSet.add(ef.nombre.split(" (")[0].toLowerCase().trim());
  });
  return condiciones.filter((cond) => {
    const condMin = cond.toLowerCase().trim();
    const condBase = cond.split(" (")[0].toLowerCase().trim();
    if (tieneConcentracion && condMin.includes("concentra")) return false;
    return !nombresEfectosSet.has(condMin) && !nombresEfectosSet.has(condBase);
  });
}

export const TarjetaCriaturaIniciativa: React.FC<TarjetaCriaturaIniciativaProps> = React.memo(({
  criatura,
  esTurnoActivo,
  estaSeleccionadaEnTS = false,
  plantilla,
  pasivasJugador,
  rondaActual,
  onEliminar,
  onSeleccionar,
  onCurar,
  onDañar,
  onCambiarTempHP,
  onAñadirCondicion,
  onQuitarCondicion,
  onAñadirEfecto,
  onQuitarEfecto,
  onLanzarIniciativa,
  onEstablecerIniciativa,
  onEstablecerVidaMaxima,
  onLanzarAtaqueRapido,
  obtenerPercepcionPasiva
}) => {
  const pasivasEfectivas = pasivasJugador || criatura.pasivas || null;
  const [hpInput, setHpInput] = useState("");
  const [dropdownAbierto, setDropdownAbierto] = useState<"condicion" | "efecto" | null>(null);
  const [editandoIniciativa, setEditandoIniciativa] = useState(false);
  const [valorIniciativaTemp, setValorIniciativaTemp] = useState("");
  const refInputIniciativa = useRef<HTMLInputElement>(null);
  const iniciativaOriginalRef = useRef<number>(criatura.iniciativa);

  const [editandoVidaMaxima, setEditandoVidaMaxima] = useState(false);
  const [valorVidaMaximaTemp, setValorVidaMaximaTemp] = useState("");
  const refInputVidaMaxima = useRef<HTMLInputElement>(null);
  const vidaMaximaOriginalRef = useRef<number>(criatura.vidaMaxima);

  const estaMuerto = criatura.vidaActual === 0;

  const ejecutarCuracion = () => {
    const valor = parseInt(hpInput, 10);
    if (!isNaN(valor) && valor > 0) { onCurar(valor); setHpInput(""); }
  };

  const ejecutarDaño = () => {
    const valor = parseInt(hpInput, 10);
    if (!isNaN(valor) && valor > 0) { onDañar(valor); setHpInput(""); }
  };

  const manejarCambioIniciativa = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValorIniciativaTemp(e.target.value);
    const valNum = parseInt(e.target.value, 10);
    if (!isNaN(valNum)) onEstablecerIniciativa(valNum);
  };

  const finalizarEdicionIniciativa = () => {
    const valor = parseInt(valorIniciativaTemp, 10);
    if (isNaN(valor)) onEstablecerIniciativa(iniciativaOriginalRef.current);
    setEditandoIniciativa(false);
    setValorIniciativaTemp("");
  };

  const cancelarEdicionIniciativa = () => {
    onEstablecerIniciativa(iniciativaOriginalRef.current);
    setEditandoIniciativa(false);
    setValorIniciativaTemp("");
  };

  const activarEdicionIniciativa = () => {
    iniciativaOriginalRef.current = criatura.iniciativa;
    setValorIniciativaTemp(String(criatura.iniciativa));
    setEditandoIniciativa(true);
  };

  useEffect(() => {
    if (editandoIniciativa && refInputIniciativa.current) {
      refInputIniciativa.current.focus();
      refInputIniciativa.current.select();
    }
  }, [editandoIniciativa]);

  const manejarCambioVidaMaxima = (e: React.ChangeEvent<HTMLInputElement>) => setValorVidaMaximaTemp(e.target.value);

  const finalizarEdicionVidaMaxima = () => {
    const valor = parseInt(valorVidaMaximaTemp, 10);
    if (!isNaN(valor) && valor > 0 && onEstablecerVidaMaxima) {
      onEstablecerVidaMaxima(valor);
    } else if (onEstablecerVidaMaxima) {
      onEstablecerVidaMaxima(vidaMaximaOriginalRef.current);
    }
    setEditandoVidaMaxima(false);
    setValorVidaMaximaTemp("");
  };

  const cancelarEdicionVidaMaxima = () => {
    if (onEstablecerVidaMaxima) onEstablecerVidaMaxima(vidaMaximaOriginalRef.current);
    setEditandoVidaMaxima(false);
    setValorVidaMaximaTemp("");
  };

  const activarEdicionVidaMaxima = () => {
    vidaMaximaOriginalRef.current = criatura.vidaMaxima;
    setValorVidaMaximaTemp(String(criatura.vidaMaxima));
    setEditandoVidaMaxima(true);
  };

  useEffect(() => {
    if (editandoVidaMaxima && refInputVidaMaxima.current) {
      refInputVidaMaxima.current.focus();
      refInputVidaMaxima.current.select();
    }
  }, [editandoVidaMaxima]);

  return (
    <div
      className={estilosClases.tarjetaCriaturaBrutal}
      data-turno-activo={esTurnoActivo}
      data-seleccionada-ts={estaSeleccionadaEnTS}
      data-muerto={estaMuerto}
    >
      {/* Barra de Color Estática Lateral */}
      <div
        className={estilosClases.barraLateralRol}
        data-es-monstruo={criatura.esMonstruo}
        title={criatura.esMonstruo ? "Monstruo / Enemigo" : "Jugador / Aliado"}
      />

      {/* Caja de Iniciativa — Editable al clic + botón de dado separado */}
      <div
        className={estilosClases.bloqueIniciativaIzquierda}
        data-turno-activo={esTurnoActivo}
      >
        {/* Botón de dado en la parte superior */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLanzarIniciativa();
          }}
          className={estilosClases.botonDadoIniciativa}
          title="Lanzar dado de iniciativa en TaleSpire"
        >
          <Dices size={12} />
        </button>

        {/* Valor de iniciativa — clic para editar en caliente */}
        {editandoIniciativa ? (
          <input
            ref={refInputIniciativa}
            type="number"
            value={valorIniciativaTemp}
            onChange={manejarCambioIniciativa}
            onBlur={finalizarEdicionIniciativa}
            onKeyDown={(e) => {
              if (e.key === "Enter") finalizarEdicionIniciativa();
              if (e.key === "Escape") cancelarEdicionIniciativa();
            }}
            className={estilosClases.inputIniciativaEditable}
            data-turno-activo={esTurnoActivo}
          />
        ) : (
          <span
            onClick={activarEdicionIniciativa}
            className={estilosClases.valorInicGigante}
            data-turno-activo={esTurnoActivo}
            title="Clic para editar iniciativa manualmente"
          >
            {criatura.iniciativa}
          </span>
        )}
      </div>

      {/* Cuerpo central */}
      <div className={estilosClases.cuerpoTarjetaCentral}>
        <div className={estilosClases.cabeceraFilaInfo}>
          <div className={estilosClases.cajaNombres}>
            <span
              onClick={onSeleccionar}
              className={estilosClases.nombreCriaturaLink}
              data-turno-activo={esTurnoActivo}
              data-muerto={estaMuerto}
              title="Ver bloque de estadísticas"
            >
              {esNombreVacioODot(criatura.nombre) ? (
                <span className={estilosClases.textoMiniSinNombre}>
                  [Mini sin nombre: {criatura.id.slice(-4)}]
                </span>
              ) : (
                criatura.nombre
              )}
              {esTurnoActivo && <span className={estilosClases.tagTurnoActivo}>ACTIVO</span>}
              {estaSeleccionadaEnTS && <span className={estilosClases.tagSeleccionTS}>SEL</span>}
            </span>
            <span className={estilosClases.subtituloCriatura}>
              CA: <strong className={estilosClases.valorMetaCianFuente}>{criatura.ca}</strong> | Inic: <strong className={estilosClases.valorMetaAmarilloFuente}>{(criatura.bonificadorIniciativa ?? 0) >= 0 ? `+${criatura.bonificadorIniciativa ?? 0}` : criatura.bonificadorIniciativa}</strong> <br /> Vel: {formatearVelocidad(criatura.velocidad)}
              {!criatura.esMonstruo && pasivasEfectivas ? (
                <>
                  <br />
                  <span title="Percepción Pasiva">PP: <strong className={estilosClases.valorMetaCianFuente}>{pasivasEfectivas.percepcion}</strong></span>
                  {" | "}
                  <span title="Investigación Pasiva">Inv: <strong className={estilosClases.valorMetaCianFuente}>{pasivasEfectivas.investigacion}</strong></span>
                  {" | "}
                  <span title="Perspicacia Pasiva">Pers: <strong className={estilosClases.valorMetaCianFuente}>{pasivasEfectivas.perspicacia}</strong></span>
                </>
              ) : plantilla ? (
                <>
                  <br />  PP: <strong className={estilosClases.valorMetaCianFuente}>{obtenerPercepcionPasiva(plantilla)}</strong>
                </>
              ) : null}
            </span>
          </div>
        </div>

        {/* Chips de Condiciones */}
        <div className={estilosClases.filaCondicionesChips}>
          {obtenerCondicionesVisibles(criatura.condiciones, criatura.efectos).map((cond) => (
            <ChipCondicion
              key={cond}
              nombre={cond}
              onQuitar={() => onQuitarCondicion(cond)}
            />
          ))}

          {criatura.vidaActual > 0 && criatura.vidaActual < (criatura.vidaMaxima / 2) && (
            <ChipCondicion nombre="Desangrándose" esDesangrado />
          )}

          {/* Mini Selector Directo para añadir condiciones */}
          <div className={estilosClases.contenedorMiniSelector}>
            <button
              onClick={() => setDropdownAbierto(
                dropdownAbierto === "condicion" ? null : "condicion"
              )}
              className={estilosClases.miniBotonAdd}
              title="Agregar condición a esta criatura"
            >
              + CONDICIÓN ▾
            </button>

            {/* Dropdown flotante de condiciones */}
            {dropdownAbierto === "condicion" && (
              <div className={estilosClases.dropdownFlotante}>
                {CONDICIONES_2024.map((c) => {
                  const nombreLimpio = c.nombre.split(" (")[0];
                  return (
                    <div
                      key={c.nombre}
                      onClick={() => {
                        onAñadirCondicion(nombreLimpio);
                        setDropdownAbierto(null);
                      }}
                      className={estilosClases.dropdownItem}
                    >
                      {nombreLimpio}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chips de Efectos Activos y Selector de Efectos */}
        <div className={`${estilosClases.filaCondicionesChips} ${estilosClases.filaEfectosMargen}`}>
          {criatura.efectos && criatura.efectos.length > 0 ? (
            criatura.efectos.map((ef) => {
              const rondasRestantes = (ef.expiraRonda !== undefined && rondaActual !== undefined)
                ? Math.max(0, ef.expiraRonda - rondaActual)
                : undefined;
              return (
                <ChipCondicion
                  key={ef.id}
                  nombre={ef.nombre}
                  concentracion={ef.concentracion}
                  expiraRonda={ef.expiraRonda}
                  rondasRestantes={rondasRestantes}
                  onQuitar={() => onQuitarEfecto(ef.id)}
                />
              );
            })
          ) : null}

          {/* Mini Selector Directo para añadir efectos */}
          <div className={estilosClases.contenedorMiniSelector}>
            <button
              onClick={() => setDropdownAbierto(
                dropdownAbierto === "efecto" ? null : "efecto"
              )}
              className={`${estilosClases.miniBotonAdd} ${estilosClases.miniBotonAddEfectos}`}
              title="Agregar efecto activo a esta criatura"
            >
              + EFECTO ▾
            </button>

            {/* Dropdown flotante de efectos */}
            {dropdownAbierto === "efecto" && (
              <div className={`${estilosClases.dropdownFlotante} ${estilosClases.dropdownFlotanteEfectos}`}>
                {EFECTOS_PREDEFINIDOS.map((ep) => {
                  const nombreLimpio = ep.nombre.split(" (")[0];
                  return (
                    <div
                      key={ep.nombre}
                      onClick={() => {
                        onAñadirEfecto(nombreLimpio, ep.duracionEstandar, { concentracion: ep.esConcentracion });
                        setDropdownAbierto(null);
                      }}
                      className={`${estilosClases.dropdownItem} ${estilosClases.dropdownItemEfecto}`}
                    >
                      {nombreLimpio} ({ep.duracionEstandar}r)
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className={estilosClases.cajaAccionesRapidasColumn}>
        {plantilla && plantilla.accionesRapidas && plantilla.accionesRapidas.length > 0 ? (
          <div className={estilosClases.contenedorAccionesRapidasBotones}>
            {plantilla.accionesRapidas.slice(0, 2).map((acc, index) => (
              <button
                key={index}
                onClick={() => onLanzarAtaqueRapido(acc.nombre, acc.bonificadorAtaque, acc.dadosDaño, acc.tipoDaño)}
                className={estilosClases.botonAccionRapidaMedieval}
                title={formatearDetalleAtaqueRapido(acc.bonificadorAtaque, acc.dadosDaño, acc.tipoDaño)}
              >
                <Swords size={10} className={estilosClases.iconoEspadasPeligro} />
                <span>{acc.nombre}</span>
              </button>
            ))}
          </div>
        ) : !criatura.esMonstruo && pasivasEfectivas ? (
          <InsigniasPasivasJugador pasivas={pasivasEfectivas} />
        ) : (
          <div className={estilosClases.sinAccionesAviso}>
            {criatura.esMonstruo ? "Sin ataques rápidos cargados" : "Ficha de Jugador"}
          </div>
        )}
      </div>

      {/* Salud e Inputs de Alta Densidad */}
      <div className={estilosClases.cajaControlesSaludTarjetas}>
        <div className={estilosClases.filaHPArea}>
          <Heart size={12} fill={estaMuerto ? "none" : "var(--color-peligro)"} className={estilosClases.iconoCorazonPeligro} />
          <span className={estilosClases.hpGiganteTexto}>
            {criatura.vidaActual}{" "}
            {editandoVidaMaxima ? (
              <span className={estilosClases.textoVidaMaxima}>
                /{" "}
                <input
                  ref={refInputVidaMaxima}
                  type="number"
                  min="1"
                  value={valorVidaMaximaTemp}
                  onChange={manejarCambioVidaMaxima}
                  onBlur={finalizarEdicionVidaMaxima}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") finalizarEdicionVidaMaxima();
                    if (e.key === "Escape") cancelarEdicionVidaMaxima();
                  }}
                  className={estilosClases.inputVidaMaximaEditable}
                />
              </span>
            ) : (
              <span
                onClick={onEstablecerVidaMaxima ? activarEdicionVidaMaxima : undefined}
                className={`${estilosClases.textoVidaMaxima} ${onEstablecerVidaMaxima ? estilosClases.textoVidaMaximaEditable : ""}`}
                title={onEstablecerVidaMaxima ? "Clic para editar vida máxima" : undefined}
              >
                / {criatura.vidaMaxima}
              </span>
            )}
          </span>
          {criatura.vidaTemporal && criatura.vidaTemporal > 0 ? (
            <span className={estilosClases.tagHPTemporal}>+{criatura.vidaTemporal}</span>
          ) : null}
        </div>

        <div className={estilosClases.inputsSaludFila}>
          {/* Control HP Vertical Curar/Dañar */}
          <div className={estilosClases.controlHPVertical}>
            <button onClick={ejecutarCuracion} className={estilosClases.botonCurarVertical} title="Aplicar Curación">
              CURAR
            </button>
            <input
              type="number"
              placeholder="0"
              min="0"
              value={hpInput}
              onChange={(e) => setHpInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") ejecutarDaño(); }}
              className={estilosClases.inputHPVertical}
            />
            <button onClick={ejecutarDaño} className={estilosClases.botonDañoVertical} title="Aplicar Daño">
              DAÑO
            </button>
          </div>

          {/* Control Temp HP Vertical */}
          <div className={estilosClases.cajaTempVertical}>
            <span className={estilosClases.etiquetaTempVertical}>TEMP</span>
            <input
              type="number"
              placeholder="0"
              min="0"
              value={criatura.vidaTemporal || ""}
              onChange={(e) => onCambiarTempHP(parseInt(e.target.value, 10) || 0)}
              className={estilosClases.inputTempVertical}
              title="Vida Temporal"
            />
          </div>
        </div>
      </div>

      {/* Botón de Quitar */}
      <button
        onClick={onEliminar}
        className={estilosClases.botonEliminarDeCola}
        title="Eliminar de la iniciativa"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
});
