import React, { useState } from "react";
import { CONDICIONES_2024 } from "../utiles/datosIniciales";
import { TABLAS_CRITICOS_55E } from "../utiles/tablasCriticos";
import {
  BookOpen,
  Footprints,
  Sparkles,
  HelpCircle,
  Compass,
  ArrowUp,
  MessageSquare
} from "lucide-react";

export const TablasDM: React.FC = () => {
  const [subCategoria, setSubCategoria] = useState<"condiciones" | "fisica" | "pifias" | "reglas">("condiciones");
  const [condicionSeleccionada, setCondicionSeleccionada] = useState(CONDICIONES_2024[0]);

  // Estados para Calculadora de Viaje
  const [pasoViaje, setPasoViaje] = useState<"lento" | "normal" | "rapido">("normal");
  const [horasViaje, setHorasViaje] = useState(8);

  // Estados para Calculadora de Salto
  const [puntuacionFuerza, setPuntuacionFuerza] = useState(10);
  const [conCarrera, setConCarrera] = useState(true);

  // Estados para Consola de Críticos
  const [tipoCombate, setTipoCombate] = useState<"melee" | "distancia" | "magico">("melee");
  const [sentidoTirada, setSentidoTirada] = useState<"critico" | "pifia">("critico");
  const [resultadoConsola, setResultadoConsola] = useState<{
    numero: number;
    tipoDado: "d20" | "d4";
    resultado: string;
    titulo: string;
  } | null>(null);

  // Generadores aleatorios para la consola táctica de críticos/pifias
  const lanzarDadosConsola = (tipoDado: "d20" | "d4") => {
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
    // Nota: No se lanza dado físico aquí, el generador ya usa Math.random() interno.
  };

  const enviarConsolaAlChat = () => {
    if (!resultadoConsola) return;
    
    const icono = sentidoTirada === "critico" ? "🔥" : "⚠️";
    const header = sentidoTirada === "critico"
      ? `<b><color=#00f5d4>[${resultadoConsola.titulo.toUpperCase()}]</color></b>`
      : `<b><color=#f25c54>[${resultadoConsola.titulo.toUpperCase()}]</color></b>`;
    
    const combatIcon = tipoCombate === "melee" ? "⚔️" : tipoCombate === "distancia" ? "🏹" : "✨";
    const combatName = tipoCombate === "melee" ? "Cuerpo a Cuerpo" : tipoCombate === "distancia" ? "A Distancia" : "Mágico";
    
    const mensajeFormateado = `${icono} **Tirada Táctica (${combatIcon} ${combatName})**:\n` +
      `${header}\n` +
      `• **Efecto**: ${resultadoConsola.resultado}`;

    if ((window as any).TS) {
      (window as any).TS.chat.send("board", mensajeFormateado);
    } else {
      console.log("[Simulador Chat] Enviando consola:", mensajeFormateado);
      alert(`[Simulado Chat]: ${resultadoConsola.resultado}`);
    }
  };

  // Cálculos de Viaje (Reglas 5.5e / 2024)
  const calcularViajeMillas = () => {
    let velocidadMillasPorHora = 3;
    if (pasoViaje === "lento") velocidadMillasPorHora = 2;
    if (pasoViaje === "rapido") velocidadMillasPorHora = 4;
    return horasViaje * velocidadMillasPorHora;
  };

  const obtenerEfectoPasoViaje = () => {
    if (pasoViaje === "lento") {
      return "Paso Lento: Permite viajar con Sigilo Activo (pueden moverse sigilosamente a ritmo normal bajo el manual 2024).";
    }
    if (pasoViaje === "rapido") {
      return "Paso Rápido: Penalizador de -5 a la Percepción Pasiva para detectar emboscadas y trampas.";
    }
    return "Paso Normal: Viaje estándar sin bonificaciones ni penalizadores tácticos.";
  };

  // Cálculos de Salto (D&D 5.5e / 2024)
  // Regla estándar:
  // - Salto de Longitud con carrera (mínimo 10 pies de movimiento previo): Distancia máxima en pies es igual a la Puntuación de Fuerza.
  // - Salto de Longitud sin carrera: Distancia máxima es la mitad de la Puntuación de Fuerza.
  // - Salto de Altura con carrera: Altura máxima es 3 + Modificador de Fuerza.
  // - Salto de Altura sin carrera: Altura máxima es la mitad de (3 + Modificador de Fuerza).
  const calcularSaltoLongitud = () => {
    return conCarrera ? puntuacionFuerza : Math.floor(puntuacionFuerza / 2);
  };

  const calcularSaltoAltura = () => {
    const modificadorFuerza = Math.floor((puntuacionFuerza - 10) / 2);
    const alturaBase = 3 + modificadorFuerza;
    const resultado = conCarrera ? alturaBase : Math.floor(alturaBase / 2);
    return Math.max(1, resultado); // Mínimo 1 pie de salto de altura
  };

  return (
    <div style={estilos.contenedorTablas}>
      {/* Selector de Sub-categoría superior */}
      <div style={estilos.subNavegacion}>
        <button
          onClick={() => setSubCategoria("condiciones")}
          style={{
            ...estilos.subBotonNav,
            ...(subCategoria === "condiciones" ? estilos.subBotonNavActivo : {})
          }}
        >
          <BookOpen size={10} />
          Condiciones 5.5e
        </button>

        <button
          onClick={() => setSubCategoria("fisica")}
          style={{
            ...estilos.subBotonNav,
            ...(subCategoria === "fisica" ? estilos.subBotonNavActivo : {})
          }}
        >
          <Footprints size={10} />
          Calculadoras Viaje/Salto
        </button>

        <button
          onClick={() => setSubCategoria("pifias")}
          style={{
            ...estilos.subBotonNav,
            ...(subCategoria === "pifias" ? estilos.subBotonNavActivo : {})
          }}
        >
          <Sparkles size={10} />
          Pifias y Críticos
        </button>

        <button
          onClick={() => setSubCategoria("reglas")}
          style={{
            ...estilos.subBotonNav,
            ...(subCategoria === "reglas" ? estilos.subBotonNavActivo : {})
          }}
        >
          <HelpCircle size={10} />
          Reglas Básicas
        </button>
      </div>

      {/* Cuerpo del Visualizador */}
      <div style={estilos.cuerpoVisualizador}>
        
        {/* SECCIÓN 1: CONDICIONES 5.5E */}
        {subCategoria === "condiciones" && (
          <div style={estilos.seccionCondiciones}>
            <div style={estilos.listaCondicionesLateral}>
              {CONDICIONES_2024.map((c) => (
                <div
                  key={c.nombre}
                  onClick={() => setCondicionSeleccionada(c)}
                  style={{
                    ...estilos.itemCondicionLista,
                    ...(condicionSeleccionada.nombre === c.nombre ? estilos.itemCondicionActivo : {})
                  }}
                >
                  {c.nombre.split(" (")[0]}
                </div>
              ))}
            </div>

            <div style={estilos.detalleCondicionPanel}>
              <h3 style={estilos.tituloCondicion}>{condicionSeleccionada.nombre}</h3>
              <span style={estilos.origenCondicion}>{condicionSeleccionada.descripcion}</span>
              
              <div style={estilos.bloqueEfectosCondicion}>
                <div style={estilos.cabeceraBloqueEfectos}>EFECTOS DE ESTA CONDICIÓN:</div>
                <ul style={estilos.listaEfectos}>
                  {condicionSeleccionada.efectos.map((efecto, i) => (
                    <li key={i} style={estilos.itemEfectoLista}>{efecto}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN 2: CALCULADORAS FÍSICAS */}
        {subCategoria === "fisica" && (
          <div style={estilos.seccionCalculadoras}>
            
            {/* Calculadora de Viaje */}
            <div style={estilos.tarjetaCalculadora}>
              <div style={estilos.tituloCalculadora}>
                <Compass size={12} style={{ color: "var(--color-borde-cian)" }} />
                <span>Calculadora de Viaje (Manual 2024)</span>
              </div>
              
              <div style={estilos.cuerpoCalculadora}>
                <div style={estilos.filaFormulario}>
                  <label style={estilos.labelForm}>Paso del Viaje:</label>
                  <select
                    value={pasoViaje}
                    onChange={(e) => setPasoViaje(e.target.value as any)}
                    style={estilos.selectForm}
                  >
                    <option value="lento">Lento (2 millas/hora)</option>
                    <option value="normal">Normal (3 millas/hora)</option>
                    <option value="rapido">Rápido (4 millas/hora)</option>
                  </select>
                </div>

                <div style={estilos.filaFormulario}>
                  <label style={estilos.labelForm}>Horas de Viaje:</label>
                  <input
                    type="number"
                    value={horasViaje}
                    onChange={(e) => setHorasViaje(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    style={estilos.inputForm}
                    min={1}
                    max={24}
                  />
                </div>

                <div style={estilos.resultadoCalculoBox}>
                  <div style={estilos.resultadoCalculoTexto}>
                    Distancia Recorrida:
                  </div>
                  <div style={estilos.resultadoCalculoValor} className="dato-numerico">
                    {calcularViajeMillas()} millas
                  </div>
                  <div style={estilos.resultadoCalculoEfecto}>
                    {obtenerEfectoPasoViaje()}
                  </div>
                </div>
              </div>
            </div>

            {/* Calculadora de Salto */}
            <div style={estilos.tarjetaCalculadora}>
              <div style={estilos.tituloCalculadora}>
                <ArrowUp size={12} style={{ color: "var(--color-advertencia)" }} />
                <span>Calculadora de Salto (Manual 2024)</span>
              </div>

              <div style={estilos.cuerpoCalculadora}>
                <div style={estilos.filaFormulario}>
                  <label style={estilos.labelForm}>Fuerza de Criatura:</label>
                  <input
                    type="number"
                    value={puntuacionFuerza}
                    onChange={(e) => setPuntuacionFuerza(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    style={estilos.inputForm}
                    min={1}
                    max={30}
                  />
                </div>

                <div style={estilos.filaFormulario}>
                  <label style={estilos.labelForm}>¿Carrera previa (10+ pies)?:</label>
                  <select
                    value={conCarrera ? "si" : "no"}
                    onChange={(e) => setConCarrera(e.target.value === "si")}
                    style={estilos.selectForm}
                  >
                    <option value="si">Sí (Carrera de 10 pies)</option>
                    <option value="no">No (Salto estático)</option>
                  </select>
                </div>

                <div style={estilos.resultadoCalculoBox}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <div>
                      <div style={estilos.resultadoCalculoTexto}>Salto de Longitud:</div>
                      <div style={{ ...estilos.resultadoCalculoValor, fontSize: "14px" }} className="dato-numerico">
                        {calcularSaltoLongitud()} pies
                      </div>
                    </div>
                    <div>
                      <div style={estilos.resultadoCalculoTexto}>Salto de Altura:</div>
                      <div style={{ ...estilos.resultadoCalculoValor, fontSize: "14px", color: "var(--color-advertencia)" }} className="dato-numerico">
                        {calcularSaltoAltura()} pies
                      </div>
                    </div>
                  </div>
                  <div style={estilos.resultadoCalculoEfecto}>
                    Nota: El salto consume movimiento de tu turno corriente en pies de forma equivalente a la distancia.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN 3: PIFIAS Y CRÍTICOS (CONSOLA TÁCTICA INTERACTIVA E INTEGRADA) */}
        {subCategoria === "pifias" && (
          <div style={estilos.seccionPifiasConsola}>
            {/* PARTE IZQUIERDA: GENERADOR CONSOLA */}
            <div style={estilos.consolaTiradorCard}>
              <div style={estilos.tituloConsolaTactico}>
                <span>Consola Táctica de Críticos/Pifias 5.5e</span>
              </div>
              
              <div style={estilos.grupoControlesConsola}>
                {/* Selector Tipo Combate */}
                <div style={estilos.filaControlConsola}>
                  <span style={estilos.labelControlConsola}>Combate:</span>
                  <div style={estilos.togglesRow}>
                    <button
                      onClick={() => {
                        setTipoCombate("melee");
                        setResultadoConsola(null);
                      }}
                      style={{
                        ...estilos.botonToggleChico,
                        ...(tipoCombate === "melee" ? estilos.botonToggleChicoActivo : {})
                      }}
                    >
                      ⚔️ Melee
                    </button>
                    <button
                      onClick={() => {
                        setTipoCombate("distancia");
                        setResultadoConsola(null);
                      }}
                      style={{
                        ...estilos.botonToggleChico,
                        ...(tipoCombate === "distancia" ? estilos.botonToggleChicoActivo : {})
                      }}
                    >
                      🏹 Rango
                    </button>
                    <button
                      onClick={() => {
                        setTipoCombate("magico");
                        setResultadoConsola(null);
                      }}
                      style={{
                        ...estilos.botonToggleChico,
                        ...(tipoCombate === "magico" ? estilos.botonToggleChicoActivo : {})
                      }}
                    >
                      ✨ Mágico
                    </button>
                  </div>
                </div>

                {/* Selector Sentido */}
                <div style={estilos.filaControlConsola}>
                  <span style={estilos.labelControlConsola}>Efecto:</span>
                  <div style={estilos.togglesRow}>
                    <button
                      onClick={() => {
                        setSentidoTirada("critico");
                        setResultadoConsola(null);
                      }}
                      style={{
                        ...estilos.botonToggleChico,
                        backgroundColor: sentidoTirada === "critico" ? "rgba(0, 245, 212, 0.15)" : "var(--color-fondo-tarjeta)",
                        border: sentidoTirada === "critico" ? "1px solid var(--color-borde-cian)" : "1px solid var(--color-borde-brutal)",
                        color: sentidoTirada === "critico" ? "var(--color-borde-cian)" : "var(--color-texto-secundario)"
                      }}
                    >
                      🔥 Crítico (20 Nat)
                    </button>
                    <button
                      onClick={() => {
                        setSentidoTirada("pifia");
                        setResultadoConsola(null);
                      }}
                      style={{
                        ...estilos.botonToggleChico,
                        backgroundColor: sentidoTirada === "pifia" ? "rgba(242, 92, 84, 0.15)" : "var(--color-fondo-tarjeta)",
                        border: sentidoTirada === "pifia" ? "1px solid var(--color-peligro)" : "1px solid var(--color-borde-brutal)",
                        color: sentidoTirada === "pifia" ? "var(--color-peligro)" : "var(--color-texto-secundario)"
                      }}
                    >
                      ⚠️ Pifia (1 Nat)
                    </button>
                  </div>
                </div>

                {/* Botones de Tirada */}
                <div style={estilos.filaAccionesDados}>
                  <button
                    onClick={() => lanzarDadosConsola("d20")}
                    style={{
                      ...estilos.botonLanzarDadoCustom,
                      backgroundColor: sentidoTirada === "critico" ? "rgba(0, 245, 212, 0.1)" : "rgba(242, 92, 84, 0.1)",
                      borderColor: sentidoTirada === "critico" ? "var(--color-borde-cian)" : "var(--color-peligro)",
                      color: sentidoTirada === "critico" ? "var(--color-borde-cian)" : "var(--color-peligro)"
                    }}
                  >
                    🎲 Tirar d20 (Estándar)
                  </button>
                  <button
                    onClick={() => lanzarDadosConsola("d4")}
                    style={{
                      ...estilos.botonLanzarDadoCustom,
                      backgroundColor: sentidoTirada === "critico" ? "rgba(255, 204, 0, 0.1)" : "rgba(123, 44, 191, 0.1)",
                      borderColor: sentidoTirada === "critico" ? "#ffcc00" : "#7b2cbf",
                      color: sentidoTirada === "critico" ? "#ffcc00" : "#a29bfe"
                    }}
                  >
                    🔥 Tirar d4 (Severo)
                  </button>
                </div>
              </div>

              {/* Resultado Consola */}
              {resultadoConsola ? (
                <div
                  style={{
                    ...estilos.cajaResultadoConsola,
                    borderColor: sentidoTirada === "critico" ? "var(--color-borde-cian)" : "var(--color-peligro)"
                  }}
                >
                  <div
                    style={{
                      ...estilos.tituloResultadoConsola,
                      color: sentidoTirada === "critico" ? "var(--color-borde-cian)" : "var(--color-peligro)"
                    }}
                  >
                    {resultadoConsola.titulo}
                  </div>
                  <div style={estilos.textoResultadoConsola}>
                    {resultadoConsola.resultado}
                  </div>
                  <button
                    onClick={enviarConsolaAlChat}
                    style={estilos.botonEnviarConsolaChat}
                  >
                    <MessageSquare size={11} />
                    Enviar a TaleSpire Chat
                  </button>
                </div>
              ) : (
                <div style={estilos.cajaVaciaConsola}>
                  Selecciona tipo, efecto y haz tu tirada de dados táctica de D&D 5.5e para ver el resultado.
                </div>
              )}
            </div>

            {/* PARTE DERECHA: CONSULTA RÁPIDA / DICCIONARIO COMPLETO */}
            <div style={estilos.diccionarioConsultadorCard}>
              <div style={estilos.tituloDiccionarioHeader}>
                <span>Consultar Tabla: {tipoCombate === "melee" ? "Cuerpo a Cuerpo" : tipoCombate === "distancia" ? "A Distancia" : "Mágico"} ({sentidoTirada === "critico" ? "Críticos" : "Pifias"})</span>
              </div>
              
              <div style={estilos.cuerpoDiccionarioScroll}>
                {/* Listado de efectos d20 */}
                <div style={estilos.subtituloDiccionarioSeccion}>Efectos Estándar (Tirada d20)</div>
                <div style={estilos.listaItemsDiccionario}>
                  {(sentidoTirada === "critico" 
                    ? TABLAS_CRITICOS_55E[tipoCombate].criticos 
                    : TABLAS_CRITICOS_55E[tipoCombate].pifias
                  ).map((item) => (
                    <div key={item.numero} style={estilos.filaItemDiccionario}>
                      <span style={estilos.diccItemNumero}>{item.numero}</span>
                      <span style={estilos.diccItemTexto}>{item.resultado}</span>
                    </div>
                  ))}
                </div>

                {/* Listado de efectos d4 */}
                <div style={{ ...estilos.subtituloDiccionarioSeccion, marginTop: "10px" }}>Efectos Severos (Tirada d4)</div>
                <div style={estilos.listaItemsDiccionario}>
                  {(sentidoTirada === "critico" 
                    ? TABLAS_CRITICOS_55E[tipoCombate].superCriticos 
                    : TABLAS_CRITICOS_55E[tipoCombate].superPifias
                  ).map((item) => (
                    <div key={item.numero} style={estilos.filaItemDiccionario}>
                      <span style={{ ...estilos.diccItemNumero, backgroundColor: "#7b2cbf", borderColor: "#a29bfe" }}>{item.numero}</span>
                      <span style={estilos.diccItemTexto}>{item.resultado}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN 4: REGLAS BÁSICAS (CUADRÍCULA BRUTAL DE ALTA DENSIDAD) */}
        {subCategoria === "reglas" && (
          <div style={estilos.seccionReglasBasicasGrid}>
            <div style={estilos.tarjetaReglaBrutal}>
              <div style={estilos.cabeceraReglaBrutal}>DIFICULTAD DE PRUEBAS (CD 5.5e)</div>
              <table style={estilos.tablaRegla}>
                <thead>
                  <tr style={estilos.filaTablaReglaHead}>
                    <th>DIFICULTAD</th>
                    <th>CD</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={estilos.filaTablaRegla}><td>Muy Fácil</td><td className="dato-numerico">5</td></tr>
                  <tr style={estilos.filaTablaRegla}><td>Fácil</td><td className="dato-numerico">10</td></tr>
                  <tr style={estilos.filaTablaRegla}><td>Moderado</td><td className="dato-numerico">15</td></tr>
                  <tr style={estilos.filaTablaRegla}><td>Difícil</td><td className="dato-numerico">20</td></tr>
                  <tr style={estilos.filaTablaRegla}><td>Muy Difícil</td><td className="dato-numerico">25</td></tr>
                  <tr style={estilos.filaTablaRegla}><td>Casi Imposible</td><td className="dato-numerico">30</td></tr>
                </tbody>
              </table>
            </div>

            <div style={estilos.tarjetaReglaBrutal}>
              <div style={estilos.cabeceraReglaBrutal}>COBERTURAS DE COMBATE (5.5e)</div>
              <ul style={estilos.listaCobertura}>
                <li style={estilos.itemCobertura}>
                  <strong>Cobertura Media (+2 CA):</strong> Al menos la mitad del cuerpo está a cubierto. Otorga +2 a CA y salvaciones de Destreza.
                </li>
                <li style={estilos.itemCobertura}>
                  <strong>Cobertura 3/4 (+5 CA):</strong> Otorga +5 a CA y salvaciones de Destreza. 3/4 partes del cuerpo cubiertas.
                </li>
                <li style={estilos.itemCobertura}>
                  <strong>Cobertura Total:</strong> No puede ser objetivo directo de ningún ataque o conjuro, salvo efectos de área curvos.
                </li>
              </ul>
            </div>

            <div style={estilos.tarjetaReglaBrutal}>
              <div style={estilos.cabeceraReglaBrutal}>VISIBILIDAD Y SIGILO (Manual 2024)</div>
              <div style={estilos.textoCuerpoRegla}>
                • <strong>Acción Esconderse:</strong> Superar prueba de <strong>Destreza (Sigilo) CD 15</strong>. Con éxito, ganas la condición <strong>Invisible</strong> (ventaja en ataques, enemigos tienen desventaja en golpearte, etc.) hasta que hagas ruido, ataques o te vean.
                <br /><br />
                • <strong>Búsqueda activa:</strong> Detectar criaturas escondidas requiere una acción de Buscar superando una prueba de Sabiduría CD igual a la tirada del escondido.
              </div>
            </div>

            <div style={estilos.tarjetaReglaBrutal}>
              <div style={estilos.cabeceraReglaBrutal}>CONCENTRACIÓN Y CONJUROS (5.5e)</div>
              <div style={estilos.textoCuerpoRegla}>
                • <strong>Daño sufrido:</strong> Haz una <strong>salvación de Constitución CD 10</strong> o la mitad del daño recibido (lo que sea mayor) para no perder la concentración de tu conjuro activo.
                <br /><br />
                • <strong>Interrupción:</strong> Lanzar otro conjuro de concentración rompe el actual inmediatamente. Quedar Incapacitado o Muerto también la rompe.
              </div>
            </div>

            <div style={estilos.tarjetaReglaBrutal}>
              <div style={estilos.cabeceraReglaBrutal}>REGLAS DE ASFIXIA (Manual 2024)</div>
              <div style={estilos.textoCuerpoRegla}>
                Una criatura puede aguantar la respiración una cantidad de minutos igual a <strong>1 + su modificador de Constitución</strong> (mínimo 30 segundos).
                <br /><br />
                Cuando se le acaba el aire, sobrevive una cantidad de asaltos igual a su <strong>modificador de Constitución</strong> (mínimo 1 asalto). Al inicio de su siguiente turno, cae a <strong>0 Puntos de Golpe</strong> y empieza a morir (realizar salvaciones de muerte).
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const estilos: { [key: string]: React.CSSProperties } = {
  contenedorTablas: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    width: "100%",
    backgroundColor: "var(--color-fondo-profundo)",
    padding: "2px",
    overflowY: "auto"
  },
  subNavegacion: {
    display: "flex",
    flexDirection: "row",
    gap: "3px",
    backgroundColor: "var(--color-fondo-panel)",
    borderBottom: "1px solid var(--color-borde-brutal)",
    padding: "2px",
    flexShrink: 0
  },
  subBotonNav: {
    backgroundColor: "var(--color-fondo-tarjeta)",
    border: "1px solid var(--color-borde-brutal)",
    color: "var(--color-texto-secundario)",
    fontSize: "11.5px",
    padding: "2px 6px",
    gap: "3px"
  },
  subBotonNavActivo: {
    backgroundColor: "var(--color-primario-brillante)",
    borderColor: "var(--color-borde-cian)",
    color: "#ffffff"
  },
  cuerpoVisualizador: {
    display: "flex",
    flexGrow: 1,
    padding: "2px",
    overflowY: "auto"
  },
  seccionCondiciones: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    gap: "4px",
    height: "100%"
  },
  listaCondicionesLateral: {
    width: "120px",
    backgroundColor: "var(--color-fondo-panel)",
    border: "1px solid var(--color-borde-brutal)",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    flexShrink: 0
  },
  itemCondicionLista: {
    padding: "4px 6px",
    fontSize: "12px",
    fontWeight: "bold",
    borderBottom: "1px solid var(--color-borde-brutal)",
    cursor: "pointer",
    textTransform: "uppercase"
  },
  itemCondicionActivo: {
    backgroundColor: "var(--color-primario)",
    color: "#ffffff",
    borderLeft: "2px solid var(--color-borde-cian)"
  },
  detalleCondicionPanel: {
    flexGrow: 1,
    backgroundColor: "var(--color-fondo-panel)",
    border: "1px solid var(--color-borde-brutal)",
    padding: "6px",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto"
  },
  tituloCondicion: {
    fontSize: "15px",
    color: "var(--color-borde-cian)"
  },
  origenCondicion: {
    fontSize: "11px",
    color: "var(--color-texto-apagado)",
    textTransform: "uppercase",
    marginBottom: "6px",
    display: "block"
  },
  bloqueEfectosCondicion: {
    backgroundColor: "var(--color-fondo-tarjeta)",
    border: "1px solid var(--color-borde-brutal)",
    padding: "4px"
  },
  cabeceraBloqueEfectos: {
    fontSize: "12px",
    fontWeight: "bold",
    color: "var(--color-texto-apagado)",
    marginBottom: "4px",
    borderBottom: "1px dashed var(--color-borde-brutal)"
  },
  listaEfectos: {
    listStyleType: "square",
    paddingLeft: "12px"
  },
  itemEfectoLista: {
    fontSize: "12px",
    lineHeight: "1.5",
    color: "var(--color-texto-principal)",
    marginBottom: "6px"
  },
  seccionCalculadoras: {
    display: "flex",
    flexDirection: "column",
    flexWrap: "wrap",
    width: "100%",
    gap: "4px"
  },
  tarjetaCalculadora: {
    flex: "1 1 200px",
    backgroundColor: "var(--color-fondo-panel)",
    border: "1px solid var(--color-borde-brutal)",
    padding: "4px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    height: "fit-content"
  },
  tituloCalculadora: {
    fontSize: "13px",
    fontWeight: "bold",
    textTransform: "uppercase",
    borderBottom: "1px solid var(--color-borde-brutal)",
    paddingBottom: "2px",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  cuerpoCalculadora: {
    display: "flex",
    flexDirection: "column",
    gap: "3px"
  },
  filaFormulario: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px"
  },
  labelForm: {
    fontSize: "13px",
    color: "var(--color-texto-secundario)"
  },
  selectForm: {
    fontSize: "12px",
    height: "24px",
    padding: "1px 2px",
    width: "200px"
  },
  inputForm: {
    fontSize: "12px",
    height: "24px",
    padding: "1px 2px",
    width: "200px",
    textAlign: "center"
  },
  resultadoCalculoBox: {
    backgroundColor: "var(--color-fondo-tarjeta)",
    border: "1px solid var(--color-borde-brutal)",
    padding: "5px",
    marginTop: "5px",
    display: "flex",
    flexDirection: "column",
    textAlign: "center",
    gap: "6px"
  },
  resultadoCalculoTexto: {
    fontSize: "12px",
    color: "var(--color-texto-apagado)",
    textTransform: "uppercase"
  },
  resultadoCalculoValor: {
    fontSize: "18px",
    color: "var(--color-borde-cian)"
  },
  resultadoCalculoEfecto: {
    fontSize: "12px",
    color: "var(--color-texto-secundario)",
    fontStyle: "italic",
    lineHeight: "1.2",
    marginTop: "2px"
  },
  seccionPifias: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    gap: "6px"
  },
  cajaBotonesGeneradores: {
    display: "flex",
    flexDirection: "row",
    gap: "4px"
  },
  botonGenerarPifia: {
    flex: 1,
    height: "26px",
    backgroundColor: "rgba(242, 92, 84, 0.1)",
    border: "1px solid var(--color-peligro)",
    color: "var(--color-peligro)"
  },
  botonGenerarCritico: {
    flex: 1,
    height: "26px",
    backgroundColor: "rgba(0, 245, 212, 0.1)",
    border: "1px solid var(--color-exito)",
    color: "var(--color-exito)"
  },
  cajaResultadoEfecto: {
    backgroundColor: "var(--color-fondo-panel)",
    border: "2px solid var(--color-borde-brutal)",
    padding: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    animation: "pulse-neon 1s infinite alternate"
  },
  resultadoEfectoEncabezado: {
    fontSize: "11px",
    fontWeight: "bold",
    letterSpacing: "0.05em"
  },
  resultadoEfectoCuerpo: {
    fontSize: "11px",
    lineHeight: "1.35",
    color: "var(--color-texto-principal)",
    fontFamily: "var(--fuente-codigo)"
  },
  botonEnviarChat: {
    alignSelf: "flex-start",
    fontSize: "9px",
    backgroundColor: "var(--color-fondo-tarjeta)",
    borderColor: "var(--color-borde-brutal)",
    padding: "3px 6px"
  },
  resultadoEfectoVacio: {
    fontSize: "10px",
    color: "var(--color-texto-secundario)",
    textAlign: "center",
    padding: "30px",
    border: "1px dashed var(--color-borde-brutal)",
    backgroundColor: "var(--color-fondo-panel)"
  },
  seccionReglasBasicas: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    gap: "6px",
  },
  tarjetaReglaBrutal: {
    flex: "1 1 200px",
    backgroundColor: "var(--color-fondo-panel)",
    border: "1px solid var(--color-borde-brutal)",
    padding: "6px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    height: "fit-content"
  },
  cabeceraReglaBrutal: {
    fontSize: "12px",
    fontWeight: "bold",
    color: "var(--color-borde-cian)",
    borderBottom: "1px solid var(--color-borde-brutal)",
    paddingBottom: "2px",
    textTransform: "uppercase"
  },
  tablaRegla: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "12px"
  },
  filaTablaReglaHead: {
    borderBottom: "1px solid var(--color-borde-brutal)",
    color: "var(--color-texto-apagado)",
    textAlign: "left"
  },
  filaTablaRegla: {
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)"
  },
  listaCobertura: {
    listStyleType: "square",
    paddingLeft: "12px",
    fontSize: "12px",
    lineHeight: "1.3",
    color: "var(--color-texto-principal)"
  },
  itemCobertura: {
    marginBottom: "4px"
  },
  textoCuerpoRegla: {
    fontSize: "12px",
    lineHeight: "1.3",
    color: "var(--color-texto-principal)"
  },
  seccionPifiasConsola: {
    display: "flex",
    flexDirection: "row",
    gap: "8px",
    width: "100%",
    height: "100%"
  },
  consolaTiradorCard: {
    flex: 1,
    backgroundColor: "var(--color-fondo-panel)",
    border: "1.5px solid var(--color-borde-brutal)",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    borderRadius: "8px"
  },
  diccionarioConsultadorCard: {
    flex: 1.2,
    backgroundColor: "var(--color-fondo-panel)",
    border: "1.5px solid var(--color-borde-brutal)",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    borderRadius: "8px",
    height: "100%",
    overflow: "hidden"
  },
  tituloConsolaTactico: {
    fontSize: "12px",
    fontWeight: "bold",
    borderBottom: "1.5px solid var(--color-borde-brutal)",
    paddingBottom: "4px",
    color: "var(--color-borde-cian)",
    textTransform: "uppercase"
  },
  tituloDiccionarioHeader: {
    fontSize: "12px",
    fontWeight: "bold",
    borderBottom: "1.5px solid var(--color-borde-brutal)",
    paddingBottom: "4px",
    color: "#ffcc00",
    textTransform: "uppercase"
  },
  grupoControlesConsola: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    backgroundColor: "var(--color-fondo-tarjeta)",
    border: "1px solid var(--color-borde-brutal)",
    padding: "8px",
    borderRadius: "6px"
  },
  filaControlConsola: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px"
  },
  labelControlConsola: {
    fontSize: "10px",
    fontWeight: "bold",
    color: "var(--color-texto-secundario)"
  },
  togglesRow: {
    display: "flex",
    flexDirection: "row",
    gap: "4px"
  },
  botonToggleChico: {
    fontSize: "10px",
    padding: "3px 6px",
    cursor: "pointer",
    backgroundColor: "var(--color-fondo-tarjeta)",
    border: "1px solid var(--color-borde-brutal)",
    color: "var(--color-texto-secundario)",
    borderRadius: "3px",
    transition: "all 0.1s ease"
  },
  botonToggleChicoActivo: {
    backgroundColor: "var(--color-primario-brillante)",
    borderColor: "var(--color-borde-cian)",
    color: "#ffffff"
  },
  filaAccionesDados: {
    display: "flex",
    flexDirection: "row",
    gap: "6px",
    marginTop: "4px"
  },
  botonLanzarDadoCustom: {
    flex: 1,
    height: "28px",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer",
    border: "1.5px solid",
    borderRadius: "4px",
    transition: "all 0.15s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px"
  },
  cajaResultadoConsola: {
    backgroundColor: "var(--color-fondo-profundo)",
    border: "2px solid",
    padding: "10px",
    borderRadius: "6px",
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  tituloResultadoConsola: {
    fontSize: "12px",
    fontWeight: "bold",
    textTransform: "uppercase"
  },
  textoResultadoConsola: {
    fontSize: "11.5px",
    color: "var(--color-texto-principal)",
    lineHeight: "1.4",
    fontFamily: "var(--fuente-codigo)",
    whiteSpace: "pre-line"
  },
  botonEnviarConsolaChat: {
    alignSelf: "flex-start",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "4px",
    fontSize: "10px",
    padding: "4px 8px",
    backgroundColor: "rgba(0, 245, 212, 0.12)",
    border: "1px solid var(--color-borde-cian)",
    color: "var(--color-borde-cian)",
    cursor: "pointer",
    borderRadius: "4px",
    fontWeight: "bold",
    marginTop: "4px"
  },
  cajaVaciaConsola: {
    fontSize: "10.5px",
    color: "var(--color-texto-apagado)",
    fontStyle: "italic",
    textAlign: "center",
    padding: "20px",
    border: "1px dashed var(--color-borde-brutal)",
    backgroundColor: "var(--color-fondo-profundo)",
    borderRadius: "6px"
  },
  cuerpoDiccionarioScroll: {
    flexGrow: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    paddingRight: "4px"
  },
  subtituloDiccionarioSeccion: {
    fontSize: "10px",
    fontWeight: "bold",
    color: "var(--color-texto-apagado)",
    textTransform: "uppercase",
    borderBottom: "1px dashed var(--color-borde-brutal)",
    paddingBottom: "2px"
  },
  listaItemsDiccionario: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  filaItemDiccionario: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: "6px",
    padding: "4px 6px",
    backgroundColor: "var(--color-fondo-tarjeta)",
    border: "1px solid var(--color-borde-brutal)",
    borderRadius: "4px"
  },
  diccItemNumero: {
    fontSize: "9px",
    fontWeight: "bold",
    backgroundColor: "rgba(0, 245, 212, 0.15)",
    border: "1px solid var(--color-borde-cian)",
    color: "var(--color-borde-cian)",
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  diccItemTexto: {
    fontSize: "10px",
    color: "var(--color-texto-principal)",
    lineHeight: "1.3"
  },
  seccionReglasBasicasGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "6px",
    width: "100%",
    height: "100%"
  }
};
