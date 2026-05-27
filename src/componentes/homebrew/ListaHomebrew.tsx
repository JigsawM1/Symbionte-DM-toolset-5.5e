import React, { useState } from "react";
import { usarAlmacenDM } from "../../almacen/usarAlmacenDM";
import { MonstruoBase, HechizoBase, ObjetoHomebrew } from "../../tipos";
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
  const {
    baseDatosMonstruos,
    baseDatosHechizos,
    objetosHomebrew,
    eliminarMonstruoHomebrew,
    eliminarHechizoHomebrew,
    eliminarObjetoHomebrew
  } = usarAlmacenDM();

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
                {(hechizo.concentracion === true ||
                  hechizo.concentracion === "Sí" ||
                  hechizo.concentracion === "Si") && (
                  <span className={estilos.chipConcentracion}>CONCENTRACIÓN</span>
                )}
                {(hechizo.ritual === true ||
                  hechizo.ritual === "Sí" ||
                  hechizo.ritual === "Si") && <span className={estilos.chipRitual}>RITUAL</span>}
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
                <div className={estilos.descripcionCuerpoFicha}>{hechizo.descripcion}</div>
              </div>

              {/* A niveles superiores si existe */}
              {hechizo.descNivelSuperior && (
                <div className={estilos.seccionDescripcionFicha}>
                  <div className={estilos.descripcionTituloFichaActivo}>
                    A NIVELES SUPERIORES
                  </div>
                  <div className={estilos.descripcionCuerpoFichaSecundario}>
                    {hechizo.descNivelSuperior}
                  </div>
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
      {idObjetoDetalle && (() => {
        const objeto = objetosHomebrew.find((o) => o.id === idObjetoDetalle);
        if (!objeto) return null;
        return (
          <div className={estilos.panelDetalleOverlay}>
            <div className={estilos.cabeceraDetalle}>
              <div className={estilos.cabeceraDetalleIzquierda}>
                <span className={estilos.objetoNivelOverlay}>
                  {objeto.categoria || "OBJETO"}
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
                    <div className={estilos.metaValor}>{objeto.rareza || "Común"}</div>
                  </div>
                </div>
                {objeto.costoValor !== undefined && objeto.costoValor > 0 && (
                  <div className={estilos.metaItem}>
                    <Coins size={12} className={estilos.iconoDetalle} />
                    <div>
                      <div className={estilos.metaLabel}>VALOR / COSTE</div>
                      <div className={estilos.metaValor}>
                        {objeto.costoValor} {objeto.costoUnidad || "PO"}
                      </div>
                    </div>
                  </div>
                )}
                {objeto.peso && (
                  <div className={estilos.metaItem}>
                    <Scale size={12} className={estilos.iconoDetalle} />
                    <div>
                      <div className={estilos.metaLabel}>PESO</div>
                      <div className={estilos.metaValor}>{objeto.peso}</div>
                    </div>
                  </div>
                )}
                {objeto.alcance && (
                  <div className={estilos.metaItem}>
                    <MapPin size={12} className={estilos.iconoDetalle} />
                    <div>
                      <div className={estilos.metaLabel}>ALCANCE</div>
                      <div className={estilos.metaValor}>{objeto.alcance}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fila de propiedades visuales adicionales */}
              <div className={estilos.filaPropiedadesEspeciales}>
                {objeto.tipoArma && objeto.tipoArma !== "N/A" && (
                  <span className={estilos.chipConcentracion}>ARMA {objeto.tipoArma}</span>
                )}
                {objeto.estiloAtaque && objeto.estiloAtaque !== "N/A" && (
                  <span className={estilos.chipRitual}>{objeto.estiloAtaque}</span>
                )}
                {objeto.propiedades && (
                  <span className={estilos.chipEscuela}>{objeto.propiedades}</span>
                )}
              </div>

              {/* MECÁNICAS DE COMBATE DE ARMA (Si es arma y tiene daño o bonos) */}
              {(objeto.dadosDaño || objeto.bonoAtaque || objeto.bonoDaño) && (
                <div className={estilos.cajaMecanicasCombateObjeto}>
                  <div className={estilos.tituloMecanicasObjeto}>
                    Propiedades de Combate del Arma (D&D 5.5e)
                  </div>
                  <div className={estilos.gridMecanicas}>
                    {objeto.dadosDaño && (
                      <div className={estilos.itemMecanica}>
                        <span className={estilos.textoEtiquetaMecanica}>Daño base: </span>
                        <strong className={estilos.valorMecanicaDano}>
                          {objeto.dadosDaño}{" "}
                          {objeto.tipoDaño && objeto.tipoDaño !== "N/A"
                            ? `(${objeto.tipoDaño})`
                            : ""}
                        </strong>
                      </div>
                    )}
                    {objeto.bonoAtaque && (
                      <div className={estilos.itemMecanica}>
                        <span className={estilos.textoEtiquetaMecanica}>
                          Bono Ataque Mágico:{" "}
                        </span>
                        <strong className={estilos.valorMecanicaCd}>+{objeto.bonoAtaque}</strong>
                      </div>
                    )}
                    {objeto.bonoDaño && (
                      <div className={estilos.itemMecanica}>
                        <span className={estilos.textoEtiquetaMecanica}>
                          Bono Daño Mágico:{" "}
                        </span>
                        <strong className={estilos.valorMecanicaDano}>+{objeto.bonoDaño}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Propiedades del arma en badges */}
              {objeto.propiedadesArma && objeto.propiedadesArma.length > 0 && (
                <div className={estilos.seccionDescripcionFichaMargenGrande}>
                  <div className={estilos.descripcionTituloFicha}>PROPIEDADES TÁCTICAS DEL ARMA</div>
                  <div className={estilos.listaBadgesClases}>
                    {objeto.propiedadesArma.map((prop: string) => (
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
                    {objeto.bonosMagicos.map((bono: any, idx: number) => (
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
                <div className={estilos.descripcionCuerpoFicha}>{objeto.descripcion}</div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
