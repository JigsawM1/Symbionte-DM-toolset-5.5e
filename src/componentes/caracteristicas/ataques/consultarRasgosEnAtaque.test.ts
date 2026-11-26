import { beforeEach, describe, expect, it, vi } from "vitest";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { aplicarBuildClaseAPersonaje } from "@/servicios/clases/buildClase";
import type { AtaquePersonajeCalculado, PersonajeJugador } from "@/tipos";

const elegirOpcionMock = vi.fn();

vi.mock("@/componentes/caracteristicas/rasgos/elegirVarianteConjuro", () => ({
  elegirOpcionLanzamiento: (...args: unknown[]) => elegirOpcionMock(...args)
}));

import {
  consultarEfectosEtiquetaEnDano,
  consultarRasgosAntesDeAtaque,
  ejecutarConsultaDanoAtaque
} from "./consultarRasgosEnAtaque";

function ataqueFuerza(): AtaquePersonajeCalculado {
  return {
    id: "atk-hacha",
    nombre: "Gran hacha",
    tipo: "Arma",
    tipoAccion: "accion",
    caracteristicaUsada: "fuerza",
    bonoAtaque: 7,
    dadoDano: "1d12+4",
    dadoDanoBase: "1d12",
    modificadorDano: 4,
    esDanoFijo: false,
    tipoDano: "Cortante",
    propiedades: [],
    tieneTiradaAtaque: true
  };
}

function barbaroPreparado(cambiosRasgos: Record<string, Partial<PersonajeJugador["rasgos"][number]>> = {}): PersonajeJugador {
  const base = aplicarBuildClaseAPersonaje(
    { ...PERSONAJE_POR_DEFECTO, id: "pj-barbaro-test" },
    "Bárbaro",
    9,
    "Senda del Fanático"
  );
  return {
    ...base,
    rasgos: base.rasgos.map(r => (cambiosRasgos[r.nombre] ? { ...r, ...cambiosRasgos[r.nombre] } : r))
  };
}

describe("consultarRasgosEnAtaque con respuestas predefinidas", () => {
  beforeEach(() => {
    elegirOpcionMock.mockReset();
    usarAlmacenDM.setState({ personajes: [], idPersonajeActivo: null });
  });

  it("omite el diálogo y activa Ataque temerario cuando alAtacar es 'activar'", async () => {
    const pj = barbaroPreparado({
      "Ataque temerario": { respuestaPredefinida: { alAtacar: "activar" } },
      "Golpe brutal": { respuestaPredefinida: { alAtacar: "omitir" } }
    });
    usarAlmacenDM.setState({ personajes: [pj], idPersonajeActivo: pj.id });

    const resultado = await consultarRasgosAntesDeAtaque(pj.id, ataqueFuerza(), "plano", false);

    expect(elegirOpcionMock).not.toHaveBeenCalled();
    expect(resultado?.rasgos.find(r => r.nombre === "Ataque temerario")?.activo).toBe(true);
    expect(resultado?.rasgos.find(r => r.nombre === "Golpe brutal")?.activo).toBe(false);
  });

  it("omite el diálogo y deja inactivo Ataque temerario cuando alAtacar es 'omitir'", async () => {
    const pj = barbaroPreparado({
      "Ataque temerario": { respuestaPredefinida: { alAtacar: "omitir" } }
    });
    usarAlmacenDM.setState({ personajes: [pj], idPersonajeActivo: pj.id });

    const resultado = await consultarRasgosAntesDeAtaque(pj.id, ataqueFuerza(), "plano", false);

    expect(elegirOpcionMock).not.toHaveBeenCalled();
    expect(resultado?.rasgos.find(r => r.nombre === "Ataque temerario")?.activo).toBe(false);
  });

  it("devuelve las etiquetas predefinidas de Golpe brutal sin abrir diálogo", async () => {
    const pj = barbaroPreparado({
      "Ataque temerario": { activo: true },
      "Golpe brutal": {
        activo: true,
        respuestaPredefinida: { efectosTirada: ["inmovilizador"] }
      }
    });

    const etiquetas = await consultarEfectosEtiquetaEnDano(pj, ataqueFuerza());

    expect(elegirOpcionMock).not.toHaveBeenCalled();
    expect(etiquetas).toEqual(["Golpe inmovilizador"]);
  });

  it("aplica daño integrado predefinido (Furia divina radiante) sin diálogo", async () => {
    const pj = barbaroPreparado({
      "Furia": { activo: true },
      "Furia divina": {
        respuestaPredefinida: { danoIntegrado: { modo: "automatico", idOpcion: "radiante" } }
      }
    });
    usarAlmacenDM.setState({ personajes: [pj], idPersonajeActivo: pj.id });
    const emitir = vi.fn().mockResolvedValue(true);

    const ok = await ejecutarConsultaDanoAtaque(pj.id, ataqueFuerza(), emitir);

    expect(ok).toBe(true);
    expect(elegirOpcionMock).not.toHaveBeenCalled();
    expect(emitir).toHaveBeenCalledTimes(1);
    const extras = emitir.mock.calls[0][0];
    expect(extras).toHaveLength(1);
    expect(extras[0].tipoDano).toBe("Radiante");
  });
});
