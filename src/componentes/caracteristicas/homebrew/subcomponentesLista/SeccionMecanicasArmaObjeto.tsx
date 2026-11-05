import React from "react";
import { normalizarTexto } from "@/almacen/usarAlmacenDM";
import type { ObjetoJuego, Arma, ObjetoHomebrew } from "@/tipos";
import { Dices } from "lucide-react";
import estilos from "../ListaHomebrew.module.css";
import { lanzarDadosTaleSpire } from "@/utiles/lanzadorDados";
import { construirFormulaAtaqueRapido } from "@/utiles/procesadorAtaques";
import { aplicarBonoNumericoAFormulaDados } from "@/utiles/utilesConjuros";

interface SeccionMecanicasArmaObjetoProps {
  objeto: ObjetoJuego;
  esGM: boolean;
  objetosHomebrew: ObjetoHomebrew[];
  navegarAObjeto: (id: string) => void;
}

export const SeccionMecanicasArmaObjeto: React.FC<SeccionMecanicasArmaObjetoProps> = ({
  objeto,
  esGM,
  objetosHomebrew,
  navegarAObjeto
}) => {
  if (objeto.categoria !== "armas") return null;

  const arma = objeto as Arma;
  const bonoMagico = objeto.modificadorAtaqueDano || 0;
  const bonoMagicoStr = bonoMagico !== 0 ? (bonoMagico >= 0 ? `+${bonoMagico}` : `${bonoMagico}`) : "";
  const tipoDanoNorm = arma.tipoDano || "físico";

  const tirarAtaqueSolo = () => {
    const formulaAtaque = bonoMagico !== 0
      ? `!Ataque ${objeto.nombre}:1d20${bonoMagico >= 0 ? "+" : ""}${bonoMagico}`
      : `!Ataque ${objeto.nombre}:1d20`;
    lanzarDadosTaleSpire(formulaAtaque, `DM - Ataque ${objeto.nombre}`);
  };

  const tirarDanoBase = () => {
    if (!arma.dadoDano) return;
    const formulaDano = bonoMagico !== 0
      ? aplicarBonoNumericoAFormulaDados(arma.dadoDano, bonoMagico)
      : arma.dadoDano;
    lanzarDadosTaleSpire(`!Daño ${objeto.nombre} (${tipoDanoNorm}):${formulaDano}`, `DM - Daño ${objeto.nombre}`);
  };

  const tirarDanoVersatil = () => {
    if (!arma.danoVersatil) return;
    const formulaDano = bonoMagico !== 0
      ? aplicarBonoNumericoAFormulaDados(arma.danoVersatil, bonoMagico)
      : arma.danoVersatil;
    lanzarDadosTaleSpire(`!Daño Versátil ${objeto.nombre} (${tipoDanoNorm}):${formulaDano}`, `DM - Daño Versátil ${objeto.nombre}`);
  };

  const tirarAtaqueYDanio = () => {
    if (!arma.dadoDano) {
      tirarAtaqueSolo();
      return;
    }
    const formulaDano = bonoMagico !== 0
      ? aplicarBonoNumericoAFormulaDados(arma.dadoDano, bonoMagico)
      : arma.dadoDano;
    const formulaCompleta = construirFormulaAtaqueRapido(
      objeto.nombre,
      bonoMagico !== 0 ? bonoMagicoStr : "+0",
      formulaDano,
      tipoDanoNorm,
      "DM"
    );
    lanzarDadosTaleSpire(formulaCompleta, `DM - ${objeto.nombre}`);
  };

  return (
    <div className={estilos.cajaMecanicasCombateObjeto}>
      <div className={estilos.tituloMecanicasObjetoConBotones}>
        <span>Propiedades de Combate del Arma</span>
        {esGM && (
          <div className={estilos.grupoBotonesTiradasArma}>
            <button
              type="button"
              onClick={tirarAtaqueYDanio}
              className={estilos.botonTirarAtaqueArma}
              title="Lanzar tirada de ataque + daño en TaleSpire"
            >
              <Dices size={12} />
              <span>Tirar Ataque + Daño</span>
            </button>
            <button
              type="button"
              onClick={tirarAtaqueSolo}
              className={estilos.botonTirarMecanicaObjeto}
              title={`Lanzar tirada de ataque (1d20${bonoMagicoStr}) en TaleSpire`}
            >
              <Dices size={12} />
              <span>Ataque (1d20{bonoMagicoStr})</span>
            </button>
          </div>
        )}
      </div>
      <div className={estilos.gridMecanicas}>
        {arma.dadoDano && (
          <div className={estilos.itemMecanica}>
            <span className={estilos.textoEtiquetaMecanica}>Daño base: </span>
            <strong className={estilos.valorMecanicaDano}>
              {arma.dadoDano} ({arma.tipoDano ? arma.tipoDano.charAt(0).toUpperCase() + arma.tipoDano.slice(1) : ""})
            </strong>
            {esGM && (
              <button
                type="button"
                onClick={tirarDanoBase}
                className={estilos.botonTirarDanoArma}
                title={`Lanzar daño base (${arma.dadoDano}${bonoMagicoStr}) en TaleSpire`}
              >
                <Dices size={11} />
                <span>Tirar ({arma.dadoDano}{bonoMagicoStr})</span>
              </button>
            )}
          </div>
        )}
        {arma.maestria && (
          <div className={estilos.itemMecanica}>
            <span className={estilos.textoEtiquetaMecanica}>Maestría: </span>
            <strong className={`${estilos.valorMecanicaCd} ${estilos.textoAdvertencia}`}>
              {arma.maestria}
            </strong>
          </div>
        )}
        {arma.danoVersatil && (
          <div className={estilos.itemMecanica}>
            <span className={estilos.textoEtiquetaMecanica}>A dos manos: </span>
            <strong className={estilos.valorMecanicaDano}>{arma.danoVersatil}</strong>
            {esGM && (
              <button
                type="button"
                onClick={tirarDanoVersatil}
                className={estilos.botonTirarDanoArma}
                title={`Lanzar daño a dos manos (${arma.danoVersatil}${bonoMagicoStr}) en TaleSpire`}
              >
                <Dices size={11} />
                <span>Tirar Versátil ({arma.danoVersatil}{bonoMagicoStr})</span>
              </button>
            )}
          </div>
        )}
        {arma.municionRequerida !== undefined && (
          <div className={estilos.itemMecanica}>
            <span className={estilos.textoEtiquetaMecanica}>Usa Munición: </span>
            <strong className={estilos.valorMecanicaCd}>{arma.municionRequerida ? "Sí" : "No"}</strong>
          </div>
        )}
        {arma.ammunition && (
          <div className={estilos.itemMecanica}>
            <span className={estilos.textoEtiquetaMecanica}>Munición: </span>
            {(() => {
              const idDestino = arma.ammunition.index;
              const destino = objetosHomebrew.find(o => o.id === idDestino || normalizarTexto(o.nombre) === normalizarTexto(arma.ammunition!.name));
              if (destino) {
                return (
                  <strong
                    onClick={() => navegarAObjeto(destino.id)}
                    className={estilos.enlaceObjetoCompendio}
                  >
                    {arma.ammunition.name}
                  </strong>
                );
              }
              return <strong className={estilos.valorMecanicaCd}>{arma.ammunition.name}</strong>;
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
