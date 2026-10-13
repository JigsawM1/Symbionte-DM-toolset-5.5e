import { BotonNumerico } from "@/componentes/comunes/BotonNumerico";
import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import React, { useState, useRef } from "react";
import type { PersonajeJugador } from "@/tipos";
import { Plus, Minus, Dices, RotateCcw, Heart, Skull } from "lucide-react";
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
  const [valorDeltaHp, setValorDeltaHp] = useState<string>("0");
  const refCantidad = useRef<HTMLInputElement>(null);
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
      ? "Pleno"
      : "Saludable";

  const manejarAplicarCuracion = () => {
    if (refCantidad.current && !refCantidad.current.checkValidity()) return;
    const cantidad = Number(valorDeltaHp);
    if (!Number.isFinite(cantidad) || cantidad <= 0) return;
    alModificarHP(Math.abs(cantidad));
    setValorDeltaHp("0");
  };

  const manejarAplicarDano = () => {
    if (refCantidad.current && !refCantidad.current.checkValidity()) return;
    const cantidad = Number(valorDeltaHp);
    if (!Number.isFinite(cantidad) || cantidad <= 0) return;
    alModificarHP(-Math.abs(cantidad));
    setValorDeltaHp("0");
  };

  // Alternar slot de éxito (Corazón)
  const alternarExito = (indice: number) => {
    const exitosActuales = personaje.salvacionesMuerte?.exitos || 0;
    if (exitosActuales === indice) {
      alEstablecerSalvacionMuerte("exitos", indice - 1);
    } else {
      alEstablecerSalvacionMuerte("exitos", indice);
    }
  };

  // Alternar slot de fallo (Calavera)
  const alternarFallo = (indice: number) => {
    const fallosActuales = personaje.salvacionesMuerte?.fallos || 0;
    if (fallosActuales === indice) {
      alEstablecerSalvacionMuerte("fallos", indice - 1);
    } else {
      alEstablecerSalvacionMuerte("fallos", indice);
    }
  };

  return (
    <section className={`${estilos.neoRaised} ${estilos.seccionVitalidad}`}>
      {/* 1. Fila de Salud Principal y HP Temporal */}
      <div className={estilos.filaSaludPrincipal}>
        {/* Puntos de Golpe */}
        <div className={estilos.cajaHpContenedor}>
          <div className={estilos.cabeceraHp}>
            <div className={estilos.controlesHpMod}>
              <span className={estilos.tituloHp}>Puntos de Golpe</span>
              <BotonNumerico
                type="button"
                className={estilos.botonModHpCurar}
                onClick={manejarAplicarCuracion}
                title="Curar cantidad ingresada (+)"
              >
                <Plus size={14} />
              </BotonNumerico>
              <CampoNumerico
                value={valorDeltaHp}
                ref={refCantidad}
                identidad={personaje.id}
                alConfirmar={(valor) => setValorDeltaHp(String(valor))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    manejarAplicarDano();
                  }
                }}
                className={estilos.inputHpMod}
                min="0"
                placeholder="0"
                title="Escribe la cantidad y pulsa Enter o [-] para dañar, o [+] para curar"
                alVaciar={() => setValorDeltaHp("")}
              />
              <BotonNumerico
                type="button"
                className={estilos.botonModHpDano}
                onClick={manejarAplicarDano}
                title="Infligir daño por cantidad ingresada (- o Enter)"
              >
                <Minus size={14} />
              </BotonNumerico>
            </div>
            <span className={estilos.textoHpBase} title="HP Máximo Base fijado en configuración">
              Base: {maxBase}
            </span>
          </div>

          <div className={`${estilos.barraVidaFondo} ${estilos.neoPressed}`}>
            <div
              className={`${estilos.barraVidaProgreso} ${claseGradienteVida}`}
              // eslint-disable-next-line react/forbid-dom-props -- Ancho porcentual dinámico continuo en tiempo de ejecución (0-100%)
              style={{ width: `${porcentajeHp}%` }}
            />
            <div className={estilos.barraVidaTexto}>
              {/* HP Actual editable directamente (discreto) */}
              <CampoNumerico
                className={estilos.inputHpDirecto}
                value={personaje.hpActual}
                alConfirmar={alEstablecerHPActual}
                title="Haz clic para editar HP actual directamente"
                identidad={personaje.id} min={0} max={personaje.hpMaximo}
              />
              <span className={estilos.separadorHp}>/</span>
              {/* HP Máximo Efectivo editable directamente (discreto) */}
              <CampoNumerico
                className={`${estilos.inputHpDirecto} ${claseHpMax}`}
                value={personaje.hpMaximo}
                alConfirmar={alModificarHPMaximoEfectivo}
                title={
                  maxEfectivo !== maxBase
                    ? `HP Máximo temporal modificado (${maxEfectivo} vs Base ${maxBase})`
                    : "Haz clic para modificar el HP Máximo efectivo directamente"
                }
                identidad={personaje.id} min={1}
              />
            </div>
            <span className={estilos.badgeEstadoVida}>{etiquetaEstadoVida}</span>
          </div>
        </div>

        {/* HP Temporal */}
        <div className={estilos.cajaHpTemporal}>
          <span className={estilos.tituloHp}>Temporal</span>
          <div
            className={`${estilos.barraTempFondo} ${estilos.neoPressed} ${estilos.tarjetaMetricaInteractiva}`}
            onClick={() => setEditandoTemp(true)}
            title="Haz clic para editar HP Temporal"
          >
            {editandoTemp ? (
              <CampoNumerico
                value={personaje.hpTemporal ?? 0}
                alConfirmar={(valor) => alModificarHPTemporal(valor)}
                onBlur={() => setEditandoTemp(false)}
                autoFocus
                className={`${estilos.inputHpMod} ${estilos.inputTempFull}`}
                min="0"
                identidad={personaje.id}
              />
            ) : (
              <span className={estilos.valorTempHp}>{personaje.hpTemporal || 0}</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Sub-fila: Dados de Golpe, Salvaciones de Muerte y Cansancio */}
      <div className={estilos.filaRecursosSalud}>
        {/* Dados de Golpe */}
        <div className={`${estilos.tarjetaRecursoSalud} ${estilos.neoPressed} ${estilos.recursoDadosGolpe}`}>
          <div className={estilos.filaCabeceraRecurso}>
            <span className={estilos.tituloRecursoSalud}>Dados Golpe</span>
          </div>
          <div className={estilos.valorDadosGolpe}>
            <div className={estilos.filaDadosGolpeValores}>
              <CampoNumerico
                className={estilos.inputDadosGolpeDirecto}
                value={personaje.dadosGolpeRestantes}
                alConfirmar={(valor) => alEstablecerDadosGolpeRestantes?.(valor)}
                min="0"
                max={personaje.dadosGolpeTotal}
                title="Editar cantidad de dados de golpe disponibles"
                identidad={personaje.id}
              />
              <span>{personaje.tipoDadoGolpe}{" "}</span>
              <span className={estilos.textoDadosGolpeTotal}>/ {personaje.dadosGolpeTotal}{personaje.tipoDadoGolpe}</span>
            </div>
            <button
              type="button"
              className={`${estilos.neoButton} ${estilos.botonGastarDado}`}
              onClick={alGastarDadoGolpe}
              disabled={personaje.dadosGolpeRestantes <= 0}
              title="Gastar 1 dado de golpe para curarte"
            >
              <Dices size={12} />
            </button>
          </div>
        </div>

        {/* Salvaciones de Muerte (con Corazones y Calaveras interactivos) */}
        <div className={`${estilos.tarjetaRecursoSalud} ${estilos.neoPressed} ${estilos.recursoSalvacionesMuerte}`}>
          <div className={estilos.filaCabeceraRecurso}>
            <button
              type="button"
              className={estilos.botonSalvacionMuerte}
              onClick={alTirarSalvacionMuerte3D}
              title="Haz clic para tirar Salvación de Muerte en 3D (>=10 éxito, <=9 fallo)"
            >
              Salv. Muerte
            </button>
            <button
              type="button"
              onClick={alReiniciarSalvacionesMuerte}
              title="Reiniciar salvaciones de muerte"
              className={estilos.botonReiniciarSalvaciones}
            >
              <RotateCcw size={12} />
            </button>
          </div>

          <div className={estilos.filaPuntosMuerte}>
            {/* 3 Corazones (Éxitos) */}
            <div className={estilos.grupoIconosMuerte}>
              {[1, 2, 3].map((i) => {
                const activo = (personaje.salvacionesMuerte?.exitos || 0) >= i;
                return (
                  <button
                    type="button"
                    key={`exito-corazon-${i}`}
                    className={estilos.iconoSlotMuerte}
                    onClick={(e) => {
                      e.stopPropagation();
                      alternarExito(i);
                    }}
                    title={`Éxito ${i} (Clic para prender/apagar)`}
                  >
                    <Heart
                      size={16}
                      strokeWidth={activo ? 2.5 : 1.5}
                      fill={activo ? "var(--pj-texto-exito)" : "none"}
                      color={activo ? "var(--pj-texto-exito)" : "rgba(255, 255, 255, 0.25)"}
                    />
                  </button>
                );
              })}
            </div>

            <span className={estilos.separadorMuerte}>/</span>

            {/* 3 Calaveras (Fallos) - Cambio de color del trazo sin llenado distorsionado */}
            <div className={estilos.grupoIconosMuerte}>
              {[1, 2, 3].map((i) => {
                const activo = (personaje.salvacionesMuerte?.fallos || 0) >= i;
                return (
                  <button
                    type="button"
                    key={`fallo-calavera-${i}`}
                    className={estilos.iconoSlotMuerte}
                    onClick={(e) => {
                      e.stopPropagation();
                      alternarFallo(i);
                    }}
                    title={`Fallo ${i} (Clic para prender/apagar)`}
                  >
                    <Skull
                      size={16}
                      strokeWidth={activo ? 2.5 : 1.5}
                      color={activo ? "var(--pj-texto-alerta)" : "rgba(255, 255, 255, 0.25)"}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cansancio D&D 5.5e (6 niveles) */}
        <div className={`${estilos.tarjetaRecursoSalud} ${estilos.neoPressed} ${estilos.recursoCansancio}`}>
          <div className={estilos.filaCabeceraRecurso}>
            <span className={estilos.tituloRecursoSalud}>
              Cansancio {personaje.cansancio > 0 ? `(${personaje.cansancio})` : ""}
            </span>
          </div>
          <div className={`${estilos.filaPuntosMuerte} ${estilos.filaPuntosCansancio}`}>
            {[1, 2, 3, 4, 5, 6].map((nivel) => {
              const activo = personaje.cansancio >= nivel;
              return (
                <button
                  type="button"
                  key={`cansancio-${nivel}`}
                  className={`${estilos.puntoCansancio} ${activo ? estilos.puntoCansancioActivo : ""}`}
                  aria-label={`Cansancio nivel ${nivel}`}
                  aria-pressed={activo}
                  onClick={() => {
                    const delta = activo && personaje.cansancio === nivel ? -1 : 1;
                    alModificarCansancio(delta);
                  }}
                  title={`Cansancio Nivel ${nivel} (Penalizador -${nivel * 2} a tiradas d20)`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export const PanelVitalidadPersonaje = React.memo(PanelVitalidadPersonajeComponent);
