import React, { useMemo } from "react";
import type { CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import type { MonstruoBase } from "@/utiles/datosIniciales";
import type { PasivasCombatePJ } from "@/tipos/sync";
import {
  TarjetaCriaturaIniciativa,
  type AccionesTarjetaCriaturaIniciativa
} from "../TarjetaCriaturaIniciativa";

export interface DespachadoresItemIniciativa {
  onEliminar: (id: string) => void;
  onSeleccionar: (id: string) => void;
  onCurar: (id: string, cant: number) => void;
  onDañar: (id: string, cant: number) => void;
  onCambiarTempHP: (id: string, cant: number) => void;
  onAñadirCondicion: (id: string, cond: string) => void;
  onQuitarCondicion: (id: string, cond: string) => void;
  onAñadirEfecto: (id: string, nom: string, dur: number, opciones?: { concentracion?: boolean }) => void;
  onQuitarEfecto: (id: string, efId: string) => void;
  onLanzarIniciativa: (criatura: CriaturaIniciativa, plantilla: MonstruoBase | null) => void;
  onLanzarAtaqueRapido: (nombre: string, accNom: string, accBono: string, accDados: string, accTipo: string) => void;
  obtenerPercepcionPasiva: (plantilla: MonstruoBase | null) => number;
  onEstablecerIniciativa: (id: string, nuevaInic: number) => void;
  onEstablecerVidaMaxima?: (id: string, nuevaMax: number) => void;
  onAlternarRol: (id: string) => void;
  onConfigurarBarrasHorda: (id: string, cantidad: number) => void;
  onSeleccionarBarraHorda: (id: string, indice: number) => void;
  onAlternarModoDanoHorda: (id: string) => void;
}

interface ItemCriaturaIniciativaProps {
  criatura: CriaturaIniciativa;
  esTurnoActivo: boolean;
  estaSeleccionadaEnTS: boolean;
  plantilla: MonstruoBase | null;
  pasivasJugador?: PasivasCombatePJ | null;
  avatarUrlPJ?: string | null;
  rondaActual: number;
  despachadores: DespachadoresItemIniciativa;
}

export const ItemCriaturaIniciativa: React.FC<ItemCriaturaIniciativaProps> = React.memo(({
  criatura,
  esTurnoActivo,
  estaSeleccionadaEnTS,
  plantilla,
  pasivasJugador,
  avatarUrlPJ,
  rondaActual,
  despachadores
}) => {
  const salud = useMemo<AccionesTarjetaCriaturaIniciativa["salud"]>(() => ({
    onCurar: (cant) => despachadores.onCurar(criatura.id, cant),
    onDañar: (cant) => despachadores.onDañar(criatura.id, cant),
    onCambiarTempHP: (cant) => despachadores.onCambiarTempHP(criatura.id, cant),
    onEstablecerVidaMaxima: despachadores.onEstablecerVidaMaxima
      ? (nuevaMax) => despachadores.onEstablecerVidaMaxima?.(criatura.id, nuevaMax)
      : undefined
  }), [despachadores, criatura.id]);

  const estado = useMemo<AccionesTarjetaCriaturaIniciativa["estado"]>(() => ({
    onAñadirCondicion: (cond) => despachadores.onAñadirCondicion(criatura.id, cond),
    onQuitarCondicion: (cond) => despachadores.onQuitarCondicion(criatura.id, cond),
    onAñadirEfecto: (nom, dur, opciones) => despachadores.onAñadirEfecto(criatura.id, nom, dur, opciones),
    onQuitarEfecto: (efId) => despachadores.onQuitarEfecto(criatura.id, efId)
  }), [despachadores, criatura.id]);

  const combate = useMemo<AccionesTarjetaCriaturaIniciativa["combate"]>(() => ({
    onEliminar: () => despachadores.onEliminar(criatura.id),
    onSeleccionar: () => despachadores.onSeleccionar(criatura.id),
    onLanzarIniciativa: () => despachadores.onLanzarIniciativa(criatura, plantilla),
    onEstablecerIniciativa: (nuevaInic) => despachadores.onEstablecerIniciativa(criatura.id, nuevaInic),
    onLanzarAtaqueRapido: (accNom, accBono, accDados, accTipo) =>
      despachadores.onLanzarAtaqueRapido(criatura.nombre, accNom, accBono, accDados, accTipo),
    obtenerPercepcionPasiva: despachadores.obtenerPercepcionPasiva,
    onAlternarRol: () => despachadores.onAlternarRol(criatura.id)
  }), [despachadores, criatura, plantilla]);

  const horda = useMemo<AccionesTarjetaCriaturaIniciativa["horda"]>(() => ({
    onConfigurarBarrasHorda: (cant) => despachadores.onConfigurarBarrasHorda(criatura.id, cant),
    onSeleccionarBarraHorda: (idx) => despachadores.onSeleccionarBarraHorda(criatura.id, idx),
    onAlternarModoDanoHorda: () => despachadores.onAlternarModoDanoHorda(criatura.id)
  }), [despachadores, criatura.id]);

  const acciones = useMemo<AccionesTarjetaCriaturaIniciativa>(
    () => ({ salud, estado, combate, horda }),
    [salud, estado, combate, horda]
  );

  return (
    <div data-turno-activo={esTurnoActivo ? "true" : undefined}>
      <TarjetaCriaturaIniciativa
        criatura={criatura}
        esTurnoActivo={esTurnoActivo}
        estaSeleccionadaEnTS={estaSeleccionadaEnTS}
        plantilla={plantilla}
        pasivasJugador={pasivasJugador}
        avatarUrlPJ={avatarUrlPJ}
        rondaActual={rondaActual}
        acciones={acciones}
      />
    </div>
  );
});

ItemCriaturaIniciativa.displayName = "ItemCriaturaIniciativa";
