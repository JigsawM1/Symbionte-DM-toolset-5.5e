import { describe, it, expect, beforeEach, vi } from "vitest";
import { usarAlmacenDM, type CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import { lanzarDadosTaleSpire } from "@/utiles/lanzadorDados";
import { coincideBusquedaTolerante } from "@/utiles/busquedaTolerante";
import {
  esObjetoEquipable,
  esObjetoEscudo,
  esObjetoArmaduraCorporal,
  procesarAlternarEquipado
} from "@/servicios/procesadorEquipamiento";
import type { PersonajeJugador, ObjetoInventario } from "@/tipos";

describe("Correcciones de Bugs en Hoja de Personaje e Iniciativa", () => {
  const personajeId = "pj-bugs-test";

  beforeEach(() => {
    vi.clearAllMocks();
    const pjInicial: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      id: personajeId,
      nombre: "Valeros Bardo",
      clase: "Bardo",
      nivel: 5,
      hpMaximo: 40,
      hpActual: 20,
      dadosGolpeTotal: 5,
      dadosGolpeRestantes: 5,
      tipoDadoGolpe: "d8",
      gradosHabilidades: { ...PERSONAJE_POR_DEFECTO.gradosHabilidades },
      condicionesActivas: [],
      rasgos: [
        {
          id: "bardo-aprendiz-de-mucho",
          nombre: "Aprendiz de mucho",
          descripcion: "Añade la mitad de tu bonificador de competencia a cualquier prueba de característica que no incluya ya tu bonificador.",
          origen: "clase",
          tipoAccion: "pasivo",
          activo: true,
          tieneUsosLimitados: false,
          recuperacion: "ninguno",
          personalizado: false,
          fuente: "Bardo",
          notas: ""
        }
      ]
    };

    usarAlmacenDM.setState({
      personajes: [pjInicial],
      idPersonajeActivo: personajeId,
      colaIniciativa: [],
      notificaciones: []
    });
  });

  describe("1. Tirada y Gasto de Dados de Golpe (Sin Curar HP)", () => {
    it("gastarDadoGolpePersonaje descuenta 1 dado y NO altera los puntos de golpe actuales", () => {
      const state = usarAlmacenDM.getState();
      const hpAntes = state.personajes[0].hpActual;
      expect(state.personajes[0].dadosGolpeRestantes).toBe(5);

      state.gastarDadoGolpePersonaje(personajeId);

      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeId);
      expect(pj?.dadosGolpeRestantes).toBe(4);
      expect(pj?.hpActual).toBe(hpAntes); // Clarificación explícita: no curar automáticamente
    });

    it("lanzarDadosTaleSpire descuenta el dado en fallback local y genera notificación informativa", async () => {
      const state = usarAlmacenDM.getState();
      const dadosAntes = state.personajes[0].dadosGolpeRestantes;

      await lanzarDadosTaleSpire(
        "!Dado de Golpe:1d8",
        "Valeros - Dado de Golpe (d8)",
        undefined,
        undefined,
        undefined,
        undefined,
        {
          tipo: "dadoGolpe",
          personajeId,
          nombrePersonaje: "Valeros Bardo",
          tipoDado: "d8"
        }
      );

      const estadoActual = usarAlmacenDM.getState();
      const pj = estadoActual.personajes.find((p) => p.id === personajeId);
      expect(pj?.dadosGolpeRestantes).toBe(dadosAntes - 1);
      expect(pj?.hpActual).toBe(20); // HP inalterado

      const ultimaNotif = estadoActual.notificaciones[estadoActual.notificaciones.length - 1];
      expect(ultimaNotif.mensaje).toContain("¡Dado de Golpe gastado!");
      expect(ultimaNotif.tipo).toBe("info");
    });
  });

  describe("2. Competencias de Bardo (Aprendiz de Mucho)", () => {
    it("con 'Aprendiz de mucho', el primer clic avanza directamente a 'competente' en 1 solo clic", () => {
      const state = usarAlmacenDM.getState();
      // Inicialmente tiene grado "ninguna", pero con Aprendiz de mucho se calcula medio bono
      expect(state.personajes[0].gradosHabilidades["acrobacias"]).toBe("ninguna");

      // Primer clic: debe pasar directamente a "competente" (en lugar de requerir doble clic)
      state.ciclarGradoHabilidadPersonaje(personajeId, "acrobacias");
      let pj = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeId);
      expect(pj?.gradosHabilidades["acrobacias"]).toBe("competente");

      // Segundo clic: debe pasar a "pericia"
      state.ciclarGradoHabilidadPersonaje(personajeId, "acrobacias");
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeId);
      expect(pj?.gradosHabilidades["acrobacias"]).toBe("pericia");

      // Tercer clic: cicla de vuelta a la base del bardo ("medio")
      state.ciclarGradoHabilidadPersonaje(personajeId, "acrobacias");
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeId);
      expect(pj?.gradosHabilidades["acrobacias"]).toBe("medio");
    });
  });

  describe("3. Sincronización Bidireccional de Condiciones (Ficha <-> Iniciativa)", () => {
    const criaturaId = "criatura-pj-valeros";

    beforeEach(() => {
      const criaturaJugador: CriaturaIniciativa = {
        id: criaturaId,
        nombre: "Valeros Bardo",
        iniciativa: 15,
        vidaActual: 20,
        vidaMaxima: 40,
        ca: 16,
        condiciones: [],
        bonificadorIniciativa: 2,
        esMonstruo: false,
        velocidad: "30 pies"
      };

      usarAlmacenDM.setState({
        colaIniciativa: [criaturaJugador]
      });
    });

    it("al aplicar condición en la Hoja de Personaje, se sincroniza en la cola de iniciativa", () => {
      const state = usarAlmacenDM.getState();
      state.aplicarCondicionPersonaje(personajeId, "Cegado");

      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeId);
      expect(pj?.condicionesActivas).toContain("Cegado");

      const criatura = usarAlmacenDM.getState().colaIniciativa.find((c) => c.id === criaturaId);
      expect(criatura?.condiciones).toContain("Cegado");
    });

    it("al añadir condición a la criatura en Iniciativa, se sincroniza en la Hoja de Personaje", () => {
      const state = usarAlmacenDM.getState();
      state.agregarCondicionACriatura(criaturaId, "Envenenado");

      const criatura = usarAlmacenDM.getState().colaIniciativa.find((c) => c.id === criaturaId);
      expect(criatura?.condiciones).toContain("Envenenado");

      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeId);
      expect(pj?.condicionesActivas).toContain("Envenenado");
    });

    it("al quitar condición de la criatura en Iniciativa, se remueve de la Hoja de Personaje", () => {
      const state = usarAlmacenDM.getState();
      state.aplicarCondicionPersonaje(personajeId, "Asustado");
      expect(usarAlmacenDM.getState().personajes[0].condicionesActivas).toContain("Asustado");

      state.quitarCondicionDeCriatura(criaturaId, "Asustado");

      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeId);
      expect(pj?.condicionesActivas).not.toContain("Asustado");

      const criatura = usarAlmacenDM.getState().colaIniciativa.find((c) => c.id === criaturaId);
      expect(criatura?.condiciones).not.toContain("Asustado");
    });

    it("al limpiar todas las condiciones del personaje, se vacían en la criatura de iniciativa", () => {
      const state = usarAlmacenDM.getState();
      state.aplicarCondicionPersonaje(personajeId, "Cegado");
      state.aplicarCondicionPersonaje(personajeId, "Ensordecido");

      state.limpiarCondicionesPersonaje(personajeId);

      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeId);
      expect(pj?.condicionesActivas).toHaveLength(0);

      const criatura = usarAlmacenDM.getState().colaIniciativa.find((c) => c.id === criaturaId);
      expect(criatura?.condiciones).toHaveLength(0);
    });
  });

  describe("4. Rendimiento de Búsqueda Tolerante de Conjuros", () => {
    it("coincide eficientemente con nombres normalizados y ordenamiento perezoso", () => {
      const textoLargo = "Un proyectil de energía mágica brillante brota de tu dedo hacia un objetivo.";
      const coincide = coincideBusquedaTolerante(
        ["Proyectil Mágico", "Evocación", textoLargo],
        "proyectil magico"
      );
      expect(coincide).toBe(true);
    });

    it("retorna false inmediatamente cuando no hay coincidencia sin evaluar todo el texto innecesariamente", () => {
      const coincide = coincideBusquedaTolerante(
        ["Curar Heridas", "Evocación", "Una criatura que toques recupera puntos de golpe."],
        "bola de fuego"
      );
      expect(coincide).toBe(false);
    });
  });

  describe("5. Equipamiento Robusto y Reglas 5.5e (Armadura, Escudo y Stacks)", () => {
    const espadaLarga: ObjetoInventario = {
      idInstancia: "inv_espada_1",
      idObjeto: "item_espada_larga",
      nombre: "Espada larga",
      tipoPrincipal: "Arma",
      pesoLb: 3,
      rareza: "Común",
      cantidad: 1,
      equipado: false,
      sintonizado: false,
      notas: "",
      esMagico: false,
      equipable: false,
      sintonizacionRequerida: false
    };

    const cotaMalla: ObjetoInventario = {
      idInstancia: "inv_cota_1",
      idObjeto: "item_cota_malla",
      nombre: "Cota de malla",
      tipoPrincipal: "Armadura",
      pesoLb: 55,
      rareza: "Común",
      cantidad: 1,
      equipado: false,
      sintonizado: false,
      notas: "",
      esMagico: false,
      equipable: false,
      sintonizacionRequerida: false
    };

    const corazaPlacas: ObjetoInventario = {
      idInstancia: "inv_placas_1",
      idObjeto: "item_placas",
      nombre: "Armadura de placas",
      tipoPrincipal: "Armadura",
      pesoLb: 65,
      rareza: "Común",
      cantidad: 1,
      equipado: false,
      sintonizado: false,
      notas: "",
      esMagico: false,
      equipable: false,
      sintonizacionRequerida: false
    };

    const escudo: ObjetoInventario = {
      idInstancia: "inv_escudo_1",
      idObjeto: "item_escudo",
      nombre: "Escudo",
      tipoPrincipal: "Armadura",
      pesoLb: 6,
      rareza: "Común",
      cantidad: 1,
      equipado: false,
      sintonizado: false,
      notas: "",
      esMagico: false,
      equipable: false,
      sintonizacionRequerida: false
    };

    const dagasApiladas: ObjetoInventario = {
      idInstancia: "inv_daga_stack",
      idObjeto: "item_daga",
      nombre: "Daga",
      tipoPrincipal: "Arma",
      pesoLb: 1,
      rareza: "Común",
      cantidad: 3,
      equipado: false,
      sintonizado: false,
      notas: "",
      esMagico: false,
      equipable: false,
      sintonizacionRequerida: false
    };

    it("esObjetoEquipable identifica armas, armaduras y escudos sin requerir equipable: true previo", () => {
      expect(esObjetoEquipable(espadaLarga)).toBe(true);
      expect(esObjetoEquipable(cotaMalla)).toBe(true);
      expect(esObjetoEquipable(escudo)).toBe(true);
      expect(esObjetoEscudo(escudo)).toBe(true);
      expect(esObjetoArmaduraCorporal(cotaMalla)).toBe(true);
      expect(esObjetoArmaduraCorporal(escudo)).toBe(false);

      const objetoGenerico: ObjetoInventario = {
        idInstancia: "inv_cuerda",
        idObjeto: "item_cuerda",
        nombre: "Cuerda de cáñamo",
        tipoPrincipal: "Equipo de Aventuras",
        pesoLb: 10,
        rareza: "Común",
        cantidad: 1,
        equipado: false,
        sintonizado: false,
        notas: "",
        esMagico: false,
        equipable: false,
        sintonizacionRequerida: false
      };
      expect(esObjetoEquipable(objetoGenerico)).toBe(false);
    });

    it("procesarAlternarEquipado equipa un arma dejando equipado: true y equipable: true", () => {
      const invInicial = [espadaLarga];
      const resultado = procesarAlternarEquipado(invInicial, "inv_espada_1");
      expect(resultado[0].equipado).toBe(true);
      expect(resultado[0].equipable).toBe(true);
    });

    it("permite equipar 1 Armadura Corporal y 1 Escudo simultáneamente (D&D 5.5e)", () => {
      let inv = [cotaMalla, escudo];
      // Equipar cota de malla
      inv = procesarAlternarEquipado(inv, "inv_cota_1");
      expect(inv.find((o) => o.idInstancia === "inv_cota_1")?.equipado).toBe(true);

      // Equipar escudo también
      inv = procesarAlternarEquipado(inv, "inv_escudo_1");
      expect(inv.find((o) => o.idInstancia === "inv_cota_1")?.equipado).toBe(true);
      expect(inv.find((o) => o.idInstancia === "inv_escudo_1")?.equipado).toBe(true);
    });

    it("equipar una segunda Armadura Corporal desequipa la anterior pero preserva el Escudo", () => {
      let inv = [
        { ...cotaMalla, equipado: true },
        { ...escudo, equipado: true },
        corazaPlacas
      ];

      // Equipar placas
      inv = procesarAlternarEquipado(inv, "inv_placas_1");

      const placas = inv.find((o) => o.idInstancia === "inv_placas_1");
      const cota = inv.find((o) => o.idInstancia === "inv_cota_1");
      const esc = inv.find((o) => o.idInstancia === "inv_escudo_1");

      expect(placas?.equipado).toBe(true);
      expect(cota?.equipado).toBe(false); // Desequipada por ser otra armadura corporal
      expect(esc?.equipado).toBe(true); // Preservado porque es escudo
    });

    it("equipar un stack con cantidad > 1 equipa 1 unidad y mantiene el resto en mochila", () => {
      const inv = [dagasApiladas];
      const res = procesarAlternarEquipado(inv, "inv_daga_stack");

      expect(res).toHaveLength(2);
      const equipada = res.find((o) => o.idInstancia === "inv_daga_stack");
      const restoMochila = res.find((o) => o.idInstancia !== "inv_daga_stack");

      expect(equipada?.cantidad).toBe(1);
      expect(equipada?.equipado).toBe(true);
      expect(restoMochila?.cantidad).toBe(2);
      expect(restoMochila?.equipado).toBe(false);
    });

    it("desequipar fusiona de vuelta en la mochila si ya existe un objeto idéntico", () => {
      const dagaEquipada: ObjetoInventario = {
        ...dagasApiladas,
        idInstancia: "inv_daga_eq",
        cantidad: 1,
        equipado: true
      };
      const dagaMochila: ObjetoInventario = {
        ...dagasApiladas,
        idInstancia: "inv_daga_mochila",
        cantidad: 2,
        equipado: false
      };

      const inv = [dagaEquipada, dagaMochila];
      const res = procesarAlternarEquipado(inv, "inv_daga_eq");

      expect(res).toHaveLength(1);
      expect(res[0].idInstancia).toBe("inv_daga_mochila");
      expect(res[0].cantidad).toBe(3);
      expect(res[0].equipado).toBe(false);
    });
  });
});
