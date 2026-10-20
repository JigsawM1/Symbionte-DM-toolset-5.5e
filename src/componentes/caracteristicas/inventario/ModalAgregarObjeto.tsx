import { FormularioNumerico } from "@/componentes/comunes/FormularioNumerico";
import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import React, { useState, useMemo, useEffect } from "react";
import type { ObjetoJuego, ObjetoInventario, Arma, Armadura, Escudo, TipoContenedor } from "@/tipos";
import type { CategoriaEquipo } from "@/constantes/categoriasEquipoConstantes";
import { FileText, X, Plus } from "lucide-react";
import { SelectorSugerencias, OpcionSugerencia } from "@/componentes/comunes/SelectorSugerencias";
import {
  crearObjetoInventarioDesdeCompendio,
  crearObjetoInventarioCustom
} from "@/servicios/calculadorInventario";
import { desduplicarEntidades } from "@/utiles/busquedaTolerante";
import { SelectorContenedorDestino } from "./subcomponentes/SelectorContenedorDestino";
import { VistaPreviaObjetoCompendio } from "./subcomponentes/VistaPreviaObjetoCompendio";
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
        const caEscudo = (obj as Escudo).caBase ?? 2;
        subtitulo = `CA +${caEscudo} • ${obj.pesoLb || 0} lb • ${obj.valorPO || 0} PO`;
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
      pesoLb: Number(pesoPosesion) || 0,
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
    <div className={`${estilos.overlayModal} ${estilos.overlayAgregarObjeto}`} onClick={alCerrar}>
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
          <FormularioNumerico
            onSubmit={manejarAgregarDesdeCompendio}
            className={estilos.formularioCompendioModal}
          >
            <div className={estilos.contenidoFormularioAgregarObjeto}>
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
                <CampoNumerico
                  min="1"
                  className={estilos.inputFormulario}
                  value={cantidadCompendio}
                  alConfirmar={setCantidadCompendio}

                />
              </div>

              {/* Selector de Contenedor de Destino */}
              <SelectorContenedorDestino
                contenedorSeleccionado={contenedorDestino}
                alSeleccionarContenedor={setContenedorDestino}
              />

              {/* Vista Previa del Objeto Seleccionado */}
              <VistaPreviaObjetoCompendio
                objetoSeleccionado={objetoSeleccionado}
                cantidadCompendio={cantidadCompendio}
              />

            </div>
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
          </FormularioNumerico>
        ) : (
          <FormularioNumerico onSubmit={manejarCrearOtrasPosesiones} className={estilos.formularioPosesionesModal}>
            <div className={estilos.contenidoFormularioAgregarObjeto}>
              <div className={estilos.bannerInformativoPosesiones}>
                <FileText size={14} color="var(--pj-texto-cian)" className={estilos.iconoBannerPosesiones} />
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
                  <CampoNumerico
                    min="1"
                    className={estilos.inputFormulario}
                    value={cantidadPosesion}
                    alConfirmar={setCantidadPosesion}

                  />
                </div>

                <div className={estilos.campoFormulario}>
                  <label className={estilos.labelFormulario}>Peso Total (lb)</label>
                  <CampoNumerico
                    step="0.1"
                    min="0"
                    className={estilos.inputFormulario}
                    value={pesoPosesion}
                    alConfirmar={(valor) => setPesoPosesion(String(valor))}
                    placeholder="0 (ligero / insignificante)"
                    tipo="decimal"
                  />
                </div>
              </div>

              {/* Selector de Contenedor de Destino */}
              <SelectorContenedorDestino
                contenedorSeleccionado={contenedorDestino}
                alSeleccionarContenedor={setContenedorDestino}
              />

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
          </FormularioNumerico>
        )}
      </div>
    </div>
  );
};
