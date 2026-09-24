import React from "react";
import { Swords, Shield, Languages, Wrench, Sliders, Settings } from "lucide-react";
import type { PersonajeJugador, Habilidad } from "@/tipos";
import { HABILIDADES_LISTA } from "@/constantes";
import type { CategoriaCompetencia } from "../ModalSelectorCompetencias";
import { TarjetaResumenCompetencia } from "./TarjetaResumenCompetencia";
import { obtenerCompetenciasEfectivasTexto } from "@/servicios/evaluadorEfectosRasgos";
import estilos from "./ConfiguracionPersonaje.module.css";

export interface PestanaCompetenciasProps {
  form: PersonajeJugador;
  alAbrirModalCompetencias: (cat: CategoriaCompetencia) => void;
  alAbrirDetalleHabilidad: (info: { clave: Habilidad; nombre: string }) => void;
}

/**
 * Pestaña de Competencias y Habilidades:
 * Bloques de Armas, Armaduras, Idiomas y Herramientas (usando TarjetaResumenCompetencia),
 * y el catálogo interactivo de las 18 habilidades con sus grados (ninguna, medio, competente, pericia).
 */
export const PestanaCompetencias: React.FC<PestanaCompetenciasProps> = ({
  form,
  alAbrirModalCompetencias,
  alAbrirDetalleHabilidad
}) => {
  const compEfectivas = React.useMemo(() => obtenerCompetenciasEfectivasTexto(form), [form]);
  const herramientasListaEfectiva = compEfectivas.herramientasLista;
  const descripcionHerramientas =
    compEfectivas.herramientasTexto !== "Ninguna"
      ? compEfectivas.herramientasTexto
      : form.herramientas || "Sin herramientas seleccionadas";
  return (
    <div className={estilos.contenedorPestanaCompetencias}>
      {/* Grid 2x2 de Tarjetas Resumen de Competencias */}
      <div className={estilos.gridCompetenciasResumen}>
        {/* Tarjeta Armas */}
        <TarjetaResumenCompetencia
          icono={<Swords size={14} color="#94a3b8" />}
          titulo="Competencias con Armas"
          conteo={form.competenciasArmasLista?.length || 0}
          etiquetaConteo="armas"
          descripcion={
            compEfectivas.armasTexto !== "Ninguna"
              ? compEfectivas.armasTexto
              : form.competenciasArmas || "Sin competencias seleccionadas"
          }
          textoBoton="Gestionar Armas"
          alAbrir={() => alAbrirModalCompetencias("armas")}
        />

        {/* Tarjeta Armaduras */}
        <TarjetaResumenCompetencia
          icono={<Shield size={14} color="#94a3b8" />}
          titulo="Competencias con Armaduras"
          conteo={form.competenciasArmadurasLista?.length || 0}
          etiquetaConteo="armaduras"
          descripcion={
            compEfectivas.armadurasTexto !== "Ninguna"
              ? compEfectivas.armadurasTexto
              : form.competenciasArmaduras || "Sin competencias seleccionadas"
          }
          textoBoton="Gestionar Armaduras"
          alAbrir={() => alAbrirModalCompetencias("armaduras")}
        />

        {/* Tarjeta Idiomas */}
        <TarjetaResumenCompetencia
          icono={<Languages size={14} color="#94a3b8" />}
          titulo="Idiomas Conocidos"
          conteo={form.idiomasLista?.length || 0}
          etiquetaConteo="idiomas"
          descripcion={
            form.idiomasLista && form.idiomasLista.length > 0
              ? form.idiomasLista.join(", ")
              : form.idiomas || "Común"
          }
          textoBoton="Gestionar Idiomas"
          alAbrir={() => alAbrirModalCompetencias("idiomas")}
        />

        {/* Tarjeta Herramientas */}
        <TarjetaResumenCompetencia
          icono={<Wrench size={14} color="#94a3b8" />}
          titulo="Herramientas y Kits"
          conteo={herramientasListaEfectiva.length}
          etiquetaConteo="herramientas"
          descripcion={descripcionHerramientas}
          textoBoton="Gestionar Herramientas"
          alAbrir={() => alAbrirModalCompetencias("herramientas")}
        />
      </div>

      {/* SECCIÓN HABILIDADES (18) */}
      <div className={`${estilos.campoFormulario} ${estilos.seccionHabilidadesConfig}`}>
        <div className={estilos.cabeceraHabilidades}>
          <div className={estilos.tituloIconoFila}>
            <Sliders size={14} color="#94a3b8" />
            <label className={`${estilos.labelFormulario} ${estilos.labelHabilidades}`}>
              Habilidades e Inspector de Desglose (18)
            </label>
          </div>
          <span className={estilos.textoAyudaHabilidades}>
            Clic en <Settings size={10} className={estilos.iconoSettingsInline} /> para ver desglose matemático o personalizar
          </span>
        </div>

        <div className={estilos.gridHabilidades}>
          {HABILIDADES_LISTA.map(({ clave, nombre }) => {
            const hab = clave as Habilidad;
            const custom = form.personalizacionesHabilidades?.[hab];
            const grado = form.gradosHabilidades?.[hab] || "ninguna";
            const titulo = custom?.nombrePersonalizado || nombre;

            const etiquetaGrado =
              grado === "pericia"
                ? "Pericia (2x PB)"
                : grado === "competente"
                ? "Competente (1x PB)"
                : grado === "medio"
                ? "Medio bono"
                : "Sin competencia";

            return (
              <div key={hab} className={estilos.tarjetaHabilidadItem}>
                <div className={estilos.columnaTextoHabilidad}>
                  <span className={estilos.nombreHabilidad}>{titulo}</span>
                  <span className={estilos.etiquetaGradoHabilidad} data-grado={grado}>
                    {etiquetaGrado}
                    {custom?.modificadorExtra ? ` (+${custom.modificadorExtra})` : ""}
                    {custom?.valorFijo !== null && custom?.valorFijo !== undefined ? ` [Fijo: ${custom.valorFijo}]` : ""}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => alAbrirDetalleHabilidad({ clave: hab, nombre })}
                  className={estilos.botonEditarHabilidad}
                >
                  <Settings size={10} color="#94a3b8" />
                  Editar
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
