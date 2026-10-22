import React from "react";
import { Mail, Send, RotateCw } from "lucide-react";
import type { ResultadoTabla } from "@/tipos";
import type { EntradaMagiaSalvaje } from "@/servicios/magiaSalvaje/servicioMagiaSalvaje";
import estilos from "./MagiaSalvaje.module.css";
import { ResultadosSubtiradas } from "./ResultadosSubtiradas";
import { TextoEnriquecidoDND } from "@/componentes/comunes/TextoEnriquecidoDND";

interface TarjetaUltimaSobrecargaProps {
  resultado?: ResultadoTabla | null;
  entrada?: EntradaMagiaSalvaje;
  alReintentarEnvio: () => void;
  alConfirmarEnvio?: () => void;
  enviandoChat: boolean;
}

export const TarjetaUltimaSobrecarga: React.FC<TarjetaUltimaSobrecargaProps> = ({
  resultado,
  entrada,
  alReintentarEnvio,
  alConfirmarEnvio,
  enviandoChat
}) => {
  if (!resultado) {
    return (
      <div className={estilos.tarjetaUltimaSobrecarga}>
        <div className={estilos.cabeceraUltima}>
          <span className={estilos.etiquetaUltima}>Última oleada</span>
        </div>
        <p className={estilos.textoVacio}>
          No hay sobrecargas recientes registradas en esta ficha.
        </p>
      </div>
    );
  }

  const tiradaExacta = resultado.tiradaD100;
  const rango = entrada
    ? `${entrada.desde.toString().padStart(2, "0")}-${entrada.hasta === 100 ? "00" : entrada.hasta.toString().padStart(2, "0")}`
    : undefined;

  const esEnviado = resultado.estadoEnvio === "enviado" || resultado.enviado;
  const esLocal = resultado.estadoEnvio === "local";

  return (
    <section className={estilos.tarjetaUltimaSobrecarga} aria-label="Última sobrecarga">
      <div className={estilos.cabeceraUltima}>
        <div>
          <span className={estilos.etiquetaUltima}>Última sobrecarga activada</span>
          <h3 className={estilos.tituloResultado}>{entrada?.titulo ?? "Resultado guardado"}</h3>
          {rango && <span className={estilos.contador}>Rango {rango}</span>}
        </div>
        {tiradaExacta !== undefined && <strong className={estilos.resaltadoD100} aria-label={`d100: ${tiradaExacta}`}>
          <small>d100</small>
          {tiradaExacta.toString().padStart(2, "0")}
        </strong>}
      </div>

      {entrada ? <TextoEnriquecidoDND texto={entrada.texto} className={estilos.textoUltima} />
        : <p className={estilos.textoUltima}>{resultado.texto}</p>}
      <ResultadosSubtiradas resultados={resultado.subtiradas} />
      <div className={estilos.pieUltima}>
        {entrada?.duracion && <span className={estilos.badgeDuracion}>Duración: {entrada.duracion}</span>}
        {esLocal && <span className={estilos.badgeEfecto}>Resultado local</span>}

        {esEnviado ? (
          <span className={estilos.badgeEnviado} title="Confirmado en el chat de TaleSpire">
            <Send size={11} /> ENVIADO
          </span>
        ) : (
          <button
            type="button"
            onClick={alReintentarEnvio}
            disabled={enviandoChat}
            className={estilos.botonEnviarChat}
            title={esLocal ? "TaleSpire no estaba conectado al tirar. Pulsa para reintentar el envío al chat ahora."
              : "Reintentar enviar este mismo resultado al chat sin volver a tirar"}
          >
            {esLocal ? <Mail size={12} /> : <RotateCw size={12} />}
            <span>{enviandoChat ? esLocal ? "Enviando..." : "Reintentando..." : esLocal ? "ENVIAR AL CHAT" : "REINTENTAR ENVÍO"}</span>
          </button>
        )}
      {!esEnviado && !esLocal && alConfirmarEnvio && <button type="button" className={estilos.botonEnviarChat}
        disabled={enviandoChat} onClick={alConfirmarEnvio}>Ya está en el chat</button>}
      </div>
    </section>
  );
};
