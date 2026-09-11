import { describe, it, expect, beforeEach } from "vitest";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import type { RasgoPersonaje, PersonajeJugador } from "@/tipos";
import { estaAtaqueTemerarioActivo } from "@/servicios/evaluadorEfectosRasgos";
import { evaluarEfectosCondicionesEnTirada } from "@/servicios/procesadorCondiciones";

describe("SlicePersonajes - Daño y Escudo (HP Temporal)", () => {
  beforeEach(() => {
    usarAlmacenDM.setState({
      personajes: [
        {
          ...PERSONAJE_POR_DEFECTO,
          id: "test-pj",
          nombre: "Guerrero Test",
          clase: "Guerrero",
          trasfondo: "Soldado",
          hpMaximoBase: 20,
          hpMaximo: 20,
          hpActual: 20,
          hpTemporal: 0
        }
      ],

      idPersonajeActivo: "test-pj"
    });
  });

  it("aplica daño directo a la vida actual cuando no hay escudo", () => {
    const { aplicarDanoPersonaje } = usarAlmacenDM.getState();
    aplicarDanoPersonaje("test-pj", 5);

    const pj = usarAlmacenDM.getState().personajes[0];
    expect(pj.hpActual).toBe(15);
    expect(pj.hpTemporal).toBe(0);
  });

  it("absorbe el daño completamente con el escudo si el daño es menor o igual al HP temporal", () => {
    usarAlmacenDM.getState().modificarHPTemporalPersonaje("test-pj", 10);
    const { aplicarDanoPersonaje } = usarAlmacenDM.getState();

    aplicarDanoPersonaje("test-pj", 4);

    const pj = usarAlmacenDM.getState().personajes[0];
    expect(pj.hpTemporal).toBe(6);
    expect(pj.hpActual).toBe(20); // La vida actual permanece intacta
  });

  it("rompe el escudo y pasa el daño excedente a la vida actual si el daño supera el HP temporal", () => {
    usarAlmacenDM.getState().modificarHPTemporalPersonaje("test-pj", 5);
    const { aplicarDanoPersonaje } = usarAlmacenDM.getState();

    // Daño de 8 con 5 de escudo -> Rompe escudo (0) y hace 3 de daño a vida (20 - 3 = 17)
    aplicarDanoPersonaje("test-pj", 8);

    const pj = usarAlmacenDM.getState().personajes[0];
    expect(pj.hpTemporal).toBe(0);
    expect(pj.hpActual).toBe(17);
  });

  it("modificarHPPersonaje con delta negativo absorbe el escudo primero", () => {
    usarAlmacenDM.getState().modificarHPTemporalPersonaje("test-pj", 7);
    const { modificarHPPersonaje } = usarAlmacenDM.getState();

    modificarHPPersonaje("test-pj", -10);

    const pj = usarAlmacenDM.getState().personajes[0];
    expect(pj.hpTemporal).toBe(0);
    expect(pj.hpActual).toBe(17); // 20 - (10 - 7) = 17
  });

  it("modificarHPPersonaje con delta positivo cura la vida actual sin alterar el escudo", () => {
    usarAlmacenDM.getState().modificarHPPersonaje("test-pj", -10); // Vida a 10
    usarAlmacenDM.getState().modificarHPTemporalPersonaje("test-pj", 5); // Escudo 5

    const { modificarHPPersonaje } = usarAlmacenDM.getState();
    modificarHPPersonaje("test-pj", 6); // Cura 6 HP

    const pj = usarAlmacenDM.getState().personajes[0];
    expect(pj.hpActual).toBe(16);
    expect(pj.hpTemporal).toBe(5); // El escudo se mantiene
  });

  describe("Sincronización Cansancio <-> Condición Cansado", () => {
    it("aplicar condición Cansado incrementa el nivel de cansancio", () => {
      const { aplicarCondicionPersonaje } = usarAlmacenDM.getState();
      aplicarCondicionPersonaje("test-pj", "CANSADO (Exhausted)");

      let pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.cansancio).toBe(1);
      expect(pj.condicionesActivas).toContain("Cansado (Niv. 1)");

      aplicarCondicionPersonaje("test-pj", "Cansado");
      pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.cansancio).toBe(2);
      expect(pj.condicionesActivas).toContain("Cansado (Niv. 2)");
      expect(pj.condicionesActivas).not.toContain("Cansado (Niv. 1)");
    });

    it("quitar condición Cansado reinicia el cansancio a 0", () => {
      const { aplicarCondicionPersonaje, quitarCondicionPersonaje } = usarAlmacenDM.getState();
      aplicarCondicionPersonaje("test-pj", "Cansado");
      aplicarCondicionPersonaje("test-pj", "Cansado");

      let pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.cansancio).toBe(2);

      quitarCondicionPersonaje("test-pj", "Cansado (Niv. 2)");
      pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.cansancio).toBe(0);
      expect(pj.condicionesActivas.some(c => c.startsWith("Cansado"))).toBe(false);
    });

    it("modificarCansancioPersonaje sincroniza las condiciones activas automáticamente", () => {
      const { modificarCansancioPersonaje } = usarAlmacenDM.getState();
      modificarCansancioPersonaje("test-pj", 3);

      let pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.cansancio).toBe(3);
      expect(pj.condicionesActivas).toContain("Cansado (Niv. 3)");

      modificarCansancioPersonaje("test-pj", -3);
      pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.cansancio).toBe(0);
      expect(pj.condicionesActivas.some(c => c.startsWith("Cansado"))).toBe(false);
    });
  });

  describe("Regla de Sangrado / Desangrándose (<50% HP)", () => {
    it("determina que el personaje está desangrándose cuando la vida es menor al 50%", () => {
      const { modificarHPPersonaje } = usarAlmacenDM.getState();
      // HP Max = 20. Mitad = 10. Si vida cae a 9 -> Desangrándose
      modificarHPPersonaje("test-pj", -11); // HP actual = 9
      const pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.hpActual).toBe(9);
      expect(pj.hpActual > 0 && pj.hpActual < pj.hpMaximo / 2).toBe(true);
    });

    it("se recupera del desangrado automáticamente al recuperar salud por encima o igual a la mitad", () => {
      const { modificarHPPersonaje } = usarAlmacenDM.getState();
      modificarHPPersonaje("test-pj", -12); // HP actual = 8 (< 10)
      let pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.hpActual > 0 && pj.hpActual < pj.hpMaximo / 2).toBe(true);

      modificarHPPersonaje("test-pj", 4); // HP actual = 12 (>= 10)
      pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.hpActual > 0 && pj.hpActual < pj.hpMaximo / 2).toBe(false);
    });
  });

  describe("Sistema de Lanzamiento de Conjuros y Magia", () => {
    it("configura lanzador y recalcula espacios de conjuro automáticamente", () => {
      const { configurarLanzadorConjuros } = usarAlmacenDM.getState();
      configurarLanzadorConjuros("test-pj", {
        esLanzador: true,
        clasesLanzadoras: [
          { clase: "Mago", nivel: 5, tipoLanzador: "completo", habilidadConjuro: "inteligencia", modeloConjuros: "grimorio" }
        ]
      });

      const pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.esLanzador).toBe(true);
      expect(pj.espaciosConjuroMaximos).toEqual({ "1": 4, "2": 3, "3": 2 });
      expect(pj.puntosConjuroMaximos).toBe(27);
    });

    it("permite gastar y recuperar espacios de conjuro por nivel", () => {
      const { configurarLanzadorConjuros, gastarEspacioConjuro, recuperarEspacioConjuro } = usarAlmacenDM.getState();
      configurarLanzadorConjuros("test-pj", {
        esLanzador: true,
        clasesLanzadoras: [
          { clase: "Mago", nivel: 5, tipoLanzador: "completo", habilidadConjuro: "inteligencia", modeloConjuros: "grimorio" }
        ]
      });

      // Gastar 2 espacios de nivel 1
      gastarEspacioConjuro("test-pj", 1);
      gastarEspacioConjuro("test-pj", 1);

      let pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.espaciosConjuroGastados["1"]).toBe(2);

      // Recuperar 1 espacio de nivel 1
      recuperarEspacioConjuro("test-pj", 1);
      pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.espaciosConjuroGastados["1"]).toBe(1);
    });

    it("permite gastar y recuperar puntos de conjuro", () => {
      const { configurarLanzadorConjuros, gastarPuntosConjuro, recuperarPuntosConjuro } = usarAlmacenDM.getState();
      configurarLanzadorConjuros("test-pj", {
        esLanzador: true,
        clasesLanzadoras: [
          { clase: "Hechicero", nivel: 5, tipoLanzador: "completo", habilidadConjuro: "carisma", modeloConjuros: "conocidos" }
        ]
      });

      gastarPuntosConjuro("test-pj", 7); // 7 de 27

      let pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.puntosConjuroGastados).toBe(7);

      recuperarPuntosConjuro("test-pj", 3);
      pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.puntosConjuroGastados).toBe(4);
    });

    it("gestiona la concentración activa sincronizada con la condición", () => {
      const { establecerConcentracion, romperConcentracion } = usarAlmacenDM.getState();
      establecerConcentracion("test-pj", "hechizo-123", "Espíritus Guardianes");

      let pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.concentracionActiva).toEqual({
        hechizoId: "hechizo-123",
        nombreHechizo: "Espíritus Guardianes"
      });
      expect(pj.condicionesActivas).toContain("Concentración");

      romperConcentracion("test-pj");
      pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.concentracionActiva).toBeNull();
      expect(pj.condicionesActivas).not.toContain("Concentración");
    });

    it("gestiona listas de trucos, conocidos y preparados", () => {
      const {
        agregarTrucoConocido,
        quitarTrucoConocido,
        agregarConjuroConocido,
        alternarConjuroPreparado,
        quitarConjuroConocido
      } = usarAlmacenDM.getState();

      agregarTrucoConocido("test-pj", "truco-1");
      let pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.trucosConocidosIds).toContain("truco-1");

      quitarTrucoConocido("test-pj", "truco-1");
      pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.trucosConocidosIds).not.toContain("truco-1");

      agregarConjuroConocido("test-pj", "hechizo-a");
      alternarConjuroPreparado("test-pj", "hechizo-a");
      pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.conjurosConocidosIds).toContain("hechizo-a");
      expect(pj.conjurosPreparadosIds).toContain("hechizo-a");

      // Quitar de conocidos también lo retira de preparados
      quitarConjuroConocido("test-pj", "hechizo-a");
      pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.conjurosConocidosIds).not.toContain("hechizo-a");
      expect(pj.conjurosPreparadosIds).not.toContain("hechizo-a");
    });

    it("un descanso largo restaura todos los recursos mágicos y limpia la concentración", () => {
      const {
        gastarEspacioConjuro,
        gastarPuntosConjuro,
        establecerConcentracion,
        ejecutarDescansoPersonaje
      } = usarAlmacenDM.getState();

      gastarEspacioConjuro("test-pj", 1);
      gastarPuntosConjuro("test-pj", 10);
      establecerConcentracion("test-pj", "hechizo-b", "Escudo de Fe");

      ejecutarDescansoPersonaje("test-pj", "largo");

      const pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.espaciosConjuroGastados).toEqual({});
      expect(pj.puntosConjuroGastados).toBe(0);
      expect(pj.concentracionActiva).toBeNull();
      expect(pj.condicionesActivas).not.toContain("Concentración");
    });

    it("sincroniza automáticamente los conjuros de subclase de Clérigo Dominio de la Vida nivel 7", () => {
      const { actualizarPersonaje } = usarAlmacenDM.getState();

      actualizarPersonaje("test-pj", {
        clase: "Clérigo",
        subclase: "Dominio de la Vida",
        nivel: 7,
        clases: [
          {
            nombre: "Clérigo",
            subclase: "Dominio de la Vida",
            nivel: 7
          }
        ]
      });

      const pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.conjurosSiemprePreparadosIds).toContain("Auxilio");
      expect(pj.conjurosSiemprePreparadosIds).toContain("Bendición");
      expect(pj.conjurosSiemprePreparadosIds).toContain("Curar heridas");
      expect(pj.conjurosSiemprePreparadosIds).toContain("Restablecimiento menor");
      expect(pj.conjurosSiemprePreparadosIds).toContain("Palabra de curación en masa");
      expect(pj.conjurosSiemprePreparadosIds).toContain("Revivir");
      expect(pj.conjurosSiemprePreparadosIds).toContain("Aura de vida");
      expect(pj.conjurosSiemprePreparadosIds).toContain("Guarda contra la muerte");

      // También deben estar presentes en conjurosPreparadosIds
      expect(pj.conjurosPreparadosIds).toContain("Auxilio");
      expect(pj.conjurosPreparadosIds).toContain("Guarda contra la muerte");
    });

    it("al bajar de nivel (7 -> 3), limpia los conjuros de subclase superiores y permite desmarcar/alternar libremente", () => {
      const { actualizarPersonaje, alternarConjuroPreparado } = usarAlmacenDM.getState();

      // 1. Subir a nivel 7
      actualizarPersonaje("test-pj", {
        clase: "Clérigo",
        subclase: "Dominio de la Vida",
        nivel: 7,
        clases: [{ nombre: "Clérigo", subclase: "Dominio de la Vida", nivel: 7 }]
      });

      let pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.conjurosSiemprePreparadosIds).toContain("Guarda contra la muerte");

      // 2. Bajar a nivel 3
      actualizarPersonaje("test-pj", {
        clase: "Clérigo",
        subclase: "Dominio de la Vida",
        nivel: 3,
        clases: [{ nombre: "Clérigo", subclase: "Dominio de la Vida", nivel: 3 }]
      });

      pj = usarAlmacenDM.getState().personajes[0];
      // Conjuros de nivel 3 siguen presentes
      expect(pj.conjurosSiemprePreparadosIds).toContain("Auxilio");
      expect(pj.conjurosSiemprePreparadosIds).toContain("Bendición");
      // Conjuros de niveles 5 y 7 fueron depurados automáticamente
      expect(pj.conjurosSiemprePreparadosIds).not.toContain("Guarda contra la muerte");
      expect(pj.conjurosSiemprePreparadosIds).not.toContain("Aura de vida");
      expect(pj.conjurosSiemprePreparadosIds).not.toContain("Revivir");
      expect(pj.conjurosPreparadosIds).not.toContain("Guarda contra la muerte");

      // 3. Preparar un conjuro libre y luego desmarcarlo
      alternarConjuroPreparado("test-pj", "h_escudo-de-la-fe");
      pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.conjurosPreparadosIds).toContain("h_escudo-de-la-fe");

      // Desmarcarlo
      alternarConjuroPreparado("test-pj", "h_escudo-de-la-fe");
      pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.conjurosPreparadosIds).not.toContain("h_escudo-de-la-fe");
    });

    it("sincroniza los 6 conjuros de subclase de Brujo Patrón del Gran Primigenio a nivel 5", () => {
      const { actualizarPersonaje } = usarAlmacenDM.getState();

      actualizarPersonaje("test-pj", {
        clase: "Brujo",
        subclase: "Patrón del Gran Primigenio",
        nivel: 5,
        clases: [{ nombre: "Brujo", subclase: "Patrón del Gran Primigenio", nivel: 5 }]
      });

      const pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.conjurosSiemprePreparadosIds).toContain("Detectar pensamientos");
      expect(pj.conjurosSiemprePreparadosIds).toContain("Susurros discordantes");
      expect(pj.conjurosSiemprePreparadosIds).toContain("Fuerza fantasmal");
      expect(pj.conjurosSiemprePreparadosIds).toContain("Risa horrible de Tasha");
      expect(pj.conjurosSiemprePreparadosIds).toContain("Clarividencia");
      expect(pj.conjurosSiemprePreparadosIds).toContain("Hambre de Hadar");
    });

    it("fusiona automáticamente objetos duplicados al agregarlos al inventario", () => {
      const { agregarObjetoInventario } = usarAlmacenDM.getState();

      // Agregar primera Daga
      agregarObjetoInventario("test-pj", {
        idInstancia: "daga-1",
        idObjeto: "daga",
        nombre: "Daga",
        cantidad: 1,
        equipado: false,
        sintonizado: false,
        notas: "",
        pesoLb: 1,
        tipoPrincipal: "Arma",
        rareza: "Común",
        esMagico: false,
        equipable: true,
        sintonizacionRequerida: false
      });

      // Agregar segunda Daga con cantidad 2
      agregarObjetoInventario("test-pj", {
        idInstancia: "daga-2",
        idObjeto: "daga",
        nombre: "Daga",
        cantidad: 2,
        equipado: false,
        sintonizado: false,
        notas: "",
        pesoLb: 1,
        tipoPrincipal: "Arma",
        rareza: "Común",
        esMagico: false,
        equipable: true,
        sintonizacionRequerida: false
      });

      const pj = usarAlmacenDM.getState().personajes[0];
      const dagas = pj.inventario.filter((o) => o.idObjeto === "daga" || o.nombre === "Daga");
      // Debe haber solo 1 entrada con cantidad 3
      expect(dagas).toHaveLength(1);
      expect(dagas[0].cantidad).toBe(3);
    });

    it("permite equipar solo 1 armadura a la vez desequipando la anterior", () => {
      const { agregarObjetoInventario, alternarEquipadoObjeto } = usarAlmacenDM.getState();

      // Agregar Armadura de Cuero
      agregarObjetoInventario("test-pj", {
        idInstancia: "cuero-inst",
        idObjeto: "armadura-cuero",
        nombre: "Armadura de Cuero",
        cantidad: 1,
        equipado: false,
        sintonizado: false,
        notas: "",
        pesoLb: 10,
        tipoPrincipal: "Armadura",
        rareza: "Común",
        esMagico: false,
        equipable: true,
        sintonizacionRequerida: false
      });

      // Agregar Cota de Malla
      agregarObjetoInventario("test-pj", {
        idInstancia: "malla-inst",
        idObjeto: "cota-malla",
        nombre: "Cota de Malla",
        cantidad: 1,
        equipado: false,
        sintonizado: false,
        notas: "",
        pesoLb: 55,
        tipoPrincipal: "Armadura",
        rareza: "Común",
        esMagico: false,
        equipable: true,
        sintonizacionRequerida: false
      });

      // Equipar Cuero
      alternarEquipadoObjeto("test-pj", "cuero-inst");
      let pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.inventario.find((o) => o.idInstancia === "cuero-inst")?.equipado).toBe(true);

      // Equipar Malla -> Debe desequipar Cuero
      alternarEquipadoObjeto("test-pj", "malla-inst");
      pj = usarAlmacenDM.getState().personajes[0];
      expect(pj.inventario.find((o) => o.idInstancia === "malla-inst")?.equipado).toBe(true);
      expect(pj.inventario.find((o) => o.idInstancia === "cuero-inst")?.equipado).toBe(false);
    });

    it("al equipar un objeto con cantidad múltiple, separa 1 unidad equipada y mantiene el resto en la mochila", () => {
      const { agregarObjetoInventario, alternarEquipadoObjeto } = usarAlmacenDM.getState();

      // Agregar 3 Pociones o 3 Hoz
      agregarObjetoInventario("test-pj", {
        idInstancia: "hoz-inst",
        idObjeto: "hoz",
        nombre: "Hoz",
        cantidad: 3,
        equipado: false,
        sintonizado: false,
        notas: "",
        pesoLb: 2,
        tipoPrincipal: "Arma",
        rareza: "Común",
        esMagico: false,
        equipable: true,
        sintonizacionRequerida: false
      });

      // Equipar
      alternarEquipadoObjeto("test-pj", "hoz-inst");

      let pj = usarAlmacenDM.getState().personajes[0];
      const hozEquipada = pj.inventario.find((o) => o.idInstancia === "hoz-inst");
      const hozMochila = pj.inventario.find((o) => o.idInstancia !== "hoz-inst" && o.idObjeto === "hoz");

      expect(hozEquipada?.equipado).toBe(true);
      expect(hozEquipada?.cantidad).toBe(1);
      expect(hozMochila?.equipado).toBe(false);
      expect(hozMochila?.cantidad).toBe(2);

      // Desequipar -> Debe re-fusionarse
      alternarEquipadoObjeto("test-pj", "hoz-inst");
      pj = usarAlmacenDM.getState().personajes[0];
      const hozTotal = pj.inventario.filter((o) => o.idObjeto === "hoz");
      expect(hozTotal).toHaveLength(1);
      expect(hozTotal[0].equipado).toBe(false);
      expect(hozTotal[0].cantidad).toBe(3);
    });

    it("actualiza y muta propiedades de un objeto de inventario (ej. mutar Bolsita a Estuche de Agujas)", () => {
      const { agregarObjetoInventario, actualizarObjetoInventario } = usarAlmacenDM.getState();

      agregarObjetoInventario("test-pj", {
        idInstancia: "bolsita-inst",
        idObjeto: "pouch",
        nombre: "Bolsita",
        cantidad: 1,
        equipado: false,
        sintonizado: false,
        notas: "",
        pesoLb: 1,
        tipoPrincipal: "Equipo de Aventuras",
        rareza: "Común",
        esMagico: false,
        equipable: false,
        sintonizacionRequerida: false
      });

      actualizarObjetoInventario("test-pj", "bolsita-inst", {
        idObjeto: "needle-case",
        nombre: "Estuche de Agujas"
      });

      const pj = usarAlmacenDM.getState().personajes[0];
      const objMutado = pj.inventario.find((o) => o.idInstancia === "bolsita-inst");
      expect(objMutado?.idObjeto).toBe("needle-case");
      expect(objMutado?.nombre).toBe("Estuche de Agujas");
    });

    it("reordena la lista de inventario libremente con reordenarInventario", () => {
      const { agregarObjetoInventario, reordenarInventario } = usarAlmacenDM.getState();

      agregarObjetoInventario("test-pj", {
        idInstancia: "item-a",
        idObjeto: "obj-a",
        nombre: "Objeto A",
        cantidad: 1,
        equipado: false,
        sintonizado: false,
        notas: "",
        pesoLb: 1,
        tipoPrincipal: "Equipo de Aventuras",
        rareza: "Común",
        esMagico: false,
        equipable: false,
        sintonizacionRequerida: false
      });

      agregarObjetoInventario("test-pj", {
        idInstancia: "item-b",
        idObjeto: "obj-b",
        nombre: "Objeto B",
        cantidad: 1,
        equipado: false,
        sintonizado: false,
        notas: "",
        pesoLb: 1,
        tipoPrincipal: "Equipo de Aventuras",
        rareza: "Común",
        esMagico: false,
        equipable: false,
        sintonizacionRequerida: false
      });

      agregarObjetoInventario("test-pj", {
        idInstancia: "item-c",
        idObjeto: "obj-c",
        nombre: "Objeto C",
        cantidad: 1,
        equipado: false,
        sintonizado: false,
        notas: "",
        pesoLb: 1,
        tipoPrincipal: "Equipo de Aventuras",
        rareza: "Común",
        esMagico: false,
        equipable: false,
        sintonizacionRequerida: false
      });

      // Mover Item C a la primera posición (donde está Item A)
      reordenarInventario("test-pj", "item-c", "item-a");

      const pj = usarAlmacenDM.getState().personajes[0];
      const ids = pj.inventario.map((o) => o.idInstancia);
      const posC = ids.indexOf("item-c");
      const posA = ids.indexOf("item-a");
      const posB = ids.indexOf("item-b");

      expect(posC).toBeLessThan(posA);
      expect(posA).toBeLessThan(posB);
    });

    it("no fusiona stacks si los objetos pertenecen a contenedores distintos", () => {
      const { agregarObjetoInventario } = usarAlmacenDM.getState();

      agregarObjetoInventario("test-pj", {
        idInstancia: "antorcha-mochila",
        idObjeto: "torch",
        nombre: "Antorcha",
        cantidad: 2,
        contenedor: "mochila",
        equipado: false,
        sintonizado: false,
        notas: "",
        pesoLb: 1,
        tipoPrincipal: "Equipo de Aventuras",
        rareza: "Común",
        esMagico: false,
        equipable: false,
        sintonizacionRequerida: false
      });

      agregarObjetoInventario("test-pj", {
        idInstancia: "antorcha-almacen",
        idObjeto: "torch",
        nombre: "Antorcha",
        cantidad: 5,
        contenedor: "almacen",
        equipado: false,
        sintonizado: false,
        notas: "",
        pesoLb: 1,
        tipoPrincipal: "Equipo de Aventuras",
        rareza: "Común",
        esMagico: false,
        equipable: false,
        sintonizacionRequerida: false
      });

      const pj = usarAlmacenDM.getState().personajes[0];
      const antorchas = pj.inventario.filter((o) => o.idObjeto === "torch");

      // Deben existir 2 instancias separadas por pertenecer a contenedores diferentes
      expect(antorchas).toHaveLength(2);
      expect(antorchas.find((o) => o.contenedor === "mochila")?.cantidad).toBe(2);
      expect(antorchas.find((o) => o.contenedor === "almacen")?.cantidad).toBe(5);
    });
  });

  describe("Sincronización de Rasgos y Condiciones (Furia Persistente, Furia de los Dioses)", () => {
    it("al activar Furia Persistente debe recargar los usos de Furia base a su máximo", () => {
      usarAlmacenDM.setState({
        personajes: [
          {
            ...PERSONAJE_POR_DEFECTO,
            id: "pj-barbaro",
            nombre: "Bárbaro Nv 15",
            clase: "Bárbaro",
            nivel: 15,
            rasgos: [
              {
                id: "rasgo_cls_barbaro_furia",
                nombre: "Furia",
                descripcion: "Furia",
                origen: "clase",
                fuente: "Bárbaro",
                tipoAccion: "accion_adicional",
                tieneUsosLimitados: true,
                usosMaximos: 5,
                usosRestantes: 0, // Gastada por completo
                recuperacion: "descanso_largo",
                personalizado: false,
                activo: false,
                notas: "",
                esActivable: true,
                efectos: [],
                selectores: []
              },
              {
                id: "rasgo_cls_barbaro_furia_persistente",
                nombre: "Furia persistente",
                descripcion: "Furia persistente",
                origen: "clase",
                fuente: "Bárbaro",
                tipoAccion: "pasivo",
                tieneUsosLimitados: true,
                usosMaximos: 1,
                usosRestantes: 1,
                recuperacion: "descanso_largo",
                personalizado: false,
                activo: false,
                notas: "",
                esActivable: true,
                efectos: [],
                selectores: []
              }
            ],
            condicionesActivas: []
          }
        ]
      });

      const { alternarActivoRasgo } = usarAlmacenDM.getState();
      alternarActivoRasgo("pj-barbaro", "rasgo_cls_barbaro_furia_persistente");

      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj-barbaro");
      const furiaBase = pj?.rasgos.find((r) => r.id === "rasgo_cls_barbaro_furia");
      const furiaPersistente = pj?.rasgos.find((r) => r.id === "rasgo_cls_barbaro_furia_persistente");

      // Furia persistente se auto-desactiva inmediatamente tras su activación (activo: false)
      expect(furiaPersistente?.activo).toBe(false);
      expect(furiaPersistente?.usosRestantes).toBe(0);
      expect(furiaBase?.usosRestantes).toBe(5); // Rellenado a su máximo
    });

    it("al activar y desactivar Furia de los Dioses debe sincronizar su condición independiente", () => {
      usarAlmacenDM.setState({
        personajes: [
          {
            ...PERSONAJE_POR_DEFECTO,
            id: "pj-fanatico",
            nombre: "Fanático Nv 14",
            clase: "Bárbaro",
            nivel: 14,
            rasgos: [
              {
                id: "rasgo_cls_barbaro_furia",
                nombre: "Furia",
                descripcion: "Furia bárbara base",
                origen: "clase",
                fuente: "Bárbaro",
                tipoAccion: "accion_adicional",
                tieneUsosLimitados: true,
                usosMaximos: 4,
                usosRestantes: 4,
                recuperacion: "descanso_largo",
                personalizado: false,
                activo: true,
                notas: "",
                esActivable: true,
                efectos: [],
                selectores: []
              },
              {
                id: "rasgo_cls_barbaro_furia_de_los_dioses",
                nombre: "Furia de los dioses",
                descripcion: "Forma divina",
                origen: "subclase",
                fuente: "Senda del Fanático",
                tipoAccion: "especial",
                tieneUsosLimitados: true,
                usosMaximos: 1,
                usosRestantes: 1,
                recuperacion: "descanso_largo",
                personalizado: false,
                activo: false,
                notas: "",
                esActivable: true,
                efectos: [],
                selectores: []
              }
            ],
            condicionesActivas: ["Furia (Rage)"]
          }
        ]
      });

      const { alternarActivoRasgo, quitarCondicionPersonaje } = usarAlmacenDM.getState();
      alternarActivoRasgo("pj-fanatico", "rasgo_cls_barbaro_furia_de_los_dioses");

      let pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj-fanatico");
      expect(pj?.condicionesActivas.some((c) => c.includes("Furia de los Dioses"))).toBe(true);

      quitarCondicionPersonaje("pj-fanatico", "Furia de los Dioses (Rage of the Gods)");
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj-fanatico");
      expect(pj?.rasgos.find((r) => r.id === "rasgo_cls_barbaro_furia_de_los_dioses")?.activo).toBe(false);
    });

    it("al subir de nivel o cambiar de clase/subclase debe auto-sincronizar los rasgos automáticamente", () => {
      usarAlmacenDM.setState({
        personajes: [
          {
            ...PERSONAJE_POR_DEFECTO,
            id: "pj-auto-sync",
            nombre: "Bárbaro Nivel 9",
            clase: "Bárbaro",
            nivel: 9,
            clases: [{ nombre: "Bárbaro", subclase: "", nivel: 9 }],
            rasgos: [
              {
                id: "rasgo_cls_barbaro_furia",
                nombre: "Furia",
                descripcion: "Furia bárbara",
                origen: "clase",
                fuente: "Bárbaro",
                tipoAccion: "accion_adicional",
                tieneUsosLimitados: true,
                usosMaximos: 4,
                usosRestantes: 4,
                recuperacion: "descanso_largo",
                personalizado: false,
                activo: false,
                notas: "",
                esActivable: true,
                efectos: [],
                selectores: []
              }
            ]
          }
        ]
      });

      const { actualizarPersonaje } = usarAlmacenDM.getState();

      // Simulamos que el formulario envía el pj completo con su array viejo de rasgos pero con nivel 14 y subclase
      const pjViejo = usarAlmacenDM.getState().personajes[0];
      actualizarPersonaje("pj-auto-sync", {
        ...pjViejo,
        nivel: 14,
        subclase: "Senda del Fanático",
        clases: [{ nombre: "Bárbaro", subclase: "Senda del Fanático", nivel: 14 }]
      });

      const pjActualizado = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj-auto-sync");
      // Debe haber sincronizado automáticamente los rasgos de nivel 14 y de la subclase
      expect(pjActualizado?.rasgos.some((r) => r.nombre.toLowerCase().includes("furia divina"))).toBe(true);
      expect(pjActualizado?.rasgos.some((r) => r.nombre.toLowerCase().includes("furia de los dioses"))).toBe(true);
      expect(pjActualizado?.rasgos.some((r) => r.nombre.toLowerCase().includes("golpe brutal"))).toBe(true);
    });

    it("aisla completamente Furia de los Dioses de la condición y rasgo de Furia base", () => {
      const { alternarActivoRasgo, aplicarCondicionPersonaje, quitarCondicionPersonaje } = usarAlmacenDM.getState();
      usarAlmacenDM.setState({
        personajes: [
          {
            ...PERSONAJE_POR_DEFECTO,
            id: "pj-fanatico-14",
            nombre: "Bárbaro Fanático Nv 14",
            clase: "Bárbaro",
            subclase: "Senda del Fanático",
            nivel: 14,
            condicionesActivas: [],
            rasgos: [
              {
                id: "rasgo_cls_barbaro_furia",
                nombre: "Furia",
                descripcion: "Furia bárbara base",
                activo: false,
                esActivable: true,
                tieneUsosLimitados: true,
                usosMaximos: 5,
                usosRestantes: 5
              } as RasgoPersonaje,
              {
                id: "rasgo_sub_senda_del_fanatico_furia_de_los_dioses",
                nombre: "Furia de los dioses",
                descripcion: "Forma de guerrero divino",
                activo: false,
                esActivable: true,
                tieneUsosLimitados: true,
                usosMaximos: 1,
                usosRestantes: 1
              } as RasgoPersonaje
            ]
          }
        ]
      });

      // 0. Sin Furia activa, intentar activar Furia de los dioses no debe surtir efecto
      alternarActivoRasgo("pj-fanatico-14", "rasgo_sub_senda_del_fanatico_furia_de_los_dioses");
      let pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj-fanatico-14");
      expect(pj?.rasgos.find((r) => r.id === "rasgo_sub_senda_del_fanatico_furia_de_los_dioses")?.activo).toBe(false);

      // 1. Activar Furia base primero
      alternarActivoRasgo("pj-fanatico-14", "rasgo_cls_barbaro_furia");

      // 2. Con Furia activa, activar rasgo "Furia de los dioses"
      alternarActivoRasgo("pj-fanatico-14", "rasgo_sub_senda_del_fanatico_furia_de_los_dioses");

      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj-fanatico-14");
      const rasgoDioses = pj?.rasgos.find((r) => r.id === "rasgo_sub_senda_del_fanatico_furia_de_los_dioses");
      const rasgoFuria = pj?.rasgos.find((r) => r.id === "rasgo_cls_barbaro_furia");

      expect(rasgoDioses?.activo).toBe(true);
      expect(rasgoDioses?.usosRestantes).toBe(0);
      expect(rasgoFuria?.activo).toBe(true);
      expect(pj?.condicionesActivas).toContain("Furia de los Dioses");
      expect(pj?.condicionesActivas).toContain("Furia");

      // 3. Desactivar rasgo "Furia de los dioses"
      alternarActivoRasgo("pj-fanatico-14", "rasgo_sub_senda_del_fanatico_furia_de_los_dioses");
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj-fanatico-14");
      expect(pj?.condicionesActivas).not.toContain("Furia de los Dioses");

      // Desactivamos también Furia base para verificar el paso siguiente
      alternarActivoRasgo("pj-fanatico-14", "rasgo_cls_barbaro_furia");
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj-fanatico-14");
      expect(pj?.rasgos.find((r) => r.id === "rasgo_cls_barbaro_furia")?.activo).toBe(false);

      // 4. Aplicar condición desde la barra táctica / iniciativa
      aplicarCondicionPersonaje("pj-fanatico-14", "Furia de los Dioses");
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj-fanatico-14");
      const rasgoDioses2 = pj?.rasgos.find((r) => r.id === "rasgo_sub_senda_del_fanatico_furia_de_los_dioses");
      const rasgoFuria2 = pj?.rasgos.find((r) => r.id === "rasgo_cls_barbaro_furia");
      expect(rasgoDioses2?.activo).toBe(true);
      expect(rasgoFuria2?.activo).toBe(false); // NO debe activarse Furia base

      // 4. Quitar la condición desactiva el rasgo
      quitarCondicionPersonaje("pj-fanatico-14", "Furia de los Dioses");
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj-fanatico-14");
      const rasgoDioses3 = pj?.rasgos.find((r) => r.id === "rasgo_sub_senda_del_fanatico_furia_de_los_dioses");
      expect(rasgoDioses3?.activo).toBe(false);
    });

    it("Furia Divina solo se puede activar si Furia está activa y se desactiva al terminar Furia", () => {
      const { alternarActivoRasgo, quitarCondicionPersonaje } = usarAlmacenDM.getState();

      usarAlmacenDM.setState({
        personajes: [
          {
            id: "pj-barbaro-fanatico",
            nombre: "Kragthor",
            clase: "Bárbaro",
            nivel: 9,
            condicionesActivas: [],
            inventario: [],
            rasgos: [
              {
                id: "rasgo_cls_barbaro_furia",
                nombre: "Furia",
                descripcion: "Entras en furia...",
                tipoAccion: "accion_adicional",
                origen: "clase",
                activo: false,
                esActivable: true,
                tieneUsosLimitados: true,
                usosMaximos: 4,
                usosRestantes: 4
              },
              {
                id: "rasgo_sub_senda_del_fanatico_furia_divina",
                nombre: "Furia Divina",
                descripcion: "Inflige daño radiante o necrótico adicional...",
                tipoAccion: "especial",
                origen: "subclase",
                activo: false,
                esActivable: true
              } as RasgoPersonaje
            ]
          } as unknown as PersonajeJugador
        ]
      });

      // 1. Intentar activar Furia Divina SIN que Furia esté activa -> DEBE BLOQUEARSE
      alternarActivoRasgo("pj-barbaro-fanatico", "rasgo_sub_senda_del_fanatico_furia_divina");

      let pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj-barbaro-fanatico");
      let rasgoFD = pj?.rasgos.find((r) => r.id === "rasgo_sub_senda_del_fanatico_furia_divina");
      expect(rasgoFD?.activo).toBe(false);

      // 2. Activar Furia base -> Ahora SÍ se debe poder activar Furia Divina
      alternarActivoRasgo("pj-barbaro-fanatico", "rasgo_cls_barbaro_furia");
      alternarActivoRasgo("pj-barbaro-fanatico", "rasgo_sub_senda_del_fanatico_furia_divina");

      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj-barbaro-fanatico");
      const rasgoFuria = pj?.rasgos.find((r) => r.id === "rasgo_cls_barbaro_furia");
      rasgoFD = pj?.rasgos.find((r) => r.id === "rasgo_sub_senda_del_fanatico_furia_divina");

      expect(rasgoFuria?.activo).toBe(true);
      expect(rasgoFD?.activo).toBe(true);

      // 3. Desactivar Furia base -> Furia Divina debe desactivarse automáticamente
      alternarActivoRasgo("pj-barbaro-fanatico", "rasgo_cls_barbaro_furia");

      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj-barbaro-fanatico");
      rasgoFD = pj?.rasgos.find((r) => r.id === "rasgo_sub_senda_del_fanatico_furia_divina");

      expect(rasgoFD?.activo).toBe(false);

      // 4. Con condición Furia aplicada, se activa y al quitar condición se desactiva
      const { aplicarCondicionPersonaje } = usarAlmacenDM.getState();
      aplicarCondicionPersonaje("pj-barbaro-fanatico", "Furia");
      alternarActivoRasgo("pj-barbaro-fanatico", "rasgo_sub_senda_del_fanatico_furia_divina");

      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj-barbaro-fanatico");
      expect(pj?.rasgos.find((r) => r.id === "rasgo_sub_senda_del_fanatico_furia_divina")?.activo).toBe(true);

      quitarCondicionPersonaje("pj-barbaro-fanatico", "Furia");
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj-barbaro-fanatico");
      expect(pj?.rasgos.find((r) => r.id === "rasgo_sub_senda_del_fanatico_furia_divina")?.activo).toBe(false);
    });
  });

  describe("Ataque Temerario en Español y Efectos Temporales", () => {
    const barbaroTemerarioId = "pj-barbaro-temerario";

    beforeEach(() => {
      const rasgoAtaqueTemerario = {
        id: "rasgo_cls_barbaro_ataque_temerario",
        nombre: "Ataque Temerario",
        descripcion: "Ventaja en tiradas de ataque con Fuerza durante tu turno.",
        tipoAccion: "pasivo",
        esActivable: true,
        condicionAlActivar: "Ataque Temerario",
        categoriaMecanica: "activable",
        activo: false,
        efectos: [
          {
            tipo: "ventaja",
            objetivo: "ataque_fuerza",
            valor: "ventaja",
            condicion: "ataque_temerario_activo",
            descripcion: "Ataque Temerario (Ventaja en tiradas de ataque con Fuerza)"
          }
        ]
      } as RasgoPersonaje;

      const barbaro: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: barbaroTemerarioId,
        nombre: "Conan",
        clase: "Bárbaro",
        nivel: 3,
        rasgos: [rasgoAtaqueTemerario],
        condicionesActivas: [],
        efectosActivos: []
      };

      usarAlmacenDM.setState({
        personajes: [barbaro],
        idPersonajeActivo: barbaroTemerarioId,
        rondaActual: 1
      });
    });

    it("al activar el rasgo Ataque Temerario, se sincroniza la condición y efecto de 1 ronda, y se detecta activo", () => {
      const { alternarActivoRasgo } = usarAlmacenDM.getState();
      alternarActivoRasgo(barbaroTemerarioId, "rasgo_cls_barbaro_ataque_temerario");

      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === barbaroTemerarioId);
      expect(pj?.rasgos.find((r) => r.id === "rasgo_cls_barbaro_ataque_temerario")?.activo).toBe(true);
      expect(pj?.condicionesActivas).toContain("Ataque Temerario");
      expect(pj?.efectosActivos?.some((e) => e.nombre === "Ataque Temerario")).toBe(true);

      // Verificación de que el evaluador reconoce que Ataque Temerario está activo
      expect(estaAtaqueTemerarioActivo(pj!)).toBe(true);

      // Verificación de que evaluarEfectosCondicionesEnTirada otorga ventaja en tirada de ataque con Fuerza
      const evaluacion = evaluarEfectosCondicionesEnTirada({
        tipo: "ataque",
        caracteristica: "fuerza",
        condicionesActivas: pj?.condicionesActivas,
        personaje: pj
      });
      expect(evaluacion.tieneVentaja).toBe(true);
      expect(evaluacion.motivosVentaja.some((m) => m.includes("Ataque Temerario"))).toBe(true);
    });

    it("si Ataque Temerario está únicamente en efectosActivos (desduplicado de condiciones en combate), sigue otorgando ventaja", () => {
      // Simular que por sincronización con Combat Tracker se desduplicó de condicionesActivas y quedó en efectosActivos
      usarAlmacenDM.setState((st) => ({
        personajes: st.personajes.map((p) =>
          p.id === barbaroTemerarioId
            ? {
                ...p,
                condicionesActivas: [],
                efectosActivos: [{ id: "ef_temerario", nombre: "Ataque Temerario", expiraRonda: 2 }]
              }
            : p
        )
      }));

      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === barbaroTemerarioId);
      expect(estaAtaqueTemerarioActivo(pj!)).toBe(true);

      const evaluacion = evaluarEfectosCondicionesEnTirada({
        tipo: "ataque",
        caracteristica: "fuerza",
        condicionesActivas: pj?.condicionesActivas,
        personaje: pj
      });
      expect(evaluacion.tieneVentaja).toBe(true);
      expect(evaluacion.motivosVentaja.some((m) => m.includes("Ataque Temerario"))).toBe(true);
    });

    it("al desactivar el rasgo Ataque Temerario, se retira la condición, el efecto y cesa la ventaja", () => {
      const { alternarActivoRasgo } = usarAlmacenDM.getState();
      // Activar
      alternarActivoRasgo(barbaroTemerarioId, "rasgo_cls_barbaro_ataque_temerario");
      // Desactivar
      alternarActivoRasgo(barbaroTemerarioId, "rasgo_cls_barbaro_ataque_temerario");

      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === barbaroTemerarioId);
      expect(pj?.rasgos.find((r) => r.id === "rasgo_cls_barbaro_ataque_temerario")?.activo).toBe(false);
      expect(pj?.condicionesActivas).not.toContain("Ataque Temerario");
      expect(pj?.efectosActivos?.some((e) => e.nombre === "Ataque Temerario")).toBe(false);

      expect(estaAtaqueTemerarioActivo(pj!)).toBe(false);

      const evaluacion = evaluarEfectosCondicionesEnTirada({
        tipo: "ataque",
        caracteristica: "fuerza",
        condicionesActivas: pj?.condicionesActivas,
        personaje: pj
      });
      expect(evaluacion.tieneVentaja).toBe(false);
    });

    it("Golpe Brutal involucra a Ataque Temerario (no a Furia): requiere Ataque Temerario activo y se desactiva al terminar este", () => {
      const { alternarActivoRasgo, aplicarCondicionPersonaje, quitarCondicionPersonaje } = usarAlmacenDM.getState();

      const rasgoGolpeBrutal: RasgoPersonaje = {
        id: "rasgo_cls_barbaro_golpe_brutal",
        nombre: "Golpe Brutal",
        descripcion: "Si usas Ataque temerario, puedes renunciar a cualquier ventaja...",
        tipoAccion: "especial",
        origen: "clase",
        fuente: "Bárbaro (Nivel 9)",
        tieneUsosLimitados: false,
        recuperacion: "ninguno",
        personalizado: false,
        notas: "",
        activo: false,
        esActivable: true,
        ligadoA: "rasgo_cls_barbaro_ataque_temerario"
      };

      const rasgoFuria: RasgoPersonaje = {
        id: "rasgo_cls_barbaro_furia",
        nombre: "Furia",
        descripcion: "Entras en furia...",
        tipoAccion: "accion_adicional",
        origen: "clase",
        fuente: "Bárbaro (Nivel 1)",
        tieneUsosLimitados: true,
        recuperacion: "descanso_largo",
        personalizado: false,
        notas: "",
        activo: false,
        esActivable: true,
        usosMaximos: 4,
        usosRestantes: 4
      };

      usarAlmacenDM.setState((st) => ({
        personajes: st.personajes.map((p) =>
          p.id === barbaroTemerarioId
            ? {
                ...p,
                rasgos: [...p.rasgos, rasgoGolpeBrutal, rasgoFuria]
              }
            : p
        )
      }));

      // 1. Intentar activar Golpe Brutal sin Ataque Temerario activo -> DEBE BLOQUEARSE
      alternarActivoRasgo(barbaroTemerarioId, "rasgo_cls_barbaro_golpe_brutal");
      let pj = usarAlmacenDM.getState().personajes.find((p) => p.id === barbaroTemerarioId);
      let rasgoGB = pj?.rasgos.find((r) => r.id === "rasgo_cls_barbaro_golpe_brutal");
      expect(rasgoGB?.activo).toBe(false);

      // 2. Activar Furia no debe permitir activar Golpe Brutal si Ataque Temerario no está activo
      alternarActivoRasgo(barbaroTemerarioId, "rasgo_cls_barbaro_furia");
      alternarActivoRasgo(barbaroTemerarioId, "rasgo_cls_barbaro_golpe_brutal");
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === barbaroTemerarioId);
      rasgoGB = pj?.rasgos.find((r) => r.id === "rasgo_cls_barbaro_golpe_brutal");
      expect(rasgoGB?.activo).toBe(false);

      // 3. Activar Ataque Temerario -> Ahora SÍ se puede activar Golpe Brutal
      alternarActivoRasgo(barbaroTemerarioId, "rasgo_cls_barbaro_ataque_temerario");
      alternarActivoRasgo(barbaroTemerarioId, "rasgo_cls_barbaro_golpe_brutal");
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === barbaroTemerarioId);
      rasgoGB = pj?.rasgos.find((r) => r.id === "rasgo_cls_barbaro_golpe_brutal");
      expect(rasgoGB?.activo).toBe(true);

      // 4. Desactivar Furia NO desactiva Golpe Brutal (no involucra a Furia)
      alternarActivoRasgo(barbaroTemerarioId, "rasgo_cls_barbaro_furia");
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === barbaroTemerarioId);
      rasgoGB = pj?.rasgos.find((r) => r.id === "rasgo_cls_barbaro_golpe_brutal");
      expect(rasgoGB?.activo).toBe(true);

      // 5. Desactivar Ataque Temerario -> Golpe Brutal se desactiva en cascada
      alternarActivoRasgo(barbaroTemerarioId, "rasgo_cls_barbaro_ataque_temerario");
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === barbaroTemerarioId);
      rasgoGB = pj?.rasgos.find((r) => r.id === "rasgo_cls_barbaro_golpe_brutal");
      expect(rasgoGB?.activo).toBe(false);

      // 6. Con condición Ataque Temerario activa, Golpe Brutal se activa y al remover condición se desactiva
      aplicarCondicionPersonaje(barbaroTemerarioId, "Ataque Temerario");
      alternarActivoRasgo(barbaroTemerarioId, "rasgo_cls_barbaro_golpe_brutal");
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === barbaroTemerarioId);
      expect(pj?.rasgos.find((r) => r.id === "rasgo_cls_barbaro_golpe_brutal")?.activo).toBe(true);

      quitarCondicionPersonaje(barbaroTemerarioId, "Ataque Temerario");
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === barbaroTemerarioId);
      expect(pj?.rasgos.find((r) => r.id === "rasgo_cls_barbaro_golpe_brutal")?.activo).toBe(false);
    });
  });
});
