import React, { useState } from "react";
import { usarAlmacenDM, CriaturaIniciativa } from "../almacen/usarAlmacenDM";
import { MonstruoBase, CONDICIONES_2024 } from "../utiles/datosIniciales";
import { lanzarDadosTaleSpire, renderizarTextoConDadosInteractivos, sanitizarEtiqueta } from "../utiles/lanzadorDados";
import { ModalDetalleHechizo } from "./ModalDetalleHechizo";
import {
  Skull,
  Shield,
  Trash2,
  Heart,
  Activity,
  Swords,
  Search,
  Check,
  X,
  Link,
  FileText
} from "lucide-react";

export const GestorIniciativa: React.FC = () => {
  const {
    colaIniciativa,
    indiceTurnoActivo,
    baseDatosMonstruos,
    baseDatosHechizos,
    criaturasSeleccionadas,
    quitarCriaturaDeIniciativa,
    modificarVidaCriaturaIniciativa,
    actualizarVidaTemporal,
    asociarPlantillaACriatura,
    quitarCondicionDeCriatura,
    agregarCondicionACriatura,
    agregarCriaturasSeleccionadasAIniciativa
  } = usarAlmacenDM();

  // Estados locales
  const [idCriaturaDetalle, setIdCriaturaDetalle] = useState<string | null>(null);
  const [filtroBuscadorVinculo, setFiltroBuscadorVinculo] = useState("");
  const [mostrarListaVinculos, setMostrarListaVinculos] = useState(false);
  const [valoresInputHP, setValoresInputHP] = useState<Record<string, string>>({});
  const [hechizoFlotanteDetalle, setHechizoFlotanteDetalle] = useState<any | null>(null);

  // Helper recursivo ultra-avanzado para renderizar texto mezclando dados 3D y enlaces clickables a hechizos del compendio
  const renderizarTextoConHechizosYDados = (texto: string, etiquetaTirada: string, alHacerClicHechizo: (h: any) => void) => {
    // 1. Primero procesamos los dados
    const nodosConDados = renderizarTextoConDadosInteractivos(texto, etiquetaTirada);
    
    // 2. Si no hay hechizos en la DB, devolvemos directo
    if (!baseDatosHechizos || baseDatosHechizos.length === 0) return nodosConDados;

    // Ordenar hechizos por longitud de nombre de mayor a menor para evitar colisiones (ej. "Bola" vs "Bola de Fuego")
    const hechizosOrdenados = [...baseDatosHechizos].sort((a, b) => b.nombre.length - a.nombre.length);

    // Procesamos cada nodo de texto
    const nodosFinales: React.ReactNode[] = [];

    nodosConDados.forEach((nodo) => {
      if (typeof nodo !== "string") {
        nodosFinales.push(nodo); // Preservamos los botones de dados ya procesados
        return;
      }

      // Procesamos el texto plano buscando hechizos
      let textosAIterar = [{ texto: nodo, id: 0 }];
      let keyCounter = 0;

      for (const hechizo of hechizosOrdenados) {
        const nombreHechizo = hechizo.nombre.toLowerCase().trim();
        if (nombreHechizo.length < 3) continue; // Ignorar nombres ridículamente cortos

        const nuevosTextos: typeof textosAIterar = [];

        for (const item of textosAIterar) {
          if (typeof item === "object" && (item as any).componente) {
            nuevosTextos.push(item);
            continue;
          }

          const textoOriginal = item.texto;
          
          // Regex segura para buscar el nombre del hechizo respetando límites lógicos
          const nombreEscapado = nombreHechizo.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const regexHechizo = new RegExp(`\\b${nombreEscapado}\\b`, "i");
          const match = textoOriginal.match(regexHechizo);

          if (match && match.index !== undefined) {
            const indice = match.index;
            const antes = textoOriginal.substring(0, indice);
            const coincidenciaOriginal = textoOriginal.substring(indice, indice + nombreHechizo.length);
            const despues = textoOriginal.substring(indice + nombreHechizo.length);

            if (antes) nuevosTextos.push({ texto: antes, id: ++keyCounter });
            
            // Creamos el componente de enlace
            const enlaceReact = React.createElement(
              "span",
              {
                key: `hechizo-link-${hechizo.id}-${keyCounter}`,
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation();
                  alHacerClicHechizo(hechizo);
                },
                style: {
                  color: "var(--color-borde-cian)",
                  textDecoration: "underline dashed var(--color-borde-cian)",
                  cursor: "pointer",
                  fontWeight: "bold",
                  padding: "0 4px",
                  backgroundColor: "rgba(0, 245, 212, 0.06)",
                  borderRadius: "3px",
                  display: "inline-block",
                  transition: "all 0.15s ease"
                },
                title: `Ver conjuro "${hechizo.nombre}"`
              },
              `📖 ${coincidenciaOriginal}`
            );

            nuevosTextos.push({ componente: enlaceReact } as any);

            if (despues) nuevosTextos.push({ texto: despues, id: ++keyCounter });
          } else {
            nuevosTextos.push(item);
          }
        }

        textosAIterar = nuevosTextos;
      }

      // Convertimos todo de vuelta a nodos de React
      textosAIterar.forEach((item) => {
        if ((item as any).componente) {
          nodosFinales.push((item as any).componente);
        } else {
          nodosFinales.push(item.texto);
        }
      });
    });

    return nodosFinales;
  };

  // Buscar plantilla de estadísticas para una criatura
  const obtenerPlantillaAsociada = (criatura: CriaturaIniciativa): MonstruoBase | null => {
    if (criatura.idPlantillaAsociada) {
      return baseDatosMonstruos.find((m) => m.id === criatura.idPlantillaAsociada) || null;
    }
    return baseDatosMonstruos.find((m) => m.nombre.toLowerCase() === criatura.nombre.toLowerCase()) || null;
  };

  // Funciones controladas para curar y dañar respetando Vida Temporal
  const aplicarCuracion = (id: string, actual: number, maximo: number) => {
    const input = valoresInputHP[id];
    if (!input) return;
    const valor = parseInt(input, 10);
    if (isNaN(valor) || valor <= 0) return;

    const nuevaVida = Math.min(maximo, actual + valor);
    modificarVidaCriaturaIniciativa(id, nuevaVida);

    if ((window as any).TS) {
      (window as any).TS.debug.log(`[Combat Tracker] Curación aplicada a la criatura ${id}: ${actual} -> ${nuevaVida}`);
    }

    setValoresInputHP((prev) => ({ ...prev, [id]: "" }));
  };

  const aplicarDaño = (id: string, actual: number, temporal: number) => {
    const input = valoresInputHP[id];
    if (!input) return;
    const valor = parseInt(input, 10);
    if (isNaN(valor) || valor <= 0) return;

    if (temporal > 0) {
      if (valor <= temporal) {
        actualizarVidaTemporal(id, temporal - valor);
        if ((window as any).TS) {
          (window as any).TS.debug.log(`[Combat Tracker] Daño absorbido completamente por Vida Temporal en la criatura ${id}: Temp HP ${temporal} -> ${temporal - valor}`);
        }
      } else {
        const excedente = valor - temporal;
        actualizarVidaTemporal(id, 0);
        const nuevaVida = Math.max(0, actual - excedente);
        modificarVidaCriaturaIniciativa(id, nuevaVida);
        if ((window as any).TS) {
          (window as any).TS.debug.log(`[Combat Tracker] Daño absorbido parcialmente por Vida Temporal. Resto aplicado a salud en la criatura ${id}: Temp HP 0, Vida ${actual} -> ${nuevaVida}`);
        }
      }
    } else {
      const nuevaVida = Math.max(0, actual - valor);
      modificarVidaCriaturaIniciativa(id, nuevaVida);
      if ((window as any).TS) {
        (window as any).TS.debug.log(`[Combat Tracker] Daño directo aplicado a la criatura ${id}: Vida ${actual} -> ${nuevaVida}`);
      }
    }

    setValoresInputHP((prev) => ({ ...prev, [id]: "" }));
  };

  const calcularModificador = (valor: number): string => {
    const mod = Math.floor((valor - 10) / 2);
    return `${mod >= 0 ? "+" : ""}${mod}`;
  };

  const obtenerPercepcionPasiva = (plantilla: MonstruoBase | null): number => {
    if (!plantilla) return 10;

    if (plantilla.sentidos) {
      const match = String(plantilla.sentidos).match(/percepci[oó]n\s+pasiva\s*[:\s]\s*(\d+)/i);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    const sab = plantilla.caracteristicas?.sabiduria ?? 10;
    const modSab = Math.floor((sab - 10) / 2);
    
    const percBono = plantilla.habilidades?.percepcion;
    if (percBono !== undefined) {
      return 10 + percBono;
    }

    return 10 + modSab;
  };

  const lanzarAtaqueRapido = (criaturaNombre: string, ataqueNombre: string, bonoAtaqueStr: string, dadosDaño: string, tipoDaño: string) => {
    const bono = parseInt(bonoAtaqueStr.replace(/[^\d-]/g, ""), 10) || 0;
    // Utilizamos el lanzador de dados centralizado con formato multi-grupo nativo de TaleSpire sin signos de exclamación intermedios
    const formulaDados = `!Ataque ${sanitizarEtiqueta(ataqueNombre)}:1d20${bono >= 0 ? "+" : ""}${bono}/Daño ${sanitizarEtiqueta(tipoDaño)}:${dadosDaño.replace(/\s+/g, "")}`;
    lanzarDadosTaleSpire(formulaDados, `${criaturaNombre} - ${ataqueNombre}`);
  };

  const lanzarTiradaD20Interactiva = (criaturaNombre: string, etiqueta: string, bonificador: number) => {
    // Usamos el lanzador centralizado con formato nativo de d20
    const formulaDados = `!${sanitizarEtiqueta(etiqueta)}:1d20${bonificador >= 0 ? "+" : ""}${bonificador}`;
    lanzarDadosTaleSpire(formulaDados, `${criaturaNombre} - ${etiqueta}`);
  };

  const plantillasFiltradas = baseDatosMonstruos.filter((m) =>
    m.nombre.toLowerCase().includes(filtroBuscadorVinculo.toLowerCase())
  );

  const criaturaSeleccionadaDetalle = colaIniciativa.find((c) => c.id === idCriaturaDetalle);
  const plantillaDeDetalle = criaturaSeleccionadaDetalle ? obtenerPlantillaAsociada(criaturaSeleccionadaDetalle) : null;

  return (
    <div style={estilos.contenedorGestor}>
      {/* SECCIÓN 0: IMPORTACIÓN NATIVA DE TALESPIRE DETECTADA */}
      {criaturasSeleccionadas && criaturasSeleccionadas.length > 0 && (
        <div style={estilos.cajaImportacionTaleSpire}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Activity size={14} style={{ color: "var(--color-borde-cian)" }} />
            <span style={estilos.textoImportacionTaleSpire}>
              SELECCIÓN DETECTADA EN MESA: <strong>{criaturasSeleccionadas.length}</strong> {criaturasSeleccionadas.length === 1 ? "CRIATURA" : "CRIATURAS"}
            </span>
          </div>
          <button
            onClick={agregarCriaturasSeleccionadasAIniciativa}
            style={estilos.botonImportarSeleccionados}
            title="Importar las criaturas seleccionadas en TaleSpire al combat tracker con HP por dados e iniciativa al azar"
          >
            📥 AÑADIR A LA INICIATIVA
          </button>
        </div>
      )}

      {colaIniciativa.length === 0 ? (
        <div style={estilos.estadoVacio}>
          <div style={estilos.cajaVacia}>
            <Activity size={36} style={{ color: "var(--color-borde-cian)", marginBottom: "8px" }} />
            <span style={estilos.textoVacioTitulo}>COLA DE INICIATIVA VACÍA</span>
            <span style={estilos.textoVacioSub}>
              Selecciona criaturas físicas en la mesa de TaleSpire y pulsa "Añadir a la Iniciativa" o búscalas arriba.
            </span>
          </div>
        </div>
      ) : (
        <div style={estilos.panelIniciativaDividido}>
          {/* SECCIÓN SUPERIOR: COMBAT TRACKER */}
          <div style={estilos.seccionTrackerScroll}>
            <div style={estilos.listaTarjetasIniciativa}>
              {colaIniciativa.map((criatura, indice) => {
                const esTurnoActivo = indice === indiceTurnoActivo;
                const plantilla = obtenerPlantillaAsociada(criatura);
                const estaMuerto = criatura.vidaActual === 0;

                const colorNombre = esTurnoActivo ? "var(--color-borde-cian)" : "var(--color-texto-principal)";
                const colorBorde = esTurnoActivo ? "1px solid var(--color-borde-cian)" : "1px solid var(--color-borde-brutal)";
                const fondoTarjeta = esTurnoActivo 
                  ? "linear-gradient(90deg, hsl(172, 90%, 4%) 0%, hsl(222, 18%, 11%) 100%)" 
                  : "var(--color-fondo-tarjeta)";

                return (
                  <div
                    key={criatura.id}
                    style={{
                      ...estilos.tarjetaCriaturaBrutal,
                      border: colorBorde,
                      background: fondoTarjeta,
                      opacity: estaMuerto ? 0.55 : 1
                    }}
                  >
                    {/* Barra de Color Estática Lateral */}
                    <div
                      style={{
                        ...estilos.barraLateralRol,
                        backgroundColor: criatura.esMonstruo ? "#7b2cbf" : "var(--color-borde-cian)"
                      }}
                      title={criatura.esMonstruo ? "Monstruo / Enemigo" : "Jugador / Aliado"}
                    />

                    {/* Caja de Iniciativa */}
                    <div 
                      onClick={() => lanzarDadosTaleSpire(
                        `!Iniciativa:1d20${(criatura.bonificadorIniciativa ?? 0) >= 0 ? "+" : ""}${criatura.bonificadorIniciativa ?? 0}`, 
                        `Iniciativa (${criatura.nombre})`,
                        { tipo: "iniciativa", criaturaId: criatura.id }
                      )}
                      style={{
                        ...estilos.bloqueIniciativaIzquierda,
                        borderColor: esTurnoActivo ? "var(--color-borde-cian)" : "var(--color-borde-brutal)",
                        backgroundColor: esTurnoActivo ? "rgba(0, 245, 212, 0.05)" : "hsl(222, 25%, 5%)",
                        cursor: "pointer"
                      }}
                      title="Lanzar iniciativa física en TaleSpire (1d20 + bono)"
                    >
                      <span style={estilos.etiquetaInicMini}>INIC</span>
                      <span style={{
                        ...estilos.valorInicGigante,
                        color: esTurnoActivo ? "var(--color-borde-cian)" : "#ffcc00"
                      }}>{criatura.iniciativa}</span>
                    </div>

                    {/* Cuerpo central */}
                    <div style={estilos.cuerpoTarjetaCentral}>
                      <div style={estilos.cabeceraFilaInfo}>
                        <div
                          style={{
                            ...estilos.avatarRedondeado,
                            backgroundColor: criatura.esMonstruo ? "rgba(123, 44, 191, 0.15)" : "rgba(0, 245, 212, 0.1)",
                            borderColor: criatura.esMonstruo ? "#7b2cbf" : "var(--color-borde-cian)"
                          }}
                        >
                          {criatura.esMonstruo ? (
                            <Skull size={13} style={{ color: "#a29bfe" }} />
                          ) : (
                            <Shield size={13} style={{ color: "var(--color-borde-cian)" }} />
                          )}
                        </div>

                        <div style={estilos.cajaNombres}>
                          <span
                            onClick={() => {
                              setIdCriaturaDetalle(criatura.id);
                              setFiltroBuscadorVinculo("");
                              setMostrarListaVinculos(false);
                            }}
                            style={{
                              ...estilos.nombreCriaturaLink,
                              color: colorNombre,
                              textDecoration: estaMuerto ? "line-through" : "none",
                              fontWeight: esTurnoActivo ? "800" : "700"
                            }}
                            title="Ver bloque de estadísticas de 5.5e"
                          >
                            {criatura.nombre}
                            {esTurnoActivo && <span style={estilos.tagTurnoActivo}>ACTIVO</span>}
                          </span>
                          <span style={estilos.subtituloCriatura}>
                            CA: <strong style={{ color: "var(--color-borde-cian)", fontFamily: "var(--fuente-codigo)" }}>{criatura.ca}</strong> | Vel: {criatura.velocidad}
                            {plantilla && (
                              <> | PP: <strong style={{ color: "#ffcc00", fontFamily: "var(--fuente-codigo)" }}>{obtenerPercepcionPasiva(plantilla)}</strong></>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                lanzarTiradaD20Interactiva(criatura.nombre, "Tirada d20", criatura.bonificadorIniciativa || 0);
                              }}
                              style={{
                                marginLeft: "8px",
                                padding: "0 4px",
                                height: "16px",
                                backgroundColor: "hsl(222, 18%, 15%)",
                                border: "1px solid var(--color-borde-brutal)",
                                color: "#ff7675",
                                fontSize: "9px",
                                fontWeight: "bold",
                                cursor: "pointer",
                                borderRadius: "2px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "2px",
                                fontFamily: "var(--fuente-codigo)",
                                transition: "none"
                              }}
                              title="Tirar d20 físico + Modificador de Iniciativa en TaleSpire"
                            >
                              🎲 d20
                            </button>
                          </span>
                        </div>
                      </div>

                      {/* Chips de Condiciones */}
                      <div style={{ ...estilos.filaCondicionesChips, flexWrap: "wrap", alignItems: "center", gap: "4px" }}>
                        {criatura.condiciones.length > 0 ? (
                          criatura.condiciones.map((cond) => {
                            const esAlerta = ["muerto", "inconsciente", "aturdido", "paralizado"].includes(cond.toLowerCase());
                            const condObj = CONDICIONES_2024.find(
                              (c) => c.nombre.toLowerCase().includes(cond.toLowerCase()) || cond.toLowerCase().includes(c.nombre.split(" ")[0].toLowerCase())
                            );
                            const tooltipTexto = condObj 
                              ? `${condObj.nombre}\n\n${condObj.efectos.map(e => `• ${e}`).join("\n")}`
                              : cond;
                            return (
                              <div 
                                key={cond} 
                                className="chip-condicion-chico-tooltip"
                                style={{
                                  ...estilos.chipCondicionChico,
                                  backgroundColor: esAlerta ? "rgba(242, 92, 84, 0.08)" : "rgba(0, 245, 212, 0.05)",
                                  borderColor: esAlerta ? "var(--color-peligro)" : "var(--color-borde-cian)",
                                  color: esAlerta ? "var(--color-peligro)" : "var(--color-borde-cian)",
                                  display: "inline-flex",
                                  alignItems: "center"
                                }}
                              >
                                <span>{cond}</span>
                                <span className="tooltip-contenido">{tooltipTexto}</span>
                                <button
                                  onClick={() => quitarCondicionDeCriatura(criatura.id, cond)}
                                  style={{
                                    ...estilos.botonQuitarCondicionChico,
                                    color: esAlerta ? "var(--color-peligro)" : "var(--color-borde-cian)"
                                  }}
                                >
                                  <X size={9} />
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          <span style={estilos.textoCondicionesVacias}>Sin condiciones activas</span>
                        )}

                        {/* Mini Selector Directo para añadir condiciones a ESTA criatura específica */}
                        <select
                          value=""
                          onChange={(e) => {
                            const condVal = e.target.value;
                            if (condVal) {
                              agregarCondicionACriatura(criatura.id, condVal);
                            }
                          }}
                          style={{
                            height: "18px",
                            backgroundColor: "var(--color-fondo-profundo)",
                            border: "1px solid var(--color-borde-brutal)",
                            color: "var(--color-texto-secundario)",
                            fontSize: "9px",
                            borderRadius: "2px",
                            padding: "0 4px",
                            cursor: "pointer",
                            width: "auto",
                            maxWidth: "90px"
                          }}
                          title="Agregar condición a esta criatura"
                        >
                          <option value="">+ Condición</option>
                          {CONDICIONES_2024.map((c) => {
                            const nombreLimpio = c.nombre.split(" (")[0];
                            return (
                              <option key={c.nombre} value={nombreLimpio}>
                                {nombreLimpio}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    {/* Acciones Rápidas */}
                    <div style={estilos.cajaAccionesRapidasColumn}>
                      {plantilla && plantilla.accionesRapidas && plantilla.accionesRapidas.length > 0 ? (
                        <div style={estilos.contenedorAccionesRapidasBotones}>
                          {plantilla.accionesRapidas.slice(0, 2).map((acc, index) => (
                            <button
                              key={index}
                              onClick={() => lanzarAtaqueRapido(criatura.nombre, acc.nombre, acc.bonificadorAtaque, acc.dadosDaño, acc.tipoDaño)}
                              style={estilos.botonAccionRapidaMedieval}
                              title={`Tirar ataque 3D: d20${acc.bonificadorAtaque} | Daño: ${acc.dadosDaño}`}
                            >
                              <Swords size={10} style={{ color: "var(--color-peligro)" }} />
                              <span>{acc.nombre} ({acc.bonificadorAtaque})</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div style={estilos.sinAccionesAviso}>
                          {criatura.esMonstruo ? "Sin ataques rápidos cargados" : "Ficha de Jugador"}
                        </div>
                      )}
                    </div>

                    {/* Salud e Inputs de Alta Densidad */}
                    <div style={estilos.cajaControlesSaludTarjetas}>
                      <div style={estilos.filaHPArea}>
                        <Heart size={12} fill={estaMuerto ? "none" : "var(--color-peligro)"} style={{ color: "var(--color-peligro)" }} />
                        <span style={estilos.hpGiganteTexto}>
                          {criatura.vidaActual} <span style={{ color: "var(--color-texto-apagado)", fontSize: "10px" }}>/ {criatura.vidaMaxima}</span>
                        </span>
                        {criatura.vidaTemporal && criatura.vidaTemporal > 0 ? (
                          <span style={estilos.tagHPTemporal}>+{criatura.vidaTemporal}</span>
                        ) : null}
                      </div>

                      <div style={estilos.inputsSaludFila}>
                        {/* Control HP Vertical Curar/Dañar */}
                        <div style={estilos.controlHPVertical}>
                          <button
                            onClick={() => aplicarCuracion(criatura.id, criatura.vidaActual, criatura.vidaMaxima)}
                            style={estilos.botonCurarVertical}
                            title="Aplicar Curación"
                          >
                            CURAR
                          </button>
                          <input
                            type="number"
                            placeholder="0"
                            min="0"
                            value={valoresInputHP[criatura.id] || ""}
                            onChange={(e) => setValoresInputHP({ ...valoresInputHP, [criatura.id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                // Por defecto, si presiona Enter en este input sin hacer click, asumimos Daño (que es lo más común en combate)
                                aplicarDaño(criatura.id, criatura.vidaActual, criatura.vidaTemporal || 0);
                              }
                            }}
                            style={estilos.inputHPVertical}
                          />
                          <button
                            onClick={() => aplicarDaño(criatura.id, criatura.vidaActual, criatura.vidaTemporal || 0)}
                            style={estilos.botonDañoVertical}
                            title="Aplicar Daño"
                          >
                            DAÑO
                          </button>
                        </div>

                        {/* Control Temp HP Vertical */}
                        <div style={estilos.cajaTempVertical}>
                          <span style={estilos.etiquetaTempVertical}>TEMP</span>
                          <input
                            type="number"
                            placeholder="0"
                            min="0"
                            value={criatura.vidaTemporal || ""}
                            onChange={(e) => actualizarVidaTemporal(criatura.id, parseInt(e.target.value, 10) || 0)}
                            style={estilos.inputTempVertical}
                            title="Vida Temporal"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Botón de Quitar */}
                    <button
                      onClick={() => {
                        if (idCriaturaDetalle === criatura.id) {
                          setIdCriaturaDetalle(null);
                        }
                        quitarCriaturaDeIniciativa(criatura.id);
                      }}
                      style={estilos.botonEliminarDeCola}
                      title="Eliminar de la iniciativa"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECCIÓN INFERIOR: BLOQUE DE ESTADÍSTICAS PREMIUM */}
          {criaturaSeleccionadaDetalle && (
            <div style={estilos.panelDetalleInferior}>
              <div style={estilos.cabeceraDetalleFicha}>
                <div style={estilos.tituloFichaIzquierda}>
                  <FileText size={13} style={{ color: "var(--color-borde-cian)" }} />
                  <span style={estilos.nombreFichaCabecera}>
                    BLOQUE DE REFERENCIA: {criaturaSeleccionadaDetalle.nombre.toUpperCase()}
                  </span>
                  {plantillaDeDetalle && (
                    <span style={estilos.subFichaAsociada}>
                      [ {plantillaDeDetalle.nombre.toUpperCase()} ]
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIdCriaturaDetalle(null)}
                  style={estilos.botonCerrarDetalle}
                >
                  <X size={14} />
                </button>
              </div>

              <div style={estilos.cuerpoDetalleScroll}>
                {!plantillaDeDetalle ? (
                  <div style={estilos.cajaVinculacionManual}>
                    <div style={estilos.alertaVinculoInfo}>
                      <Link size={20} style={{ color: "var(--color-borde-cian)", marginBottom: "4px" }} />
                      <span style={estilos.tituloAlertaVinculo}>SISTEMA DE ASOCIACIÓN DE FICHA</span>
                      <span style={estilos.descAlertaVinculo}>
                        Esta criatura física no cuenta con un bloque de estadísticas de D&D 5.5e cargado. Asóciala ahora con un monstruo del manual para habilitar tiradas y visualización en tiempo real.
                      </span>
                    </div>

                    <div style={estilos.buscadorVincularArea}>
                      <div style={estilos.barraBuscadoraVinc}>
                        <Search size={13} style={{ color: "var(--color-texto-secundario)", marginLeft: "8px" }} />
                        <input
                          type="text"
                          value={filtroBuscadorVinculo}
                          onChange={(e) => {
                            setFiltroBuscadorVinculo(e.target.value);
                            setMostrarListaVinculos(true);
                          }}
                          onFocus={() => setMostrarListaVinculos(true)}
                          placeholder="Buscar en el manual (Orco, Goblin, etc...)"
                          style={estilos.inputBuscadorVinculo}
                        />
                        {filtroBuscadorVinculo && (
                          <button
                            onClick={() => {
                              setFiltroBuscadorVinculo("");
                              setMostrarListaVinculos(false);
                            }}
                            style={estilos.botonLimpiarVinculo}
                          >
                            <X size={11} />
                          </button>
                        )}
                      </div>

                      {mostrarListaVinculos && (
                        <div style={estilos.listaFlotanteVinculos}>
                          {plantillasFiltradas.length === 0 ? (
                            <div style={estilos.itemVinculoVacio}>No se encontraron monstruos.</div>
                          ) : (
                            plantillasFiltradas.slice(0, 6).map((plant) => (
                              <div
                                key={plant.id}
                                onClick={() => {
                                  asociarPlantillaACriatura(criaturaSeleccionadaDetalle.id, plant.id);
                                  setMostrarListaVinculos(false);
                                  setFiltroBuscadorVinculo("");
                                }}
                                style={estilos.itemVinculoOpcion}
                              >
                                <div>
                                  <strong style={{ color: "var(--color-texto-principal)" }}>{plant.nombre}</strong>
                                  <span style={{ fontSize: "9.5px", color: "var(--color-texto-secundario)", marginLeft: "6px" }}>
                                    {plant.tipo} | CR: {plant.desafio || "—"}
                                  </span>
                                </div>
                                <Check size={13} style={{ color: "var(--color-borde-cian)" }} />
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* VISTA PREMIUM DE FICHA COMPLETA CON DADOS INTERACTIVOS EN TEXTO */
                  <div style={estilos.cajaFichaEstadisticasDnd}>
                    <div style={estilos.seccionesFichaLayout}>
                      {/* Cabecera del Monstruo */}
                      <div style={estilos.tituloCabeceraDetalle}>
                        <span style={estilos.nombreMonstruoFicha}>{plantillaDeDetalle.nombre.toUpperCase()}</span>
                        <span style={estilos.tipoMonstruoFicha}>
                          {plantillaDeDetalle.tipo} | CR: <strong style={{ color: "var(--color-advertencia)" }}>{plantillaDeDetalle.desafio}</strong> | PP: <strong style={{ color: "var(--color-borde-cian)" }}>{obtenerPercepcionPasiva(plantillaDeDetalle)}</strong>
                        </span>
                      </div>

                      {/* Rejilla de Características */}
                      <div style={estilos.cajaAtributosGrid}>
                        {Object.entries(plantillaDeDetalle.caracteristicas).map(([clave, valor]) => {
                          const modStr = calcularModificador(valor);
                          const etiqueta = clave.substring(0, 3).toUpperCase();
                          return (
                            <div
                              key={clave}
                              onClick={() => lanzarTiradaD20Interactiva(criaturaSeleccionadaDetalle.nombre, etiqueta, parseInt(modStr, 10))}
                              style={estilos.cajaAtributoPurple}
                              title={`Tirar tirada 3D de salvación/prueba de ${clave.toUpperCase()}`}
                            >
                              <span style={estilos.atributoEtiquetaName}>{etiqueta}</span>
                              <span style={estilos.atributoValorNum}>{valor}</span>
                              <span style={estilos.atributoModSign}>{modStr}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Datos Básicos y Defensas */}
                      <div style={estilos.cajaMetadatosFichaExtra}>
                        <div style={estilos.lineaMetaFicha}>
                          <strong style={{ color: "var(--color-texto-secundario)" }}>ARMADURA (CA):</strong> <strong style={{ color: "var(--color-borde-cian)" }}>{plantillaDeDetalle.ca}</strong> {plantillaDeDetalle.caNotas ? `(${plantillaDeDetalle.caNotas})` : ""}
                        </div>
                        <div style={estilos.lineaMetaFicha}>
                          <strong style={{ color: "var(--color-texto-secundario)" }}>VELOCIDAD:</strong> {plantillaDeDetalle.velocidad}
                        </div>
                        {plantillaDeDetalle.sentidos && (
                          <div style={estilos.lineaMetaFicha}>
                            <strong style={{ color: "var(--color-texto-secundario)" }}>SENTIDOS:</strong> {plantillaDeDetalle.sentidos}
                          </div>
                        )}
                        {plantillaDeDetalle.idiomas && (
                          <div style={estilos.lineaMetaFicha}>
                            <strong style={{ color: "var(--color-texto-secundario)" }}>IDIOMAS:</strong> {plantillaDeDetalle.idiomas}
                          </div>
                        )}
                        {plantillaDeDetalle.resistencias && String(plantillaDeDetalle.resistencias).trim() !== "" && (
                          <div style={estilos.lineaMetaFicha}>
                            <strong style={{ color: "var(--color-exito)" }}>RESISTENCIAS:</strong> {plantillaDeDetalle.resistencias}
                          </div>
                        )}
                      </div>

                      {/* Rasgos Pasivos */}
                      {plantillaDeDetalle.rasgos && plantillaDeDetalle.rasgos.length > 0 && (
                        <div style={estilos.cajaListaRasgosFicha}>
                          <div style={estilos.subtituloFichaSection}>RASGOS PASIVOS</div>
                          {plantillaDeDetalle.rasgos.map((rasgo, i) => (
                            <div key={i} style={estilos.itemRasgoFichaTexto}>
                              <strong style={{ color: "#ffcc00" }}>{rasgo.nombre}:</strong> {renderizarTextoConHechizosYDados(rasgo.descripcion, `${criaturaSeleccionadaDetalle.nombre} - ${rasgo.nombre}`, setHechizoFlotanteDetalle)}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Acciones */}
                      {plantillaDeDetalle.acciones && plantillaDeDetalle.acciones.length > 0 && (
                        <div style={estilos.cajaListaAccionesFicha}>
                          <div style={estilos.subtituloFichaSection}>ACCIONES</div>
                          {plantillaDeDetalle.acciones.map((acc, i) => {
                            const esAtaque = acc.bonificadorAtaque !== undefined && acc.daño !== undefined;
                            return (
                              <div key={i} style={estilos.tarjetaAccionPurple}>
                                <div style={estilos.cabeceraAccionTarjeta}>
                                  <span style={estilos.nombreAccionTarjeta}>{acc.nombre.toUpperCase()}</span>
                                  {esAtaque && (
                                    <button
                                      onClick={() => lanzarAtaqueRapido(criaturaSeleccionadaDetalle.nombre, acc.nombre, `${(acc.bonificadorAtaque ?? 0) >= 0 ? "+" : ""}${acc.bonificadorAtaque ?? 0}`, acc.daño || "1d6", "físico")}
                                      style={estilos.botonAccionAtaqueLanzar}
                                    >
                                      <Swords size={10} />
                                      <span>TIRAR 3D</span>
                                    </button>
                                  )}
                                </div>
                                <div style={estilos.descAccionTarjeta}>
                                  {renderizarTextoConHechizosYDados(acc.descripcion, `${criaturaSeleccionadaDetalle.nombre} - ${acc.nombre}`, setHechizoFlotanteDetalle)}
                                  {esAtaque && (
                                    <span style={estilos.detallesAtaqueMetaInline}>
                                      [ +{acc.bonificadorAtaque} Al Impacto | Daño: {acc.daño} ]
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Reacciones */}
                      {plantillaDeDetalle.reacciones && plantillaDeDetalle.reacciones.length > 0 && (
                        <div style={estilos.cajaListaAccionesFicha}>
                          <div style={{ ...estilos.subtituloFichaSection, color: "#a6e3a1", borderColor: "rgba(166, 227, 161, 0.3)" }}>REACCIONES</div>
                          {plantillaDeDetalle.reacciones.map((reac, i) => (
                            <div key={i} style={estilos.tarjetaAccionPurple}>
                              <div style={estilos.cabeceraAccionTarjeta}>
                                <span style={{ ...estilos.nombreAccionTarjeta, color: "#a6e3a1" }}>{reac.nombre.toUpperCase()}</span>
                              </div>
                              <div style={estilos.descAccionTarjeta}>
                                {renderizarTextoConHechizosYDados(reac.descripcion, `${criaturaSeleccionadaDetalle.nombre} - ${reac.nombre}`, setHechizoFlotanteDetalle)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Acciones Legendarias */}
                      {plantillaDeDetalle.accionesLegendarias && plantillaDeDetalle.accionesLegendarias.length > 0 && (
                        <div style={estilos.cajaListaAccionesFicha}>
                          <div style={{ ...estilos.subtituloFichaSection, color: "#f38ba8", borderColor: "rgba(243, 139, 168, 0.3)" }}>ACCIONES LEGENDARIAS</div>
                          {plantillaDeDetalle.accionesLegendarias.map((leg, i) => (
                            <div key={i} style={estilos.tarjetaAccionPurple}>
                              <div style={estilos.cabeceraAccionTarjeta}>
                                <span style={{ ...estilos.nombreAccionTarjeta, color: "#f38ba8" }}>{leg.nombre.toUpperCase()}</span>
                              </div>
                              <div style={estilos.descAccionTarjeta}>
                                {renderizarTextoConHechizosYDados(leg.descripcion, `${criaturaSeleccionadaDetalle.nombre} - ${leg.nombre}`, setHechizoFlotanteDetalle)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal flotante e independiente con el detalle del hechizo seleccionado desde la ficha */}
      {hechizoFlotanteDetalle && (
        <ModalDetalleHechizo
          hechizo={hechizoFlotanteDetalle}
          onClose={() => setHechizoFlotanteDetalle(null)}
        />
      )}
    </div>
  );
};

const estilos: { [key: string]: React.CSSProperties } = {
  contenedorGestor: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    height: "100%",
    width: "100%",
    backgroundColor: "var(--color-fondo-profundo)",
    overflow: "hidden"
  },
  cajaImportacionTaleSpire: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "hsl(222, 20%, 9%)",
    borderBottom: "1.5px solid var(--color-borde-cian)",
    padding: "4px 8px",
    gap: "6px",
    flexShrink: 0
  },
  textoImportacionTaleSpire: {
    fontSize: "9.5px",
    color: "var(--color-texto-principal)",
    fontFamily: "var(--fuente-codigo)",
    textTransform: "uppercase"
  },
  botonImportarSeleccionados: {
    height: "22px",
    backgroundColor: "var(--color-primario)",
    color: "#ffffff",
    borderColor: "var(--color-borde-neon)",
    fontSize: "9.5px",
    fontWeight: "bold",
    cursor: "pointer",
    padding: "0 8px",
    display: "flex",
    alignItems: "center",
    gap: "3px",
    transition: "none"
  },
  estadoVacio: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
    padding: "20px"
  },
  cajaVacia: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    maxWidth: "340px",
    textAlign: "center",
    border: "1px dashed var(--color-borde-brutal)",
    padding: "16px",
    backgroundColor: "var(--color-fondo-panel)",
    borderRadius: "4px"
  },
  textoVacioTitulo: {
    fontSize: "11px",
    fontWeight: "bold",
    color: "var(--color-texto-principal)",
    letterSpacing: "0.1em",
    marginBottom: "4px",
    fontFamily: "var(--fuente-codigo)"
  },
  textoVacioSub: {
    fontSize: "10px",
    color: "var(--color-texto-secundario)",
    lineHeight: "1.3"
  },
  panelIniciativaDividido: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    position: "relative",
    flexGrow: 1,
    minHeight: "0"
  },
  seccionTrackerScroll: {
    flexGrow: 1,
    overflowY: "auto",
    padding: "4px",
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  listaTarjetasIniciativa: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  tarjetaCriaturaBrutal: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "10px",
    padding: "8px 12px",
    borderRadius: "4px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
    position: "relative",
    overflow: "visible"
  },
  barraLateralRol: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "3px",
    flexShrink: 0,
    borderTopLeftRadius: "4px",
    borderBottomLeftRadius: "4px"
  },
  bloqueIniciativaIzquierda: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid var(--color-borde-brutal)",
    borderRadius: "4px",
    width: "38px",
    height: "38px",
    flexShrink: 0,
    marginLeft: "2px"
  },
  etiquetaInicMini: {
    fontSize: "9px",
    fontWeight: "bold",
    color: "var(--color-texto-apagado)",
    letterSpacing: "0.02em",
    lineHeight: "1"
  },
  valorInicGigante: {
    fontSize: "18px",
    fontWeight: "800",
    fontFamily: "var(--fuente-codigo)",
    lineHeight: "1.1"
  },
  cuerpoTarjetaCentral: {
    display: "flex",
    flexDirection: "column",
    flex: 2,
    gap: "2px",
    minWidth: "120px"
  },
  cabeceraFilaInfo: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "5px"
  },
  avatarRedondeado: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    border: "1px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  cajaNombres: {
    display: "flex",
    flexDirection: "column"
  },
  nombreCriaturaLink: {
    fontSize: "13px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px"
  },
  tagTurnoActivo: {
    fontSize: "9.5px",
    backgroundColor: "rgba(0, 245, 212, 0.12)",
    border: "1px solid var(--color-borde-cian)",
    color: "var(--color-borde-cian)",
    padding: "1px 4px",
    borderRadius: "2px",
    textTransform: "uppercase",
    fontWeight: "800",
    fontFamily: "var(--fuente-codigo)",
    letterSpacing: "0.02em"
  },
  subtituloCriatura: {
    fontSize: "12px",
    color: "var(--color-texto-secundario)",
    lineHeight: "1.1"
  },
  filaCondicionesChips: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: "2px",
    alignItems: "center",
    marginTop: "1px"
  },
  textoCondicionesVacias: {
    fontSize: "12px",
    color: "var(--color-texto-apagado)",
    fontStyle: "italic"
  },
  chipCondicionChico: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "3px",
    fontSize: "11px",
    fontWeight: "700",
    padding: "2px 4px",
    borderRadius: "2px",
    textTransform: "capitalize",
    border: "1px solid"
  },
  botonQuitarCondicionChico: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    display: "flex",
    alignItems: "center"
  },
  cajaAccionesRapidasColumn: {
    display: "flex",
    flexDirection: "column",
    flex: 1.5,
    minWidth: "120px",
    justifyContent: "center"
  },
  contenedorAccionesRapidasBotones: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: "2px"
  },
  botonAccionRapidaMedieval: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "4px",
    fontSize: "12px",
    padding: "4px 8px",
    backgroundColor: "hsl(222, 18%, 12%)",
    border: "1px solid var(--color-borde-brutal)",
    color: "var(--color-texto-principal)",
    fontWeight: "700",
    cursor: "pointer",
    borderRadius: "2px",
    transition: "none"
  },
  sinAccionesAviso: {
    fontSize: "12px",
    color: "var(--color-texto-apagado)",
    fontStyle: "italic"
  },
  cajaControlesSaludTarjetas: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "4px",
    width: "140px",
    flexShrink: 0
  },
  filaHPArea: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "3px"
  },
  hpGiganteTexto: {
    fontSize: "15px",
    fontWeight: "bold",
    color: "var(--color-texto-principal)",
    fontFamily: "var(--fuente-codigo)"
  },
  tagHPTemporal: {
    fontSize: "11px",
    backgroundColor: "rgba(0, 245, 212, 0.1)",
    border: "1px solid var(--color-borde-cian)",
    color: "var(--color-borde-cian)",
    padding: "1px 4px",
    borderRadius: "2px",
    fontWeight: "bold"
  },
  inputsSaludFila: {
    display: "flex",
    flexDirection: "row",
    gap: "4px"
  },
  controlHPVertical: {
    display: "flex",
    flexDirection: "column",
    border: "1px solid var(--color-borde-brutal)",
    borderRadius: "4px",
    overflow: "hidden",
    backgroundColor: "var(--color-fondo-profundo)",
    width: "56px"
  },
  botonCurarVertical: {
    height: "18px",
    fontSize: "9px",
    fontWeight: "bold",
    backgroundColor: "rgba(0, 245, 212, 0.15)",
    border: "none",
    borderBottom: "1px solid var(--color-borde-brutal)",
    color: "var(--color-borde-cian)",
    cursor: "pointer",
    textAlign: "center",
    padding: 0,
    transition: "none",
    userSelect: "none"
  },
  inputHPVertical: {
    height: "22px",
    fontSize: "12px",
    textAlign: "center",
    backgroundColor: "transparent",
    border: "none",
    color: "#ffffff",
    outline: "none",
    fontFamily: "var(--fuente-codigo)",
    width: "100%",
    padding: 0
  },
  botonDañoVertical: {
    height: "18px",
    fontSize: "9px",
    fontWeight: "bold",
    backgroundColor: "rgba(242, 92, 84, 0.15)",
    border: "none",
    borderTop: "1px solid var(--color-borde-brutal)",
    color: "var(--color-peligro)",
    cursor: "pointer",
    textAlign: "center",
    padding: 0,
    transition: "none",
    userSelect: "none"
  },
  cajaTempVertical: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid var(--color-borde-brutal)",
    borderRadius: "4px",
    backgroundColor: "var(--color-fondo-profundo)",
    width: "48px",
    height: "58px"
  },
  etiquetaTempVertical: {
    fontSize: "8.5px",
    fontWeight: "bold",
    color: "var(--color-borde-cian)",
    borderBottom: "1px solid var(--color-borde-brutal)",
    width: "100%",
    textAlign: "center",
    padding: "1px 0",
    backgroundColor: "rgba(0, 245, 212, 0.03)"
  },
  inputTempVertical: {
    flexGrow: 1,
    width: "100%",
    fontSize: "12px",
    textAlign: "center",
    backgroundColor: "transparent",
    border: "none",
    color: "var(--color-borde-cian)",
    outline: "none",
    fontFamily: "var(--fuente-codigo)",
    padding: 0
  },
  botonEliminarDeCola: {
    background: "none",
    border: "none",
    color: "rgba(242, 92, 84, 0.55)",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "2px",
    display: "flex",
    alignItems: "center"
  },
  panelDetalleInferior: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    height: "82%",
    zIndex: 100,
    borderTop: "2px solid var(--color-borde-brutal)",
    backgroundColor: "var(--color-fondo-profundo)",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 -8px 20px rgba(0, 0, 0, 0.55)",
    borderTopLeftRadius: "6px",
    borderTopRightRadius: "6px"
  },
  cabeceraDetalleFicha: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "hsl(222, 18%, 10%)",
    borderBottom: "1.5px solid var(--color-borde-brutal)",
    padding: "4px 8px",
    height: "26px"
  },
  tituloFichaIzquierda: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "5px"
  },
  nombreFichaCabecera: {
    fontSize: "13px",
    fontWeight: "bold",
    color: "var(--color-texto-principal)",
    letterSpacing: "0.03em",
    fontFamily: "var(--fuente-titulo)"
  },
  subFichaAsociada: {
    fontSize: "11px",
    color: "var(--color-borde-cian)",
    marginLeft: "6px",
    fontFamily: "var(--fuente-codigo)"
  },
  botonCerrarDetalle: {
    background: "none",
    border: "none",
    color: "var(--color-texto-secundario)",
    cursor: "pointer",
    padding: "2px",
    display: "flex",
    alignItems: "center"
  },
  cuerpoDetalleScroll: {
    flexGrow: 1,
    overflowY: "auto",
    padding: "8px"
  },
  cajaVinculacionManual: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px 20px",
    textAlign: "center"
  },
  alertaVinculoInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    maxWidth: "400px",
    marginBottom: "8px"
  },
  tituloAlertaVinculo: {
    fontSize: "13px",
    fontWeight: "bold",
    color: "var(--color-texto-principal)",
    marginBottom: "4px"
  },
  descAlertaVinculo: {
    fontSize: "12px",
    color: "var(--color-texto-secundario)",
    lineHeight: "1.35"
  },
  buscadorVincularArea: {
    position: "relative",
    width: "100%",
    maxWidth: "320px"
  },
  barraBuscadoraVinc: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "var(--color-fondo-panel)",
    border: "1px solid var(--color-borde-brutal)",
    borderRadius: "2px",
    height: "26px",
    width: "100%"
  },
  inputBuscadorVinculo: {
    flexGrow: 1,
    background: "none",
    border: "none",
    fontSize: "12px",
    color: "var(--color-texto-principal)",
    outline: "none",
    padding: "0 4px"
  },
  botonLimpiarVinculo: {
    background: "none",
    border: "none",
    color: "var(--color-texto-secundario)",
    cursor: "pointer",
    marginRight: "4px"
  },
  listaFlotanteVinculos: {
    position: "absolute",
    top: "28px",
    left: 0,
    width: "100%",
    maxHeight: "120px",
    overflowY: "auto",
    backgroundColor: "var(--color-fondo-tarjeta)",
    border: "1.5px solid var(--color-borde-brutal)",
    zIndex: 999,
    boxShadow: "0 3px 8px rgba(0,0,0,0.5)"
  },
  itemVinculoOpcion: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 10px",
    borderBottom: "1px solid var(--color-borde-brutal)",
    cursor: "pointer",
    fontSize: "12px",
    textAlign: "left"
  },
  itemVinculoVacio: {
    padding: "8px",
    color: "var(--color-texto-apagado)",
    fontSize: "12px"
  },
  cajaFichaEstadisticasDnd: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  cajaDesvincularFicha: {
    display: "flex",
    justifyContent: "flex-end"
  },
  botonDesvincularManual: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "4px",
    fontSize: "12px",
    padding: "4px 8px",
    backgroundColor: "rgba(242, 92, 84, 0.08)",
    border: "1px solid rgba(242, 92, 84, 0.3)",
    color: "var(--color-peligro)",
    cursor: "pointer",
    borderRadius: "2px",
    fontWeight: "bold",
    transition: "none"
  },
  seccionesFichaLayout: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  columnaFichaBasicos: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  tituloCabeceraDetalle: {
    display: "flex",
    flexDirection: "column",
    borderBottom: "1px solid var(--color-borde-brutal)",
    paddingBottom: "3px"
  },
  nombreMonstruoFicha: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#ffcc00",
    fontFamily: "var(--fuente-codigo)",
    letterSpacing: "0.02em"
  },
  tipoMonstruoFicha: {
    fontSize: "12px",
    color: "var(--color-texto-secundario)",
    textTransform: "uppercase"
  },
  cajaAtributosGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: "3px"
  },
  cajaAtributoPurple: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "hsl(222, 18%, 12%)",
    border: "1.5px solid var(--color-borde-brutal)",
    borderRadius: "4px",
    padding: "3px 1px",
    cursor: "pointer",
    transition: "none"
  },
  atributoEtiquetaName: {
    fontSize: "11px",
    fontWeight: "bold",
    color: "#a29bfe",
    letterSpacing: "0.01em"
  },
  atributoValorNum: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "var(--color-texto-principal)"
  },
  atributoModSign: {
    fontSize: "13px",
    fontWeight: "800",
    color: "var(--color-borde-cian)"
  },
  cajaMetadatosFichaExtra: {
    backgroundColor: "hsl(222, 18%, 12%)",
    border: "1px solid var(--color-borde-brutal)",
    padding: "6px",
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    borderRadius: "4px"
  },
  lineaMetaFicha: {
    fontSize: "12px",
    color: "var(--color-texto-principal)",
    borderBottom: "1px dashed hsl(222, 15%, 15%)",
    paddingBottom: "4px"
  },
  seccionFichaAdicionales: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  subtituloFichaSection: {
    fontSize: "12px",
    fontWeight: "800",
    color: "var(--color-borde-cian)",
    letterSpacing: "0.04em",
    borderBottom: "1px solid var(--color-borde-brutal)",
    paddingBottom: "3px",
    marginTop: "6px",
    textTransform: "uppercase"
  },
  columnaFichaRasgosAcciones: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  cajaListaRasgosFicha: {
    display: "flex",
    flexDirection: "column",
    gap: "3px"
  },
  itemRasgoFichaTexto: {
    fontSize: "12px",
    lineHeight: "1.4",
    color: "var(--color-texto-secundario)",
    padding: "2px 0"
  },
  cajaListaAccionesFicha: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  tarjetaAccionPurple: {
    backgroundColor: "rgba(123, 44, 191, 0.03)",
    border: "1px solid rgba(123, 44, 191, 0.25)",
    padding: "4px 6px",
    borderRadius: "4px"
  },
  cabeceraAccionTarjeta: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  nombreAccionTarjeta: {
    fontSize: "13px",
    fontWeight: "bold",
    color: "#ffcc00",
    fontFamily: "var(--fuente-codigo)"
  },
  botonAccionAtaqueLanzar: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "3px",
    fontSize: "12px",
    padding: "4px 8px",
    backgroundColor: "rgba(123, 44, 191, 0.15)",
    border: "1px solid #7b2cbf",
    color: "#a29bfe",
    fontWeight: "bold",
    cursor: "pointer",
    borderRadius: "2px",
    transition: "none"
  },
  descAccionTarjeta: {
    fontSize: "12px",
    color: "var(--color-texto-secundario)",
    lineHeight: "1.4",
    marginTop: "3px"
  },
  detallesAtaqueMetaInline: {
    display: "block",
    fontSize: "12px",
    color: "var(--color-borde-cian)",
    marginTop: "4px",
    fontWeight: "bold"
  }
};
