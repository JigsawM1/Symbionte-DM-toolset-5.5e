import React, { useState } from "react";
import { Skull, Shield, Trash2, Heart, Swords, X } from "lucide-react";
import { usarAlmacenDM, CriaturaIniciativa } from "../../almacen/usarAlmacenDM";
import { MonstruoBase, CONDICIONES_2024, EFECTOS_PREDEFINIDOS } from "../../utiles/datosIniciales";
import { formatearVelocidad } from "../../almacen/sanitizacion";
import estilosClases from "./TarjetaCriaturaIniciativa.module.css";

interface TarjetaCriaturaIniciativaProps {
  criatura: CriaturaIniciativa;
  esTurnoActivo: boolean;
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
  onLanzarAtaqueRapido: (ataqueNombre: string, bonoAtaque: string, dadosDaño: string, tipoDaño: string) => void;
  obtenerPercepcionPasiva: (plantilla: MonstruoBase | null) => number;
}

export const TarjetaCriaturaIniciativa: React.FC<TarjetaCriaturaIniciativaProps> = React.memo(({
  criatura,
  esTurnoActivo,
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
  onLanzarAtaqueRapido,
  obtenerPercepcionPasiva
}) => {
  const [hpInput, setHpInput] = useState("");
  const [dropdownAbierto, setDropdownAbierto] = useState<"condicion" | "efecto" | null>(null);

  const estaMuerto = criatura.vidaActual === 0;
  const colorNombre = esTurnoActivo ? "var(--color-borde-cian)" : "var(--color-texto-principal)";
  const colorBorde = esTurnoActivo ? "1px solid var(--color-borde-cian)" : "1px solid var(--color-borde-brutal)";
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

  return (
    <div
      className={estilosClases.tarjetaCriaturaBrutal}
      style={{
        border: colorBorde,
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

      {/* Caja de Iniciativa */}
      <div 
        onClick={onLanzarIniciativa}
        className={estilosClases.bloqueIniciativaIzquierda}
        style={{
          borderColor: esTurnoActivo ? "var(--color-borde-cian)" : "var(--color-borde-brutal)",
          backgroundColor: esTurnoActivo ? "rgba(0, 245, 212, 0.05)" : "hsl(222, 25%, 5%)",
          cursor: "pointer"
        }}
        title="Lanzar iniciativa"
      >
        <span className={estilosClases.etiquetaInicMini}>INIC</span>
        <span
          className={estilosClases.valorInicGigante}
          style={{
            color: esTurnoActivo ? "var(--color-borde-cian)" : "#ffcc00"
          }}
        >
          {criatura.iniciativa}
        </span>
      </div>

      {/* Cuerpo central */}
      <div className={estilosClases.cuerpoTarjetaCentral}>
        <div className={estilosClases.cabeceraFilaInfo}>
          <div
            className={estilosClases.avatarRedondeado}
            style={{
              backgroundColor: criatura.esMonstruo ? "rgba(123, 44, 191, 0.15)" : "rgba(0, 245, 212, 0.1)",
              borderColor: criatura.esMonstruo ? "#7b2cbf" : "var(--color-borde-cian)"
            }}
          >
            {criatura.esMonstruo ? (
              <Skull size={13} style={{ color: "#a29bfe" }} />
            ) : (
              <Shield size={13} style={{ color: "var(--color-borde-cian)" }} />
            )}
          </div>

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
              {criatura.nombre}
              {esTurnoActivo && <span className={estilosClases.tagTurnoActivo}>ACTIVO</span>}
            </span>
            <span className={estilosClases.subtituloCriatura}>
              CA: <strong style={{ color: "var(--color-borde-cian)", fontFamily: "var(--fuente-codigo)" }}>{criatura.ca}</strong> | Vel: {formatearVelocidad(criatura.velocidad)}
              {plantilla && (
                <> | &nbsp; &nbsp; PP: <strong style={{ color: "#ffcc00", fontFamily: "var(--fuente-codigo)" }}>{obtenerPercepcionPasiva(plantilla)}</strong></>
              )}
            </span>
          </div>
        </div>

        {/* Chips de Condiciones */}
        <div className={estilosClases.filaCondicionesChips}>
          {criatura.condiciones.length > 0 || (criatura.vidaActual > 0 && criatura.vidaActual < (criatura.vidaMaxima / 2)) ? (
            <>
              {criatura.condiciones.map((cond) => {
                const esAlerta = ["muerto", "inconsciente", "aturdido", "paralizado"].includes(cond.toLowerCase());
                const condObj = CONDICIONES_2024.find(
                  (c) => c.nombre.toLowerCase().includes(cond.toLowerCase()) || cond.toLowerCase().includes(c.nombre.split(" ")[0].toLowerCase())
                );
                
                let tooltipTexto = condObj 
                  ? `${condObj.nombre}\n\n${condObj.efectos.map(e => `• ${e}`).join("\n")}`
                  : cond;

                const esCansado = cond.toLowerCase().startsWith("cansado") || cond.toLowerCase().includes("cansancio");
                let cansadoEstilos: React.CSSProperties = {};
                let textoMostrar = cond;

                if (esCansado) {
                  const matches = cond.match(/\d+/);
                  const nivel = matches ? parseInt(matches[0], 10) : 1;
                  textoMostrar = `💤 CANSADO NVEL ${nivel}`;
                  if (nivel <= 2) {
                    cansadoEstilos = {
                      backgroundColor: "hsla(45, 80%, 8%, 0.75)",
                      borderColor: "hsla(45, 80%, 50%, 0.7)",
                      color: "hsl(45, 100%, 85%)"
                    };
                  } else if (nivel <= 4) {
                    cansadoEstilos = {
                      backgroundColor: "hsla(25, 80%, 9%, 0.75)",
                      borderColor: "hsla(25, 80%, 52%, 0.7)",
                      color: "hsl(25, 100%, 85%)"
                    };
                  } else if (nivel === 5) {
                    cansadoEstilos = {
                      backgroundColor: "hsla(5, 80%, 10%, 0.78)",
                      borderColor: "hsla(5, 80%, 55%, 0.75)",
                      color: "hsl(5, 100%, 85%)"
                    };
                  } else {
                    textoMostrar = `💀 MUERTE (CANSADO 6)`;
                    cansadoEstilos = {
                      background: "linear-gradient(135deg, hsl(0, 100%, 4%) 0%, hsl(340, 100%, 12%) 100%)",
                      borderColor: "hsl(340, 100%, 55%)",
                      color: "#ffffff",
                      fontWeight: "800",
                      boxShadow: "0 0 5px rgba(255, 0, 85, 0.4)"
                    };
                  }
                  tooltipTexto = `CANSADO (Nivel ${nivel}) - Reglas 5.5e (2024)\n\n• Tiradas de d20: Restas -${nivel * 2} a todas tus tiradas de d20 (ataques, salvaciones, pruebas de habilidad).\n• Velocidad: Tu velocidad se reduce en -${nivel * 5} pies.\n${nivel === 6 ? "• MUERTE: ¡El nivel 6 causa la muerte instantánea!" : ""}`;
                }

                const estilosBase = esCansado
                  ? cansadoEstilos
                  : esAlerta
                    ? {
                        backgroundColor: "hsla(355, 80%, 10%, 0.75)",
                        borderColor: "hsla(355, 80%, 55%, 0.7)",
                        color: "hsl(355, 100%, 85%)"
                      }
                    : {
                        backgroundColor: "hsla(172, 90%, 7%, 0.75)",
                        borderColor: "hsla(172, 90%, 45%, 0.7)",
                        color: "hsl(172, 100%, 85%)"
                      };

                return (
                  <div 
                    key={cond} 
                    className={`chip-condicion-chico-tooltip ${estilosClases.chipCondicionChico}`}
                    style={{
                      ...estilosBase,
                      display: "inline-flex",
                      alignItems: "center"
                    }}
                  >
                    <span>{textoMostrar}</span>
                    <span className="tooltip-contenido">{tooltipTexto}</span>
                    <button
                      onClick={() => onQuitarCondicion(cond)}
                      className={estilosClases.botonQuitarCondicionChico}
                      style={{
                        color: estilosBase.color || "var(--color-borde-cian)",
                        marginLeft: "3px"
                      }}
                    >
                      <X size={8} />
                    </button>
                  </div>
                );
              })}

              {criatura.vidaActual > 0 && criatura.vidaActual < (criatura.vidaMaxima / 2) && (
                <div className={`chip-condicion-chico-tooltip ${estilosClases.chipCondicionChico} ${estilosClases.chipDesangrado}`}>
                  <span>🩸 DESANGRÁNDOSE</span>
                  <span className="tooltip-contenido">
                    {`DESANGRÁNDOSE (<50% de Vida)\n\n• Esta criatura está por debajo del 50% de sus puntos de golpe máximos.\n• Se aplica automáticamente y desaparecerá cuando recupere la salud por encima de la mitad.`}
                  </span>
                </div>
              )}
            </>
          ) : (
            <span className={estilosClases.textoCondicionesVacias}>Sin condiciones activas</span>
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
            criatura.efectos.map((ef) => {
              const efPredef = EFECTOS_PREDEFINIDOS.find(
                (ep) => ep.nombre.toLowerCase().includes(ef.nombre.toLowerCase()) || ef.nombre.toLowerCase().includes(ep.nombre.toLowerCase().split(" ")[0])
              );
              
              const esConcentracion = ef.concentracion === true;
              const tieneExpiracion = ef.expiraRonda !== undefined;
              
              let claseChipEfecto = estilosClases.chipEfectoPredefinido;
              let colorQuitar = "hsl(265, 95%, 90%)";
              if (esConcentracion) {
                claseChipEfecto = estilosClases.chipEfectoConcentracion;
                colorQuitar = "hsl(45, 100%, 75%)";
              } else if (!tieneExpiracion) {
                claseChipEfecto = estilosClases.chipEfectoPermanente;
                colorQuitar = "hsl(0, 0%, 85%)";
              }

              let textoExpiracion = "";
              let textoTooltipExpiracion = "Efecto activo permanente.";
              if (esConcentracion) {
                textoExpiracion = "";
                textoTooltipExpiracion = "Manteniendo concentración.";
              } else if (tieneExpiracion) {
                textoExpiracion = `R.${ef.expiraRonda}`;
                textoTooltipExpiracion = `Expira automáticamente en la ronda ${ef.expiraRonda}.`;
              } else {
                textoExpiracion = "∞";
              }

              const prefijoLabel = esConcentracion ? "[CON] " : "✨ ";
              const labelEfecto = `${prefijoLabel}${ef.nombre.toUpperCase()}`;

              const tooltipEfecto = efPredef
                ? `${efPredef.nombre} (${textoTooltipExpiracion})\n\n${efPredef.descripcion}`
                : `${ef.nombre} (${textoTooltipExpiracion})\n\nEfecto activo aplicado a esta criatura.`;

              return (
                <div key={ef.id} className={`chip-condicion-chico-tooltip ${estilosClases.chipCondicionChico} ${claseChipEfecto}`}>
                  <span>
                    {labelEfecto}
                    {textoExpiracion && (
                      <span className={estilosClases.badgeExpiracion}>
                        {tieneExpiracion ? "⏳ " : ""}{textoExpiracion}
                      </span>
                    )}
                  </span>
                  <span className="tooltip-contenido">{tooltipEfecto}</span>
                  <button
                    onClick={() => onQuitarEfecto(ef.id)}
                    className={estilosClases.botonQuitarCondicionChico}
                    style={{
                      color: colorQuitar,
                      marginLeft: "3px"
                    }}
                    title="Quitar efecto"
                  >
                    <X size={8} />
                  </button>
                </div>
              );
            })
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
                
                {/* Opción Personalizada */}
                <div
                  onClick={() => {
                    setDropdownAbierto(null);
                    setTimeout(() => {
                      const nombre = window.prompt("Nombre del efecto personalizado:");
                      if (!nombre) return;
                      const durStr = window.prompt("Duración en rondas:", "10");
                      if (!durStr) return;
                      const dur = parseInt(durStr, 10);
                      if (!isNaN(dur) && dur > 0) {
                        onAñadirEfecto(nombre, dur);
                      } else {
                        usarAlmacenDM.getState().agregarNotificacion("La duración debe ser un número entero mayor a 0.", "error");
                      }
                    }, 100);
                  }}
                  className={`${estilosClases.dropdownItem} ${estilosClases.dropdownItemPersonalizado}`}
                >
                  + Personalizado...
                </div>
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
                title={`Tirar ataque: d20${acc.bonificadorAtaque} | Daño: ${acc.dadosDaño}`}
              >
                <Swords size={10} style={{ color: "var(--color-peligro)" }} />
                <span>{acc.nombre} ({acc.bonificadorAtaque})</span>
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
