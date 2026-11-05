import React, { useState } from "react";
import type { PersonajeJugador } from "@/tipos";
import { Plus, Minus, RotateCcw, Maximize2 } from "lucide-react";
import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import { BotonNumerico } from "@/componentes/comunes/BotonNumerico";
import estilos from "./HojaPersonaje.module.css";

interface PanelVitalidadPersonajeProps {
  personaje: PersonajeJugador;
  alModificarHP: (delta: number) => void;
  alEstablecerHPActual: (valor: number) => void;
  alModificarHPMaximoEfectivo: (valor: number) => void;
  alModificarHPTemporal: (valor: number) => void;
  alGastarDadoGolpe: () => void;
  alEstablecerDadosGolpeRestantes?: (valor: number) => void;
  alEstablecerSalvacionMuerte: (tipo: "exitos" | "fallos", valor: number) => void;
  alReiniciarSalvacionesMuerte: () => void;
  alModificarCansancio: (delta: number) => void;
  alTirarSalvacionMuerte3D: () => void;
}

const PanelVitalidadPersonajeComponent: React.FC<PanelVitalidadPersonajeProps> = ({
  personaje,
  alModificarHP,
  alEstablecerHPActual,
  alModificarHPMaximoEfectivo,
  alModificarHPTemporal,
  alGastarDadoGolpe,
  alEstablecerDadosGolpeRestantes,
  alEstablecerSalvacionMuerte,
  alReiniciarSalvacionesMuerte,
  alModificarCansancio,
  alTirarSalvacionMuerte3D
}) => {
  const [valorDeltaHp, setValorDeltaHp] = useState<string>("1");
  const [editandoTemp, setEditandoTemp] = useState(false);

  const maxBase = personaje.hpMaximoBase || personaje.hpMaximo || 10;
  const maxEfectivo = personaje.hpMaximo || 10;
  const porcentajeHp = Math.max(0, Math.min(100, Math.round((personaje.hpActual / maxEfectivo) * 100)));

  const claseHpMax =
    maxEfectivo > maxBase
      ? estilos.hpMaxAumentado
      : maxEfectivo < maxBase
      ? estilos.hpMaxReducido
      : "";

  const claseGradienteVida =
    porcentajeHp >= 50
      ? estilos.vidaPlena
      : porcentajeHp > 20
      ? estilos.vidaHerida
      : estilos.vidaCritica;

  const etiquetaEstadoVida =
    personaje.hpActual <= 0
      ? "Inconsciente"
      : porcentajeHp < 25
      ? "Crítico"
      : porcentajeHp < 50
      ? "Desangrándose"
      : porcentajeHp >= 100
      ? "PLENO"
      : "Herido";

  const manejarAplicarHP = (signo: 1 | -1) => {
    const cantidad = Number(valorDeltaHp);
    if (!Number.isFinite(cantidad) || cantidad <= 0) return;
    alModificarHP(signo * cantidad);
  };

  const alternarSalvacion = (tipo: "exitos" | "fallos", indice: number) => {
    const actual = personaje.salvacionesMuerte?.[tipo] || 0;
    alEstablecerSalvacionMuerte(tipo, actual === indice ? indice - 1 : indice);
  };

  const penalizadorCansancio = (personaje.cansancio || 0) * 2;

  return (
    <section className={`${estilos.neoRaised} ${estilos.seccionVitalidad}`}>
      {/* 1. Fila de Salud Principal y HP Temporal */}
      <div className={estilos.filaSaludPrincipal}>
        <div className={estilos.cajaHpContenedor}>
          {/* Cabecera de HP con Stepper [-] 1 [+] y Base: X */}
          <div className={estilos.cabeceraHp}>
            <div className={estilos.grupoTituloHpYBase}>
              <span className={estilos.tituloHp}>PUNTOS DE GOLPE</span>
              <span className={estilos.textoHpBase}>Base: {maxBase}</span>
            </div>

            <div className={estilos.controlesHpMod}>
              <BotonNumerico
                type="button"
                className={estilos.botonModHpDano}
                onClick={() => manejarAplicarHP(-1)}
                title="Infligir daño por la cantidad (-)"
              >
                <Minus size={13} />
              </BotonNumerico>

              <CampoNumerico
                value={valorDeltaHp}
                identidad={personaje.id}
                alConfirmar={(valor) => setValorDeltaHp(String(valor))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    manejarAplicarHP(-1);
                  }
                }}
                className={estilos.inputHpMod}
                min="0"
                placeholder="0"
                title="Cantidad para dañar o curar"
                alVaciar={() => setValorDeltaHp("")}
              />

              <BotonNumerico
                type="button"
                className={estilos.botonModHpCurar}
                onClick={() => manejarAplicarHP(1)}
                title="Curar cantidad (+)"
              >
                <Plus size={13} />
              </BotonNumerico>
            </div>

            {/* Tarjeta lateral de PG Temporal */}
            <div
              className={estilos.tarjetaPgTemporalCompacta}
              onClick={() => setEditandoTemp(true)}
              title="Haz clic para ajustar PG Temporal"
            >
              <span className={estilos.etiquetaPgTemporal}>PG TEMP</span>
              {editandoTemp ? (
                <CampoNumerico
                  value={personaje.hpTemporal ?? 0}
                  alConfirmar={(valor) => {
                    alModificarHPTemporal(valor);
                    setEditandoTemp(false);
                  }}
                  onBlur={() => setEditandoTemp(false)}
                  autoFocus
                  className={estilos.inputPgTempDirecto}
                  min="0"
                  identidad={personaje.id}
                />
              ) : (
                <span className={estilos.valorPgTemporal}>{personaje.hpTemporal || 0}</span>
              )}
              <span className={estilos.subtituloPgTemporal}>AJUSTAR</span>
            </div>
          </div>

          {/* Barra de Vida con Texto Grande y Badge */}
          <div className={estilos.filaBarraProgresoVida}>
            <div className={estilos.textoNumericoHp}>
              <CampoNumerico
                className={estilos.inputHpDirecto}
                value={personaje.hpActual}
                alConfirmar={alEstablecerHPActual}
                title="Editar HP actual directamente"
                identidad={personaje.id}
                min={0}
                max={personaje.hpMaximo}
              />
              <span className={estilos.separadorHp}>/</span>
              <CampoNumerico
                className={`${estilos.inputHpDirecto} ${claseHpMax}`}
                value={personaje.hpMaximo}
                alConfirmar={alModificarHPMaximoEfectivo}
                title={
                  maxEfectivo !== maxBase
                    ? `HP Máximo temporal modificado (${maxEfectivo} vs Base ${maxBase})`
                    : "Editar HP Máximo efectivo directamente"
                }
                identidad={personaje.id}
                min={1}
              />
              <span className={estilos.unidadHpPV}>PV</span>
            </div>

            <div className={`${estilos.barraVidaFondo} ${estilos.neoPressed}`}>
              <div
                className={`${estilos.barraVidaProgreso} ${claseGradienteVida}`}
                // eslint-disable-next-line react/forbid-dom-props
                style={{ width: `${porcentajeHp}%` }}
              />
            </div>

            <span className={`${estilos.badgeEstadoVida} ${porcentajeHp >= 100 ? estilos.badgeEstadoVidaPleno : ""}`}>
              {etiquetaEstadoVida}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Sub-fila de 3 Columnas: Dados de Golpe, Salvaciones de Muerte y Cansancio */}
      <div className={estilos.filaRecursosSalud}>
        {/* Columna 1: Dados de Golpe */}
        <div className={`${estilos.tarjetaRecursoSalud} ${estilos.neoPressed}`}>
          <div className={estilos.filaCabeceraRecurso}>
            <span className={estilos.tituloRecursoSalud}>DADOS GOLPE</span>
            <Maximize2 size={11} className={estilos.iconoRecursoSalud} />
          </div>

          <div className={estilos.cuerpoRecursoDadosGolpe}>
            <div className={estilos.filaDadosGolpeValores}>
              <CampoNumerico
                className={estilos.inputDadosGolpeDirecto}
                value={personaje.dadosGolpeRestantes}
                alConfirmar={(valor) => alEstablecerDadosGolpeRestantes?.(valor)}
                min="0"
                max={personaje.dadosGolpeTotal}
                title="Editar dados disponibles"
                identidad={personaje.id}
              />
              <span className={estilos.textoDadosGolpeTipo}>
                {personaje.tipoDadoGolpe} / {personaje.dadosGolpeTotal}{personaje.tipoDadoGolpe}
              </span>
            </div>

            <button
              type="button"
              className={estilos.botonGastarDadoAncho}
              onClick={alGastarDadoGolpe}
              disabled={personaje.dadosGolpeRestantes <= 0}
              title="Gastar 1 dado de golpe para curarte"
            >
              GASTAR
            </button>
          </div>
        </div>

        {/* Columna 2: Salvaciones de Muerte */}
        <div className={`${estilos.tarjetaRecursoSalud} ${estilos.neoPressed}`}>
          <div className={estilos.filaCabeceraRecurso}>
            <button
              type="button"
              className={estilos.botonTituloSalvacionMuerte}
              onClick={alTirarSalvacionMuerte3D}
              title="Tirar Salvación de Muerte en 3D (>=10 éxito, <=9 fallo)"
            >
              SALV. MUERTE
            </button>
            <button
              type="button"
              onClick={alReiniciarSalvacionesMuerte}
              title="Reiniciar salvaciones de muerte"
              className={estilos.botonReiniciarSalvaciones}
              aria-label="Reiniciar salvaciones de muerte"
            >
              <RotateCcw size={11} />
            </button>
          </div>

          <div className={estilos.cuerpoSalvacionesMuerte}>
            {/* Fila Éxitos */}
            <div className={estilos.filaCirculosSalvacion}>
              <span className={estilos.etiquetaSalvacionTipo}>ÉX</span>
              {[1, 2, 3].map((i) => {
                const activo = (personaje.salvacionesMuerte?.exitos || 0) >= i;
                return (
                  <button
                    type="button"
                    key={`exito-dot-${i}`}
                    className={`${estilos.circuloSalvacion} ${activo ? estilos.circuloSalvacionExitoActivo : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      alternarSalvacion("exitos", i);
                    }}
                    title={`Éxito ${i} (Clic para marcar/desmarcar)`}
                    aria-label={`Éxito de muerte ${i}`}
                  />
                );
              })}
            </div>

            {/* Fila Fallos */}
            <div className={estilos.filaCirculosSalvacion}>
              <span className={estilos.etiquetaSalvacionTipo}>FL</span>
              {[1, 2, 3].map((i) => {
                const activo = (personaje.salvacionesMuerte?.fallos || 0) >= i;
                return (
                  <button
                    type="button"
                    key={`fallo-dot-${i}`}
                    className={`${estilos.circuloSalvacion} ${activo ? estilos.circuloSalvacionFalloActivo : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      alternarSalvacion("fallos", i);
                    }}
                    title={`Fallo ${i} (Clic para marcar/desmarcar)`}
                    aria-label={`Fallo de muerte ${i}`}
                  />
                );
              })}
            </div>

            <span
              className={estilos.pieSalvacionCd}
              onClick={alTirarSalvacionMuerte3D}
              title="Tirar Salvación de Muerte en 3D"
            >
              CD 10
            </span>
          </div>
        </div>

        {/* Columna 3: Cansancio (D&D 2024 - 6 niveles) */}
        <div className={`${estilos.tarjetaRecursoSalud} ${estilos.neoPressed}`}>
          <div className={estilos.filaCabeceraRecurso}>
            <span className={estilos.tituloRecursoSalud}>CANSANCIO</span>
            <span className={estilos.indicadorPenalizadorCansancio}>
              -{penalizadorCansancio}
            </span>
          </div>

          <div className={estilos.cuerpoCansancio}>
            <div className={estilos.matrizCansancio2x3}>
              {[1, 2, 3, 4, 5, 6].map((nivel) => {
                const activo = (personaje.cansancio || 0) >= nivel;
                return (
                  <button
                    type="button"
                    key={`cansancio-dot-${nivel}`}
                    className={`${estilos.circuloCansancioMatriz} ${activo ? estilos.circuloCansancioActivo : ""}`}
                    aria-label={`Cansancio nivel ${nivel}`}
                    aria-pressed={activo}
                    onClick={() => {
                      const delta = activo && personaje.cansancio === nivel ? -1 : 1;
                      alModificarCansancio(delta);
                    }}
                    title={`Nivel ${nivel}: -${nivel * 2} a d20 y -${nivel * 5}ft velocidad`}
                  />
                );
              })}
            </div>

            <span className={estilos.pieCansancioTexto}>
              D&D 2024 (-2/nvl)
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export const PanelVitalidadPersonaje = React.memo(PanelVitalidadPersonajeComponent);
