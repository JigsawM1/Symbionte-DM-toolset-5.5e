import { describe, it, expect } from "vitest";
import {
  obtenerDadosExtraAtaque,
  obtenerDanosSecundariosAtaque,
  obtenerHabilidadesConFuerzaRasgos,
  calcularDefensaSinArmaduraRasgos,
  calcularModificadoresStatsRasgos,
  ContextoAtaquePersonaje
} from "./evaluadorEfectosRasgos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";

function crearRasgoTest(parcial: Partial<RasgoPersonaje> & { id: string; nombre: string }): RasgoPersonaje {
  return {
    id: parcial.id,
    nombre: parcial.nombre,
    descripcion: parcial.descripcion || "",
    origen: parcial.origen || "personalizado",
    fuente: parcial.fuente || "Homebrew",
    tipoAccion: parcial.tipoAccion || "pasivo",
    nivelRequerido: parcial.nivelRequerido,
    tieneUsosLimitados: parcial.tieneUsosLimitados ?? false,
    usosMaximos: parcial.usosMaximos,
    usosRestantes: parcial.usosRestantes,
    recuperacion: parcial.recuperacion || "ninguno",
    formulaDados: parcial.formulaDados,
    personalizado: true,
    activo: parcial.activo ?? true,
    esActivable: parcial.esActivable ?? false,
    ligadoA: parcial.ligadoA,
    condicionAlActivar: parcial.condicionAlActivar,
    efectos: parcial.efectos || [],
    selectores: parcial.selectores || [],
    notas: parcial.notas || ""
  };
}

describe("Mecánicas Universales de Rasgos y Dotes Homebrew", () => {
  const personajeBase: PersonajeJugador = {
    ...PERSONAJE_POR_DEFECTO,
    id: "pj-test-homebrew",
    nombre: "Kragthor el Devastador",
    clase: "Bárbaro",
    nivel: 6,
    especie: "Orco",
    caracteristicas: {
      fuerza: 18,
      destreza: 14,
      constitucion: 16,
      inteligencia: 10,
      sabiduria: 12,
      carisma: 8
    },
    condicionesActivas: [],
    rasgos: []
  };

  it("evalúa dados extra de daño dinámicos en ataques con Fuerza", () => {
    const rasgoGolpePoderoso = crearRasgoTest({
      id: "rasgo_golpe_poderoso",
      nombre: "Golpe Poderoso Homebrew",
      descripcion: "Añade 1d10 al daño de armas que usen Fuerza",
      efectos: [
        {
          id: "ef1",
          tipo: "dado_extra_dano",
          objetivo: "arma_fuerza",
          aplicaA: "arma_fuerza",
          valor: "1d10",
          activo: true
        }
      ]
    });

    const pjConRasgo: PersonajeJugador = {
      ...personajeBase,
      rasgos: [rasgoGolpePoderoso]
    };

    const ctxArmaFuerza: ContextoAtaquePersonaje = {
      tipo: "arma",
      caracteristica: "fuerza",
      esCuerpoACuerpo: true,
      esDistancia: false
    };

    const dadosExtra = obtenerDadosExtraAtaque(pjConRasgo, ctxArmaFuerza);
    expect(dadosExtra).toHaveLength(1);
    expect(dadosExtra[0].dados).toBe("1d10");

    // No debe aplicar a armas que usen Destreza
    const ctxArmaDestreza: ContextoAtaquePersonaje = {
      tipo: "arma",
      caracteristica: "destreza",
      esCuerpoACuerpo: true,
      esDistancia: false
    };
    const dadosExtraDes = obtenerDadosExtraAtaque(pjConRasgo, ctxArmaDestreza);
    expect(dadosExtraDes).toHaveLength(0);
  });

  it("evalúa daño secundario independiente con tipo separado (para TaleSpire '/')", () => {
    const rasgoLlamaSagrada = crearRasgoTest({
      id: "rasgo_llama_sagrada",
      nombre: "Hoja de Llama Sagrada",
      descripcion: "Añade daño secundario radiante de 1d6 + mitad de nivel",
      efectos: [
        {
          id: "ef_sec",
          tipo: "dano_secundario",
          objetivo: "arma_fuerza",
          aplicaA: "arma_fuerza",
          valor: "1d6+mitad_nivel",
          tipoDano: "Radiante",
          activo: true
        }
      ]
    });

    const pjConRasgo: PersonajeJugador = {
      ...personajeBase,
      nivel: 6, // mitad de nivel = 3 -> "1d6+3"
      rasgos: [rasgoLlamaSagrada]
    };

    const ctxArmaFuerza: ContextoAtaquePersonaje = {
      tipo: "arma",
      caracteristica: "fuerza",
      esCuerpoACuerpo: true,
      esDistancia: false
    };

    const danosSec = obtenerDanosSecundariosAtaque(pjConRasgo, ctxArmaFuerza);
    expect(danosSec).toHaveLength(1);
    expect(danosSec[0].formula).toBe("1d6+3");
    expect(danosSec[0].tipoDano).toBe("Radiante");
  });

  it("evalúa modificadores de características y elevación de límite a 25", () => {
    const rasgoPoderTitanico = crearRasgoTest({
      id: "rasgo_poder_titanico",
      nombre: "Fuerza Titánica",
      descripcion: "+4 a Fuerza y el límite pasa a ser 25",
      efectos: [
        {
          id: "ef_stat",
          tipo: "modificador_stat",
          objetivo: "fuerza",
          valor: 4,
          limiteMaximo: 25,
          activo: true
        }
      ]
    });

    const pjConRasgo: PersonajeJugador = {
      ...personajeBase,
      rasgos: [rasgoPoderTitanico]
    };

    const { bonos, limitesMaximos } = calcularModificadoresStatsRasgos(pjConRasgo);
    expect(bonos.fuerza).toBe(4);
    expect(limitesMaximos.fuerza).toBe(25);
  });

  it("evalúa defensa sin armadura con atributo configurable y soporte de escudo", () => {
    const rasgoDefensaMagica = crearRasgoTest({
      id: "rasgo_armadura_mistica",
      nombre: "Defensa Mística",
      descripcion: "Usa Inteligencia para CA y permite escudo",
      efectos: [
        {
          id: "ef_ca",
          tipo: "modificador_ca",
          objetivo: "defensa_sin_armadura",
          valor: "inteligencia",
          permiteEscudo: true,
          activo: true
        }
      ]
    });

    const pjConRasgo: PersonajeJugador = {
      ...personajeBase,
      rasgos: [rasgoDefensaMagica]
    };

    const modificadores = {
      fuerza: 4,
      destreza: 2,
      constitucion: 3,
      inteligencia: 4,
      sabiduria: 1,
      carisma: -1
    };

    const resCA = calcularDefensaSinArmaduraRasgos(pjConRasgo, modificadores);
    expect(resCA).not.toBeNull();
    expect(resCA?.caracteristicaExtra).toBe("inteligencia");
    expect(resCA?.bonoExtra).toBe(4);
  });

  it("evalúa sustitución de Fuerza en habilidades configuradas", () => {
    const rasgoMusculoPuro = crearRasgoTest({
      id: "rasgo_musculo_puro",
      nombre: "Músculo Puro",
      descripcion: "Permite usar Fuerza en Intimidación y Acrobacias",
      efectos: [
        {
          id: "ef_hab",
          tipo: "habilidad_con_fuerza",
          objetivo: "habilidades",
          valor: "intimidacion, acrobacias",
          activo: true
        }
      ]
    });

    const pjConRasgo: PersonajeJugador = {
      ...personajeBase,
      rasgos: [rasgoMusculoPuro]
    };

    const habsConFuerza = obtenerHabilidadesConFuerzaRasgos(pjConRasgo);
    expect(habsConFuerza.has("intimidacion")).toBe(true);
    expect(habsConFuerza.has("acrobacias")).toBe(true);
    expect(habsConFuerza.has("sigilo")).toBe(false);
  });

  it("gestiona conmutador ON/OFF, bloqueo de ligadoA, condicionAlActivar y apagado en cascada", () => {
    const rasgoPadre = crearRasgoTest({
      id: "rasgo_forma_bestial",
      nombre: "Forma Bestial",
      descripcion: "Te transformas en bestia",
      tipoAccion: "accion_adicional",
      activo: false,
      esActivable: true,
      condicionAlActivar: "Forma Bestial (Beast Form)"
    });

    const rasgoHijo = crearRasgoTest({
      id: "rasgo_mordisco_atroz",
      nombre: "Mordisco Atroz",
      descripcion: "Solo disponible mientras estás en Forma Bestial",
      tipoAccion: "accion",
      activo: false,
      esActivable: true,
      ligadoA: "rasgo_forma_bestial"
    });

    const pjConVinculo: PersonajeJugador = {
      ...personajeBase,
      id: "pj-cascada-test",
      rasgos: [rasgoPadre, rasgoHijo]
    };

    usarAlmacenDM.setState({
      personajes: [pjConVinculo],
      idPersonajeActivo: "pj-cascada-test"
    });

    // 1. Intentar activar el hijo sin que el padre esté activo -> DEBE ESTAR BLOQUEADO
    usarAlmacenDM.getState().alternarActivoRasgo("pj-cascada-test", "rasgo_mordisco_atroz");
    let pjActual = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj-cascada-test");
    let hijo = pjActual?.rasgos?.find((r) => r.id === "rasgo_mordisco_atroz");
    expect(hijo?.activo).toBe(false);

    // 2. Activar el padre -> Debe activarse y sincronizar su condición en TaleSpire
    usarAlmacenDM.getState().alternarActivoRasgo("pj-cascada-test", "rasgo_forma_bestial");
    pjActual = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj-cascada-test");
    let padre = pjActual?.rasgos?.find((r) => r.id === "rasgo_forma_bestial");
    expect(padre?.activo).toBe(true);
    expect(pjActual?.condicionesActivas).toContain("Forma Bestial (Beast Form)");

    // 3. Ahora que el padre está activo, activar el hijo -> DEBE PERMITIRLO
    usarAlmacenDM.getState().alternarActivoRasgo("pj-cascada-test", "rasgo_mordisco_atroz");
    pjActual = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj-cascada-test");
    hijo = pjActual?.rasgos?.find((r) => r.id === "rasgo_mordisco_atroz");
    expect(hijo?.activo).toBe(true);

    // 4. Apagar el padre -> El hijo debe apagarse AUTOMÁTICAMENTE EN CASCADA
    usarAlmacenDM.getState().alternarActivoRasgo("pj-cascada-test", "rasgo_forma_bestial");
    pjActual = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj-cascada-test");
    padre = pjActual?.rasgos?.find((r) => r.id === "rasgo_forma_bestial");
    hijo = pjActual?.rasgos?.find((r) => r.id === "rasgo_mordisco_atroz");

    expect(padre?.activo).toBe(false);
    expect(hijo?.activo).toBe(false); // Cascada exitosa
    expect(pjActual?.condicionesActivas).not.toContain("Forma Bestial (Beast Form)");

    // 5. Encender el padre de nuevo, luego encender el hijo, y retirar la condición táctica desde TaleSpire
    usarAlmacenDM.getState().alternarActivoRasgo("pj-cascada-test", "rasgo_forma_bestial");
    usarAlmacenDM.getState().alternarActivoRasgo("pj-cascada-test", "rasgo_mordisco_atroz");
    pjActual = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj-cascada-test");
    expect(pjActual?.rasgos?.find((r) => r.id === "rasgo_mordisco_atroz")?.activo).toBe(true);

    // Quitar la condición táctica en TaleSpire debe apagar el rasgo y sus hijos en cascada
    usarAlmacenDM.getState().quitarCondicionPersonaje("pj-cascada-test", "Forma Bestial (Beast Form)");
    pjActual = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj-cascada-test");
    padre = pjActual?.rasgos?.find((r) => r.id === "rasgo_forma_bestial");
    hijo = pjActual?.rasgos?.find((r) => r.id === "rasgo_mordisco_atroz");

    expect(padre?.activo).toBe(false);
    expect(hijo?.activo).toBe(false);
  });
});
