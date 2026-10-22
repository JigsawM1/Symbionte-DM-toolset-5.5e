import React, { useState, useRef, useEffect } from "react";
import type { PersonajeJugador, TipoTerreno } from "@/tipos";
import { INFORMACION_TERRENO } from "@/tipos";
import type { InformacionCA, PenalizacionArmadura } from "@/almacen/selectores/usarEstadoPersonajes";
import {
  Shield, Zap, Footprints, Award, Sparkles, Star, AlertTriangle
} from "lucide-react";
import { TooltipUniversal } from "@/componentes/comunes";
import { obtenerVelocidadesEfectivas, calcularBonoIniciativaRasgos } from "@/servicios/evaluadorEfectosRasgos";
import { calcularEstadoVelocidadDinamica } from "@/servicios/calculadorDistanciaTS";
import { usarAccionesPersonajes } from "@/almacen/selectores/usarEstadoPersonajes";
import { PopoverMovimientoVelocidad } from "./subcomponentes/PopoverMovimientoVelocidad";
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
}

const MetricasRapidasPersonajeComponent: React.FC<MetricasRapidasPersonajeProps> = ({
  personaje,
  bonoCompetencia,
  modDestreza,
  claseArmadura,
  penalizacionArmadura,
  bonoVelocidad = 0,
  alTirarIniciativa,
  alAlternarInspiracion }) => {
  const accionesPersonajes = usarAccionesPersonajes();

  // Acciones directas al store
  const ejecutarModificarRestante = (nuevo: number) =>
    accionesPersonajes.modificarMovimientoRestanteManualPersonaje(personaje.id, nuevo);
  const ejecutarModificarGastado = (delta: number) =>
    accionesPersonajes.modificarMovimientoGastadoPersonaje(personaje.id, delta, "Ajuste manual");
  const ejecutarDeshacer = () =>
    accionesPersonajes.deshacerUltimoMovimientoPersonaje(personaje.id);
  const ejecutarRestablecer = () =>
    accionesPersonajes.restablecerMovimientoPersonaje(personaje.id);
  const ejecutarAlternarCarrera = () =>
    accionesPersonajes.alternarAccionCarreraPersonaje(personaje.id);
  const ejecutarEstablecerTerreno = (tipo: TipoTerreno) =>
    accionesPersonajes.establecerTipoTerrenoPersonaje(personaje.id, tipo);

  // 1. Iniciativa
  const bonoIniciativaRasgos = calcularBonoIniciativaRasgos(personaje);
  const iniciativaTotal = modDestreza + (personaje.iniciativaBono || 0) + bonoIniciativaRasgos;
  const textoIniciativa = iniciativaTotal >= 0 ? `+${iniciativaTotal}` : `${iniciativaTotal}`;

  const desglosesIniciativa: string[] = [`Destreza (${modDestreza >= 0 ? `+${modDestreza}` : modDestreza})`];
  if (personaje.iniciativaBono) {
    desglosesIniciativa.push(`Manual (${personaje.iniciativaBono >= 0 ? `+${personaje.iniciativaBono}` : personaje.iniciativaBono})`);
  }
  if (bonoIniciativaRasgos) {
    desglosesIniciativa.push(`Rasgos (${bonoIniciativaRasgos >= 0 ? `+${bonoIniciativaRasgos}` : bonoIniciativaRasgos})`);
  }
  const desgloseIniciativaTexto = desglosesIniciativa.join(" + ");

  // 2. Velocidad Base y Efectiva
  const velocidades = obtenerVelocidadesEfectivas(personaje);
  const velocidadBaseTotal = velocidades.caminar;

  const partesVelocidad = [
    `Caminar: ${velocidadBaseTotal} ft`,
    velocidades.nadar ? `Nadar: ${velocidades.nadar} ft` : null,
    velocidades.volar ? `Volar: ${velocidades.volar} ft` : null,
    velocidades.escalar ? `Escalar: ${velocidades.escalar} ft` : null
  ].filter(Boolean) as string[];

  const velocidadTooltipBase =
    bonoVelocidad > 0
      ? `Velocidad: ${velocidadBaseTotal} ft (+${bonoVelocidad} ft)\n${partesVelocidad.join(" • ")}`
      : partesVelocidad.join(" • ");

  // Estado Dinámico de Movimiento y Terreno Activo
  const tipoTerrenoActual: TipoTerreno = personaje.tipoTerreno || "normal";
  const infoTerrenoActual = INFORMACION_TERRENO[tipoTerrenoActual] || INFORMACION_TERRENO.normal;

  const estadoVelocidad = calcularEstadoVelocidadDinamica(
    velocidadBaseTotal,
    0,
    personaje.movimientoGastado || 0,
    personaje.movimientoMaximoTemporal ?? null
  );

  const velocidadTooltip = [
    velocidadTooltipBase,
    `Movimiento Restante: ${estadoVelocidad.movimientoRestante} ft / ${estadoVelocidad.velocidadTotal} ft`,
    personaje.movimientoGastado ? `Gastado en turno: ${personaje.movimientoGastado} ft` : null,
    `Terreno Activo: ${infoTerrenoActual.nombre} (${infoTerrenoActual.costePies})`,
    estadoVelocidad.esCarreraActiva ? "Carrera activa" : null,
    "Haz clic para seleccionar terreno, ajustar manualmente o restablecer."
  ].filter(Boolean).join("\n");

  const [menuVelocidadAbierto, setMenuVelocidadAbierto] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

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

  const historial = Array.isArray(personaje.historialMovimiento) ? personaje.historialMovimiento : [];
  const tieneHistorial = historial.length > 0;
  const ultimoRegistro = tieneHistorial ? historial[historial.length - 1] : null;

  // 3. Clase de Armadura
  const caTotal = claseArmadura?.total ?? personaje.ca ?? 10;
  const avisoNoComp = penalizacionArmadura?.sinCompetencia
    ? ` [SIN COMPETENCIA] (${[penalizacionArmadura.armaduraNoCompetente, penalizacionArmadura.escudoNoCompetente].filter(Boolean).join(", ")}): Desventaja en ataques/pruebas/salvaciones de FUE y DES.`
    : "";
  const caTooltip = `${claseArmadura?.desglose || personaje.caNotas || "Clase de Armadura"}${avisoNoComp}`;

  const subtituloArmadura = (() => {
    if (personaje.caNotas) return personaje.caNotas.toUpperCase();
    const tieneArmadura = personaje.inventario?.find(i => i.equipado && i.categoria === "armaduras");
    if (tieneArmadura?.nombre) return tieneArmadura.nombre.toUpperCase();
    if (claseArmadura?.desglose) {
      const parte = claseArmadura.desglose.split("(")[0]?.trim();
      if (parte && parte.length < 16) return parte.toUpperCase();
    }
    return (claseArmadura?.armaduraEquipadaNombre || claseArmadura?.tipoArmadura || "BASE").toUpperCase();
  })();

  const casillasVelocidad = Math.floor(estadoVelocidad.movimientoRestante / 5);

  return (
    <section className={estilos.filaMetricasRapidas}>
      {/* 1. Clase de Armadura (CA) */}
      <TooltipUniversal
        titulo={penalizacionArmadura?.sinCompetencia ? "Clase de Armadura (Sin Competencia)" : "Clase de Armadura"}
        contenido={caTooltip}
        posicion="abajo"
        alineacion="inicio"
        className={estilos.contenedorTooltipMetrica}
      >
        <div className={`${estilos.neoRaised} ${estilos.tarjetaMetrica}`}>
          <div className={estilos.cabeceraTarjetaMetrica}>
            <span className={estilos.etiquetaMetrica}>
              CA <span className="u-sr-only">Clase Armadura</span>
            </span>
            <div className={estilos.iconoMetricaContenedor}>
              {penalizacionArmadura?.sinCompetencia ? (
                <AlertTriangle size={12} color="var(--pj-texto-alerta)" className={estilos.alertaSinCompetenciaArmadura} />
              ) : (
                <Shield size={12} className={estilos.iconoMetricaDecorativo} />
              )}
            </div>
          </div>
          <span className={estilos.valorMetrica}>{caTotal}</span>
          <span className={estilos.subtituloMetrica} title={subtituloArmadura}>
            {subtituloArmadura}
          </span>
        </div>
      </TooltipUniversal>

      {/* 2. Iniciativa (INIC) */}
      <TooltipUniversal
        titulo="Iniciativa"
        contenido={`Tirada de Iniciativa: 1d20 ${textoIniciativa} [${desgloseIniciativaTexto}].\nHaz clic para tirar iniciativa en TaleSpire.`}
        posicion="abajo"
        className={estilos.contenedorTooltipMetrica}
      >
        <button
          type="button"
          className={`${estilos.neoRaised} ${estilos.tarjetaMetrica} ${estilos.tarjetaMetricaInteractiva}`}
          onClick={alTirarIniciativa}
        >
          <div className={estilos.cabeceraTarjetaMetrica}>
            <span className={`${estilos.etiquetaMetrica} ${estilos.etiquetaMetricaCian}`}>
              INIC <span className="u-sr-only">Iniciativa</span>
            </span>
            <Zap size={12} className={estilos.iconoMetricaCian} />
          </div>
          <span className={`${estilos.valorMetrica} ${estilos.valorMetricaCian}`}>{textoIniciativa}</span>
          <span className={estilos.subtituloMetricaInteractivo}>TIRAR D20</span>
        </button>
      </TooltipUniversal>

      {/* 3. Velocidad (VEL) */}
      <div className={estilos.contenedorVelocidadDinamica} ref={popoverRef}>
        <TooltipUniversal
          titulo="Velocidad de Movimiento"
          contenido={velocidadTooltip}
          posicion="abajo"
          className={estilos.contenedorTooltipMetrica}
          deshabilitado={menuVelocidadAbierto}
        >
          <button
            type="button"
            className={`
              ${estilos.neoRaised}
              ${estilos.tarjetaMetrica}
              ${estilos.tarjetaMetricaInteractiva}
              ${estilos.tarjetaMetricaVelocidad}
              ${estadoVelocidad.agotado ? estilos.tarjetaMetricaVelocidadAgotada : ""}
              ${estadoVelocidad.esCarreraActiva ? estilos.tarjetaMetricaVelocidadCarrera : ""}
            `}
            onClick={() => setMenuVelocidadAbierto((prev) => !prev)}
            aria-label="Abrir controles de velocidad y movimiento"
            aria-expanded={menuVelocidadAbierto}
          >
            <span className={estilos.cabeceraTarjetaMetrica}>
              <span className={estilos.etiquetaMetrica}>
                VEL <span className="u-sr-only">Velocidad</span>
              </span>
              <Footprints size={12} className={estilos.iconoMetricaDecorativo} />
            </span>
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
            <span className={estilos.subtituloMetrica}>
              {casillasVelocidad} CASILLAS
            </span>
          </button>
        </TooltipUniversal>

        {menuVelocidadAbierto && (
          <PopoverMovimientoVelocidad
            idPersonaje={personaje.id}
            idMiniaturaTS={personaje.idMiniaturaTS}
            movimientoGastado={personaje.movimientoGastado || 0}
            estadoVelocidad={estadoVelocidad}
            tipoTerrenoActual={tipoTerrenoActual}
            tieneHistorial={tieneHistorial}
            ultimoRegistro={ultimoRegistro}
            alCerrar={() => setMenuVelocidadAbierto(false)}
            alEstablecerTipoTerreno={ejecutarEstablecerTerreno}
            alModificarRestante={ejecutarModificarRestante}
            alModificarGastado={ejecutarModificarGastado}
            alAlternarCarrera={ejecutarAlternarCarrera}
            alDeshacer={ejecutarDeshacer}
            alRestablecer={ejecutarRestablecer}
          />
        )}
      </div>

      {/* 4. Bonificador de Competencia (COMP) */}
      <TooltipUniversal
        titulo="Bonificador por Competencia"
        contenido={`Bono de Competencia: +${bonoCompetencia}\nSe suma a tiradas de ataque con armas competentes, tiradas de salvación y habilidades competentes.`}
        posicion="abajo"
        className={estilos.contenedorTooltipMetrica}
      >
        <div className={`${estilos.neoRaised} ${estilos.tarjetaMetrica}`}>
          <div className={estilos.cabeceraTarjetaMetrica}>
            <span className={`${estilos.etiquetaMetrica} ${estilos.etiquetaMetricaCian}`}>
              COMP <span className="u-sr-only">Competencia</span>
            </span>
            <Award size={12} className={estilos.iconoMetricaCian} />
          </div>
          <span className={`${estilos.valorMetrica} ${estilos.valorMetricaCian}`}>+{bonoCompetencia}</span>
          <span className={estilos.subtituloMetrica}>BONIF PB</span>
        </div>
      </TooltipUniversal>

      {/* 5. Inspiración Heroica (INSP) */}
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
        <button
          type="button"
          aria-pressed={personaje.inspiracion}
          aria-label="Inspiración heroica"
          className={`${estilos.neoRaised} ${estilos.tarjetaMetrica} ${estilos.tarjetaMetricaInteractiva}`}
          onClick={alAlternarInspiracion}
        >
          <div className={estilos.cabeceraTarjetaMetrica}>
            <span className={`${estilos.etiquetaMetrica} ${estilos.etiquetaMetricaOro}`}>
              Insp. <span className="u-sr-only">Inspiración</span>
            </span>
            <Sparkles size={12} className={estilos.iconoMetricaOro} />
          </div>
          <div className={estilos.centroInspiracion}>
            <div className={`${estilos.botonInspiracion} ${personaje.inspiracion ? estilos.botonInspiracionActiva : ""}`}>
              <Star
                size={14}
                fill={personaje.inspiracion ? "var(--pj-texto-oro)" : "transparent"}
                color={personaje.inspiracion ? "var(--pj-texto-oro)" : "var(--pj-texto-terciario)"}
              />
            </div>
          </div>
          <span className={`${estilos.subtituloMetrica} ${personaje.inspiracion ? estilos.subtituloMetricaOro : ""}`}>
            {personaje.inspiracion ? "DISPONIBLE" : "AGOTADA"}
          </span>
        </button>
      </TooltipUniversal>
    </section>
  );
};

export const MetricasRapidasPersonaje = React.memo(MetricasRapidasPersonajeComponent);
