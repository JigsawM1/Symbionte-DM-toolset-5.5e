import React from "react";
import {
  usarEstadoAccesibilidad,
  usarAccionesAccesibilidad
} from "@/almacen/selectores";
import {
  Type,
  Eye,
  Sliders,
  Palette,
  RotateCcw,
  Sparkles,
  MousePointerClick,
  Underline,
  AlignLeft
} from "lucide-react";
import {
  EscalaFuente,
  FamiliaFuente,
  ModoContraste,
  ModoDaltonismo,
  ColorAcento,
  CONFIGURACION_ACCESIBILIDAD_POR_DEFECTO
} from "@/tipos/accesibilidad";
import { PrevisualizadorAccesibilidad } from "./PrevisualizadorAccesibilidad";
import estilos from "./PanelAccesibilidad.module.css";

export const PanelAccesibilidad: React.FC = () => {
  const estadoAccesibilidad = usarEstadoAccesibilidad();
  const accesibilidad = estadoAccesibilidad || CONFIGURACION_ACCESIBILIDAD_POR_DEFECTO;
  const { actualizarAccesibilidad, restablecerAccesibilidad } = usarAccionesAccesibilidad();

  const opcionesEscala: { id: EscalaFuente; label: string; sublabel: string }[] = [
    { id: "compacta", label: "A- Compacta", sublabel: "90%" },
    { id: "normal", label: "A Normal", sublabel: "100%" },
    { id: "grande", label: "A+ Grande", sublabel: "115%" },
    { id: "muy-grande", label: "A++ Muy Grande", sublabel: "130%" }
  ];

  const opcionesFamilia: { id: FamiliaFuente; label: string; desc: string }[] = [
    { id: "estandar", label: "Predeterminada", desc: "Inter / Sans-serif" },
    { id: "dislexia", label: "Alta Legibilidad", desc: "OpenDyslexic / Trebuchet" },
    { id: "mono", label: "Código / Táctica", desc: "JetBrains / Cascadia" },
    { id: "serif", label: "Clásica Medieval", desc: "Georgia / Serif" }
  ];

  const opcionesContraste: { id: ModoContraste; label: string; desc: string }[] = [
    { id: "estandar", label: "Estándar Brutalista", desc: "Equilibrado (WCAG AA)" },
    { id: "alto", label: "Alto Contraste", desc: "Fondo negro puro (WCAG AAA)" }
  ];

  const opcionesDaltonismo: { id: ModoDaltonismo; label: string; desc: string }[] = [
    { id: "ninguno", label: "Estándar", desc: "Colores D&D clásicos" },
    { id: "protanopia", label: "Protanopía", desc: "Déficit de rojo" },
    { id: "deuteranopia", label: "Deuteranopía", desc: "Déficit de verde" },
    { id: "tritanopia", label: "Tritanopía", desc: "Déficit de azul/amarillo" }
  ];

  const opcionesColorAcento: { id: ColorAcento; label: string; claseCirculo: string }[] = [
    { id: "arcano", label: "Violeta Arcano", claseCirculo: estilos.circuloArcano },
    { id: "cian", label: "Cian Táctico", claseCirculo: estilos.circuloCian },
    { id: "oro", label: "Oro Dragón", claseCirculo: estilos.circuloOro },
    { id: "esmeralda", label: "Esmeralda", claseCirculo: estilos.circuloEsmeralda },
    { id: "alerta", label: "Rosa Neón", claseCirculo: estilos.circuloAlerta }
  ];

  return (
    <div className={estilos.contenedorPanel}>
      <div className={estilos.cabeceraPanel}>
        <div className={estilos.cabeceraTituloFila}>
          <Eye size={18} className={estilos.iconoCabecera} />
          <h4 className={estilos.tituloPanel}>ACCESIBILIDAD Y PERSONALIZACIÓN VISUAL</h4>
        </div>

        <button
          type="button"
          onClick={restablecerAccesibilidad}
          className={estilos.botonRestablecer}
          title="Restablecer todas las preferencias de accesibilidad a sus valores predeterminados"
        >
          <RotateCcw size={13} />
          <span>Restablecer por Defecto</span>
        </button>
      </div>

      {/* Previsualizador en Vivo */}
      <PrevisualizadorAccesibilidad />

      <div className={estilos.gridSecciones}>
        {/* ESCALA TIPOGRÁFICA */}
        <div className={estilos.tarjetaControl}>
          <div className={estilos.cabeceraControl}>
            <Type size={16} className={estilos.iconoControl} />
            <span className={estilos.tituloControl}>Tamaño de Letra</span>
          </div>
          <p className={estilos.descripcionControl}>
            Escala el tamaño del texto en toda la interfaz sin desbordar los paneles tácticos.
          </p>
          <div className={estilos.grupoOpciones} role="group" aria-label="Tamaño de letra">
            {opcionesEscala.map((item) => {
              const activa = accesibilidad.escalaFuente === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => actualizarAccesibilidad({ escalaFuente: item.id })}
                  className={`${estilos.botonOpcion} ${activa ? estilos.botonOpcionActiva : ""}`}
                  aria-pressed={activa}
                >
                  <span>{item.label}</span>
                  <span className={estilos.textoOpcionSecundario}>{item.sublabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FAMILIA TIPOGRÁFICA */}
        <div className={estilos.tarjetaControl}>
          <div className={estilos.cabeceraControl}>
            <Sparkles size={16} className={estilos.iconoControl} />
            <span className={estilos.tituloControl}>Familia Tipográfica</span>
          </div>
          <p className={estilos.descripcionControl}>
            Selecciona la fuente para facilitar la lectura prolongada o soporte de dislexia.
          </p>
          <div className={estilos.grupoOpciones} role="group" aria-label="Familia tipográfica">
            {opcionesFamilia.map((item) => {
              const activa = accesibilidad.familiaFuente === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => actualizarAccesibilidad({ familiaFuente: item.id })}
                  className={`${estilos.botonOpcion} ${activa ? estilos.botonOpcionActiva : ""}`}
                  aria-pressed={activa}
                >
                  <span>{item.label}</span>
                  <span className={estilos.textoOpcionSecundario}>{item.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MODO DE CONTRASTE */}
        <div className={estilos.tarjetaControl}>
          <div className={estilos.cabeceraControl}>
            <Eye size={16} className={estilos.iconoControl} />
            <span className={estilos.tituloControl}>Modo de Contraste</span>
          </div>
          <p className={estilos.descripcionControl}>
            Aumenta el contraste entre fondos oscuros y textos para máxima legibilidad.
          </p>
          <div className={estilos.grupoOpciones} role="group" aria-label="Modo de contraste">
            {opcionesContraste.map((item) => {
              const activa = accesibilidad.modoContraste === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => actualizarAccesibilidad({ modoContraste: item.id })}
                  className={`${estilos.botonOpcion} ${activa ? estilos.botonOpcionActiva : ""}`}
                  aria-pressed={activa}
                >
                  <span>{item.label}</span>
                  <span className={estilos.textoOpcionSecundario}>{item.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MODO DE DALTONISMO */}
        <div className={estilos.tarjetaControl}>
          <div className={estilos.cabeceraControl}>
            <Sliders size={16} className={estilos.iconoControl} />
            <span className={estilos.tituloControl}>Adaptación para Daltonismo</span>
          </div>
          <p className={estilos.descripcionControl}>
            Reasigna los colores de estados críticos (salud, peligro y ventajas) para distinguir indicaciones sin ambigüedad.
          </p>
          <div className={estilos.grupoOpciones} role="group" aria-label="Adaptación para daltonismo">
            {opcionesDaltonismo.map((item) => {
              const activa = accesibilidad.modoDaltonismo === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => actualizarAccesibilidad({ modoDaltonismo: item.id })}
                  className={`${estilos.botonOpcion} ${activa ? estilos.botonOpcionActiva : ""}`}
                  aria-pressed={activa}
                >
                  <span>{item.label}</span>
                  <span className={estilos.textoOpcionSecundario}>{item.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* COLOR DE ACENTO */}
        <div className={estilos.tarjetaControl}>
          <div className={estilos.cabeceraControl}>
            <Palette size={16} className={estilos.iconoControl} />
            <span className={estilos.tituloControl}>Color de Acento de la Interfaz</span>
          </div>
          <p className={estilos.descripcionControl}>
            Personaliza el tono principal de bordes activos, botones e indicadores del sistema.
          </p>
          <div className={estilos.grupoColores} role="group" aria-label="Color de acento">
            {opcionesColorAcento.map((item) => {
              const activa = accesibilidad.colorAcento === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => actualizarAccesibilidad({ colorAcento: item.id })}
                  className={`${estilos.botonColorAcento} ${activa ? estilos.botonColorActivo : ""}`}
                  aria-pressed={activa}
                >
                  <span className={`${estilos.circuloColor} ${item.claseCirculo}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* OPCIONES ADICIONALES DE NAVEGACIÓN Y LECTURA */}
        <div className={estilos.tarjetaControl}>
          <div className={estilos.cabeceraControl}>
            <MousePointerClick size={16} className={estilos.iconoControl} />
            <span className={estilos.tituloControl}>Navegación y Lectura Guiada</span>
          </div>
          <p className={estilos.descripcionControl}>
            Ajustes para soporte de teclado y facilitadores de seguimiento visual.
          </p>
          <div className={estilos.listaToggles}>
            <div className={estilos.itemToggle}>
              <div className={estilos.infoToggle}>
                <span className={estilos.labelToggle}>Indicador de Foco Aumentado</span>
                <span className={estilos.sublabelToggle}>Resalta botones y campos activos con un anillo visible para teclado (Tab).</span>
              </div>
              <button
                type="button"
                onClick={() => actualizarAccesibilidad({ focoAumentado: !accesibilidad.focoAumentado })}
                className={`${estilos.botonSwitch} ${accesibilidad.focoAumentado ? estilos.botonSwitchActivo : ""}`}
                aria-pressed={accesibilidad.focoAumentado}
              >
                {accesibilidad.focoAumentado ? "ACTIVO" : "INACTIVO"}
              </button>
            </div>

            <div className={estilos.itemToggle}>
              <div className={estilos.infoToggle}>
                <div className="u-flex-fila u-gap-4">
                  <Underline size={13} className="u-texto-cian" />
                  <span className={estilos.labelToggle}>Subrayar Elementos Clicables</span>
                </div>
                <span className={estilos.sublabelToggle}>Añade subrayado visible a botones y enlaces para no depender solo del color.</span>
              </div>
              <button
                type="button"
                onClick={() => actualizarAccesibilidad({ subrayarEnlaces: !accesibilidad.subrayarEnlaces })}
                className={`${estilos.botonSwitch} ${accesibilidad.subrayarEnlaces ? estilos.botonSwitchActivo : ""}`}
                aria-pressed={accesibilidad.subrayarEnlaces}
              >
                {accesibilidad.subrayarEnlaces ? "ACTIVO" : "INACTIVO"}
              </button>
            </div>

            <div className={estilos.itemToggle}>
              <div className={estilos.infoToggle}>
                <div className="u-flex-fila u-gap-4">
                  <AlignLeft size={13} className="u-texto-cian" />
                  <span className={estilos.labelToggle}>Espaciado de Lectura Cómodo</span>
                </div>
                <span className={estilos.sublabelToggle}>Amplía el interlineado y la separación entre caracteres para prevenir fatiga visual.</span>
              </div>
              <button
                type="button"
                onClick={() => actualizarAccesibilidad({ espaciadoLectura: !accesibilidad.espaciadoLectura })}
                className={`${estilos.botonSwitch} ${accesibilidad.espaciadoLectura ? estilos.botonSwitchActivo : ""}`}
                aria-pressed={accesibilidad.espaciadoLectura}
              >
                {accesibilidad.espaciadoLectura ? "ACTIVO" : "INACTIVO"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

