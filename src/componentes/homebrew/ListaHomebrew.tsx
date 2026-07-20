import React, { useState } from "react";
import { usarAlmacenDM, normalizarTexto } from "../../almacen/usarAlmacenDM";
import { MonstruoBase, HechizoBase, ObjetoHomebrew, ObjetoJuego } from "../../tipos";
import { MONSTRUOS_INICIALES, HECHIZOS_INICIALES } from "../../utiles/datosIniciales";
import {
  Edit2,
  Trash2,
  X,
  MapPin,
  Sparkles,
  Coins,
  Scale
} from "lucide-react";
import estilos from "./ListaHomebrew.module.css";
import { ConfirmDialog } from "../ConfirmDialog";
import { FichaHechizo } from "../hechizos/FichaHechizo";

interface Props {
  tipoHomebrew: "criatura" | "hechizo" | "objeto";
  iniciarEdicionCriatura: (m: MonstruoBase) => void;
  iniciarEdicionHechizo: (h: HechizoBase) => void;
  iniciarEdicionObjeto: (o: ObjetoHomebrew) => void;
  cancelarEdicion: () => void;
  idEnEdicion: string | null;
}

export const ListaHomebrew: React.FC<Props> = ({
  tipoHomebrew,
  iniciarEdicionCriatura,
  iniciarEdicionHechizo,
  iniciarEdicionObjeto,
  cancelarEdicion,
  idEnEdicion
}) => {
  const baseDatosMonstruos = usarAlmacenDM((s) => s.baseDatosMonstruos);
  const baseDatosHechizos = usarAlmacenDM((s) => s.baseDatosHechizos);
  const objetosHomebrew = usarAlmacenDM((s) => s.objetosHomebrew);
  const eliminarMonstruoHomebrew = usarAlmacenDM((s) => s.eliminarMonstruoHomebrew);
  const eliminarHechizoHomebrew = usarAlmacenDM((s) => s.eliminarHechizoHomebrew);
  const eliminarObjetoHomebrew = usarAlmacenDM((s) => s.eliminarObjetoHomebrew);

  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [idHechizoDetalleCreador, setIdHechizoDetalleCreador] = useState<string | null>(null);
  const [idObjetoDetalle, setIdObjetoDetalle] = useState<string | null>(null);
  const [historialDetalle, setHistorialDetalle] = useState<string[]>([]);
  
  const navegarAObjeto = (idDestino: string) => {
    if (idObjetoDetalle) {
      setHistorialDetalle((prev) => [...prev, idObjetoDetalle]);
    }
    setIdObjetoDetalle(idDestino);
  };

  const navegarAtras = () => {
    if (historialDetalle.length > 0) {
      const nuevoHistorial = [...historialDetalle];
      const anteriorId = nuevoHistorial.pop();
      setHistorialDetalle(nuevoHistorial);
      if (anteriorId) {
        setIdObjetoDetalle(anteriorId);
      }
    }
  };
  const [confirmarAccion, setConfirmarAccion] = useState<{
    titulo: string;
    mensaje: string;
    onConfirmar: () => void;
  } | null>(null);

  // Filtrar creaciones homebrew por exclusión de datos por defecto de fábrica
  const idsInicialesMonstruos = new Set(MONSTRUOS_INICIALES.map((m) => m.id));
  const idsInicialesHechizos = new Set(HECHIZOS_INICIALES.map((h) => h.id));
  const monstruosHomebrewSinFiltro = baseDatosMonstruos.filter((m) => !idsInicialesMonstruos.has(m.id));
  const hechizosHomebrewSinFiltro = baseDatosHechizos.filter((h) => !idsInicialesHechizos.has(h.id));

  const queryNormalizada = normalizarTexto(filtroBusqueda);
  const monstruosHomebrew = monstruosHomebrewSinFiltro.filter((m) =>
    (m.nombreNormalizado || normalizarTexto(m.nombre)).includes(queryNormalizada)
  );
  const hechizosHomebrew = hechizosHomebrewSinFiltro.filter((h) =>
    (h.nombreNormalizado || normalizarTexto(h.nombre)).includes(queryNormalizada)
  );
  const objetosHomebrewFiltrados = objetosHomebrew.filter((o) =>
    (o.nombreNormalizado || normalizarTexto(o.nombre)).includes(queryNormalizada)
  );

  const cantExistentes =
    tipoHomebrew === "criatura"
      ? monstruosHomebrew.length
      : tipoHomebrew === "hechizo"
      ? hechizosHomebrew.length
      : objetosHomebrewFiltrados.length;

  return (
    <div className={estilos.panelLista}>
      <div className={estilos.cabeceraPanel}>
        CREACIONES PERSISTIDAS ({cantExistentes})
      </div>

      {/* BUSCADOR INTERACTIVO EN EL PANEL DE HOMEBREW */}
      <div className={estilos.cajaBuscadorHomebrew}>
        <input
          type="text"
          value={filtroBusqueda}
          onChange={(e) => setFiltroBusqueda(e.target.value)}
          placeholder={`Filtrar ${
            tipoHomebrew === "criatura"
              ? "criaturas"
              : tipoHomebrew === "hechizo"
              ? "hechizos"
              : "objetos"
          }...`}
          className={estilos.inputBuscadorHomebrew}
        />
        {filtroBusqueda && (
          <button
            onClick={() => setFiltroBusqueda("")}
            className={estilos.botonLimpiarBusquedaHomebrew}
            type="button"
          >
            Limpiar
          </button>
        )}
      </div>

      <div className={estilos.contenedorScrollLista}>
        {tipoHomebrew === "criatura" &&
          (monstruosHomebrew.length === 0 ? (
            <div className={estilos.textoListaVacia}>No se encontraron criaturas.</div>
          ) : (
            monstruosHomebrew.map((m) => (
              <div key={m.id} className={estilos.itemListaBrutal}>
                <div className={estilos.itemInfoLista}>
                  <span className={estilos.itemNombre}>{m.nombre}</span>
                  <span className={estilos.itemSub}>
                    {m.tipo} | CA: <span className="dato-numerico">{m.ca}</span> | HP:{" "}
                    <span className="dato-numerico">{m.vidaMaxima}</span> | CR: {m.desafio}
                  </span>
                </div>
                <div className={estilos.grupoBotonesItem}>
                  <button
                    onClick={() => iniciarEdicionCriatura(m)}
                    className={estilos.botonEditarItem}
                    title="Editar creación"
                    type="button"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setConfirmarAccion({
                        titulo: "Borrar Monstruo",
                        mensaje: `¿Estás seguro de que deseas borrar el monstruo "${m.nombre}" del homebrew? Esta acción no se puede deshacer.`,
                        onConfirmar: () => {
                          if (idEnEdicion === m.id) cancelarEdicion();
                          eliminarMonstruoHomebrew(m.id);
                        }
                      });
                    }}
                    className={estilos.botonEliminarItem}
                    title="Eliminar de la base de datos"
                    type="button"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          ))}

        {tipoHomebrew === "hechizo" &&
          (hechizosHomebrew.length === 0 ? (
            <div className={estilos.textoListaVacia}>No se encontraron hechizos.</div>
          ) : (
            hechizosHomebrew.map((h) => (
              <div key={h.id} className={estilos.itemListaBrutal}>
                <div
                  className={estilos.itemInfoListaClickable}
                  onClick={() => setIdHechizoDetalleCreador(h.id)}
                  title="Ver detalles del hechizo"
                >
                  <span className={estilos.itemNombre}>{h.nombre}</span>
                  <span className={estilos.itemSub}>
                    Nivel: <span className="dato-numerico">{h.nivel}</span> | {h.escuela} |{" "}
                    {h.alcance}
                  </span>
                </div>
                <div className={estilos.grupoBotonesItem}>
                  <button
                    onClick={() => iniciarEdicionHechizo(h)}
                    className={estilos.botonEditarItem}
                    title="Editar creación"
                    type="button"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setConfirmarAccion({
                        titulo: "Borrar Hechizo",
                        mensaje: `¿Estás seguro de que deseas borrar el hechizo "${h.nombre}" del homebrew? Esta acción no se puede deshacer.`,
                        onConfirmar: () => {
                          if (idEnEdicion === h.id) cancelarEdicion();
                          eliminarHechizoHomebrew(h.id);
                        }
                      });
                    }}
                    className={estilos.botonEliminarItem}
                    title="Eliminar de la base de datos"
                    type="button"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          ))}

        {tipoHomebrew === "objeto" &&
          (objetosHomebrewFiltrados.length === 0 ? (
            <div className={estilos.textoListaVacia}>No se encontraron objetos mágicos.</div>
          ) : (
            objetosHomebrewFiltrados.map((o) => (
              <div key={o.id} className={estilos.itemListaBrutal}>
                <div
                  className={estilos.itemInfoListaClickable}
                  onClick={() => {
                    setHistorialDetalle([]);
                    setIdObjetoDetalle(o.id);
                  }}
                  title="Ver detalles del objeto mágico"
                >
                  <span className={estilos.itemNombre}>{o.nombre}</span>
                  <span className={estilos.itemSub}>
                    Rareza: {o.rareza} {o.propiedades ? `| Prop.: ${o.propiedades}` : ""}
                  </span>
                </div>
                <div className={estilos.grupoBotonesItem}>
                  <button
                    onClick={() => iniciarEdicionObjeto(o)}
                    className={estilos.botonEditarItem}
                    title="Editar creación"
                    type="button"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setConfirmarAccion({
                        titulo: "Borrar Objeto",
                        mensaje: `¿Estás seguro de que deseas borrar el objeto "${o.nombre}" del homebrew? Esta acción no se puede deshacer.`,
                        onConfirmar: () => {
                          if (idEnEdicion === o.id) cancelarEdicion();
                          eliminarObjetoHomebrew(o.id);
                        }
                      });
                    }}
                    className={estilos.botonEliminarItem}
                    title="Eliminar de la base de datos"
                    type="button"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          ))}
      </div>

      {/* Overlay Detalle Hechizo en Creador */}
      {idHechizoDetalleCreador && (() => {
        const hechizo = baseDatosHechizos.find((h) => h.id === idHechizoDetalleCreador);
        if (!hechizo) return null;
        return (
          <div className={estilos.panelDetalleOverlay}>
            <FichaHechizo
              hechizo={hechizo}
              onClose={() => setIdHechizoDetalleCreador(null)}
              onEditar={() => {
                iniciarEdicionHechizo(hechizo);
                setIdHechizoDetalleCreador(null);
              }}
            />
          </div>
        );
      })()}

      {/* Overlay Detalle Objeto en Creador */}
      {idObjetoDetalle && (() => {
        const oRaw = objetosHomebrew.find((o) => o.id === idObjetoDetalle);
        if (!oRaw) return null;
        const objeto = oRaw as ObjetoJuego;
        
        const coloresRareza: Record<string, string> = {
          "Común": "hsl(0, 0%, 75%)",
          "Poco Común": "hsl(120, 60%, 45%)",
          "Raro": "hsl(210, 85%, 50%)",
          "Muy Raro": "hsl(280, 75%, 60%)",
          "Legendario": "hsl(32, 95%, 50%)",
          "Artefacto": "hsl(0, 75%, 40%)"
        };

        return (
          <div className={estilos.panelDetalleOverlay}>
            <div className={estilos.cabeceraDetalle}>
              <div className={estilos.cabeceraDetalleIzquierda} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {historialDetalle.length > 0 && (
                  <button
                    onClick={navegarAtras}
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "var(--color-texto-principal)",
                      cursor: "pointer",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      fontSize: "12px",
                      fontWeight: "bold",
                      gap: "4px"
                    }}
                    type="button"
                  >
                    ⬅ Atrás
                  </button>
                )}
                <div style={{ display: "flex", flexDirection: "row", gap: "4px" }}>
                  <span className={estilos.objetoNivelOverlay}>
                    {objeto.tipoPrincipal} {objeto.subcategoria ? `| ${objeto.subcategoria}` : ""}
                  </span>
                  <span className={estilos.nombreHechizoOverlay}>{objeto.nombre}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setIdObjetoDetalle(null);
                  setHistorialDetalle([]);
                }}
                className={estilos.botonCerrarDetalle}
                type="button"
              >
                <X size={15} />
              </button>
            </div>
            <div className={estilos.cuerpoDetalle}>
              {/* Grid Metadatos */}
              <div className={estilos.gridMetadatos}>
                <div className={estilos.metaItem}>
                  <Sparkles size={12} className={estilos.iconoDetalle} />
                  <div>
                    <div className={estilos.metaLabel}>RAREZA</div>
                    <div className={estilos.metaValor} style={{ color: coloresRareza[objeto.rareza] || "var(--color-texto-principal)", fontWeight: "bold" }}>
                      {objeto.rareza || "Común"}
                    </div>
                  </div>
                </div>
                {objeto.valorPO !== undefined && objeto.valorPO > 0 && (
                  <div className={estilos.metaItem}>
                    <Coins size={12} className={estilos.iconoDetalle} />
                    <div>
                      <div className={estilos.metaLabel}>VALOR / COSTE</div>
                      <div className={estilos.metaValor}>
                        {objeto.valorPO} PO
                      </div>
                    </div>
                  </div>
                )}
                {objeto.pesoLb !== undefined && (
                  <div className={estilos.metaItem}>
                    <Scale size={12} className={estilos.iconoDetalle} />
                    <div>
                      <div className={estilos.metaLabel}>PESO</div>
                      <div className={estilos.metaValor}>{objeto.pesoLb} lb</div>
                    </div>
                  </div>
                )}
                {objeto.tipoPrincipal === "Arma" && objeto.alcanceNormal && (
                  <div className={estilos.metaItem}>
                    <MapPin size={12} className={estilos.iconoDetalle} />
                    <div>
                      <div className={estilos.metaLabel}>ALCANCE</div>
                      <div className={estilos.metaValor}>
                        {objeto.alcanceNormal}/{objeto.alcanceLargo || objeto.alcanceNormal} pies
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fila de propiedades visuales adicionales */}
              <div className={estilos.filaPropiedadesEspeciales}>
                {objeto.esMagico && (
                  <span className={estilos.chipConcentracion} style={{ backgroundColor: "rgba(0, 245, 212, 0.12)", color: "var(--color-borde-cian)", border: "1px solid var(--color-borde-cian)" }}>
                     MÁGICO
                  </span>
                )}
                {objeto.tipoPrincipal === "Arma" && (
                  <span className={estilos.chipRitual}>Arma {objeto.tipoAtaque}</span>
                )}
                {objeto.tipoPrincipal === "Armadura" && (
                  <span className={estilos.chipRitual}>{objeto.bonoDestreza}</span>
                )}
              </div>

              {/* MECÁNICAS DE COMBATE DE ARMA */}
              {objeto.tipoPrincipal === "Arma" && (
                <div className={estilos.cajaMecanicasCombateObjeto}>
                  <div className={estilos.tituloMecanicasObjeto}>
                    Propiedades de Combate del Arma (D&D 5.5e)
                  </div>
                  <div className={estilos.gridMecanicas}>
                    {objeto.dadoDano && (
                      <div className={estilos.itemMecanica}>
                        <span className={estilos.textoEtiquetaMecanica}>Daño base: </span>
                        <strong className={estilos.valorMecanicaDano}>
                          {objeto.dadoDano} ({objeto.tipoDano.charAt(0).toUpperCase() + objeto.tipoDano.slice(1)})
                        </strong>
                      </div>
                    )}
                    {objeto.maestria && (
                      <div className={estilos.itemMecanica}>
                        <span className={estilos.textoEtiquetaMecanica}>Maestría: </span>
                        <strong className={estilos.valorMecanicaCd} style={{ color: "var(--color-advertencia)" }}>
                          {objeto.maestria}
                        </strong>
                      </div>
                    )}
                    {objeto.danoVersatil && (
                      <div className={estilos.itemMecanica}>
                        <span className={estilos.textoEtiquetaMecanica}>A dos manos: </span>
                        <strong className={estilos.valorMecanicaDano}>{objeto.danoVersatil}</strong>
                      </div>
                    )}
                    {objeto.municionRequerida !== undefined && (
                      <div className={estilos.itemMecanica}>
                        <span className={estilos.textoEtiquetaMecanica}>Usa Munición: </span>
                        <strong className={estilos.valorMecanicaCd}>{objeto.municionRequerida ? "Sí" : "No"}</strong>
                      </div>
                    )}
                    {objeto.ammunition && (
                      <div className={estilos.itemMecanica}>
                        <span className={estilos.textoEtiquetaMecanica}>Munición: </span>
                        {(() => {
                          const idDestino = objeto.ammunition.index;
                          const existeDestino = objetosHomebrew.some(o => o.id === idDestino || normalizarTexto(o.nombre) === normalizarTexto(objeto.ammunition!.name));
                          if (existeDestino) {
                            return (
                              <strong
                                onClick={() => {
                                  const found = objetosHomebrew.find(o => o.id === idDestino || normalizarTexto(o.nombre) === normalizarTexto(objeto.ammunition!.name));
                                  if (found) navegarAObjeto(found.id);
                                }}
                                style={{ color: "var(--color-borde-cian)", cursor: "pointer", textDecoration: "underline" }}
                              >
                                {objeto.ammunition.name}
                              </strong>
                            );
                          }
                          return <strong className={estilos.valorMecanicaCd}>{objeto.ammunition.name}</strong>;
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MECÁNICAS DE ARMADURA */}
              {objeto.tipoPrincipal === "Armadura" && (
                <div className={estilos.cajaMecanicasCombateObjeto} style={{ borderColor: "rgba(255, 165, 0, 0.25)" }}>
                  <div className={estilos.tituloMecanicasObjeto} style={{ color: "var(--color-advertencia)" }}>
                    Protección y Sigilo (D&D 5e)
                  </div>
                  <div className={estilos.gridMecanicas}>
                    <div className={estilos.itemMecanica}>
                      <span className={estilos.textoEtiquetaMecanica}>CA Base: </span>
                      <strong className={estilos.valorMecanicaDano}>{objeto.caBase}</strong>
                    </div>
                    {objeto.requisitoFuerza && (
                      <div className={estilos.itemMecanica}>
                        <span className={estilos.textoEtiquetaMecanica}>FUE Requerida: </span>
                        <strong className={estilos.valorMecanicaCd}>FUE {objeto.requisitoFuerza}</strong>
                      </div>
                    )}
                    <div className={estilos.itemMecanica}>
                      <span className={estilos.textoEtiquetaMecanica}>Desv. Sigilo: </span>
                      <strong className={objeto.desventajaSigilo ? estilos.valorMecanicaSuperior : estilos.valorMecanicaCd} style={{ color: objeto.desventajaSigilo ? "var(--color-peligro)" : "var(--color-exito)" }}>
                        {objeto.desventajaSigilo ? "Sí" : "No"}
                      </strong>
                    </div>
                    {objeto.tiempoEquipar && (
                      <div className={estilos.itemMecanica}>
                        <span className={estilos.textoEtiquetaMecanica}>Tiempo Equipar: </span>
                        <strong className={estilos.valorMecanicaCd}>{objeto.tiempoEquipar}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PROPIEDADES MÁGICAS Y NARRATIVAS COMUNES */}
              {(objeto.cargas || objeto.sintonizacionRequerida || objeto.estaMaldito || objeto.esConsciente || (objeto.modificadorAtaqueDano !== undefined && objeto.modificadorAtaqueDano !== null)) && (
                <div className={estilos.cajaMecanicasCombateObjeto} style={{ borderColor: "var(--color-borde-cian)" }}>
                  <div className={estilos.tituloMecanicasObjeto} style={{ color: "var(--color-borde-cian)" }}>
                    Propiedades Mágicas y Narrativas
                  </div>
                  
                  {/* Toggles narrativos llamativos */}
                  {(objeto.estaMaldito || objeto.esConsciente) && (
                    <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                      {objeto.estaMaldito && (
                        <span style={{ fontSize: "11px", fontWeight: "bold", background: "rgba(239, 68, 68, 0.15)", border: "1px solid var(--color-peligro)", color: "var(--color-peligro)", padding: "2px 6px", borderRadius: "4px" }}>
                           OBJETO MALDITO
                        </span>
                      )}
                      {objeto.esConsciente && (
                        <span style={{ fontSize: "11px", fontWeight: "bold", background: "rgba(6, 182, 212, 0.15)", border: "1px solid var(--color-borde-cian)", color: "var(--color-borde-cian)", padding: "2px 6px", borderRadius: "4px" }}>
                           OBJETO CONSCIENTE
                        </span>
                      )}
                    </div>
                  )}

                  <div className={estilos.gridMecanicas}>
                    {objeto.cargas && (
                      <div className={estilos.itemMecanica}>
                        <span className={estilos.textoEtiquetaMecanica}>Cargas Máximas: </span>
                        <strong className={estilos.valorMecanicaDano}>
                          {objeto.cargas}
                          {objeto.formulaRecarga && ` (${objeto.formulaRecarga})`}
                        </strong>
                      </div>
                    )}
                    {objeto.sintonizacionRequerida && (
                      <div className={estilos.itemMecanica}>
                        <span className={estilos.textoEtiquetaMecanica}>Sintonización: </span>
                        <strong className={estilos.valorMecanicaCd} style={{ color: "var(--color-borde-cian)" }}>
                          Requerida
                          {objeto.condicionSintonizacion && ` (${objeto.condicionSintonizacion})`}
                        </strong>
                      </div>
                    )}
                    {objeto.modificadorAtaqueDano !== undefined && objeto.modificadorAtaqueDano !== null && (
                      <div className={estilos.itemMecanica}>
                        <span className={estilos.textoEtiquetaMecanica}>Bono Mágico Directo: </span>
                        <strong className={estilos.valorMecanicaAtaque}>+{objeto.modificadorAtaqueDano}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MECÁNICAS DE MUNICIÓN O ALMACENAMIENTO */}
              {(() => {
                const cantidadItem = "cantidad" in objeto ? (objeto as any).cantidad as number | undefined : undefined;
                if (!objeto.storage && cantidadItem === undefined) return null;
                
                return (
                  <div className={estilos.cajaMecanicasCombateObjeto} style={{ borderColor: "rgba(0, 245, 212, 0.25)" }}>
                    <div className={estilos.tituloMecanicasObjeto} style={{ color: "var(--color-borde-cian)" }}>
                      Propiedades de Munición y Almacenamiento
                    </div>
                    <div className={estilos.gridMecanicas}>
                      {cantidadItem !== undefined && (
                        <div className={estilos.itemMecanica}>
                          <span className={estilos.textoEtiquetaMecanica}>Cantidad: </span>
                          <strong className={estilos.valorMecanicaDano}>{cantidadItem}</strong>
                        </div>
                      )}
                    {objeto.storage && (
                      <div className={estilos.itemMecanica}>
                        <span className={estilos.textoEtiquetaMecanica}>Almacenamiento: </span>
                        {(() => {
                          const idDestino = objeto.storage.index;
                          const existeDestino = objetosHomebrew.some(o => o.id === idDestino || normalizarTexto(o.nombre) === normalizarTexto(objeto.storage!.name));
                          if (existeDestino) {
                            return (
                              <strong
                                onClick={() => {
                                  const found = objetosHomebrew.find(o => o.id === idDestino || normalizarTexto(o.nombre) === normalizarTexto(objeto.storage!.name));
                                  if (found) navegarAObjeto(found.id);
                                }}
                                style={{ color: "var(--color-borde-cian)", cursor: "pointer", textDecoration: "underline" }}
                              >
                                {objeto.storage.name}
                              </strong>
                            );
                          }
                          return <strong className={estilos.valorMecanicaCd}>{objeto.storage.name}</strong>;
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}

              {/* Propiedades del arma en badges */}
              {objeto.tipoPrincipal === "Arma" && objeto.propiedades && objeto.propiedades.length > 0 && (
                <div className={estilos.seccionDescripcionFichaMargenGrande}>
                  <div className={estilos.descripcionTituloFicha}>PROPIEDADES TÁCTICAS DEL ARMA</div>
                  <div className={estilos.listaBadgesClases}>
                    {objeto.propiedades.map((prop: string) => (
                      <span key={prop} className={estilos.badgeClaseObjeto}>
                        {prop}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Efectos Pasivos Aplicados */}
              {objeto.efectosPasivos && objeto.efectosPasivos.length > 0 && (
                <div className={estilos.seccionDescripcionFichaMargenGrande}>
                  <div className={estilos.descripcionTituloFicha}>EFECTOS PASIVOS Y BONOS AUTOMÁTICOS</div>
                  <div className={estilos.listaBonosMagicos} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {objeto.efectosPasivos.map((efecto: { tipo: string; bono: string; valor?: number | string; descripcion?: string }, idx: number) => (
                      <div key={idx} className={estilos.cajaBonoMagico} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px", padding: "8px 12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                          <span className={estilos.textoEtiquetaMecanica} style={{ color: "var(--color-borde-cian)" }}>
                            [{efecto.tipo}] <strong>{efecto.bono}</strong>
                          </span>
                          {efecto.valor !== undefined && efecto.valor !== "" && (
                            <strong className={estilos.valorMecanicaAtaque}>
                              {isNaN(Number(efecto.valor)) ? efecto.valor : (Number(efecto.valor) >= 0 ? `+${efecto.valor}` : efecto.valor)}
                            </strong>
                          )}
                        </div>
                        {efecto.descripcion && (
                          <span style={{ fontSize: "11px", color: "var(--color-texto-secundario)", marginTop: "2px" }}>
                            {efecto.descripcion}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hechizos Vinculados */}
              {objeto.hechizosVinculados && objeto.hechizosVinculados.length > 0 && (
                <div className={estilos.seccionDescripcionFichaMargenGrande}>
                  <div className={estilos.descripcionTituloFicha}>HECHIZOS VINCULADOS AL OBJETO</div>
                  <div className={estilos.listaBonosMagicos} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {objeto.hechizosVinculados.map((hechizo: { nombre: string; cd?: number; bonoAtaque?: number; costeCargas?: number }, idx: number) => (
                      <div key={idx} className={estilos.cajaBonoMagico} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px" }}>
                        <div>
                          <strong style={{ color: "var(--color-texto-principal)" }}>{hechizo.nombre}</strong>
                          <div style={{ display: "flex", gap: "8px", fontSize: "10px", color: "var(--color-texto-secundario)", marginTop: "2px" }}>
                            {hechizo.cd !== undefined && <span>CD {hechizo.cd}</span>}
                            {hechizo.bonoAtaque !== undefined && <span>Ataque: +{hechizo.bonoAtaque}</span>}
                          </div>
                        </div>
                        {hechizo.costeCargas !== undefined && (
                          <span style={{ fontSize: "11px", fontWeight: "bold", background: "rgba(0,0,0,0.2)", padding: "2px 6px", borderRadius: "4px", color: "var(--color-advertencia)" }}>
                            Coste: {hechizo.costeCargas} carga{hechizo.costeCargas > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Receta de Artesanía */}
              {objeto.artesania && (objeto.artesania.tallerRequerido || (objeto.artesania.componentes && objeto.artesania.componentes.length > 0)) && (
                <div className={estilos.seccionDescripcionFichaMargenGrande}>
                  <div className={estilos.descripcionTituloFicha}>RECETA DE ARTESANÍA Y CRAFTEO</div>
                  <div className={estilos.cajaMecanicasCombateObjeto} style={{ borderColor: "rgba(168, 85, 247, 0.25)", margin: 0 }}>
                    {objeto.artesania.tallerRequerido && (
                      <div style={{ marginBottom: "8px" }}>
                        <span className={estilos.textoEtiquetaMecanica}>Taller de Trabajo: </span>
                        <strong style={{ color: "var(--color-texto-principal)" }}>{objeto.artesania.tallerRequerido}</strong>
                      </div>
                    )}
                    {objeto.artesania.componentes && objeto.artesania.componentes.length > 0 && (
                      <div>
                        <span className={estilos.textoEtiquetaMecanica} style={{ display: "block", marginBottom: "4px" }}>Materiales y Componentes:</span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {objeto.artesania.componentes.map((comp: string, idx: number) => (
                            <span key={idx} style={{ fontSize: "11px", background: "rgba(168, 85, 247, 0.15)", border: "1px solid hsl(270, 70%, 50%)", color: "hsl(270, 100%, 85%)", padding: "2px 6px", borderRadius: "4px" }}>
                              {comp}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Contenido del Paquete */}
              {objeto.contents && objeto.contents.length > 0 && (
                <div className={estilos.seccionDescripcionFichaMargenGrande}>
                  <div className={estilos.descripcionTituloFicha}>CONTENIDO DEL PAQUETE</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {objeto.contents.map((c: any, idx: number) => {
                      const idDestino = c.item.index;
                      const existeDestino = objetosHomebrew.some(o => o.id === idDestino || normalizarTexto(o.nombre) === normalizarTexto(c.item.name));
                      
                      return (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255,255,255,0.04)", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <span style={{ fontSize: "12px", color: "var(--color-texto-principal)" }}>
                            {c.quantity}x {c.item.name}
                          </span>
                          {existeDestino ? (
                            <button
                              type="button"
                              onClick={() => {
                                const found = objetosHomebrew.find(o => o.id === idDestino || normalizarTexto(o.nombre) === normalizarTexto(c.item.name));
                                if (found) navegarAObjeto(found.id);
                              }}
                              style={{
                                background: "rgba(0, 245, 212, 0.12)",
                                border: "1px solid var(--color-borde-cian)",
                                color: "var(--color-borde-cian)",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                fontSize: "10px",
                                cursor: "pointer",
                                fontWeight: "bold"
                              }}
                            >
                              Ver Objeto 
                            </button>
                          ) : (
                            <span style={{ fontSize: "10px", color: "var(--color-texto-secundario)", fontStyle: "italic" }}>
                              No disponible
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Objetos Elaborables (Craft) */}
              {objeto.craft && objeto.craft.length > 0 && (
                <div className={estilos.seccionDescripcionFichaMargenGrande}>
                  <div className={estilos.descripcionTituloFicha}>OBJETOS QUE PUEDE ELABORAR</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {objeto.craft.map((c: any, idx: number) => {
                      const idDestino = c.index;
                      const existeDestino = objetosHomebrew.some(o => o.id === idDestino || normalizarTexto(o.nombre) === normalizarTexto(c.name));
                      
                      if (existeDestino) {
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              const found = objetosHomebrew.find(o => o.id === idDestino || normalizarTexto(o.nombre) === normalizarTexto(c.name));
                              if (found) navegarAObjeto(found.id);
                            }}
                            style={{
                              fontSize: "11px",
                              background: "rgba(168, 85, 247, 0.15)",
                              border: "1px solid hsl(270, 70%, 50%)",
                              color: "hsl(270, 100%, 85%)",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "bold",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                             {c.name}
                          </button>
                        );
                      }
                      
                      return (
                        <span
                          key={idx}
                          style={{
                            fontSize: "11px",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "var(--color-texto-secundario)",
                            padding: "4px 8px",
                            borderRadius: "4px"
                          }}
                        >
                          {c.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Descripción Completa */}
              <div className={estilos.seccionDescripcionFicha}>
                <div className={estilos.descripcionTituloFicha}>
                  DESCRIPCIÓN DEL OBJETO MÁGICO
                </div>
                <div 
                  className={estilos.descripcionCuerpoFicha}
                  dangerouslySetInnerHTML={{ __html: objeto.descripcion }}
                />
              </div>
            </div>
          </div>
        );
      })()}
      {/* Modal de confirmación personalizado de alta calidad */}
      <ConfirmDialog
        abierto={confirmarAccion !== null}
        titulo={confirmarAccion?.titulo || ""}
        mensaje={confirmarAccion?.mensaje || ""}
        onConfirmar={() => {
          if (confirmarAccion) {
            confirmarAccion.onConfirmar();
            setConfirmarAccion(null);
          }
        }}
        onCancelar={() => setConfirmarAccion(null)}
      />
    </div>
  );
};
