import React, { useEffect, useState, useCallback } from "react";
import { usarFormularioObjeto } from "../../hooks/usarFormularioObjeto";
import { usarAlmacenDM, Rareza, TipoBonoDestreza, SubcategoriaEquipo } from "../../almacen/usarAlmacenDM";
import { Save, X, Sparkles, Scale, Coins, Swords, Shield, Backpack } from "lucide-react";
import { TIPOS_DAÑO_DND } from "../../constantes/homebrewConstantes";
import estilos from "./FormularioObjeto.module.css";

interface Props {
  idEnEdicion: string | null;
  alGuardarExitoso: () => void;
  cancelarEdicion: () => void;
}

// Colores HSL para D&D Rareza
const COLORES_RAREZA_HSL: Record<Rareza, string> = {
  "Común": "hsl(0, 0%, 75%)",
  "Poco Común": "hsl(120, 60%, 45%)",
  "Raro": "hsl(210, 85%, 50%)",
  "Muy Raro": "hsl(280, 75%, 60%)",
  "Legendario": "hsl(32, 95%, 50%)",
  "Artefacto": "hsl(0, 75%, 40%)"
};

const OPCIONES_ATRIBUTOS: Record<string, string[]> = {
  "CA": ["CA"],
  "CARACTERÍSTICA": ["Fuerza", "Destreza", "Constitución", "Inteligencia", "Sabiduría", "Carisma"],
  "SALVACIÓN": ["Fuerza", "Destreza", "Constitución", "Inteligencia", "Sabiduría", "Carisma"],
  "HABILIDAD": [
    "Acrobacias",
    "Atletismo",
    "Arcana",
    "Engaño",
    "Historia",
    "Perspicacia",
    "Intimidación",
    "Investigación",
    "Medicina",
    "Naturaleza",
    "Percepción",
    "Interpretación",
    "Persuasión",
    "Religión",
    "Juego de Manos",
    "Sigilo",
    "Supervivencia",
    "Trato con Animales"
  ]
};

// Maestrias oficiales de D&D 5.5e
const MAESTRIAS_DND_55 = [
  "Ninguna",
  "Cleave (Tajo)",
  "Graze (Rozar)",
  "Nick (Corte)",
  "Push (Empujar)",
  "Sap (Debilitar)",
  "Slow (Ralentizar)",
  "Topple (Derribar)",
  "Vex (Irritar)"
];

// Propiedades de Arma D&D 5.5e (PHB 2024)
const PROPIEDADES_ARMAS_DND = [
  "Sutil (Finesse)",
  "Versátil (Versatile)",
  "Pesada (Heavy)",
  "Ligera (Light)",
  "Carga (Loading)",
  "Alcance (Reach)",
  "Arrojadiza (Thrown)",
  "A dos manos (Two-Handed)",
  "Munición (Ammunition)",
  "Especial (Special)"
];

const EXPLICACIONES_PROPIEDADES: Record<string, string> = {
  "Sutil (Finesse)": "Al atacar con un arma con Sutil, usa tu modificador de Fuerza o Destreza para las tiradas de ataque y daño. Debes usar el mismo modificador para ambas tiradas.",
  "Versátil (Versatile)": "Se puede usar con una o dos manos. Un valor de daño entre paréntesis aparece con la propiedad: el arma inflige ese daño cuando se usa a dos manos para un ataque cuerpo a cuerpo.",
  "Pesada (Heavy)": "Tienes Desventaja en las tiradas de ataque con un arma Pesada si es cuerpo a cuerpo y tu Fuerza no es al menos 13, o si es a distancia y tu Destreza no es al menos 13.",
  "Ligera (Light)": "Al tomar la acción de Atacar y atacar con un arma Ligera, puedes hacer un ataque extra como Acción Adicional con otra arma Ligera diferente. No sumas tu modificador de característica al daño del ataque extra (salvo que sea negativo).",
  "Carga (Loading)": "Solo puedes disparar una pieza de munición de un arma con Carga cuando usas una acción, Acción Adicional o Reacción, sin importar cuántos ataques puedas hacer normalmente.",
  "Alcance (Reach)": "Un arma con Alcance añade 5 pies a tu alcance cuando atacas con ella, así como al determinar tu alcance para Ataques de Oportunidad.",
  "Arrojadiza (Thrown)": "Puedes lanzar el arma para hacer un ataque a distancia, y puedes desenfundarla como parte del ataque. Si es un arma cuerpo a cuerpo, usa el mismo modificador de característica para ataque y daño que usarías en cuerpo a cuerpo.",
  "A dos manos (Two-Handed)": "Un arma A Dos Manos requiere ambas manos cuando realizas un ataque con ella.",
  "Munición (Ammunition)": "Solo puedes hacer un ataque a distancia con un arma de Munición si tienes proyectiles. El tipo se especifica con el alcance del arma. Cada ataque gasta un proyectil. Tras un combate, puedes recuperar la mitad de la munición usada (1 minuto).",
  "Especial (Special)": "Este arma tiene reglas especiales de uso, detalladas en su descripción."
};

// Explicaciones de Maestrías D&D 5.5e (PHB 2024)
const EXPLICACIONES_MAESTRIAS: Record<string, string> = {
  "Ninguna": "",
  "Cleave (Tajo)": "Si impactas a una criatura con un ataque cuerpo a cuerpo, puedes hacer una tirada de ataque contra una segunda criatura a 5 pies de la primera y dentro de tu alcance. Si impactas, la segunda criatura recibe el daño del arma sin tu modificador de característica. Solo una vez por turno.",
  "Graze (Rozar)": "Si tu tirada de ataque falla, puedes infligir daño igual al modificador de característica usado. El daño es del mismo tipo que el arma, y solo puede incrementarse aumentando el modificador.",
  "Nick (Corte)": "Cuando haces el ataque extra de la propiedad Ligera, puedes hacerlo como parte de la acción de Atacar en vez de como Acción Adicional. Solo una vez por turno.",
  "Push (Empujar)": "Si impactas a una criatura, puedes empujarla hasta 10 pies en línea recta lejos de ti si es Grande o menor.",
  "Sap (Debilitar)": "Si impactas a una criatura, esa criatura tiene Desventaja en su siguiente tirada de ataque antes del inicio de tu próximo turno.",
  "Slow (Ralentizar)": "Si impactas a una criatura e infliges daño, puedes reducir su Velocidad en 10 pies hasta el inicio de tu próximo turno. Múltiples impactos con armas Slow no acumulan la reducción.",
  "Topple (Derribar)": "Si impactas a una criatura, puedes forzar una tirada de salvación de Constitución (CD 8 + tu modificador de característica + tu bonificador de competencia). Si falla, la criatura queda Derribada.",
  "Vex (Irritar)": "Si impactas a una criatura e infliges daño, tienes Ventaja en tu siguiente tirada de ataque contra esa criatura antes del final de tu próximo turno."
};

export const FormularioObjeto: React.FC<Props> = ({
  idEnEdicion,
  alGuardarExitoso,
  cancelarEdicion
}) => {
  const objetosHomebrew = usarAlmacenDM((s) => s.objetosHomebrew);

  const {
    oNombre, setONombre,
    oRareza, alCambiarRareza,
    oPropiedades, setOPropiedades,
    oDescripcion, setODescripcion,
    oPesoLb, setOPesoLb,
    oCostoCantidad, setOCostoCantidad,
    oCostoUnidad, setOCostoUnidad,
    oEsMagico, setOEsMagico,
    oEfectosPasivos,
    oTipoPrincipal, setOTipoPrincipal,

    oSubcategoriaArma, setOSubcategoriaArma,
    oTipoAtaque, setOTipoAtaque,
    oDadoDano, setODadoDano,
    oTipoDano, setOTipoDano,
    oPropiedadesArma, setOPropiedadesArma,
    oMaestria, setOMaestria,
    oAlcanceNormal, setOAlcanceNormal,
    oAlcanceLargo, setOAlcanceLargo,
    oDanoVersatil, setODanoVersatil,
    oMunicionRequerida, setOMunicionRequerida,

    oSubcategoriaArmadura, alCambiarSubcategoriaArmadura,
    oCaBase, setOCaBase,
    oRequisitoFuerza, setORequisitoFuerza,
    oDesventajaSigilo, setODesventajaSigilo,
    oBonoDestreza, setOBonoDestreza,
    oTiempoEquipar, setOTiempoEquipar,

    oSubcategoriaEquipo, setOSubcategoriaEquipo,
    oCantidad, setOCantidad,
    oSintonizacionRequerida, setOSintonizacionRequerida,
    oCargas, setOCargas,

    oEsVeneno, setOEsVeneno,
    oTipoVeneno, setOTipoVeneno,
    oCdSalvacionVeneno, setOCdSalvacionVeneno,
    oEfectoVeneno, setOEfectoVeneno,
    oEquipable, setOEquipable,

    oCondicionSintonizacion, setOCondicionSintonizacion,
    oFormulaRecarga, setOFormulaRecarga,
    oEstaMaldito, setOEstaMaldito,
    oEsConsciente, setOEsConsciente,
    oModificadorAtaqueDano, setOModificadorAtaqueDano,
    oHechizosVinculados,
    oArtesaniaTaller, setOArtesaniaTaller,
    oArtesaniaComponentes,
    oNuevoComponente, setONuevoComponente,

    oNuevoBonoCategoria, setONuevoBonoCategoria,
    oNuevoBonoBono, setONuevoBonoBono,
    oNuevoBonoValor, setONuevoBonoValor,
    oNuevoBonoDesc, setONuevoBonoDesc,
    oNuevoHechizoNombre, setONuevoHechizoNombre,
    oNuevoHechizoCd, setONuevoHechizoCd,
    oNuevoHechizoBonoAtaque, setONuevoHechizoBonoAtaque,
    oNuevoHechizoCosteCargas, setONuevoHechizoCosteCargas,

    // Nuevos campos relacionales
    oAmmunitionIndex, setOAmmunitionIndex,
    setOAmmunitionName,
    oStorageIndex, setOStorageIndex,
    setOStorageName,
    oContents, setOContents,
    oCraft, setOCraft,

    cargarObjeto,
    limpiarFormulario,
    agregarEfectoPasivo,
    eliminarEfectoPasivoIdx,
    agregarHechizoVinculado,
    eliminarHechizoVinculadoIdx,
    agregarComponenteArtesania,
    eliminarComponenteArtesaniaIdx,
    manejarGuardarObjeto
  } = usarFormularioObjeto(idEnEdicion, alGuardarExitoso);

  const tieneDatosMagicos = oEsMagico || oRareza !== "Común" || oEfectosPasivos.length > 0 || oSintonizacionRequerida || oCargas !== "";

  // Pestaña activa del formulario
  const [pestanaActiva, setPestanaActiva] = useState<"general" | "atributos" | "magia">("general");

  // --- ESTADOS LOCALES DE ENTRADA PARA RELACIONES ---
  const [nuevoContenidoIndex, setNuevoContenidoIndex] = useState("");
  const [nuevoContenidoName, setNuevoContenidoName] = useState("");
  const [nuevoContenidoQty, setNuevoContenidoQty] = useState<number>(1);

  const [nuevoCraftIndex, setNuevoCraftIndex] = useState("");
  const [nuevoCraftName, setNuevoCraftName] = useState("");

  const [busquedaContenidoQuery, setBusquedaContenidoQuery] = useState("");
  const [busquedaCraftQuery, setBusquedaCraftQuery] = useState("");

  // Sincronizar automáticamente oMunicionRequerida con la propiedad "Munición (Ammunition)"
  const tienePropMunicion = oPropiedadesArma.includes("Munición (Ammunition)");
  useEffect(() => {
    setOMunicionRequerida(tienePropMunicion);
  }, [tienePropMunicion, setOMunicionRequerida]);

  // Sincronizar edición con la base de datos si cambia idEnEdicion
  useEffect(() => {
    if (idEnEdicion) {
      const objeto = objetosHomebrew.find((o) => o.id === idEnEdicion);
      if (objeto) {
        cargarObjeto(objeto);
      }
    } else {
      limpiarFormulario();
    }
    setPestanaActiva("general");
  }, [idEnEdicion, objetosHomebrew, cargarObjeto, limpiarFormulario]);

  // Detener clics accidentales al lienzo 3D de TaleSpire
  const detenerPropagacion = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Listas prefiltradas para los selectores relacionales
  const listaTodosObjetos = [...objetosHomebrew].sort((a, b) => a.nombre.localeCompare(b.nombre));

  const resultadosContenido = busquedaContenidoQuery.trim()
    ? listaTodosObjetos.filter((o) =>
        o.nombre.toLowerCase().includes(busquedaContenidoQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const resultadosCraft = busquedaCraftQuery.trim()
    ? listaTodosObjetos.filter((o) =>
        o.nombre.toLowerCase().includes(busquedaCraftQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <form 
      onSubmit={manejarGuardarObjeto} 
      className={estilos.formularioBrutal}
      onMouseDown={detenerPropagacion}
      onMouseUp={detenerPropagacion}
    >
      {/* PESTAÑAS HORIZONTALES COMPACTAS */}
      <div className={estilos.pestanasForm}>
        <button
          type="button"
          onClick={() => setPestanaActiva("general")}
          className={`${estilos.pestanaBoton} ${pestanaActiva === "general" ? estilos.pestanaBotonActivo : ""}`}
        >
          [General]
        </button>
        <button
          type="button"
          onClick={() => setPestanaActiva("atributos")}
          className={`${estilos.pestanaBoton} ${pestanaActiva === "atributos" ? estilos.pestanaBotonActivo : ""}`}
        >
          [Atributos: {oTipoPrincipal}]
        </button>
        <button
          type="button"
          onClick={() => setPestanaActiva("magia")}
          className={`${estilos.pestanaBoton} ${pestanaActiva === "magia" ? estilos.pestanaBotonActivo : ""}`}
        >
          [Propiedades Mágicas {tieneDatosMagicos ? "✨" : ""}]
        </button>
      </div>

      {/* --- SECCIÓN 1: GENERAL (Siempre visible si está seleccionada) --- */}
      {pestanaActiva === "general" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className={estilos.filaDobleForm}>
            <div className={estilos.campoForm}>
              <label className={estilos.labelForm}>Nombre del Objeto:</label>
              <input
                type="text"
                value={oNombre}
                onChange={(e) => setONombre(e.target.value)}
                placeholder="Ej. Espada Flamígera"
                className={estilos.inputForm}
                required
              />
            </div>
            
            <div className={estilos.campoForm}>
              <label className={estilos.labelForm}>Categoría Principal:</label>
              <select
                value={oTipoPrincipal}
                onChange={(e) => setOTipoPrincipal(e.target.value as "Arma" | "Armadura" | "Equipo de Aventuras")}
                className={estilos.selectForm}
              >
                <option value="Arma">⚔️ Arma</option>
                <option value="Armadura">🛡️ Armadura</option>
                <option value="Equipo de Aventuras">🎒 Equipo de Aventuras</option>
              </select>
            </div>
          </div>

          <div className={estilos.filaTripleForm}>
            <div className={estilos.campoForm}>
              <label className={estilos.labelForm}>Subcategoría:</label>
              {oTipoPrincipal === "Arma" && (
                <select
                  value={oSubcategoriaArma}
                  onChange={(e) => setOSubcategoriaArma(e.target.value as "Sencilla" | "Marcial" | "De Fuego")}
                  className={estilos.selectForm}
                >
                  <option value="Sencilla">Sencilla</option>
                  <option value="Marcial">Marcial</option>
                  <option value="De Fuego">De Fuego</option>
                </select>
              )}
              {oTipoPrincipal === "Armadura" && (
                <select
                  value={oSubcategoriaArmadura}
                  onChange={(e) => alCambiarSubcategoriaArmadura(e.target.value as "Ligera" | "Mediana" | "Pesada" | "Escudo")}
                  className={estilos.selectForm}
                >
                  <option value="Ligera">Ligera</option>
                  <option value="Mediana">Mediana</option>
                  <option value="Pesada">Pesada</option>
                  <option value="Escudo">Escudo</option>
                </select>
              )}
              {oTipoPrincipal === "Equipo de Aventuras" && (
                <select
                  value={oSubcategoriaEquipo}
                  onChange={(e) => setOSubcategoriaEquipo(e.target.value as SubcategoriaEquipo)}
                  className={estilos.selectForm}
                >
                  <option value="Maravilloso">Objeto Maravilloso</option>
                  <option value="Consumible">Consumible / Poción</option>
                  <option value="Munición">Munición</option>
                  <option value="Herramienta">Herramienta</option>
                  <option value="Instrumento">Instrumento</option>
                  <option value="Paquete">Paquete / Contenedor</option>
                </select>
              )}
            </div>

            <div className={estilos.campoForm}>
              <label className={estilos.labelForm}>Rareza:</label>
              <div className={estilos.rarezaSelectWrapper}>
                <select
                  value={oRareza}
                  onChange={(e) => alCambiarRareza(e.target.value as Rareza)}
                  className={`${estilos.selectForm} ${estilos.selectRarezaHSL}`}
                  style={{ color: COLORES_RAREZA_HSL[oRareza], fontWeight: "bold" }}
                >
                  <option value="Común" style={{ color: COLORES_RAREZA_HSL["Común"], background: "var(--color-fondo-panel)" }}>Común</option>
                  <option value="Poco Común" style={{ color: COLORES_RAREZA_HSL["Poco Común"], background: "var(--color-fondo-panel)" }}>Poco Común</option>
                  <option value="Raro" style={{ color: COLORES_RAREZA_HSL["Raro"], background: "var(--color-fondo-panel)" }}>Raro</option>
                  <option value="Muy Raro" style={{ color: COLORES_RAREZA_HSL["Muy Raro"], background: "var(--color-fondo-panel)" }}>Muy Raro</option>
                  <option value="Legendario" style={{ color: COLORES_RAREZA_HSL["Legendario"], background: "var(--color-fondo-panel)" }}>Legendario</option>
                  <option value="Artefacto" style={{ color: COLORES_RAREZA_HSL["Artefacto"], background: "var(--color-fondo-panel)" }}>Artefacto</option>
                </select>
                <div 
                  className={estilos.indicadorRarezaColor} 
                  style={{ backgroundColor: COLORES_RAREZA_HSL[oRareza] }} 
                />
              </div>
            </div>
          </div>

          <div className={estilos.filaDobleForm}>
            <div className={estilos.campoForm}>
              <label className={estilos.labelForm}>
                <Scale size={12} /> Peso (lb):
              </label>
              <input
                type="number"
                step="any"
                value={oPesoLb}
                onChange={(e) => setOPesoLb(parseFloat(e.target.value) || 0)}
                placeholder="0 lb"
                className={estilos.inputForm}
              />
            </div>

            <div className={estilos.campoForm}>
              <label className={estilos.labelForm}>
                <Coins size={12} /> Valor / Costo:
              </label>
              <div style={{ display: "flex", gap: "6px", width: "100%" }}>
                <input
                  type="number"
                  min="0"
                  value={oCostoCantidad}
                  onChange={(e) => setOCostoCantidad(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0"
                  className={estilos.inputForm}
                  style={{ flex: 1 }}
                />
                <select
                  value={oCostoUnidad}
                  onChange={(e) => setOCostoUnidad(e.target.value as any)}
                  className={estilos.selectForm}
                  style={{ width: "95px", fontWeight: "bold" }}
                >
                  <option value="PC" style={{ color: "#b87333", background: "var(--color-fondo-panel)" }}>PC (Cobre)</option>
                  <option value="PP" style={{ color: "#aaa9ad", background: "var(--color-fondo-panel)" }}>PP (Plata)</option>
                  <option value="PE" style={{ color: "#e5e4e2", background: "var(--color-fondo-panel)" }}>PE (Electro)</option>
                  <option value="PO" style={{ color: "#ffd700", background: "var(--color-fondo-panel)" }}>PO (Oro)</option>
                  <option value="PPT" style={{ color: "#e5e4e2", background: "var(--color-fondo-panel)" }}>PPT (Platino)</option>
                </select>
              </div>
            </div>
          </div>

          <div className={estilos.campoForm} style={{ padding: "4px 0", marginTop: "4px" }}>
            <label className={estilos.labelCheckbox}>
              <input
                type="checkbox"
                checked={oTipoPrincipal === "Arma" || oTipoPrincipal === "Armadura" ? true : oEquipable}
                onChange={(e) => setOEquipable(e.target.checked)}
                disabled={oTipoPrincipal === "Arma" || oTipoPrincipal === "Armadura"}
                className={estilos.checkMini}
              />
              <span style={{ fontSize: "12px" }}>
                🎒 ¿Equipable en Ranura Activa?
                {(oTipoPrincipal === "Arma" || oTipoPrincipal === "Armadura") && " (Auto para Armas/Armaduras)"}
              </span>
            </label>
          </div>

          {/* DESCRIPCIÓN EN PESTAÑA GENERAL */}
          <div className={estilos.campoForm}>
            <label className={estilos.labelForm}>Descripción Detallada (Guarda texto limpio):</label>
            <textarea
              value={oDescripcion}
              onChange={(e) => setODescripcion(e.target.value)}
              placeholder="Escribe el lore o los efectos mecánicos..."
              className={estilos.textareaBrutal}
              rows={6}
              required
            />
          </div>

          <div className={estilos.campoForm}>
            <label className={estilos.labelForm}>Propiedades Rápidas / Etiquetas (Opcional):</label>
            <input
              type="text"
              value={oPropiedades}
              onChange={(e) => setOPropiedades(e.target.value)}
              placeholder="Ej. Espada Larga, Raro. Deja en blanco para autogenerar."
              className={estilos.inputForm}
            />
          </div>

          {/* MÓDULO DE CRAFTEO / ARTESANÍA */}
          <div className={estilos.bloqueDinamicoForm} style={{ borderColor: "rgba(168, 85, 247, 0.25)", marginTop: "8px" }}>
            <div className={estilos.tituloBloqueDinamico}>
              <span>RECETA DE CRAFTEO / ARTESANÍA (OPCIONAL)</span>
            </div>
            
            <div className={estilos.campoForm} style={{ marginBottom: "10px" }}>
              <label className={estilos.labelForm}>Taller Requerido:</label>
              <input
                type="text"
                value={oArtesaniaTaller}
                onChange={(e) => setOArtesaniaTaller(e.target.value)}
                placeholder="Ej. Forja del Herrero, Mesa de Alquimia..."
                className={estilos.inputForm}
              />
            </div>

            <div className={estilos.campoForm}>
              <label className={estilos.labelForm}>Componentes y Materiales Requeridos:</label>
              <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
                <input
                  type="text"
                  value={oNuevoComponente}
                  onChange={(e) => setONuevoComponente(e.target.value)}
                  placeholder="Ej. 1x Lingote de Hierro, 2x Colmillo de Lobo..."
                  className={estilos.inputForm}
                  style={{ flex: 1 }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      agregarComponenteArtesania();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={agregarComponenteArtesania}
                  className={estilos.botonAgregarDinamico}
                  style={{ padding: "4px 12px", height: "auto" }}
                >
                  + Añadir
                </button>
              </div>

              {oArtesaniaComponentes.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                  {oArtesaniaComponentes.map((comp, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "rgba(168, 85, 247, 0.15)",
                        border: "1px solid hsl(270, 70%, 60%)",
                        color: "hsl(270, 100%, 85%)",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "500"
                      }}
                    >
                      {comp}
                      <X
                        size={12}
                        style={{ cursor: "pointer", color: "var(--color-borde-cian)" }}
                        onClick={() => eliminarComponenteArtesaniaIdx(idx)}
                      />
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- SECCIÓN 2: ATRIBUTOS ESPECÍFICOS (Dependiente del Motor Condicional) --- */}
      {pestanaActiva === "atributos" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          
          {/* A. SI LA CATEGORÍA ES ARMA */}
          {oTipoPrincipal === "Arma" && (
            <div className={estilos.bloqueDinamicoForm} style={{ borderColor: "rgba(0, 245, 212, 0.25)" }}>
              <div className={estilos.tituloBloqueDinamico}>
                <span>PROPIEDADES TÁCTICAS DEL ARMA</span>
                <span className={estilos.subtituloInformacion}><Swords size={12} style={{ display: "inline", marginRight: "2px" }} /> Armamento Condicional</span>
              </div>

              <div className={estilos.filaDobleForm}>
                <div className={estilos.campoForm}>
                  <label className={estilos.labelForm}>Tipo de Ataque:</label>
                  <select
                    value={oTipoAtaque}
                    onChange={(e) => setOTipoAtaque(e.target.value as "Cuerpo a Cuerpo" | "A Distancia")}
                    className={estilos.selectForm}
                  >
                    <option value="Cuerpo a Cuerpo">⚔️ Cuerpo a Cuerpo</option>
                    <option value="A Distancia">🏹 A Distancia</option>
                  </select>
                </div>

                <div className={estilos.campoForm}>
                  <label className={estilos.labelForm}>Maestría de Arma (D&D 5.5e):</label>
                  <div className={estilos.tooltipContenedor} style={{ width: "100%" }}>
                    <select
                      value={oMaestria}
                      onChange={(e) => setOMaestria(e.target.value)}
                      className={estilos.selectForm}
                      required
                    >
                      {MAESTRIAS_DND_55.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    {oMaestria && EXPLICACIONES_MAESTRIAS[oMaestria] && (
                      <div className={`${estilos.tooltipFlotante} ${estilos.tooltipMaestria}`}>
                        <span className={estilos.tooltipTitulo}>{oMaestria}</span>
                        <span className={estilos.tooltipTexto}>{EXPLICACIONES_MAESTRIAS[oMaestria]}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={estilos.filaDobleForm}>
                <div className={estilos.campoForm}>
                  <label className={estilos.labelForm}>Dados de Daño:</label>
                  <input
                    type="text"
                    value={oDadoDano}
                    onChange={(e) => setODadoDano(e.target.value)}
                    placeholder="Ej. 1d8, 2d6, 1d10"
                    className={estilos.inputForm}
                  />
                </div>

                <div className={estilos.campoForm}>
                  <label className={estilos.labelForm}>Tipo de Daño:</label>
                  <select
                    value={oTipoDano}
                    onChange={(e) => setOTipoDano(e.target.value)}
                    className={estilos.selectForm}
                  >
                    {TIPOS_DAÑO_DND.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* RANGOS DE ALCANCE (Condicionado por estilo o propiedad) */}
              {(oTipoAtaque === "A Distancia" || oPropiedadesArma.includes("Arrojadiza (Thrown)")) && (
                <div className={estilos.filaDobleForm} style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "10px", borderRadius: "5px", border: "1px dashed rgba(255,255,255,0.06)" }}>
                  <div className={estilos.campoForm}>
                    <label className={estilos.labelForm}>Alcance Normal (pies):</label>
                    <input
                      type="number"
                      value={oAlcanceNormal}
                      onChange={(e) => setOAlcanceNormal(e.target.value === "" ? "" : parseInt(e.target.value))}
                      placeholder="Ej. 20"
                      className={estilos.inputForm}
                    />
                  </div>
                  <div className={estilos.campoForm}>
                    <label className={estilos.labelForm}>Alcance Máximo (pies):</label>
                    <input
                      type="number"
                      value={oAlcanceLargo}
                      onChange={(e) => setOAlcanceLargo(e.target.value === "" ? "" : parseInt(e.target.value))}
                      placeholder="Ej. 60"
                      className={estilos.inputForm}
                    />
                  </div>
                </div>
              )}

              {/* CHECKBOXES ESTILO PILLS CON TOOLTIP PREMIUM */}
              <div style={{ marginTop: "6px" }}>
                <div className={estilos.labelForm} style={{ marginBottom: "8px" }}>Propiedades del Arma:</div>
                <div className={estilos.gridClasesDnd}>
                  {PROPIEDADES_ARMAS_DND.map((prop) => {
                    const estaChecked = oPropiedadesArma.includes(prop);
                    return (
                      <div key={prop} className={estilos.tooltipContenedor}>
                        <label 
                          className={estilos.labelCheckbox}
                          style={{
                            backgroundColor: estaChecked ? "rgba(0, 245, 212, 0.08)" : "transparent",
                            border: estaChecked ? "1px solid var(--color-borde-cian)" : "1px solid var(--color-borde-brutal)",
                            padding: "5px 8px",
                            borderRadius: "4px",
                            transition: "all 0.1s ease",
                            cursor: "pointer",
                            position: "relative"
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={estaChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setOPropiedadesArma((prev) => [...prev, prop]);
                              } else {
                                setOPropiedadesArma((prev) => prev.filter((p) => p !== prop));
                              }
                            }}
                            className={estilos.checkMini}
                            style={{ display: "none" }}
                          />
                          <span style={{ fontSize: "11px", color: estaChecked ? "var(--color-texto-principal)" : "var(--color-texto-secundario)" }}>
                            {prop.split("(")[0].trim()}
                          </span>
                        </label>
                        {EXPLICACIONES_PROPIEDADES[prop] && (
                          <div className={estilos.tooltipFlotante}>
                            <span className={estilos.tooltipTitulo}>{prop}</span>
                            <span className={estilos.tooltipTexto}>{EXPLICACIONES_PROPIEDADES[prop]}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Propiedades Personalizadas (Custom) */}
                <div style={{ marginTop: "12px", borderTop: "1px dashed rgba(255, 255, 255, 0.05)", paddingTop: "12px" }}>
                  <div className={estilos.labelForm} style={{ marginBottom: "6px" }}>Propiedades Personalizadas:</div>
                  <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
                    <input
                      type="text"
                      id="input-propiedad-custom"
                      placeholder="Ej. Recarga 6, Fuego Rápido..."
                      className={estilos.inputForm}
                      style={{ flex: 1, fontSize: "12px" }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val && !oPropiedadesArma.includes(val)) {
                            setOPropiedadesArma((prev) => [...prev, val]);
                            (e.target as HTMLInputElement).value = "";
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      className={estilos.botonAgregarDinamico}
                      style={{ padding: "4px 10px", fontSize: "11px", height: "auto" }}
                      onClick={() => {
                        const input = document.getElementById("input-propiedad-custom") as HTMLInputElement;
                        const val = input?.value.trim();
                        if (val && !oPropiedadesArma.includes(val)) {
                          setOPropiedadesArma((prev) => [...prev, val]);
                          input.value = "";
                        }
                      }}
                    >
                      + Añadir
                    </button>
                  </div>

                  {/* Renderizar Badges de propiedades personalizadas añadidas */}
                  {oPropiedadesArma.filter(p => !PROPIEDADES_ARMAS_DND.includes(p)).length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {oPropiedadesArma.filter(p => !PROPIEDADES_ARMAS_DND.includes(p)).map((prop) => (
                        <span 
                          key={prop} 
                          style={{ 
                            display: "inline-flex", 
                            alignItems: "center", 
                            gap: "6px", 
                            background: "rgba(168, 85, 247, 0.15)", 
                            border: "1px solid hsl(270, 70%, 60%)", 
                            color: "hsl(270, 100%, 85%)",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "500"
                          }}
                        >
                          {prop}
                          <X 
                            size={12} 
                            style={{ cursor: "pointer", color: "var(--color-borde-cian)" }} 
                            onClick={() => setOPropiedadesArma((prev) => prev.filter((p) => p !== prop))} 
                          />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Nuevos campos de Arma: Daño Versátil y Munición Requerida */}

              <div style={{ marginTop: "12px", borderTop: "1px dashed rgba(0, 245, 212, 0.1)", paddingTop: "12px" }}>
                <div className={estilos.campoForm}>
                  <label className={estilos.labelForm}>Daño Versátil (A dos manos):</label>
                  <input
                    type="text"
                    value={oDanoVersatil}
                    onChange={(e) => setODanoVersatil(e.target.value)}
                    placeholder="Ej. 1d10, 1d12... (Opcional)"
                    className={estilos.inputForm}
                  />
                </div>
                
                {oMunicionRequerida && (
                  <div className={estilos.campoForm} style={{ marginTop: "10px", backgroundColor: "rgba(0, 245, 212, 0.03)", padding: "10px", borderRadius: "5px", border: "1px dashed rgba(0, 245, 212, 0.15)" }}>
                    <label className={estilos.labelForm} style={{ marginBottom: "8px" }}>Seleccionar Munición Vinculada (D&D 5.5e):</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "8px" }}>
                      {[
                        { id: "arrows", label: "Flechas" },
                        { id: "bolts", label: "Virotes" },
                        { id: "bullets-sling", label: "Balas de Honda" },
                        { id: "bullets-firearm", label: "Balas de Arma de Fuego" },
                        { id: "needles", label: "Agujas de Cerbatana" }
                      ].map((item) => {
                        const estaSeleccionado = oAmmunitionIndex === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              if (estaSeleccionado) {
                                setOAmmunitionIndex("");
                                setOAmmunitionName("");
                              } else {
                                setOAmmunitionIndex(item.id);
                                setOAmmunitionName(item.label);
                              }
                            }}
                            className={estilos.botonAlternadorProp}
                            style={{
                              padding: "6px 8px",
                              fontSize: "11px",
                              textAlign: "center",
                              border: estaSeleccionado ? "1.5px solid var(--color-borde-cian)" : "1px solid var(--color-borde-brutal)",
                              background: estaSeleccionado ? "rgba(0, 245, 212, 0.12)" : "transparent",
                              color: estaSeleccionado ? "var(--color-texto-principal)" : "var(--color-texto-secundario)",
                              borderRadius: "4px",
                              cursor: "pointer",
                              transition: "all 0.1s ease"
                            }}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* B. SI LA CATEGORÍA ES ARMADURA */}
          {oTipoPrincipal === "Armadura" && (
            <div className={estilos.bloqueDinamicoForm} style={{ borderColor: "rgba(255, 165, 0, 0.25)" }}>
              <div className={estilos.tituloBloqueDinamico}>
                <span>ATRIBUTOS DE PROTECCIÓN</span>
                <span className={estilos.subtituloInformacion}><Shield size={12} style={{ display: "inline", marginRight: "2px" }} /> Ficha de Armadura</span>
              </div>

              <div className={estilos.filaDobleForm}>
                <div className={estilos.campoForm}>
                  <label className={estilos.labelForm}>Clase de Armadura (CA Base):</label>
                  <input
                    type="number"
                    value={oCaBase}
                    onChange={(e) => setOCaBase(parseInt(e.target.value) || 10)}
                    placeholder="10"
                    className={estilos.inputForm}
                    min={1}
                  />
                </div>

                <div className={estilos.campoForm}>
                  <label className={estilos.labelForm}>Requisito de Fuerza (FUE):</label>
                  <input
                    type="number"
                    value={oRequisitoFuerza}
                    onChange={(e) => setORequisitoFuerza(e.target.value === "" ? "" : parseInt(e.target.value))}
                    placeholder="Ninguno"
                    className={estilos.inputForm}
                  />
                </div>
              </div>

              <div className={estilos.filaDobleForm}>
                <div className={estilos.campoForm}>
                  <label className={estilos.labelForm}>Bono de Destreza a la CA:</label>
                  <select
                    value={oBonoDestreza}
                    onChange={(e) => setOBonoDestreza(e.target.value as TipoBonoDestreza)}
                    className={estilos.selectForm}
                  >
                    <option value="Completo">Completamente Reactiva (Sin límite)</option>
                    <option value="Máximo 2">Máximo +2 Destreza (Mediana)</option>
                    <option value="Sin Bono">Sin bonificador de Destreza (Pesada)</option>
                  </select>
                </div>

                <div className={estilos.campoForm} style={{ justifyContent: "center" }}>
                  <label className={estilos.labelCheckbox} style={{ marginTop: "16px" }}>
                    <input
                      type="checkbox"
                      checked={oDesventajaSigilo}
                      onChange={(e) => setODesventajaSigilo(e.target.checked)}
                      className={estilos.checkMini}
                    />
                    <span>Desventaja en Sigilo</span>
                  </label>
                </div>
              </div>

              {/* Nuevo campo de Armadura: Tiempo para Equipar */}
              <div style={{ marginTop: "12px", borderTop: "1px dashed rgba(255, 165, 0, 0.1)", paddingTop: "12px" }}>
                <div className={estilos.campoForm}>
                  <label className={estilos.labelForm}>Tiempo para Equipar (Don/Doff):</label>
                  <input
                    type="text"
                    value={oTiempoEquipar}
                    onChange={(e) => setOTiempoEquipar(e.target.value)}
                    placeholder="Ej. 1 acción, 1 minuto, 10 minutos (Opcional)"
                    className={estilos.inputForm}
                  />
                </div>
              </div>
            </div>
          )}

          {/* C. SI LA CATEGORÍA ES EQUIPO DE AVENTURAS */}
          {oTipoPrincipal === "Equipo de Aventuras" && (
            <div className={estilos.bloqueDinamicoForm} style={{ borderColor: "rgba(255, 99, 71, 0.25)" }}>
              <div className={estilos.tituloBloqueDinamico}>
                <span>PROPIEDADES DE UTILERÍA Y EQUIPO</span>
                <span className={estilos.subtituloInformacion}><Backpack size={12} style={{ display: "inline", marginRight: "2px" }} /> Inventario</span>
              </div>

              <div className={estilos.filaDobleForm}>
                <div className={estilos.campoForm}>
                  <label className={estilos.labelForm}>Cantidad Inicial:</label>
                  <input
                    type="number"
                    value={oCantidad}
                    onChange={(e) => setOCantidad(e.target.value === "" ? "" : parseInt(e.target.value))}
                    placeholder="1"
                    className={estilos.inputForm}
                  />
                </div>

                <div className={estilos.campoForm}>
                </div>
              </div>

              {/* Módulo de Veneno Condicional */}
              {oSubcategoriaEquipo === "Consumible" && (
                <div style={{ marginTop: "12px", borderTop: "1px dashed rgba(255, 99, 71, 0.2)", paddingTop: "12px" }}>
                  <label className={estilos.labelCheckbox} style={{ marginBottom: "8px" }}>
                    <input
                      type="checkbox"
                      checked={oEsVeneno}
                      onChange={(e) => setOEsVeneno(e.target.checked)}
                      className={estilos.checkMini}
                    />
                    <span style={{ color: "hsl(120, 100%, 40%)", fontWeight: "bold", textShadow: "0 0 5px rgba(0,255,0,0.15)" }}>
                      🧪 ¿Es un Veneno (Poison)?
                    </span>
                  </label>

                  {oEsVeneno && (
                    <div 
                      style={{ 
                        border: "1px solid hsl(120, 80%, 40%)", 
                        boxShadow: "inset 0 0 10px rgba(0, 255, 0, 0.05), 0 0 10px rgba(0, 255, 0, 0.1)",
                        borderRadius: "6px",
                        padding: "12px",
                        marginTop: "8px",
                        backgroundColor: "rgba(0, 40, 0, 0.15)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px"
                      }}
                    >
                      <div className={estilos.filaDobleForm}>
                        <div className={estilos.campoForm}>
                          <label className={estilos.labelForm}>Tipo de Veneno:</label>
                          <select
                            value={oTipoVeneno}
                            onChange={(e) => setOTipoVeneno(e.target.value as any)}
                            className={estilos.selectForm}
                          >
                            <option value="Contacto">Contacto (Contact)</option>
                            <option value="Ingerido">Ingerido (Ingested)</option>
                            <option value="Inhalado">Inhalado (Inhaled)</option>
                            <option value="Lesión">Lesión (Injury)</option>
                          </select>
                        </div>
                        <div className={estilos.campoForm}>
                          <label className={estilos.labelForm}>CD Salvación (Cons.):</label>
                          <input
                            type="number"
                            min="0"
                            value={oCdSalvacionVeneno}
                            onChange={(e) => setOCdSalvacionVeneno(e.target.value === "" ? "" : parseInt(e.target.value) || "")}
                            placeholder="Ej. 13"
                            className={estilos.inputForm}
                          />
                        </div>
                      </div>
                      <div className={estilos.campoForm}>
                        <label className={estilos.labelForm}>Efecto Táctico del Veneno:</label>
                        <textarea
                          value={oEfectoVeneno}
                          onChange={(e) => setOEfectoVeneno(e.target.value)}
                          placeholder="Describe el daño de veneno y condiciones mecánicas..."
                          className={estilos.textareaBrutal}
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Módulo de Almacenamiento para Municiones */}
              {oSubcategoriaEquipo === "Munición" && (
                <div style={{ marginTop: "12px", borderTop: "1px dashed rgba(255, 99, 71, 0.2)", paddingTop: "12px" }}>
                  <div className={estilos.tituloBloqueDinamico} style={{ fontSize: "12px", marginBottom: "8px" }}>
                    <span>ALMACENAMIENTO RECOMENDADO</span>
                  </div>
                  <div className={estilos.campoForm}>
                    <label className={estilos.labelForm} style={{ marginBottom: "6px" }}>¿Dónde se almacena esta munición?:</label>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {[
                        { id: "quiver", label: "Carcaj" },
                        { id: "case-crossbow-bolt", label: "Caja de Virotes" },
                        { id: "pouch", label: "Bolsita" }
                      ].map((item) => {
                        const estaSeleccionado = oStorageIndex === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              if (estaSeleccionado) {
                                setOStorageIndex("");
                                setOStorageName("");
                              } else {
                                setOStorageIndex(item.id);
                                setOStorageName(item.label);
                              }
                            }}
                            className={estilos.botonAlternadorProp}
                            style={{
                              flex: 1,
                              minWidth: "100px",
                              padding: "6px 10px",
                              fontSize: "11px",
                              textAlign: "center",
                              border: estaSeleccionado ? "1.5px solid var(--color-borde-naranja)" : "1px solid var(--color-borde-brutal)",
                              background: estaSeleccionado ? "rgba(255, 165, 0, 0.15)" : "transparent",
                              color: estaSeleccionado ? "var(--color-texto-principal)" : "var(--color-texto-secundario)",
                              borderRadius: "4px",
                              cursor: "pointer",
                              transition: "all 0.1s ease"
                            }}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Módulo de Contenidos para Paquetes */}
              {oSubcategoriaEquipo === "Paquete" && (
                <div style={{ marginTop: "12px", borderTop: "1px dashed rgba(255, 99, 71, 0.2)", paddingTop: "12px" }}>
                  <div className={estilos.tituloBloqueDinamico} style={{ fontSize: "12px", marginBottom: "8px" }}>
                    <span>CONTENIDO DEL PAQUETE / CONTENEDOR</span>
                  </div>
                  
                  <div style={{ display: "flex", gap: "6px", marginBottom: "10px", alignItems: "center", position: "relative" }}>
                    <div style={{ flex: 3, position: "relative" }}>
                      <input
                        type="text"
                        placeholder="🔍 Buscar objeto en el compendio..."
                        value={busquedaContenidoQuery}
                        onChange={(e) => setBusquedaContenidoQuery(e.target.value)}
                        className={estilos.inputForm}
                        style={{ fontSize: "11px", width: "100%" }}
                      />
                      {resultadosContenido.length > 0 && (
                        <div style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          backgroundColor: "var(--color-fondo-panel)",
                          border: "1.5px solid var(--color-borde-brutal)",
                          borderRadius: "4px",
                          zIndex: 50,
                          maxHeight: "180px",
                          overflowY: "auto",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                          marginTop: "2px"
                        }}>
                          {resultadosContenido.map((o) => (
                            <div
                              key={o.id}
                              onClick={() => {
                                setNuevoContenidoIndex(o.id);
                                setNuevoContenidoName(o.nombre);
                                setBusquedaContenidoQuery(o.nombre);
                              }}
                              style={{
                                padding: "6px 10px",
                                fontSize: "11px",
                                cursor: "pointer",
                                borderBottom: "1px solid rgba(255,255,255,0.03)",
                                transition: "background 0.1s ease",
                                color: nuevoContenidoIndex === o.id ? "var(--color-activo)" : "var(--color-texto-principal)"
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                              {o.nombre} <span style={{ color: "var(--color-texto-secundario)", fontSize: "9px" }}>({o.id})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      type="number"
                      min="1"
                      placeholder="Cant"
                      value={nuevoContenidoQty}
                      onChange={(e) => setNuevoContenidoQty(parseInt(e.target.value) || 1)}
                      className={estilos.inputForm}
                      style={{ width: "65px", fontSize: "11px" }}
                    />
                    <button
                      type="button"
                      className={estilos.botonAgregarDinamico}
                      style={{ fontSize: "11px", padding: "4px 10px" }}
                      onClick={() => {
                        if (nuevoContenidoIndex.trim() && nuevoContenidoName.trim()) {
                          setOContents((prev) => [
                            ...prev,
                            {
                              item: { index: nuevoContenidoIndex.trim(), name: nuevoContenidoName.trim() },
                              quantity: nuevoContenidoQty
                            }
                          ]);
                          setNuevoContenidoIndex("");
                          setNuevoContenidoName("");
                          setNuevoContenidoQty(1);
                          setBusquedaContenidoQuery("");
                        }
                      }}
                    >
                      + Añadir
                    </button>
                  </div>

                  {oContents.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", backgroundColor: "rgba(0,0,0,0.15)", padding: "8px", borderRadius: "5px" }}>
                      {oContents.map((c, idx) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "2px" }}>
                          <span>{c.quantity}x {c.item.name} <span style={{ color: "var(--color-texto-secundario)", fontSize: "9px" }}>({c.item.index})</span></span>
                          <X
                            size={12}
                            style={{ cursor: "pointer", color: "var(--color-peligro)" }}
                            onClick={() => setOContents((prev) => prev.filter((_, i) => i !== idx))}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Módulo de Elaboración (Craft) para Herramientas */}
              {oSubcategoriaEquipo === "Herramienta" && (
                <div style={{ marginTop: "12px", borderTop: "1px dashed rgba(255, 99, 71, 0.2)", paddingTop: "12px" }}>
                  <div className={estilos.tituloBloqueDinamico} style={{ fontSize: "12px", marginBottom: "8px" }}>
                    <span>OBJETOS QUE PUEDE ELABORAR (RECETAS)</span>
                  </div>
                  
                  <div style={{ display: "flex", gap: "6px", marginBottom: "10px", alignItems: "center", position: "relative" }}>
                    <div style={{ flex: 3, position: "relative" }}>
                      <input
                        type="text"
                        placeholder="🔍 Buscar receta elaborable..."
                        value={busquedaCraftQuery}
                        onChange={(e) => setBusquedaCraftQuery(e.target.value)}
                        className={estilos.inputForm}
                        style={{ fontSize: "11px", width: "100%" }}
                      />
                      {resultadosCraft.length > 0 && (
                        <div style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          backgroundColor: "var(--color-fondo-panel)",
                          border: "1.5px solid var(--color-borde-brutal)",
                          borderRadius: "4px",
                          zIndex: 50,
                          maxHeight: "180px",
                          overflowY: "auto",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                          marginTop: "2px"
                        }}>
                          {resultadosCraft.map((o) => (
                            <div
                              key={o.id}
                              onClick={() => {
                                setNuevoCraftIndex(o.id);
                                setNuevoCraftName(o.nombre);
                                setBusquedaCraftQuery(o.nombre);
                              }}
                              style={{
                                padding: "6px 10px",
                                fontSize: "11px",
                                cursor: "pointer",
                                borderBottom: "1px solid rgba(255,255,255,0.03)",
                                transition: "background 0.1s ease",
                                color: nuevoCraftIndex === o.id ? "var(--color-activo)" : "var(--color-texto-principal)"
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                              {o.nombre} <span style={{ color: "var(--color-texto-secundario)", fontSize: "9px" }}>({o.id})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className={estilos.botonAgregarDinamico}
                      style={{ fontSize: "11px", padding: "4px 10px" }}
                      onClick={() => {
                        if (nuevoCraftIndex.trim() && nuevoCraftName.trim()) {
                          setOCraft((prev) => [
                            ...prev,
                            {
                              index: nuevoCraftIndex.trim(),
                              name: nuevoCraftName.trim()
                            }
                          ]);
                          setNuevoCraftIndex("");
                          setNuevoCraftName("");
                          setBusquedaCraftQuery("");
                        }
                      }}
                    >
                      + Añadir
                    </button>
                  </div>

                  {oCraft.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {oCraft.map((c, idx) => (
                        <span key={idx} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(168, 85, 247, 0.15)", border: "1px solid hsl(270, 70%, 60%)", color: "hsl(270, 100%, 85%)", padding: "3px 8px", borderRadius: "4px", fontSize: "11px" }}>
                          🔨 {c.name}
                          <X
                            size={12}
                            style={{ cursor: "pointer", color: "var(--color-borde-cian)" }}
                            onClick={() => setOCraft((prev) => prev.filter((_, i) => i !== idx))}
                          />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- SECCIÓN 3: PROPIEDADES MÁGICAS (Módulo Mágico condicionado) --- */}
      {pestanaActiva === "magia" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          
          {/* CONTROL ES MÁGICO */}
          <div className={estilos.bloqueDinamicoForm} style={{ backgroundColor: "rgba(0, 245, 212, 0.02)", borderColor: "var(--color-borde-cian)" }}>
            <label className={estilos.labelCheckbox} style={{ fontSize: "14px", fontWeight: "bold" }}>
              <input
                type="checkbox"
                checked={oEsMagico}
                onChange={(e) => setOEsMagico(e.target.checked)}
                className={estilos.checkMini}
                disabled={oRareza !== "Común"} // Bloqueado si no es común (forzado en true)
              />
              <span style={{ color: "var(--color-borde-cian)", display: "flex", alignItems: "center", gap: "4px" }}>
                <Sparkles size={14} /> Este Objeto es Mágico {oRareza !== "Común" ? "(Auto-activado por Rareza)" : ""}
              </span>
            </label>
          </div>

          {/* ATRIBUTOS MÁGICOS ADICIONALES (Sólo si es mágico) */}
          {oEsMagico && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Toggles de Sintonización, Cargas y Propiedades Narrativas Comunes */}
              <div className={estilos.bloqueDinamicoForm}>
                <div className={estilos.filaDobleForm}>
                  <div className={estilos.campoForm} style={{ justifyContent: "center" }}>
                    <label className={estilos.labelCheckbox}>
                      <input
                        type="checkbox"
                        checked={oSintonizacionRequerida}
                        onChange={(e) => setOSintonizacionRequerida(e.target.checked)}
                        className={estilos.checkMini}
                      />
                      <span>Requiere Sintonización</span>
                    </label>
                  </div>

                  <div className={estilos.campoForm}>
                    <label className={estilos.labelForm}>Cargas Máximas:</label>
                    <input
                      type="number"
                      value={oCargas}
                      onChange={(e) => setOCargas(e.target.value === "" ? "" : parseInt(e.target.value))}
                      placeholder="Ej. 7 (Opcional)"
                      className={estilos.inputForm}
                    />
                  </div>
                </div>

                {oSintonizacionRequerida && (
                  <div className={estilos.campoForm} style={{ marginTop: "10px" }}>
                    <label className={estilos.labelForm}>Condición de Sintonización:</label>
                    <input
                      type="text"
                      value={oCondicionSintonizacion}
                      onChange={(e) => setOCondicionSintonizacion(e.target.value)}
                      placeholder="Ej. por un Mago o Elfo, alineamiento bueno..."
                      className={estilos.inputForm}
                    />
                  </div>
                )}

                {oCargas !== "" && oCargas > 0 && (
                  <div className={estilos.campoForm} style={{ marginTop: "10px" }}>
                    <label className={estilos.labelForm}>Fórmula de Recarga de Cargas:</label>
                    <input
                      type="text"
                      value={oFormulaRecarga}
                      onChange={(e) => setOFormulaRecarga(e.target.value)}
                      placeholder="Ej. 1d6+1 al amanecer..."
                      className={estilos.inputForm}
                    />
                  </div>
                )}

                <div className={estilos.filaDobleForm} style={{ marginTop: "10px", borderTop: "1px dashed rgba(255,255,255,0.05)", paddingTop: "10px" }}>
                  <div className={estilos.campoForm} style={{ justifyContent: "center" }}>
                    <label className={estilos.labelCheckbox}>
                      <input
                        type="checkbox"
                        checked={oEstaMaldito}
                        onChange={(e) => setOEstaMaldito(e.target.checked)}
                        className={estilos.checkMini}
                      />
                      <span style={{ color: "var(--color-peligro)", fontWeight: "bold" }}>💀 Objeto Maldito (Curse)</span>
                    </label>
                  </div>

                  <div className={estilos.campoForm} style={{ justifyContent: "center" }}>
                    <label className={estilos.labelCheckbox}>
                      <input
                        type="checkbox"
                        checked={oEsConsciente}
                        onChange={(e) => setOEsConsciente(e.target.checked)}
                        className={estilos.checkMini}
                      />
                      <span style={{ color: "var(--color-borde-cian)" }}>🧠 Objeto Consciente (Sentient)</span>
                    </label>
                  </div>
                </div>

                <div className={estilos.campoForm} style={{ marginTop: "10px", borderTop: "1px dashed rgba(255,255,255,0.05)", paddingTop: "10px" }}>
                  <label className={estilos.labelForm}>Modificador Mágico Directo (Ataque, Daño o Defensa):</label>
                  <input
                    type="number"
                    value={oModificadorAtaqueDano}
                    onChange={(e) => setOModificadorAtaqueDano(e.target.value === "" ? "" : parseInt(e.target.value))}
                    placeholder="Ej. 1 para un objeto +1..."
                    className={estilos.inputForm}
                    min={-5}
                    max={10}
                  />
                </div>
              </div>

              {/* MÓDULO DE EFECTOS PASIVOS / BONOS */}
              <div className={estilos.bloqueDinamicoForm}>
                <div className={estilos.tituloBloqueDinamico}>
                  <span>EFECTOS PASIVOS Y BONOS AUTOMÁTICOS</span>
                </div>

                <div className={estilos.filaAgregarBono}>
                  <div className={estilos.campoBonoCategoria}>
                    <label className={estilos.labelForm}>Tipo de Efecto:</label>
                    <select
                      value={oNuevoBonoCategoria}
                      onChange={(e) => {
                        const cat = e.target.value;
                        setONuevoBonoCategoria(cat);
                        if (OPCIONES_ATRIBUTOS[cat]) {
                          setONuevoBonoBono(OPCIONES_ATRIBUTOS[cat][0]);
                        } else {
                          setONuevoBonoBono("");
                        }
                      }}
                      className={estilos.selectForm}
                    >
                      <option value="Resistencia">Resistencia</option>
                      <option value="Inmunidad">Inmunidad</option>
                      <option value="Foco Arcano">Foco Arcano</option>
                      <option value="CA">Clase de Armadura (CA)</option>
                      <option value="CARACTERÍSTICA">Característica / Atributo</option>
                      <option value="SALVACIÓN">Salvación</option>
                      <option value="HABILIDAD">Pericia / Habilidad</option>
                      <option value="Otro">Otro Efecto</option>
                    </select>
                  </div>
                  <div className={estilos.campoBonoNombre}>
                    <label className={estilos.labelForm}>Detalle / Nombre:</label>
                    {OPCIONES_ATRIBUTOS[oNuevoBonoCategoria] ? (
                      <select
                        value={oNuevoBonoBono}
                        onChange={(e) => setONuevoBonoBono(e.target.value)}
                        className={estilos.selectForm}
                      >
                        {OPCIONES_ATRIBUTOS[oNuevoBonoCategoria].map((op) => (
                          <option key={op} value={op}>{op}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={oNuevoBonoBono}
                        onChange={(e) => setONuevoBonoBono(e.target.value)}
                        placeholder="Ej. Daño de Fuego, Sigilo..."
                        className={estilos.inputForm}
                      />
                    )}
                  </div>
                  <div className={estilos.campoBonoValor}>
                    <label className={estilos.labelForm}>Valor (Opc.):</label>
                    <input
                      type="text"
                      value={oNuevoBonoValor}
                      onChange={(e) => setONuevoBonoValor(e.target.value)}
                      placeholder="Ej. +1 o Ventaja"
                      className={estilos.inputForm}
                    />
                  </div>
                </div>

                <div className={estilos.campoForm} style={{ marginTop: "10px" }}>
                  <label className={estilos.labelForm}>Descripción del Efecto (Opcional):</label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      type="text"
                      value={oNuevoBonoDesc}
                      onChange={(e) => setONuevoBonoDesc(e.target.value)}
                      placeholder="Ej. El portador gana resistencia al daño de fuego..."
                      className={estilos.inputForm}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={agregarEfectoPasivo}
                      className={estilos.botonAgregarDinamico}
                    >
                      + Agregar
                    </button>
                  </div>
                </div>

                {/* LISTA DE EFECTOS PASIVOS APLICADOS */}
                {oEfectosPasivos.length > 0 && (
                  <div className={estilos.listaDinamicaVisual} style={{ marginTop: "10px" }}>
                    {oEfectosPasivos.map((efecto, idx) => (
                      <div key={`efecto_${idx}`} className={estilos.itemDinamicoVisual}>
                        <div className={estilos.bonoTextoInfo}>
                          <span className={estilos.bonoTagCategoria}>
                            [{efecto.tipo}]
                          </span>{" "}
                          <strong>{efecto.bono}</strong>
                          {efecto.valor !== undefined && efecto.valor !== "" && ` (${isNaN(Number(efecto.valor)) ? efecto.valor : (Number(efecto.valor) >= 0 ? `+${efecto.valor}` : efecto.valor)})`}
                          {efecto.descripcion && `: ${efecto.descripcion}`}
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarEfectoPasivoIdx(idx)}
                          className={estilos.botonEliminarDinamico}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* MÓDULO DE HECHIZOS VINCULADOS */}
              <div className={estilos.bloqueDinamicoForm}>
                <div className={estilos.tituloBloqueDinamico}>
                  <span>HECHIZOS VINCULADOS AL OBJETO</span>
                </div>

                <div className={estilos.filaAgregarBono}>
                  <div className={estilos.campoBonoNombre} style={{ flex: 2 }}>
                    <label className={estilos.labelForm}>Nombre del Hechizo:</label>
                    <input
                      type="text"
                      value={oNuevoHechizoNombre}
                      onChange={(e) => setONuevoHechizoNombre(e.target.value)}
                      placeholder="Ej. Bola de Fuego, Curar Heridas..."
                      className={estilos.inputForm}
                    />
                  </div>
                  <div className={estilos.campoBonoValor} style={{ flex: 1 }}>
                    <label className={estilos.labelForm}>CD CD (Opc.):</label>
                    <input
                      type="number"
                      value={oNuevoHechizoCd}
                      onChange={(e) => setONuevoHechizoCd(e.target.value === "" ? "" : parseInt(e.target.value))}
                      placeholder="Ej. 15"
                      className={estilos.inputForm}
                    />
                  </div>
                </div>

                <div className={estilos.filaTripleForm} style={{ marginTop: "10px" }}>
                  <div className={estilos.campoForm}>
                    <label className={estilos.labelForm}>Bono Ataque (Opc.):</label>
                    <input
                      type="number"
                      value={oNuevoHechizoBonoAtaque}
                      onChange={(e) => setONuevoHechizoBonoAtaque(e.target.value === "" ? "" : parseInt(e.target.value))}
                      placeholder="Ej. +7"
                      className={estilos.inputForm}
                    />
                  </div>
                  <div className={estilos.campoForm}>
                    <label className={estilos.labelForm}>Coste Cargas (Opc.):</label>
                    <input
                      type="number"
                      value={oNuevoHechizoCosteCargas}
                      onChange={(e) => setONuevoHechizoCosteCargas(e.target.value === "" ? "" : parseInt(e.target.value))}
                      placeholder="Ej. 1"
                      className={estilos.inputForm}
                    />
                  </div>
                  <div className={estilos.campoForm} style={{ justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={agregarHechizoVinculado}
                      className={estilos.botonAgregarDinamico}
                      style={{ width: "100%", height: "36px", marginTop: "16px" }}
                    >
                      + Añadir Hechizo
                    </button>
                  </div>
                </div>

                {/* LISTA DE HECHIZOS VINCULADOS APLICADOS */}
                {oHechizosVinculados.length > 0 && (
                  <div className={estilos.listaDinamicaVisual} style={{ marginTop: "10px" }}>
                    {oHechizosVinculados.map((hechizo, idx) => (
                      <div key={`hechizo_${idx}`} className={estilos.itemDinamicoVisual}>
                        <div className={estilos.bonoTextoInfo}>
                          <span className={estilos.bonoTagCategoria}>✨ HECHIZO</span>{" "}
                          <strong>{hechizo.nombre}</strong>
                          {hechizo.cd !== undefined && hechizo.cd !== "" && ` | CD ${hechizo.cd}`}
                          {hechizo.bonoAtaque !== undefined && hechizo.bonoAtaque !== "" && ` | Bono Ataque: +${hechizo.bonoAtaque}`}
                          {hechizo.costeCargas !== undefined && hechizo.costeCargas !== "" && ` | Coste: ${hechizo.costeCargas} c.`}
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarHechizoVinculadoIdx(idx)}
                          className={estilos.botonEliminarDinamico}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {!oEsMagico && (
            <div className={estilos.textoListaVacia} style={{ padding: "20px", border: "1px dashed rgba(255,255,255,0.05)" }}>
              Este objeto está configurado como no mágico. Selecciona una rareza superior a "Común" para habilitar las propiedades mágicas de D&D.
            </div>
          )}
        </div>
      )}

      {/* --- STICKY BOTTOM BAR (Barra de Acción Flotante) --- */}
      <div 
        className={estilos.stickyBottomBar}
        onMouseDown={detenerPropagacion}
        onMouseUp={detenerPropagacion}
      >
        {idEnEdicion && (
          <button 
            type="button" 
            onClick={cancelarEdicion} 
            className={estilos.botonStickyCancelar}
          >
            Cancelar
          </button>
        )}
        <button 
          type="submit" 
          className={estilos.botonStickyGuardar}
          disabled={!oNombre.trim() || !oTipoPrincipal}
        >
          <Save size={14} />
          {idEnEdicion ? "Guardar Cambios" : "Guardar en Compendio"}
        </button>
      </div>
    </form>
  );
};
