import React, { useState, useRef, useEffect } from "react";
import type { PersonajeJugador, TipoTerreno } from "@/tipos";
import { INFORMACION_TERRENO } from "@/tipos";
import type { InformacionCA, PenalizacionArmadura } from "@/almacen/selectores/usarEstadoPersonajes";
import {
  Shield,
  Zap,
  Footprints,
  Award,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Plus,
  Minus,
  X,
  Mountain
} from "lucide-react";
import { TooltipUniversal } from "@/componentes/comunes";
import { obtenerVelocidadesEfectivas, calcularBonoIniciativaRasgos } from "@/servicios/evaluadorEfectosRasgos";
import { calcularEstadoVelocidadDinamica } from "@/servicios/calculadorDistanciaTS";
import { usarAccionesPersonajes } from "@/almacen/selectores/usarEstadoPersonajes";
import estilos from "./HojaPersonaje.module.css";

interface MetricasRapidasPersonajeProps {
  personaje: PersonajeJugador;
  bonoCompetencia: number;
  modDestreza: number;
  claseArmadura?: InformacionCA;
  penalizacionArmadura?: PenalizacionArmadura;
  bonoVelocidad?: number;
  alTirarIniciativa: () => void;
  alAlternarInspiracion: () => void;
  // Callbacks opcionales para control o testing
  alModificarMovimientoRestante?: (nuevoRestante: number) => void;
  alModificarMovimientoGastado?: (delta: number) => void;
  alDeshacerMovimiento?: () => void;
  alRestablecerMovimiento?: () => void;
  alAlternarCarrera?: () => void;
  alEstablecerTipoTerreno?: (tipo: TipoTerreno) => void;
}

const MetricasRapidasPersonajeComponent: React.FC<MetricasRapidasPersonajeProps> = ({
  personaje,
  bonoCompetencia,
  modDestreza,
  claseArmadura,
  penalizacionArmadura,
  bonoVelocidad = 0,
  alTirarIniciativa,
  alAlternarInspiracion,
  alModificarMovimientoRestante,
  alModificarMovimientoGastado,
  alDeshacerMovimiento,
  alRestablecerMovimiento,
  alAlternarCarrera,
  alEstablecerTipoTerreno
}) => {
  const accionesPersonajes = usarAccionesPersonajes();

  // Acciones con fallback seguro al store
  const ejecutarModificarRestante =
    alModificarMovimientoRestante ||
    ((nuevo: number) => accionesPersonajes.modificarMovimientoRestanteManualPersonaje(personaje.id, nuevo));
  const ejecutarModificarGastado =
    alModificarMovimientoGastado ||
    ((delta: number) => accionesPersonajes.modificarMovimientoGastadoPersonaje(personaje.id, delta, "Ajuste manual"));
  const ejecutarDeshacer =
    alDeshacerMovimiento ||
    (() => accionesPersonajes.deshacerUltimoMovimientoPersonaje(personaje.id));
  const ejecutarRestablecer =
    alRestablecerMovimiento ||
    (() => accionesPersonajes.restablecerMovimientoPersonaje(personaje.id));
  const ejecutarAlternarCarrera =
    alAlternarCarrera ||
    (() => accionesPersonajes.alternarAccionCarreraPersonaje(personaje.id));
  const ejecutarEstablecerTerreno =
    alEstablecerTipoTerreno ||
    ((tipo: TipoTerreno) => accionesPersonajes.establecerTipoTerrenoPersonaje(personaje.id, tipo));

  // 1. Iniciativa
  const bonoIniciativaRasgos = calcularBonoIniciativaRasgos(personaje);
  const iniciativaTotal = modDestreza + (personaje.iniciativaBono || 0) + bonoIniciativaRasgos;
  const textoIniciativa = iniciativaTotal >= 0 ? `+${iniciativaTotal}` : `${iniciativaTotal}`;

  // 2. Velocidad Base y Efectiva
  const velocidades = obtenerVelocidadesEfectivas(personaje);
  const velocidadBaseTotal = velocidades.caminar;

  const partesVelocidad: string[] = [`Caminar: ${velocidadBaseTotal} ft`];
  if (velocidades.nadar && velocidades.nadar > 0) {
    partesVelocidad.push(`Nadar: ${velocidades.nadar} ft`);
  }
  if (velocidades.volar && velocidades.volar > 0) {
    partesVelocidad.push(`Volar: ${velocidades.volar} ft`);
  }
  if (velocidades.escalar && velocidades.escalar > 0) {
    partesVelocidad.push(`Escalar: ${velocidades.escalar} ft`);
  }

  const velocidadTooltipBase =
    bonoVelocidad > 0
      ? `Velocidad: ${velocidadBaseTotal} ft (+${bonoVelocidad} ft rasgos)\n${partesVelocidad.join(" • ")}`
      : partesVelocidad.join(" • ");

  // 3. Estado Dinámico de Movimiento y Terreno Activo
  const tipoTerrenoActual: TipoTerreno = personaje.tipoTerreno || "normal";
  const infoTerrenoActual = INFORMACION_TERRENO[tipoTerrenoActual] || INFORMACION_TERRENO.normal;

  const estadoVelocidad = calcularEstadoVelocidadDinamica(
    velocidadBaseTotal,
    0, // ya incluido en velocidadBaseTotal por obtenerVelocidadesEfectivas
    personaje.movimientoGastado || 0,
    personaje.movimientoMaximoTemporal ?? null
  );

  const velocidadTooltip = [
    velocidadTooltipBase,
    `Movimiento Restante: ${estadoVelocidad.movimientoRestante} ft / ${estadoVelocidad.velocidadTotal} ft`,
    personaje.movimientoGastado ? `Gastado en turno: ${personaje.movimientoGastado} ft` : null,
    `Terreno Activo: ${infoTerrenoActual.nombre} (${infoTerrenoActual.costePies})`,
    "Cálculo 3D: Incluye altura Y (vuelo, saltos, rampas)",
    estadoVelocidad.esCarreraActiva ? "Acción Carrera ACTIVA (Doble Movimiento)" : null,
    "Haz clic para seleccionar terreno, ajustar manualmente o restablecer."
  ]
    .filter(Boolean)
    .join("\n");

  // Estado del menú popover interactivo
  const [menuVelocidadAbierto, setMenuVelocidadAbierto] = useState(false);
  const [inputRestante, setInputRestante] = useState<string>(estadoVelocidad.movimientoRestante.toString());
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputRestante(estadoVelocidad.movimientoRestante.toString());
  }, [estadoVelocidad.movimientoRestante]);

  useEffect(() => {
    if (!menuVelocidadAbierto) return;
    const clickFuera = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setMenuVelocidadAbierto(false);
      }
    };
    document.addEventListener("mousedown", clickFuera);
    return () => document.removeEventListener("mousedown", clickFuera);
  }, [menuVelocidadAbierto]);

  const manejarAplicarInputManual = () => {
    const val = Number(inputRestante);
    if (!isNaN(val) && val >= 0) {
      ejecutarModificarRestante(val);
    } else {
      setInputRestante(estadoVelocidad.movimientoRestante.toString());
    }
  };

  // Historial para deshacer
  const historial = Array.isArray(personaje.historialMovimiento) ? personaje.historialMovimiento : [];
  const tieneHistorial = historial.length > 0;
  const ultimoRegistro = tieneHistorial ? historial[historial.length - 1] : null;

  // 4. Clase de Armadura
  const caTotal = claseArmadura?.total ?? personaje.ca ?? 10;
  const avisoNoComp = penalizacionArmadura?.sinCompetencia
    ? ` [SIN COMPETENCIA] (${[penalizacionArmadura.armaduraNoCompetente, penalizacionArmadura.escudoNoCompetente].filter(Boolean).join(", ")}): Desventaja en ataques/pruebas/salvaciones de FUE y DES. No puedes lanzar conjuros.`
    : "";
  const caTooltip = `${claseArmadura?.desglose || personaje.caNotas || "Clase de Armadura"}${avisoNoComp}`;

  return (
    <section className={estilos.filaMetricasRapidas}>
      {/* 1. Clase de Armadura */}
      <TooltipUniversal
        titulo={penalizacionArmadura?.sinCompetencia ? "Clase de Armadura (Sin Competencia)" : "Clase de Armadura"}
        contenido={caTooltip}
        posicion="abajo"
        alineacion="inicio"
        className={estilos.contenedorTooltipMetrica}
      >
        <div className={`${estilos.neoRaised} ${estilos.tarjetaMetrica}`}>
          <Shield size={13} className={estilos.iconoMetricaDecorativo} />
          <span className={estilos.etiquetaMetrica}>
            Clase Armadura
            {penalizacionArmadura?.sinCompetencia && (
              <AlertTriangle size={10} color="#ef4444" className={estilos.alertaSinCompetenciaArmadura} />
            )}
          </span>
          <span className={estilos.valorMetrica}>{caTotal}</span>
        </div>
      </TooltipUniversal>

      {/* 2. Iniciativa */}
      <TooltipUniversal
        titulo="Iniciativa"
        contenido={`Tirada de Iniciativa: 1d20 ${textoIniciativa} (Destreza).\nHaz clic para tirar iniciativa en TaleSpire.`}
        posicion="abajo"
        className={estilos.contenedorTooltipMetrica}
      >
        <div
          className={`${estilos.neoRaised} ${estilos.tarjetaMetrica} ${estilos.tarjetaMetricaInteractiva}`}
          onClick={alTirarIniciativa}
        >
          <Zap size={13} className={estilos.iconoMetricaDecorativo} />
          <span className={estilos.etiquetaMetrica}>Iniciativa</span>
          <span className={`${estilos.valorMetrica} ${estilos.valorMetricaAcento}`}>{textoIniciativa}</span>
        </div>
      </TooltipUniversal>

      {/* 3. Velocidad Dinámica */}
      <div className={estilos.contenedorVelocidadDinamica} ref={popoverRef}>
        <TooltipUniversal
          titulo="Velocidad de Movimiento"
          contenido={velocidadTooltip}
          posicion="abajo"
          className={estilos.contenedorTooltipMetrica}
        >
          <div
            className={`
              ${estilos.neoRaised}
              ${estilos.tarjetaMetrica}
              ${estilos.tarjetaMetricaInteractiva}
              ${estilos.tarjetaMetricaVelocidad}
              ${estadoVelocidad.agotado ? estilos.tarjetaMetricaVelocidadAgotada : ""}
              ${estadoVelocidad.esCarreraActiva ? estilos.tarjetaMetricaVelocidadCarrera : ""}
            `}
            onClick={() => setMenuVelocidadAbierto((prev) => !prev)}
            role="button"
            aria-label="Abrir controles de velocidad y movimiento"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setMenuVelocidadAbierto((prev) => !prev);
              }
            }}
          >
            {/* Indicador de miniatura de TaleSpire enlazada */}
            <span
              className={`${estilos.indicadorTSEnlace} ${!personaje.idMiniaturaTS ? estilos.indicadorTSEnlaceInactivo : ""}`}
              title={personaje.idMiniaturaTS ? "Miniatura TaleSpire Vinculada" : "Sin miniatura enlazada (Modo Manual)"}
            />
            <Footprints size={13} className={estilos.iconoMetricaDecorativo} />
            <span className={estilos.etiquetaMetrica}>Velocidad</span>
            <span
              className={`
                ${estilos.valorMetrica}
                ${estadoVelocidad.agotado ? estilos.valorMetricaAgotado : ""}
                ${estadoVelocidad.esCarreraActiva ? estilos.valorMetricaCarrera : ""}
                ${personaje.movimientoGastado > 0 && !estadoVelocidad.agotado ? estilos.valorMetricaParcial : ""}
              `}
            >
              {estadoVelocidad.movimientoRestante}
              {(personaje.movimientoGastado > 0 || estadoVelocidad.esCarreraActiva) && (
                <span className={estilos.separadorVelocidad}>/{estadoVelocidad.velocidadTotal}</span>
              )}
              <span className={estilos.unidadMetrica}>ft</span>
            </span>

            {/* Badge de Terreno si es distinto a normal */}
            {tipoTerrenoActual !== "normal" && (
              <span
                className={`
                  ${estilos.badgeTerrenoTarjeta}
                  ${tipoTerrenoActual === "dificil" ? estilos.badgeTerrenoDificil : ""}
                  ${tipoTerrenoActual === "extremo" ? estilos.badgeTerrenoExtremo : ""}
                `}
              >
                {infoTerrenoActual.nombre} {infoTerrenoActual.multiplicador}x
              </span>
            )}
          </div>
        </TooltipUniversal>

        {/* Popover Menú Flotante de Gestión de Movimiento */}
        {menuVelocidadAbierto && (
          <div className={estilos.popoverVelocidad}>
            <div className={estilos.cabeceraPopoverVelocidad}>
              <span className={estilos.tituloPopoverVelocidad}>
                <Footprints size={14} color="#38bdf8" />
                Control de Movimiento
              </span>
              <button
                type="button"
                className={estilos.botonCerrarPopover}
                onClick={() => setMenuVelocidadAbierto(false)}
                title="Cerrar panel"
              >
                <X size={14} />
              </button>
            </div>

            <div className={estilos.cuerpoPopoverVelocidad}>
              {/* Badge de estado TaleSpire */}
              <div
                className={`${estilos.badgeTSEnlace} ${!personaje.idMiniaturaTS ? estilos.badgeTSDesconectado : ""}`}
              >
                <span
                  className={`${estilos.indicadorTSEnlace} ${estilos.indicadorTSEnlaceEstatico} ${!personaje.idMiniaturaTS ? estilos.indicadorTSEnlaceInactivo : ""}`}
                />
                {personaje.idMiniaturaTS
                  ? "TaleSpire conectado (cálculo dinámico automático)"
                  : "Modo Manual (sin miniatura física enlazada)"}
              </div>

              {/* Selector de Tipo de Terreno (D&D 5.5e y 3D) */}
              <div className={estilos.seccionTerrenoPopover}>
                <div className={estilos.cabeceraTerreno}>
                  <span className={estilos.etiquetaCabeceraTerreno}>
                    <Mountain size={12} color="#94a3b8" />
                    Terreno (D&D 5.5e)
                  </span>
                  <span
                    className={estilos.badgeAltura3D}
                    title="Cálculo 3D euclidiano: incluye la altura vertical Y de TaleSpire"
                  >
                    3D + Altura Y
                  </span>
                </div>

                <div className={estilos.grupoBotonesTerreno}>
                  {(["normal", "dificil", "extremo"] as TipoTerreno[]).map((tipo) => {
                    const info = INFORMACION_TERRENO[tipo];
                    const esActivo = tipoTerrenoActual === tipo;
                    let claseActivo = "";
                    if (esActivo) {
                      if (tipo === "normal") claseActivo = estilos.botonTerrenoActivoNormal;
                      else if (tipo === "dificil") claseActivo = estilos.botonTerrenoActivoDificil;
                      else if (tipo === "extremo") claseActivo = estilos.botonTerrenoActivoExtremo;
                    }

                    return (
                      <button
                        key={tipo}
                        type="button"
                        className={`${estilos.botonTerreno} ${claseActivo}`}
                        onClick={() => ejecutarEstablecerTerreno(tipo)}
                        title={`${info.nombre}: ${info.descripcion}`}
                      >
                        <span>{info.nombre}</span>
                        <span className={estilos.subMultiplicadorTerreno}>{info.multiplicador}x</span>
                      </button>
                    );
                  })}
                </div>

                <div className={estilos.descripcionTerrenoTexto}>
                  {infoTerrenoActual.descripcion}
                </div>
              </div>

              {/* Caja Resumen de Movimiento */}
              <div className={estilos.resumenMovimientoCaja}>
                <div>
                  <div className={estilos.etiquetaMovimientoGrande}>Movimiento Restante</div>
                  <div className={estilos.valorMovimientoGrande}>
                    {estadoVelocidad.movimientoRestante} / {estadoVelocidad.velocidadTotal} ft
                  </div>
                </div>
                {personaje.movimientoGastado > 0 && (
                  <div className={estilos.gastadoSubtexto}>
                    Gastado: {personaje.movimientoGastado} ft
                  </div>
                )}
              </div>

              {/* Ajuste Manual Rápido */}
              <div className={estilos.filaAjusteManual}>
                <button
                  type="button"
                  className={estilos.botonPasoPies}
                  onClick={() => ejecutarModificarGastado(5)}
                  title="Gastar 5 pies de movimiento"
                >
                  <Minus size={12} />
                  5 ft
                </button>

                <input
                  type="number"
                  step="any"
                  min="0"
                  max={estadoVelocidad.velocidadTotal * 2}
                  className={estilos.inputRestanteManual}
                  value={inputRestante}
                  onChange={(e) => setInputRestante(e.target.value)}
                  onBlur={manejarAplicarInputManual}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      manejarAplicarInputManual();
                    }
                  }}
                  title="Escribe directamente los pies restantes y pulsa Enter"
                />

                <button
                  type="button"
                  className={estilos.botonPasoPies}
                  onClick={() => ejecutarModificarGastado(-5)}
                  title="Recuperar 5 pies de movimiento"
                >
                  <Plus size={12} />
                  5 ft
                </button>
              </div>

              {/* Botones de Acción: Carrera y Deshacer */}
              <div className={estilos.filaBotonesAccionVelocidad}>
                <button
                  type="button"
                  className={`
                    ${estilos.botonAccionVelocidad}
                    ${estadoVelocidad.esCarreraActiva ? estilos.botonCarreraActivo : ""}
                  `}
                  onClick={ejecutarAlternarCarrera}
                  title="Acción Carrera (Dash): duplica la velocidad de este turno"
                >
                  <Footprints size={13} />
                  {estadoVelocidad.esCarreraActiva ? "Carrera ON" : "Carrera (+Dash)"}
                </button>

                <button
                  type="button"
                  className={estilos.botonAccionVelocidad}
                  onClick={ejecutarDeshacer}
                  disabled={!tieneHistorial}
                  title={
                    ultimoRegistro
                      ? `Deshacer: ${ultimoRegistro.descripcion}`
                      : "No hay movimientos previos para deshacer"
                  }
                >
                  <RotateCcw size={13} />
                  Deshacer
                </button>

                <button
                  type="button"
                  className={`${estilos.botonAccionVelocidad} ${estilos.botonRestablecerTurno}`}
                  onClick={ejecutarRestablecer}
                  title="Restablece la velocidad al 100% (iniciar nuevo turno)"
                >
                  <RefreshCw size={13} />
                  Restablecer Turno
                </button>
              </div>

              {/* Pie con último movimiento */}
              {ultimoRegistro && (
                <div className={estilos.piePopoverHistorial}>
                  <span>Último: {ultimoRegistro.descripcion}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Competencia */}
      <TooltipUniversal
        titulo="Bonificador por Competencia"
        contenido={`Bono de Competencia: +${bonoCompetencia}\nSe suma a tiradas de ataque con armas competentes, tiradas de salvación y habilidades competentes, y a la CD de salvación de conjuros.`}
        posicion="abajo"
        className={estilos.contenedorTooltipMetrica}
      >
        <div className={`${estilos.neoRaised} ${estilos.tarjetaMetrica}`}>
          <Award size={13} className={estilos.iconoMetricaDecorativo} />
          <span className={estilos.etiquetaMetrica}>Competencia</span>
          <span className={`${estilos.valorMetrica} ${estilos.valorMetricaAcento}`}>+{bonoCompetencia}</span>
        </div>
      </TooltipUniversal>

      {/* 5. Inspiración Heroica */}
      <TooltipUniversal
        titulo="Inspiración Heroica"
        contenido={
          personaje.inspiracion
            ? "Inspiración Heroica activa.\nHaz clic para gastarla (permite repetir cualquier tirada de d20)."
            : "Inspiración Heroica inactiva.\nHaz clic para activarla."
        }
        posicion="abajo"
        alineacion="fin"
        className={estilos.contenedorTooltipMetrica}
      >
        <div
          className={`${estilos.neoRaised} ${estilos.tarjetaMetrica} ${estilos.tarjetaMetricaInteractiva}`}
          onClick={alAlternarInspiracion}
        >
          <span className={estilos.etiquetaMetrica}>Insp.</span>
          <div className={`${estilos.botonInspiracion} ${personaje.inspiracion ? estilos.botonInspiracionActiva : ""}`}>
            <Sparkles size={12} color={personaje.inspiracion ? "#000" : "var(--color-texto-apagado, #64748b)"} />
          </div>
        </div>
      </TooltipUniversal>
    </section>
  );
};

export const MetricasRapidasPersonaje = React.memo(MetricasRapidasPersonajeComponent);
