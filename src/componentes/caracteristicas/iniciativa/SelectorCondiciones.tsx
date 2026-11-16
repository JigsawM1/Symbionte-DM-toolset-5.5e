import { BotonNumerico } from "@/componentes/comunes/BotonNumerico";
import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import React, { useState, useRef, useEffect } from "react";
import { normalizarTexto } from "@/almacen/usarAlmacenDM";
import {
  usarEstadoIniciativa,
  usarAccionesIniciativa,
} from "@/almacen/selectores";
import { CONDICIONES_2024, EFECTOS_PREDEFINIDOS } from "@/utiles/datosIniciales";
import type { Caracteristica } from "@/tipos";
import type { ResultadoSalvacionArea } from "@/almacen/slices/sliceIniciativa";
import { esCriaturaHorda } from "@/servicios/combateHordas";
import { SeccionSalvacionArea } from "./subcomponentes/SeccionSalvacionArea";
import estilosClases from "./SelectorCondiciones.module.css";

interface ElementoEstadoCombate {
  nombre: string;
  tipo: "condicion" | "efecto";
  duracion?: number;
  esConcentracion?: boolean;
}

const ESTADOS_COMBINADOS: ElementoEstadoCombate[] = [
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

export const SelectorCondiciones: React.FC = () => {
  const { colaIniciativa, indiceTurnoActivo, criaturasSeleccionadas } = usarEstadoIniciativa();
  const {
    aplicarDañoEnArea,
    aplicarCondicionEnArea,
    aplicarEfectoEnArea,
    ejecutarSalvacionEnArea,
  } = usarAccionesIniciativa();

  const [cantidadDaño, setCantidadDaño] = useState("");
  const [busquedaEstado, setBusquedaEstado] = useState("");
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [targetModo, setTargetModo] = useState<string>("AUTO");
  const [cdSalvacion, setCdSalvacion] = useState("");
  const [caracteristicaSalvacion, setCaracteristicaSalvacion] = useState<Caracteristica>("destreza");
  const [mitigacionSalvacion, setMitigacionSalvacion] = useState<"mitad" | "nada">("mitad");
  const [resultadoSalvacion, setResultadoSalvacion] = useState<ResultadoSalvacionArea | null>(null);
  const [limiteMiembrosHorda, setLimiteMiembrosHorda] = useState("");

  const [dropdownAbierto, setDropdownAbierto] = useState<"target" | "carac" | "mitig" | null>(null);
  const alternar = (menu: "target" | "carac" | "mitig") =>
    setDropdownAbierto((prev) => (prev === menu ? null : menu));
  const cerrar = () => setDropdownAbierto(null);
  const refTemporizadorBlur = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (refTemporizadorBlur.current) {
        clearTimeout(refTemporizadorBlur.current);
      }
    };
  }, []);

  const idsEnCola = new Set(colaIniciativa.map((c) => c.id));
  const seleccionadasEnCola = (criaturasSeleccionadas || []).filter((s) => idsEnCola.has(s.id));
  const numSeleccionadas = seleccionadasEnCola.length;

  const modoEfectivo = targetModo === "AUTO"
    ? (numSeleccionadas > 0 ? "SELECCION" : "ACTIVO")
    : targetModo;

  const resolverIdsObjetivo = (): string[] | undefined => {
    if (modoEfectivo === "SELECCION") return seleccionadasEnCola.map((s) => s.id);
    if (modoEfectivo === "ACTIVO") {
      const act = colaIniciativa[indiceTurnoActivo];
      return act ? [act.id] : undefined;
    }
    return [modoEfectivo];
  };

  const obtenerEtiquetaTarget = (): string => {
    if (modoEfectivo === "SELECCION") return `SELECCIÓN (${numSeleccionadas})`;
    if (modoEfectivo === "ACTIVO") return "[ACTIVO]";
    const cri = colaIniciativa.find((c) => c.id === modoEfectivo);
    return cri ? (cri.nombre.length > 13 ? cri.nombre.substring(0, 13) + "..." : cri.nombre) : "[ACTIVO]";
  };

  const idsActuales = resolverIdsObjetivo();
  const hayHordaEnObjetivo = colaIniciativa.some((c) => idsActuales?.includes(c.id) && esCriaturaHorda(c));
  const numLimiteHorda = Number(limiteMiembrosHorda) > 0 ? Math.trunc(Number(limiteMiembrosHorda)) : undefined;

  const manejarAplicarDaño = (esCuracion: boolean) => {
    const val = Number(cantidadDaño);
    if (isNaN(val) || val <= 0) return;
    aplicarDañoEnArea(esCuracion ? -val : val, idsActuales, numLimiteHorda);
    setCantidadDaño("");
  };

  const queryNorm = normalizarTexto(busquedaEstado);
  const sugerenciasFiltradas = ESTADOS_COMBINADOS.filter((item) =>
    normalizarTexto(item.nombre).includes(queryNorm)
  );

  const manejarAplicarEstadoDirecto = (item: ElementoEstadoCombate) => {
    if (item.tipo === "condicion") {
      aplicarCondicionEnArea(item.nombre, idsActuales);
    } else {
      aplicarEfectoEnArea(item.nombre, item.duracion || 10, { concentracion: item.esConcentracion }, idsActuales);
    }
    setBusquedaEstado("");
    setMostrarSugerencias(false);
  };

  const manejarEjecutarSalvacion = () => {
    const cdVal = Number(cdSalvacion);
    if (isNaN(cdVal) || cdVal <= 0) return;

    const dañoVal = Number(cantidadDaño);
    const dañoBruto = !isNaN(dañoVal) && dañoVal > 0 ? dañoVal : undefined;

    let condicionObj: ElementoEstadoCombate | undefined;
    const textoEstado = busquedaEstado.trim();
    if (textoEstado !== "") {
      const co = sugerenciasFiltradas.find((item) => item.nombre.toLowerCase() === textoEstado.toLowerCase()) || sugerenciasFiltradas[0];
      condicionObj = co
        ? { nombre: co.nombre, tipo: co.tipo, duracion: co.duracion, esConcentracion: co.esConcentracion }
        : { nombre: textoEstado, tipo: "condicion" };
    }

    const res = ejecutarSalvacionEnArea({
      caracteristica: caracteristicaSalvacion,
      cd: cdVal,
      dañoBruto,
      condicionOEfecto: condicionObj,
      mitigacion: mitigacionSalvacion,
      idsObjetivo: idsActuales,
      limiteMiembrosHorda: numLimiteHorda
    });

    if (res) {
      setResultadoSalvacion(res);
      setCantidadDaño("");
      setBusquedaEstado("");
    }
  };

  const manejarSeleccionarSugerencia = (texto: string) => {
    const primera = sugerenciasFiltradas.find((i) => i.nombre.toLowerCase() === texto.toLowerCase()) || sugerenciasFiltradas[0];
    if (primera) {
      manejarAplicarEstadoDirecto(primera);
    } else {
      aplicarCondicionEnArea(texto, idsActuales);
      setBusquedaEstado("");
    }
  };

  return (
    <div data-acciones-condiciones className={estilosClases.bloqueCondiciones}>
      <div className={estilosClases.contenedorTarget}>
        <button
          onClick={() => alternar("target")}
          className={`${estilosClases.botonDestinatario} ${
            numSeleccionadas > 0 && targetModo !== "ACTIVO" ? estilosClases.botonDestinatarioSeleccion : ""
          }`}
          title="Objetivo del daño / condición / efecto / salvación"
        >
          <span>{obtenerEtiquetaTarget()}</span>
          <span className={estilosClases.flechaDropdown}>▼</span>
        </button>

        {dropdownAbierto === "target" && (
          <div className={estilosClases.dropdownDestinatarios}>
            <div onClick={() => { setTargetModo("AUTO"); cerrar(); }} className={estilosClases.dropdownItemActivo}>
              AUTO ({numSeleccionadas > 0 ? `SELECCIÓN ${numSeleccionadas}` : "ACTIVO"})
            </div>
            {numSeleccionadas > 0 && (
              <div onClick={() => { setTargetModo("SELECCION"); cerrar(); }} className={estilosClases.dropdownItemSeleccion}>
                SELECCIÓN TALESPIRE ({numSeleccionadas})
              </div>
            )}
            <div onClick={() => { setTargetModo("ACTIVO"); cerrar(); }} className={estilosClases.dropdownItemActivo}>
              TURNO ACTIVO
            </div>
            {colaIniciativa.map((cri) => (
              <div
                key={cri.id}
                onClick={() => { setTargetModo(cri.id); cerrar(); }}
                className={`${estilosClases.dropdownItemCriatura} ${
                  cri.esMonstruo ? estilosClases.dropdownItemCriaturaMonstruo : estilosClases.dropdownItemCriaturaPJ
                }`}
              >
                <span>{cri.nombre.length > 12 ? cri.nombre.substring(0, 12) + "..." : cri.nombre}</span>
                <span className={estilosClases.etiquetaTipoCriatura}>{cri.esMonstruo ? "MON" : "PJ"}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={estilosClases.seccionDaño}>
        {hayHordaEnObjetivo && (
          <CampoNumerico
            min="1"
            value={limiteMiembrosHorda}
            alConfirmar={(valor) => setLimiteMiembrosHorda(String(valor))}
            placeholder="Miem."
            className={estilosClases.inputCD}
            title="Miembros de la horda dentro del área (vacío = todos los vivos)"
            alVaciar={() => setLimiteMiembrosHorda("")}
          />
        )}
        <CampoNumerico
          min="0"
          value={cantidadDaño}
          alConfirmar={(valor) => setCantidadDaño(String(valor))}
          onKeyDown={(e) => e.key === "Enter" && manejarAplicarDaño(false)}
          placeholder="DAÑO..."
          className={estilosClases.inputDaño}
          alVaciar={() => setCantidadDaño("")}
        />
        <BotonNumerico ambito="[data-acciones-condiciones]" onClick={() => manejarAplicarDaño(false)} className={estilosClases.botonDaño} title="Aplicar daño directo al objetivo">
          - DAÑO
        </BotonNumerico>
        <BotonNumerico ambito="[data-acciones-condiciones]" onClick={() => manejarAplicarDaño(true)} className={estilosClases.botonCurar} title="Aplicar curación al objetivo">
          + CURAR
        </BotonNumerico>
      </div>

      <div className={estilosClases.seccionEstado}>
        <input
          type="text"
          value={busquedaEstado}
          onChange={(e) => { setBusquedaEstado(e.target.value); setMostrarSugerencias(true); }}
          onFocus={() => {
            if (refTemporizadorBlur.current) { clearTimeout(refTemporizadorBlur.current); refTemporizadorBlur.current = null; }
            setMostrarSugerencias(true);
          }}
          onBlur={() => { refTemporizadorBlur.current = setTimeout(() => setMostrarSugerencias(false), 250); }}
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
                  onClick={() => { setBusquedaEstado(item.nombre); setMostrarSugerencias(false); }}
                  className={estilosClases.sugerenciaItem}
                >
                  <span className={estilosClases.sugerenciaNombre}>{item.nombre}</span>
                  <span className={`${estilosClases.badgeTipo} ${item.tipo === "condicion" ? estilosClases.badgeCondicion : estilosClases.badgeEfecto}`}>
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
          onClick={() => { const t = busquedaEstado.trim(); if (t) manejarSeleccionarSugerencia(t); }}
          className={estilosClases.botonAñadirEstado}
          title="Añadir condición o efecto directo sin tirada"
        >
          +
        </button>
      </div>

      <SeccionSalvacionArea
        cdSalvacion={cdSalvacion}
        onCambiarCd={setCdSalvacion}
        caracteristicaSalvacion={caracteristicaSalvacion}
        onCambiarCaracteristica={setCaracteristicaSalvacion}
        mitigacionSalvacion={mitigacionSalvacion}
        onCambiarMitigacion={setMitigacionSalvacion}
        menuAbierto={dropdownAbierto === "carac" || dropdownAbierto === "mitig" ? dropdownAbierto : null}
        onAlternarMenu={alternar}
        onCerrarMenus={cerrar}
        onEjecutarSalvacion={manejarEjecutarSalvacion}
        resultadoSalvacion={resultadoSalvacion}
        onCerrarResultado={() => setResultadoSalvacion(null)}
      />
    </div>
  );
};
