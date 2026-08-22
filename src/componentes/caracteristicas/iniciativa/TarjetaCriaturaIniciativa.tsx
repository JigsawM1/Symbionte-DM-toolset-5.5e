import React, { useState, useRef, useEffect } from "react";
import { Trash2, Heart, Swords, Dices } from "lucide-react";
import { CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import { MonstruoBase, CONDICIONES_2024, EFECTOS_PREDEFINIDOS } from "@/utiles/datosIniciales";
import { ChipCondicion } from "@/componentes/comunes";
import { formatearVelocidad } from "@/almacen/sanitizacion";
import { esNombreVacioODot } from "@/servicios/resolutorCriaturas";
import { formatearDetalleAtaqueRapido } from "@/utiles/procesadorAtaques";
import estilosClases from "./TarjetaCriaturaIniciativa.module.css";

interface TarjetaCriaturaIniciativaProps {
  criatura: CriaturaIniciativa;
  esTurnoActivo: boolean;
  estaSeleccionadaEnTS?: boolean;
  plantilla: MonstruoBase | null;
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
  onLanzarAtaqueRapido: (ataqueNombre: string, bonoAtaque: string, dadosDaño: string, tipoDaño: string) => void;
  obtenerPercepcionPasiva: (plantilla: MonstruoBase | null) => number;
}

export const TarjetaCriaturaIniciativa: React.FC<TarjetaCriaturaIniciativaProps> = React.memo(({
  criatura,
  esTurnoActivo,
  estaSeleccionadaEnTS = false,
  plantilla,
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
  onLanzarAtaqueRapido,
  obtenerPercepcionPasiva
}) => {
  const [hpInput, setHpInput] = useState("");
  const [dropdownAbierto, setDropdownAbierto] = useState<"condicion" | "efecto" | null>(null);
  const [editandoIniciativa, setEditandoIniciativa] = useState(false);
  const [valorIniciativaTemp, setValorIniciativaTemp] = useState("");
  const refInputIniciativa = useRef<HTMLInputElement>(null);
  const iniciativaOriginalRef = useRef<number>(criatura.iniciativa);

  const estaMuerto = criatura.vidaActual === 0;
  const colorNombre = esTurnoActivo ? "var(--color-borde-cian)" : "var(--color-texto-principal)";

  const colorBorde = (esTurnoActivo && estaSeleccionadaEnTS)
    ? "2px solid #ffcc00"
    : estaSeleccionadaEnTS
      ? "2px solid var(--color-advertencia)"
      : esTurnoActivo
        ? "1px solid var(--color-borde-cian)"
        : "1px solid var(--color-borde-brutal)";

  const sombraTarjeta = estaSeleccionadaEnTS
    ? "0 0 10px rgba(224, 169, 109, 0.45)"
    : esTurnoActivo
      ? "0 0 8px rgba(0, 245, 212, 0.2)"
      : "0 1px 3px rgba(0, 0, 0, 0.2)";

  const fondoTarjeta = esTurnoActivo
    ? "linear-gradient(90deg, hsl(172, 90%, 4%) 0%, hsl(222, 18%, 11%) 100%)"
    : "var(--color-fondo-tarjeta)";

  const ejecutarCuracion = () => {
    const valor = parseInt(hpInput, 10);
    if (isNaN(valor) || valor <= 0) return;
    onCurar(valor);
    setHpInput("");
  };

  const ejecutarDaño = () => {
    const valor = parseInt(hpInput, 10);
    if (isNaN(valor) || valor <= 0) return;
    onDañar(valor);
    setHpInput("");
  };

  // Manejo de cambio de iniciativa en caliente (tiempo real)
  const manejarCambioIniciativa = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setValorIniciativaTemp(valStr);
    const valNum = parseInt(valStr, 10);
    if (!isNaN(valNum)) {
      onEstablecerIniciativa(valNum);
    }
  };

  // Finalizar edición manual de iniciativa
  const finalizarEdicionIniciativa = () => {
    const valor = parseInt(valorIniciativaTemp, 10);
    if (isNaN(valor)) {
      onEstablecerIniciativa(iniciativaOriginalRef.current);
    }
    setEditandoIniciativa(false);
    setValorIniciativaTemp("");
  };

  // Cancelar edición manual de iniciativa y restaurar valor inicial
  const cancelarEdicionIniciativa = () => {
    onEstablecerIniciativa(iniciativaOriginalRef.current);
    setEditandoIniciativa(false);
    setValorIniciativaTemp("");
  };

  // Activar modo edición de iniciativa
  const activarEdicionIniciativa = () => {
    iniciativaOriginalRef.current = criatura.iniciativa;
    setValorIniciativaTemp(String(criatura.iniciativa));
    setEditandoIniciativa(true);
  };

  // Focus automático al activar edición
  useEffect(() => {
    if (editandoIniciativa && refInputIniciativa.current) {
      refInputIniciativa.current.focus();
      refInputIniciativa.current.select();
    }
  }, [editandoIniciativa]);

  return (
    <div
      className={estilosClases.tarjetaCriaturaBrutal}
      style={{
        border: colorBorde,
        boxShadow: sombraTarjeta,
        background: fondoTarjeta,
        opacity: estaMuerto ? 0.55 : 1
      }}
    >
      {/* Barra de Color Estática Lateral */}
      <div
        className={estilosClases.barraLateralRol}
        style={{
          backgroundColor: criatura.esMonstruo ? "#7b2cbf" : "var(--color-borde-cian)"
        }}
        title={criatura.esMonstruo ? "Monstruo / Enemigo" : "Jugador / Aliado"}
      />

      {/* Caja de Iniciativa — Editable al clic + botón de dado separado */}
      <div
        className={estilosClases.bloqueIniciativaIzquierda}
        style={{
          borderColor: esTurnoActivo ? "var(--color-borde-cian)" : "var(--color-borde-brutal)",
          backgroundColor: esTurnoActivo ? "rgba(0, 245, 212, 0.05)" : "hsl(222, 25%, 5%)"
        }}
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
            style={{
              color: esTurnoActivo ? "var(--color-borde-cian)" : "#ffcc00"
            }}
          />
        ) : (
          <span
            onClick={activarEdicionIniciativa}
            className={estilosClases.valorInicGigante}
            style={{
              color: esTurnoActivo ? "var(--color-borde-cian)" : "#ffcc00",
              cursor: "text"
            }}
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
              style={{
                color: colorNombre,
                textDecoration: estaMuerto ? "line-through" : "none",
                fontWeight: esTurnoActivo ? "800" : "700"
              }}
              title="Ver bloque de estadísticas"
            >
              {esNombreVacioODot(criatura.nombre) ? (
                <span style={{ fontStyle: "italic", opacity: 0.65 }}>
                  [Mini sin nombre: {criatura.id.slice(-4)}]
                </span>
              ) : (
                criatura.nombre
              )}
              {esTurnoActivo && <span className={estilosClases.tagTurnoActivo}>ACTIVO</span>}
              {estaSeleccionadaEnTS && <span className={estilosClases.tagSeleccionTS}>SEL</span>}
            </span>
            <span className={estilosClases.subtituloCriatura}>
              CA: <strong style={{ color: "var(--color-borde-cian)", fontFamily: "var(--fuente-codigo)" }}>{criatura.ca}</strong> | Inic: <strong style={{ color: "#ffcc00", fontFamily: "var(--fuente-codigo)" }}>{(criatura.bonificadorIniciativa ?? 0) >= 0 ? `+${criatura.bonificadorIniciativa ?? 0}` : criatura.bonificadorIniciativa}</strong> <br /> Vel: {formatearVelocidad(criatura.velocidad)}
              {plantilla && (
                <>
                  <br />  PP: <strong style={{ color: "var(--color-borde-cian)", fontFamily: "var(--fuente-codigo)" }}>{obtenerPercepcionPasiva(plantilla)}</strong>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Chips de Condiciones */}
        <div className={estilosClases.filaCondicionesChips}>
          {criatura.condiciones.map((cond) => (
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
          <div style={{ position: "relative", display: "inline-block" }}>
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
        <div className={estilosClases.filaCondicionesChips} style={{ marginTop: "4px" }}>
          {criatura.efectos && criatura.efectos.length > 0 ? (
            criatura.efectos.map((ef) => (
              <ChipCondicion
                key={ef.id}
                nombre={ef.nombre}
                concentracion={ef.concentracion}
                expiraRonda={ef.expiraRonda}
                onQuitar={() => onQuitarEfecto(ef.id)}
              />
            ))
          ) : null}

          {/* Mini Selector Directo para añadir efectos */}
          <div style={{ position: "relative", display: "inline-block" }}>
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
                <Swords size={10} style={{ color: "var(--color-peligro)" }} />
                <span>{acc.nombre}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className={estilosClases.sinAccionesAviso}>
            {criatura.esMonstruo ? "Sin ataques rápidos cargados" : "Ficha de Jugador"}
          </div>
        )}
      </div>

      {/* Salud e Inputs de Alta Densidad */}
      <div className={estilosClases.cajaControlesSaludTarjetas}>
        <div className={estilosClases.filaHPArea}>
          <Heart size={12} fill={estaMuerto ? "none" : "var(--color-peligro)"} style={{ color: "var(--color-peligro)" }} />
          <span className={estilosClases.hpGiganteTexto}>
            {criatura.vidaActual} <span style={{ color: "var(--color-texto-apagado)", fontSize: "10px" }}>/ {criatura.vidaMaxima}</span>
          </span>
          {criatura.vidaTemporal && criatura.vidaTemporal > 0 ? (
            <span className={estilosClases.tagHPTemporal}>+{criatura.vidaTemporal}</span>
          ) : null}
        </div>

        <div className={estilosClases.inputsSaludFila}>
          {/* Control HP Vertical Curar/Dañar */}
          <div className={estilosClases.controlHPVertical}>
            <button
              onClick={ejecutarCuracion}
              className={estilosClases.botonCurarVertical}
              title="Aplicar Curación"
            >
              CURAR
            </button>
            <input
              type="number"
              placeholder="0"
              min="0"
              value={hpInput}
              onChange={(e) => setHpInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  ejecutarDaño();
                }
              }}
              className={estilosClases.inputHPVertical}
            />
            <button
              onClick={ejecutarDaño}
              className={estilosClases.botonDañoVertical}
              title="Aplicar Daño"
            >
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
