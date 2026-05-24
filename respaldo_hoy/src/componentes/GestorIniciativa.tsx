import React, { useState } from "react";
import { usarAlmacenDM, CriaturaIniciativa } from "../almacen/usarAlmacenDM";
import { lanzarDadosTaleSpire, renderizarTextoConDadosInteractivos, detectarTipoDaño } from "../utiles/lanzadorDados";
import { MonstruoBase, CONDICIONES_2024 } from "../utiles/datosIniciales";
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
    quitarCriaturaDeIniciativa,
    modificarVidaCriaturaIniciativa,
    actualizarVidaTemporal,
    asociarPlantillaACriatura,
    quitarCondicionDeCriatura
  } = usarAlmacenDM();

  // Mapa de nombre de condición -> texto del tooltip para los chips de condición
  const condicionTooltip: Record<string, string> = Object.fromEntries(
    CONDICIONES_2024.map((c) => [
      c.nombre,
      `${c.nombre}\n${c.descripcion ? c.descripcion + "\n" : ""}Efectos:\n${c.efectos.map((e) => `• ${e}`).join("\n")}`
    ])
  );

  // Estados locales
  const [idCriaturaDetalle, setIdCriaturaDetalle] = useState<string | null>(null);
  const [filtroBuscadorVinculo, setFiltroBuscadorVinculo] = useState("");
  const [mostrarListaVinculos, setMostrarListaVinculos] = useState(false);
  const [modoMath, setModoMath] = useState<Record<string, "daño" | "cura">>({});

  // Buscar plantilla de estadísticas para una criatura
  const obtenerPlantillaAsociada = (criatura: CriaturaIniciativa): MonstruoBase | null => {
    if (criatura.idPlantillaAsociada) {
      return baseDatosMonstruos.find((m) => m.id === criatura.idPlantillaAsociada) || null;
    }
    // Fallback por nombre (case insensitive)
    return baseDatosMonstruos.find((m) => m.nombre.toLowerCase() === criatura.nombre.toLowerCase()) || null;
  };

  // Manejar el cambio de HP con el input Math y el modo toggle (daño/cura)
  const manejarMathHPConModo = (e: React.KeyboardEvent<HTMLInputElement>, id: string, actual: number, maximo: number, modo: "daño" | "cura") => {
    if (e.key === "Enter") {
      const input = e.currentTarget.value.trim();
      if (!input) return;

      const valor = parseInt(input, 10);
      if (isNaN(valor)) return;

      let nuevaVida = actual;
      if (modo === "daño") {
        nuevaVida = actual - valor;
      } else {
        nuevaVida = actual + valor;
      }

      // Limitar entre 0 y el máximo
      nuevaVida = Math.max(0, Math.min(maximo, nuevaVida));
      modificarVidaCriaturaIniciativa(id, nuevaVida);

      // Loguear en TaleSpire si está disponible
      if ((window as any).TS) {
        (window as any).TS.debug.log(`Math HP aplicado a criatura con ID ${id} (Modo ${modo}): ${actual} -> ${nuevaVida}`);
      }

      e.currentTarget.value = ""; // Limpiar input
    }
  };

  // Calcular modificador de característica de D&D 5.5e
  const calcularModificador = (valor: number): string => {
    const mod = Math.floor((valor - 10) / 2);
    return `${mod >= 0 ? "+" : ""}${mod}`;
  };

  // Extraer o calcular Percepción Pasiva
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

  // Simular y tirar dados para una acción rápida en la bandeja nativa de TaleSpire
  const lanzarAtaqueRapido = async (
    criaturaNombre: string,
    ataqueNombre: string,
    bonoAtaqueStr: string,
    dadosDaño: string,
    tipoDaño: string
  ) => {
    // 1. Limpiar y formatear el bono de ataque
    const bonoLimpio = bonoAtaqueStr.replace(/\s/g, "");
    const numeroBono = parseInt(bonoLimpio.replace(/[^\d-]/g, ""), 10) || 0;
    const signo = numeroBono >= 0 ? "+" : "";
    const bonoFormateado = `${signo}${numeroBono}`;

    // 2. Construir la fórmula combinada para la bandeja 3D de TaleSpire
    // Formato: !Ataque:1d20+bono / !Daño:dadosDaño
    let formula = `!${ataqueNombre}:1d20${bonoFormateado}`;
    if (dadosDaño && dadosDaño.trim() !== "" && dadosDaño.trim() !== "0") {
      let etiquetaDaño = "Daño";
      if (tipoDaño && tipoDaño.trim() !== "" && tipoDaño.trim().toLowerCase() !== "físico" && tipoDaño.trim().toLowerCase() !== "normal") {
        const dañoFormateado = tipoDaño.trim().charAt(0).toUpperCase() + tipoDaño.trim().slice(1);
        etiquetaDaño = `Daño ${dañoFormateado}`;
      } else {
        etiquetaDaño = "Daño Físico";
      }
      formula += `/!${etiquetaDaño}:${dadosDaño.trim()}`;
    }

    let etiqueta = `${ataqueNombre} (${criaturaNombre})`;
    if (tipoDaño && tipoDaño.trim() !== "" && tipoDaño.trim() !== "0") {
      etiqueta += ` - Daño: ${tipoDaño}`;
    }
    await lanzarDadosTaleSpire(formula, etiqueta);
  };

  // Tirar un d20 interactivo para un atributo, salvación o habilidad
  const lanzarTiradaD20Interactiva = async (
    criaturaNombre: string,
    etiqueta: string,
    bonificador: number
  ) => {
    const signo = bonificador >= 0 ? "+" : "";
    const formula = `!${etiqueta}:1d20${signo}${bonificador}`;
    const etiquetaTirada = `${etiqueta} (${criaturaNombre})`;
    await lanzarDadosTaleSpire(formula, etiquetaTirada);
  };

  // Buscar plantillas disponibles para vinculación manual
  const plantillasFiltradas = baseDatosMonstruos.filter((m) =>
    m.nombre.toLowerCase().includes(filtroBuscadorVinculo.toLowerCase())
  );

  const criaturaSeleccionadaDetalle = colaIniciativa.find((c) => c.id === idCriaturaDetalle);
  const plantillaDeDetalle = criaturaSeleccionadaDetalle ? obtenerPlantillaAsociada(criaturaSeleccionadaDetalle) : null;

  return (
    <div style={estilos.contenedorGestor}>
      {/* Inyección de estilos CSS premium encapsulados */}
      <style>{`
        /* --- ESTILOS PREMIUM GESTOR INICIATIVA --- */
        .tarjeta-premium {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 16px 6px 16px 16px;
          background: rgba(20, 22, 31, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          position: relative;
          overflow: visible;
        }

        .tarjeta-premium:hover {
          transform: translateY(-2px);
          background: rgba(26, 28, 41, 0.85);
          border-color: rgba(0, 245, 212, 0.3);
          box-shadow: 0 8px 30px rgba(0, 245, 212, 0.08);
        }

        .tarjeta-premium::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.02), transparent);
          pointer-events: none;
        }

        /* Indicador de turno activo premium con brillo - sin animaciones para mejor rendimiento */
        .tarjeta-premium-activa {
          background: rgba(255, 204, 0, 0.04);
          border: 1.5px solid rgba(255, 204, 0, 0.85);
          box-shadow: 0 0 25px rgba(255, 204, 0, 0.15), inset 0 0 12px rgba(255, 204, 0, 0.04);
        }

        .tarjeta-premium-muerta {
          opacity: 0.5;
          filter: grayscale(0.4);
          background: rgba(13, 14, 18, 0.5) !important;
          border-color: rgba(255, 255, 255, 0.02) !important;
          box-shadow: none !important;
          transform: none !important;
        }

        /* Botón Tirar Iniciativa Física */
        .badge-iniciativa-premium {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(20, 22, 31, 0.9) 0%, rgba(10, 11, 15, 0.95) 100%);
          border: 1px solid rgba(255, 204, 0, 0.35);
          border-radius: 12px;
          width: 48px;
          height: 48px;
          flex-shrink: 0;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          position: relative;
          overflow: hidden;
        }

        .badge-iniciativa-premium:hover {
          transform: scale(1.08) rotate(2deg);
          border-color: #ffcc00;
          box-shadow: 0 0 18px rgba(255, 204, 0, 0.4);
        }

        .badge-iniciativa-premium::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent, rgba(255, 204, 0, 0.15), transparent);
          transform: rotate(45deg);
          transition: all 0.7s ease;
        }

        .badge-iniciativa-premium:hover::before {
          left: 120%;
        }

        .badge-iniciativa-etiqueta {
          font-size: 7.5px;
          font-weight: 800;
          color: rgba(255, 204, 0, 0.65);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .badge-iniciativa-valor {
          font-size: 18px;
          font-weight: 800;
          color: #ffcc00;
          font-family: var(--fuente-codigo);
          line-height: 1.1;
          margin-top: 1px;
        }

        /* Nombre criatura */
        .nombre-criatura-link-premium {
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .nombre-criatura-link-premium:hover {
          filter: brightness(1.2);
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
        }

        .tag-turno-activo-premium {
          font-size: 8px;
          background: rgba(255, 204, 0, 0.12);
          border: 1px solid rgba(255, 204, 0, 0.5);
          color: #ffcc00;
          padding: 1px 5px;
          border-radius: 4px;
          text-transform: uppercase;
          font-weight: 800;
          letter-spacing: 0.05em;
          box-shadow: 0 0 10px rgba(255, 204, 0, 0.2);
        }

        /* Barra de Vida */
        .barra-vida-contenedor-premium {
          width: 100%;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 6px;
          height: 5px;
          margin-top: 5px;
          overflow: hidden;
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.02);
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.6);
        }

        .barra-vida-relleno-premium {
          height: 100%;
          border-radius: 6px;
          transition: width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
          position: relative;
        }

        /* Chips de Condiciones con tooltip CSS puro */
        .chip-condicion-premium {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 4px;
          background: rgba(0, 245, 212, 0.06);
          border: 1px solid rgba(0, 245, 212, 0.25);
          color: #00f5d4;
          font-size: 9px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 6px;
          text-transform: capitalize;
          transition: all 0.2s ease;
          position: relative;
          cursor: help;
        }

        /* Tooltip CSS puro - funciona sin title en iFrame */
        .chip-condicion-premium::before {
          content: attr(data-tooltip);
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          transform: none;
          background: rgba(10, 12, 20, 0.97);
          color: #e0e6f0;
          font-size: 10px;
          font-weight: 400;
          line-height: 1.45;
          padding: 6px 9px;
          border-radius: 7px;
          border: 1px solid rgba(0, 245, 212, 0.3);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
          white-space: pre-line;
          width: max-content;
          max-width: 220px;
          pointer-events: none;
          z-index: 9999;
          opacity: 0;
          transition: opacity 0.18s ease;
          text-transform: none;
          font-family: var(--fuente-principal);
          letter-spacing: 0;
        }

        /* Flecha del tooltip */
        .chip-condicion-premium::after {
          content: '';
          position: absolute;
          top: calc(100% + 1px);
          left: 8px;
          transform: none;
          border: 5px solid transparent;
          border-bottom-color: rgba(0, 245, 212, 0.3);
          pointer-events: none;
          z-index: 9999;
          opacity: 0;
          transition: opacity 0.18s ease;
        }

        .chip-condicion-premium:hover {
          background: rgba(0, 245, 212, 0.12);
          border-color: rgba(0, 245, 212, 0.55);
        }

        .chip-condicion-premium:hover::before,
        .chip-condicion-premium:hover::after {
          opacity: 1;
        }

        .boton-quitar-condicion-premium {
          background: none;
          border: none;
          color: rgba(0, 245, 212, 0.7);
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          transition: color 0.15s ease;
        }

        .boton-quitar-condicion-premium:hover {
          color: #ffffff;
        }

        .texto-condiciones-vacias-premium {
          font-size: 9px;
          color: var(--color-texto-apagado);
          font-style: italic;
        }

        /* Acciones Rápidas Medievales Premium */
        .boton-accion-rapida-premium {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 5px;
          font-size: 9.5px;
          padding: 3px 8px;
          background: rgba(123, 44, 191, 0.08);
          border: 1px solid rgba(123, 44, 191, 0.25);
          color: #ef4444;
          font-weight: 700;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        .boton-accion-rapida-premium:hover {
          background: rgba(123, 44, 191, 0.16);
          border-color: rgba(123, 44, 191, 0.6);
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(123, 44, 191, 0.15);
          color: #ff7675;
        }

        .sin-acciones-aviso-premium {
          font-size: 10px;
          color: var(--color-texto-apagado);
          font-style: italic;
        }

        /* Salud y Controles */
        .caja-controles-salud-premium {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 5px;
          width: 155px;
          flex-shrink: 0;
        }

        .hp-badge-premium {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 6px;
          padding: 2px 8px;
          background: rgba(239, 68, 68, 0.06);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .hp-badge-premium:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.45);
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.15);
        }

        .hp-texto-premium {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--color-texto-principal);
          font-family: var(--fuente-codigo);
        }

        .hp-max-texto-premium {
          color: var(--color-texto-apagado);
          font-size: 10px;
        }

        .hp-temporal-tag-premium {
          font-size: 8px;
          background: rgba(0, 245, 212, 0.12);
          border: 1px solid rgba(0, 245, 212, 0.45);
          color: #00f5d4;
          padding: 1px 4px;
          border-radius: 4px;
          font-weight: 800;
        }

        .math-btn-toggle {
          transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .math-btn-toggle:hover {
          transform: scale(1.1);
          filter: brightness(1.2);
        }

        .input-salud-math-premium {
          width: 36px;
          height: 22px;
          font-size: 11px;
          text-align: center;
          background: rgba(13, 14, 18, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #ffcc00;
          outline: none;
          border-radius: 6px;
          font-family: var(--fuente-codigo);
          transition: all 0.2s ease;
        }

        .input-salud-math-premium:focus {
          border-color: #ffcc00;
          box-shadow: 0 0 8px rgba(255, 204, 0, 0.25);
          background: rgba(13, 14, 18, 0.85);
        }

        .input-salud-temp-premium {
          width: 42px;
          height: 22px;
          font-size: 11px;
          text-align: center;
          background: rgba(13, 14, 18, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #00f5d4;
          outline: none;
          border-radius: 6px;
          font-family: var(--fuente-codigo);
          transition: all 0.2s ease;
        }

        .input-salud-temp-premium:focus {
          border-color: #00f5d4;
          box-shadow: 0 0 8px rgba(0, 245, 212, 0.25);
          background: rgba(13, 14, 18, 0.85);
        }

        /* --- Ficha de Detalle DnD Premium --- */
        .panel-detalle-premium {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 85%;
          z-index: 100;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(15, 17, 26, 0.95);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          display: flex;
          flex-direction: column;
          box-shadow: 0 -15px 40px rgba(0, 0, 0, 0.8);
          border-top-left-radius: 20px;
          border-top-right-radius: 20px;
          overflow: hidden;
        }

        .caja-atributo-purple-premium {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: linear-gradient(135deg, rgba(123, 44, 191, 0.08) 0%, rgba(123, 44, 191, 0.16) 100%);
          border: 1px solid rgba(123, 44, 191, 0.45);
          border-radius: 12px;
          padding: 6px 4px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        .caja-atributo-purple-premium:hover {
          transform: translateY(-3px);
          border-color: #00f5d4;
          box-shadow: 0 4px 15px rgba(0, 245, 212, 0.25);
          background: linear-gradient(135deg, rgba(123, 44, 191, 0.12) 0%, rgba(123, 44, 191, 0.24) 100%);
        }

        .boton-chip-tirada-premium {
          font-size: 9.5px;
          padding: 4px 8px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--color-texto-principal);
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.15s ease;
        }

        .boton-chip-tirada-premium:hover {
          background: rgba(0, 245, 212, 0.08);
          border-color: rgba(0, 245, 212, 0.4);
          color: #00f5d4;
          transform: translateY(-1px);
        }

        .tarjeta-accion-purple-premium {
          background: rgba(123, 44, 191, 0.03);
          border: 1px solid rgba(123, 44, 191, 0.18);
          padding: 8px 10px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        
        .tarjeta-accion-purple-premium:hover {
          background: rgba(123, 44, 191, 0.06);
          border-color: rgba(123, 44, 191, 0.35);
        }

        .boton-accion-ataque-lanzar-premium {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 4px;
          font-size: 9.5px;
          padding: 3px 8px;
          background: rgba(123, 44, 191, 0.15);
          border: 1px solid rgba(123, 44, 191, 0.5);
          color: #a29bfe;
          font-weight: bold;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .boton-accion-ataque-lanzar-premium:hover {
          background: rgba(123, 44, 191, 0.3);
          border-color: #a29bfe;
          color: #ffffff;
          box-shadow: 0 0 10px rgba(162, 155, 254, 0.3);
        }
      `}</style>

      {colaIniciativa.length === 0 ? (
        <div style={estilos.estadoVacio}>
          <div style={estilos.cajaVacia}>
            <Activity size={36} style={{ color: "var(--color-borde-cian)", marginBottom: "8px", animation: "pulse 2s infinite" }} />
            <span style={estilos.textoVacioTitulo}>COLA DE INICIATIVA VACÍA</span>
            <span style={estilos.textoVacioSub}>
              Busca y añade monstruos en el buscador superior para iniciar el combate interactivo de D&D 5.5e.
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
                const pctVida = Math.max(0, Math.min(100, (criatura.vidaActual / criatura.vidaMaxima) * 100));

                // Color dinámico según el turno
                const colorNombre = esTurnoActivo ? "#ffcc00" : "var(--color-texto-principal)";

                return (
                  <div
                    key={criatura.id}
                    className={`tarjeta-premium ${esTurnoActivo ? "tarjeta-premium-activa" : ""} ${estaMuerto ? "tarjeta-premium-muerta" : ""}`}
                  >
                    {/* Caja de Iniciativa a la izquierda */}
                    <div
                      onClick={() => lanzarDadosTaleSpire(
                        `!Iniciativa:1d20${(criatura.bonificadorIniciativa ?? 0) >= 0 ? "+" : ""}${criatura.bonificadorIniciativa ?? 0}`, 
                        `Iniciativa (${criatura.nombre})`,
                        { tipo: "iniciativa", criaturaId: criatura.id }
                      )}
                      className="badge-iniciativa-premium"
                      title="Lanzar iniciativa física en TaleSpire (1d20 + bono)"
                    >
                      <span className="badge-iniciativa-etiqueta">INIC</span>
                      <span className="badge-iniciativa-valor">{criatura.iniciativa}</span>
                    </div>

                    {/* Avatar e Información Principal */}
                    <div style={estilos.cuerpoTarjetaCentral}>
                      <div style={estilos.cabeceraFilaInfo}>
                        {/* Avatar */}
                        <div
                          style={{
                            ...estilos.avatarRedondeado,
                            backgroundColor: criatura.esMonstruo ? "rgba(123, 44, 191, 0.15)" : "rgba(0, 245, 212, 0.12)",
                            borderColor: criatura.esMonstruo ? "rgba(123, 44, 191, 0.5)" : "rgba(0, 245, 212, 0.4)"
                          }}
                        >
                          {criatura.esMonstruo ? (
                            <Skull size={11} style={{ color: "#a29bfe" }} />
                          ) : (
                            <Shield size={11} style={{ color: "var(--color-borde-cian)" }} />
                          )}
                        </div>

                        {/* Nombre y tipo */}
                        <div style={estilos.cajaNombres}>
                          <span
                            onClick={() => {
                              setIdCriaturaDetalle(criatura.id);
                              setFiltroBuscadorVinculo("");
                              setMostrarListaVinculos(false);
                            }}
                            className="nombre-criatura-link-premium"
                            style={{
                              color: colorNombre,
                              textDecoration: estaMuerto ? "line-through" : "none"
                            }}
                            title="Ver bloque de estadísticas de 5.5e"
                          >
                            {criatura.nombre}
                            {esTurnoActivo && <span className="tag-turno-activo-premium">Turno Activo</span>}
                          </span>
                          <span style={estilos.subtituloCriatura}>
                            CA: <strong style={{ color: "#00f5d4" }}>{criatura.ca}</strong> | Vel: {criatura.velocidad}
                            {plantilla && (
                              <> | Perc. Pasiva: <strong style={{ color: "#ffcc00" }}>{obtenerPercepcionPasiva(plantilla)}</strong></>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Barra de vida premium */}
                      <div className="barra-vida-contenedor-premium" title={`Vida: ${criatura.vidaActual}/${criatura.vidaMaxima} (${Math.round(pctVida)}%)`}>
                        <div 
                          className="barra-vida-relleno-premium"
                          style={{
                            width: `${pctVida}%`,
                            background: pctVida > 50 
                              ? "linear-gradient(90deg, #10b981 0%, #059669 100%)" 
                              : pctVida > 20 
                                ? "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)" 
                                : "linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)",
                            boxShadow: pctVida > 50
                              ? "0 0 10px rgba(16, 185, 129, 0.4)"
                              : pctVida > 20
                                ? "0 0 10px rgba(245, 158, 11, 0.4)"
                                : "0 0 10px rgba(239, 68, 68, 0.6)"
                          }}
                        />
                      </div>

                      {/* Chips de Condiciones */}
                      <div style={estilos.filaCondicionesChips}>
                        {criatura.condiciones.length > 0 ? (
                          criatura.condiciones.map((cond) => (
                            <div
                              key={cond}
                              className="chip-condicion-premium"
                              data-tooltip={condicionTooltip[cond] || cond}
                            >
                              <span>{cond}</span>
                              <button
                                onClick={() => quitarCondicionDeCriatura(criatura.id, cond)}
                                className="boton-quitar-condicion-premium"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))
                        ) : (
                          <span className="texto-condiciones-vacias-premium">Sin condiciones activas</span>
                        )}
                      </div>
                    </div>

                    {/* Acciones Rápidas (Leídas de plantilla) */}
                    <div style={estilos.cajaAccionesRapidasColumn}>
                      {plantilla && plantilla.accionesRapidas && plantilla.accionesRapidas.length > 0 ? (
                        <div style={estilos.contenedorAccionesRapidasBotones}>
                          {plantilla.accionesRapidas.map((acc, index) => (
                            <button
                              key={index}
                              onClick={() => lanzarAtaqueRapido(criatura.nombre, acc.nombre, acc.bonificadorAtaque, acc.dadosDaño, acc.tipoDaño)}
                              className="boton-accion-rapida-premium"
                              title={`Tirar ataque: d20${acc.bonificadorAtaque} | Daño: ${acc.dadosDaño} (${acc.tipoDaño})`}
                            >
                              <Swords size={11} />
                              <span>{acc.nombre} ({acc.bonificadorAtaque})</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="sin-acciones-aviso-premium">
                          {criatura.esMonstruo ? "Sin ataques rápidos" : "Ficha de Jugador"}
                        </div>
                      )}
                    </div>

                    {/* Vida y Controles Math Inteligentes */}
                    <div className="caja-controles-salud-premium">
                      {/* HP Gigante interactivo */}
                      <div className="hp-badge-premium">
                        <Heart size={13} fill={estaMuerto ? "none" : "#ef4444"} style={{ color: "#ef4444" }} />
                        <span className="hp-texto-premium">
                          {criatura.vidaActual} <span className="hp-max-texto-premium">/ {criatura.vidaMaxima}</span>
                        </span>
                        {criatura.vidaTemporal && criatura.vidaTemporal > 0 ? (
                          <span className="hp-temporal-tag-premium">+{criatura.vidaTemporal} Temp</span>
                        ) : null}
                      </div>

                      {/* Inputs Math & Temp */}
                      <div style={estilos.inputsSaludFila}>
                        {/* Math Input */}
                        <div style={estilos.cajaInputMathLabel}>
                          <span style={estilos.labelInputChico}>Math HP</span>
                          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "2px" }}>
                            <button
                              onClick={() => {
                                const modoActual = modoMath[criatura.id] || "daño";
                                setModoMath({
                                  ...modoMath,
                                  [criatura.id]: modoActual === "daño" ? "cura" : "daño"
                                });
                              }}
                              className="math-btn-toggle"
                              style={{
                                width: "20px",
                                height: "20px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "11px",
                                backgroundColor: (modoMath[criatura.id] || "daño") === "daño" ? "rgba(242, 92, 84, 0.15)" : "rgba(0, 245, 212, 0.15)",
                                border: (modoMath[criatura.id] || "daño") === "daño" ? "1px solid rgba(242, 92, 84, 0.4)" : "1px solid rgba(0, 245, 212, 0.4)",
                                color: (modoMath[criatura.id] || "daño") === "daño" ? "var(--color-peligro)" : "var(--color-borde-cian)",
                                borderRadius: "4px",
                                cursor: "pointer",
                                padding: 0
                              }}
                              title={(modoMath[criatura.id] || "daño") === "daño" ? "Modo Daño (restar vida)" : "Modo Curación (sumar vida)"}
                            >
                              {(modoMath[criatura.id] || "daño") === "daño" ? "⚔️" : "❤️"}
                            </button>
                            <input
                              type="number"
                              placeholder="Cant"
                              onKeyDown={(e) => manejarMathHPConModo(e, criatura.id, criatura.vidaActual, criatura.vidaMaxima, modoMath[criatura.id] || "daño")}
                              className="input-salud-math-premium"
                              style={{ width: "38px" }}
                              title="Introduce la cantidad y presiona Enter para aplicar"
                            />
                          </div>
                        </div>

                        {/* Temp HP Input */}
                        <div style={estilos.cajaInputMathLabel}>
                          <span style={estilos.labelInputChico}>HP Temp</span>
                          <input
                            type="number"
                            min="0"
                            value={criatura.vidaTemporal || 0}
                            onChange={(e) => actualizarVidaTemporal(criatura.id, parseInt(e.target.value, 10) || 0)}
                            className="input-salud-temp-premium"
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
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECCIÓN INFERIOR: BLOQUE DE ESTADÍSTICAS O VINCULADOR */}
          {criaturaSeleccionadaDetalle && (
            <div className="panel-detalle-premium">
              <div style={estilos.cabeceraDetalleFicha}>
                <div style={estilos.tituloFichaIzquierda}>
                  <FileText size={16} style={{ color: "var(--color-borde-cian)" }} />
                  <span style={estilos.nombreFichaCabecera}>
                    BLOQUE DE ESTADÍSTICAS: {criaturaSeleccionadaDetalle.nombre}
                  </span>
                  {plantillaDeDetalle && (
                    <span style={estilos.subFichaAsociada}>
                      (Plantilla asociada: {plantillaDeDetalle.nombre})
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIdCriaturaDetalle(null)}
                  style={estilos.botonCerrarDetalle}
                >
                  <X size={15} />
                </button>
              </div>

              <div style={estilos.cuerpoDetalleScroll}>
                {/* CASO A: NO TIENE PLANTILLA ASOCIADA (VINCULAR MINI MANUALMENTE) */}
                {!plantillaDeDetalle ? (
                  <div style={estilos.cajaVinculacionManual}>
                    <div style={estilos.alertaVinculoInfo}>
                      <Link size={24} style={{ color: "var(--color-borde-cian)", marginBottom: "8px" }} />
                      <span style={estilos.tituloAlertaVinculo}>VINCULAR MINI CON BLOQUE DE ESTADÍSTICAS</span>
                      <span style={estilos.descAlertaVinculo}>
                        Este mini ("{criaturaSeleccionadaDetalle.nombre}") proviene del tablero o no tiene plantilla de D&D 5.5e asociada. Vinculalo ahora a una plantilla de monstruo para ver sus características y rasgos en tiempo real.
                      </span>
                    </div>

                    <div style={estilos.buscadorVincularArea}>
                      <div style={estilos.barraBuscadoraVinc}>
                        <Search size={15} style={{ color: "var(--color-texto-apagado)", marginLeft: "8px" }} />
                        <input
                          type="text"
                          value={filtroBuscadorVinculo}
                          onChange={(e) => {
                            setFiltroBuscadorVinculo(e.target.value);
                            setMostrarListaVinculos(true);
                          }}
                          onFocus={() => setMostrarListaVinculos(true)}
                          placeholder="Buscar plantilla de monstruo (ej: Orco, Goblin, Troll...)"
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
                            <X size={12} />
                          </button>
                        )}
                      </div>

                      {mostrarListaVinculos && (
                        <div style={estilos.listaFlotanteVinculos}>
                          {plantillasFiltradas.length === 0 ? (
                            <div style={estilos.itemVinculoVacio}>No se encontraron plantillas.</div>
                          ) : (
                            plantillasFiltradas.slice(0, 8).map((plant) => (
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
                                  <span style={{ fontSize: "11px", color: "var(--color-texto-secundario)", marginLeft: "8px" }}>
                                    {plant.tipo} | CR: {plant.desafio || "—"}
                                  </span>
                                </div>
                                <Check size={14} style={{ color: "var(--color-borde-cian)" }} />
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* CASO B: TIENE PLANTILLA (RENDERIZAR FICHA COMPLETA D&D 5.5e) */
                  <div style={estilos.cajaFichaEstadisticasDnd}>
                    
                    {/* Botón de desvincular */}
                    <div style={estilos.cajaDesvincularFicha}>
                      <button
                        onClick={() => asociarPlantillaACriatura(criaturaSeleccionadaDetalle.id, "")}
                        style={estilos.botonDesvincularManual}
                        title="Desvincular este mini de la plantilla de estadísticas"
                      >
                        <Link size={12} />
                        Desvincular plantilla
                      </button>
                    </div>

                    <div style={estilos.seccionesFichaLayout}>
                      
                      {/* COLUMNA 1: Atributos y Datos Básicos */}
                      <div style={estilos.columnaFichaBasicos}>
                        <div style={estilos.tituloCabeceraDetalle}>
                          <span style={estilos.nombreMonstruoFicha}>{plantillaDeDetalle.nombre}</span>
                          <span style={estilos.tipoMonstruoFicha}>
                            Desafío (CR): <strong style={{ color: "#ffcc00" }}>{plantillaDeDetalle.desafio}</strong> | Perc. Pasiva: <strong style={{ color: "#00f5d4" }}>{obtenerPercepcionPasiva(plantillaDeDetalle)}</strong> | Fuente: {plantillaDeDetalle.fuente || "D&D 2024"}
                          </span>
                        </div>

                        {/* Atributos en cajas moradas brutales premium */}
                        <div style={estilos.cajaAtributosGrid}>
                          {Object.entries(plantillaDeDetalle.caracteristicas).map(([clave, valor]) => {
                            const modStr = calcularModificador(valor);
                            const etiqueta = clave.substring(0, 3).toUpperCase();
                            return (
                              <div
                                key={clave}
                                onClick={() => lanzarTiradaD20Interactiva(criaturaSeleccionadaDetalle.nombre, etiqueta, parseInt(modStr, 10))}
                                className="caja-atributo-purple-premium"
                                title={`Hacer tirada de d20 para ${clave.toUpperCase()}`}
                              >
                                <span style={estilos.atributoEtiquetaName}>{etiqueta}</span>
                                <span style={estilos.atributoValorNum}>{valor}</span>
                                <span style={estilos.atributoModSign}>{modStr}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Defensas y Sentidos */}
                        <div style={estilos.cajaMetadatosFichaExtra}>
                          <div style={estilos.lineaMetaFicha}>
                            <strong>Clase de Armadura (CA):</strong> <span className="dato-numerico">{plantillaDeDetalle.ca}</span> {plantillaDeDetalle.caNotas ? `(${plantillaDeDetalle.caNotas})` : ""}
                          </div>
                          <div style={estilos.lineaMetaFicha}>
                            <strong>Velocidad:</strong> {plantillaDeDetalle.velocidad}
                          </div>
                          {plantillaDeDetalle.sentidos && (
                            <div style={estilos.lineaMetaFicha}>
                              <strong>Sentidos:</strong> {plantillaDeDetalle.sentidos}
                            </div>
                          )}
                          {plantillaDeDetalle.idiomas && (
                            <div style={estilos.lineaMetaFicha}>
                              <strong>Idiomas:</strong> {plantillaDeDetalle.idiomas}
                            </div>
                          )}
                          {plantillaDeDetalle.resistencias && (Array.isArray(plantillaDeDetalle.resistencias) ? plantillaDeDetalle.resistencias.length > 0 : String(plantillaDeDetalle.resistencias).trim() !== "") && (
                            <div style={estilos.lineaMetaFicha}>
                              <strong style={{ color: "var(--color-exito)" }}>Resistencias al Daño:</strong> {Array.isArray(plantillaDeDetalle.resistencias) ? plantillaDeDetalle.resistencias.join(", ") : plantillaDeDetalle.resistencias}
                            </div>
                          )}
                          {plantillaDeDetalle.inmunidadesDaño && (Array.isArray(plantillaDeDetalle.inmunidadesDaño) ? plantillaDeDetalle.inmunidadesDaño.length > 0 : String(plantillaDeDetalle.inmunidadesDaño).trim() !== "") && (
                            <div style={estilos.lineaMetaFicha}>
                              <strong style={{ color: "#00f5d4" }}>Inmunidades al Daño:</strong> {Array.isArray(plantillaDeDetalle.inmunidadesDaño) ? plantillaDeDetalle.inmunidadesDaño.join(", ") : plantillaDeDetalle.inmunidadesDaño}
                            </div>
                          )}
                          {plantillaDeDetalle.inmunidadesCondicion && (Array.isArray(plantillaDeDetalle.inmunidadesCondicion) ? plantillaDeDetalle.inmunidadesCondicion.length > 0 : String(plantillaDeDetalle.inmunidadesCondicion).trim() !== "") && (
                            <div style={estilos.lineaMetaFicha}>
                              <strong style={{ color: "#a29bfe" }}>Inmunidades a Condiciones:</strong> {Array.isArray(plantillaDeDetalle.inmunidadesCondicion) ? plantillaDeDetalle.inmunidadesCondicion.join(", ") : plantillaDeDetalle.inmunidadesCondicion}
                            </div>
                          )}
                          {plantillaDeDetalle.vulnerabilidades && (Array.isArray(plantillaDeDetalle.vulnerabilidades) ? plantillaDeDetalle.vulnerabilidades.length > 0 : String(plantillaDeDetalle.vulnerabilidades).trim() !== "") && (
                            <div style={estilos.lineaMetaFicha}>
                              <strong style={{ color: "var(--color-peligro)" }}>Vulnerabilidades al Daño:</strong> {Array.isArray(plantillaDeDetalle.vulnerabilidades) ? plantillaDeDetalle.vulnerabilidades.join(", ") : plantillaDeDetalle.vulnerabilidades}
                            </div>
                          )}
                        </div>

                        {/* Salvaciones entrenadas */}
                        {plantillaDeDetalle.salvaciones && Object.keys(plantillaDeDetalle.salvaciones).length > 0 && (
                          <div style={estilos.seccionFichaAdicionales}>
                            <div style={estilos.subtituloFichaSection}>SALVACIONES (Tirar d20)</div>
                            <div style={estilos.listaChipsTiradas}>
                              {Object.entries(plantillaDeDetalle.salvaciones).map(([caract, bono]) => {
                                if (bono === undefined) return null;
                                const nombreSalv = caract.charAt(0).toUpperCase() + caract.slice(1);
                                return (
                                  <button
                                    key={caract}
                                    onClick={() => lanzarTiradaD20Interactiva(criaturaSeleccionadaDetalle.nombre, `Salvación ${nombreSalv}`, bono)}
                                    className="boton-chip-tirada-premium"
                                  >
                                    {nombreSalv} {bono >= 0 ? "+" : ""}{bono}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Habilidades (Skills) entrenadas */}
                        {plantillaDeDetalle.habilidades && Object.keys(plantillaDeDetalle.habilidades).length > 0 && (
                          <div style={estilos.seccionFichaAdicionales}>
                            <div style={estilos.subtituloFichaSection}>PERICIAS HABILIDADES (Tirar d20)</div>
                            <div style={estilos.listaChipsTiradas}>
                              {Object.entries(plantillaDeDetalle.habilidades).map(([hab, bono]) => {
                                if (bono === undefined) return null;
                                const nombreHab = hab.replace(/([A-Z])/g, " $1").trim();
                                const nombreHabCapitalizado = nombreHab.charAt(0).toUpperCase() + nombreHab.slice(1);
                                return (
                                  <button
                                    key={hab}
                                    onClick={() => lanzarTiradaD20Interactiva(criaturaSeleccionadaDetalle.nombre, nombreHabCapitalizado, bono)}
                                    className="boton-chip-tirada-premium"
                                  >
                                    {nombreHabCapitalizado} {bono >= 0 ? "+" : ""}{bono}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* COLUMNA 2: Rasgos Pasivos y Acciones / Ataques */}
                      <div style={estilos.columnaFichaRasgosAcciones}>
                        {/* Rasgos y Características */}
                        {plantillaDeDetalle.rasgos && plantillaDeDetalle.rasgos.length > 0 && (
                          <div style={estilos.cajaListaRasgosFicha}>
                            <div style={estilos.subtituloFichaSection}>RASGOS Y HABILIDADES PASIVAS</div>
                            {plantillaDeDetalle.rasgos.map((rasgo, i) => (
                              <div key={i} style={estilos.itemRasgoFichaTexto}>
                                <strong>{rasgo.nombre} {rasgo.uso ? `(${rasgo.uso})` : ""}:</strong> {renderizarTextoConDadosInteractivos(rasgo.descripcion, `${rasgo.nombre} (${criaturaSeleccionadaDetalle.nombre})`)}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Acciones y Ataques de color morado */}
                        {plantillaDeDetalle.acciones && plantillaDeDetalle.acciones.length > 0 && (
                          <div style={estilos.cajaListaAccionesFicha}>
                            <div style={estilos.subtituloFichaSection}>ACCIONES Y ATAQUES (Lanzar en TaleSpire)</div>
                            {plantillaDeDetalle.acciones.map((acc, i) => {
                              const esAtaque = acc.bonificadorAtaque !== undefined && acc.daño !== undefined;
                              return (
                                <div key={i} className="tarjeta-accion-purple-premium">
                                  <div style={estilos.cabeceraAccionTarjeta}>
                                    <span style={estilos.nombreAccionTarjeta}>{acc.nombre}</span>
                                    {esAtaque && (
                                      <button
                                        onClick={() => lanzarAtaqueRapido(criaturaSeleccionadaDetalle.nombre, acc.nombre, `${(acc.bonificadorAtaque ?? 0) >= 0 ? "+" : ""}${acc.bonificadorAtaque ?? 0}`, acc.daño || "1d6", detectarTipoDaño(acc.descripcion, "Físico"))}
                                        className="boton-accion-ataque-lanzar-premium"
                                      >
                                        <Swords size={12} />
                                        Tirar Ataque
                                      </button>
                                    )}
                                  </div>
                                  <div style={estilos.descAccionTarjeta}>
                                    {renderizarTextoConDadosInteractivos(acc.descripcion, `${acc.nombre} (${criaturaSeleccionadaDetalle.nombre})`)}
                                    {esAtaque && (
                                      <span style={estilos.detallesAtaqueMetaInline}>
                                        (Modificador: +{acc.bonificadorAtaque} | Daño: {acc.daño})
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
                          <div style={estilos.cajaListaRasgosFicha}>
                            <div style={estilos.subtituloFichaSection}>REACCIONES</div>
                            {plantillaDeDetalle.reacciones.map((reac, i) => (
                              <div key={i} style={estilos.itemRasgoFichaTexto}>
                                <strong>{reac.nombre}:</strong> {renderizarTextoConDadosInteractivos(reac.descripcion, `${reac.nombre} (${criaturaSeleccionadaDetalle.nombre})`)}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Acciones Legendarias */}
                        {plantillaDeDetalle.accionesLegendarias && plantillaDeDetalle.accionesLegendarias.length > 0 && (
                          <div style={estilos.cajaListaRasgosFicha}>
                            <div style={estilos.subtituloFichaSection}>ACCIONES LEGENDARIAS</div>
                            {plantillaDeDetalle.accionesLegendarias.map((leg, i) => (
                              <div key={i} style={estilos.itemRasgoFichaTexto}>
                                <strong>{leg.nombre}:</strong> {renderizarTextoConDadosInteractivos(leg.descripcion, `${leg.nombre} (${criaturaSeleccionadaDetalle.nombre})`)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
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
  estadoVacio: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
    padding: "30px"
  },
  cajaVacia: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    maxWidth: "400px",
    textAlign: "center",
    border: "1.5px dashed rgba(255,255,255,0.15)",
    padding: "28px",
    backgroundColor: "rgba(20, 22, 31, 0.6)",
    backdropFilter: "blur(10px)",
    borderRadius: "16px 4px 16px 16px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
  },
  textoVacioTitulo: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "var(--color-texto-principal)",
    letterSpacing: "0.15em",
    marginBottom: "8px",
    fontFamily: "var(--fuente-codigo)"
  },
  textoVacioSub: {
    fontSize: "11px",
    color: "var(--color-texto-secundario)",
    lineHeight: "1.4"
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
    padding: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  listaTarjetasIniciativa: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
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
    flexDirection: "column",
    gap: "1px",
    flexGrow: 1
  },
  subtituloCriatura: {
    fontSize: "11px",
    color: "var(--color-texto-secundario)"
  },
  filaCondicionesChips: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: "4px",
    alignItems: "center",
    marginTop: "2px"
  },
  cajaAccionesRapidasColumn: {
    display: "flex",
    flexDirection: "column",
    flex: 2,
    minWidth: "150px",
    justifyContent: "center"
  },
  contenedorAccionesRapidasBotones: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: "4px"
  },
  inputsSaludFila: {
    display: "flex",
    flexDirection: "row",
    gap: "6px"
  },
  cajaInputMathLabel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1px"
  },
  labelInputChico: {
    fontSize: "8px",
    color: "var(--color-texto-apagado)",
    textTransform: "uppercase"
  },
  botonEliminarDeCola: {
    background: "none",
    border: "none",
    color: "rgba(242, 92, 84, 0.5)",
    cursor: "pointer",
    padding: "6px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    transition: "all 0.2s ease"
  },
  cabeceraDetalleFicha: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(20, 22, 31, 0.8)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "8px 14px",
    height: "36px"
  },
  tituloFichaIzquierda: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "6px"
  },
  nombreFichaCabecera: {
    fontSize: "11px",
    fontWeight: "bold",
    color: "var(--color-texto-principal)",
    letterSpacing: "0.05em"
  },
  subFichaAsociada: {
    fontSize: "10px",
    color: "var(--color-borde-cian)",
    marginLeft: "8px"
  },
  botonCerrarDetalle: {
    background: "none",
    border: "none",
    color: "var(--color-texto-secundario)",
    cursor: "pointer",
    padding: "2px",
    display: "flex",
    alignItems: "center",
    transition: "color 0.15s ease"
  },
  cuerpoDetalleScroll: {
    flexGrow: 1,
    overflowY: "auto",
    padding: "12px"
  },
  cajaVinculacionManual: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 40px",
    textAlign: "center"
  },
  alertaVinculoInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    maxWidth: "500px",
    marginBottom: "12px"
  },
  tituloAlertaVinculo: {
    fontSize: "12px",
    fontWeight: "bold",
    color: "var(--color-texto-principal)",
    marginBottom: "4px"
  },
  descAlertaVinculo: {
    fontSize: "10.5px",
    color: "var(--color-texto-secundario)",
    lineHeight: "1.4"
  },
  buscadorVincularArea: {
    position: "relative",
    width: "100%",
    maxWidth: "400px"
  },
  barraBuscadoraVinc: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(13, 14, 18, 0.6)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    height: "32px",
    width: "100%",
    transition: "border-color 0.2s ease"
  },
  inputBuscadorVinculo: {
    flexGrow: 1,
    background: "none",
    border: "none",
    fontSize: "12px",
    color: "var(--color-texto-principal)",
    outline: "none",
    padding: "0 8px"
  },
  botonLimpiarVinculo: {
    background: "none",
    border: "none",
    color: "var(--color-texto-secundario)",
    cursor: "pointer",
    marginRight: "8px"
  },
  listaFlotanteVinculos: {
    position: "absolute",
    top: "36px",
    left: 0,
    width: "100%",
    maxHeight: "160px",
    overflowY: "auto",
    backgroundColor: "rgba(20, 22, 31, 0.95)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "8px",
    zIndex: 999,
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
  },
  itemVinculoOpcion: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    cursor: "pointer",
    fontSize: "12px",
    textAlign: "left",
    transition: "background 0.2s ease"
  },
  itemVinculoVacio: {
    padding: "10px",
    color: "var(--color-texto-apagado)",
    fontSize: "11px"
  },
  cajaFichaEstadisticasDnd: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
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
    fontSize: "10px",
    padding: "4px 10px",
    backgroundColor: "rgba(242, 92, 84, 0.08)",
    border: "1px solid rgba(242, 92, 84, 0.25)",
    color: "var(--color-peligro)",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  seccionesFichaLayout: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px"
  },
  columnaFichaBasicos: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  tituloCabeceraDetalle: {
    display: "flex",
    flexDirection: "column",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    paddingBottom: "6px"
  },
  nombreMonstruoFicha: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#ffcc00",
    fontFamily: "var(--fuente-codigo)"
  },
  tipoMonstruoFicha: {
    fontSize: "11px",
    color: "var(--color-texto-secundario)"
  },
  cajaAtributosGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: "4px"
  },
  atributoEtiquetaName: {
    fontSize: "9px",
    fontWeight: "bold",
    color: "#a29bfe",
    letterSpacing: "0.05em"
  },
  atributoValorNum: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "var(--color-texto-principal)"
  },
  atributoModSign: {
    fontSize: "11px",
    fontWeight: "bold",
    color: "#00f5d4"
  },
  cajaMetadatosFichaExtra: {
    backgroundColor: "rgba(20, 22, 31, 0.55)",
    border: "1.5px solid rgba(255,255,255,0.06)",
    borderRadius: "12px",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "5px"
  },
  lineaMetaFicha: {
    fontSize: "11px",
    color: "var(--color-texto-principal)"
  },
  seccionFichaAdicionales: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  subtituloFichaSection: {
    fontSize: "10.5px",
    fontWeight: "bold",
    color: "var(--color-borde-cian)",
    letterSpacing: "0.05em",
    borderBottom: "1.5px solid rgba(255,255,255,0.08)",
    paddingBottom: "3px",
    marginTop: "6px"
  },
  listaChipsTiradas: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: "4px"
  },
  columnaFichaRasgosAcciones: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  cajaListaRasgosFicha: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  itemRasgoFichaTexto: {
    fontSize: "11px",
    lineHeight: "1.4",
    color: "var(--color-texto-secundario)",
    padding: "2px 0"
  },
  cajaListaAccionesFicha: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  cabeceraAccionTarjeta: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  nombreAccionTarjeta: {
    fontSize: "12px",
    fontWeight: "bold",
    color: "#ffcc00"
  },
  descAccionTarjeta: {
    fontSize: "11px",
    color: "var(--color-texto-secundario)",
    lineHeight: "1.4",
    marginTop: "2px"
  },
  detallesAtaqueMetaInline: {
    display: "block",
    fontSize: "10px",
    color: "#00f5d4",
    marginTop: "2px",
    fontWeight: "bold"
  }
};
