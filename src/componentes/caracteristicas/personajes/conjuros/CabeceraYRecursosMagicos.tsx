import { obtenerMaximosEspaciosEfectivos } from "@/servicios/rasgos/conversionRecursosRasgos";
import React from "react";
import { BookOpen, AlertTriangle } from "lucide-react";
import { TarjetasMetricasMagia } from "../TarjetasMetricasMagia";
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
  alAbrirCompendio,
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
  alLanzarArcano
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
        <div className={estilos.bannerBloqueoMagia}>
          <AlertTriangle size={18} color="var(--pj-texto-alerta)" className={estilos.iconoAlertaArmaduraShrink} />
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
        <button type="button" onClick={manejarTiradaAtaqueMagico} disabled={estaBloqueadoPorArmadura}
          title={estaBloqueadoPorArmadura ? motivoBloqueoArmadura : "Tirar ataque mágico en TaleSpire"}
          className={`${estilos.tarjetaAtaqueMagico} ${estaBloqueadoPorArmadura ? estilos.tarjetaAtaqueMagicoBloqueada : ""}`}>
          <span className={estilos.estadisticaEtiqueta}>Ataque conjuro</span>
          <strong className={estilos.estadisticaNumeroMorado}>{bonoAtaqueMagico >= 0 ? "+" : ""}{bonoAtaqueMagico}</strong>
        </button>
        <div className={estilos.tarjetaEstadistica}>
          <span className={estilos.estadisticaEtiqueta}>{etiquetaHabilidad}</span>
          <strong className={estilos.estadisticaNumeroMono}>{modHabilidad >= 0 ? "+" : ""}{modHabilidad}</strong>
        </div>
        <div className={estilos.tarjetaConcentracion}>
          <span className={estilos.estadisticaEtiqueta}>Concentración</span>
          <strong className={estilos.estadoConcentracion}>{personaje.concentracionActiva ? "Activa" : "Inactiva"}</strong>
          {personaje.concentracionActiva && <>
            <span className={estilos.nombreConcentracion}>{personaje.concentracionActiva.nombreHechizo}</span>
            <button type="button" className={estilos.botonRomperConcentracion} onClick={alRomperConcentracion}>Romper</button>
          </>}
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
      </div>

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
    </>
  );
};
