import React, { useState, useMemo } from "react";
import { Swords, Shield, Users, Dices, Zap, X } from "lucide-react";
import type { CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import { calcularAtaqueHorda } from "@/servicios/combateHordas";
import { lanzarDadosTaleSpire, sanitizarEtiqueta } from "@/utiles/lanzadorDados";
import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import estilos from "./ModalAtaqueHorda.module.css";

export interface DatosAtaqueHordaModal {
  criaturaId: string;
  criaturaNombre: string;
  miembrosVivos: number;
  ataqueNombre: string;
  bonificadorAtaqueStr: string;
  dadosDano: string;
  tipoDano: string;
}

export interface ModalAtaqueHordaProps {
  datos: DatosAtaqueHordaModal;
  colaIniciativa: CriaturaIniciativa[];
  tipoTiradaGlobal: "plano" | "ventaja" | "desventaja";
  onAplicarDanoDirecto: (idObjetivo: string, cantidad: number) => void;
  onCerrar: () => void;
}

const OPCIONES_MULTIATAQUE = [1, 2, 3, 4] as const;

const MODOS_CIRCUNSTANCIA = [
  { id: "desventaja", etiqueta: "Desventaja (+5 d20)" },
  { id: "plano", etiqueta: "Normal" },
  { id: "ventaja", etiqueta: "Ventaja (-5 d20)" }
] as const;

export const ModalAtaqueHorda: React.FC<ModalAtaqueHordaProps> = ({
  datos,
  colaIniciativa,
  tipoTiradaGlobal,
  onAplicarDanoDirecto,
  onCerrar
}) => {
  const objetivosSugeridos = useMemo(
    () => colaIniciativa.filter((c) => c.id !== datos.criaturaId && c.vidaActual > 0),
    [colaIniciativa, datos.criaturaId]
  );

  const primerJugador = objetivosSugeridos.find((c) => !c.esMonstruo) ?? objetivosSugeridos[0];

  const [idObjetivoSeleccionado, setIdObjetivoSeleccionado] = useState<string | null>(
    primerJugador ? primerJugador.id : null
  );
  const [caObjetivo, setCaObjetivo] = useState<number>(primerJugador ? primerJugador.ca : 15);
  const [atacantesParticipantes, setAtacantesParticipantes] = useState<number>(
    Math.max(1, datos.miembrosVivos)
  );
  const [ataquesPorMiembro, setAtaquesPorMiembro] = useState<number>(1);
  const [tipoTirada, setTipoTirada] = useState<"plano" | "ventaja" | "desventaja">(tipoTiradaGlobal);

  const bonoNumerico = parseInt(datos.bonificadorAtaqueStr.replace(/[^\d+-]/g, ""), 10) || 0;

  const calculo = useMemo(
    () =>
      calcularAtaqueHorda({
        miembrosVivos: atacantesParticipantes,
        ataquesPorMiembro,
        bonificadorAtaque: bonoNumerico,
        caObjetivo,
        formulaDano: datos.dadosDano,
        tipoTirada
      }),
    [atacantesParticipantes, ataquesPorMiembro, bonoNumerico, caObjetivo, datos.dadosDano, tipoTirada]
  );

  const manejarSeleccionarObjetivo = (objetivo: CriaturaIniciativa) => {
    setIdObjetivoSeleccionado(objetivo.id);
    setCaObjetivo(objetivo.ca);
  };

  const manejarTirarDano3D = () => {
    if (calculo.impactosTotales <= 0) return;
    const etiqueta = sanitizarEtiqueta(
      `${datos.criaturaNombre} (${calculo.impactosTotales}x ${datos.ataqueNombre})`
    );
    const formula = `!${etiqueta}:${calculo.formulaDanoEscalada}`;
    lanzarDadosTaleSpire(
      formula,
      `${datos.criaturaNombre} - ${datos.ataqueNombre} [${calculo.impactosTotales} impactos]`
    );
    onCerrar();
  };

  const manejarAplicarPromedio = () => {
    if (calculo.impactosTotales <= 0 || !idObjetivoSeleccionado) return;
    onAplicarDanoDirecto(idObjetivoSeleccionado, calculo.danoPromedioTotal);
    onCerrar();
  };

  const objetivoActual = objetivosSugeridos.find((c) => c.id === idObjetivoSeleccionado);

  return (
    <div className={estilos.overlayModal} onClick={onCerrar}>
      <div
        className={estilos.contenedorModal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-ataque-horda-titulo"
      >
        {/* Cabecera */}
        <div className={estilos.cabeceraModal}>
          <div className={estilos.tituloGrupo}>
            <div className={estilos.medallonIcono}>
              <Swords size={16} className={estilos.iconoEspadas} aria-hidden="true" />
            </div>
            <div>
              <div className={estilos.kickerModal}>COMBATE DE MASAS · TABLA DMG 5.5e</div>
              <h3 id="modal-ataque-horda-titulo" className={estilos.tituloModal}>
                ATAQUE DE HORDA · {datos.ataqueNombre.toUpperCase()}
              </h3>
              <span className={estilos.subtituloModal}>
                {datos.criaturaNombre} · Bono al impacto{" "}
                <strong>{bonoNumerico >= 0 ? `+${bonoNumerico}` : bonoNumerico}</strong> · Daño base{" "}
                <strong>{datos.dadosDano}</strong> ({datos.tipoDano})
              </span>
            </div>
          </div>
          <button type="button" onClick={onCerrar} className={estilos.botonCerrar} title="Cerrar">
            <X size={14} />
          </button>
        </div>

        {/* Selección rápida de objetivo en iniciativa */}
        {objetivosSugeridos.length > 0 && (
          <div className={estilos.seccionObjetivos}>
            <span className={estilos.etiquetaSeccion}>OBJETIVO EN COMBATE (SELECCIONA CA):</span>
            <div className={estilos.listaObjetivosPills}>
              {objetivosSugeridos.map((obj) => (
                <button
                  key={obj.id}
                  type="button"
                  onClick={() => manejarSeleccionarObjetivo(obj)}
                  className={estilos.pillObjetivo}
                  data-seleccionado={obj.id === idObjetivoSeleccionado}
                  data-es-pj={!obj.esMonstruo}
                >
                  <span>{obj.nombre}</span>
                  <strong className={estilos.caPill}>CA {obj.ca}</strong>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Controles numéricos de la Tabla de Hordas */}
        <div className={estilos.rejillaParametros}>
          <div className={estilos.cajaParametro}>
            <label className={estilos.labelParametro}>
              <Shield size={11} /> CA OBJETIVO
            </label>
            <CampoNumerico
              min="1"
              max="40"
              value={caObjetivo}
              alConfirmar={(v) => setCaObjetivo(Math.max(1, v))}
              className={estilos.inputParametro}
              identidad="horda-ca"
            />
          </div>

          <div className={estilos.cajaParametro}>
            <label className={estilos.labelParametro}>
              <Users size={11} /> ATACANTES (MÁX {datos.miembrosVivos})
            </label>
            <CampoNumerico
              min="1"
              max={String(Math.max(1, datos.miembrosVivos))}
              value={atacantesParticipantes}
              alConfirmar={(v) =>
                setAtacantesParticipantes(Math.max(1, Math.min(Math.max(1, datos.miembrosVivos), v)))
              }
              className={estilos.inputParametro}
              identidad="horda-atacantes"
            />
          </div>

          <div className={estilos.cajaParametro}>
            <label className={estilos.labelParametro}>
              <Swords size={11} /> ATAQUES / MIEMBRO
            </label>
            <div className={estilos.selectorMultiataque} role="group" aria-label="Ataques por miembro">
              {OPCIONES_MULTIATAQUE.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setAtaquesPorMiembro(num)}
                  className={estilos.botonMultiataque}
                  data-activo={ataquesPorMiembro === num}
                >
                  x{num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selector de Ventaja / Normal / Desventaja para la horda */}
        <div className={estilos.filaModoTirada}>
          <span className={estilos.etiquetaSeccion}>CIRCUNSTANCIA DE LA HORDA (D&D 5.5e ±5):</span>
          <div className={estilos.grupoBotonesModo} role="group" aria-label="Circunstancia de la horda">
            {MODOS_CIRCUNSTANCIA.map(({ id, etiqueta }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTipoTirada(id)}
                className={estilos.botonModoTirada}
                data-modo={id}
                data-activo={tipoTirada === id}
              >
                {etiqueta}
              </button>
            ))}
          </div>
        </div>

        {/* Resumen de Resolución por Tabla de Hordas */}
        <div className={estilos.panelResultadoTabla}>
          <div className={estilos.metricaTabla}>
            <span className={estilos.labelMetrica}>d20 NECESARIO</span>
            <strong className={estilos.valorMetrica}>{calculo.d20Necesario}</strong>
          </div>
          <div className={estilos.metricaTabla}>
            <span className={estilos.labelMetrica}>ATACANTES / IMPACTO</span>
            <strong className={estilos.valorMetrica}>
              {calculo.imposibleImpactar ? "—" : calculo.criaturasPorImpacto}
            </strong>
          </div>
          <div className={estilos.metricaTablaDestacada}>
            <span className={estilos.labelMetrica}>IMPACTOS AUTOMÁTICOS</span>
            <strong className={estilos.valorImpactos}>
              {calculo.impactosTotales} <small>/ {calculo.totalAtaques}</small>
            </strong>
          </div>
        </div>

        {/* Acciones de Daño */}
        <div className={estilos.pieAcciones}>
          <button
            type="button"
            disabled={calculo.impactosTotales <= 0}
            onClick={manejarTirarDano3D}
            className={estilos.botonLanzarDano3D}
          >
            <Dices size={14} />
            <span>
              {calculo.impactosTotales > 0
                ? `TIRAR DAÑO 3D (${calculo.formulaDanoEscalada})`
                : "0 IMPACTOS (LA HORDA FALLA)"}
            </span>
          </button>

          <button
            type="button"
            disabled={calculo.impactosTotales <= 0 || !idObjetivoSeleccionado}
            onClick={manejarAplicarPromedio}
            className={estilos.botonDanoPromedio}
            title={
              objetivoActual
                ? `Aplicar ${calculo.danoPromedioTotal} de daño promedio directamente a ${objetivoActual.nombre}`
                : "Selecciona un objetivo arriba para aplicar daño promedio directo"
            }
          >
            <Zap size={13} />
            <span>
              DAÑO PROMEDIO: {calculo.danoPromedioTotal} PG
              {objetivoActual ? ` → ${objetivoActual.nombre}` : ""}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
