import React from "react";
import { Swords, Zap } from "lucide-react";
import type { AtaquePersonajeCalculado } from "@/tipos";
import estilos from "./TarjetaAtaquePersonaje.module.css";

interface BloqueDanoTarjetaProps {
  ataque: AtaquePersonajeCalculado;
  esDanoFijoPasivo: boolean;
  tieneVersatil: boolean;
  tieneDobleDano: boolean;
  criticoAplicable: boolean;
  formulaPrincipal: string;
  formulaSecundaria: string;
  notaFallo?: string;
  alTirarDano: (ataque: AtaquePersonajeCalculado, modo?: boolean | "adicional") => void;
}

const IconoEstadoDano: React.FC<{ critico: boolean; tamano: number }> = ({ critico, tamano }) =>
  critico ? (
    <Zap size={tamano} className={estilos.iconoDanoCritico} aria-hidden="true" />
  ) : (
    <Swords size={tamano} className={estilos.iconoDanoNormal} aria-hidden="true" />
  );

export const BloqueDanoTarjeta: React.FC<BloqueDanoTarjetaProps> = React.memo(({
  ataque,
  esDanoFijoPasivo,
  tieneVersatil,
  tieneDobleDano,
  criticoAplicable,
  formulaPrincipal,
  formulaSecundaria,
  notaFallo,
  alTirarDano
}) => {
  if (esDanoFijoPasivo) {
    return (
      <div
        className={estilos.bloqueDanoFijo}
        title={`Daño fijo de ${ataque.dadoDano} ${ataque.tipoDano} (sin tirada de dados)`}
      >
        <span className={estilos.columnaMetaBloque}>
          <span className={estilos.etiquetaBloque}>Daño Fijo</span>
          <span className={estilos.tipoDanoBloque}>{ataque.tipoDano}</span>
        </span>
        <span className={estilos.columnaValorDano}>
          <span className={estilos.valorDanoLG}>{ataque.dadoDano}</span>
          <span className={estilos.textoSinTirada}>Sin tirada</span>
        </span>
      </div>
    );
  }

  const claseEtiqueta = `${estilos.etiquetaBloque} ${
    criticoAplicable ? estilos.etiquetaBloqueCritico : ""
  }`;
  const claseValor = `${estilos.valorDanoLG} ${
    criticoAplicable ? estilos.valorDanoCritico : ""
  }`;

  if (tieneDobleDano) {
    const etiquetaPrincipal = criticoAplicable
      ? tieneVersatil
        ? "Crit 1M"
        : "Crit"
      : tieneVersatil
      ? "Daño 1M"
      : "Daño";
    const etiquetaSecundaria = tieneVersatil
      ? criticoAplicable
        ? "Crit 2M"
        : "2 Manos"
      : criticoAplicable
      ? "Crit Adic."
      : "Adicional";

    return (
      <div
        className={estilos.grupoDanoDoble}
        data-critico={criticoAplicable ? "true" : undefined}
      >
        <button
          type="button"
          className={estilos.subBotonDanoPrincipal}
          onClick={() => alTirarDano(ataque, false)}
          aria-label={`Tirar daño ${criticoAplicable ? "crítico " : ""}1 mano con ${ataque.nombre} (${formulaPrincipal})`}
          title={`Tirar ${criticoAplicable ? "Crítico" : "Daño"} a 1 Mano (${formulaPrincipal} ${ataque.tipoDano})`}
        >
          <span className={estilos.columnaMetaBloque}>
            <span className={claseEtiqueta}>{etiquetaPrincipal}</span>
            <span className={estilos.tipoDanoBloque}>{ataque.tipoDano}</span>
          </span>
          <span className={estilos.filaValorDano}>
            <span className={claseValor}>{formulaPrincipal}</span>
            <IconoEstadoDano critico={criticoAplicable} tamano={12} />
          </span>
        </button>

        <button
          type="button"
          className={estilos.subBotonDanoSecundario}
          onClick={() => alTirarDano(ataque, tieneVersatil ? true : "adicional")}
          aria-label={
            tieneVersatil
              ? `Tirar daño ${criticoAplicable ? "crítico " : ""}a 2 manos con ${ataque.nombre} (${formulaSecundaria})`
              : `Tirar daño adicional ${criticoAplicable ? "crítico " : ""}con ${ataque.nombre} (${formulaSecundaria})`
          }
          title={
            tieneVersatil
              ? `Tirar ${criticoAplicable ? "Crítico" : "Daño"} a 2 Manos (${formulaSecundaria})`
              : `Tirar ${criticoAplicable ? "Crítico" : "Daño"} de Acción Adicional (${formulaSecundaria})`
          }
        >
          <span
            className={`${estilos.etiquetaSecundariaDano} ${
              criticoAplicable ? estilos.etiquetaSecundariaCrit : ""
            }`}
          >
            {etiquetaSecundaria}
          </span>
          <span className={estilos.valorDanoMD}>{formulaSecundaria}</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={estilos.bloqueDano}
      data-critico={criticoAplicable ? "true" : undefined}
      onClick={() => alTirarDano(ataque, false)}
      aria-label={`Tirar daño ${criticoAplicable ? "crítico " : ""}con ${ataque.nombre} (${formulaPrincipal} ${ataque.tipoDano})`}
      title={`Tirar ${criticoAplicable ? "Daño Crítico" : "Daño normal"} con ${ataque.nombre} (${formulaPrincipal} ${ataque.tipoDano})`}
    >
      <span className={estilos.columnaMetaBloque}>
        <span className={claseEtiqueta}>{criticoAplicable ? "Crítico ×2" : "Daño"}</span>
        <span className={estilos.tipoDanoBloque}>{ataque.tipoDano}</span>
      </span>
      <span className={estilos.columnaValorDano}>
        <span className={estilos.filaValorDano}>
          <span className={claseValor}>{formulaPrincipal}</span>
          <IconoEstadoDano critico={criticoAplicable} tamano={13} />
        </span>
        {notaFallo && <span className={estilos.notaFalloMaestria}>{notaFallo}</span>}
      </span>
    </button>
  );
});

BloqueDanoTarjeta.displayName = "BloqueDanoTarjeta";
