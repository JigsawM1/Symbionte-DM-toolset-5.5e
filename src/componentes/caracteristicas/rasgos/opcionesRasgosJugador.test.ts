import { describe, expect, it } from "vitest";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { sincronizarRasgosAutomaticos } from "@/servicios/compendioRasgos";
import { agruparRasgosJerarquicos } from "./utilidadesProgresionRasgos";

describe("Secciones generales de opciones ejecutables", () => {
  it.each(["Maestro del Combate", "Guerrero Psiónico"])("agrupa %s sin duplicar opciones en Clase/Subclase", subclase => {
    const clases = [{ nombre: "Guerrero", nivel: 7, subclase }];
    const pj = { ...structuredClone(PERSONAJE_POR_DEFECTO), clase: "Guerrero", nivel: 7, subclase, clases };
    pj.rasgos = sincronizarRasgosAutomaticos(pj);
    const caja = pj.rasgos.find(r => r.selectores?.some(s => s.materializarRasgos))!;
    if (subclase === "Maestro del Combate") caja.selectores![0].valorActual = ["maniobra_finta"];
    pj.rasgos = sincronizarRasgosAutomaticos(pj);
    const grupo = agruparRasgosJerarquicos(pj.rasgos, clases).clases[0];
    expect(grupo.seccionesOpciones).toHaveLength(1);
    expect([...grupo.rasgosBase, ...grupo.rasgosSubclase].some(r => r.idSelectorOrigen)).toBe(false);
  });
});
