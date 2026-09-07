import { describe, it, expect } from "vitest";
import {
  obtenerInfoMaestria,
  obtenerInfoPropiedadArma,
  obtenerInfoPropiedadArmadura
} from "./resolutorPropiedades";

describe("resolutorPropiedades - D&D 5.5e y 5e", () => {
  describe("obtenerInfoMaestria", () => {
    it("resuelve maestrías en inglés y español", () => {
      const cleave = obtenerInfoMaestria("Cleave");
      expect(cleave.titulo).toContain("Hender");
      expect(cleave.descripcion).toContain("segunda criatura");

      const graze = obtenerInfoMaestria("roce");
      expect(graze.titulo).toContain("Rozar");
      expect(graze.descripcion).toContain("modificador de la característica");

      const topple = obtenerInfoMaestria("Derribar");
      expect(topple.titulo).toContain("Derribar");
      expect(topple.descripcion).toContain("Derribada");

      const nick = obtenerInfoMaestria("Nick (Corte)");
      expect(nick.titulo).toContain("Mellar");
      expect(nick.descripcion).toContain("Ligera");
    });

    it("maneja armas sin maestría o vacías", () => {
      const ninguna = obtenerInfoMaestria("Ninguna");
      expect(ninguna.titulo).toBe("Sin Maestría");

      const vacia = obtenerInfoMaestria("");
      expect(vacia.titulo).toBe("Sin Maestría");
    });
  });

  describe("obtenerInfoPropiedadArma", () => {
    it("resuelve propiedades principales", () => {
      const finesse = obtenerInfoPropiedadArma("Sutil (Finesse)");
      expect(finesse.titulo).toContain("Sutil");
      expect(finesse.descripcion).toContain("Fuerza o de Destreza");

      const versatile = obtenerInfoPropiedadArma("Versátil (1d10)");
      expect(versatile.titulo).toContain("Versátil");
      expect(versatile.descripcion).toContain("dos manos");

      const heavy = obtenerInfoPropiedadArma("Pesada");
      expect(heavy.titulo).toContain("Pesada");
      expect(heavy.descripcion).toContain("Pequeño");

      const loading = obtenerInfoPropiedadArma("Carga (Loading)");
      expect(loading.titulo).toContain("Recarga");
      expect(loading.descripcion).toContain("recarga");
    });
  });

  describe("obtenerInfoPropiedadArmadura", () => {
    it("resuelve desventaja en sigilo y fuerza", () => {
      const sigilo = obtenerInfoPropiedadArmadura("desventajaSigilo");
      expect(sigilo.titulo).toBe("Desventaja en Sigilo");
      expect(sigilo.descripcion).toContain("Sigilo");

      const fue = obtenerInfoPropiedadArmadura("requisitoFuerza", 15);
      expect(fue.titulo).toContain("15");
      expect(fue.descripcion).toContain("10 pies");
    });

    it("resuelve bonos de destreza", () => {
      const completa = obtenerInfoPropiedadArmadura("bonoDestreza", "Completo");
      expect(completa.titulo).toContain("Completo");

      const max2 = obtenerInfoPropiedadArmadura("bonoDestreza", "Máx 2");
      expect(max2.titulo).toContain("Máximo +2");

      const sinBono = obtenerInfoPropiedadArmadura("bonoDestreza", "Sin Bono");
      expect(sinBono.titulo).toContain("Sin Bono");
      expect(sinBono.descripcion).toContain("armadura pesada");

      const ninguna = obtenerInfoPropiedadArmadura("bonoDestreza", "Ninguno");
      expect(ninguna.titulo).toContain("Sin Bono");
    });
  });
});
