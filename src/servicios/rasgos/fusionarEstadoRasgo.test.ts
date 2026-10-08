import { describe, expect, it } from "vitest";
import { fusionarEstadoRasgo } from "./fusionarEstadoRasgo";
import type { RasgoPersonaje } from "@/tipos";

const plantilla: RasgoPersonaje = {
  id: "rasgo", nombre: "Elección", descripcion: "Reglas", origen: "clase", fuente: "Catálogo",
  tipoAccion: "pasivo", tieneUsosLimitados: true, usosMaximos: 2, usosRestantes: 2,
  recuperacion: "descanso_largo", personalizado: false, activo: true, notas: "",
  selectores: [{ id: "selector", etiqueta: "Elección", tipo: "multiple", maxSelecciones: 2,
    valorActual: [], opciones: [{ id: "vigente", nombre: "Vigente", descripcion: "" }] }]
};

describe("Fusión de plantilla y estado mutable", () => {
  it("descarta opciones retiradas del catálogo y conserva variantes de las vigentes", () => {
    const anterior = structuredClone(plantilla);
    anterior.selectores![0].opciones.push({ id: "retirada", nombre: "Retirada", descripcion: "" });
    anterior.selectores![0].valorActual = ["retirada", "vigente:variante"];
    expect(fusionarEstadoRasgo(plantilla, anterior).selectores?.[0].valorActual).toEqual(["vigente:variante"]);
  });

  it("conserva datos heredados sin opciones deshidratadas y no modifica entradas", () => {
    const anterior = structuredClone(plantilla);
    anterior.selectores![0].opciones = [];
    anterior.selectores![0].valorActual = ["vigente"];
    anterior.usosRestantes = 1;
    anterior.activo = false;
    anterior.notas = "Anotación";
    const copia = structuredClone(anterior);
    const resultado = fusionarEstadoRasgo(plantilla, anterior);
    expect(resultado).toMatchObject({ usosRestantes: 1, activo: false, notas: "Anotación" });
    expect(resultado.selectores?.[0].valorActual).toEqual(["vigente"]);
    resultado.selectores![0].valorActual!.push("otro");
    expect(anterior).toEqual(copia);
  });
});
