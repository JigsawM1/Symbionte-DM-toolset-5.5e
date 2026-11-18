import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import type { PersonajeJugador } from "@/tipos";
import { construirEntradaJugador, alternarRolCriaturaHelper } from "@/almacen/slices/iniciativa/fabricaCriaturasIniciativa";
import { coincideIdentidadPersonaje, resolverPersonajeAsociado, resolverPersonajePorNombre } from "./resolutorCriaturas";
import { proyectarBorradorCombatePJ } from "./sincronizacion/proyeccionEstadoCombate";
import { calcularBonificadorIniciativa } from "./personajes/bonificadorIniciativa";
import { sincronizarConEstadoLocal } from "./sincronizacionIniciativa";
import { crearIndiceMonstruos } from "./indiceMonstruos";
import { aplicarResultadoIniciativaEnEstado } from "./tiradas/iniciativaEstadoTiradas";

const inicial = usarAlmacenDM.getState();
function ficha(id: string, nombre: string): PersonajeJugador {
  return { ...structuredClone(PERSONAJE_POR_DEFECTO), id, nombre, idMiniaturaTS: null,
    caracteristicas: { fuerza: 10, destreza: 10, constitucion: 10, inteligencia: 10, sabiduria: 10, carisma: 10 },
    rasgos: [], condicionesActivas: [], efectosActivos: [], hpActual: 10, hpMaximo: 10, acompanantes: [] };
}
beforeEach(() => usarAlmacenDM.setState({ personajes: [], colaIniciativa: [], esGM: true, asociacionesFichas: {} }));
afterEach(() => usarAlmacenDM.setState(inicial, true));

describe("Identidad de fichas e iniciativa: regresiones de auditoría CEF", () => {
  it.each([undefined, "plantilla-monstruo"])("prioriza el ID del monstruo homónimo con plantilla %s", idPlantillaAsociada => {
    const pj = ficha("pj_homonimo", "Homónimo");
    const monstruo = { ...construirEntradaJugador(pj, -1, []), id: "mini_monstruo", esMonstruo: true,
      idPersonajeDuenio: undefined, idPlantillaAsociada };
    usarAlmacenDM.setState({ personajes: [pj], colaIniciativa: [monstruo] });
    aplicarResultadoIniciativaEnEstado({ tipo: "iniciativa", criaturaId: monstruo.id, nombrePersonaje: pj.nombre }, 18);
    expect(usarAlmacenDM.getState().colaIniciativa).toEqual([{ ...monstruo, iniciativa: 18 }]);
    usarAlmacenDM.setState({ colaIniciativa: [monstruo, construirEntradaJugador(pj, -1, [])] });
    aplicarResultadoIniciativaEnEstado({ tipo: "iniciativa", criaturaId: monstruo.id, nombrePersonaje: pj.nombre }, 12);
    expect(usarAlmacenDM.getState().colaIniciativa.map(c => [c.id, c.iniciativa, c.esMonstruo]))
      .toEqual([[monstruo.id, 12, true], [pj.id, 0, false]]);
  });

  it.each([["Auditoría A", "Auditoría B"], ["Héroe 1", "Héroe 2"], ["Homónimo", "Homónimo"]])(
    "conserva dos identidades, orden y vida para %s / %s", (nombreA, nombreB) => {
      const a = ficha("pj_a", nombreA), b = ficha("pj_b", nombreB);
      b.hpActual = 7;
      usarAlmacenDM.setState({ personajes: [b, a] });
      const s = usarAlmacenDM.getState();
      s.agregarPersonajeAIniciativa(a); s.agregarPersonajeAIniciativa(b); s.agregarPersonajeAIniciativa(b);
      expect(usarAlmacenDM.getState().colaIniciativa.map(c => [c.idPersonajeDuenio, c.vidaActual])).toEqual([[a.id, 10], [b.id, 7]]);
      s.aplicarCondicionPersonaje(b.id, "Envenenado");
      expect(usarAlmacenDM.getState().colaIniciativa.map(c => c.condiciones)).toEqual([[], ["Envenenado"]]);
      const borrador = proyectarBorradorCombatePJ({ ...b, hpActual: 4 });
      s.aplicarBorradorCombatePJ(borrador);
      expect(usarAlmacenDM.getState().colaIniciativa.map(c => c.vidaActual)).toEqual([10, 4]);
      expect(usarAlmacenDM.getState().personajes.find(p => p.id === a.id)?.hpActual).toBe(10);
      aplicarResultadoIniciativaEnEstado({ tipo: "iniciativa", criaturaId: b.id, idPersonaje: b.id, nombrePersonaje: b.nombre }, 18);
      expect(usarAlmacenDM.getState().colaIniciativa.map(c => c.iniciativa)).toEqual([0, 18]);
    }
  );

  it("prioriza miniatura y dueño sobre un nombre coincidente anterior y rechaza nombres ambiguos", () => {
    const a = ficha("pj_a", "Auditoría A"), b = { ...ficha("pj_b", "Auditoría B"), idMiniaturaTS: "mini_b" };
    expect(resolverPersonajeAsociado("MINI_B", a.nombre, [a, b])?.id).toBe(b.id);
    expect(resolverPersonajeAsociado("fila", a.nombre, [a, b], b.id)?.id).toBe(b.id);
    expect(resolverPersonajeAsociado("fila", a.nombre, [a, b], "pj_desconocido")).toBeUndefined();
    expect(resolverPersonajePorNombre(b.nombre, [a, b])?.id).toBe(b.id);
    expect(resolverPersonajePorNombre("Auditoría", [a, b])).toBeUndefined();
    expect(resolverPersonajePorNombre("Igual", [ficha("a", "Igual"), ficha("b", "Igual")])).toBeUndefined();
  });

  it("propaga condiciones por miniatura y dueño sin tocar al homónimo", () => {
    const a = ficha("pj_a", "Igual"), b = ficha("pj_b", "Igual");
    a.idMiniaturaTS = "mini_a"; b.idMiniaturaTS = "mini_b";
    const entradaA = construirEntradaJugador(a, -1, []), entradaB = construirEntradaJugador(b, -1, []);
    usarAlmacenDM.setState({ personajes: [a, b], colaIniciativa: [entradaB, entradaA] });
    const s = usarAlmacenDM.getState();
    s.aplicarCondicionEnArea("Derribado", [entradaB.id]);
    expect(usarAlmacenDM.getState().personajes.map(p => p.condicionesActivas)).toEqual([[], ["Derribado"]]);
    s.aplicarCondicionPersonaje(b.id, "Envenenado");
    expect(usarAlmacenDM.getState().colaIniciativa[1].condiciones).toEqual([]);
    s.agregarPersonajeAIniciativa(b);
    expect(usarAlmacenDM.getState().colaIniciativa).toHaveLength(2);
  });

  it("adopta una fila genérica única y nunca la entrada identificada de otra ficha", () => {
    const a = ficha("pj_a", "Auditoría A"), b = ficha("pj_b", "Auditoría B");
    usarAlmacenDM.setState({ personajes: [a, b] });
    const s = usarAlmacenDM.getState();
    s.agregarCriaturaAIniciativa({ nombre: a.nombre, iniciativa: 17, vidaMax: 10, ca: 10, esMonstruo: false, velocidad: "30 pies", bonifInic: 0 });
    const idGenerico = usarAlmacenDM.getState().colaIniciativa[0].id;
    s.agregarPersonajeAIniciativa(a); s.agregarPersonajeAIniciativa(b);
    expect(usarAlmacenDM.getState().colaIniciativa).toHaveLength(2);
    expect(usarAlmacenDM.getState().colaIniciativa[0]).toMatchObject({ id: a.id, iniciativa: 17 });
    expect(idGenerico).not.toBe(a.id);
    expect(coincideIdentidadPersonaje(usarAlmacenDM.getState().colaIniciativa[0], b)).toBe(false);
  });
});

describe("Bono de iniciativa coherente entre ficha, fábrica e importación", () => {
  it.each([[false, 0], [false, 3], [false, -2], [true, 0], [true, 3], [true, -2]] as const)("Alerta %s y ajuste manual %s conservan la iniciativa tirada", (alerta, ajuste) => {
    const pj = ficha("pj_alerta", "Alerta");
    pj.idMiniaturaTS = "mini_alerta"; pj.iniciativaBono = ajuste;
    pj.rasgos = alerta ? [{ id: "alerta", nombre: "Alerta", descripcion: "", origen: "dote", fuente: "Alerta", tipoAccion: "pasivo", tieneUsosLimitados: false, recuperacion: "ninguno", personalizado: false, activo: true, notas: "",
      efectos: [{ tipo: "modificador_stat", objetivo: "iniciativa", valor: "bono_competencia" }] }] : [];
    const bono = calcularBonificadorIniciativa(pj, 0);
    expect(bono).toBe((alerta ? 2 : 0) + ajuste);
    const entrada = construirEntradaJugador(pj, -1, []);
    expect(entrada.bonificadorIniciativa).toBe(bono);
    const previa = { ...entrada, iniciativa: 19, bonificadorIniciativa: 0 };
    expect(alternarRolCriaturaHelper([{ ...previa, esMonstruo: true }], previa.id, [pj], [], {})[0].bonificadorIniciativa).toBe(bono);
    for (const colaLocal of [[], [previa]]) {
      const resultado = sincronizarConEstadoLocal({ colaTS: { items: [{ id: "mini_alerta", name: pj.nombre, kind: "creature" }], activeItemIndex: 0 },
        colaLocal, asociacionesFichas: {}, indiceMonstruos: crearIndiceMonstruos([]), metodoVidaMonstruo: "estandar",
        indiceTurnoActivo: 0, rondaActual: 1, personajes: [pj] });
      expect(resultado.colaIniciativa[0].bonificadorIniciativa).toBe(bono);
      expect(resultado.colaIniciativa[0].iniciativa).toBe(colaLocal.length ? 19 : 0);
    }
  });
});
