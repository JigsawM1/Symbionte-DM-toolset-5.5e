import React, { useState, useEffect } from "react";
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
  alEstablecerSalvacionMuerte: (tipo: "exitos" | "fallos", valor: number) => void;
  alReiniciarSalvacionesMuerte: () => void;
  alModificarCansancio: (delta: number) => void;
  alTirarSalvacionMuerte3D: () => void;
}

export const PanelVitalidadPersonaje: React.FC<PanelVitalidadPersonajeProps> = ({
  personaje,
  alModificarHP,
  alEstablecerHPActual,
  alModificarHPMaximoEfectivo,
  alModificarHPTemporal,
  alGastarDadoGolpe,
  alEstablecerSalvacionMuerte,
  alReiniciarSalvacionesMuerte,
  alModificarCansancio,
  alTirarSalvacionMuerte3D
}) => {
  const [valorDeltaHp, setValorDeltaHp] = useState<string>("0");
  const [editandoTemp, setEditandoTemp] = useState(false);
  const [valorTempInput, setValorTempInput] = useState(String(personaje.hpTemporal || 0));

  // Estados locales para los inputs directos en la barra
  const [hpActualInput, setHpActualInput] = useState(String(personaje.hpActual));
  const [hpMaxInput, setHpMaxInput] = useState(String(personaje.hpMaximo));

  useEffect(() => {
    setHpActualInput(String(personaje.hpActual));
  }, [personaje.hpActual]);

  useEffect(() => {
    setHpMaxInput(String(personaje.hpMaximo));
  }, [personaje.hpMaximo]);

  useEffect(() => {
    setValorTempInput(String(personaje.hpTemporal || 0));
  }, [personaje.hpTemporal]);

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
    const cantidad = parseInt(valorDeltaHp, 10) || 1;
    alModificarHP(Math.abs(cantidad));
    setValorDeltaHp("0");
  };

  const manejarAplicarDano = () => {
    const cantidad = parseInt(valorDeltaHp, 10) || 1;
    alModificarHP(-Math.abs(cantidad));
    setValorDeltaHp("0");
  };

  const manejarGuardarTemp = () => {
    const valor = parseInt(valorTempInput, 10);
    if (!isNaN(valor) && valor >= 0) {
      alModificarHPTemporal(valor);
    } else {
      setValorTempInput(String(personaje.hpTemporal || 0));
    }
    setEditandoTemp(false);
  };

  const manejarGuardarHpActualDirecto = () => {
    const valor = parseInt(hpActualInput, 10);
    if (!isNaN(valor)) {
      alEstablecerHPActual(valor);
    } else {
      setHpActualInput(String(personaje.hpActual));
    }
  };

  const manejarGuardarHpMaxDirecto = () => {
    const valor = parseInt(hpMaxInput, 10);
    if (!isNaN(valor) && valor > 0) {
      alModificarHPMaximoEfectivo(valor);
    } else {
      setHpMaxInput(String(personaje.hpMaximo));
    }
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
              <button
                type="button"
                className={estilos.botonModHpCurar}
                onClick={manejarAplicarCuracion}
                title="Curar cantidad ingresada (+)"
              >
                <Plus size={14} />
              </button>
              <input
                type="number"
                value={valorDeltaHp}
                onChange={(e) => setValorDeltaHp(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    manejarAplicarDano();
                  }
                }}
                className={estilos.inputHpMod}
                min="0"
                placeholder="0"
                title="Escribe la cantidad y pulsa Enter o [-] para dañar, o [+] para curar"
              />
              <button
                type="button"
                className={estilos.botonModHpDano}
                onClick={manejarAplicarDano}
                title="Infligir daño por cantidad ingresada (- o Enter)"
              >
                <Minus size={14} />
              </button>
            </div>
            <span style={{ fontSize: 10, color: "#94a3b8" }} title="HP Máximo Base fijado en configuración">
              Base: {maxBase}
            </span>
          </div>

          <div className={`${estilos.barraVidaFondo} ${estilos.neoPressed}`}>
            <div
              className={`${estilos.barraVidaProgreso} ${claseGradienteVida}`}
              style={{ width: `${porcentajeHp}%` }}
            />
            <div className={estilos.barraVidaTexto}>
              {/* HP Actual editable directamente (discreto) */}
              <input
                type="number"
                className={estilos.inputHpDirecto}
                value={hpActualInput}
                onChange={(e) => setHpActualInput(e.target.value)}
                onBlur={manejarGuardarHpActualDirecto}
                onKeyDown={(e) => e.key === "Enter" && manejarGuardarHpActualDirecto()}
                title="Haz clic para editar HP actual directamente"
              />
              <span style={{ opacity: 0.6 }}>/</span>
              {/* HP Máximo Efectivo editable directamente (discreto) */}
              <input
                type="number"
                className={`${estilos.inputHpDirecto} ${claseHpMax}`}
                value={hpMaxInput}
                onChange={(e) => setHpMaxInput(e.target.value)}
                onBlur={manejarGuardarHpMaxDirecto}
                onKeyDown={(e) => e.key === "Enter" && manejarGuardarHpMaxDirecto()}
                title={
                  maxEfectivo !== maxBase
                    ? `HP Máximo temporal modificado (${maxEfectivo} vs Base ${maxBase})`
                    : "Haz clic para modificar el HP Máximo efectivo directamente"
                }
              />
            </div>
            <span className={estilos.badgeEstadoVida}>{etiquetaEstadoVida}</span>
          </div>
        </div>

        {/* HP Temporal */}
        <div className={estilos.cajaHpTemporal}>
          <span className={estilos.tituloHp}>Temporal</span>
          <div
            className={`${estilos.barraTempFondo} ${estilos.neoPressed}`}
            onClick={() => setEditandoTemp(true)}
            style={{ cursor: "pointer" }}
            title="Haz clic para editar HP Temporal"
          >
            {editandoTemp ? (
              <input
                type="number"
                value={valorTempInput}
                onChange={(e) => setValorTempInput(e.target.value)}
                onBlur={manejarGuardarTemp}
                onKeyDown={(e) => e.key === "Enter" && manejarGuardarTemp()}
                autoFocus
                className={estilos.inputHpMod}
                style={{ width: "100%", height: "100%", fontSize: 18 }}
                min="0"
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
        <div className={`${estilos.tarjetaRecursoSalud} ${estilos.neoPressed}`}>
          <div className={estilos.filaCabeceraRecurso}>
            <span className={estilos.tituloRecursoSalud}>Dados Golpe</span>
          </div>
          <div className={estilos.valorDadosGolpe}>
            <span>
              {personaje.dadosGolpeRestantes}{personaje.tipoDadoGolpe}{" "}
              <span style={{ fontSize: 11, opacity: 0.7 }}>/ {personaje.dadosGolpeTotal}{personaje.tipoDadoGolpe}</span>
            </span>
            <button
              type="button"
              className={estilos.neoButton}
              onClick={alGastarDadoGolpe}
              disabled={personaje.dadosGolpeRestantes <= 0}
              title="Gastar 1 dado de golpe para curarte"
              style={{ padding: "2px 6px", fontSize: 11, minHeight: 24 }}
            >
              <Dices size={12} />
            </button>
          </div>
        </div>

        {/* Salvaciones de Muerte (con Corazones y Calaveras interactivos) */}
        <div className={`${estilos.tarjetaRecursoSalud} ${estilos.neoPressed}`}>
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
              style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}
            >
              <RotateCcw size={12} />
            </button>
          </div>

          <div className={estilos.filaPuntosMuerte}>
            {/* 3 Corazones (Éxitos) */}
            <div style={{ display: "flex", gap: 3 }}>
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
                      fill={activo ? "#10b981" : "none"}
                      color={activo ? "#34d399" : "rgba(255, 255, 255, 0.25)"}
                    />
                  </button>
                );
              })}
            </div>

            <span style={{ fontSize: 11, color: "#64748b", margin: "0 2px" }}>/</span>

            {/* 3 Calaveras (Fallos) - Cambio de color del trazo sin llenado distorsionado */}
            <div style={{ display: "flex", gap: 3 }}>
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
                      color={activo ? "#f87171" : "rgba(255, 255, 255, 0.25)"}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cansancio D&D 5.5e (6 niveles) */}
        <div className={`${estilos.tarjetaRecursoSalud} ${estilos.neoPressed}`}>
          <div className={estilos.filaCabeceraRecurso}>
            <span className={estilos.tituloRecursoSalud}>
              Cansancio {personaje.cansancio > 0 ? `(${personaje.cansancio})` : ""}
            </span>
          </div>
          <div className={estilos.filaPuntosMuerte} style={{ gap: 4 }}>
            {[1, 2, 3, 4, 5, 6].map((nivel) => {
              const activo = personaje.cansancio >= nivel;
              return (
                <div
                  key={`cansancio-${nivel}`}
                  className={`${estilos.puntoCansancio} ${activo ? estilos.puntoCansancioActivo : ""}`}
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
