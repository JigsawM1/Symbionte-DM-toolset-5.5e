import React from "react";
import { Zap, BookOpen, AlertTriangle } from "lucide-react";
import { BannerConcentracionActiva } from "../BannerConcentracionActiva";
import { TarjetasMetricasMagia } from "../TarjetasMetricasMagia";
import { TrackerEspaciosConjuro } from "../TrackerEspaciosConjuro";
import { TrackerEspaciosPacto } from "../TrackerEspaciosPacto";
import { TrackerPuntosConjuro } from "../TrackerPuntosConjuro";
import { SeccionArcanoMistico } from "../SeccionArcanoMistico";
import type { CabeceraYRecursosMagicosProps } from "./tiposPanelConjuros";
import estilos from "../PanelConjurosPersonaje.module.css";

export type { CabeceraYRecursosMagicosProps };

export const CabeceraYRecursosMagicos: React.FC<CabeceraYRecursosMagicosProps> = ({
  personaje,
  baseDatosHechizos,
  sistemaMagia,
  penalizacionArmadura,
  estaBloqueadoPorArmadura,
  motivoBloqueoArmadura,
  alRomperConcentracion,
  etiquetaHabilidad,
  modHabilidad,
  cdConjuros,
  bonoAtaqueMagico,
  manejarTiradaAtaqueMagico,
  conteoEfectivo,
  maximos,
  alAbrirConfiguracion,
  alAbrirCompendio,
  esLanzadorPacto,
  nivelEspacioPacto,
  nivelesArcanoDisponibles,
  alGastarEspacio,
  alRecuperarEspacio,
  alRecuperarTodosEspacios,
  alGastarPuntos,
  alRecuperarPuntos,
  alRecuperarTodosPuntos,
  alGastarEspacioPacto,
  alRecuperarEspaciosPacto,
  asignarArcanoMistico,
  quitarArcanoMistico,
  gastarArcanoMistico,
  recuperarArcanoMistico,
  alAbrirFichaHechizo,
  alLanzarArcano
}) => {
  const tieneEspaciosEstandar = Object.values(personaje.espaciosConjuroMaximos || {}).some(
    (v) => (v || 0) > 0
  );
  const tienePuntosEstandar = (personaje.puntosConjuroMaximos || 0) > 0;
  const tieneMagiaEstandar =
    sistemaMagia === "puntos" ? tienePuntosEstandar : tieneEspaciosEstandar;
  const tienePacto = (personaje.espaciosPactoMaximos || 0) > 0 || esLanzadorPacto;

  return (
    <>
      {/* Banner de Bloqueo por Armadura sin Competencia */}
      {estaBloqueadoPorArmadura && (
        <div className={estilos.bannerBloqueoMagia}>
          <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
          <div>
            <strong>Lanzamiento de Conjuros Bloqueado:</strong>
            {" "}Vistes {penalizacionArmadura?.armaduraNoCompetente || penalizacionArmadura?.escudoNoCompetente} sin competencia.
            {" "}Las reglas impiden lanzar conjuros y rituales bajo esta condición.
          </div>
        </div>
      )}

      {/* Banner de Concentración Activa */}
      {personaje.concentracionActiva && (
        <BannerConcentracionActiva
          nombreHechizo={personaje.concentracionActiva.nombreHechizo}
          alRomperConcentracion={alRomperConcentracion}
        />
      )}

      {/* Tarjetas de Estadísticas Mágicas */}
      <div className={estilos.gridEstadisticas}>
        <div className={estilos.tarjetaEstadistica}>
          <span className={estilos.estadisticaEtiqueta}>Habilidad</span>
          <div className={estilos.estadisticaFilaValor}>
            <span className={estilos.estadisticaHabilidad}>{etiquetaHabilidad}</span>
            <span className={estilos.estadisticaModificador}>
              {modHabilidad >= 0 ? `+${modHabilidad}` : modHabilidad}
            </span>
          </div>
        </div>

        <div className={estilos.tarjetaEstadistica}>
          <span className={estilos.estadisticaEtiqueta}>CD Salvación</span>
          <span className={estilos.estadisticaNumeroMono}>{cdConjuros}</span>
        </div>

        <div
          onClick={manejarTiradaAtaqueMagico}
          title={
            estaBloqueadoPorArmadura
              ? (motivoBloqueoArmadura || "Bloqueado por armadura sin competencia")
              : "Haz clic para tirar Ataque Mágico en TaleSpire"
          }
          className={`${estilos.tarjetaAtaqueMagico} ${
            estaBloqueadoPorArmadura ? estilos.tarjetaAtaqueMagicoBloqueada : ""
          }`}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {estaBloqueadoPorArmadura ? (
              <AlertTriangle size={11} color="#ef4444" />
            ) : (
              <Zap size={11} color="#a78bfa" />
            )}
            <span
              className={estaBloqueadoPorArmadura ? undefined : estilos.estadisticaEtiquetaMorada}
              style={
                estaBloqueadoPorArmadura
                  ? { color: "#f87171", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }
                  : undefined
              }
            >
              Ataque Mágico
            </span>
          </div>
          <span
            className={estaBloqueadoPorArmadura ? undefined : estilos.estadisticaNumeroMorado}
            style={
              estaBloqueadoPorArmadura
                ? { color: "#fca5a5", fontSize: 18, fontWeight: 800 }
                : undefined
            }
          >
            {bonoAtaqueMagico >= 0 ? `+${bonoAtaqueMagico}` : bonoAtaqueMagico}
          </span>
        </div>
      </div>

      {/* Tarjetas de Conjuros y Trucos Máximos */}
      <TarjetasMetricasMagia
        conteoConjurosLibres={conteoEfectivo.libres}
        conteoConjurosSubclase={conteoEfectivo.subclase}
        maxConjuros={maximos.maxConjuros}
        conteoTrucosLibres={conteoEfectivo.trucosLibres}
        conteoTrucosSubclase={conteoEfectivo.trucosSubclase}
        maxTrucos={maximos.maxTrucos}
        modelo={maximos.modelo || "ninguno"}
      />

      {/* Barra de Acciones Rápidas */}
      <div className={estilos.barraAccionesRapidas}>
        <button
          type="button"
          onClick={alAbrirCompendio}
          className={estilos.botonCompendio}
        >
          <BookOpen size={13} />
          <span>Compendio de Conjuros</span>
        </button>

        {alAbrirConfiguracion && (
          <button
            type="button"
            onClick={alAbrirConfiguracion}
            className={estilos.botonEnlaceAjustes}
          >
            Ajustar Clases y Magia
          </button>
        )}
      </div>

      {/* Trackers de Recursos Mágicos */}
      <div className={estilos.contenedorTrackers}>
        {tieneMagiaEstandar &&
          (sistemaMagia === "puntos" ? (
            <TrackerPuntosConjuro
              puntosMaximos={personaje.puntosConjuroMaximos || 0}
              puntosGastados={personaje.puntosConjuroGastados || 0}
              nivelMaximo={personaje.nivelConjuroMaximo || 0}
              alGastarPuntos={alGastarPuntos}
              alRecuperarPuntos={alRecuperarPuntos}
              alRecuperarTodosPuntos={alRecuperarTodosPuntos}
            />
          ) : (
            <TrackerEspaciosConjuro
              espaciosMaximos={personaje.espaciosConjuroMaximos || {}}
              espaciosGastados={personaje.espaciosConjuroGastados || {}}
              alGastarEspacio={alGastarEspacio}
              alRecuperarEspacio={alRecuperarEspacio}
              alRecuperarTodosEspacios={alRecuperarTodosEspacios}
            />
          ))}

        {tienePacto && (
          <TrackerEspaciosPacto
            espaciosPactoMaximos={personaje.espaciosPactoMaximos || 0}
            espaciosPactoGastados={personaje.espaciosPactoGastados || 0}
            nivelEspacioPacto={nivelEspacioPacto}
            alGastarEspacioPacto={alGastarEspacioPacto}
            alRecuperarEspaciosPacto={alRecuperarEspaciosPacto}
          />
        )}

        {nivelesArcanoDisponibles.length > 0 && (
          <SeccionArcanoMistico
            arcanoMisticoIds={personaje.arcanoMisticoIds || []}
            arcanoMisticoGastados={personaje.arcanoMisticoGastados || []}
            nivelesDisponibles={nivelesArcanoDisponibles}
            baseDatosHechizos={baseDatosHechizos}
            nombrePersonaje={personaje.nombre}
            bonoAtaqueMagico={bonoAtaqueMagico}
            cdConjuros={cdConjuros}
            bloqueadoPorArmadura={estaBloqueadoPorArmadura}
            motivoBloqueoArmadura={motivoBloqueoArmadura}
            alAsignarArcano={(nivel, hechizoId) => asignarArcanoMistico(personaje.id, nivel, hechizoId)}
            alQuitarArcano={(nivel) => quitarArcanoMistico(personaje.id, nivel)}
            alGastarArcano={(nivel) => gastarArcanoMistico(personaje.id, nivel)}
            alRecuperarArcano={(nivel) => recuperarArcanoMistico(personaje.id, nivel)}
            alAbrirFichaHechizo={alAbrirFichaHechizo}
            alLanzar={alLanzarArcano}
          />
        )}

        {!tieneMagiaEstandar && !tienePacto && nivelesArcanoDisponibles.length === 0 && (
          <div className={estilos.alertaSinRecursos}>
            No hay recursos de magia configurados. Configura tu clase lanzadora en los ajustes del personaje.
          </div>
        )}
      </div>
    </>
  );
};
