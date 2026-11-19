import React from "react";
import { Zap, Trash2, StarOff, Sparkles, AlertTriangle, Swords } from "lucide-react";
import type { HechizoBase } from "@/tipos";
import { COSTE_PUNTOS_POR_NIVEL } from "@/constantes";
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
  esPreparador?: boolean;
  esDeSubclase?: boolean;
  origenBadge?: OrigenConjuroBadge | null;
  mostrarTogglePreparado?: boolean;
  esConcentracionActual?: boolean;
  enAcciones?: boolean;
  alAlternarAcciones?: () => void;
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
  espaciosConjuroGastados?: Record<string, number>;
  nivelConjuroMaximo?: number;
  alEstablecerConcentracion?: (id: string, nombre: string) => void;
  costePuntosPorNivel?: Record<number, number>;
  puntosConjuroDisponibles?: number;
  sistemaMagia?: "espacios" | "puntos";
  bloqueadoPorArmadura?: boolean;
  motivoBloqueoArmadura?: string;
  permitirUpcastLibre?: boolean;
  tieneLanzamientoGratisDisponible?: boolean;
  alLanzarGratis?: () => Promise<void>;
}

/**
 * Componente de tarjeta compacta de conjuro/truco en la hoja de personaje y combat tracker.
 * Optimizado con React.memo para evitar re-renderizados innecesarios de decenas de instancias
 * al actualizar otros estados del personaje (vitalidad, iniciativa, movimiento, dados).
 */
export const TarjetaConjuroCompacta: React.FC<TarjetaConjuroCompactaProps> = React.memo(({
  hechizo,
  nombrePersonaje,
  nivelPersonaje = 1,
  bonoAtaqueMagico,
  bonoDanoMagico = 0,
  modificadorHabilidad = 0,
  estaPreparado: _estaPreparado,
  esPreparador = false,
  esDeSubclase = false,
  origenBadge,
  mostrarTogglePreparado: _mostrarTogglePreparado = false,
  esConcentracionActual = false,
  enAcciones = false,
  alAlternarAcciones,
  alAlternarPreparado: _alAlternarPreparado,
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
  espaciosConjuroGastados,
  nivelConjuroMaximo = 0,
  alEstablecerConcentracion,
  costePuntosPorNivel = COSTE_PUNTOS_POR_NIVEL,
  puntosConjuroDisponibles,
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
    opcionActual,
    nivelUpcast,
    setNivelUpcast,
    costeNivelActual,
    sinRecursosParaNivelActual,
    manejarLanzamientoRapido,
    manejarLanzamientoRitual,
    manejarLanzamientoGratis
  } = usarLanzamientoTarjetaConjuro({
    hechizo,
    nombrePersonaje,
    nivelPersonaje,
    bonoAtaqueMagico,
    bonoDanoMagico,
    modificadorHabilidad,
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
    espaciosConjuroGastados,
    nivelConjuroMaximo,
    alEstablecerConcentracion,
    costePuntosPorNivel,
    puntosConjuroDisponibles,
    sistemaMagia,
    permitirUpcastLibre,
    alLanzarGratis
  });

  const infoTruco = esTruco ? calcularInfoTruco(hechizo, nivelPersonaje, bonoDanoMagico, modificadorHabilidad) : null;

  const claseEstadoTarjeta = esConcentracionActual
    ? estilos.tarjetaConcentracion
    : estilos.tarjetaPreparada;

  const usaPactoActual = opcionActual?.recurso === "pacto";
  const textoSinRecursos = usaPactoActual
    ? `Sin ranuras de Pacto de Nivel ${nivelEspacioPacto || nivelUpcast} disponibles — recupera espacios con un descanso`
    : opcionActual?.recurso === "puntos"
    ? `Sin puntos suficientes para Nivel ${nivelUpcast} (requiere ${costeNivelActual} puntos, tienes ${puntosConjuroDisponibles ?? 0})`
    : `Sin ranuras de Nivel ${nivelUpcast} disponibles — sube el nivel de lanzamiento o recupera espacios`;

  const tituloBotonLanzar = bloqueadoPorArmadura
    ? (motivoBloqueoArmadura || "Bloqueado por armadura sin competencia")
    : esTruco
    ? "Lanzar truco a TaleSpire"
    : sinRecursosParaNivelActual
    ? textoSinRecursos
    : usaPactoActual
    ? `Lanzar con ranura de Pacto Nivel ${nivelEspacioPacto || nivelUpcast} (descuenta 1 espacio de pacto)`
    : `Lanzar con ranura de Nivel ${nivelUpcast} (descuenta ${
        opcionActual?.recurso === "puntos"
          ? `${costeNivelActual} puntos`
          : "1 espacio"
      })`;

  const tituloBadgeFijo =
    opcionesLanzamiento[0]?.recurso === "pacto"
      ? "Lanzamiento automático con ranura de Pacto de nivel fijo (Brujo)"
      : opcionActual?.recurso === "puntos"
      ? `Lanzamiento de Nivel ${opcionesLanzamiento[0]?.nivel || hechizo.nivel} (${costeNivelActual} pts)`
      : `Lanzamiento con ranura de Nivel ${opcionesLanzamiento[0]?.nivel || hechizo.nivel}`;

  return (
    <div className={`${estilos.tarjeta} ${claseEstadoTarjeta}`}>
      {/* Lado Izquierdo: Nombre y Badges */}
      <div className={estilos.ladoIzquierdo}>
        <div className={estilos.bloqueNombre}>
          <div className={estilos.filaTitulo}>
            <button
              type="button"
              onClick={() => alAbrirDetalleCompleto(hechizo)}
              title="Ver descripción y ficha completa del conjuro"
              className={estilos.nombreConjuro}
            >
              {hechizo.nombre}
            </button>

            {/* Badges */}
            {hechizo.concentracion && (
              <span
                title="Requiere Concentración"
                aria-label="Requiere concentración"
                className={estilos.tagConcentracion}
              >
                C
              </span>
            )}

            {hechizo.ritual && (
              <span
                title="Puede lanzarse como Ritual"
                aria-label="Puede lanzarse como ritual"
                className={estilos.tagRitual}
              >
                R
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

          <span className={estilos.filaMetadatos}>
            {hechizo.escuela} {hechizo.alcance ? `• ${hechizo.alcance}` : ""}
            {esTruco && infoTruco?.etiquetaVisual ? (
              <strong
                className={estilos.trucoEscalado}
                data-potenciado={infoTruco.multiplicador > 1}
              >
                • {infoTruco.etiquetaVisual} {infoTruco.multiplicador > 1 ? `(Nv.${nivelPersonaje})` : ""}
              </strong>
            ) : hechizo.dadosDaño ? (
              (() => {
                const modHab = hechizo.agregarModificadorHabilidad ? modificadorHabilidad : 0;
                const bonoTotal = bonoDanoMagico + modHab;
                return ` • ${bonoTotal !== 0 ? aplicarBonoNumericoAFormulaDados(hechizo.dadosDaño, bonoTotal) : hechizo.dadosDaño}`;
              })()
            ) : (
              ""
            )}
          </span>

          {/* Badge de Origen dinámico (clase, subclase, especie, legado, rasgos) */}
          {esOtorgado && configBadge && origenEfectivo && (
            <div className={estilos.filaSubclaseInferior}>
              <span
                title={configBadge.tooltip}
                className={estilos.badgeSubclaseTexto}
                data-origen={origenEfectivo}
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
              className={`${estilos.badgeNivelFijo} ${opcionesLanzamiento[0]?.recurso === "pacto" ? estilos.badgeNivelFijoPacto : ""}`}
              title={tituloBadgeFijo}
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
            aria-label={`Lanzar ${hechizo.nombre}`}
            data-bloqueado={bloqueadoPorArmadura ? "true" : undefined}
            data-sin-recursos={sinRecursosParaNivelActual ? "true" : undefined}
            title={tituloBotonLanzar}
            className={`${estilos.botonLanzar} ${
              bloqueadoPorArmadura
                ? estilos.botonBloqueado
                : sinRecursosParaNivelActual
                ? estilos.botonLanzarSinRecursos
                : ""
            }`}
          >
            <Zap size={11} />
            <span>Lanzar</span>
          </button>

          {/* Fila de Acciones Secundarias (Gratis, Ritual, Acciones, Quitar) */}
          <div className={estilos.filaAccionesSecundarias}>
            {/* Botón Lanzamiento Gratuito Diario (1/Descanso Largo) */}
            {tieneLanzamientoGratisDisponible && !esTruco && (
              <button
                type="button"
                onClick={manejarLanzamientoGratis}
                disabled={bloqueadoPorArmadura}
                aria-label={`Lanzar ${hechizo.nombre} gratis`}
                data-bloqueado={bloqueadoPorArmadura ? "true" : undefined}
                title={
                  bloqueadoPorArmadura
                    ? (motivoBloqueoArmadura || "Bloqueado por armadura sin competencia")
                    : "Lanzar gratis (1 uso por descanso largo, sin gastar ranuras ni puntos)"
                }
                className={`${estilos.botonLanzarGratis} ${bloqueadoPorArmadura ? estilos.botonBloqueado : ""}`}
              >
                <Sparkles
                  size={11}
                  color={bloqueadoPorArmadura ? "currentColor" : "var(--pj-texto-exito)"}
                />
                <span>Gratis</span>
              </button>
            )}

            {/* Botón Lanzamiento como Ritual (D&D 2024: +10 min, sin gastar ranura) */}
            {hechizo.ritual && !esTruco && (
              <button
                type="button"
                onClick={manejarLanzamientoRitual}
                disabled={bloqueadoPorArmadura}
                aria-label={`Lanzar ${hechizo.nombre} como ritual`}
                data-bloqueado={bloqueadoPorArmadura ? "true" : undefined}
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

            {/* Botón Toggle Mostrar/Quitar en Acciones */}
            {alAlternarAcciones && (
              <button
                type="button"
                onClick={alAlternarAcciones}
                aria-pressed={enAcciones}
                aria-label={enAcciones ? `Quitar ${hechizo.nombre} de Acciones` : `Mostrar ${hechizo.nombre} en Acciones`}
                title={enAcciones ? "Quitar de la pestaña Acciones" : "Mostrar en la pestaña Acciones"}
                className={`${estilos.botonIcono} ${estilos.botonToggleAcciones} ${enAcciones ? estilos.botonToggleAccionesActivo : ""}`}
              >
                <Swords size={13} />
              </button>
            )}

            {/* Botón Despreparar o Quitar de Lista */}
            {alQuitarDeLista && !esOtorgado && (
              <button
                type="button"
                onClick={alQuitarDeLista}
                title={esPreparador ? "Despreparar conjuro" : "Quitar conjuro de la lista del personaje"}
                aria-label={esPreparador ? `Despreparar ${hechizo.nombre}` : `Quitar ${hechizo.nombre} de la lista`}
                className={`${estilos.botonIcono} ${estilos.botonIconoEliminar}`}
              >
                {esPreparador ? <StarOff size={13} /> : <Trash2 size={13} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
