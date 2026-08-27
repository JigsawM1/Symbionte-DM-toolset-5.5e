import React, { useState, useMemo } from "react";
import type {
  ObjetoInventario,
  Rareza,
  Arma,
  Armadura,
  ObjetoJuego,
  EfectoPasivo,
  HechizoVinculado,
  TipoContenedor
} from "@/tipos";
import {
  X,
  Swords,
  Shield,
  Package,
  Sparkles,
  Link2,
  Zap,
  Weight,
  Coins,
  Check,
  Save,
  BookOpen,
  Box
} from "lucide-react";
import { CONFIG_CONTENEDORES } from "@/servicios/calculadorInventario";
import estilos from "./HojaPersonaje.module.css";

interface ModalDetalleObjetoInventarioProps {
  objeto: ObjetoInventario;
  baseDatosObjetos?: ObjetoJuego[];
  totalSintonizados: number;
  alCerrar: () => void;
  alAlternarEquipado?: () => void;
  alAlternarSintonizado?: () => void;
  alActualizarNotas?: (notas: string) => void;
  alCambiarContenedor?: (contenedor: TipoContenedor) => void;
}

const CLASES_RAREZA: Record<Rareza, string> = {
  "Común": estilos.rarezaComun,
  "Poco Común": estilos.rarezaPocoComun,
  "Raro": estilos.rarezaRaro,
  "Muy Raro": estilos.rarezaMuyRaro,
  "Legendario": estilos.rarezaLegendario,
  "Artefacto": estilos.rarezaArtefacto
};

export const ModalDetalleObjetoInventario: React.FC<ModalDetalleObjetoInventarioProps> = ({
  objeto,
  baseDatosObjetos,
  totalSintonizados,
  alCerrar,
  alAlternarEquipado,
  alAlternarSintonizado,
  alActualizarNotas,
  alCambiarContenedor
}) => {
  const [notasTemp, setNotasTemp] = useState(objeto.notas || "");
  const [notasGuardadas, setNotasGuardadas] = useState(false);

  // Buscar objeto del compendio para obtener datos enriquecidos (descripción, valor, daño, propiedades)
  const objetoBase = useMemo<ObjetoJuego | null>(() => {
    if (!baseDatosObjetos) return null;
    const normalizar = (s: string) => s.toLowerCase().trim();
    return (
      baseDatosObjetos.find(
        (o) => o.id === objeto.idObjeto || normalizar(o.nombre) === normalizar(objeto.nombre)
      ) || null
    );
  }, [baseDatosObjetos, objeto.idObjeto, objeto.nombre]);

  const pesoUnitario = Number(objeto.pesoLb) || Number(objetoBase?.pesoLb) || 0;
  const pesoTotal = Math.round(pesoUnitario * (Number(objeto.cantidad) || 1) * 100) / 100;
  const valorPO = Number(objetoBase?.valorPO) || 0;
  const rareza = (objeto.rareza as Rareza) || (objetoBase?.rareza as Rareza) || "Común";
  const rarezaClass = CLASES_RAREZA[rareza] || estilos.rarezaComun;
  const subcategoria = objetoBase?.subcategoria;

  const puedeSintonizar = objeto.sintonizado || totalSintonizados < 3;

  const esArma = objeto.tipoPrincipal === "Arma" || objetoBase?.tipoPrincipal === "Arma";
  const esArmadura = objeto.tipoPrincipal === "Armadura" || objetoBase?.tipoPrincipal === "Armadura";
  const armaObj = esArma && objetoBase?.tipoPrincipal === "Arma" ? (objetoBase as Arma) : null;
  const armaduraObj = esArmadura && objetoBase?.tipoPrincipal === "Armadura" ? (objetoBase as Armadura) : null;

  const descripcion = objetoBase?.descripcion || objeto.notas || "";

  const manejarGuardarNotas = () => {
    if (alActualizarNotas) {
      alActualizarNotas(notasTemp);
      setNotasGuardadas(true);
      setTimeout(() => setNotasGuardadas(false), 2000);
    }
  };

  return (
    <div className={estilos.overlayModal} onClick={alCerrar}>
      <div
        className={estilos.contenedorModal}
        style={{ maxWidth: 540 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Visor */}
        <div className={estilos.cabeceraModal}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {esArma && <Swords size={18} color="#f87171" />}
            {esArmadura && <Shield size={18} color="#60a5fa" />}
            {!esArma && !esArmadura && (
              objeto.esMagico || objetoBase?.esMagico ? (
                <Sparkles size={18} color="#a855f7" />
              ) : (
                <Package size={18} color="#34d399" />
              )
            )}
            <div>
              <h3 className={estilos.tituloModal} style={{ margin: 0, fontSize: 16 }}>
                {objeto.nombre}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <span className={`${estilos.badgeMeta} ${rarezaClass}`}>
                  {rareza}
                </span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                  {objeto.tipoPrincipal} {subcategoria ? `• ${subcategoria}` : ""}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className={estilos.botonCerrarModal}
            onClick={alCerrar}
            title="Cerrar visor"
          >
            <X size={16} />
          </button>
        </div>

        {/* Cuerpo del Visor con scroll táctico */}
        <div
          className={estilos.cuerpoModal}
          style={{ maxHeight: "75vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, padding: 16 }}
        >
          {/* Rejilla de Métricas Principales */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
              gap: 8,
              backgroundColor: "rgba(15, 23, 42, 0.75)",
              padding: 10,
              borderRadius: 6,
              border: "1px solid rgba(148, 163, 184, 0.15)"
            }}
          >
            {/* Peso */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                <Weight size={11} /> Peso
              </span>
              <strong style={{ fontSize: 12, color: "#f8fafc" }}>
                {pesoTotal > 0 ? `${pesoTotal} lb` : "0 lb"}
                {objeto.cantidad > 1 && (
                  <span style={{ fontSize: 10, color: "#64748b", fontWeight: 400, marginLeft: 4 }}>
                    ({pesoUnitario} c/u)
                  </span>
                )}
              </strong>
            </div>

            {/* Valor */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                <Coins size={11} /> Valor
              </span>
              <strong style={{ fontSize: 12, color: "#fbbf24" }}>
                {valorPO > 0 ? `${valorPO} PO` : "—"}
              </strong>
            </div>

            {/* Cantidad */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>
                Cantidad
              </span>
              <strong style={{ fontSize: 12, color: "#38bdf8" }}>
                ×{objeto.cantidad}
              </strong>
            </div>

            {/* Daño si es Arma */}
            {esArma && armaObj && (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>
                  Daño Base
                </span>
                <strong style={{ fontSize: 12, color: "#f87171" }}>
                  {armaObj.dadoDano} {armaObj.tipoDano}
                </strong>
              </div>
            )}

            {/* CA si es Armadura */}
            {esArmadura && armaduraObj && (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>
                  Clase Armadura
                </span>
                <strong style={{ fontSize: 12, color: "#60a5fa" }}>
                  CA {armaduraObj.caBase}
                </strong>
              </div>
            )}

            {/* Cargas si aplica */}
            {objeto.cargasMaximas !== undefined && (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                  <Zap size={11} color="#fbbf24" /> Cargas
                </span>
                <strong style={{ fontSize: 12, color: "#fbbf24" }}>
                  {objeto.cargasActuales ?? objeto.cargasMaximas} / {objeto.cargasMaximas}
                </strong>
              </div>
            )}
          </div>

          {/* Estadísticas Detalladas de Arma */}
          {esArma && armaObj && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, backgroundColor: "rgba(15, 23, 42, 0.4)", padding: 10, borderRadius: 6, border: "1px solid rgba(248, 113, 113, 0.2)" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                {armaObj.tipoAtaque && (
                  <span className={estilos.badgeMeta} style={{ backgroundColor: "rgba(248, 113, 113, 0.15)", color: "#fca5a5", border: "1px solid rgba(248, 113, 113, 0.3)" }}>
                    {armaObj.tipoAtaque}
                  </span>
                )}
                {armaObj.danoVersatil && (
                  <span className={estilos.badgeMeta} style={{ backgroundColor: "rgba(251, 191, 36, 0.15)", color: "#fde047", border: "1px solid rgba(251, 191, 36, 0.3)" }}>
                    Versátil ({armaObj.danoVersatil})
                  </span>
                )}
                {armaObj.alcanceNormal && (
                  <span className={estilos.badgeMeta} style={{ backgroundColor: "rgba(56, 189, 248, 0.15)", color: "#7dd3fc", border: "1px solid rgba(56, 189, 248, 0.3)" }}>
                    Alcance {armaObj.alcanceNormal}/{armaObj.alcanceLargo || armaObj.alcanceNormal} pies
                  </span>
                )}
                {armaObj.maestria && (
                  <span className={estilos.badgeMeta} style={{ backgroundColor: "rgba(168, 85, 247, 0.15)", color: "#d8b4fe", border: "1px solid rgba(168, 85, 247, 0.3)" }}>
                    Maestría: {armaObj.maestria}
                  </span>
                )}
              </div>

              {armaObj.propiedades && armaObj.propiedades.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                  {armaObj.propiedades.map((p) => (
                    <span key={p} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, backgroundColor: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", color: "#cbd5e1" }}>
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Estadísticas Detalladas de Armadura */}
          {esArmadura && armaduraObj && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, backgroundColor: "rgba(15, 23, 42, 0.4)", padding: 10, borderRadius: 6, border: "1px solid rgba(96, 165, 250, 0.2)" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                <span className={estilos.badgeMeta} style={{ backgroundColor: "rgba(96, 165, 250, 0.15)", color: "#93c5fd", border: "1px solid rgba(96, 165, 250, 0.3)" }}>
                  Bono Destreza: {armaduraObj.bonoDestreza || "Completo"}
                </span>
                {armaduraObj.requisitoFuerza && (
                  <span className={estilos.badgeMeta} style={{ backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#fcd34d", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
                    Fuerza Requerida: {armaduraObj.requisitoFuerza}
                  </span>
                )}
                {armaduraObj.desventajaSigilo && (
                  <span className={estilos.badgeMeta} style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#fca5a5", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                    Desventaja en Sigilo
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Estado de Sintonización si aplica */}
          {(objeto.sintonizacionRequerida || objetoBase?.sintonizacionRequerida) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                borderRadius: 6,
                backgroundColor: objeto.sintonizado ? "rgba(168, 85, 247, 0.12)" : "rgba(15, 23, 42, 0.6)",
                border: `1px solid ${objeto.sintonizado ? "rgba(168, 85, 247, 0.4)" : "rgba(148, 163, 184, 0.2)"}`
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Link2 size={14} color={objeto.sintonizado ? "#c084fc" : "#94a3b8"} />
                <span style={{ fontSize: 12, color: objeto.sintonizado ? "#e9d5ff" : "#94a3b8" }}>
                  {objeto.sintonizado ? "Sintonizado con este personaje" : "Requiere Sintonización (No sintonizado)"}
                </span>
              </div>

              {alAlternarSintonizado && (
                <button
                  type="button"
                  onClick={alAlternarSintonizado}
                  disabled={!puedeSintonizar}
                  style={{
                    backgroundColor: objeto.sintonizado ? "rgba(239, 68, 68, 0.2)" : "rgba(168, 85, 247, 0.2)",
                    border: `1px solid ${objeto.sintonizado ? "rgba(239, 68, 68, 0.5)" : "rgba(168, 85, 247, 0.5)"}`,
                    color: objeto.sintonizado ? "#fca5a5" : "#d8b4fe",
                    padding: "4px 10px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: puedeSintonizar ? "pointer" : "not-allowed"
                  }}
                >
                  {objeto.sintonizado ? "Desintonizar" : "Sintonizar"}
                </button>
              )}
            </div>
          )}

          {/* Ubicación y Contenedor Especial */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#f59e0b", textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 4 }}>
              <Box size={12} /> Ubicación / Contenedor
            </span>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(115px, 1fr))",
                gap: 6,
                backgroundColor: "rgba(15, 23, 42, 0.5)",
                padding: 8,
                borderRadius: 6,
                border: "1px solid rgba(148, 163, 184, 0.12)"
              }}
            >
              {(["mochila", "bolsa_contencion", "montura", "almacen"] as TipoContenedor[]).map((contClave) => {
                const info = CONFIG_CONTENEDORES[contClave];
                const seleccionado = (objeto.contenedor || "mochila") === contClave;
                return (
                  <button
                    key={contClave}
                    type="button"
                    onClick={() => alCambiarContenedor && alCambiarContenedor(contClave)}
                    disabled={objeto.equipado && contClave !== "mochila"}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "6px 8px",
                      borderRadius: 4,
                      backgroundColor: seleccionado ? `${info.color}22` : "rgba(255, 255, 255, 0.03)",
                      border: `1px solid ${seleccionado ? info.color : "rgba(148, 163, 184, 0.15)"}`,
                      color: seleccionado ? "#ffffff" : "#94a3b8",
                      cursor: (objeto.equipado && contClave !== "mochila") ? "not-allowed" : "pointer",
                      transition: "all 0.15s ease",
                      gap: 2,
                      opacity: (objeto.equipado && contClave !== "mochila") ? 0.4 : 1
                    }}
                    title={info.descripcion}
                  >
                    <span style={{ fontSize: 10, fontWeight: 700, color: seleccionado ? info.color : "#cbd5e1" }}>
                      {info.nombreCorto}
                    </span>
                    <span style={{ fontSize: 8.5, color: info.sumaCargaPersonaje ? "#94a3b8" : "#34d399" }}>
                      {info.sumaCargaPersonaje ? "Suma carga" : "0 lb carga"}
                    </span>
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 10, color: "#64748b", padding: "0 4px" }}>
              {(objeto.contenedor || "mochila") === "mochila" ? (
                "🎒 Llevas este objeto encima. Su peso cuenta para tu capacidad de carga."
              ) : (objeto.contenedor === "bolsa_contencion") ? (
                "🌀 Guardado en la Bolsa de Contención (Bag of Holding). Su peso es 0 lb sobre tu personaje."
              ) : (objeto.contenedor === "montura") ? (
                "🐎 Transportado por tu montura, mula o carreta. No penaliza tu capacidad de carga."
              ) : (
                "📦 Guardado en tu almacén, base o campamento. No penaliza tu capacidad de carga."
              )}
            </div>
          </div>

          {/* Descripción Completa */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 4 }}>
              <BookOpen size={12} /> Descripción y Reglas
            </span>
            <div
              style={{
                fontSize: 12,
                color: "#cbd5e1",
                lineHeight: 1.6,
                backgroundColor: "rgba(15, 23, 42, 0.5)",
                padding: "10px 12px",
                borderRadius: 6,
                border: "1px solid rgba(148, 163, 184, 0.12)",
                whiteSpace: "pre-wrap"
              }}
            >
              {descripcion ? descripcion : "Sin descripción adicional disponible."}
            </div>
          </div>

          {/* Contenido del Paquete si posee contents */}
          {objetoBase?.contents && objetoBase.contents.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#34d399", textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 4 }}>
                <Package size={12} /> Contenido del Paquete ({objetoBase.contents.length} objetos)
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {objetoBase.contents.map((itemContenido: { item: { name: string; index: string }; quantity: number }, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 10px",
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                      borderRadius: 4,
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      fontSize: 11,
                      color: "#f1f5f9"
                    }}
                  >
                    <span>{itemContenido.item.name}</span>
                    <strong style={{ color: "#38bdf8" }}>×{itemContenido.quantity}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Efectos Pasivos si posee */}
          {objetoBase?.efectosPasivos && objetoBase.efectosPasivos.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#c084fc", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Efectos Pasivos y Bonos
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {objetoBase.efectosPasivos.map((efecto: EfectoPasivo, idx: number) => (
                  <div key={idx} style={{ padding: "6px 10px", backgroundColor: "rgba(168, 85, 247, 0.08)", borderRadius: 4, border: "1px solid rgba(168, 85, 247, 0.2)", fontSize: 11, color: "#e9d5ff" }}>
                    <strong>[{efecto.tipo}] {efecto.bono}</strong>: {efecto.descripcion || efecto.valor}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hechizos Vinculados si posee */}
          {objetoBase?.hechizosVinculados && objetoBase.hechizosVinculados.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#a855f7", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Hechizos Vinculados
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {objetoBase.hechizosVinculados.map((hechizo: HechizoVinculado, idx: number) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", backgroundColor: "rgba(168, 85, 247, 0.08)", borderRadius: 4, border: "1px solid rgba(168, 85, 247, 0.2)", fontSize: 11, color: "#e9d5ff" }}>
                    <span>{hechizo.nombre}</span>
                    <span>{hechizo.cd !== undefined ? `CD ${hechizo.cd}` : ""} {hechizo.costeCargas !== undefined ? `(${hechizo.costeCargas} cargas)` : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notas Personales del Jugador */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#fbbf24", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Notas Personales
              </span>
              {notasGuardadas && (
                <span style={{ fontSize: 11, color: "#34d399", display: "flex", alignItems: "center", gap: 3 }}>
                  <Check size={12} /> Guardado
                </span>
              )}
            </div>

            <textarea
              className={estilos.textareaFormulario}
              value={notasTemp}
              onChange={(e) => setNotasTemp(e.target.value)}
              placeholder="Añade notas sobre el origen, marcas, runas o uso de este objeto..."
              rows={2}
            />

            {alActualizarNotas && (
              <button
                type="button"
                className={estilos.botonAccionPrimario}
                onClick={manejarGuardarNotas}
                style={{ alignSelf: "flex-end", padding: "4px 10px", fontSize: 11 }}
              >
                <Save size={12} style={{ marginRight: 4 }} />
                Guardar Notas
              </button>
            )}
          </div>
        </div>

        {/* Pie del Modal con Acciones Rápidas */}
        <div className={estilos.pieModal} style={{ justifyContent: "space-between" }}>
          <div>
            {(esArma || esArmadura) && alAlternarEquipado && (
              <button
                type="button"
                onClick={alAlternarEquipado}
                className={objeto.equipado ? estilos.botonDesequipar : estilos.botonEquipar}
              >
                {objeto.equipado ? "Desequipar" : "Equipar"}
              </button>
            )}
          </div>

          <button
            type="button"
            className={estilos.botonAccionSecundario}
            onClick={alCerrar}
          >
            Cerrar Visor
          </button>
        </div>
      </div>
    </div>
  );
};
