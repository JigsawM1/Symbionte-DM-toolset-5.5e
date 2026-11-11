import React from "react";
import { Zap, Eye, EyeOff, Trash2, Sparkles, AlertTriangle } from "lucide-react";
import type { HechizoBase } from "@/tipos";
import { calcularInfoTruco, aplicarBonoNumericoAFormulaDados } from "@/utiles/utilesConjuros";
import type { ModoLanzamiento } from "@/servicios/servicioLanzamientoConjuros";
import { SelectorDesplegable } from "@/componentes/comunes";
import {
  OrigenConjuroBadge,
  CONFIG_BADGES_ORIGEN_CONJURO
} from "@/servicios/resolutorOrigenConjuros";
import { usarLanzamientoTarjetaConjuro } from "./conjuros/usarLanzamientoTarjetaConjuro";
import estilos from "./TarjetaConjuroCompacta.module.css";

interface TarjetaConjuroCompactaProps {
  hechizo: HechizoBase;
  nombrePersonaje: string;
  nivelPersonaje?: number;
  bonoAtaqueMagico: number;
  bonoDanoMagico?: number;
  modificadorHabilidad?: number;
  estaPreparado: boolean;
  esDeSubclase?: boolean;
  origenBadge?: OrigenConjuroBadge | null;
  mostrarTogglePreparado?: boolean;
  esConcentracionActual?: boolean;
  esOculto?: boolean;
  alAlternarOcultar?: () => void;
  alAlternarPreparado?: () => void;
  alQuitarDeLista?: () => void;
  alAbrirDetalleCompleto: (hechizo: HechizoBase) => void;
  alLanzar?: (modo: ModoLanzamiento, nivelLanzamiento?: number) => Promise<boolean | void>;
  alGastarEspacio?: (nivel: number) => void;
  alGastarPuntos?: (cantidad: number) => void;
  alGastarEspacioPacto?: () => void;
  esLanzadorPacto?: boolean;
  nivelEspacioPacto?: number;
  espaciosPactoMaximos?: number;
  espaciosPactoGastados?: number;
  espaciosConjuroMaximos?: Record<string, number>;
  nivelConjuroMaximo?: number;
  alEstablecerConcentracion?: (id: string, nombre: string) => void;
  costePuntosPorNivel?: Record<number, number>;
  sistemaMagia?: "espacios" | "puntos";
  bloqueadoPorArmadura?: boolean;
  motivoBloqueoArmadura?: string;
  permitirUpcastLibre?: boolean;
  tieneLanzamientoGratisDisponible?: boolean;
  alLanzarGratis?: () => Promise<void>;
}

export const TarjetaConjuroCompacta: React.FC<TarjetaConjuroCompactaProps> = React.memo((props) => {
  const {
    hechizo, nombrePersonaje, nivelPersonaje = 1, bonoAtaqueMagico, bonoDanoMagico = 0,
    modificadorHabilidad = 0, esDeSubclase = false, origenBadge, esConcentracionActual = false,
    esOculto = false, alAlternarOcultar, alQuitarDeLista, alAbrirDetalleCompleto, alLanzar,
    alGastarEspacio, alGastarPuntos, alGastarEspacioPacto, esLanzadorPacto = false,
    nivelEspacioPacto = 0, espaciosPactoMaximos = 0, espaciosPactoGastados = 0,
    espaciosConjuroMaximos = {}, nivelConjuroMaximo = 0, alEstablecerConcentracion,
    costePuntosPorNivel, sistemaMagia = "espacios", bloqueadoPorArmadura = false,
    motivoBloqueoArmadura, permitirUpcastLibre, tieneLanzamientoGratisDisponible = false,
    alLanzarGratis
  } = props;

  const esTruco = hechizo.nivel === 0;
  const origenEfectivo: OrigenConjuroBadge | null = origenBadge ?? (esDeSubclase ? "subclase" : null);
  const esOtorgado = Boolean(origenEfectivo);
  const configBadge = origenEfectivo ? CONFIG_BADGES_ORIGEN_CONJURO[origenEfectivo] : null;

  const {
    opcionesLanzamiento, nivelUpcast, setNivelUpcast,
    manejarLanzamientoRapido, manejarLanzamientoRitual, manejarLanzamientoGratis
  } = usarLanzamientoTarjetaConjuro({
    hechizo, nombrePersonaje, nivelPersonaje, bonoAtaqueMagico, bonoDanoMagico,
    modificadorHabilidad, bloqueadoPorArmadura, alLanzar, alGastarEspacio, alGastarPuntos,
    alGastarEspacioPacto, esLanzadorPacto, nivelEspacioPacto, espaciosPactoMaximos,
    espaciosPactoGastados, espaciosConjuroMaximos, nivelConjuroMaximo,
    alEstablecerConcentracion, costePuntosPorNivel, sistemaMagia, permitirUpcastLibre, alLanzarGratis
  });

  const infoTruco = esTruco ? calcularInfoTruco(hechizo, nivelPersonaje, bonoDanoMagico, modificadorHabilidad) : null;
  const claseEstadoTarjeta = esConcentracionActual
    ? estilos.tarjetaConcentracion
    : estilos.tarjetaPreparada;

  return (
    <div className={`${estilos.tarjeta} ${claseEstadoTarjeta}`}>
      {/* 1. Cabecera del Conjuro: Nombre, Badges de Reglas y Acciones de Visibilidad */}
      <div className={estilos.filaSuperiorConjuro}>
        <div className={estilos.filaTitulo}>
          <button
            type="button"
            onClick={() => alAbrirDetalleCompleto(hechizo)}
            title="Ver descripción y ficha completa del conjuro"
            className={estilos.nombreConjuro}
          >
            {hechizo.nombre}
          </button>

          {hechizo.concentracion && (
            <span title="Requiere Concentración" className={estilos.tagConcentracion}>
              C
            </span>
          )}

          {hechizo.ritual && (
            <span title="Puede lanzarse como Ritual" className={estilos.tagRitual}>
              Ritual
            </span>
          )}

          {bloqueadoPorArmadura && (
            <span
              title={motivoBloqueoArmadura || "Lanzamiento bloqueado por armadura sin competencia"}
              className={estilos.iconoAlertaArmadura}
            >
              <AlertTriangle size={11} color="var(--pj-texto-alerta)" />
            </span>
          )}
        </div>

        {/* Acciones Secundarias Rápidas en la Cabecera */}
        <div className={estilos.accionesCabeceraConjuro}>
          {alAlternarOcultar ? (
            <button
              type="button"
              onClick={alAlternarOcultar}
              title={esOculto ? "Mostrar conjuro (restaurar a su nivel)" : "Ocultar conjuro"}
              className={`${estilos.botonIcono} ${esOculto ? estilos.botonOcultoActivo : ""}`}
            >
              {esOculto ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => alAbrirDetalleCompleto(hechizo)}
              title="Ver ficha completa"
              className={estilos.botonIcono}
            >
              <Eye size={13} />
            </button>
          )}

          {alQuitarDeLista && (
            <button
              type="button"
              onClick={alQuitarDeLista}
              title="Quitar conjuro de la lista"
              className={`${estilos.botonIcono} ${estilos.botonIconoEliminar}`}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Metadatos y Origen Mágico */}
      <div className={estilos.filaMetadatosConjuro}>
        <span className={estilos.textoMetadatosBase}>
          {hechizo.escuela} {hechizo.alcance ? `• ${hechizo.alcance}` : ""}
          {esTruco && infoTruco?.etiquetaVisual ? (
            <strong className={estilos.trucoEscalado} data-potenciado={infoTruco.multiplicador > 1}>
              • {infoTruco.etiquetaVisual} {infoTruco.multiplicador > 1 ? `(Nv.${nivelPersonaje})` : ""}
            </strong>
          ) : hechizo.dadosDaño ? (
            (() => {
              const modHab = hechizo.agregarModificadorHabilidad ? modificadorHabilidad : 0;
              const bonoTotal = bonoDanoMagico + modHab;
              return ` • ${bonoTotal !== 0 ? aplicarBonoNumericoAFormulaDados(hechizo.dadosDaño, bonoTotal) : hechizo.dadosDaño}`;
            })()
          ) : null}
        </span>

        {esOtorgado && configBadge && origenEfectivo && (
          <span title={configBadge.tooltip} className={estilos.badgeSubclaseTexto} data-origen={origenEfectivo}>
            <Sparkles size={8} /> {configBadge.etiqueta}
          </span>
        )}
      </div>

      {/* 3. Touchpad Táctico de Lanzamiento (Selector Upcast + Botón Lanzar + Ritual/Gratis) */}
      <div className={estilos.touchpadLanzamientoConjuro}>
        {!esTruco && (
          opcionesLanzamiento.length > 1 ? (
            <div className={estilos.selectUpcastContenedor}>
              <SelectorDesplegable
                valor={String(nivelUpcast)}
                alCambiar={(val) => setNivelUpcast(Number(val))}
                tamano="mini"
                titulo="Nivel de ranura de lanzamiento (Upcast)"
                opciones={opcionesLanzamiento.map((opt) => ({
                  valor: String(opt.nivel),
                  etiqueta: opt.etiqueta
                }))}
              />
            </div>
          ) : (
            <div
              className={`${estilos.badgeNivelFijo} ${opcionesLanzamiento[0]?.tipo === "pacto" ? estilos.badgeNivelFijoPacto : ""}`}
              title={
                opcionesLanzamiento[0]?.tipo === "pacto"
                  ? "Lanzamiento automático con ranura de Pacto de nivel fijo (Brujo)"
                  : `Lanzamiento con ranura de Nivel ${opcionesLanzamiento[0]?.nivel || hechizo.nivel}`
              }
            >
              {opcionesLanzamiento[0]?.etiqueta || `Nv. ${hechizo.nivel}`}
            </div>
          )
        )}

        <div className={estilos.botonesLanzamientoFila}>
          <button
            type="button"
            onClick={manejarLanzamientoRapido}
            disabled={bloqueadoPorArmadura}
            title={
              bloqueadoPorArmadura
                ? (motivoBloqueoArmadura || "Bloqueado por armadura sin competencia")
                : esTruco
                ? "Lanzar truco en TaleSpire"
                : `Lanzar con ranura de Nivel ${nivelUpcast}`
            }
            className={`${estilos.botonLanzar} ${bloqueadoPorArmadura ? estilos.botonBloqueado : ""}`}
          >
            <Zap size={12} />
            <span>Lanzar</span>
          </button>

          {tieneLanzamientoGratisDisponible && !esTruco && (
            <button
              type="button"
              onClick={manejarLanzamientoGratis}
              disabled={bloqueadoPorArmadura}
              title="Lanzar gratis (1/Descanso Largo)"
              className={`${estilos.botonLanzarGratis} ${bloqueadoPorArmadura ? estilos.botonBloqueado : ""}`}
            >
              <Sparkles size={11} color="var(--pj-texto-exito)" />
              <span>Gratis</span>
            </button>
          )}

          {hechizo.ritual && !esTruco && (
            <button
              type="button"
              onClick={manejarLanzamientoRitual}
              disabled={bloqueadoPorArmadura}
              title="Lanzar como Ritual (+10 min adicionales)"
              className={`${estilos.botonRitual} ${bloqueadoPorArmadura ? estilos.botonBloqueado : ""}`}
            >
              <Sparkles size={11} />
              <span>Ritual</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

TarjetaConjuroCompacta.displayName = "TarjetaConjuroCompacta";
