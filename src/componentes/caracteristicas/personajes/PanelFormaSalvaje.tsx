import React, { useState, useMemo } from "react";
import type { PersonajeJugador, MonstruoBase } from "@/tipos";
import {
  calcularReglasFormaSalvaje,
  obtenerNivelDruida,
  esDruidaCirculoLuna,
  obtenerBestiasElegiblesCompendio,
  obtenerBestiaFormaActiva
} from "@/servicios/reglasFormaSalvaje";
import { MONSTRUOS_INICIALES } from "@/utiles/datosIniciales";
import { PawPrint, Zap, X, Check } from "lucide-react";
import estilos from "./PanelFormaSalvaje.module.css";

interface PanelFormaSalvajeProps {
  personaje: PersonajeJugador;
  alTransformar: (idBestia: string) => void;
  alRevertir: () => void;
  alGuardarFormasConocidas: (formasIds: string[]) => void;
}

export const PanelFormaSalvaje: React.FC<PanelFormaSalvajeProps> = ({
  personaje,
  alTransformar,
  alRevertir,
  alGuardarFormasConocidas
}) => {
  const nivelDruida = obtenerNivelDruida(personaje);
  const esLuna = esDruidaCirculoLuna(personaje);
  const reglas = useMemo(
    () => calcularReglasFormaSalvaje(nivelDruida, esLuna),
    [nivelDruida, esLuna]
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

  const [modalGestionAbierto, setModalGestionAbierto] = useState(false);
  const [seleccionBorrador, setSeleccionBorrador] = useState<string[]>([]);
  const [filtroTexto, setFiltroTexto] = useState("");

  const bestiasDisponibles = useMemo(() => {
    return obtenerBestiasElegiblesCompendio(nivelDruida, esLuna);
  }, [nivelDruida, esLuna]);

  const bestiasFiltradasModal = useMemo(() => {
    if (!filtroTexto.trim()) return bestiasDisponibles;
    const q = filtroTexto.toLowerCase().trim();
    return bestiasDisponibles.filter((b) =>
      b.nombre.toLowerCase().includes(q)
    );
  }, [bestiasDisponibles, filtroTexto]);

  const abrirModalGestion = () => {
    setSeleccionBorrador([...(personaje.formaSalvaje?.formasConocidasIds || [])]);
    setFiltroTexto("");
    setModalGestionAbierto(true);
  };

  const alternarSeleccionBestia = (id: string) => {
    if (seleccionBorrador.includes(id)) {
      setSeleccionBorrador(seleccionBorrador.filter((x) => x !== id));
    } else {
      if (seleccionBorrador.length < reglas.maxFormasConocidas) {
        setSeleccionBorrador([...seleccionBorrador, id]);
      }
    }
  };

  const guardarSeleccionModal = () => {
    alGuardarFormasConocidas(seleccionBorrador);
    setModalGestionAbierto(false);
  };

  const rasgoForma = (personaje.rasgos || []).find(
    (r) => r.nombre.toLowerCase().trim() === "forma salvaje"
  );
  const usosRestantes = rasgoForma?.usosRestantes ?? rasgoForma?.usosMaximos ?? 2;

  return (
    <div className={estilos.panelFormaSalvaje}>
      {/* Cabecera */}
      <div className={estilos.cabeceraForma}>
        <div className={estilos.tituloCabecera}>
          <PawPrint size={20} color="var(--pj-texto-cian, #38bdf8)" />
          Forma Salvaje (D&D 5.5e)
        </div>
        <button
          type="button"
          className={estilos.botonGestionarPool}
          onClick={abrirModalGestion}
        >
          Gestionar Formas ({(formasConocidasIds?.length || 0)}/{reglas.maxFormasConocidas})
        </button>
      </div>

      {/* Resumen de reglas aplicables */}
      <div className={estilos.reglasResumen}>
        <span>
          <strong>VD Máximo:</strong> {reglas.vdMaximoTexto}
        </span>
        <span>•</span>
        <span>
          <strong>Vuelo:</strong> {reglas.puedeVolar ? "Permitido" : "No permitido (hasta Nv 8)"}
        </span>
        <span>•</span>
        <span>
          <strong>PG Temporales:</strong> {esLuna ? `${nivelDruida * 3} (Círculo Luna)` : `${nivelDruida}`}
        </span>
        <span>•</span>
        <span>
          <strong>Usos disponibles:</strong> {usosRestantes}
        </span>
      </div>

      {/* Banner de Transformación Activa */}
      {bestiaActiva && (
        <div className={estilos.bannerActiva}>
          <div className={estilos.bannerInfo}>
            <div className={estilos.bannerTitulo}>
              Forma Activa: {bestiaActiva.nombre}
            </div>
            <div className={estilos.bannerDetalle}>
              FUE {bestiaActiva.caracteristicas?.fuerza || 10} • DES {bestiaActiva.caracteristicas?.destreza || 10} • CA {bestiaActiva.ca} • PG Temporales: +{personaje.formaSalvaje?.hpTemporalAlTransformar || nivelDruida}
            </div>
          </div>
          <button
            type="button"
            className={estilos.botonRevertir}
            onClick={alRevertir}
          >
            Revertir Forma
          </button>
        </div>
      )}

      {/* Pool de Formas Conocidas */}
      <div className={estilos.seccionPool}>
        <div className={estilos.subtituloPool}>Formas Conocidas en Reserva</div>
        {bestiasConocidas.length === 0 ? (
          <p className={estilos.textoSinFormas}>
            No has seleccionado formas de bestia para tu reserva. Haz clic en "Gestionar Formas" para elegir hasta {reglas.maxFormasConocidas} bestias elegibles.
          </p>
        ) : (
          <div className={estilos.gridBestias}>
            {bestiasConocidas.map((bestia) => {
              const estaActiva = bestiaActiva?.id === bestia.id;
              const velocidadStr = typeof bestia.velocidad === "string" ? bestia.velocidad : "30 pies";

              return (
                <div
                  key={bestia.id}
                  className={`${estilos.tarjetaBestia} ${estaActiva ? estilos.activa : ""}`}
                >
                  <div className={estilos.cabeceraTarjeta}>
                    <span className={estilos.nombreBestia}>{bestia.nombre}</span>
                    <span className={estilos.vdBadge}>VD {bestia.desafio}</span>
                  </div>

                  <div className={estilos.statsBestia}>
                    <div>FUE {bestia.caracteristicas?.fuerza}</div>
                    <div>DES {bestia.caracteristicas?.destreza}</div>
                    <div>CA {bestia.ca}</div>
                  </div>

                  <div className={estilos.velocidadBestia}>
                    Velocidad: {velocidadStr}
                  </div>

                  {Array.isArray(bestia.acciones) && bestia.acciones.length > 0 && (
                    <div className={estilos.accionesBestia}>
                      {bestia.acciones.map((a) => (
                        <div key={a.nombre}>
                          <strong>{a.nombre}:</strong> {a.daño ? `${a.daño} daño` : a.descripcion}
                        </div>
                      ))}
                    </div>
                  )}

                  {estaActiva ? (
                    <button
                      type="button"
                      className={estilos.botonRevertir}
                      onClick={alRevertir}
                    >
                      Revertir
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={estilos.botonAdoptar}
                      onClick={() => alTransformar(bestia.id)}
                      disabled={usosRestantes <= 0}
                    >
                      <Zap size={14} />
                      Adoptar Forma
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Selección / Gestión de la Reserva */}
      {modalGestionAbierto && (
        <div className={estilos.modalSelectorOverlay}>
          <div className={estilos.modalSelectorContenido}>
            <div className={estilos.modalSelectorHeader}>
              <h3>
                Seleccionar Bestias Conocidas ({seleccionBorrador.length}/{reglas.maxFormasConocidas})
              </h3>
              <button
                type="button"
                onClick={() => setModalGestionAbierto(false)}
                className={estilos.botonCerrarModal}
              >
                <X size={20} />
              </button>
            </div>

            <div className={estilos.modalSelectorBody}>
              <input
                type="text"
                placeholder="Buscar bestia por nombre..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className={estilos.inputBusqueda}
              />

              <div className={estilos.listaOpcionesPool}>
                {bestiasFiltradasModal.map((bestia) => {
                  const seleccionada = seleccionBorrador.includes(bestia.id);
                  const deshabilitada =
                    !seleccionada && seleccionBorrador.length >= reglas.maxFormasConocidas;

                  return (
                    <div
                      key={bestia.id}
                      className={`${estilos.itemOpcionPool} ${seleccionada ? estilos.seleccionado : ""} ${deshabilitada ? estilos.deshabilitada : ""}`}
                      onClick={() => !deshabilitada && alternarSeleccionBestia(bestia.id)}
                    >
                      <div>
                        <strong>{bestia.nombre}</strong> (VD {bestia.desafio}) • FUE {bestia.caracteristicas?.fuerza} DES {bestia.caracteristicas?.destreza} CA {bestia.ca}
                      </div>
                      {seleccionada && <Check size={18} color="#38bdf8" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={estilos.modalSelectorFooter}>
              <button
                type="button"
                className={estilos.botonGestionarPool}
                onClick={() => setModalGestionAbierto(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={estilos.botonAdoptar}
                onClick={guardarSeleccionModal}
              >
                Guardar Reserva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
