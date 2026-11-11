import React, { useState, useMemo } from "react";
import type { PersonajeJugador, MonstruoBase } from "@/tipos";
import {
  calcularReglasFormaSalvaje,
  calcularHpTemporalFormaSalvaje,
  obtenerNivelDruida,
  obtenerRasgoFormaBestia,
  obtenerBestiasElegiblesCompendio,
  obtenerBestiaFormaActiva,
  convertirVDANumero,
  extraerSentidosBestia
} from "@/servicios/reglasFormaSalvaje";
import { MONSTRUOS_INICIALES } from "@/utiles/datosIniciales";
import { PawPrint, SlidersHorizontal, X, Zap } from "lucide-react";
import { PanelFichaDnD } from "@/componentes/caracteristicas/iniciativa/PanelFichaDnD";
import {
  HudReglasFormaSalvaje,
  BannerFormaActiva,
  TarjetaBestiaReserva,
  ModalGestionFormasSalvajes,
  ModalPrepararTransformacion
} from "./formaSalvaje";
import estilos from "./PanelFormaSalvaje.module.css";

const comparadorEspanol = new Intl.Collator("es", { sensitivity: "base" }).compare;

interface PanelFormaSalvajeProps {
  personaje: PersonajeJugador;
  alTransformar: (idBestia: string, equipo?: string[], conservarPg?: boolean) => void;
  alRevertir: () => void;
  alGuardarFormasConocidas: (formasIds: string[]) => void;
}

/**
 * Panel de Forma Salvaje para la hoja de personaje (D&D 5.5e / PHB 2024).
 * Orquesta la reserva de bestias conocidas, telemetría de recursos y transformaciones.
 */
export const PanelFormaSalvaje: React.FC<PanelFormaSalvajeProps> = ({
  personaje,
  alTransformar,
  alRevertir,
  alGuardarFormasConocidas
}) => {
  const nivelDruida = obtenerNivelDruida(personaje);
  const rasgoForma = obtenerRasgoFormaBestia(personaje);
  const formas = rasgoForma?.formasBestia;
  const ajustes = rasgoForma?.ajustesFormaBestia;
  const pgAlTransformar = calcularHpTemporalFormaSalvaje(nivelDruida, ajustes);

  const reglas = useMemo(
    () => calcularReglasFormaSalvaje(nivelDruida, ajustes, formas),
    [nivelDruida, ajustes, formas]
  );

  const bestiaActiva = useMemo(
    () => obtenerBestiaFormaActiva(personaje),
    [personaje]
  );

  const formasConocidasIds = personaje.formaSalvaje?.formasConocidasIds;
  const bestiasConocidas = useMemo(() => {
    return (formasConocidasIds || [])
      .map((id) => MONSTRUOS_INICIALES.find((m) => m.id === id))
      .filter((m): m is MonstruoBase => Boolean(m));
  }, [formasConocidasIds]);

  const [ordenReserva, setOrdenReserva] = useState<"nombre" | "vd">("nombre");

  const bestiasConocidasOrdenadas = useMemo(() => {
    return [...bestiasConocidas].sort((a, b) => {
      if (ordenReserva === "vd") {
        const vdA = convertirVDANumero(a.desafio);
        const vdB = convertirVDANumero(b.desafio);
        if (vdA !== vdB) return vdA - vdB;
      }
      return comparadorEspanol(a.nombre, b.nombre);
    });
  }, [bestiasConocidas, ordenReserva]);

  const [modalGestionAbierto, setModalGestionAbierto] = useState(false);
  const [bestiaFichaModal, setBestiaFichaModal] = useState<MonstruoBase | null>(null);
  const [transformacion, setTransformacion] = useState<string>();

  const equipado = useMemo(() => personaje.inventario.filter((o) => o.equipado), [personaje.inventario]);

  const bestiasDisponibles = useMemo(() => {
    return obtenerBestiasElegiblesCompendio(nivelDruida, ajustes, [], formas);
  }, [nivelDruida, ajustes, formas]);

  const usosRestantes = rasgoForma?.usosRestantes ?? rasgoForma?.usosMaximos ?? 0;
  const usosMaximos = rasgoForma?.usosMaximos ?? 2;

  const prepararTransformacion = (id: string) => {
    if (!equipado.length && !personaje.hpTemporal) {
      alTransformar(id);
      return;
    }
    setTransformacion(id);
  };

  const ejecutarTransformacion = (equipoConservado: string[], conservarPg: boolean) => {
    if (transformacion) {
      alTransformar(transformacion, equipoConservado, conservarPg);
      setTransformacion(undefined);
    }
  };

  return (
    <div className={estilos.panelFormaSalvaje}>
      {/* Cabecera Principal */}
      <header className={estilos.cabeceraForma}>
        <div className={estilos.tituloCabeceraBloque}>
          <div className={estilos.emblemaCabecera}>
            <PawPrint size={22} className={estilos.iconoEmblema} />
          </div>
          <div>
            <div className={estilos.tituloCabecera}>
              Forma Salvaje (D&D 5.5e)
              <span className={estilos.tagEdicion}>PHB 2024</span>
            </div>
            <div className={estilos.subtituloCabecera}>
              Reserva de metamorfosis primigenia y telemetría de combate
            </div>
          </div>
        </div>

        <button
          type="button"
          className={estilos.botonGestionarPool}
          onClick={() => setModalGestionAbierto(true)}
          title="Abrir compendio para seleccionar o cambiar bestias conocidas"
        >
          <SlidersHorizontal size={14} />
          Gestionar Formas ({(formasConocidasIds?.length || 0)}/{reglas.maxFormasConocidas})
        </button>
      </header>

      {/* HUD de Reglas y Recursos */}
      <HudReglasFormaSalvaje
        reglas={reglas}
        pgAlTransformar={pgAlTransformar}
        usosRestantes={usosRestantes}
        usosMaximos={usosMaximos}
      />

      {/* Banner de Transformación Activa */}
      {bestiaActiva && (
        <BannerFormaActiva
          bestiaActiva={bestiaActiva}
          minutosRestantes={personaje.formaSalvaje?.minutosRestantes}
          alRevertir={alRevertir}
        />
      )}

      {/* Sección del Catálogo de Reserva */}
      <section className={estilos.seccionPool} aria-label="Bestias conocidas en reserva">
        <div className={estilos.barraTituloPool}>
          <div className={estilos.ladoIzquierdoTituloPool}>
            <h4 className={estilos.subtituloPool}>Formas Conocidas en Reserva</h4>
            <span className={estilos.badgeConteoPool}>
              {bestiasConocidas.length} de {reglas.maxFormasConocidas} preparadas
            </span>
          </div>

          {bestiasConocidas.length > 1 && (
            <div className={estilos.controlesOrdenReserva} role="group" aria-label="Ordenar reserva">
              <span className={estilos.labelOrdenReserva}>Ordenar:</span>
              <button
                type="button"
                className={`${estilos.botonOrdenPill} ${ordenReserva === "nombre" ? estilos.botonOrdenPillActivo : ""}`}
                onClick={() => setOrdenReserva("nombre")}
                title="Ordenar alfabéticamente (A-Z)"
              >
                A-Z
              </button>
              <button
                type="button"
                className={`${estilos.botonOrdenPill} ${ordenReserva === "vd" ? estilos.botonOrdenPillActivo : ""}`}
                onClick={() => setOrdenReserva("vd")}
                title="Ordenar por Desafío VD"
              >
                VD
              </button>
            </div>
          )}
        </div>

        {bestiasConocidas.length === 0 ? (
          <div className={estilos.estadoVacioReserva}>
            <PawPrint size={32} className={estilos.iconoEstadoVacio} />
            <p className={estilos.textoSinFormas}>
              No has seleccionado formas de bestia para tu reserva. Haz clic en "Gestionar Formas" para elegir hasta {reglas.maxFormasConocidas} bestias elegibles según tu nivel.
            </p>
            <button
              type="button"
              className={estilos.botonGestionarPool}
              onClick={() => setModalGestionAbierto(true)}
            >
              <SlidersHorizontal size={14} />
              Seleccionar Bestias Ahora
            </button>
          </div>
        ) : (
          <div className={estilos.gridBestias}>
            {bestiasConocidasOrdenadas.map((bestia) => {
              const estaActiva = bestiaActiva?.id === bestia.id;
              const esElegible = bestiasDisponibles.some((b) => b.id === bestia.id);

              return (
                <TarjetaBestiaReserva
                  key={bestia.id}
                  bestia={bestia}
                  estaActiva={estaActiva}
                  usosRestantes={usosRestantes}
                  esElegible={esElegible}
                  alVerFicha={setBestiaFichaModal}
                  alAdoptar={prepararTransformacion}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Modal Preparar Transformación */}
      {transformacion && (
        <ModalPrepararTransformacion
          abierto={Boolean(transformacion)}
          alCerrar={() => setTransformacion(undefined)}
          alConfirmar={ejecutarTransformacion}
          equipado={equipado}
          hpTemporalActual={personaje.hpTemporal || 0}
          hpTemporalNuevo={pgAlTransformar}
        />
      )}

      {/* Modal de Gestión de Formas */}
      {modalGestionAbierto && (
        <ModalGestionFormasSalvajes
          abierto={modalGestionAbierto}
          alCerrar={() => setModalGestionAbierto(false)}
          alGuardar={alGuardarFormasConocidas}
          bestiasDisponibles={bestiasDisponibles}
          formasConocidasActualesIds={formasConocidasIds}
          maxFormasConocidas={reglas.maxFormasConocidas}
          sustitucionDisponible={personaje.formaSalvaje?.sustitucionDisponible}
          formas={formas}
        />
      )}

      {/* Modal Ficha Oficial de Bestia (PanelFichaDnD) */}
      {bestiaFichaModal && (
        <div className={estilos.modalSelectorOverlay} onClick={() => setBestiaFichaModal(null)}>
          <div className={estilos.modalSelectorContenido} onClick={(e) => e.stopPropagation()}>
            <header className={estilos.modalSelectorHeader}>
              <div className={estilos.modalTituloBloque}>
                <PawPrint size={18} className={estilos.iconoEmblema} />
                <h3 className={estilos.modalTituloTexto}>Ficha Oficial: {bestiaFichaModal.nombre}</h3>
              </div>
              <button type="button" onClick={() => setBestiaFichaModal(null)} className={estilos.botonCerrarModal} title="Cerrar ficha">
                <X size={18} />
              </button>
            </header>
            <div className={estilos.modalSelectorBody}>
              <PanelFichaDnD
                criaturaNombre={bestiaFichaModal.nombre}
                plantilla={bestiaFichaModal}
                baseDatosHechizos={[]}
                alHacerClicHechizo={() => {}}
                lanzarAtaqueRapido={() => {}}
                lanzarTiradaD20Interactiva={() => {}}
                obtenerPercepcionPasiva={(p) => extraerSentidosBestia(p ?? bestiaFichaModal).percepcionPasiva ?? 10}
              />
            </div>
            <footer className={estilos.modalSelectorFooter}>
              <button type="button" className={estilos.botonGestionarPool} onClick={() => setBestiaFichaModal(null)}>
                Cerrar
              </button>
              <button
                type="button"
                className={estilos.botonAdoptar}
                onClick={() => {
                  const id = bestiaFichaModal.id;
                  setBestiaFichaModal(null);
                  prepararTransformacion(id);
                }}
                disabled={usosRestantes <= 0 || !bestiasDisponibles.some((b) => b.id === bestiaFichaModal.id)}
              >
                <Zap size={14} />
                {bestiaActiva?.id === bestiaFichaModal.id ? "Volver a adoptar" : "Adoptar Esta Forma"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};
