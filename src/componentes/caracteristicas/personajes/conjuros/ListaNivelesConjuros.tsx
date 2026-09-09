import React from "react";
import type { PersonajeJugador, HechizoBase } from "@/tipos";
import type { ModoLanzamiento, SolicitudLanzamiento } from "@/servicios/servicioLanzamientoConjuros";
import type { OrigenConjuroBadge } from "@/servicios/resolutorOrigenConjuros";
import { Sparkles, BookOpen } from "lucide-react";
import { SeccionNivelConjuros } from "../SeccionNivelConjuros";
import estilos from "../PanelConjurosPersonaje.module.css";

interface ListaNivelesConjurosProps {
  personaje: PersonajeJugador;
  sistemaMagia: "espacios" | "puntos";
  bonoAtaqueMagico: number;
  estaBloqueadoPorArmadura: boolean;
  motivoBloqueoArmadura?: string;
  esLanzadorPacto: boolean;
  nivelEspacioPacto?: number;
  requierePreparacion: boolean;
  esHechizoDeSubclase: (hechizo: HechizoBase) => boolean;
  obtenerOrigenConjuro?: (hechizo: HechizoBase) => OrigenConjuroBadge | null;
  estaPreparado: (hechizo: HechizoBase) => boolean;
  alAlternarPreparado: (idHechizo: string) => void;
  alQuitarTruco: (idHechizo: string) => void;
  alQuitarConjuro: (idHechizo: string) => void;
  alternarOculto: (idHechizo: string) => void;
  establecerPestaña: (p: string) => void;
  setHechizoModal: (h: HechizoBase) => void;
  lanzar: (sol: SolicitudLanzamiento) => Promise<boolean>;
  conteoEfectivo: { total: number };
  trucosConocidos: HechizoBase[];
  trucosVisibles: HechizoBase[];
  trucosFiltrados: HechizoBase[];
  conjurosPorNivel: Record<number, HechizoBase[]>;
  conjurosVisiblesPorNivel: Record<number, HechizoBase[]>;
  conjurosFiltradosPorNivel: Record<number, HechizoBase[]>;
  seccionesAbiertas: Record<string, boolean>;
  alternarSeccion: (seccion: string) => void;
  hayFiltrosActivos: boolean;
}

export const ListaNivelesConjuros: React.FC<ListaNivelesConjurosProps> = ({
  personaje,
  sistemaMagia,
  bonoAtaqueMagico,
  estaBloqueadoPorArmadura,
  motivoBloqueoArmadura,
  esLanzadorPacto,
  nivelEspacioPacto,
  requierePreparacion,
  esHechizoDeSubclase,
  obtenerOrigenConjuro,
  estaPreparado,
  alAlternarPreparado,
  alQuitarTruco,
  alQuitarConjuro,
  alternarOculto,
  establecerPestaña,
  setHechizoModal,
  lanzar,
  conteoEfectivo,
  trucosConocidos,
  trucosVisibles,
  trucosFiltrados,
  conjurosPorNivel,
  conjurosVisiblesPorNivel,
  conjurosFiltradosPorNivel,
  seccionesAbiertas,
  alternarSeccion,
  hayFiltrosActivos
}) => {
  const ejecutarLanzamiento = (modo: ModoLanzamiento, niv?: number, hechizo?: HechizoBase) => {
    if (hechizo) return lanzar({ modo, hechizo, nivelLanzamiento: niv });
    return Promise.resolve(false);
  };

  return (
    <>
      {/* Sección: Trucos Listos */}
      <SeccionNivelConjuros
        titulo="Trucos Listos"
        icono={<Sparkles size={14} color="#a78bfa" />}
        nivel={0}
        esTruco={true}
        conjurosVisibles={trucosVisibles}
        conjurosFiltrados={trucosFiltrados}
        estaAbierta={seccionesAbiertas.trucos !== false}
        alAlternar={() => alternarSeccion("trucos")}
        hayFiltrosActivos={hayFiltrosActivos}
        personaje={personaje}
        bonoAtaqueMagico={bonoAtaqueMagico}
        estaPreparado={() => true}
        esHechizoDeSubclase={esHechizoDeSubclase}
        obtenerOrigenConjuro={obtenerOrigenConjuro}
        requierePreparacion={false}
        esLanzadorPacto={esLanzadorPacto}
        nivelEspacioPacto={nivelEspacioPacto || 1}
        sistemaMagia={sistemaMagia}
        estaBloqueadoPorArmadura={estaBloqueadoPorArmadura}
        motivoBloqueoArmadura={motivoBloqueoArmadura}
        alAlternarOcultar={alternarOculto}
        alQuitarDeLista={alQuitarTruco}
        alAbrirDetalleCompleto={(h: HechizoBase) => setHechizoModal(h)}
        alLanzar={ejecutarLanzamiento}
        alAnadirTrucos={() => establecerPestaña("compendio")}
        totalTrucosConocidos={trucosConocidos.length}
      />

      {/* Estado Vacío de Conjuros */}
      {conteoEfectivo.total === 0 && (
        <div className={estilos.tarjetaVaciaConjuros}>
          <BookOpen size={24} color="#94a3b8" />
          <span className={estilos.tituloVacioConjuros}>
            {requierePreparacion
              ? "No tienes conjuros preparados para el día"
              : "No tienes conjuros en tu lista"}
          </span>
          <p className={estilos.descripcionVacioConjuros}>
            {requierePreparacion
              ? "Accede al Compendio de Conjuros para revisar tu repertorio o grimorio y preparar tus hechizos con la estrella."
              : "Accede al Compendio de Conjuros para añadir hechizos a tu lista de conocidos."}
          </p>
          <button
            type="button"
            onClick={() => establecerPestaña("compendio")}
            className={estilos.botonIrCompendio}
          >
            <BookOpen size={14} />
            <span>Ir al Compendio de Conjuros</span>
          </button>
        </div>
      )}

      {/* Secciones por Nivel de Conjuro (1 a 9) */}
      {Array.from({ length: 9 }).map((_, idx) => {
        const nivel = idx + 1;
        const conjurosNivelTotal = conjurosPorNivel[nivel] || [];
        if (conjurosNivelTotal.length === 0) return null;

        const conjurosNivelVisiblesBase = conjurosVisiblesPorNivel[nivel] || [];
        if (conjurosNivelVisiblesBase.length === 0) return null;

        const conjurosNivelVisibles = conjurosFiltradosPorNivel[nivel] || [];

        return (
          <SeccionNivelConjuros
            key={`seccion-nv-${nivel}`}
            titulo={`Nivel ${nivel}`}
            nivel={nivel}
            esTruco={false}
            conjurosVisibles={conjurosNivelVisiblesBase}
            conjurosFiltrados={conjurosNivelVisibles}
            estaAbierta={seccionesAbiertas[`nv_${nivel}`] !== false}
            alAlternar={() => alternarSeccion(`nv_${nivel}`)}
            hayFiltrosActivos={hayFiltrosActivos}
            personaje={personaje}
            bonoAtaqueMagico={bonoAtaqueMagico}
            estaPreparado={estaPreparado}
            esHechizoDeSubclase={esHechizoDeSubclase}
            obtenerOrigenConjuro={obtenerOrigenConjuro}
            requierePreparacion={requierePreparacion}
            esLanzadorPacto={esLanzadorPacto}
            nivelEspacioPacto={nivelEspacioPacto || 1}
            sistemaMagia={sistemaMagia}
            estaBloqueadoPorArmadura={estaBloqueadoPorArmadura}
            motivoBloqueoArmadura={motivoBloqueoArmadura}
            alAlternarOcultar={alternarOculto}
            alAlternarPreparado={alAlternarPreparado}
            alQuitarDeLista={alQuitarConjuro}
            alAbrirDetalleCompleto={(h: HechizoBase) => setHechizoModal(h)}
            alLanzar={ejecutarLanzamiento}
          />
        );
      })}
    </>
  );
};
