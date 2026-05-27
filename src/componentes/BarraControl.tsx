import React, { useState } from "react";
import { usarAlmacenDM, calcularVidaPorDados } from "../almacen/usarAlmacenDM";
import { CONDICIONES_2024 } from "../utiles/datosIniciales";
import {
  Save,
  FolderOpen,
  Plus,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  User,
  Skull
} from "lucide-react";

export const BarraControl: React.FC = () => {
  const {
    baseDatosMonstruos,
    colaIniciativa,
    rondaActual,
    indiceTurnoActivo,
    tipoTirada,
    metodoVidaMonstruo,
    encuentrosGuardados,
    avanzarTurno,
    retrocederTurno,
    avanzarRonda,
    retrocederRonda,
    establecerTipoTirada,
    agregarCriaturaAIniciativa,
    agregarCondicionACriatura,
    guardarEncuentroActual,
    cargarEncuentro,
    eliminarEncuentroGuardado
  } = usarAlmacenDM();

  const [nombreJugadorRapido, setNombreJugadorRapido] = useState("");
  const [busquedaCondicion, setBusquedaCondicion] = useState("");
  const [mostrarSugerenciasCond, setMostrarSugerenciasCond] = useState(false);
  const [destinatarioId, setDestinatarioId] = useState("");
  const [mostrarMenuCargar, setMostrarMenuCargar] = useState(false);
  const [dropdownDestinatarioAbierto, setDropdownDestinatarioAbierto] = useState(false);

  const condicionesFiltradas = CONDICIONES_2024.filter(
    (c) =>
      c.nombre.toLowerCase().includes(busquedaCondicion.toLowerCase()) ||
      c.nombre.split(" (")[0].toLowerCase().includes(busquedaCondicion.toLowerCase())
  );
  const [nombreEncuentroNuevo, setNombreEncuentroNuevo] = useState("");
  const [mostrarMenuGuardar, setMostrarMenuGuardar] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState("");
  const [exitoGuardar, setExitoGuardar] = useState("");

  const [busquedaMonstruo, setBusquedaMonstruo] = useState("");
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  // Añadir un monstruo de la base de datos a la iniciativa activa
  const manejarAñadirMonstruoPorPlantilla = (plantilla: any, limpiarBuscador = true) => {
    // Lanzamos iniciativa (1d20 + bonificador)
    const tiradaInic = Math.floor(Math.random() * 20) + 1;
    const totalInic = tiradaInic + plantilla.iniciativaBonificador;

    const vidaCalculada = calcularVidaPorDados(
      plantilla.vidaNotas || "",
      plantilla.vidaMaxima,
      metodoVidaMonstruo
    );

    agregarCriaturaAIniciativa(
      plantilla.nombre,
      totalInic,
      vidaCalculada,
      plantilla.ca,
      true, // esMonstruo
      plantilla.velocidad,
      plantilla.iniciativaBonificador
    );

    // Intentamos asociar el ID de plantilla recién añadido a la criatura de initiative si es posible
    const almacen = usarAlmacenDM.getState();
    const ultimaCriat = almacen.colaIniciativa[almacen.colaIniciativa.length - 1];
    if (ultimaCriat) {
      almacen.asociarPlantillaACriatura(ultimaCriat.id, plantilla.id);
    }

    if ((window as any).TS) {
      (window as any).TS.debug.log(`Añadido monstruo ${plantilla.nombre} a la iniciativa local. Tirada: ${tiradaInic} + ${plantilla.iniciativaBonificador} = ${totalInic}`);
    }

    if (limpiarBuscador) {
      setBusquedaMonstruo("");
      setMostrarSugerencias(false);
    }
  };

  // Añadir un jugador de forma rápida a la iniciativa
  const manejarAñadirJugadorRapido = () => {
    if (!nombreJugadorRapido.trim()) return;

    // Tirada de iniciativa para jugador
    const tiradaInic = Math.floor(Math.random() * 20) + 1;
    const totalInic = tiradaInic; // sin bonificador por defecto en rápido

    agregarCriaturaAIniciativa(
      nombreJugadorRapido.trim(),
      totalInic,
      30, // HP estándar rápido
      15, // CA estándar rápida
      false, // no es monstruo (es jugador)
      "30 pies",
      0
    );

    setNombreJugadorRapido("");
  };

  // Auto Roll para TODOS los monstruos de la iniciativa que tengan vida actual > 0
  const manejarAutoRollIniciativaMonstruos = () => {
    const monstruos = colaIniciativa.filter((c) => c.esMonstruo);
    if (monstruos.length === 0) return;

    monstruos.forEach((monstruo) => {
      const tirada = Math.floor(Math.random() * 20) + 1;
      const total = tirada + monstruo.bonificadorIniciativa;
      
      // Actualizamos su iniciativa en la cola
      const almacen = usarAlmacenDM.getState();
      const nuevaCola = almacen.colaIniciativa.map((c) => {
        if (c.id === monstruo.id) {
          return { ...c, iniciativa: total };
        }
        return c;
      });
      usarAlmacenDM.setState({ colaIniciativa: nuevaCola });
    });

    // Re-ordenamos la cola por iniciativa
    usarAlmacenDM.getState().ordenarIniciativa();
    
    if ((window as any).TS) {
      (window as any).TS.debug.log("Auto Roll completado de forma masiva para todos los monstruos de la cola.");
    }
  };

  // Añadir condición a una criatura de la iniciativa
  const manejarAñadirCondicionASeleccionada = (nombreCond: string) => {
    if (colaIniciativa.length === 0 || !nombreCond) return;
    const idDestino = destinatarioId || (colaIniciativa[indiceTurnoActivo] && colaIniciativa[indiceTurnoActivo].id);
    if (!idDestino) return;
    agregarCondicionACriatura(idDestino, nombreCond);
    setBusquedaCondicion("");
    setMostrarSugerenciasCond(false);
  };

  const ejecutarGuardarEncuentro = () => {
    if (!nombreEncuentroNuevo.trim()) {
      setErrorGuardar("El nombre es requerido.");
      return;
    }
    const exito = guardarEncuentroActual(nombreEncuentroNuevo);
    if (exito) {
      setExitoGuardar("Encuentro guardado!");
      setErrorGuardar("");
      setTimeout(() => {
        setMostrarMenuGuardar(false);
        setNombreEncuentroNuevo("");
        setExitoGuardar("");
      }, 1000);
    } else {
      setErrorGuardar("No se pudo guardar el encuentro.");
    }
  };

  const manejarSeleccionarEncuentroACargar = (nombre: string) => {
    const exito = cargarEncuentro(nombre);
    if (exito) {
      setMostrarMenuCargar(false);
    }
  };

  // Filtrar monstruos por la búsqueda (si está vacío, mostramos todos al hacer foco)
  const monstruosFiltrados = busquedaMonstruo.trim() === ""
    ? baseDatosMonstruos
    : baseDatosMonstruos.filter((m) =>
        m.nombre.toLowerCase().includes(busquedaMonstruo.toLowerCase())
      );

  return (
    <div style={estilos.barraControles}>
      {/* 1. Buscadores */}
      <div style={estilos.bloqueBusqueda}>
        <div style={{ ...estilos.campoBusqueda, position: "relative" }}>
          <Skull size={13} style={{ color: "var(--color-peligro)" }} />
          <input
            type="text"
            value={busquedaMonstruo}
            onChange={(e) => {
              setBusquedaMonstruo(e.target.value);
              setMostrarSugerencias(true);
            }}
            onFocus={() => setMostrarSugerencias(true)}
            onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
            placeholder="Buscar monstruo..."
            style={estilos.inputBrutal}
            onKeyDown={(e) => {
              if (e.key === "Enter" && monstruosFiltrados.length > 0) {
                manejarAñadirMonstruoPorPlantilla(monstruosFiltrados[0], true);
              }
            }}
          />
          {busquedaMonstruo && (
            <button
              onClick={() => {
                setBusquedaMonstruo("");
                setMostrarSugerencias(false);
              }}
              style={estilos.botonLimpiarBusqueda}
              title="Limpiar"
            >
              x
            </button>
          )}

          {/* Menú de sugerencias flotantes */}
          {mostrarSugerencias && monstruosFiltrados.length > 0 && (
            <div style={estilos.sugerenciasContenedor}>
              {monstruosFiltrados.slice(0, 15).map((m) => (
                <div
                  key={m.id}
                  onClick={() => manejarAñadirMonstruoPorPlantilla(m, true)}
                  style={{
                    ...estilos.sugerenciaItem,
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
                    <span style={estilos.sugerenciaNombre}>{m.nombre}</span>
                    <span style={estilos.sugerenciaSub}>
                      CA {m.ca} | HP {m.vidaMaxima} | Desafío {m.desafio || "—"}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      manejarAñadirMonstruoPorPlantilla(m, false);
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    style={estilos.botonSugerenciaAñadirMasivo}
                    title="Añadir masivo (manteniendo el buscador abierto)"
                  >
                    <Plus size={10} />
                  </button>
                </div>
              ))}
              {monstruosFiltrados.length > 15 && (
                <div style={estilos.sugerenciaMas}>
                  Y {monstruosFiltrados.length - 15} más...
                </div>
              )}
            </div>
          )}
        </div>


        <div style={estilos.campoBusqueda}>
          <User size={13} style={{ color: "var(--color-borde-cian)" }} />
          <input
            type="text"
            value={nombreJugadorRapido}
            onChange={(e) => setNombreJugadorRapido(e.target.value)}
            placeholder="Añadir Jugador Rápido..."
            style={estilos.inputBrutal}
            onKeyDown={(e) => e.key === "Enter" && manejarAñadirJugadorRapido()}
          />
          <button onClick={manejarAñadirJugadorRapido} style={estilos.botonAñadir} title="Añadir jugador">
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* 2. Guardar y Cargar Encuentros */}
      <div style={estilos.grupoGuardar}>
        <div style={{ position: "relative" }}>
          <button 
            onClick={() => {
              setMostrarMenuGuardar(!mostrarMenuGuardar);
              setMostrarMenuCargar(false);
              setErrorGuardar("");
              setExitoGuardar("");
              const fecha = new Date();
              const fechaStr = `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
              const horaStr = `${fecha.getHours().toString().padStart(2, '0')}:${fecha.getMinutes().toString().padStart(2, '0')}`;
              setNombreEncuentroNuevo(`Encuentro ${fechaStr} - ${horaStr}`);
            }} 
            style={{
              ...estilos.botonIcono,
              ...(mostrarMenuGuardar ? estilos.botonActivo : {})
            }}
            title="Guardar Encuentro"
          >
            <Save size={14} />
            <span>Guardar</span>
          </button>

          {mostrarMenuGuardar && (
            <div style={{ ...estilos.menuDesplegable, width: "230px", left: 0 }}>
              <div style={estilos.cabeceraDesplegable}>GUARDAR ENCUENTRO ACTUAL</div>
              {colaIniciativa.length === 0 ? (
                <div style={{ ...estilos.itemVacio, color: "var(--color-daño)" }}>
                  La iniciativa está vacía. Añade criaturas antes de guardar.
                </div>
              ) : (
                <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <input
                    type="text"
                    value={nombreEncuentroNuevo}
                    onChange={(e) => {
                      setNombreEncuentroNuevo(e.target.value);
                      setErrorGuardar("");
                      setExitoGuardar("");
                    }}
                    placeholder="Nombre del encuentro..."
                    style={{ 
                      ...estilos.inputBrutal, 
                      width: "100%", 
                      boxSizing: "border-box",
                      height: "26px",
                      fontSize: "11px",
                      padding: "2px 6px"
                    }}
                    onKeyDown={(e) => e.key === "Enter" && ejecutarGuardarEncuentro()}
                  />
                  {errorGuardar && (
                    <div style={{ fontSize: "10px", color: "var(--color-daño)", padding: "0 2px" }}>{errorGuardar}</div>
                  )}
                  {exitoGuardar && (
                    <div style={{ fontSize: "10px", color: "var(--color-exito)", padding: "0 2px" }}>{exitoGuardar}</div>
                  )}
                  <button
                    onClick={ejecutarGuardarEncuentro}
                    style={{
                      ...estilos.botonAñadir,
                      width: "100%",
                      justifyContent: "center",
                      backgroundColor: "var(--color-borde-cian)",
                      color: "#111424",
                      border: "none",
                      height: "26px",
                      fontSize: "11px",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    Confirmar Guardar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ position: "relative" }}>
          <button
            onClick={() => setMostrarMenuCargar(!mostrarMenuCargar)}
            style={{
              ...estilos.botonIcono,
              ...(mostrarMenuCargar ? estilos.botonActivo : {})
            }}
            title="Cargar Encuentro"
          >
            <FolderOpen size={14} />
            <span>Cargar</span>
          </button>

          {mostrarMenuCargar && (
            <div style={estilos.menuDesplegable}>
              <div style={estilos.cabeceraDesplegable}>ENCUENTROS GUARDADOS</div>
              {encuentrosGuardados.length === 0 ? (
                <div style={estilos.itemVacio}>No hay encuentros.</div>
              ) : (
                encuentrosGuardados.map((e) => (
                  <div key={e.nombre} style={estilos.itemDesplegable}>
                    <span
                      onClick={() => manejarSeleccionarEncuentroACargar(e.nombre)}
                      style={estilos.textoItemDesplegable}
                    >
                      {e.nombre} ({e.cola.length} criat.)
                    </span>
                    <button
                      onClick={() => eliminarEncuentroGuardado(e.nombre)}
                      style={estilos.botonEliminarItem}
                    >
                      X
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      {/* 4. Botones de Acción */}
      <div style={estilos.grupoAcciones}>
        <button onClick={manejarAutoRollIniciativaMonstruos} style={estilos.botonAccionPrincipal} title="Lanzar iniciativa masiva de monstruos">
          <AlertTriangle size={13} style={{ color: "var(--color-advertencia)" }} />
          Auto Roll
        </button>

        <button onClick={retrocederTurno} style={estilos.botonNavegacionTurno} title="Turno anterior">
          <ChevronLeft size={16} />
        </button>
        
        <button onClick={avanzarTurno} style={estilos.botonNavegacionTurno} title="Siguiente Turno">
          <ChevronRight size={16} />
        </button>
      </div>
      {/* 3. Selector de Ventaja / Desventaja */}
      <div style={estilos.grupoVentaja}>
        <button
          onClick={() => establecerTipoTirada("desventaja")}
          style={{
            ...estilos.botonTirada,
            ...(tipoTirada === "desventaja" ? estilos.botonDesventajaActivo : {})
          }}
        >
          DesVent
        </button>
        <button
          onClick={() => establecerTipoTirada("plano")}
          style={{
            ...estilos.botonTirada,
            ...(tipoTirada === "plano" ? estilos.botonPlanoActivo : {})
          }}
        >
          Plano
        </button>
        <button
          onClick={() => establecerTipoTirada("ventaja")}
          style={{
            ...estilos.botonTirada,
            ...(tipoTirada === "ventaja" ? estilos.botonVentajaActivo : {})
          }}
        >
          Vent
        </button>
      </div>

      {/* 5. Selector de Condiciones con Barra de Búsqueda Inteligente */}
      <div style={{ ...estilos.bloqueCondiciones, position: "relative", width: "370px", overflow: "visible" }}>
        {/* Selector de Destinatario */}
        <div style={{ position: "relative", display: "inline-block", alignSelf: "center" }}>
          <button
            onClick={() => setDropdownDestinatarioAbierto(!dropdownDestinatarioAbierto)}
            style={{
              height: "22px",
              backgroundColor: "var(--color-fondo-panel)",
              border: "1px solid var(--color-borde-brutal)",
              color: "var(--color-texto-principal)",
              fontSize: "10px",
              borderRadius: "3px",
              padding: "0 6px",
              cursor: "pointer",
              width: "190px",
              outline: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: "var(--fuente-codigo)",
              textAlign: "left",
              textTransform: "uppercase"
            }}
            title="Destinatario de la condición"
          >
            <span>
              {destinatarioId
                ? ` ${
                    colaIniciativa.find((c) => c.id === destinatarioId)?.nombre.substring(0, 18) || "Alguien"
                  }...`
                : " [ACTIVO]"}
            </span>
            <span style={{ fontSize: "8px", marginLeft: "2px" }}>▼</span>
          </button>

          {dropdownDestinatarioAbierto && (
            <div
              style={{
                position: "absolute",
                top: "24px",
                left: 0,
                backgroundColor: "hsl(222, 25%, 5%)",
                border: "1px solid var(--color-borde-cian)",
                borderRadius: "4px",
                zIndex: 9999,
                maxHeight: "160px",
                overflowY: "auto",
                width: "140px",
                boxShadow: "0 6px 16px rgba(0, 0, 0, 0.6)"
              }}
            >
              <div
                onClick={() => {
                  setDestinatarioId("");
                  setDropdownDestinatarioAbierto(false);
                }}
                style={{
                  padding: "5px 8px",
                  fontSize: "9.5px",
                  fontWeight: "bold",
                  color: "var(--color-borde-cian)",
                  cursor: "pointer",
                  borderBottom: "1px dashed rgba(255,255,255,0.08)",
                  fontFamily: "var(--fuente-codigo)",
                  textTransform: "uppercase",
                  backgroundColor: "transparent"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(0, 245, 212, 0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                👤 [ACTIVO] (TURNO CORRIENTE)
              </div>
              {colaIniciativa.map((cri) => (
                <div
                  key={cri.id}
                  onClick={() => {
                    setDestinatarioId(cri.id);
                    setDropdownDestinatarioAbierto(false);
                  }}
                  style={{
                    padding: "5px 8px",
                    fontSize: "9.5px",
                    fontWeight: "bold",
                    color: cri.esMonstruo ? "#d8b4fe" : "var(--color-texto-principal)",
                    cursor: "pointer",
                    borderBottom: "1px solid rgba(255,255,255,0.02)",
                    fontFamily: "var(--fuente-codigo)",
                    textTransform: "uppercase",
                    backgroundColor: "transparent",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = cri.esMonstruo ? "rgba(157, 78, 221, 0.08)" : "rgba(0, 245, 212, 0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <span>{cri.nombre.length > 12 ? cri.nombre.substring(0, 12) + "..." : cri.nombre}</span>
                  <span style={{ fontSize: "8px", opacity: 0.6 }}>
                    {cri.esMonstruo ? "MON" : "PJ"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input de Búsqueda de Condición */}
        <div style={{ position: "relative", flexGrow: 1, display: "flex", flexDirection: "column", alignSelf: "center" }}>
          <input
            type="text"
            value={busquedaCondicion}
            onChange={(e) => {
              setBusquedaCondicion(e.target.value);
              setMostrarSugerenciasCond(true);
            }}
            onFocus={() => setMostrarSugerenciasCond(true)}
            onBlur={() => setTimeout(() => setMostrarSugerenciasCond(false), 250)}
            placeholder="🔍 CONDICIÓN..."
            style={{
              height: "22px",
              backgroundColor: "var(--color-fondo-profundo)",
              border: "1px solid var(--color-borde-brutal)",
              color: "var(--color-texto-principal)",
              fontSize: "10px",
              borderRadius: "3px",
              padding: "0 6px",
              width: "100%",
              outline: "none",
              textTransform: "uppercase"
            }}
          />

          {/* Lista de Sugerencias Flotantes */}
          {mostrarSugerenciasCond && busquedaCondicion.trim() !== "" && (
            <div
              style={{
                position: "absolute",
                top: "26px",
                left: 0,
                right: 0,
                backgroundColor: "hsl(222, 25%, 5%)",
                border: "1px solid var(--color-borde-cian)",
                borderRadius: "4px",
                zIndex: 9999,
                maxHeight: "160px",
                overflowY: "auto",
                boxShadow: "0 6px 16px rgba(0, 0, 0, 0.6)"
              }}
            >
              {condicionesFiltradas.length > 0 ? (
                condicionesFiltradas.map((cond) => {
                  const nombreLimpio = cond.nombre.split(" (")[0];
                  return (
                    <div
                      key={cond.nombre}
                      onMouseDown={(e) => {
                        e.preventDefault(); // Evita que pierda el focus antes del click
                      }}
                      onClick={() => {
                        manejarAñadirCondicionASeleccionada(nombreLimpio);
                      }}
                      style={{
                        padding: "5px 8px",
                        fontSize: "9.5px",
                        fontWeight: "bold",
                        fontFamily: "monospace",
                        color: "hsl(172, 100%, 85%)",
                        cursor: "pointer",
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                        textTransform: "uppercase",
                        backgroundColor: "transparent"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(0, 245, 212, 0.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {nombreLimpio}
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: "5px 8px", fontSize: "9.5px", color: "var(--color-texto-secundario)", fontStyle: "italic" }}>
                  Sin coincidencias.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botón Añadir */}
        <button
          onClick={() => {
            if (busquedaCondicion.trim() !== "") {
              const primeraCoincidencia = condicionesFiltradas[0];
              const condElegida = primeraCoincidencia ? primeraCoincidencia.nombre.split(" (")[0] : busquedaCondicion;
              manejarAñadirCondicionASeleccionada(condElegida);
            }
          }}
          style={{
            border: "1px solid var(--color-borde-cian)",
            background: "rgba(0, 245, 212, 0.1)",
            color: "var(--color-borde-cian)",
            fontSize: "11px",
            fontWeight: "bold",
            padding: "0 8px",
            cursor: "pointer",
            height: "22px",
            borderRadius: "3px",
            display: "flex",
            alignItems: "center",
            alignSelf: "center"
          }}
          title="Añadir condición"
        >
          +
        </button>
      </div>

      

      {/* 6. Indicador de Ronda */}
      <div style={estilos.indicadorRonda}>
        <button onClick={retrocederRonda} style={estilos.botonRondaPaso}>-</button>
        <span style={estilos.rondaTexto}>
          RONDA: <span className="dato-numerico" style={{ color: "var(--color-borde-cian)" }}>{rondaActual}</span>
        </span>
        <button onClick={avanzarRonda} style={estilos.botonRondaPaso}>+</button>
      </div>
    </div>
  );
};

const estilos: { [key: string]: React.CSSProperties } = {
  barraControles: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "8px",
    justifyContent: "space-around",
    backgroundColor: "var(--color-fondo-panel)",
    borderBottom: "1px solid var(--color-borde-brutal)",
    padding: "6px 8px",
    width: "100%",
    zIndex: 10,
    flexShrink: 0
  },
  bloqueBusqueda: {
    display: "flex",
    flexDirection: "row",
    gap: "6px"
  },
  campoBusqueda: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "4px",
    border: "1px solid var(--color-borde-brutal)",
    padding: "3px 6px",
    backgroundColor: "var(--color-fondo-tarjeta)",
    height: "30px"
  },
  selectBrutal: {
    border: "none",
    background: "none",
    fontSize: "12px",
    padding: "0",
    width: "170px",
    cursor: "pointer",
    color: "var(--color-texto-principal)"
  },
  inputBrutal: {
    border: "none",
    background: "none",
    fontSize: "12px",
    padding: "0",
    width: "160px",
    color: "var(--color-texto-principal)"
  },
  botonAñadir: {
    border: "none",
    background: "none",
    color: "var(--color-texto-secundario)",
    padding: "0 4px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center"
  },
  grupoGuardar: {
    display: "flex",
    flexDirection: "row",
    gap: "4px"
  },
  botonIcono: {
    height: "30px",
    fontSize: "12px",
    padding: "4px 8px",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  botonActivo: {
    backgroundColor: "var(--color-primario)",
    borderColor: "var(--color-borde-cian)"
  },
  menuDesplegable: {
    position: "absolute",
    top: "32px",
    left: "0",
    backgroundColor: "var(--color-fondo-tarjeta)",
    border: "1px solid var(--color-borde-neon)",
    padding: "4px",
    width: "220px",
    zIndex: 20,
    boxShadow: "0 4px 8px rgba(0,0,0,0.5)"
  },
  cabeceraDesplegable: {
    fontSize: "11px",
    fontWeight: "bold",
    color: "var(--color-texto-apagado)",
    borderBottom: "1px solid var(--color-borde-brutal)",
    paddingBottom: "4px",
    marginBottom: "4px"
  },
  itemVacio: {
    fontSize: "12px",
    color: "var(--color-texto-apagado)",
    textAlign: "center",
    padding: "6px"
  },
  itemDesplegable: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4px 6px",
    fontSize: "12px",
    borderBottom: "1px solid var(--color-borde-brutal)"
  },
  textoItemDesplegable: {
    cursor: "pointer",
    flexGrow: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  botonEliminarItem: {
    background: "none",
    border: "none",
    color: "var(--color-peligro)",
    fontSize: "11px",
    cursor: "pointer",
    padding: "0 4px"
  },
  grupoVentaja: {
    display: "flex",
    flexDirection: "row",
    border: "1px solid var(--color-borde-brutal)",
    padding: "2px"
  },
  botonTirada: {
    height: "24px",
    fontSize: "11px",
    padding: "2px 8px",
    border: "none",
    background: "none",
    cursor: "pointer"
  },
  botonDesventajaActivo: {
    backgroundColor: "rgba(242, 92, 84, 0.2)",
    color: "var(--color-peligro)",
    fontWeight: "bold"
  },
  botonPlanoActivo: {
    backgroundColor: "var(--color-primario)",
    color: "#ffffff",
    fontWeight: "bold"
  },
  botonVentajaActivo: {
    backgroundColor: "rgba(0, 245, 212, 0.2)",
    color: "var(--color-exito)",
    fontWeight: "bold"
  },
  bloqueCondiciones: {
    display: "flex",
    flexDirection: "row",
    gap: "4px",
    border: "1px solid var(--color-borde-brutal)",
    padding: "3px 6px",
    backgroundColor: "var(--color-fondo-tarjeta)",
    height: "30px"
  },
  selectCondicion: {
    border: "none",
    background: "none",
    fontSize: "12px",
    width: "110px",
    cursor: "pointer",
    color: "var(--color-texto-principal)",
    outline: "none",
    padding: "2px 4px"
  },
  botonCondicion: {
    border: "none",
    background: "var(--color-fondo-panel)",
    fontSize: "11px",
    padding: "0 8px",
    cursor: "pointer",
    height: "22px",
    display: "flex",
    alignItems: "center",
    color: "var(--color-texto-principal)"
  },
  grupoAcciones: {
    display: "flex",
    flexDirection: "row",
    gap: "4px"
  },
  botonAccionPrincipal: {
    height: "30px",
    fontSize: "12px",
    padding: "4px 8px",
    display: "flex",
    alignItems: "center",
    gap: "5px"
  },
  botonNavegacionTurno: {
    height: "30px",
    width: "28px",
    padding: "0"
  },
  indicadorRonda: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "6px",
    border: "1px solid var(--color-borde-brutal)",
    backgroundColor: "var(--color-fondo-tarjeta)",
    padding: "3px 6px",
    height: "30px",
    marginLeft: "auto" // Empuja a la extrema derecha
  },
  botonRondaPaso: {
    border: "none",
    background: "none",
    color: "var(--color-texto-secundario)",
    fontWeight: "bold",
    cursor: "pointer",
    padding: "0 6px",
    fontSize: "14px"
  },
  rondaTexto: {
    fontSize: "12px",
    fontWeight: "bold",
    whiteSpace: "nowrap"
  },
  botonLimpiarBusqueda: {
    border: "none",
    background: "none",
    color: "var(--color-texto-secundario)",
    fontSize: "11px",
    cursor: "pointer",
    padding: "0 4px",
    display: "flex",
    alignItems: "center"
  },
  sugerenciasContenedor: {
    position: "absolute",
    top: "32px",
    left: "0",
    width: "240px",
    backgroundColor: "var(--color-fondo-tarjeta)",
    border: "1px solid var(--color-borde-neon)",
    zIndex: 30,
    boxShadow: "0 4px 8px rgba(0,0,0,0.5)",
    maxHeight: "260px",
    overflowY: "auto"
  },
  sugerenciaItem: {
    padding: "6px 8px",
    cursor: "pointer",
    borderBottom: "1px solid var(--color-borde-brutal)",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    textAlign: "left"
  },
  sugerenciaNombre: {
    fontSize: "12px",
    fontWeight: "bold",
    color: "var(--color-texto-principal)"
  },
  sugerenciaSub: {
    fontSize: "10px",
    color: "var(--color-texto-secundario)"
  },
  sugerenciaMas: {
    padding: "4px 8px",
    fontSize: "9px",
    color: "var(--color-texto-apagado)",
    textAlign: "center",
    backgroundColor: "rgba(255, 255, 255, 0.02)"
  },
  botonSugerenciaAñadirMasivo: {
    border: "1px solid var(--color-borde-neon)",
    background: "rgba(0, 242, 254, 0.15)",
    color: "var(--color-texto-cyan)",
    borderRadius: "2px",
    width: "22px",
    height: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: "0"
  }
};
