import React from "react";
import { Zap, Eye, EyeOff, Trash2, Check, Sparkles, AlertTriangle } from "lucide-react";
import type { HechizoBase } from "@/tipos";
import { calcularInfoTruco } from "@/utiles/utilesConjuros";
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

export const TarjetaConjuroCompacta: React.FC<TarjetaConjuroCompactaProps> = ({
  hechizo,
  nombrePersonaje,
  nivelPersonaje = 1,
  bonoAtaqueMagico,
  estaPreparado,
  esDeSubclase = false,
  origenBadge,
  mostrarTogglePreparado = false,
  esConcentracionActual = false,
  esOculto = false,
  alAlternarOcultar,
  alAlternarPreparado,
  alQuitarDeLista,
  alAbrirDetalleCompleto,
  alLanzar,
  alGastarEspacio,
  alGastarPuntos,
  alGastarEspacioPacto,
  esLanzadorPacto = false,
  nivelEspacioPacto = 0,
  espaciosPactoMaximos = 0,
  espaciosPactoGastados = 0,
  espaciosConjuroMaximos = {},
  nivelConjuroMaximo = 0,
  alEstablecerConcentracion,
  costePuntosPorNivel,
  sistemaMagia = "espacios",
  bloqueadoPorArmadura = false,
  motivoBloqueoArmadura,
  permitirUpcastLibre,
  tieneLanzamientoGratisDisponible = false,
  alLanzarGratis
}) => {
  const esTruco = hechizo.nivel === 0;
  const origenEfectivo: OrigenConjuroBadge | null = origenBadge ?? (esDeSubclase ? "subclase" : null);
  const esOtorgado = Boolean(origenEfectivo);
  const configBadge = origenEfectivo ? CONFIG_BADGES_ORIGEN_CONJURO[origenEfectivo] : null;

  const {
    opcionesLanzamiento,
    nivelUpcast,
    setNivelUpcast,
    manejarLanzamientoRapido,
    manejarLanzamientoRitual,
    manejarLanzamientoGratis
  } = usarLanzamientoTarjetaConjuro({
    hechizo,
    nombrePersonaje,
    nivelPersonaje,
    bonoAtaqueMagico,
    bloqueadoPorArmadura,
    alLanzar,
    alGastarEspacio,
    alGastarPuntos,
    alGastarEspacioPacto,
    esLanzadorPacto,
    nivelEspacioPacto,
    espaciosPactoMaximos,
    espaciosPactoGastados,
    espaciosConjuroMaximos,
    nivelConjuroMaximo,
    alEstablecerConcentracion,
    costePuntosPorNivel,
    sistemaMagia,
    permitirUpcastLibre,
    alLanzarGratis
  });

  const infoTruco = esTruco ? calcularInfoTruco(hechizo, nivelPersonaje) : null;

  const claseEstadoTarjeta = esConcentracionActual
    ? estilos.tarjetaConcentracion
    : estaPreparado || !mostrarTogglePreparado
    ? estilos.tarjetaPreparada
    : estilos.tarjetaNoPreparada;

  return (
    <div className={`${estilos.tarjeta} ${claseEstadoTarjeta}`}>
      {/* Lado Izquierdo: Checkbox (si aplica) + Nombre y Badges */}
      <div className={estilos.ladoIzquierdo}>
        {mostrarTogglePreparado && !esTruco && (
          <button
            type="button"
            onClick={esOtorgado ? undefined : alAlternarPreparado}
            title={
              esOtorgado && configBadge
                ? `${configBadge.tooltip} (no consume cupo diario)`
                : estaPreparado
                ? "Conjuro preparado (clic para desmarcar)"
                : "Conjuro no preparado (clic para preparar)"
            }
            className={
              esOtorgado
                ? estilos.checkboxSubclase
                : `${estilos.checkboxPreparado} ${estaPreparado ? estilos.checkboxPreparadoActivo : ""}`
            }
          >
            {(estaPreparado || esOtorgado) && <Check size={12} />}
          </button>
        )}

        <div className={estilos.bloqueNombre}>
          <div className={estilos.filaTitulo}>
            <button
              type="button"
              onClick={() => alAbrirDetalleCompleto(hechizo)}
              title="Ver descripción y ficha completa del conjuro"
              className={`${estilos.nombreConjuro} ${!estaPreparado && mostrarTogglePreparado && !esOtorgado ? estilos.nombreConjuroInactivo : ""}`}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
            >
              {hechizo.nombre}
            </button>

            {/* Badges */}
            {hechizo.concentracion && (
              <span
                title="Requiere Concentración"
                className={estilos.tagConcentracion}
              >
                C
              </span>
            )}

            {hechizo.ritual && (
              <span
                title="Puede lanzarse como Ritual"
                className={estilos.tagRitual}
              >
                R
              </span>
            )}

            {bloqueadoPorArmadura && (
              <span
                title={motivoBloqueoArmadura || "Lanzamiento bloqueado por armadura sin competencia"}
                style={{ display: "inline-flex", alignItems: "center" }}
              >
                <AlertTriangle size={11} color="#ef4444" />
              </span>
            )}
          </div>

          <span className={estilos.filaMetadatos}>
            {hechizo.escuela} {hechizo.alcance ? `• ${hechizo.alcance}` : ""}
            {esTruco && infoTruco?.etiquetaVisual ? (
              <strong style={{ color: infoTruco.multiplicador > 1 ? "#93c5fd" : "#cbd5e1", marginLeft: 4 }}>
                • {infoTruco.etiquetaVisual} {infoTruco.multiplicador > 1 ? `(Nv.${nivelPersonaje})` : ""}
              </strong>
            ) : hechizo.dadosDaño ? (
              ` • ${hechizo.dadosDaño}`
            ) : (
              ""
            )}
          </span>

          {/* Badge de Origen dinámico (clase, subclase, especie, legado, rasgos) */}
          {esOtorgado && configBadge && (
            <div className={estilos.filaSubclaseInferior}>
              <span
                title={configBadge.tooltip}
                className={estilos.badgeSubclaseTexto}
                style={{
                  color: configBadge.colorTexto,
                  backgroundColor: configBadge.colorFondo,
                  borderColor: configBadge.colorBorde
                }}
              >
                <Sparkles size={8} /> {configBadge.etiqueta}
              </span>
            </div>
          )}
        </div>
      </div>
      {/* Lado Derecho: Selector de Nivel de Ranura (Upcast) o Badge Fijo + Acciones */}
      <div className={estilos.ladoDerecho}>
        {/* Selector Upcast o Badge Informativo Fijo */}
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

        {/* Columna de Acciones: Botón Lanzar Principal + Fila de Acciones Secundarias */}
        <div className={estilos.columnaAcciones}>
          {/* Botón Lanzamiento Rápido */}
          <button
            type="button"
            onClick={manejarLanzamientoRapido}
            disabled={bloqueadoPorArmadura}
            title={
              bloqueadoPorArmadura
                ? (motivoBloqueoArmadura || "Bloqueado por armadura sin competencia")
                : esTruco
                ? "Lanzar truco a TaleSpire"
                : esLanzadorPacto
                ? `Lanzar con ranura de Pacto Nivel ${nivelEspacioPacto || nivelUpcast} (descuenta 1 espacio de pacto)`
                : `Lanzar con ranura de Nivel ${nivelUpcast} (descuenta ${
                    sistemaMagia === "puntos"
                      ? `${costePuntosPorNivel?.[nivelUpcast] ?? 2} puntos`
                      : "1 espacio"
                  })`
            }
            className={`${estilos.botonLanzar} ${bloqueadoPorArmadura ? estilos.botonBloqueado : ""}`}
          >
            <Zap size={11} />
            <span>Lanzar</span>
          </button>

          {/* Fila de Acciones Secundarias (Gratis, Ritual, Ver/Ocultar, Quitar) */}
          <div className={estilos.filaAccionesSecundarias}>
            {/* Botón Lanzamiento Gratuito Diario (1/Descanso Largo) */}
            {tieneLanzamientoGratisDisponible && !esTruco && (
              <button
                type="button"
                onClick={manejarLanzamientoGratis}
                disabled={bloqueadoPorArmadura}
                title={
                  bloqueadoPorArmadura
                    ? (motivoBloqueoArmadura || "Bloqueado por armadura sin competencia")
                    : "Lanzar gratis (1 uso por descanso largo, sin gastar ranuras ni puntos)"
                }
                className={`${estilos.botonLanzarGratis} ${bloqueadoPorArmadura ? estilos.botonBloqueado : ""}`}
              >
                <Sparkles size={11} color="#34d399" />
                <span>Gratis</span>
              </button>
            )}

            {/* Botón Lanzamiento como Ritual (D&D 2024: +10 min, sin gastar ranura) */}
            {hechizo.ritual && !esTruco && (
              <button
                type="button"
                onClick={manejarLanzamientoRitual}
                disabled={bloqueadoPorArmadura}
                title={
                  bloqueadoPorArmadura
                    ? (motivoBloqueoArmadura || "Bloqueado por armadura sin competencia")
                    : "Lanzar como Ritual (+10 min adicionales, sin consumir ranuras ni puntos de magia)"
                }
                className={`${estilos.botonRitual} ${bloqueadoPorArmadura ? estilos.botonBloqueado : ""}`}
              >
                <Sparkles size={11} />
                <span>Ritual</span>
              </button>
            )}

            {/* Botón Ocultar/Mostrar o Ver Ficha Completa */}
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
                title="Ver ficha completa y opciones de lanzamiento"
                className={estilos.botonIcono}
              >
                <Eye size={13} />
              </button>
            )}

            {/* Botón Quitar de Lista */}
            {alQuitarDeLista && (
              <button
                type="button"
                onClick={alQuitarDeLista}
                title="Quitar conjuro de la lista del personaje"
                className={`${estilos.botonIcono} ${estilos.botonIconoEliminar}`}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
