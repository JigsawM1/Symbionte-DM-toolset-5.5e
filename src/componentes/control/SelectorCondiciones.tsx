import React, { useState } from "react";
import { usarAlmacenDM, normalizarTexto } from "../../almacen/usarAlmacenDM";
import { CONDICIONES_2024, EFECTOS_PREDEFINIDOS } from "../../utiles/datosIniciales";
import type { Caracteristica } from "../../tipos";
import type { ResultadoSalvacionArea } from "../../almacen/slices/sliceIniciativa";
import { ShieldAlert, X } from "lucide-react";
import estilosClases from "./SelectorCondiciones.module.css";

interface ElementoEstadoCombate {
  nombre: string;
  tipo: "condicion" | "efecto";
  duracion?: number;
  esConcentracion?: boolean;
}

const LISTA_CARACTERISTICAS: { clave: Caracteristica; etiqueta: string }[] = [
  { clave: "fuerza", etiqueta: "FUE" },
  { clave: "destreza", etiqueta: "DES" },
  { clave: "constitucion", etiqueta: "CON" },
  { clave: "inteligencia", etiqueta: "INT" },
  { clave: "sabiduria", etiqueta: "SAB" },
  { clave: "carisma", etiqueta: "CAR" }
];

export const SelectorCondiciones: React.FC = () => {
  const colaIniciativa = usarAlmacenDM((s) => s.colaIniciativa);
  const indiceTurnoActivo = usarAlmacenDM((s) => s.indiceTurnoActivo);
  const criaturasSeleccionadas = usarAlmacenDM((s) => s.criaturasSeleccionadas);

  const aplicarDañoEnArea = usarAlmacenDM((s) => s.aplicarDañoEnArea);
  const aplicarCondicionEnArea = usarAlmacenDM((s) => s.aplicarCondicionEnArea);
  const aplicarEfectoEnArea = usarAlmacenDM((s) => s.aplicarEfectoEnArea);
  const ejecutarSalvacionEnArea = usarAlmacenDM((s) => s.ejecutarSalvacionEnArea);

  const [cantidadDaño, setCantidadDaño] = useState("");
  const [busquedaEstado, setBusquedaEstado] = useState("");
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [targetModo, setTargetModo] = useState<string>("AUTO");
  const [dropdownTargetAbierto, setDropdownTargetAbierto] = useState(false);

  // Estados para Tirada de Salvación en Área
  const [cdSalvacion, setCdSalvacion] = useState("");
  const [caracteristicaSalvacion, setCaracteristicaSalvacion] = useState<Caracteristica>("destreza");
  const [mitigacionSalvacion, setMitigacionSalvacion] = useState<"mitad" | "nada">("mitad");
  const [dropdownCaracAbierto, setDropdownCaracAbierto] = useState(false);
  const [dropdownMitigAbierto, setDropdownMitigAbierto] = useState(false);
  const [resultadoSalvacion, setResultadoSalvacion] = useState<ResultadoSalvacionArea | null>(null);

  // Criaturas de TaleSpire seleccionadas que coinciden en la cola de iniciativa
  const seleccionadasEnCola = (criaturasSeleccionadas || []).filter((s) =>
    colaIniciativa.some((c) => c.id === s.id)
  );
  const numSeleccionadas = seleccionadasEnCola.length;

  // Determinar los IDs de las criaturas objetivo
  const resolverIdsObjetivo = (): string[] | undefined => {
    if (targetModo === "AUTO") {
      if (numSeleccionadas > 0) {
        return seleccionadasEnCola.map((s) => s.id);
      }
      const act = colaIniciativa[indiceTurnoActivo];
      return act ? [act.id] : undefined;
    }
    if (targetModo === "SELECCION") {
      return seleccionadasEnCola.map((s) => s.id);
    }
    if (targetModo === "ACTIVO") {
      const act = colaIniciativa[indiceTurnoActivo];
      return act ? [act.id] : undefined;
    }
    return [targetModo];
  };

  // Etiqueta para el botón de objetivo
  const obtenerEtiquetaTarget = (): string => {
    if (targetModo === "AUTO") {
      return numSeleccionadas > 0 ? `SELECCIÓN (${numSeleccionadas})` : "[ACTIVO]";
    }
    if (targetModo === "SELECCION") {
      return `SELECCIÓN (${numSeleccionadas})`;
    }
    if (targetModo === "ACTIVO") {
      return "[ACTIVO]";
    }
    const cri = colaIniciativa.find((c) => c.id === targetModo);
    return cri ? (cri.nombre.length > 13 ? cri.nombre.substring(0, 13) + "..." : cri.nombre) : "[ACTIVO]";
  };

  // Daño y Curación en Área Directo
  const manejarAplicarDaño = (esCuracion: boolean) => {
    const val = parseInt(cantidadDaño, 10);
    if (isNaN(val) || val <= 0) return;
    const finalCantidad = esCuracion ? -val : val;
    aplicarDañoEnArea(finalCantidad, resolverIdsObjetivo());
    setCantidadDaño("");
  };

  // Lista combinada de Condiciones y Efectos
  const listaCombinadaEstados: ElementoEstadoCombate[] = [
    ...CONDICIONES_2024.map((c) => ({
      nombre: c.nombre.split(" (")[0],
      tipo: "condicion" as const
    })),
    ...EFECTOS_PREDEFINIDOS.map((e) => ({
      nombre: e.nombre,
      tipo: "efecto" as const,
      duracion: e.duracionEstandar,
      esConcentracion: e.esConcentracion
    }))
  ];

  const queryNorm = normalizarTexto(busquedaEstado);
  const sugerenciasFiltradas = listaCombinadaEstados.filter((item) =>
    normalizarTexto(item.nombre).includes(queryNorm)
  );

  const manejarAplicarEstadoDirecto = (item: ElementoEstadoCombate) => {
    const targets = resolverIdsObjetivo();
    if (item.tipo === "condicion") {
      aplicarCondicionEnArea(item.nombre, targets);
    } else {
      aplicarEfectoEnArea(
        item.nombre,
        item.duracion || 10,
        { concentracion: item.esConcentracion },
        targets
      );
    }
    setBusquedaEstado("");
    setMostrarSugerencias(false);
  };

  // Ejecutar Tirada de Salvación en Área
  const manejarEjecutarSalvacion = () => {
    const cdVal = parseInt(cdSalvacion, 10);
    if (isNaN(cdVal) || cdVal <= 0) return;

    const dañoVal = parseInt(cantidadDaño, 10);
    const dañoBruto = !isNaN(dañoVal) && dañoVal > 0 ? dañoVal : undefined;

    let condicionObj: { nombre: string; tipo: "condicion" | "efecto"; duracion?: number; esConcentracion?: boolean } | undefined = undefined;
    if (busquedaEstado.trim() !== "") {
      const co = sugerenciasFiltradas.find((item) => item.nombre.toLowerCase() === busquedaEstado.trim().toLowerCase()) || sugerenciasFiltradas[0];
      if (co) {
        condicionObj = { nombre: co.nombre, tipo: co.tipo, duracion: co.duracion, esConcentracion: co.esConcentracion };
      } else {
        condicionObj = { nombre: busquedaEstado.trim(), tipo: "condicion" };
      }
    }

    const res = ejecutarSalvacionEnArea(
      caracteristicaSalvacion,
      cdVal,
      dañoBruto,
      condicionObj,
      mitigacionSalvacion,
      resolverIdsObjetivo()
    );

    if (res) {
      setResultadoSalvacion(res);
      setCantidadDaño("");
      setBusquedaEstado("");
    }
  };

  return (
    <div className={estilosClases.bloqueCondiciones}>
      {/* 1. Selector de Target */}
      <div className={estilosClases.contenedorTarget}>
        <button
          onClick={() => {
            setDropdownTargetAbierto(!dropdownTargetAbierto);
            setDropdownCaracAbierto(false);
            setDropdownMitigAbierto(false);
          }}
          className={`${estilosClases.botonDestinatario} ${
            numSeleccionadas > 0 && targetModo !== "ACTIVO" ? estilosClases.botonDestinatarioSeleccion : ""
          }`}
          title="Objetivo del daño / condición / efecto / salvación"
        >
          <span>{obtenerEtiquetaTarget()}</span>
          <span style={{ fontSize: "8px", marginLeft: "3px" }}>▼</span>
        </button>

        {dropdownTargetAbierto && (
          <div className={estilosClases.dropdownDestinatarios}>
            <div
              onClick={() => {
                setTargetModo("AUTO");
                setDropdownTargetAbierto(false);
              }}
              className={estilosClases.dropdownItemActivo}
            >
              AUTO ({numSeleccionadas > 0 ? `SELECCIÓN ${numSeleccionadas}` : "ACTIVO"})
            </div>
            {numSeleccionadas > 0 && (
              <div
                onClick={() => {
                  setTargetModo("SELECCION");
                  setDropdownTargetAbierto(false);
                }}
                className={estilosClases.dropdownItemSeleccion}
              >
                SELECCIÓN TALESPIRE ({numSeleccionadas})
              </div>
            )}
            <div
              onClick={() => {
                setTargetModo("ACTIVO");
                setDropdownTargetAbierto(false);
              }}
              className={estilosClases.dropdownItemActivo}
            >
              TURNO ACTIVO
            </div>
            {colaIniciativa.map((cri) => (
              <div
                key={cri.id}
                onClick={() => {
                  setTargetModo(cri.id);
                  setDropdownTargetAbierto(false);
                }}
                className={`${estilosClases.dropdownItemCriatura} ${
                  cri.esMonstruo ? estilosClases.dropdownItemCriaturaMonstruo : estilosClases.dropdownItemCriaturaPJ
                }`}
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

      {/* 2. Sección de Daño / Curación Directa */}
      <div className={estilosClases.seccionDaño}>
        <input
          type="number"
          min="1"
          value={cantidadDaño}
          onChange={(e) => setCantidadDaño(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && manejarAplicarDaño(false)}
          placeholder="DAÑO..."
          className={estilosClases.inputDaño}
        />
        <button
          onClick={() => manejarAplicarDaño(false)}
          className={estilosClases.botonDaño}
          title="Aplicar daño directo al objetivo"
        >
          - DAÑO
        </button>
        <button
          onClick={() => manejarAplicarDaño(true)}
          className={estilosClases.botonCurar}
          title="Aplicar curación al objetivo"
        >
          + CURAR
        </button>
      </div>

      {/* 3. Búsqueda de Condiciones / Efectos (Seleccionar completa el campo) */}
      <div className={estilosClases.seccionEstado}>
        <input
          type="text"
          value={busquedaEstado}
          onChange={(e) => {
            setBusquedaEstado(e.target.value);
            setMostrarSugerencias(true);
          }}
          onFocus={() => setMostrarSugerencias(true)}
          onBlur={() => setTimeout(() => setMostrarSugerencias(false), 250)}
          placeholder="CONDICIÓN / EFECTO..."
          className={estilosClases.inputBrutal}
        />

        {mostrarSugerencias && busquedaEstado.trim() !== "" && (
          <div className={estilosClases.sugerenciasContenedor}>
            {sugerenciasFiltradas.length > 0 ? (
              sugerenciasFiltradas.map((item) => (
                <div
                  key={`${item.tipo}-${item.nombre}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setBusquedaEstado(item.nombre);
                    setMostrarSugerencias(false);
                  }}
                  className={estilosClases.sugerenciaItem}
                >
                  <span className={estilosClases.sugerenciaNombre}>{item.nombre}</span>
                  <span
                    className={`${estilosClases.badgeTipo} ${
                      item.tipo === "condicion" ? estilosClases.badgeCondicion : estilosClases.badgeEfecto
                    }`}
                  >
                    {item.tipo === "condicion" ? "CONDICIÓN" : "EFECTO"}
                  </span>
                </div>
              ))
            ) : (
              <div className={estilosClases.sugerenciaVacio}>Sin coincidencias</div>
            )}
          </div>
        )}

        <button
          onClick={() => {
            if (busquedaEstado.trim() !== "") {
              const primera = sugerenciasFiltradas.find((i) => i.nombre.toLowerCase() === busquedaEstado.trim().toLowerCase()) || sugerenciasFiltradas[0];
              if (primera) {
                manejarAplicarEstadoDirecto(primera);
              } else {
                aplicarCondicionEnArea(busquedaEstado.trim(), resolverIdsObjetivo());
                setBusquedaEstado("");
              }
            }
          }}
          className={estilosClases.botonAñadirEstado}
          title="Añadir condición o efecto directo sin tirada"
        >
          +
        </button>
      </div>

      {/* 4. Sección de Tirada de Salvación en Área */}
      <div className={estilosClases.seccionSalvacion}>
        {/* Dropdown Custom Característica */}
        <div className={estilosClases.contenedorDropdownCustom}>
          <button
            type="button"
            onClick={() => {
              setDropdownCaracAbierto(!dropdownCaracAbierto);
              setDropdownMitigAbierto(false);
              setDropdownTargetAbierto(false);
            }}
            className={estilosClases.botonCustomSelectCarac}
            title="Característica para la salvación"
          >
            <span>{caracteristicaSalvacion.substring(0, 3).toUpperCase()}</span>
            <span style={{ fontSize: "8px", marginLeft: "2px" }}>▼</span>
          </button>

          {dropdownCaracAbierto && (
            <div className={estilosClases.dropdownCustomMenu}>
              {LISTA_CARACTERISTICAS.map((item) => (
                <div
                  key={item.clave}
                  onClick={() => {
                    setCaracteristicaSalvacion(item.clave);
                    setDropdownCaracAbierto(false);
                  }}
                  className={`${estilosClases.dropdownCustomItem} ${
                    caracteristicaSalvacion === item.clave ? estilosClases.dropdownCustomItemActivo : ""
                  }`}
                >
                  {item.etiqueta}
                </div>
              ))}
            </div>
          )}
        </div>

        <input
          type="number"
          min="1"
          value={cdSalvacion}
          onChange={(e) => setCdSalvacion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && manejarEjecutarSalvacion()}
          placeholder="CD..."
          className={estilosClases.inputCD}
          title="Dificultad CD para la salvación"
        />

        {/* Dropdown Custom Mitigación */}
        <div className={estilosClases.contenedorDropdownCustom}>
          <button
            type="button"
            onClick={() => {
              setDropdownMitigAbierto(!dropdownMitigAbierto);
              setDropdownCaracAbierto(false);
              setDropdownTargetAbierto(false);
            }}
            className={estilosClases.botonCustomSelectMitig}
            title="Regla de daño si supera la salvación"
          >
            <span>{mitigacionSalvacion === "mitad" ? "1/2 DAÑO" : "0 DAÑO"}</span>
            <span style={{ fontSize: "8px", marginLeft: "2px" }}>▼</span>
          </button>

          {dropdownMitigAbierto && (
            <div className={estilosClases.dropdownCustomMenu} style={{ width: "120px" }}>
              <div
                onClick={() => {
                  setMitigacionSalvacion("mitad");
                  setDropdownMitigAbierto(false);
                }}
                className={`${estilosClases.dropdownCustomItem} ${
                  mitigacionSalvacion === "mitad" ? estilosClases.dropdownCustomItemActivo : ""
                }`}
              >
                1/2 DAÑO EN ÉXITO
              </div>
              <div
                onClick={() => {
                  setMitigacionSalvacion("nada");
                  setDropdownMitigAbierto(false);
                }}
                className={`${estilosClases.dropdownCustomItem} ${
                  mitigacionSalvacion === "nada" ? estilosClases.dropdownCustomItemActivo : ""
                }`}
              >
                0 DAÑO EN ÉXITO
              </div>
            </div>
          )}
        </div>

        <button
          onClick={manejarEjecutarSalvacion}
          className={estilosClases.botonSalvacion}
          title="Ejecutar salvación en área (aplica daño mitigado a éxito y condición/efecto a fallo)"
        >
          <ShieldAlert size={11} style={{ marginRight: "3px" }} />
          TIRAR
        </button>
      </div>

      {/* Panel Flotante Resumen de Resultados de Salvación */}
      {resultadoSalvacion && (
        <div className={estilosClases.resumenSalvacionFlotante}>
          <div className={estilosClases.cabeceraResumen}>
            <span>
              SALVACIÓN <strong>{resultadoSalvacion.caracteristica.substring(0, 3).toUpperCase()}</strong> (CD {resultadoSalvacion.cd})
            </span>
            <button onClick={() => setResultadoSalvacion(null)} className={estilosClases.botonCerrarResumen}>
              <X size={12} />
            </button>
          </div>

          <div className={estilosClases.listaResultadosSalvacion}>
            {resultadoSalvacion.resultados.map((r) => (
              <div key={r.id} className={estilosClases.filaResultadoSalvacion}>
                <span className={estilosClases.nombreResumen}>{r.nombre}:</span>
                <span style={{ fontFamily: "var(--fuente-codigo)", fontSize: "9.5px" }}>
                  d20({r.d20}){r.bono >= 0 ? `+${r.bono}` : r.bono} = <strong>{r.total}</strong>
                </span>
                <span
                  className={r.exito ? estilosClases.badgeExito : estilosClases.badgeFallo}
                >
                  {r.exito ? "ÉXITO" : "FALLO"}
                </span>
                {r.dañoSufrido !== undefined && (
                  <span style={{ fontSize: "9px", color: "#ff6b6b" }}>
                    (-{r.dañoSufrido} HP)
                  </span>
                )}
                {r.condicionAplicada && (
                  <span style={{ fontSize: "9px", color: "#e0a96d" }}>
                    [EFECTO]
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
