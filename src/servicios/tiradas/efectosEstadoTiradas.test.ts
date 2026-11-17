import { beforeEach, describe, expect, it } from "vitest";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { EsquemaAcompanantePersonaje } from "@/tipos/personaje";
import {
  aplicarResultadoHpTemporalEnEstado,
  aplicarResultadoIniciativaEnEstado,
  aplicarResultadoSalvacionMuerteEnEstado,
  efectosEstadoTiradasDM
} from "./efectosEstadoTiradas";

describe("efectosEstadoTiradas (Adaptador DM de resultados sobre Zustand)", () => {
  beforeEach(() => {
    const personajeBase = {
      ...structuredClone(PERSONAJE_POR_DEFECTO),
      id: "pj-efecto-1",
      nombre: "Lyra",
      hpActual: 12,
      hpMaximo: 24,
      hpMaximoBase: 24,
      hpTemporal: 5,
      dadosGolpeTotal: 4,
      dadosGolpeRestantes: 2,
      salvacionesMuerte: { exitos: 0, fallos: 0 },
      acompanantes: [
        EsquemaAcompanantePersonaje.parse({
          id: "acomp-1",
          nombre: "Lobo Espectral",
          idPlantilla: "lobo",
          vidaMaxima: 18,
          vidaActual: 18,
          ca: 13,
          velocidad: "40 pies"
        })
      ],
      rasgos: []
    };

    usarAlmacenDM.setState({
      tipoTirada: "plano",
      colaIniciativa: [],
      notificaciones: [],
      personajes: [personajeBase]
    });
  });

  it("aplica HP temporal conservando el valor máximo sin acumular (D&D 5.5e)", () => {
    aplicarResultadoHpTemporalEnEstado("pj-efecto-1", 3);
    expect(usarAlmacenDM.getState().personajes[0].hpTemporal).toBe(5);

    aplicarResultadoHpTemporalEnEstado("pj-efecto-1", 9);
    expect(usarAlmacenDM.getState().personajes[0].hpTemporal).toBe(9);
  });

  it("aplica todas las reglas D&D 5.5e de salvación contra la muerte (1, 20, éxito, fallo)", () => {
    aplicarResultadoSalvacionMuerteEnEstado("pj-efecto-1", 1);
    expect(usarAlmacenDM.getState().personajes[0].salvacionesMuerte.fallos).toBe(2);

    aplicarResultadoSalvacionMuerteEnEstado("pj-efecto-1", 8);
    expect(usarAlmacenDM.getState().personajes[0].salvacionesMuerte.fallos).toBe(3);

    aplicarResultadoSalvacionMuerteEnEstado("pj-efecto-1", 14);
    expect(usarAlmacenDM.getState().personajes[0].salvacionesMuerte.exitos).toBe(1);

    const hpAntes = usarAlmacenDM.getState().personajes[0].hpActual;
    aplicarResultadoSalvacionMuerteEnEstado("pj-efecto-1", 20);
    expect(usarAlmacenDM.getState().personajes[0].salvacionesMuerte.exitos).toBe(3);
    expect(usarAlmacenDM.getState().personajes[0].hpActual).toBe(hpAntes + 1);
  });

  it("incorpora y actualiza en la cola de iniciativa a héroes, acompañantes y monstruos fallback", () => {
    // 1. Acompañante nuevo
    aplicarResultadoIniciativaEnEstado(
      {
        tipo: "iniciativa",
        criaturaId: "acomp-1",
        idAcompanante: "acomp-1",
        nombrePersonaje: "Lobo Espectral"
      },
      19
    );
    let state = usarAlmacenDM.getState();
    expect(state.colaIniciativa).toHaveLength(1);
    expect(state.colaIniciativa[0]).toMatchObject({
      id: "acomp-1",
      iniciativa: 19,
      esAcompanante: true,
      esMonstruo: false
    });
    expect(state.personajes[0].acompanantes?.[0].iniciativa).toBe(19);

    // 2. Héroe nuevo
    aplicarResultadoIniciativaEnEstado(
      {
        tipo: "iniciativa",
        criaturaId: "pj-efecto-1",
        idPersonaje: "pj-efecto-1",
        nombrePersonaje: "Lyra"
      },
      15
    );
    state = usarAlmacenDM.getState();
    expect(state.colaIniciativa).toHaveLength(2);
    expect(state.colaIniciativa[1]).toMatchObject({
      id: "pj-efecto-1",
      iniciativa: 15,
      esMonstruo: false
    });

    // 3. Monstruo genérico fallback + actualización posterior
    aplicarResultadoIniciativaEnEstado(
      { tipo: "iniciativa", criaturaId: "goblin-7", nombrePersonaje: "Goblin Explorador" },
      11
    );
    expect(usarAlmacenDM.getState().colaIniciativa).toHaveLength(3);
    expect(usarAlmacenDM.getState().colaIniciativa[2].esMonstruo).toBe(true);

    aplicarResultadoIniciativaEnEstado({ tipo: "iniciativa", criaturaId: "goblin-7" }, 22);
    expect(usarAlmacenDM.getState().colaIniciativa[2].iniciativa).toBe(22);
  });

  it("valida dados de golpe disponibles considerando en vuelo y notifica el restante real tras gastar", () => {
    expect(efectosEstadoTiradasDM.puedeGastarDadoGolpe("pj-efecto-1", 1)).toBe(true);
    expect(efectosEstadoTiradasDM.puedeGastarDadoGolpe("pj-efecto-1", 2)).toBe(false);

    efectosEstadoTiradasDM.gastarDadoGolpeYNotificar("pj-efecto-1", 6);
    const state = usarAlmacenDM.getState();
    expect(state.personajes[0].dadosGolpeRestantes).toBe(1);
    expect(state.notificaciones.at(-1)?.mensaje).toContain("Resultado: 6 (1 dados restantes).");
  });
});
