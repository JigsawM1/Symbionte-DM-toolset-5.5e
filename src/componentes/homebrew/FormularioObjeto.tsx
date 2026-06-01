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
    oValorPO, setOValorPO,
    oEsMagico, setOEsMagico,
    oBonosMagicos,
    oTipoPrincipal, setOTipoPrincipal,

    oSubcategoriaArma, setOSubcategoriaArma,
    oTipoAtaque, setOTipoAtaque,
    oDadoDano, setODadoDano,
    oTipoDano, setOTipoDano,
    oPropiedadesArma, setOPropiedadesArma,
    oMaestria, setOMaestria,
    oAlcanceNormal, setOAlcanceNormal,
    oAlcanceLargo, setOAlcanceLargo,

    oSubcategoriaArmadura, alCambiarSubcategoriaArmadura,
    oCaBase, setOCaBase,
    oRequisitoFuerza, setORequisitoFuerza,
    oDesventajaSigilo, setODesventajaSigilo,
    oBonoDestreza, setOBonoDestreza,

    oSubcategoriaEquipo, setOSubcategoriaEquipo,
    oCantidad, setOCantidad,
    oSintonizacionRequerida, setOSintonizacionRequerida,
    oCargas, setOCargas,

    oNuevoBonoCategoria, setONuevoBonoCategoria,
    oNuevoBonoBono, setONuevoBonoBono,
    oNuevoBonoValor, setONuevoBonoValor,

    cargarObjeto,
    limpiarFormulario,
    agregarBonoMagico,
    eliminarBonoMagicoIdx,
    manejarGuardarObjeto
  } = usarFormularioObjeto(idEnEdicion, alGuardarExitoso);

  // Pestaña activa del formulario
  const [pestanaActiva, setPestanaActiva] = useState<"general" | "atributos" | "magia">("general");

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

  // Si la rareza cambia, verificar si es mágicos para activar pestaña de magia
  const tieneDatosMagicos = oEsMagico || oRareza !== "Común" || oBonosMagicos.length > 0;

  // Detener clics accidentales al lienzo 3D de TaleSpire
  const detenerPropagacion = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

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
                <Coins size={12} /> Valor / Costo (PO):
              </label>
              <input
                type="number"
                value={oValorPO}
                onChange={(e) => setOValorPO(parseInt(e.target.value) || 0)}
                placeholder="0 PO"
                className={estilos.inputForm}
              />
            </div>
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

                <div className={estilos.campoForm} style={{ justifyContent: "center" }}>
                  {/* Se mantiene sintonización y cargas aquí para objetos de inventario generales */}
                  <label className={estilos.labelCheckbox} style={{ marginTop: "16px" }}>
                    <input
                      type="checkbox"
                      checked={oSintonizacionRequerida}
                      onChange={(e) => setOSintonizacionRequerida(e.target.checked)}
                      className={estilos.checkMini}
                    />
                    <span>Sintonización Requerida</span>
                  </label>
                </div>
              </div>

              <div className={estilos.filaDobleForm}>
                <div className={estilos.campoForm}>
                  <label className={estilos.labelForm}>Cargas Máximas (Opcional):</label>
                  <input
                    type="number"
                    value={oCargas}
                    onChange={(e) => setOCargas(e.target.value === "" ? "" : parseInt(e.target.value))}
                    placeholder="Ninguna"
                    className={estilos.inputForm}
                  />
                </div>
              </div>
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
              {/* Toggles de Sintonización y Cargas (para Armas/Armaduras, ya que equipo de aventuras lo tiene embebido) */}
              {oTipoPrincipal !== "Equipo de Aventuras" && (
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
                        placeholder="Ej. 7"
                        className={estilos.inputForm}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* MÓDULO DE BONOS MÁGICOS DINÁMICOS AL PERSONAJE */}
              <div className={estilos.bloqueDinamicoForm}>
                <div className={estilos.tituloBloqueDinamico}>
                  <span>EFECTOS DINÁMICOS Y MEJORAS AL PORTADOR</span>
                </div>

                <div className={estilos.filaAgregarBono}>
                  <div className={estilos.campoBonoCategoria}>
                    <label className={estilos.labelForm}>Categoría del Bono:</label>
                    <select
                      value={oNuevoBonoCategoria}
                      onChange={(e) => setONuevoBonoCategoria(e.target.value)}
                      className={estilos.selectForm}
                    >
                      <option value="CA">Clase de Armadura (CA)</option>
                      <option value="CARACTERÍSTICA">Característica / Atributo</option>
                      <option value="SALVACIÓN">Salvación</option>
                      <option value="HABILIDAD">Pericia / Habilidad</option>
                      <option value="OTRO">Otro Bono</option>
                    </select>
                  </div>
                  <div className={estilos.campoBonoNombre}>
                    <label className={estilos.labelForm}>Nombre / Atributo:</label>
                    <input
                      type="text"
                      value={oNuevoBonoBono}
                      onChange={(e) => setONuevoBonoBono(e.target.value)}
                      placeholder="Ej. Fuerza, Sigilo, CA"
                      className={estilos.inputForm}
                    />
                  </div>
                  <div className={estilos.campoBonoValor}>
                    <label className={estilos.labelForm}>Valor:</label>
                    <input
                      type="number"
                      value={oNuevoBonoValor}
                      onChange={(e) => setONuevoBonoValor(parseInt(e.target.value) || 0)}
                      className={estilos.inputForm}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={agregarBonoMagico}
                    className={estilos.botonAgregarDinamico}
                  >
                    + Agregar
                  </button>
                </div>

                {/* LISTA DE BONOS MÁGICOS APLICADOS */}
                {oBonosMagicos.length > 0 && (
                  <div className={estilos.listaDinamicaVisual}>
                    {oBonosMagicos.map((bono, idx) => (
                      <div key={`bono_${idx}`} className={estilos.itemDinamicoVisual}>
                        <div className={estilos.bonoTextoInfo}>
                          <span className={estilos.bonoTagCategoria}>
                            [{bono.categoria}]
                          </span>{" "}
                          {bono.bono}: <strong>{bono.valor >= 0 ? `+${bono.valor}` : bono.valor}</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarBonoMagicoIdx(idx)}
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
