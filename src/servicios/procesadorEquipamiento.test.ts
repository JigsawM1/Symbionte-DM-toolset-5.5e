import { describe, it, expect } from "vitest";
import { procesarAlternarEquipado } from "./procesadorEquipamiento";
import type { ObjetoInventario } from "@/tipos";

describe("procesadorEquipamiento", () => {
  const crearObjeto = (datos: Partial<ObjetoInventario>): ObjetoInventario => ({
    idInstancia: "inst_1",
    idObjeto: "obj_1",
    nombre: "Espada Larga",
    tipoPrincipal: "Arma",
    pesoLb: 3,
    cantidad: 1,
    equipable: true,
    equipado: false,
    sintonizado: false,
    esMagico: false,
    rareza: "Común",
    sintonizacionRequerida: false,
    notas: "",
    contenedor: "mochila",
    ...datos
  });

  it("no debe modificar el inventario si el objeto no es equipable", () => {
    const inventario = [crearObjeto({ idInstancia: "pocion_1", equipable: false, equipado: false })];
    const resultado = procesarAlternarEquipado(inventario, "pocion_1");
    expect(resultado[0].equipado).toBe(false);
  });

  it("debe equipar un objeto simple de cantidad 1", () => {
    const inventario = [crearObjeto({ idInstancia: "espada_1", equipado: false })];
    const resultado = procesarAlternarEquipado(inventario, "espada_1");
    expect(resultado[0].equipado).toBe(true);
  });

  it("debe desequipar una armadura previa al equipar una nueva pero preservar el escudo equipado", () => {
    const cotaMalla = crearObjeto({
      idInstancia: "cota_1",
      nombre: "Cota de Malla",
      tipoPrincipal: "Armadura",
      equipado: true
    });
    const escudo = crearObjeto({
      idInstancia: "escudo_1",
      nombre: "Escudo",
      tipoPrincipal: "Armadura",
      equipado: true
    });
    const cueroTachonado = crearObjeto({
      idInstancia: "cuero_1",
      nombre: "Cuero Tachonado",
      tipoPrincipal: "Armadura",
      equipado: false
    });

    const inventario = [cotaMalla, escudo, cueroTachonado];
    const resultado = procesarAlternarEquipado(inventario, "cuero_1");

    const cotaResultado = resultado.find((o) => o.idInstancia === "cota_1");
    const escudoResultado = resultado.find((o) => o.idInstancia === "escudo_1");
    const cueroResultado = resultado.find((o) => o.idInstancia === "cuero_1");

    expect(cotaResultado?.equipado).toBe(false);
    expect(escudoResultado?.equipado).toBe(true);
    expect(cueroResultado?.equipado).toBe(true);
  });

  it("debe permitir equipar un escudo cuando ya hay una armadura corporal equipada", () => {
    const armaduraPlacas = crearObjeto({
      idInstancia: "placas_1",
      nombre: "Armadura de Placas",
      tipoPrincipal: "Armadura",
      equipado: true
    });
    const escudo = crearObjeto({
      idInstancia: "escudo_1",
      nombre: "Escudo",
      tipoPrincipal: "Armadura",
      equipado: false
    });

    const inventario = [armaduraPlacas, escudo];
    const resultado = procesarAlternarEquipado(inventario, "escudo_1");

    const armaduraResultado = resultado.find((o) => o.idInstancia === "placas_1");
    const escudoResultado = resultado.find((o) => o.idInstancia === "escudo_1");

    expect(armaduraResultado?.equipado).toBe(true);
    expect(escudoResultado?.equipado).toBe(true);
  });

  it("debe permitir equipar una armadura cuando ya hay un escudo equipado", () => {
    const escudo = crearObjeto({
      idInstancia: "escudo_1",
      nombre: "Escudo",
      tipoPrincipal: "Armadura",
      equipado: true
    });
    const armaduraCuero = crearObjeto({
      idInstancia: "cuero_1",
      nombre: "Armadura de Cuero",
      tipoPrincipal: "Armadura",
      equipado: false
    });

    const inventario = [escudo, armaduraCuero];
    const resultado = procesarAlternarEquipado(inventario, "cuero_1");

    const escudoResultado = resultado.find((o) => o.idInstancia === "escudo_1");
    const armaduraResultado = resultado.find((o) => o.idInstancia === "cuero_1");

    expect(escudoResultado?.equipado).toBe(true);
    expect(armaduraResultado?.equipado).toBe(true);
  });

  it("debe desequipar un escudo previo al equipar un nuevo escudo preservando la armadura", () => {
    const armaduraCuero = crearObjeto({
      idInstancia: "cuero_1",
      nombre: "Armadura de Cuero",
      tipoPrincipal: "Armadura",
      equipado: true
    });
    const escudoViejo = crearObjeto({
      idInstancia: "escudo_1",
      nombre: "Escudo de Madera",
      tipoPrincipal: "Armadura",
      equipado: true
    });
    const escudoMagico = crearObjeto({
      idInstancia: "escudo_2",
      nombre: "Escudo +1",
      tipoPrincipal: "Armadura",
      equipado: false
    });

    const inventario = [armaduraCuero, escudoViejo, escudoMagico];
    const resultado = procesarAlternarEquipado(inventario, "escudo_2");

    const armaduraResultado = resultado.find((o) => o.idInstancia === "cuero_1");
    const viejoResultado = resultado.find((o) => o.idInstancia === "escudo_1");
    const magicoResultado = resultado.find((o) => o.idInstancia === "escudo_2");

    expect(armaduraResultado?.equipado).toBe(true);
    expect(viejoResultado?.equipado).toBe(false);
    expect(magicoResultado?.equipado).toBe(true);
  });

  it("debe dividir un stack al equipar si la cantidad es mayor a 1", () => {
    const dagas = crearObjeto({
      idInstancia: "daga_stack",
      nombre: "Daga",
      cantidad: 3,
      equipado: false
    });

    const inventario = [dagas];
    const resultado = procesarAlternarEquipado(inventario, "daga_stack");

    expect(resultado.length).toBe(2);
    const equipada = resultado.find((o) => o.idInstancia === "daga_stack");
    const resto = resultado.find((o) => o.idInstancia !== "daga_stack");

    expect(equipada?.cantidad).toBe(1);
    expect(equipada?.equipado).toBe(true);
    expect(resto?.cantidad).toBe(2);
    expect(resto?.equipado).toBe(false);
  });

  it("debe fusionar el objeto con uno idéntico en mochila al desequipar", () => {
    const equipada = crearObjeto({
      idInstancia: "antorcha_equip",
      idObjeto: "obj_antorcha",
      nombre: "Antorcha",
      cantidad: 1,
      equipado: true
    });
    const mochila = crearObjeto({
      idInstancia: "antorcha_mochila",
      idObjeto: "obj_antorcha",
      nombre: "Antorcha",
      cantidad: 4,
      equipado: false
    });

    const inventario = [equipada, mochila];
    const resultado = procesarAlternarEquipado(inventario, "antorcha_equip");

    expect(resultado.length).toBe(1);
    expect(resultado[0].idInstancia).toBe("antorcha_mochila");
    expect(resultado[0].cantidad).toBe(5);
    expect(resultado[0].equipado).toBe(false);
  });
});
