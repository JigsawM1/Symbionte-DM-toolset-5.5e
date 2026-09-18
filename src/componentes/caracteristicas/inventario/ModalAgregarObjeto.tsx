import React, { useState, useMemo, useEffect } from "react";
import type { ObjetoJuego, ObjetoInventario, Arma, Armadura, Escudo, TipoContenedor } from "@/tipos";
import { DICCIONARIO_CATEGORIAS_EQUIPO, type CategoriaEquipo } from "@/constantes/categoriasEquipoConstantes";
import { FileText, X, Plus, Sparkles, Package, Backpack, Box, Shield } from "lucide-react";
import { SelectorSugerencias, OpcionSugerencia } from "@/componentes/comunes/SelectorSugerencias";
import { TooltipUniversal } from "@/componentes/comunes/TooltipUniversal";
import {
  crearObjetoInventarioDesdeCompendio,
  crearObjetoInventarioCustom
} from "@/servicios/calculadorInventario";
import {
  obtenerInfoMaestria,
  obtenerInfoPropiedadArma,
  obtenerInfoPropiedadArmadura
} from "@/servicios/resolutorPropiedades";
import { desduplicarEntidades } from "@/utiles/busquedaTolerante";
import estilos from "@/componentes/caracteristicas/personajes/HojaPersonaje.module.css";

export type TabModalAgregar = "compendio" | "otrasPosesiones";

interface ModalAgregarObjetoProps {
  tabInicial?: TabModalAgregar;
  baseDatosObjetos: ObjetoJuego[];
  alAgregarObjeto: (objeto: ObjetoInventario | ObjetoInventario[]) => void;
  alCerrar: () => void;
}

type FiltroTipo = "todos" | CategoriaEquipo;

const CATEGORIAS_FILTRO: { id: FiltroTipo; etiqueta: string }[] = [
  { id: "todos", etiqueta: "Todos" },
  { id: "armas", etiqueta: "Armas" },
  { id: "armaduras", etiqueta: "Armaduras" },
  { id: "escudos", etiqueta: "Escudos" },
  { id: "consumibles", etiqueta: "Consumibles" },
  { id: "municion", etiqueta: "Munición" },
  { id: "herramientas", etiqueta: "Herramientas" },
  { id: "focos-magicos", etiqueta: "Focos" },
  { id: "contenedores", etiqueta: "Contenedores" },
  { id: "paquetes-equipo", etiqueta: "Paquetes" },
  { id: "objetos-magicos", etiqueta: "Mágicos" },
  { id: "equipo-aventurero", etiqueta: "Varios" }
];

const OPCIONES_CONTENEDOR_DESTINO: {
  clave: TipoContenedor;
  nombre: string;
  subtitulo: string;
  color: string;
}[] = [
  {
    clave: "mochila",
    nombre: "Mochila",
    subtitulo: "Carga directa",
    color: "#f59e0b"
  },
  {
    clave: "bolsa_contencion",
    nombre: "Bolsa Contención",
    subtitulo: "0 lb carga",
    color: "#c084fc"
  },
  {
    clave: "montura",
    nombre: "Montura",
    subtitulo: "0 lb carga",
    color: "#38bdf8"
  },
  {
    clave: "almacen",
    nombre: "Almacén",
    subtitulo: "0 lb carga",
    color: "#94a3b8"
  }
];

export const ModalAgregarObjeto: React.FC<ModalAgregarObjetoProps> = ({
  tabInicial = "compendio",
  baseDatosObjetos,
  alAgregarObjeto,
  alCerrar
}) => {
  const [tabActiva, setTabActiva] = useState<TabModalAgregar>(tabInicial);
  const [contenedorDestino, setContenedorDestino] = useState<TipoContenedor>("mochila");

  useEffect(() => {
    setTabActiva(tabInicial);
  }, [tabInicial]);

  // --- Estado para Modo Compendio ---
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [objetoSeleccionadoId, setObjetoSeleccionadoId] = useState<string | null>(null);
  const [cantidadCompendio, setCantidadCompendio] = useState(1);

  // Objetos filtrados por categoría y desduplicados
  const objetosFiltrados = useMemo(() => {
    const listaBase = desduplicarEntidades(baseDatosObjetos);
    if (filtroTipo === "todos") return listaBase;
    return listaBase.filter((o) => o.categoria === filtroTipo);
  }, [baseDatosObjetos, filtroTipo]);

  // Opciones estructuradas y organizadas por subcategoría con ordenamiento específico
  const opcionesSugerencias = useMemo<OpcionSugerencia[]>(() => {
    // 1. Clonar y ordenar la lista de objetos
    const listaOrdenada = [...objetosFiltrados].sort((a, b) => {
      // Si ambos son armaduras, ordenar por CA ascendente; si empatan, alfabético
      if (a.categoria === "armaduras" && b.categoria === "armaduras") {
        const caA = (a as Armadura).caBase || 0;
        const caB = (b as Armadura).caBase || 0;
        if (caA !== caB) return caA - caB;
        return a.nombre.localeCompare(b.nombre, "es");
      }

      // Para todos los demás objetos (armas, equipo, etc.), orden estrictamente alfabético
      return a.nombre.localeCompare(b.nombre, "es");
    });

    // 2. Definir orden de presentación de los grupos
    const PRIORIDAD_GRUPOS: Record<string, number> = {
      // Armas
      "Armas Sencillas (Cuerpo a Cuerpo)": 10,
      "Armas Sencillas (A Distancia)": 11,
      "Armas Marciales (Cuerpo a Cuerpo)": 12,
      "Armas Marciales (A Distancia)": 13,
      "Armas de Fuego": 14,
      // Armaduras
      "Armaduras Ligeras": 20,
      "Armaduras Medianas": 21,
      "Armaduras Pesadas": 22,
      "Escudos": 23,
      // Equipo
      "Consumibles y Pociones": 30,
      "Municiones": 31,
      "Herramientas": 32,
      "Focos Mágicos": 33,
      "Contenedores y Almacenamiento": 34,
      "Paquetes de Equipo": 35,
      "Objetos Mágicos y Maravillosos": 36,
      "Equipo de Aventuras": 37
    };

    // 3. Mapear a OpcionSugerencia
    const itemsConPrioridad = listaOrdenada.map((obj) => {
      let grupo = "Equipo de Aventuras";

      if (obj.categoria === "armas") {
        const arma = obj as Arma;
        const sub = arma.subcategoria || "Sencilla";
        const tipoAtk = arma.tipoAtaque ? ` (${arma.tipoAtaque})` : "";
        if (sub === "Sencilla") grupo = `Armas Sencillas${tipoAtk}`;
        else if (sub === "Marcial") grupo = `Armas Marciales${tipoAtk}`;
        else if (sub === "De Fuego") grupo = "Armas de Fuego";
        else grupo = `Armas ${sub}`;
      } else if (obj.categoria === "armaduras") {
        const armadura = obj as Armadura;
        if (armadura.subcategoria === "Ligera") {
          grupo = "Armaduras Ligeras";
        } else if (armadura.subcategoria === "Mediana") {
          grupo = "Armaduras Medianas";
        } else if (armadura.subcategoria === "Pesada") {
          grupo = "Armaduras Pesadas";
        } else {
          grupo = `Armaduras ${armadura.subcategoria || ""}`.trim();
        }
      } else if (obj.categoria === "escudos") {
        grupo = "Escudos";
      } else if (obj.categoria === "consumibles") {
        grupo = "Consumibles y Pociones";
      } else if (obj.categoria === "municion") {
        grupo = "Municiones";
      } else if (obj.categoria === "herramientas") {
        grupo = "Herramientas";
      } else if (obj.categoria === "focos-magicos") {
        grupo = "Focos Mágicos";
      } else if (obj.categoria === "contenedores") {
        grupo = "Contenedores y Almacenamiento";
      } else if (obj.categoria === "paquetes-equipo") {
        grupo = "Paquetes de Equipo";
      } else if (obj.categoria === "objetos-magicos") {
        grupo = "Objetos Mágicos y Maravillosos";
      } else {
        grupo = "Equipo de Aventuras";
      }

      let subtitulo = "";
      if (obj.categoria === "armas") {
        const arma = obj as Arma;
        const dano = arma.dadoDano ? `${arma.dadoDano} ${arma.tipoDano || ""}` : "";
        subtitulo = [dano, `${arma.pesoLb || 0} lb`, `${arma.valorPO || 0} PO`].filter(Boolean).join(" • ");
      } else if (obj.categoria === "armaduras") {
        const armadura = obj as Armadura;
        subtitulo = `CA ${armadura.caBase || 0} • ${armadura.pesoLb || 0} lb • ${armadura.valorPO || 0} PO`;
      } else if (obj.categoria === "escudos") {
        subtitulo = `CA +2 • ${obj.pesoLb || 0} lb • ${obj.valorPO || 0} PO`;
      } else {
        subtitulo = `${obj.pesoLb || 0} lb • ${obj.valorPO || 0} PO`;
      }

      return {
        valor: obj.nombre,
        etiqueta: obj.nombre,
        grupo,
        subtitulo,
        pesoGrupo: PRIORIDAD_GRUPOS[grupo] ?? 99
      };
    });

    // 4. Ordenar items por grupo respetando el orden interno ya calculado
    return itemsConPrioridad.sort((a, b) => {
      if (a.pesoGrupo !== b.pesoGrupo) {
        return a.pesoGrupo - b.pesoGrupo;
      }
      return 0;
    });
  }, [objetosFiltrados]);

  // Objeto seleccionado actualmente para preview
  const objetoSeleccionado = useMemo(() => {
    if (!objetoSeleccionadoId) {
      // Si hay texto en la búsqueda, intentar coincidir por nombre
      if (textoBusqueda) {
        return (
          objetosFiltrados.find(
            (o) => o.nombre.toLowerCase() === textoBusqueda.trim().toLowerCase()
          ) || null
        );
      }
      return null;
    }
    return baseDatosObjetos.find((o) => o.id === objetoSeleccionadoId) || null;
  }, [objetoSeleccionadoId, textoBusqueda, baseDatosObjetos, objetosFiltrados]);

  // Manejar selección en SelectorSugerencias
  const manejarCambioTextoBusqueda = (nuevoTexto: string) => {
    setTextoBusqueda(nuevoTexto);
    const encontrado = objetosFiltrados.find(
      (o) => o.nombre.toLowerCase() === nuevoTexto.trim().toLowerCase()
    );
    if (encontrado) {
      setObjetoSeleccionadoId(encontrado.id);
    }
  };

  const manejarAgregarDesdeCompendio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!objetoSeleccionado) return;

    const nuevoObj = crearObjetoInventarioDesdeCompendio(
      objetoSeleccionado,
      cantidadCompendio,
      contenedorDestino
    );
    alAgregarObjeto(nuevoObj);
    alCerrar();
  };

  // --- Estado para Modo Otras Posesiones ---
  const [nombrePosesion, setNombrePosesion] = useState("");
  const [pesoPosesion, setPesoPosesion] = useState("0");
  const [cantidadPosesion, setCantidadPosesion] = useState(1);
  const [notasPosesion, setNotasPosesion] = useState("");

  const manejarCrearOtrasPosesiones = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombrePosesion.trim()) return;

    const nuevoObj = crearObjetoInventarioCustom({
      nombre: nombrePosesion.trim(),
      pesoLb: parseFloat(pesoPosesion) || 0,
      cantidad: Math.max(1, cantidadPosesion || 1),
      categoria: "equipo-aventurero",
      esConsumible: false,
      rareza: "Común",
      equipable: false,
      sintonizacionRequerida: false,
      esMagico: false,
      contenedor: contenedorDestino,
      notas: notasPosesion.trim()
    });

    alAgregarObjeto(nuevoObj);
    alCerrar();
  };

  return (
    <div className={estilos.overlayModal} onClick={alCerrar}>
      <div
        className={`${estilos.cuerpoModal} ${estilos.modalAgregarObjeto}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className={`${estilos.cabeceraModal} ${estilos.cabeceraModalRedondeada}`}>
          <span className={estilos.tituloModal}>Añadir Objeto al Inventario</span>
          <button
            type="button"
            className={estilos.botonConfigurarPj}
            onClick={alCerrar}
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs Agregar Objeto vs Otras Posesiones */}
        <div className={estilos.tabsModalAgregar}>
          <button
            type="button"
            className={`${estilos.tabBotonModal} ${tabActiva === "compendio" ? estilos.tabBotonModalActivo : ""}`}
            onClick={() => setTabActiva("compendio")}
          >
            <Plus size={14} />
            Agregar Objeto
          </button>
          <button
            type="button"
            className={`${estilos.tabBotonModal} ${tabActiva === "otrasPosesiones" ? estilos.tabBotonModalActivo : ""}`}
            onClick={() => setTabActiva("otrasPosesiones")}
          >
            <FileText size={14} />
            Otras Posesiones
          </button>
        </div>

        {/* Contenido según Tab */}
        {tabActiva === "compendio" ? (
          <form
            onSubmit={manejarAgregarDesdeCompendio}
            className={estilos.formularioCompendioModal}
          >
            {/* Filtros de categoría */}
            <div className={estilos.filaFiltrosCategoria}>
              {CATEGORIAS_FILTRO.map((filtro) => (
                <button
                  key={filtro.id}
                  type="button"
                  onClick={() => setFiltroTipo(filtro.id)}
                  className={`${estilos.neoButton} ${estilos.chipFiltroCategoria} ${
                    filtroTipo === filtro.id ? estilos.chipFiltroCategoriaActivo : ""
                  }`}
                >
                  {filtro.etiqueta}
                </button>
              ))}
            </div>

            {/* Buscador de Sugerencias */}
            <div className={estilos.campoFormulario}>
              <label className={estilos.labelFormulario}>Buscar Objeto:</label>
              <SelectorSugerencias
                valor={textoBusqueda}
                alCambiar={manejarCambioTextoBusqueda}
                opciones={opcionesSugerencias}
                placeholder="Escribe el nombre del objeto..."
              />
            </div>

            {/* Selector de Cantidad */}
            <div className={estilos.campoFormulario}>
              <label className={estilos.labelFormulario}>Cantidad a Añadir:</label>
              <input
                type="number"
                min="1"
                className={estilos.inputFormulario}
                value={cantidadCompendio}
                onChange={(e) => setCantidadCompendio(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
            </div>

            {/* Selector de Contenedor de Destino */}
            <div className={estilos.campoFormulario}>
              <label className={estilos.labelFormulario}>Guardar en:</label>
              <div className={estilos.cuadriculaSelectoresDestino}>
                {OPCIONES_CONTENEDOR_DESTINO.map((opc) => {
                  const activo = contenedorDestino === opc.clave;
                  return (
                    <button
                      key={opc.clave}
                      type="button"
                      className={`${estilos.botonSelectorDestino} ${activo ? estilos.botonSelectorDestinoActivo : ""}`}
                      data-caja={opc.clave}
                      onClick={() => setContenedorDestino(opc.clave)}
                    >
                      <div className={estilos.iconoSelectorDestino}>
                        {opc.clave === "mochila" && <Backpack size={13} color={opc.color} />}
                        {opc.clave === "bolsa_contencion" && <Sparkles size={13} color={opc.color} />}
                        {opc.clave === "montura" && <Box size={13} color={opc.color} />}
                        {opc.clave === "almacen" && <Package size={13} color={opc.color} />}
                      </div>
                      <div className={estilos.infoSelectorDestino}>
                        <span className={estilos.nombreSelectorDestino}>
                          {opc.nombre}
                        </span>
                        <span className={estilos.subtituloSelectorDestino}>
                          {opc.subtitulo}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vista Previa del Objeto Seleccionado */}
            {objetoSeleccionado ? (
              <div className={estilos.cajaPreviewObjeto}>
                <div className={estilos.cabeceraPreviewObjeto}>
                  <span className={estilos.nombrePreviewObjeto}>
                    {objetoSeleccionado.nombre}
                  </span>
                  <span className={`${estilos.badgeMeta} ${estilos.rarezaComun}`}>
                    {DICCIONARIO_CATEGORIAS_EQUIPO[objetoSeleccionado.categoria]?.etiqueta || objetoSeleccionado.categoria}
                  </span>
                </div>

                <div className={estilos.filaMetadatosPreview}>
                  <span>
                    Peso: <strong className={estilos.textoBlancoResaltado}>{objetoSeleccionado.pesoLb || 0} lb</strong>
                    {objetoSeleccionado.quantity && objetoSeleccionado.quantity > 1 && (
                      <span className={estilos.textoPesoUnitario}>
                        ({objetoSeleccionado.pesoUnitario || Math.round(((objetoSeleccionado.pesoLb || 0) / objetoSeleccionado.quantity) * 1000) / 1000} lb c/u)
                      </span>
                    )}
                  </span>
                  <span>Valor: <strong className={estilos.textoValorPO}>{objetoSeleccionado.valorPO || 0} PO</strong></span>
                  {objetoSeleccionado.quantity && objetoSeleccionado.quantity > 1 && (
                    <span className={estilos.avisoLoteCantidad}>
                      Viene en lote de {objetoSeleccionado.quantity} uds (Se añadirán: {objetoSeleccionado.quantity * (cantidadCompendio || 1)})
                    </span>
                  )}
                  {objetoSeleccionado.sintonizacionRequerida && (
                    <span className={estilos.avisoSintonizacionReq}>
                      <Sparkles size={11} />
                      Requiere Sintonización
                    </span>
                  )}
                </div>

                {/* Badges de Estadísticas y Propiedades de Arma / Armadura / Escudo */}
                {objetoSeleccionado.categoria === "armas" && (() => {
                  const armaObj = objetoSeleccionado as Arma;
                  return (
                    <div className={estilos.filaBadgesPreview}>
                      {armaObj.tipoAtaque && (
                        <span className={`${estilos.badgeMeta} ${estilos.badgeArmaAtaque}`}>
                          {armaObj.tipoAtaque}
                        </span>
                      )}
                      {armaObj.dadoDano && (
                        <span className={`${estilos.badgeMeta} ${estilos.badgeDanoArma}`}>
                          {armaObj.dadoDano} {armaObj.tipoDano}
                        </span>
                      )}
                      {armaObj.danoVersatil && (
                        <TooltipUniversal
                          titulo="Daño Versátil"
                          contenido={`Inflige ${armaObj.danoVersatil} de daño al empuñarse con dos manos.`}
                          posicion="arriba"
                        >
                          <span className={`${estilos.badgeMeta} ${estilos.badgeVersatil}`}>
                            Versátil ({armaObj.danoVersatil})
                          </span>
                        </TooltipUniversal>
                      )}
                      {armaObj.maestria && (() => {
                        const infoM = obtenerInfoMaestria(armaObj.maestria);
                        return (
                          <TooltipUniversal
                            titulo={infoM.titulo}
                            contenido={infoM.descripcion}
                            posicion="arriba"
                          >
                            <span className={`${estilos.badgeMeta} ${estilos.badgeMaestria}`}>
                              Maestría: {armaObj.maestria}
                            </span>
                          </TooltipUniversal>
                        );
                      })()}
                      {armaObj.propiedades?.map((p) => {
                        const infoP = obtenerInfoPropiedadArma(p);
                        return (
                          <TooltipUniversal
                            key={p}
                            titulo={infoP.titulo}
                            contenido={infoP.descripcion}
                            posicion="arriba"
                          >
                            <span className={`${estilos.badgeMeta} ${estilos.badgePropiedadArma}`}>
                              {p}
                            </span>
                          </TooltipUniversal>
                        );
                      })}
                    </div>
                  );
                })()}

                {objetoSeleccionado.categoria === "armaduras" && (() => {
                  const armaduraObj = objetoSeleccionado as Armadura;
                  return (
                    <div className={estilos.filaBadgesPreview}>
                      <span className={`${estilos.badgeMeta} ${estilos.badgeCaArmadura}`}>
                        CA {armaduraObj.caBase}
                      </span>
                      {(() => {
                        const bonoDestReal =
                          armaduraObj.bonoDestreza ||
                          (armaduraObj.subcategoria === "Pesada"
                            ? "Sin Bono"
                            : armaduraObj.subcategoria === "Mediana"
                            ? "Máximo 2"
                            : "Completo");
                        const infoDes = obtenerInfoPropiedadArmadura("bonoDestreza", bonoDestReal);
                        return (
                          <TooltipUniversal titulo={infoDes.titulo} contenido={infoDes.descripcion} posicion="arriba">
                            <span className={`${estilos.badgeMeta} ${estilos.badgeBonoDes}`}>
                              Bono Des: {bonoDestReal}
                            </span>
                          </TooltipUniversal>
                        );
                      })()}
                      {armaduraObj.requisitoFuerza && (() => {
                        const infoFue = obtenerInfoPropiedadArmadura("requisitoFuerza", armaduraObj.requisitoFuerza);
                        return (
                          <TooltipUniversal titulo={infoFue.titulo} contenido={infoFue.descripcion} posicion="arriba">
                            <span className={`${estilos.badgeMeta} ${estilos.badgeRequisitoFuerza}`}>
                              FUE {armaduraObj.requisitoFuerza}
                            </span>
                          </TooltipUniversal>
                        );
                      })()}
                      {armaduraObj.desventajaSigilo && (() => {
                        const infoSigilo = obtenerInfoPropiedadArmadura("desventajaSigilo");
                        return (
                          <TooltipUniversal titulo={infoSigilo.titulo} contenido={infoSigilo.descripcion} posicion="arriba">
                            <span className={`${estilos.badgeMeta} ${estilos.badgeDesventajaSigilo}`}>
                              Sigilo (Desv.)
                            </span>
                          </TooltipUniversal>
                        );
                      })()}
                    </div>
                  );
                })()}

                {objetoSeleccionado.categoria === "escudos" && (
                  <div className={estilos.filaBadgesPreview}>
                    <span className={`${estilos.badgeMeta} ${estilos.badgeCaArmadura}`}>
                      <Shield size={10} className={estilos.iconoBadgeInline} />
                      CA +{(objetoSeleccionado as Escudo).caBase || 2}
                    </span>
                  </div>
                )}

                {objetoSeleccionado.descripcion && (
                  <div className={estilos.descripcionPreview}>
                    {objetoSeleccionado.descripcion}
                  </div>
                )}

                {/* Desglose de contenido del paquete */}
                {objetoSeleccionado.contents && objetoSeleccionado.contents.length > 0 && (
                  <div className={estilos.cajaPaqueteContenido}>
                    <span className={estilos.tituloPaqueteContenido}>
                      <Package size={12} /> Paquete con {objetoSeleccionado.contents.length} objetos (Podrás abrirlo o desempaquetarlo desde tu inventario):
                    </span>
                    <div className={estilos.listaItemsPaquete}>
                      {objetoSeleccionado.contents.map((item, idx) => (
                        <div key={idx} className={estilos.filaItemPaquete}>
                          <span>• {item.item.name}</span>
                          <strong className={estilos.multiplicadorItemPaquete}>×{item.quantity * (cantidadCompendio || 1)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={estilos.avisoSeleccionarObjeto}>
                Selecciona un objeto del buscador para ver sus detalles.
              </div>
            )}

            {/* Pie del Modal */}
            <div className={`${estilos.pieModal} ${estilos.pieModalAjustado}`}>
              <button type="button" className={estilos.neoButton} onClick={alCerrar}>
                Cancelar
              </button>
              <button
                type="submit"
                className={`${estilos.neoButton} ${objetoSeleccionado ? estilos.botonConfirmarAgregarItemActivo : estilos.botonConfirmarAgregarItem}`}
                disabled={!objetoSeleccionado}
              >
                <Plus size={14} className={estilos.iconoBotonAccion} />
                Añadir al Inventario
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={manejarCrearOtrasPosesiones} className={estilos.formularioPosesionesModal}>
            <div className={estilos.bannerInformativoPosesiones}>
              <FileText size={14} color="#38bdf8" className={estilos.iconoBannerPosesiones} />
              <span>Anota rápidamente pertenencias, llaves, cartas, gemas u objetos varios. Podrás configurar estadísticas detalladas más adelante desde el creador Homebrew.</span>
            </div>

            {/* Nombre de la Posesión */}
            <div className={estilos.campoFormulario}>
              <label className={estilos.labelFormulario}>Nombre de la Posesión / Objeto *</label>
              <input
                type="text"
                required
                className={estilos.inputFormulario}
                value={nombrePosesion}
                onChange={(e) => setNombrePosesion(e.target.value)}
                placeholder="Ej. Carta sellada de Waterdeep, Llave de hierro, Gema roja..."
                autoFocus
              />
            </div>

            {/* Cantidad y Peso */}
            <div className={estilos.gridDosColumnasPosesion}>
              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Cantidad</label>
                <input
                  type="number"
                  min="1"
                  className={estilos.inputFormulario}
                  value={cantidadPosesion}
                  onChange={(e) => setCantidadPosesion(Math.max(1, parseInt(e.target.value, 10) || 1))}
                />
              </div>

              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Peso Total (lb)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className={estilos.inputFormulario}
                  value={pesoPosesion}
                  onChange={(e) => setPesoPosesion(e.target.value)}
                  placeholder="0 (ligero / insignificante)"
                />
              </div>
            </div>

            {/* Selector de Contenedor de Destino */}
            <div className={estilos.campoFormulario}>
              <label className={estilos.labelFormulario}>Guardar en:</label>
              <div className={estilos.cuadriculaSelectoresDestino}>
                {OPCIONES_CONTENEDOR_DESTINO.map((opc) => {
                  const activo = contenedorDestino === opc.clave;
                  return (
                    <button
                      key={opc.clave}
                      type="button"
                      className={`${estilos.botonSelectorDestino} ${activo ? estilos.botonSelectorDestinoActivo : ""}`}
                      data-caja={opc.clave}
                      onClick={() => setContenedorDestino(opc.clave)}
                    >
                      <div className={estilos.iconoSelectorDestino}>
                        {opc.clave === "mochila" && <Backpack size={13} color={opc.color} />}
                        {opc.clave === "bolsa_contencion" && <Sparkles size={13} color={opc.color} />}
                        {opc.clave === "montura" && <Box size={13} color={opc.color} />}
                        {opc.clave === "almacen" && <Package size={13} color={opc.color} />}
                      </div>
                      <div className={estilos.infoSelectorDestino}>
                        <span className={estilos.nombreSelectorDestino}>
                          {opc.nombre}
                        </span>
                        <span className={estilos.subtituloSelectorDestino}>
                          {opc.subtitulo}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notas / Descripción Rápida */}
            <div className={estilos.campoFormulario}>
              <label className={estilos.labelFormulario}>Notas o Descripción (Opcional)</label>
              <textarea
                className={`${estilos.inputFormulario} ${estilos.textareaNotasPosesion}`}
                value={notasPosesion}
                onChange={(e) => setNotasPosesion(e.target.value)}
                placeholder="Notas de dónde se encontró, pistas, uso, etc..."
                spellCheck={false}
              />
            </div>

            {/* Pie del Modal */}
            <div className={`${estilos.pieModal} ${estilos.pieModalAjustado}`}>
              <button type="button" className={estilos.neoButton} onClick={alCerrar}>
                Cancelar
              </button>
              <button
                type="submit"
                className={`${estilos.neoButton} ${nombrePosesion.trim() ? estilos.botonConfirmarAgregarItemActivo : estilos.botonConfirmarAgregarItem}`}
                disabled={!nombrePosesion.trim()}
              >
                <Plus size={14} className={estilos.iconoBotonAccion} />
                Añadir a Posesiones
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
