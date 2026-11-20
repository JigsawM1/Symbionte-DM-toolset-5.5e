import React, { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { TarjetaConjuroCompacta } from "@/componentes/caracteristicas/personajes/TarjetaConjuroCompacta";
import { DivisorSeccionAccion } from "./DivisorSeccionAccion";
import type { HechizoBase, PersonajeJugador } from "@/tipos";
import type { SolicitudLanzamiento } from "@/servicios/servicioLanzamientoConjuros";
import { resolverOrigenConjuro } from "@/servicios/resolutorOrigenConjuros";
import { obtenerBonoDanoConjuroExtra, tieneLanzamientoGratuitoDisponible } from "@/servicios/evaluadorEfectosRasgos";
import { obtenerModificadorAptitudMagica } from "@/servicios/calculadorMagia";
import { COSTE_PUNTOS_POR_NIVEL } from "@/constantes";
import type { ConjuroAccionElemento } from "./usarCalculoAtaquesJugador";
import estilos from "./VistaAtaquesJugador.module.css";

interface SeccionAtaquesMagicosProps {
  conjurosFiltrados: ConjuroAccionElemento[];
  mostrarDivisor?: boolean;
  personajeActivo: PersonajeJugador;
  espaciosConjuroMaximos: Record<string, number>;
  bonoAtaqueMagico: number;
  tienePacto: boolean;
  sistemaMagia: "espacios" | "puntos";
  estaBloqueadoPorArmadura: boolean;
  motivoBloqueoArmadura?: string;
  esHechizoDeSubclase: (hechizo: HechizoBase) => boolean;
  alAbrirDetalle: (hechizo: HechizoBase) => void;
  alLanzar: (solicitud: SolicitudLanzamiento) => Promise<boolean>;
  alAlternarAcciones?: (idPj: string, idHechizo: string) => void;
}

export const SeccionAtaquesMagicos: React.FC<SeccionAtaquesMagicosProps> = React.memo(({
  conjurosFiltrados,
  mostrarDivisor = true,
  personajeActivo,
  espaciosConjuroMaximos,
  bonoAtaqueMagico,
  tienePacto,
  sistemaMagia,
  estaBloqueadoPorArmadura,
  motivoBloqueoArmadura,
  esHechizoDeSubclase,
  alAbrirDetalle,
  alLanzar,
  alAlternarAcciones
}) => {
  const conjurosOrdenados = useMemo(
    () =>
      [...conjurosFiltrados].sort((a, b) => {
        const diffNivel = (a.hechizo.nivel || 0) - (b.hechizo.nivel || 0);
        if (diffNivel !== 0) return diffNivel;
        return a.hechizo.nombre.localeCompare(b.hechizo.nombre, "es", { sensitivity: "base" });
      }),
    [conjurosFiltrados]
  );

  if (conjurosOrdenados.length === 0) {
    return null;
  }

  const modificadorHabilidad = obtenerModificadorAptitudMagica(personajeActivo);

  const renderizarTarjetaConjuro = (hechizo: HechizoBase) => {
    const tieneLanzamientoGratisDisponible = tieneLanzamientoGratuitoDisponible(personajeActivo, hechizo);
    const bonoDanoMagico = obtenerBonoDanoConjuroExtra(personajeActivo, {
      esTruco: hechizo.nivel === 0,
      nivelLanzamiento: hechizo.nivel,
      tipoDano: hechizo.tipoDaño,
      escuela: hechizo.escuela,
      nombreConjuro: hechizo.nombre
    });

    return (
      <TarjetaConjuroCompacta
        key={hechizo.id}
        hechizo={hechizo}
        nivelPersonaje={personajeActivo.nivel || 1}
        bonoAtaqueMagico={bonoAtaqueMagico}
        bonoDanoMagico={bonoDanoMagico}
        modificadorHabilidad={modificadorHabilidad}
        estaPreparado={true}
        esDeSubclase={esHechizoDeSubclase(hechizo)}
        origenBadge={resolverOrigenConjuro(personajeActivo, hechizo)}
        esConcentracionActual={personajeActivo.concentracionActiva?.hechizoId === hechizo.id}
        enAcciones={true}
        alAlternarAcciones={alAlternarAcciones ? () => alAlternarAcciones(personajeActivo.id, hechizo.id) : undefined}
        bloqueadoPorArmadura={estaBloqueadoPorArmadura}
        motivoBloqueoArmadura={motivoBloqueoArmadura}
        alAbrirDetalleCompleto={(h) => alAbrirDetalle(h)}
        alLanzar={(modo, niv) => alLanzar({ modo, hechizo, nivelLanzamiento: niv })}
        tieneLanzamientoGratisDisponible={tieneLanzamientoGratisDisponible}
        esLanzadorPacto={tienePacto}
        nivelEspacioPacto={personajeActivo.nivelEspacioPacto || 0}
        espaciosPactoMaximos={personajeActivo.espaciosPactoMaximos || 0}
        espaciosPactoGastados={personajeActivo.espaciosPactoGastados || 0}
        espaciosConjuroMaximos={espaciosConjuroMaximos}
        espaciosConjuroGastados={personajeActivo.espaciosConjuroGastados}
        nivelConjuroMaximo={personajeActivo.nivelConjuroMaximo || 0}
        puntosConjuroDisponibles={Math.max(
          0,
          (personajeActivo.puntosConjuroMaximos || 0) - (personajeActivo.puntosConjuroGastados || 0)
        )}
        costePuntosPorNivel={COSTE_PUNTOS_POR_NIVEL}
        sistemaMagia={sistemaMagia}
      />
    );
  };

  const listaTarjetas = (
    <div className={estilos.listaAtaques}>
      {conjurosOrdenados.map(({ hechizo }) => renderizarTarjetaConjuro(hechizo))}
    </div>
  );

  if (!mostrarDivisor) {
    return listaTarjetas;
  }

  return (
    <section className={estilos.bloqueSeccionPlana} aria-label="Conjuros y acciones mágicas">
      <DivisorSeccionAccion
        icono={<Sparkles size={13} color="var(--pj-texto-magia)" aria-hidden="true" />}
        titulo="Magia de Combate"
        conteo={conjurosOrdenados.length}
        tono="magia"
      />
      {listaTarjetas}
    </section>
  );
});

SeccionAtaquesMagicos.displayName = "SeccionAtaquesMagicos";


