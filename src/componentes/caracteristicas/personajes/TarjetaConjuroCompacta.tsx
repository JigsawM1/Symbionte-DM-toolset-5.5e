import React from "react";
import { Zap, Trash2, StarOff, Gift, Clock, Lock, AlertTriangle, Swords } from "lucide-react";
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
  nivelPersonaje?: number;
  bonoAtaqueMagico?: number;
  bonoDanoMagico?: number;
  modificadorHabilidad?: number;
  estaPreparado?: boolean;
  esPreparador?: boolean;
  esDeSubclase?: boolean;
  origenBadge?: OrigenConjuroBadge | null;
  esConcentracionActual?: boolean;
  enAcciones?: boolean;
  alAlternarAcciones?: () => void;
  alQuitarDeLista?: () => void;
  alAbrirDetalleCompleto: (hechizo: HechizoBase) => void;
  alLanzar: (modo: ModoLanzamiento, nivelLanzamiento?: number) => Promise<boolean | void>;
  esLanzadorPacto?: boolean;
  nivelEspacioPacto?: number;
  espaciosPactoMaximos?: number;
  espaciosPactoGastados?: number;
  espaciosConjuroMaximos?: Record<string, number>;
  espaciosConjuroGastados?: Record<string, number>;
  nivelConjuroMaximo?: number;
  costePuntosPorNivel?: Record<number, number>;
  puntosConjuroDisponibles?: number;
  sistemaMagia?: "espacios" | "puntos";
  bloqueadoPorArmadura?: boolean;
  motivoBloqueoArmadura?: string;
  tieneLanzamientoGratisDisponible?: boolean;
}

/**
 * Componente de tarjeta compacta de conjuro/truco en la hoja de personaje y combat tracker.
 * Optimizado con React.memo para evitar re-renderizados innecesarios de decenas de instancias
 * al actualizar otros estados del personaje (vitalidad, iniciativa, movimiento, dados).
 */
export const TarjetaConjuroCompacta: React.FC<TarjetaConjuroCompactaProps> = React.memo(({
  hechizo,
  nivelPersonaje = 1,
  bonoDanoMagico = 0,
  modificadorHabilidad = 0,
  esPreparador = false,
  esDeSubclase = false,
  origenBadge,
  esConcentracionActual = false,
  enAcciones = false,
  alAlternarAcciones,
  alQuitarDeLista,
  alAbrirDetalleCompleto,
  alLanzar,
  esLanzadorPacto = false,
  nivelEspacioPacto = 0,
  espaciosPactoMaximos = 0,
  espaciosPactoGastados = 0,
  espaciosConjuroMaximos = {},
  espaciosConjuroGastados,
  nivelConjuroMaximo = 0,
  costePuntosPorNivel = COSTE_PUNTOS_POR_NIVEL,
  puntosConjuroDisponibles,
  sistemaMagia = "espacios",
  bloqueadoPorArmadura = false,
  motivoBloqueoArmadura,
  tieneLanzamientoGratisDisponible = false
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
    bloqueadoPorArmadura,
    alLanzar,
    esLanzadorPacto,
    nivelEspacioPacto,
    espaciosPactoMaximos,
    espaciosPactoGastados,
    espaciosConjuroMaximos,
    espaciosConjuroGastados,
    nivelConjuroMaximo,
    costePuntosPorNivel,
    puntosConjuroDisponibles,
    sistemaMagia
  });

  const infoTruco = esTruco ? calcularInfoTruco(hechizo, nivelPersonaje, bonoDanoMagico, modificadorHabilidad) : null;
  const bonoDanoTotal = bonoDanoMagico + (hechizo.agregarModificadorHabilidad ? modificadorHabilidad : 0);
  const formulaDanoConjuro = !esTruco && hechizo.dadosDaño
    ? (bonoDanoTotal !== 0 ? aplicarBonoNumericoAFormulaDados(hechizo.dadosDaño, bonoDanoTotal) : hechizo.dadosDaño)
    : null;

  const usaPactoActual = opcionActual?.recurso === "pacto";
  const tieneBotonGratis = tieneLanzamientoGratisDisponible && !esTruco;
  const tieneBotonRitual = Boolean(hechizo.ritual) && !esTruco;
  const tieneAlternativos = tieneBotonGratis || tieneBotonRitual;
  const tieneUtilidades = Boolean(alAlternarAcciones) || (Boolean(alQuitarDeLista) && !esOtorgado);
  const textoBloqueo = motivoBloqueoArmadura || "Bloqueado por armadura sin competencia";

  const claseEstadoTarjeta = esConcentracionActual
    ? estilos.tarjetaConcentracion
    : bloqueadoPorArmadura
    ? estilos.tarjetaBloqueada
    : sinRecursosParaNivelActual
    ? estilos.tarjetaSinRecursos
    : usaPactoActual
    ? estilos.tarjetaPacto
    : esTruco
    ? estilos.tarjetaTruco
    : "";

  const textoSinRecursos = usaPactoActual
    ? `Sin ranuras de Pacto de Nivel ${nivelEspacioPacto || nivelUpcast} disponibles — recupera espacios con un descanso`
    : opcionActual?.recurso === "puntos"
    ? `Sin puntos suficientes para Nivel ${nivelUpcast} (requiere ${costeNivelActual} puntos, tienes ${puntosConjuroDisponibles ?? 0})`
    : `Sin ranuras de Nivel ${nivelUpcast} disponibles — sube el nivel de lanzamiento o recupera espacios`;

  const tituloBotonLanzar = bloqueadoPorArmadura
    ? textoBloqueo
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
    <div
      className={`${estilos.tarjeta} ${claseEstadoTarjeta}`}
      data-tiene-alternativos={tieneAlternativos ? "true" : undefined}
    >
      {/* Área 1: Nombre del conjuro y estado táctico */}
      <div className={estilos.bloqueTitulo}>
        <button
          type="button"
          onClick={() => alAbrirDetalleCompleto(hechizo)}
          title="Ver descripción y ficha completa del conjuro"
          className={estilos.nombreConjuro}
        >
          {hechizo.nombre}
        </button>

        {esConcentracionActual ? (
          <span
            title="Concentración activa en este conjuro"
            aria-label="Concentración activa"
            className={`${estilos.tagConcentracion} ${estilos.tagConcentracionActiva}`}
          >
            <span className={estilos.puntoConcentracion} aria-hidden="true" />
            Concentrando
          </span>
        ) : hechizo.concentracion ? (
          <span
            title="Requiere Concentración"
            aria-label="Requiere concentración"
            className={estilos.tagConcentracion}
          >
            C
          </span>
        ) : null}

        {bloqueadoPorArmadura && (
          <span
            title={textoBloqueo}
            aria-label="Bloqueado por armadura sin competencia"
            className={estilos.tagArmadura}
          >
            <AlertTriangle size={11} aria-hidden="true" />
            <span>Armadura</span>
          </span>
        )}
      </div>

      {/* Área 2: Split Control unificado (Recurso/Upcast + Botón Lanzar fijo) */}
      <div className={estilos.grupoLanzamiento}>
        {!esTruco && (
          opcionesLanzamiento.length > 1 ? (
            <div
              className={estilos.selectUpcastContenedor}
              data-pacto={usaPactoActual ? "true" : undefined}
              data-sin-recursos={sinRecursosParaNivelActual ? "true" : undefined}
            >
              <SelectorDesplegable
                valor={String(nivelUpcast)}
                alCambiar={(val) => setNivelUpcast(Number(val))}
                titulo="Nivel de ranura de lanzamiento (Upcast)"
                opciones={opcionesLanzamiento.map((opt) => ({
                  valor: String(opt.nivel),
                  etiqueta: opt.etiqueta
                }))}
              />
            </div>
          ) : (
            <div
              className={`${estilos.badgeNivelFijo} ${
                usaPactoActual ? estilos.badgeNivelFijoPacto : ""
              } ${sinRecursosParaNivelActual ? estilos.badgeNivelFijoAgotado : ""}`}
              title={tituloBadgeFijo}
            >
              {opcionesLanzamiento[0]?.etiqueta || `Nv. ${hechizo.nivel}`}
            </div>
          )
        )}

        <button
          type="button"
          onClick={manejarLanzamientoRapido}
          disabled={bloqueadoPorArmadura}
          aria-label={`Lanzar ${hechizo.nombre}`}
          data-bloqueado={bloqueadoPorArmadura ? "true" : undefined}
          data-sin-recursos={sinRecursosParaNivelActual ? "true" : undefined}
          title={tituloBotonLanzar}
          className={`${estilos.botonLanzar} ${!esTruco ? estilos.botonLanzarAcoplado : ""} ${
            bloqueadoPorArmadura
              ? estilos.botonBloqueado
              : sinRecursosParaNivelActual
              ? estilos.botonLanzarSinRecursos
              : ""
          }`}
        >
          {bloqueadoPorArmadura ? <Lock size={11} aria-hidden="true" /> : <Zap size={11} aria-hidden="true" />}
          <span>Lanzar</span>
        </button>
      </div>

      {/* Área 3: Metadatos (Origen integrado + Escuela/Alcance + Píldora de dado) */}
      <div className={estilos.filaMetadatos}>
        {esOtorgado && configBadge && origenEfectivo && (
          <span
            title={configBadge.tooltip}
            className={estilos.badgeOrigen}
            data-origen={origenEfectivo}
          >
            <span className={estilos.puntoOrigen} aria-hidden="true" />
            {configBadge.etiqueta}
          </span>
        )}

        <span className={estilos.textoMetadato}>
          {hechizo.escuela}
          {hechizo.alcance ? ` · ${hechizo.alcance}` : ""}
        </span>

        {esTruco && infoTruco?.etiquetaVisual ? (
          <strong
            className={estilos.pildoraFormula}
            data-potenciado={infoTruco.multiplicador > 1 ? "true" : undefined}
          >
            {infoTruco.etiquetaVisual}
            {infoTruco.multiplicador > 1 ? ` · Nv.${nivelPersonaje}` : ""}
          </strong>
        ) : formulaDanoConjuro ? (
          <strong className={estilos.pildoraFormula}>{formulaDanoConjuro}</strong>
        ) : null}
      </div>

      {/* Área 4: Lanzamientos alternativos + separador + utilidades */}
      {(tieneAlternativos || tieneUtilidades) && (
        <div className={estilos.filaAccionesSecundarias}>
          {tieneBotonGratis && (
            <button
              type="button"
              onClick={manejarLanzamientoGratis}
              disabled={bloqueadoPorArmadura}
              aria-label={`Lanzar ${hechizo.nombre} gratis`}
              data-bloqueado={bloqueadoPorArmadura ? "true" : undefined}
              title={
                bloqueadoPorArmadura
                  ? textoBloqueo
                  : "Lanzar gratis (1 uso por descanso largo, sin gastar ranuras ni puntos)"
              }
              className={`${estilos.botonSecundario} ${estilos.botonLanzarGratis} ${
                sinRecursosParaNivelActual ? estilos.botonAlternativoDestacado : ""
              } ${bloqueadoPorArmadura ? estilos.botonBloqueado : ""}`}
            >
              <Gift size={11} aria-hidden="true" />
              <span>Gratis</span>
            </button>
          )}

          {tieneBotonRitual && (
            <button
              type="button"
              onClick={manejarLanzamientoRitual}
              disabled={bloqueadoPorArmadura}
              aria-label={`Lanzar ${hechizo.nombre} como ritual`}
              data-bloqueado={bloqueadoPorArmadura ? "true" : undefined}
              title={
                bloqueadoPorArmadura
                  ? textoBloqueo
                  : "Lanzar como Ritual (+10 min adicionales, sin consumir ranuras ni puntos de magia)"
              }
              className={`${estilos.botonSecundario} ${estilos.botonRitual} ${
                sinRecursosParaNivelActual ? estilos.botonAlternativoDestacado : ""
              } ${bloqueadoPorArmadura ? estilos.botonBloqueado : ""}`}
            >
              <Clock size={11} aria-hidden="true" />
              <span>Ritual</span>
            </button>
          )}

          {tieneAlternativos && tieneUtilidades && (
            <span className={estilos.separadorAcciones} aria-hidden="true" />
          )}

          {alAlternarAcciones && (
            <button
              type="button"
              onClick={alAlternarAcciones}
              aria-pressed={enAcciones}
              aria-label={enAcciones ? `Quitar ${hechizo.nombre} de Acciones` : `Mostrar ${hechizo.nombre} en Acciones`}
              title={enAcciones ? "Quitar de la pestaña Acciones" : "Mostrar en la pestaña Acciones"}
              className={`${estilos.botonIcono} ${
                enAcciones ? estilos.botonToggleAccionesActivo : ""
              }`}
            >
              <Swords size={13} aria-hidden="true" />
            </button>
          )}

          {alQuitarDeLista && !esOtorgado && (
            <button
              type="button"
              onClick={alQuitarDeLista}
              title={esPreparador ? "Despreparar conjuro" : "Quitar conjuro de la lista del personaje"}
              aria-label={esPreparador ? `Despreparar ${hechizo.nombre}` : `Quitar ${hechizo.nombre} de la lista`}
              className={`${estilos.botonIcono} ${estilos.botonIconoEliminar}`}
            >
              {esPreparador ? <StarOff size={13} aria-hidden="true" /> : <Trash2 size={13} aria-hidden="true" />}
            </button>
          )}
        </div>
      )}
    </div>
  );
});
