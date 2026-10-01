import { describe, it, expect, beforeEach } from "vitest";
import { obtenerVelocidadesEfectivas } from "./evaluadorMovilidadRasgos";
import { evaluarVentajasDeRasgosEnTirada } from "./evaluadorSalvacionesRasgos";
import { calcularEstadoVelocidadDinamica } from "@/servicios/calculadorDistanciaTS";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import type { PersonajeJugador } from "@/tipos/personaje";
import type { RasgoPersonaje } from "@/tipos/rasgos";

function crearRasgoMock(datos: Partial<RasgoPersonaje> & { id: string; nombre: string }): RasgoPersonaje {
  return {
    descripcion: "",
    origen: "personalizado",
    fuente: "Homebrew",
    tipoAccion: "pasivo",
    tieneUsosLimitados: false,
    recuperacion: "ninguno",
    personalizado: false,
    activo: true,
    notas: "",
    ...datos
  };
}

describe("Evaluador de Movilidad y Velocidad Dinámica (D&D 5.5e / 2024)", () => {
  const personajeBase: PersonajeJugador = {
    ...PERSONAJE_POR_DEFECTO,
    id: "pj-mov-test",
    nombre: "Explorador Veloz",
    velocidad: { caminar: 30, nadar: 20, volar: 0, escalar: 15, planea: false },
    condicionesActivas: [],
    efectosActivos: [],
    rasgos: []
  };

  describe("1. Condiciones Oficiales que reducen la velocidad a 0", () => {
    const condicionesVelocidadCero = [
      "Apresado",
      "Inmovilizado",
      "Paralizado",
      "Aturdido",
      "Petrificado",
      "Inconsciente",
      "Grappled",
      "Restrained",
      "Paralyzed",
      "Stunned",
      "Petrified",
      "Unconscious"
    ];

    for (const condicion of condicionesVelocidadCero) {
      it(`reduce todas las velocidades a 0 pies bajo la condición "${condicion}"`, () => {
        const pjConCondicion: PersonajeJugador = {
          ...personajeBase,
          condicionesActivas: [condicion]
        };

        const velocidades = obtenerVelocidadesEfectivas(pjConCondicion);
        expect(velocidades.caminar).toBe(0);
        expect(velocidades.nadar).toBe(0);
        expect(velocidades.escalar).toBe(0);

        const estadoDinamico = calcularEstadoVelocidadDinamica(velocidades.caminar, 0, 0, null);
        expect(estadoDinamico.velocidadTotal).toBe(0);
        expect(estadoDinamico.movimientoRestante).toBe(0);
        expect(estadoDinamico.agotado).toBe(true);
      });
    }
  });

  describe("2. Efectos y Hechizos que reducen la velocidad a la mitad (x0.5)", () => {
    it("reduce a la mitad las velocidades con el efecto o conjuro Lentitud (Slow)", () => {
      const pjLento: PersonajeJugador = {
        ...personajeBase,
        condicionesActivas: ["Lentitud"]
      };

      const velocidades = obtenerVelocidadesEfectivas(pjLento);
      expect(velocidades.caminar).toBe(15); // 30 / 2
      expect(velocidades.nadar).toBe(10); // 20 / 2
      expect(velocidades.escalar).toBe(7); // 15 / 2 = 7 (Math.floor)
    });

    it("reduce a la mitad con multiplicador_velocidad declarativo de rasgo", () => {
      const rasgoRalentizador = crearRasgoMock({
        id: "rasgo-ralentizado",
        nombre: "Carga Pesada / Ralentizado",
        descripcion: "Tu velocidad se reduce a la mitad",
        efectos: [
          {
            tipo: "multiplicador_velocidad",
            objetivo: "todas",
            valor: 0.5,
            descripcion: "Velocidad reducida a la mitad",
            activo: true
          }
        ]
      });

      const pj: PersonajeJugador = {
        ...personajeBase,
        rasgos: [rasgoRalentizador]
      };

      const velocidades = obtenerVelocidadesEfectivas(pj);
      expect(velocidades.caminar).toBe(15);
      expect(velocidades.nadar).toBe(10);
    });
  });

  describe("3. Cansancio / Agotamiento D&D 5.5e (2024)", () => {
    it("reduce 5 pies de velocidad por cada nivel de cansancio", () => {
      // Nivel 1: -5 ft -> 30 - 5 = 25 ft
      const pjCansadoNiv1: PersonajeJugador = {
        ...personajeBase,
        condicionesActivas: ["Cansado (Niv. 1)"]
      };
      expect(obtenerVelocidadesEfectivas(pjCansadoNiv1).caminar).toBe(25);
      expect(obtenerVelocidadesEfectivas(pjCansadoNiv1).nadar).toBe(15);

      // Nivel 3: -15 ft -> 30 - 15 = 15 ft
      const pjCansadoNiv3: PersonajeJugador = {
        ...personajeBase,
        cansancio: 3
      };
      expect(obtenerVelocidadesEfectivas(pjCansadoNiv3).caminar).toBe(15);
      expect(obtenerVelocidadesEfectivas(pjCansadoNiv3).nadar).toBe(5);

      // Nivel 6 o superior: no baja de 0
      const pjCansadoExtremo: PersonajeJugador = {
        ...personajeBase,
        cansancio: 8
      };
      expect(obtenerVelocidadesEfectivas(pjCansadoExtremo).caminar).toBe(0);
    });
  });

  describe("4. Rasgos Activables con Fijación de Velocidad y Ventaja (Puntería Estable)", () => {
    const rasgoPunteriaEstable = crearRasgoMock({
      id: "rasgo_punteria_estable",
      nombre: "Puntería estable",
      descripcion: "Como acción adicional, te otorgas ventaja en tu siguiente ataque si no te has movido. Tu velocidad se reduce a 0 pies.",
      origen: "clase",
      fuente: "PHB 2024",
      tipoAccion: "accion_adicional",
      categoriaMecanica: "activable",
      esActivable: true,
      requiereSinMovimiento: true,
      autoDesactivarAlTirarDano: true,
      activo: false,
      efectos: [
        {
          tipo: "ventaja",
          objetivo: "ataque",
          valor: "ventaja",
          descripcion: "Ventaja en la siguiente tirada de ataque en el turno actual",
          activo: true
        },
        {
          tipo: "fijar_velocidad",
          objetivo: "todas",
          valor: 0,
          descripcion: "Tu velocidad se reduce a 0 pies hasta el final del turno actual",
          activo: true
        }
      ]
    });

    it("evalúa ventaja en tiradas de ataque cuando el rasgo está activo", () => {
      const pjInactivo: PersonajeJugador = {
        ...personajeBase,
        rasgos: [{ ...rasgoPunteriaEstable, activo: false }]
      };
      const resInactivo = evaluarVentajasDeRasgosEnTirada(pjInactivo, { tipoTirada: "ataque", subtipo: "destreza" });
      expect(resInactivo.tieneVentaja).toBe(false);

      const pjActivo: PersonajeJugador = {
        ...personajeBase,
        rasgos: [{ ...rasgoPunteriaEstable, activo: true }]
      };
      const resActivo = evaluarVentajasDeRasgosEnTirada(pjActivo, { tipoTirada: "ataque", subtipo: "destreza" });
      expect(resActivo.tieneVentaja).toBe(true);
      expect(resActivo.razones[0]).toContain("Ventaja");
    });

    it("fija la velocidad a 0 pies cuando el rasgo está activo", () => {
      const pjActivo: PersonajeJugador = {
        ...personajeBase,
        rasgos: [{ ...rasgoPunteriaEstable, activo: true }]
      };
      const vel = obtenerVelocidadesEfectivas(pjActivo);
      expect(vel.caminar).toBe(0);
      expect(vel.nadar).toBe(0);
      expect(vel.escalar).toBe(0);
    });

    it("permite fijar una velocidad absoluta personalizada (ej. fijar a 45 ft)", () => {
      const rasgoFijar45 = crearRasgoMock({
        id: "rasgo-fijar-45",
        nombre: "Paso Celestial",
        descripcion: "Tu velocidad al caminar se fija en 45 pies",
        efectos: [
          {
            tipo: "fijar_velocidad",
            objetivo: "caminar",
            valor: 45,
            descripcion: "Velocidad fijada en 45 pies",
            activo: true
          }
        ]
      });

      const pj: PersonajeJugador = {
        ...personajeBase,
        rasgos: [rasgoFijar45]
      };

      const vel = obtenerVelocidadesEfectivas(pj);
      expect(vel.caminar).toBe(45);
    });
  });

  describe("5. Integración con Slice Store: Restricción de requiereSinMovimiento", () => {
    const idPj = "pj-store-mov-test";

    const rasgoPunteria = crearRasgoMock({
      id: "rasgo_punteria_test",
      nombre: "Puntería estable",
      descripcion: "Solo si no te has movido",
      origen: "clase",
      fuente: "PHB 2024",
      tipoAccion: "accion_adicional",
      categoriaMecanica: "activable",
      esActivable: true,
      requiereSinMovimiento: true,
      activo: false,
      efectos: [
        {
          tipo: "fijar_velocidad",
          objetivo: "todas",
          valor: 0,
          activo: true
        }
      ]
    });

    beforeEach(() => {
      usarAlmacenDM.setState({
        personajes: [
          {
            ...PERSONAJE_POR_DEFECTO,
            id: idPj,
            nombre: "Pícaro Ágil",
            velocidad: { caminar: 30, planea: false, nadar: 0, volar: 0, escalar: 0 },
            movimientoGastado: 0,
            rasgos: [rasgoPunteria]
          }
        ],
        idPersonajeActivo: idPj
      });
    });

    it("permite activar Puntería Estable si el personaje NO se ha movido (movimientoGastado === 0)", () => {
      usarAlmacenDM.getState().alternarActivoRasgo(idPj, "rasgo_punteria_test");

      const pj = usarAlmacenDM.getState().personajes[0];
      const r = pj.rasgos?.find((x) => x.id === "rasgo_punteria_test");
      expect(r?.activo).toBe(true);

      const velocidades = obtenerVelocidadesEfectivas(pj);
      expect(velocidades.caminar).toBe(0);
    });

    it("BLOQUEA la activación de Puntería Estable si el personaje ya se ha movido (movimientoGastado > 0)", () => {
      // 1. El personaje gasta 10 pies de movimiento
      usarAlmacenDM.getState().modificarMovimientoGastadoPersonaje(idPj, 10);
      expect(usarAlmacenDM.getState().personajes[0].movimientoGastado).toBe(10);

      // 2. Intenta activar Puntería Estable
      usarAlmacenDM.getState().alternarActivoRasgo(idPj, "rasgo_punteria_test");

      // 3. Debe permanecer INACTIVO
      const pj = usarAlmacenDM.getState().personajes[0];
      const r = pj.rasgos?.find((x) => x.id === "rasgo_punteria_test");
      expect(r?.activo).toBe(false);

      // 4. La velocidad sigue siendo la normal
      const velocidades = obtenerVelocidadesEfectivas(pj);
      expect(velocidades.caminar).toBe(30);
    });
  });
});
