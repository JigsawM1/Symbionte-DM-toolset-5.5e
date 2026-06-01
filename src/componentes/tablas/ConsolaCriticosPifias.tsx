import React, { useState } from "react";
import { TABLAS_CRITICOS_55E } from "../../utiles/tablasCriticos";
import { MessageSquare } from "lucide-react";
import estilosClases from "./ConsolaCriticosPifias.module.css";

export const ConsolaCriticosPifias: React.FC = () => {
  const [tipoCombate, setTipoCombate] = useState<"melee" | "distancia" | "magico">("melee");
  const [sentidoTirada, setSentidoTirada] = useState<"critico" | "pifia">("critico");
  const [resultadoConsola, setResultadoConsola] = useState<{
    numero: number;
    tipoDado: "d20" | "d4";
    resultado: string;
    titulo: string;
  } | null>(null);

  const lanzarDadosConsola = async (tipoDado: "d20" | "d4") => {
    const caras = tipoDado === "d20" ? 20 : 4;
    const resultadoDado = Math.floor(Math.random() * caras) + 1;
    
    const tablaCategoria = TABLAS_CRITICOS_55E[tipoCombate];
    let efectoStr = "";
    let tituloEfecto = "";

    if (sentidoTirada === "critico") {
      if (tipoDado === "d20") {
        const item = tablaCategoria.criticos.find((c) => c.numero === resultadoDado);
        efectoStr = item ? item.resultado : "Efecto no encontrado";
        tituloEfecto = `EFECTO CRÍTICO (d20) - Resultado ${resultadoDado}`;
      } else {
        const item = tablaCategoria.superCriticos.find((c) => c.numero === resultadoDado);
        efectoStr = item ? item.resultado : "Efecto severo no encontrado";
        tituloEfecto = `CRÍTICO EXTREMO (d4) - Resultado ${resultadoDado}`;
      }
    } else {
      if (tipoDado === "d20") {
        const item = tablaCategoria.pifias.find((c) => c.numero === resultadoDado);
        efectoStr = item ? item.resultado : "Efecto de pifia no encontrado";
        tituloEfecto = `PIFIA DE COMBATE (d20) - Resultado ${resultadoDado}`;
      } else {
        const item = tablaCategoria.superPifias.find((c) => c.numero === resultadoDado);
        efectoStr = item ? item.resultado : "Efecto de pifia severo no encontrado";
        tituloEfecto = `PIFIA EXTREMA Y DESASTROSA (d4) - Resultado ${resultadoDado}`;
      }
    }

    setResultadoConsola({
      numero: resultadoDado,
      tipoDado,
      resultado: efectoStr,
      titulo: tituloEfecto
    });

    // Inyección automática al chat nativo de TaleSpire
    const mensajeFormateado = efectoStr;

    const ts = window.TS;
    if (ts && ts.chat && typeof ts.chat.send === "function") {
      try {
        await ts.chat.send(mensajeFormateado);
        console.log("[TaleSpire Chat] Mensaje de consola enviado con éxito automáticamente al tirar.");
      } catch (error) {
        console.error("[TaleSpire Chat] Error al enviar mensaje automático al tirar:", error);
      }
    } else {
      console.log("[Simulador Chat] Enviando consola (Automático):", mensajeFormateado);
    }
  };

  const detenerPropagacion = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const enviarConsolaAlChat = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!resultadoConsola) return;
    
    const mensajeFormateado = resultadoConsola.resultado;

    const ts = window.TS;
    if (ts && ts.chat && typeof ts.chat.send === "function") {
      try {
        await ts.chat.send(mensajeFormateado);
        console.log("[TaleSpire Chat] Mensaje de consola enviado con éxito.");
      } catch (error) {
        console.error("[TaleSpire Chat] Error al enviar mensaje nativo:", error);
      }
    } else {
      console.log("[Simulador Chat] Enviando consola:", mensajeFormateado);
    }
  };

  return (
    <div className={estilosClases.seccionPifiasConsola}>
      {/* PARTE IZQUIERDA: GENERADOR CONSOLA */}
      <div className={estilosClases.consolaTiradorCard}>
        <div className={estilosClases.tituloConsolaTactico}>
          <span>Consola Táctica de Críticos/Pifias 5.5e</span>
        </div>
        
        <div className={estilosClases.grupoControlesConsola}>
          {/* Selector Tipo Combate */}
          <div className={estilosClases.filaControlConsola}>
            <span className={estilosClases.labelControlConsola}>Combate:</span>
            <div className={estilosClases.togglesRow}>
              <button
                onClick={() => {
                  setTipoCombate("melee");
                  setResultadoConsola(null);
                }}
                className={`${estilosClases.botonToggleChico} ${
                  tipoCombate === "melee" ? estilosClases.botonToggleChicoActivo : ""
                }`}
              >
                ⚔️ Melee
              </button>
              <button
                onClick={() => {
                  setTipoCombate("distancia");
                  setResultadoConsola(null);
                }}
                className={`${estilosClases.botonToggleChico} ${
                  tipoCombate === "distancia" ? estilosClases.botonToggleChicoActivo : ""
                }`}
              >
                🏹 Rango
              </button>
              <button
                onClick={() => {
                  setTipoCombate("magico");
                  setResultadoConsola(null);
                }}
                className={`${estilosClases.botonToggleChico} ${
                  tipoCombate === "magico" ? estilosClases.botonToggleChicoActivo : ""
                }`}
              >
                ✨ Mágico
              </button>
            </div>
          </div>

          {/* Selector Sentido */}
          <div className={estilosClases.filaControlConsola}>
            <span className={estilosClases.labelControlConsola}>Efecto:</span>
            <div className={estilosClases.togglesRow}>
              <button
                onClick={() => {
                  setSentidoTirada("critico");
                  setResultadoConsola(null);
                }}
                className={`${estilosClases.botonToggleChico} ${
                  sentidoTirada === "critico" ? estilosClases.toggleCriticoActivo : ""
                }`}
              >
                🔥 Crítico (20 Nat)
              </button>
              <button
                onClick={() => {
                  setSentidoTirada("pifia");
                  setResultadoConsola(null);
                }}
                className={`${estilosClases.botonToggleChico} ${
                  sentidoTirada === "pifia" ? estilosClases.togglePifiaActivo : ""
                }`}
              >
                ⚠️ Pifia (1 Nat)
              </button>
            </div>
          </div>

          {/* Botones de Tirada */}
          <div className={estilosClases.filaAccionesDados}>
            <button
              onMouseDown={detenerPropagacion}
              onMouseUp={detenerPropagacion}
              onClick={(e) => {
                detenerPropagacion(e);
                lanzarDadosConsola("d20");
              }}
              className={`${estilosClases.botonLanzarDadoCustom} ${
                sentidoTirada === "critico" ? estilosClases.botonLanzarD20Critico : estilosClases.botonLanzarD20Pifia
              }`}
            >
              🎲 Tirar d20 (Estándar)
            </button>
            <button
              onMouseDown={detenerPropagacion}
              onMouseUp={detenerPropagacion}
              onClick={(e) => {
                detenerPropagacion(e);
                lanzarDadosConsola("d4");
              }}
              className={`${estilosClases.botonLanzarDadoCustom} ${
                sentidoTirada === "critico" ? estilosClases.botonLanzarD4Critico : estilosClases.botonLanzarD4Pifia
              }`}
            >
              🔥 Tirar d4 (Severo)
            </button>
          </div>
        </div>

        {/* Resultado Consola */}
        {resultadoConsola ? (
          <div
            className={`${estilosClases.cajaResultadoConsola} ${
              sentidoTirada === "critico" ? estilosClases.cajaResultadoCritico : estilosClases.cajaResultadoPifia
            }`}
          >
            <div
              className={`${estilosClases.tituloResultadoConsola} ${
                sentidoTirada === "critico" ? estilosClases.tituloResultadoCritico : estilosClases.tituloResultadoPifia
              }`}
            >
              {resultadoConsola.titulo}
            </div>
            <div className={estilosClases.textoResultadoConsola}>
              {resultadoConsola.resultado}
            </div>
            <button
              onMouseDown={detenerPropagacion}
              onMouseUp={detenerPropagacion}
              onClick={enviarConsolaAlChat}
              className={estilosClases.botonEnviarConsolaChat}
            >
              <MessageSquare size={11} style={{ marginRight: "4px" }} />
              Enviar a TaleSpire Chat
            </button>
          </div>
        ) : (
          <div className={estilosClases.cajaVaciaConsola}>
            Selecciona tipo, efecto y haz tu tirada de dados táctica de D&D 5.5e para ver el resultado.
          </div>
        )}
      </div>

      {/* PARTE DERECHA: CONSULTA RÁPIDA / DICCIONARIO COMPLETO */}
      <div className={estilosClases.diccionarioConsultadorCard}>
        <div className={estilosClases.tituloDiccionarioHeader}>
          <span>Consultar Tabla: {tipoCombate === "melee" ? "Cuerpo a Cuerpo" : tipoCombate === "distancia" ? "A Distancia" : "Mágico"} ({sentidoTirada === "critico" ? "Críticos" : "Pifias"})</span>
        </div>
        
        <div className={estilosClases.cuerpoDiccionarioScroll}>
          {/* Listado de efectos d20 */}
          <div className={estilosClases.subtituloDiccionarioSeccion}>Efectos Estándar (Tirada d20)</div>
          <div className={estilosClases.listaItemsDiccionario}>
            {(sentidoTirada === "critico" 
              ? TABLAS_CRITICOS_55E[tipoCombate].criticos 
              : TABLAS_CRITICOS_55E[tipoCombate].pifias
            ).map((item) => (
              <div key={item.numero} className={estilosClases.filaItemDiccionario}>
                <span className={estilosClases.diccItemNumero}>{item.numero}</span>
                <span className={estilosClases.diccItemTexto}>{item.resultado}</span>
              </div>
            ))}
          </div>

          {/* Listado de efectos d4 */}
          <div className={estilosClases.subtituloDiccionarioSeccion} style={{ marginTop: "10px" }}>Efectos Severos (Tirada d4)</div>
          <div className={estilosClases.listaItemsDiccionario}>
            {(sentidoTirada === "critico" 
              ? TABLAS_CRITICOS_55E[tipoCombate].superCriticos 
              : TABLAS_CRITICOS_55E[tipoCombate].superPifias
            ).map((item) => (
              <div key={item.numero} className={estilosClases.filaItemDiccionario}>
                <span className={estilosClases.diccItemNumero} style={{ backgroundColor: "#7b2cbf", borderColor: "#a29bfe" }}>{item.numero}</span>
                <span className={estilosClases.diccItemTexto}>{item.resultado}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
