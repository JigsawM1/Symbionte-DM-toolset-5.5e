import React, { useState } from "react";
import { MessageSquare, Swords, Crosshair, Sparkles, Flame, AlertTriangle, Dices } from "lucide-react";
import { TABLAS_CRITICOS_55E, obtenerEfectoCritico, formatearEfectoCritico } from "@/utiles/tablasCriticos";
import type { EfectoCritico, TipoCombate, SentidoTirada } from "@/utiles/tablasCriticos";
import { ts } from "@/utiles/TaleSpireAdapter";
import { logger } from "@/utiles/logger";
import estilos from "./ConsolaCriticosPifias.module.css";

const TIPOS_COMBATE = [
  { id: "melee", nombre: "Cuerpo a cuerpo", Icono: Swords },
  { id: "distancia", nombre: "A distancia", Icono: Crosshair },
  { id: "magico", nombre: "Magia", Icono: Sparkles },
] as const;

const ContenidoEfecto: React.FC<{ efecto: EfectoCritico }> = ({ efecto }) => (
  <div className={estilos.contenidoEfecto}>
    <h3 className={estilos.nombreEfecto}>{efecto.nombre}</h3>
    <p className={estilos.narrativaEfecto}>{efecto.narrativa}</p>
    <p className={estilos.mecanicaEfecto}><strong>Impacto mecánico</strong>{efecto.mecanica}</p>
  </div>
);

export const ConsolaCriticosPifias: React.FC = () => {
  const [tipoCombate, setTipoCombate] = useState<TipoCombate>("melee");
  const [sentidoTirada, setSentidoTirada] = useState<SentidoTirada>("critico");
  const [resultado, setResultado] = useState<EfectoCritico | null>(null);
  const [estadoChat, setEstadoChat] = useState("");
  const tabla = sentidoTirada === "critico" ? TABLAS_CRITICOS_55E[tipoCombate].criticos : TABLAS_CRITICOS_55E[tipoCombate].pifias;
  const nombreCombate = TIPOS_COMBATE.find(tipo => tipo.id === tipoCombate)?.nombre;
  const nombreEfecto = sentidoTirada === "critico" ? "Crítico" : "Pifia";

  const enviarAlChat = async (efecto: EfectoCritico) => {
    const mensaje = formatearEfectoCritico(efecto);
    if (!ts.estaDisponible) {
      logger.debug("[Simulador Chat] Resultado de tabla:", mensaje);
      setEstadoChat("Resultado local; TaleSpire no está conectado.");
      return;
    }
    try {
      const enviado = await ts.chat.send(mensaje);
      setEstadoChat(enviado ? "Resultado enviado al chat de TaleSpire." : "No se pudo enviar. Puedes reintentarlo con el botón de chat.");
    } catch (error) {
      logger.error("[TaleSpire Chat] Error al enviar resultado de tabla:", error);
      setEstadoChat("No se pudo enviar. Puedes reintentarlo con el botón de chat.");
    }
  };

  const lanzarD12 = () => {
    const efecto = obtenerEfectoCritico(tipoCombate, sentidoTirada, Math.floor(Math.random() * 12) + 1);
    setResultado(efecto);
    setEstadoChat("");
    void enviarAlChat(efecto);
  };

  // Evita que los botones de tirada activen el lienzo 3D de TaleSpire.
  const detenerPropagacion = (evento: React.MouseEvent<HTMLButtonElement>) => {
    evento.stopPropagation();
    evento.preventDefault();
  };

  return (
    <div className={estilos.seccionPifiasConsola}>
      <section className={estilos.consolaTiradorCard} aria-label="Tirada de críticos y pifias">
        <header className={estilos.cabeceraPanel}>
          <h2>Críticos y pifias</h2>
          <span className={estilos.insigniaDado}>d12</span>
        </header>
        <div className={estilos.grupoControlesConsola}>
          <div className={estilos.filaControlConsola}>
            <span className={estilos.labelControlConsola}>Ataque</span>
            <div className={estilos.togglesRow} role="group" aria-label="Tipo de ataque">
              {TIPOS_COMBATE.map(({ id, nombre, Icono }) => (
                <button key={id} type="button" aria-pressed={tipoCombate === id}
                  className={estilos.botonToggle} onClick={() => { setTipoCombate(id); setResultado(null); setEstadoChat(""); }}>
                  <Icono size={15} aria-hidden="true" />{nombre}
                </button>
              ))}
            </div>
          </div>
          <div className={estilos.filaControlConsola}>
            <span className={estilos.labelControlConsola}>Efecto</span>
            <div className={estilos.togglesRow} role="group" aria-label="Resultado del ataque">
              <button type="button" aria-pressed={sentidoTirada === "critico"} className={estilos.botonToggle}
                onClick={() => { setSentidoTirada("critico"); setResultado(null); setEstadoChat(""); }}>
                <Flame size={15} aria-hidden="true" />Crítico · 20 natural
              </button>
              <button type="button" aria-pressed={sentidoTirada === "pifia"} className={estilos.botonToggle}
                onClick={() => { setSentidoTirada("pifia"); setResultado(null); setEstadoChat(""); }}>
                <AlertTriangle size={15} aria-hidden="true" />Pifia · 1 natural
              </button>
            </div>
          </div>
          <button type="button" onMouseDown={detenerPropagacion} onMouseUp={detenerPropagacion}
            onClick={evento => { detenerPropagacion(evento); lanzarD12(); }} className={estilos.botonLanzarDado}>
            <Dices size={19} aria-hidden="true" />Tirar d12 · {nombreEfecto.toLowerCase()}
          </button>
          <p className={estilos.notaTirada}>Tirada instantánea · Envío automático al chat de TaleSpire.</p>
        </div>
        <div aria-live="polite" aria-atomic="true">
          {resultado ? (
            <div className={`${estilos.cajaResultado} ${sentidoTirada === "pifia" ? estilos.cajaPifia : ""}`}>
              <div className={estilos.cabeceraResultado}>
                <span className={estilos.numeroResultado}>{resultado.numero}<small>/ 12</small></span>
                <div><strong>{nombreEfecto} · {nombreCombate}</strong><span>{resultado.tipo}</span></div>
              </div>
              <ContenidoEfecto efecto={resultado} />
              <button type="button" onMouseDown={detenerPropagacion} onMouseUp={detenerPropagacion}
                onClick={evento => { detenerPropagacion(evento); void enviarAlChat(resultado); }} className={estilos.botonEnviarChat}>
                <MessageSquare size={15} aria-hidden="true" />Enviar de nuevo al chat
              </button>
              <p className={estilos.notaTirada}>{estadoChat}</p>
            </div>
          ) : (
            <div className={estilos.cajaVacia}>
              <Dices size={16} aria-hidden="true" />Elige el ataque y el efecto, y tira d12.
            </div>
          )}
        </div>
      </section>
      <section className={estilos.diccionarioConsultadorCard} aria-label="Tabla de efectos">
        <header className={estilos.cabeceraPanel}>
          <div><span className={estilos.etiquetaPanel}>Consulta rápida · 12 resultados</span><h2>{nombreEfecto === "Crítico" ? "Críticos" : "Pifias"} · {nombreCombate}</h2></div>
        </header>
        <div className={estilos.cuerpoDiccionarioScroll}>
          {[{ desde: 0, titulo: "01–06 · Narrativo + táctico" }, { desde: 6, titulo: "07–12 · Mecánico puro" }].map(({ desde, titulo }) => (
            <div key={desde} className={estilos.grupoEfectos}>
              <h3 className={estilos.subtituloDiccionario}>{titulo}</h3>
              {tabla.slice(desde, desde + 6).map(efecto => (
                <article key={efecto.numero} className={`${estilos.filaEfecto} ${resultado?.numero === efecto.numero ? estilos.filaSeleccionada : ""}`}>
                  <span className={estilos.numeroEfecto}>{efecto.numero}</span>
                  <ContenidoEfecto efecto={efecto} />
                </article>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
