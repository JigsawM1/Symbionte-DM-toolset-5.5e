import { obtenerMaximosEspaciosEfectivos } from "@/servicios/rasgos/conversionRecursosRasgos";
import React from "react";
import { AlertTriangle, Dices } from "lucide-react";
import { TarjetasMetricasMagia } from "../TarjetasMetricasMagia";
import { BannerConcentracionActiva } from "../BannerConcentracionActiva";
import { TrackerEspaciosConjuro } from "../TrackerEspaciosConjuro";
import { TrackerEspaciosPacto } from "../TrackerEspaciosPacto";
import { TrackerPuntosConjuro } from "../TrackerPuntosConjuro";
import { SeccionArcanoMistico } from "../SeccionArcanoMistico";
import type { CabeceraYRecursosMagicosProps } from "./tiposPanelConjuros";
import estilos from "../PanelConjurosPersonaje.module.css";
import { obtenerSelectoresArcanos } from "@/servicios/rasgos/arcanosMisticosRasgos";

export type { CabeceraYRecursosMagicosProps };

export const CabeceraYRecursosMagicos: React.FC<CabeceraYRecursosMagicosProps> = ({
  personaje,
  alRomperConcentracion,
  baseDatosHechizos,
  sistemaMagia,
  penalizacionArmadura,
  estaBloqueadoPorArmadura,
  motivoBloqueoArmadura,
  etiquetaHabilidad,
  modHabilidad,
  cdConjuros,
  bonoAtaqueMagico,
  manejarTiradaAtaqueMagico,
  conteoEfectivo,
  maximos,
  esLanzadorPacto,
  nivelEspacioPacto,
  nivelesArcanoDisponibles,
  alGastarEspacio,
  alRecuperarEspacio,
  alGastarPuntos,
  alRecuperarPuntos,
  alGastarEspacioPacto,
  alRecuperarEspaciosPacto,
  asignarArcanoMistico,
  quitarArcanoMistico,
  gastarArcanoMistico,
  recuperarArcanoMistico,
  alAbrirFichaHechizo,
  alLanzarArcano,
  modoTirada = "plano",
  alCambiarModoTirada
}) => {
  const tieneEspaciosEstandar = Object.values(obtenerMaximosEspaciosEfectivos(personaje)).some(
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
        <div className={estilos.bannerBloqueoMagia} role="alert">
          <AlertTriangle size={18} color="var(--pj-texto-alerta)" className={estilos.iconoAlertaArmaduraShrink} aria-hidden="true" />
          <div>
            <strong>Lanzamiento de Conjuros Bloqueado:</strong>
            {" "}{motivoBloqueoArmadura || `Vistes ${penalizacionArmadura?.armaduraNoCompetente || penalizacionArmadura?.escudoNoCompetente} sin competencia.`}
          </div>
        </div>
      )}

      <div className={estilos.gridEstadisticas}>
        <div className={estilos.tarjetaEstadistica}>
          <span className={estilos.estadisticaEtiqueta}>CD salvación</span>
          <strong className={estilos.estadisticaNumeroMono}>{cdConjuros}</strong>
        </div>
        <button
          type="button"
          onClick={manejarTiradaAtaqueMagico}
          disabled={estaBloqueadoPorArmadura}
          title={estaBloqueadoPorArmadura ? motivoBloqueoArmadura : "Tirar ataque mágico en TaleSpire"}
          className={`${estilos.tarjetaAtaqueMagico} ${estaBloqueadoPorArmadura ? estilos.tarjetaAtaqueMagicoBloqueada : ""}`}
        >
          <span className={estilos.estadisticaEtiqueta}>Ataque conjuro</span>
          <strong className={estilos.estadisticaNumeroMorado}>{bonoAtaqueMagico >= 0 ? "+" : ""}{bonoAtaqueMagico}</strong>
          {!estaBloqueadoPorArmadura && (
            <span className={estilos.subtituloTiradaAtaque}>
              <Dices size={11} aria-hidden="true" />
              <span>Tirar 1d20</span>
            </span>
          )}
        </button>
        <div className={estilos.tarjetaEstadistica}>
          <span className={estilos.estadisticaEtiqueta}>{etiquetaHabilidad}</span>
          <strong className={estilos.estadisticaNumeroMono}>{modHabilidad >= 0 ? "+" : ""}{modHabilidad}</strong>
        </div>
        <div className={estilos.tarjetaModoTirada} role="group" aria-label="Modo de tirada">
          <span className={estilos.estadisticaEtiqueta}>Modo tirada</span>
          <div className={estilos.grupoModoTirada}>
            <button
              type="button"
              aria-pressed={modoTirada === "disv"}
              data-modo="disv"
              className={estilos.botonModoTirada}
              onClick={() => alCambiarModoTirada("disv")}
              title="Tirar con Desventaja (2d20 menor)"
            >
              Disv
            </button>
            <button
              type="button"
              aria-pressed={modoTirada === "plano"}
              data-modo="plano"
              className={estilos.botonModoTirada}
              onClick={() => alCambiarModoTirada("plano")}
              title="Tirada normal plana (1d20)"
            >
              Plano
            </button>
            <button
              type="button"
              aria-pressed={modoTirada === "vent"}
              data-modo="vent"
              className={estilos.botonModoTirada}
              onClick={() => alCambiarModoTirada("vent")}
              title="Tirar con Ventaja (2d20 mayor)"
            >
              Vent
            </button>
          </div>
        </div>
      </div>

      {personaje.concentracionActiva && (
        <BannerConcentracionActiva
          nombreHechizo={personaje.concentracionActiva.nombreHechizo}
          alRomperConcentracion={alRomperConcentracion}
        />
      )}

      {/* Trackers de Recursos Mágicos */}
      <div className={estilos.contenedorTrackers}>
        {tieneMagiaEstandar &&
          (sistemaMagia === "puntos" ? (
            <TrackerPuntosConjuro
              key={personaje.id}
              puntosMaximos={personaje.puntosConjuroMaximos || 0}
              puntosGastados={personaje.puntosConjuroGastados || 0}
              nivelMaximo={personaje.nivelConjuroMaximo || 0}
              alGastarPuntos={alGastarPuntos}
              alRecuperarPuntos={alRecuperarPuntos}
            />
          ) : (
            <TrackerEspaciosConjuro
              espaciosMaximos={obtenerMaximosEspaciosEfectivos(personaje)}
              espaciosGastados={personaje.espaciosConjuroGastados || {}}
              alGastarEspacio={alGastarEspacio}
              alRecuperarEspacio={alRecuperarEspacio}
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
            opcionesPorNivel={obtenerSelectoresArcanos(personaje).length ? Object.fromEntries(
              obtenerSelectoresArcanos(personaje,true).map(s => [s.nivelConjuro!,s.opciones.map(o => o.id)])) : undefined}
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
    </>
  );
};
