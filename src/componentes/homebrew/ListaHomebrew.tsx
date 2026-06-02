import React, { useState } from "react";
import { usarAlmacenDM } from "../../almacen/usarAlmacenDM";
import { MonstruoBase, HechizoBase, ObjetoHomebrew, ObjetoJuego } from "../../tipos";
import { MONSTRUOS_INICIALES, HECHIZOS_INICIALES } from "../../utiles/datosIniciales";
import {
  Edit2,
  Trash2,
  X,
  Clock,
  MapPin,
  Layers,
  Sparkles,
  Coins,
  Scale
} from "lucide-react";
import estilos from "./ListaHomebrew.module.css";

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

  // Filtrar creaciones homebrew por exclusión de datos por defecto de fábrica
  const idsInicialesMonstruos = new Set(MONSTRUOS_INICIALES.map((m) => m.id));
  const idsInicialesHechizos = new Set(HECHIZOS_INICIALES.map((h) => h.id));
  const monstruosHomebrewSinFiltro = baseDatosMonstruos.filter((m) => !idsInicialesMonstruos.has(m.id));
  const hechizosHomebrewSinFiltro = baseDatosHechizos.filter((h) => !idsInicialesHechizos.has(h.id));

  const monstruosHomebrew = monstruosHomebrewSinFiltro.filter((m) =>
    m.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase())
  );
  const hechizosHomebrew = hechizosHomebrewSinFiltro.filter((h) =>
    h.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase())
  );
  const objetosHomebrewFiltrados = objetosHomebrew.filter((o) =>
    o.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase())
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
                      if (idEnEdicion === m.id) cancelarEdicion();
                      eliminarMonstruoHomebrew(m.id);
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
                      if (idEnEdicion === h.id) cancelarEdicion();
                      eliminarHechizoHomebrew(h.id);
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
                  onClick={() => setIdObjetoDetalle(o.id)}
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
                      if (idEnEdicion === o.id) cancelarEdicion();
                      eliminarObjetoHomebrew(o.id);
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
            <div className={estilos.cabeceraDetalle}>
              <div className={estilos.cabeceraDetalleIzquierda}>
                <span className={estilos.hechizoNivelOverlay}>
                  NIVEL {hechizo.nivel === 0 ? "TRUCO" : hechizo.nivel}
                </span>
                <span className={estilos.nombreHechizoOverlay}>{hechizo.nombre}</span>
              </div>
              <button
                onClick={() => setIdHechizoDetalleCreador(null)}
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
                  <Clock size={12} className={estilos.iconoDetalle} />
                  <div>
                    <div className={estilos.metaLabel}>TIEMPO DE LANZAMIENTO</div>
                    <div className={estilos.metaValor}>{hechizo.tiempoLanzamiento}</div>
                  </div>
                </div>
                <div className={estilos.metaItem}>
                  <MapPin size={12} className={estilos.iconoDetalle} />
                  <div>
                    <div className={estilos.metaLabel}>ALCANCE / RANGO</div>
                    <div className={estilos.metaValor}>{hechizo.alcance}</div>
                  </div>
                </div>
                <div className={estilos.metaItem}>
                  <Layers size={12} className={estilos.iconoDetalle} />
                  <div>
                    <div className={estilos.metaLabel}>COMPONENTES</div>
                    <div className={estilos.metaValor}>{hechizo.componentes}</div>
                  </div>
                </div>
                <div className={estilos.metaItem}>
                  <Clock size={12} className={estilos.iconoDetalle} />
                  <div>
                    <div className={estilos.metaLabel}>DURACIÓN</div>
                    <div className={estilos.metaValor}>{hechizo.duracion || "Instantáneo"}</div>
                  </div>
                </div>
              </div>

              {/* Fila de propiedades visuales adicionales */}
              <div className={estilos.filaPropiedadesEspeciales}>
                {hechizo.concentracion && (
                  <span className={estilos.chipConcentracion}>CONCENTRACIÓN</span>
                )}
                {hechizo.ritual && <span className={estilos.chipRitual}>RITUAL</span>}
                <span className={estilos.chipEscuela}>{hechizo.escuela}</span>
              </div>

              {/* Mostrar materiales detallados si existen */}
              {hechizo.materiales && (
                <div className={estilos.seccionDescripcionFichaMargen}>
                  <div className={estilos.descripcionTituloFicha}>MATERIALES DE LANZAMIENTO</div>
                  <div className={estilos.descripcionCuerpoMateriales}>
                    {hechizo.materiales}
                  </div>
                </div>
              )}

              {/* MECÁNICAS DE COMBATE (Si tiene ataque, CD o daño) */}
              {((hechizo.ataqueCd && hechizo.ataqueCd !== "N/A") ||
                hechizo.dadosDaño ||
                (hechizo.cdSalvacion && hechizo.cdSalvacion !== "N/A")) && (
                <div className={estilos.cajaMecanicasCombate}>
                  <div className={estilos.tituloMecanicas}>
                    Mecánicas de Combate Integradas (D&D 5.5e)
                  </div>
                  <div className={estilos.gridMecanicas}>
                    {hechizo.ataqueCd && hechizo.ataqueCd !== "N/A" && (
                      <div className={estilos.itemMecanica}>
                        <span className={estilos.textoEtiquetaMecanica}>
                          Ataque/Efecto:{" "}
                        </span>
                        <strong className={estilos.valorMecanicaAtaque}>
                          {hechizo.ataqueCd}
                        </strong>
                      </div>
                    )}
                    {hechizo.cdSalvacion && hechizo.cdSalvacion !== "N/A" && (
                      <div className={estilos.itemMecanica}>
                        <span className={estilos.textoEtiquetaMecanica}>
                          CD Salvación:{" "}
                        </span>
                        <strong className={estilos.valorMecanicaCd}>CD {hechizo.cdSalvacion}</strong>
                      </div>
                    )}
                    {hechizo.dadosDaño && (
                      <div className={estilos.itemMecanica}>
                        <span className={estilos.textoEtiquetaMecanica}>Daño: </span>
                        <strong className={estilos.valorMecanicaDano}>
                          {hechizo.dadosDaño}{" "}
                          {hechizo.tipoDaño && hechizo.tipoDaño !== "N/A"
                            ? `(${hechizo.tipoDaño})`
                            : ""}
                        </strong>
                      </div>
                    )}
                    {hechizo.dadosDañoNivelSuperior && (
                      <div className={estilos.itemMecanica}>
                        <span className={estilos.textoEtiquetaMecanica}>
                          Daño Niv. Superior:{" "}
                        </span>
                        <strong className={estilos.valorMecanicaSuperior}>
                          +{hechizo.dadosDañoNivelSuperior}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Descripción Completa */}
              <div className={estilos.seccionDescripcionFicha}>
                <div className={estilos.descripcionTituloFicha}>DESCRIPCIÓN DEL CONJURO</div>
                <div 
                  className={estilos.descripcionCuerpoFicha}
                  dangerouslySetInnerHTML={{ __html: hechizo.descripcion }}
                />
              </div>

              {/* A niveles superiores si existe */}
              {hechizo.descNivelSuperior && (
                <div className={estilos.seccionDescripcionFicha}>
                  <div className={estilos.descripcionTituloFichaActivo}>
                    A NIVELES SUPERIORES
                  </div>
                  <div 
                    className={estilos.descripcionCuerpoFichaSecundario}
                    dangerouslySetInnerHTML={{ __html: hechizo.descNivelSuperior }}
                  />
                </div>
              )}

              {/* Clases disponibles si existen */}
              {hechizo.clases && hechizo.clases.length > 0 && (
                <div className={estilos.seccionDescripcionFichaMargenGrande}>
                  <div className={estilos.descripcionTituloFicha}>
                    CLASES QUE PUEDEN UTILIZAR ESTE CONJURO
                  </div>
                  <div className={estilos.listaBadgesClases}>
                    {hechizo.clases.map((clase) => (
                      <span key={clase} className={estilos.badgeClase}>
                        {clase}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Overlay Detalle Objeto en Creador */}
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
              <div className={estilos.cabeceraDetalleIzquierda}>
                <span className={estilos.objetoNivelOverlay}>
                  {objeto.tipoPrincipal} {objeto.subcategoria ? `| ${objeto.subcategoria}` : ""}
                </span>
                <span className={estilos.nombreHechizoOverlay}>{objeto.nombre}</span>
              </div>
              <button
                onClick={() => setIdObjetoDetalle(null)}
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
                    ✨ MÁGICO
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
                          {objeto.dadoDano} ({objeto.tipoDano})
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
                  </div>
                </div>
              )}

              {/* ATRIBUTOS DE EQUIPO DE AVENTURAS */}
              {objeto.tipoPrincipal === "Equipo de Aventuras" && (objeto.cargas || objeto.sintonizacionRequerida) && (
                <div className={estilos.cajaMecanicasCombateObjeto} style={{ borderColor: "rgba(255, 99, 71, 0.25)" }}>
                  <div className={estilos.tituloMecanicasObjeto} style={{ color: "var(--color-peligro)" }}>
                    Propiedades de Aventura
                  </div>
                  <div className={estilos.gridMecanicas}>
                    {objeto.cargas && (
                      <div className={estilos.itemMecanica}>
                        <span className={estilos.textoEtiquetaMecanica}>Cargas Máximas: </span>
                        <strong className={estilos.valorMecanicaDano}>{objeto.cargas}</strong>
                      </div>
                    )}
                    {objeto.sintonizacionRequerida && (
                      <div className={estilos.itemMecanica}>
                        <span className={estilos.textoEtiquetaMecanica}>Sintonización: </span>
                        <strong className={estilos.valorMecanicaCd}>Requerida</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

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

              {/* Bonificaciones Mágicas Dinámicas */}
              {objeto.bonosMagicos && objeto.bonosMagicos.length > 0 && (
                <div className={estilos.seccionDescripcionFichaMargenGrande}>
                  <div className={estilos.descripcionTituloFicha}>BONOS MÁGICOS Y MEJORAS ACTIVAS</div>
                  <div className={estilos.listaBonosMagicos}>
                    {objeto.bonosMagicos.map((bono: { categoria: string; bono?: string; valor: number }, idx: number) => (
                      <div key={idx} className={estilos.cajaBonoMagico}>
                        <span className={estilos.textoEtiquetaMecanica}>
                          {bono.categoria} {bono.bono ? `(${bono.bono})` : ""}
                        </span>
                        <strong className={estilos.valorMecanicaAtaque}>+{bono.valor}</strong>
                      </div>
                    ))}
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
    </div>
  );
};
