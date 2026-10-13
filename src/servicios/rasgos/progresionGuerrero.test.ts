import { beforeEach, describe, expect, it } from "vitest";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { crearBorradorRasgo, construirRasgoDesdeBorrador } from "./borradorRasgo";
import { sincronizarRasgosAutomaticos } from "../compendioRasgos";
import { obtenerRasgosClaseYSubclase } from "../gestorClases";

describe("Progresión y procedencia independiente de Guerrero", () => {
  beforeEach(() => usarAlmacenDM.setState({ personajes: [], colaIniciativa: [] }));
  const crear = (subclase: string, nivel: number) => usarAlmacenDM.getState().crearPersonaje({ ...structuredClone(PERSONAJE_POR_DEFECTO),
    clase: "Guerrero", subclase, nivel, clases: [{ nombre: "Guerrero", subclase, nivel }] });
  it("conserva usos gastados al subir y bajar de nivel, y limita las elecciones al nuevo máximo", () => {
    const id = crear("Maestro del Combate", 3);
    const leer = () => usarAlmacenDM.getState().personajes.find(p => p.id === id)!;
    const recurso = leer().rasgos.find(r => r.nombre === "Supremacía en combate")!;
    usarAlmacenDM.getState().gastarUsoRasgoPersonaje(id, recurso.id, 2);
    usarAlmacenDM.getState().actualizarPersonaje(id, { nivel: 7, clases: [{ nombre: "Guerrero", subclase: "Maestro del Combate", nivel: 7 }] });
    expect(leer().rasgos.find(r => r.id === recurso.id)).toMatchObject({ usosMaximos: 5, usosRestantes: 3 });
    const caja = leer().rasgos.find(r => r.nombre === "Opciones de maniobras")!;
    const sel = caja.selectores![0];
    usarAlmacenDM.getState().actualizarSeleccionRasgo(id, caja.id, sel.id, sel.opciones.slice(0, 5).map(o => o.id));
    usarAlmacenDM.getState().actualizarPersonaje(id, { nivel: 3, clases: [{ nombre: "Guerrero", subclase: "Maestro del Combate", nivel: 3 }] });
    expect(leer().rasgos.find(r => r.id === recurso.id)).toMatchObject({ usosMaximos: 4, usosRestantes: 2 });
    expect(leer().rasgos.find(r => r.id === caja.id)!.selectores![0].valorActual).toHaveLength(3);
  });
  it("cambiar de subclase elimina su estilo adicional y conserva una dote independiente", () => {
    const id = crear("Campeón", 7);
    const leer = () => usarAlmacenDM.getState().personajes.find(p => p.id === id)!;
    const adicional = leer().rasgos.find(r => r.nombre === "Estilo de combate adicional")!;
    const sel = adicional.selectores![0];
    const estilo = sel.opciones.find(o => o.id !== "dote_estilo_defensa")!;
    usarAlmacenDM.getState().actualizarSeleccionRasgo(id, adicional.id, sel.id, [estilo.id]);
    const ajena = { ...leer().rasgos.find(r => r.ligadoA === adicional.id)!, id: "dote_estilo_ajena", ligadoA: undefined, fuente: "Otra fuente" };
    usarAlmacenDM.getState().agregarRasgoPersonaje(id, ajena);
    usarAlmacenDM.getState().actualizarPersonaje(id, { subclase: "Maestro del Combate", clases: [{ nombre: "Guerrero", subclase: "Maestro del Combate", nivel: 7 }] });
    expect(leer().rasgos.some(r => r.ligadoA === adicional.id)).toBe(false);
    expect(leer().rasgos.find(r => r.id === ajena.id)).toMatchObject({ fuente: "Otra fuente" });
    expect(leer().rasgos.some(r => r.nombre === "Estilo de combate")).toBe(true);
  });
  it.each(["actualizar", "build"])("retira la magia de subclase y conserva capacidad y aprendizaje ajenos mediante %s", modo => {
    const id = crear("Caballero Arcano", 10);
    const leer = () => usarAlmacenDM.getState().personajes.find(p => p.id === id)!;
    const b = crearBorradorRasgo();
    b.nombre = "Magia ajena";
    b.configuracionMagica = { tipoLanzador: "completo", habilidadConjuro: "sabiduria", modeloConjuros: "preparados", nivelInicio: 1, listaConjuros: "clerigo" };
    const ajeno = construirRasgoDesdeBorrador(b);
    usarAlmacenDM.getState().agregarRasgoPersonaje(id, ajeno);
    usarAlmacenDM.getState().actualizarPersonaje(id, { conjurosConocidosIds: ["bendicion"] });
    expect(leer().clasesLanzadoras).toHaveLength(2);
    if (modo === "actualizar") usarAlmacenDM.getState().actualizarPersonaje(id, { subclase: "Campeón", clases: [{ nombre: "Guerrero", subclase: "Campeón", nivel: 10 }] });
    else usarAlmacenDM.getState().aplicarBuildClasePersonaje(id, "Guerrero", 10, "Campeón");
    expect(leer().clasesLanzadoras).toMatchObject([{ idRasgoOrigen: ajeno.id }]);
    expect(leer().clasesLanzadoras).toHaveLength(1);
    expect(leer().conjurosConocidosIds).toContain("bendicion");
  });
  it("resincronizar un recurso agotado no lo rellena", () => {
    const pj = { ...structuredClone(PERSONAJE_POR_DEFECTO), nivel: 18, clase: "Guerrero", subclase: "Guerrero Psiónico",
      clases: [{ nombre: "Guerrero", subclase: "Guerrero Psiónico", nivel: 18 }], rasgos: obtenerRasgosClaseYSubclase("Guerrero", 18, "Guerrero Psiónico") };
    pj.rasgos.find(r => r.nombre === "Poder psiónico")!.usosRestantes = 0;
    expect(sincronizarRasgosAutomaticos(pj).find(r => r.nombre === "Poder psiónico")!.usosRestantes).toBe(0);
  });
});
