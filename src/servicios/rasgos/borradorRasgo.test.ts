import { describe, expect, it } from "vitest";
import { crearBorradorRasgo, construirRasgoDesdeBorrador, validarRasgoParaGuardar } from "./borradorRasgo";
import type { RasgoPersonaje } from "@/tipos";

const rasgoInicial: RasgoPersonaje = {
  id: "rasgo_hb_prueba", nombre: "Don activo", descripcion: "", origen: "personalizado",
  fuente: "Homebrew", tipoAccion: "accion_adicional", tieneUsosLimitados: true,
  usosMaximos: 3, usosRestantes: 2, recuperacion: "descanso_largo", personalizado: true,
  activo: true, esActivable: true, condicionAlActivar: "Postura activa", notas: "",
  requiereSinMovimiento: true, dadosGuardados: [18], costeFijo: 2
};

describe("Borrador compartido entre previsualización y guardado", () => {
  it("conserva activación, recursos y metadatos al editar solamente el nombre", () => {
    const borrador = crearBorradorRasgo(rasgoInicial);
    borrador.nombre = "Nombre nuevo";
    const resultado = construirRasgoDesdeBorrador(borrador, rasgoInicial);
    expect(resultado).toMatchObject({ nombre: "Nombre nuevo", activo: true, usosRestantes: 2,
      condicionAlActivar: "Postura activa", requiereSinMovimiento: true, dadosGuardados: [18], costeFijo: 2 });
    expect(rasgoInicial.nombre).toBe("Don activo");
  });

  it("crea activables apagados sin incluir texto ficticio en los datos", () => {
    const borrador = crearBorradorRasgo();
    borrador.esActivable = true;
    const rasgo = construirRasgoDesdeBorrador(borrador);
    expect(rasgo.activo).toBe(false);
    expect(rasgo.nombre).toBe("");
    expect(rasgo.descripcion).toBe("");
    expect(validarRasgoParaGuardar(rasgo).valido).toBe(false);
  });

  it.each([-5, 4, Number.NaN, Number.POSITIVE_INFINITY])("rechaza usos restantes inválidos: %s", (restantes) => {
    const resultado = validarRasgoParaGuardar({ ...rasgoInicial, usosRestantes: restantes });
    expect(resultado.valido).toBe(false);
    if (!resultado.valido) expect(resultado.errores.usosRestantes).toBeTruthy();
  });

  it("rechaza nombre vacío, nivel inválido y máximo inferior a uno", () => {
    const resultado = validarRasgoParaGuardar({ ...rasgoInicial, nombre: "   ", nivelRequerido: 21, usosMaximos: -1 });
    expect(resultado.valido).toBe(false);
    if (!resultado.valido) {
      expect(resultado.errores.nombre).toBeTruthy();
      expect(resultado.errores.nivelRequerido).toBeTruthy();
      expect(resultado.errores.usosMaximos).toBeTruthy();
    }
  });

  it("clona datos editables para no modificar el rasgo original", () => {
    const original = { ...rasgoInicial, efectos: [{ tipo: "bono_ataque" as const, objetivo: "todos_ataques", valor: 2 }] };
    const borrador = crearBorradorRasgo(original);
    borrador.efectos[0].valor = 7;
    expect(original.efectos[0].valor).toBe(2);
  });
});
