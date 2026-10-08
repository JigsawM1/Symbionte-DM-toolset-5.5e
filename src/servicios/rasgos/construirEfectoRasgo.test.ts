import { describe, expect, it } from "vitest";
import { construirEfectoRasgo, type BorradorEfectoRasgo } from "./construirEfectoRasgo";
import { obtenerBonoAtaqueExtra } from "./evaluadorCombateRasgos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import type { RasgoPersonaje } from "@/tipos";

const datos: BorradorEfectoRasgo = {
  nuevoTipoEfecto: "bono_ataque", nuevoObjetivo: "todos_ataques", nuevoValor: "2", nuevoTipoDano: "",
  nuevoAplicaA: "todos_ataques", nuevoLimiteMaximo: 20, nuevoPermiteEscudo: true,
  nuevaDescripcionEfecto: "Bono", nuevoCondicion: ""
};

describe("Contrato entre construcción de efectos y evaluadores", () => {
  it("produce el mismo bono con un rasgo oficial y uno personalizado", () => {
    const efecto = construirEfectoRasgo(datos, "efecto");
    const rasgo: RasgoPersonaje = { id: "rasgo", nombre: "Bono", descripcion: "", origen: "clase", fuente: "Catálogo",
      tipoAccion: "pasivo", tieneUsosLimitados: false, recuperacion: "ninguno", personalizado: false,
      activo: true, notas: "", efectos: [efecto] };
    const contexto = { tipo: "arma" as const, caracteristica: "fuerza" as const, esCuerpoACuerpo: true, esDistancia: false };
    const oficial = obtenerBonoAtaqueExtra({ ...PERSONAJE_POR_DEFECTO, rasgos: [rasgo] }, contexto);
    const personalizado = obtenerBonoAtaqueExtra({ ...PERSONAJE_POR_DEFECTO,
      rasgos: [{ ...rasgo, origen: "personalizado", personalizado: true }] }, contexto);
    expect(oficial).toBe(2);
    expect(personalizado).toBe(oficial);
    expect(datos.nuevoValor).toBe("2");
  });
});
