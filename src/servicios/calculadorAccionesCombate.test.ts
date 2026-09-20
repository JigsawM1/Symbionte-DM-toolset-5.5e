import { describe, it, expect } from "vitest";
import {
  resolverConjurosAcciones,
  verificarHechizoDeSubclase,
  resolverRasgosAcciones,
  resolverHechizosObjetosMagicos
} from "./calculadorAccionesCombate";
import { aplicarEspecieAPersonaje } from "./gestorEspecies";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { HECHIZOS_INICIALES } from "@/utiles/datosIniciales";
import type { HechizoBase, PersonajeJugador, RasgoPersonaje } from "@/tipos";

describe("calculadorAccionesCombate - Resolución de Conjuros en Acciones de Combate", () => {
  it("resuelve trucos innatos de especie para Aasimar a nivel 1 (Luz)", () => {
    const pjAasimar = aplicarEspecieAPersonaje(
      { ...PERSONAJE_POR_DEFECTO, nivel: 1 },
      { especieId: "aasimar" }
    );

    const accionesMagicas = resolverConjurosAcciones(pjAasimar, HECHIZOS_INICIALES);
    const nombres = accionesMagicas.map((a) => a.hechizo.nombre.toLowerCase());

    expect(nombres).toContain("luz");
    const luz = accionesMagicas.find((a) => a.hechizo.nombre.toLowerCase() === "luz");
    expect(luz?.tipoAccion).toBe("accion");
  });

  describe("Alto Elfo - Desbloqueo progresivo de conjuros de linaje por nivel", () => {
    it("a nivel 1 solo tiene disponible el truco de mago (Prestidigitación)", () => {
      const pj = aplicarEspecieAPersonaje(
        { ...PERSONAJE_POR_DEFECTO, nivel: 1 },
        { especieId: "elfo", subespecieId: "alto_elfo" }
      );

      const accionesMagicas = resolverConjurosAcciones(pj, HECHIZOS_INICIALES);
      const nombres = accionesMagicas.map((a) => a.hechizo.nombre.toLowerCase());

      expect(nombres).toContain("prestidigitación");
      expect(nombres).not.toContain("detectar magia");
      expect(nombres).not.toContain("paso brumoso");
    });

    it("a nivel 3 desbloquea Detectar magia pero aún no Paso brumoso", () => {
      const pj = aplicarEspecieAPersonaje(
        { ...PERSONAJE_POR_DEFECTO, nivel: 3 },
        { especieId: "elfo", subespecieId: "alto_elfo" }
      );

      const accionesMagicas = resolverConjurosAcciones(pj, HECHIZOS_INICIALES);
      const nombres = accionesMagicas.map((a) => a.hechizo.nombre.toLowerCase());

      expect(nombres).toContain("prestidigitación");
      expect(nombres).toContain("detectar magia");
      expect(nombres).not.toContain("paso brumoso");

      const detectar = accionesMagicas.find((a) => a.hechizo.nombre.toLowerCase() === "detectar magia");
      expect(detectar?.tipoAccion).toBe("accion");
    });

    it("a nivel 5 desbloquea Paso brumoso como acción adicional", () => {
      const pj = aplicarEspecieAPersonaje(
        { ...PERSONAJE_POR_DEFECTO, nivel: 5 },
        { especieId: "elfo", subespecieId: "alto_elfo" }
      );

      const accionesMagicas = resolverConjurosAcciones(pj, HECHIZOS_INICIALES);
      const nombres = accionesMagicas.map((a) => a.hechizo.nombre.toLowerCase());

      expect(nombres).toContain("prestidigitación");
      expect(nombres).toContain("detectar magia");
      expect(nombres).toContain("paso brumoso");

      const pasoBrumoso = accionesMagicas.find((a) => a.hechizo.nombre.toLowerCase() === "paso brumoso");
      expect(pasoBrumoso?.tipoAccion).toBe("accionAdicional");
    });

    it("respeta el truco seleccionado en el selector de rasgo si se modifica", () => {
      const pj = aplicarEspecieAPersonaje(
        { ...PERSONAJE_POR_DEFECTO, nivel: 1 },
        { especieId: "elfo", subespecieId: "alto_elfo" }
      );

      // Simular cambio del selector de truco a Rayo de fuego
      const rasgosModificados = (pj.rasgos || []).map((r) => {
        if (r.selectores?.some((s) => s.id === "selector_truco_alto_elfo")) {
          return {
            ...r,
            conjurosOtorgados: ["descarga_de_fuego"],
            selectores: r.selectores.map((s) =>
              s.id === "selector_truco_alto_elfo" ? { ...s, valorActual: ["descarga_de_fuego"] } : s
            )
          };
        }
        return r;
      });

      const pjPersonalizado: PersonajeJugador = {
        ...pj,
        trucosConocidosIds: ["descarga_de_fuego"],
        rasgos: rasgosModificados
      };

      const accionesMagicas = resolverConjurosAcciones(pjPersonalizado, HECHIZOS_INICIALES);
      const nombres = accionesMagicas.map((a) => a.hechizo.nombre.toLowerCase());

      expect(nombres).toContain("descarga de fuego");
    });
  });

  describe("Drow - Desbloqueo progresivo", () => {
    it("a nivel 3 contiene Luces danzantes y Fuego feérico, pero no Oscuridad", () => {
      const pjDrow = aplicarEspecieAPersonaje(
        { ...PERSONAJE_POR_DEFECTO, nivel: 3 },
        { especieId: "elfo", subespecieId: "drow" }
      );

      const accionesMagicas = resolverConjurosAcciones(pjDrow, HECHIZOS_INICIALES);
      const nombres = accionesMagicas.map((a) => a.hechizo.nombre.toLowerCase());

      expect(nombres).toContain("luces danzantes");
      expect(nombres).toContain("fuego feérico");
      expect(nombres).not.toContain("oscuridad");
    });

    it("a nivel 5 desbloquea Oscuridad", () => {
      const pjDrow = aplicarEspecieAPersonaje(
        { ...PERSONAJE_POR_DEFECTO, nivel: 5 },
        { especieId: "elfo", subespecieId: "drow" }
      );

      const accionesMagicas = resolverConjurosAcciones(pjDrow, HECHIZOS_INICIALES);
      const nombres = accionesMagicas.map((a) => a.hechizo.nombre.toLowerCase());

      expect(nombres).toContain("luces danzantes");
      expect(nombres).toContain("fuego feérico");
      expect(nombres).toContain("oscuridad");
    });
  });

  describe("Clasificación de economía de acciones", () => {
    it("clasifica correctamente acciones, acciones adicionales y reacciones", () => {
      const hechizoReaccion: HechizoBase = {
        id: "h_escudo",
        nombre: "Escudo",
        nivel: 1,
        escuela: "Abjuración",
        tiempoLanzamiento: "1 reacción, que realizas cuando eres impactado por un ataque",
        alcance: "Personal",
        componentesSeleccionados: { verbal: true, somatico: true, material: false },
        descripcion: "Un destello invisible de fuerza te protege.",
        duracion: "1 ronda",
        concentracion: false,
        ritual: false
      };

      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        conjurosPreparadosIds: ["h_escudo"]
      };

      const res = resolverConjurosAcciones(pj, [hechizoReaccion]);
      expect(res).toHaveLength(1);
      expect(res[0].tipoAccion).toBe("reaccion");
    });
  });

  describe("verificarHechizoDeSubclase", () => {
    it("detecta hechizos de subclase mediante coincidencia flexible de ID y nombre", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        clase: "Clérigo",
        subclase: "Dominio de la Vida",
        clases: [{ nombre: "Clérigo", subclase: "Dominio de la Vida", nivel: 3 }],
        nivel: 3
      };

      const hechizoBendicion: HechizoBase = {
        id: "h_bendicion",
        nombre: "Bendición",
        nivel: 1,
        escuela: "Encantamiento",
        tiempoLanzamiento: "1 acción",
        alcance: "30 pies",
        componentesSeleccionados: { verbal: true, somatico: true, material: true },
        descripcion: "Bendices hasta a tres criaturas.",
        duracion: "Concentración, hasta 1 minuto",
        concentracion: true,
        ritual: false
      };

      expect(verificarHechizoDeSubclase(hechizoBendicion, pj)).toBe(true);
    });
  });

  describe("resolverRasgosAcciones - Integración de Rasgos en Pestaña de Acciones", () => {
    const crearRasgoMock = (parcial: Partial<RasgoPersonaje> & { id: string; nombre: string }): RasgoPersonaje => ({
      descripcion: "",
      origen: "personalizado",
      fuente: "General",
      tipoAccion: "pasivo",
      tieneUsosLimitados: false,
      recuperacion: "ninguno",
      personalizado: false,
      activo: true,
      notas: "",
      ...parcial
    });

    it("clasifica rasgos por economía de acción (acción, adicional, reacción)", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        nivel: 3,
        rasgos: [
          crearRasgoMock({
            id: "r1",
            nombre: "Ataque de Aliento",
            descripcion: "Exhala fuego en cono",
            tipoAccion: "accion",
            origen: "especie",
            fuente: "Dracónido",
            activo: true
          }),
          crearRasgoMock({
            id: "r2",
            nombre: "Segundo Aliento",
            descripcion: "Recupera 1d10 + nivel",
            tipoAccion: "accion_adicional",
            origen: "clase",
            fuente: "Guerrero",
            activo: true,
            tieneUsosLimitados: true,
            usosMaximos: 1,
            usosRestantes: 1
          }),
          crearRasgoMock({
            id: "r3",
            nombre: "Desviar Proyectiles",
            descripcion: "Atrapa una flecha",
            tipoAccion: "reaccion",
            origen: "clase",
            fuente: "Monje",
            activo: true
          })
        ]
      };

      const res = resolverRasgosAcciones(pj);
      expect(res).toHaveLength(3);

      const r1 = res.find((r) => r.rasgo.id === "r1");
      expect(r1?.categoriasCombate).toContain("accion");
      expect(r1?.tipoAccionCalculado).toBe("accion");

      const r2 = res.find((r) => r.rasgo.id === "r2");
      expect(r2?.categoriasCombate).toContain("accionAdicional");
      expect(r2?.categoriasCombate).toContain("consumible");
      expect(r2?.tipoAccionCalculado).toBe("accionAdicional");
      expect(r2?.esConsumible).toBe(true);

      const r3 = res.find((r) => r.rasgo.id === "r3");
      expect(r3?.categoriasCombate).toContain("reaccion");
      expect(r3?.tipoAccionCalculado).toBe("reaccion");
    });

    it("resuelve rasgos activables (toggles) y rasgos multicategoría como Furia", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        nivel: 1,
        rasgos: [
          crearRasgoMock({
            id: "rasgo_furia",
            nombre: "Furia",
            descripcion: "Entra en furia",
            tipoAccion: "accion_adicional",
            origen: "clase",
            fuente: "Bárbaro",
            esActivable: true,
            tieneUsosLimitados: true,
            usosMaximos: 2,
            usosRestantes: 2,
            activo: false
          })
        ]
      };

      const res = resolverRasgosAcciones(pj);
      expect(res).toHaveLength(1);
      const furia = res[0];
      expect(furia.categoriasCombate).toContain("accionAdicional");
      expect(furia.categoriasCombate).toContain("activable");
      expect(furia.categoriasCombate).toContain("consumible");
      expect(furia.esActivable).toBe(true);
      expect(furia.esConsumible).toBe(true);
      expect(furia.usosRestantes).toBe(2);
      expect(furia.usosMaximos).toBe(2);
    });

    it("excluye rasgos puramente pasivos permanentes sin dados ni conmutadores", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        nivel: 1,
        rasgos: [
          crearRasgoMock({
            id: "vision_oscuridad",
            nombre: "Visión en la Oscuridad",
            descripcion: "Ves en la oscuridad hasta 60 pies",
            tipoAccion: "pasivo",
            origen: "especie",
            fuente: "Elfo",
            activo: true,
            categoriaMecanica: "pasivo_permanente"
          }),
          crearRasgoMock({
            id: "ataque_temerario",
            nombre: "Ataque Temerario",
            descripcion: "Ventaja en ataques con Fuerza",
            tipoAccion: "pasivo",
            origen: "clase",
            fuente: "Bárbaro",
            esActivable: true,
            activo: false
          })
        ]
      };

      const res = resolverRasgosAcciones(pj);
      // Solo el rasgo activable debe pasar
      expect(res).toHaveLength(1);
      expect(res[0].rasgo.id).toBe("ataque_temerario");
      expect(res[0].esActivable).toBe(true);
    });

    it("filtra rasgos cuyo nivel requerido sea superior al nivel del personaje", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        nivel: 2,
        rasgos: [
          crearRasgoMock({
            id: "rasgo_nv5",
            nombre: "Ataque Extra",
            descripcion: "Atacas dos veces",
            tipoAccion: "especial",
            nivelRequerido: 5,
            origen: "clase",
            fuente: "Guerrero",
            activo: true
          })
        ]
      };

      const res = resolverRasgosAcciones(pj);
      expect(res).toHaveLength(0);
    });

    it("resuelve Inspiración bárdica y Detectar magia para un Bardo Alto Elfo nivel 3", () => {
      const pjBardo: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        clase: "Bardo",
        nivel: 3,
        especie: "Elfo",
        subespecie: "Alto elfo",
        caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, carisma: 16 },
        rasgos: [] // Simula personaje sin sincronizar previamente en almacenamiento
      };

      const res = resolverRasgosAcciones(pjBardo);
      const nombres = res.map((r) => r.rasgo.nombre);

      // Debe contener tanto el rasgo de especie (Detectar magia) como el de clase (Inspiración bárdica)
      expect(nombres).toContain("Magia de alto elfo: Detectar magia");
      expect(nombres).toContain("Inspiración bárdica");

      const inspiracion = res.find((r) => r.rasgo.nombre === "Inspiración bárdica");
      expect(inspiracion).toBeDefined();
      expect(inspiracion?.categoriasCombate).toContain("accionAdicional");
      expect(inspiracion?.categoriasCombate).toContain("consumible");
      expect(inspiracion?.esConsumible).toBe(true);
      expect(inspiracion?.tieneDados).toBe(true);

      const detectarMagia = res.find((r) => r.rasgo.nombre === "Magia de alto elfo: Detectar magia");
      expect(detectarMagia).toBeDefined();
      expect(detectarMagia?.rasgo.tipoAccion).toBe("pasivo");
      expect(detectarMagia?.categoriasCombate).toContain("consumible");
      expect(detectarMagia?.esConsumible).toBe(true);
    });
  });

  describe("resolverHechizosObjetosMagicos - Objetos Mágicos en Combate (D&D 5.5e)", () => {
    it("incluye hechizos de un objeto maravilloso en la mochila (no equipado) si está sintonizado", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        inventario: [
          {
            idInstancia: "inv-pua-1",
            idObjeto: "o-pua-dragor",
            nombre: "Púa de la Escama Desertora",
            cantidad: 1,
            equipado: false,
            sintonizado: true,
            sintonizacionRequerida: true,
            contenedor: "mochila",
            categoria: "objetos-magicos",
            esConsumible: false,
            subcategoria: "Objeto Maravilloso",
            esMagico: true,
            rareza: "Poco Común",
            equipable: false,
            cargasMaximas: 4,
            cargasActuales: 4,
            hechizosVinculados: [
              {
                nombre: "Disfrazarse",
                costeCargas: 1,
                hechizoId: "h_disfrazarse",
                nivel: 1,
                tipoAccion: "accion"
              },
              {
                nombre: "Silencio",
                costeCargas: 2,
                hechizoId: "h_silencio",
                nivel: 2,
                tipoAccion: "accion"
              }
            ],
            pesoLb: 0,
            notas: ""
          }
        ]
      };

      const resultado = resolverHechizosObjetosMagicos(pj, []);
      expect(resultado).toHaveLength(2);
      expect(resultado[0].objetoNombre).toBe("Púa de la Escama Desertora");
      expect(resultado[0].hechizo.nombre).toBe("Disfrazarse");
      expect(resultado[0].cargasActuales).toBe(4);
      expect(resultado[0].tipoAccion).toBe("accion");
      expect(resultado[1].hechizo.nombre).toBe("Silencio");
    });

    it("excluye objetos que requieren sintonización pero no están sintonizados", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        inventario: [
          {
            idInstancia: "inv-pua-2",
            idObjeto: "o-pua-dragor",
            nombre: "Púa de la Escama Desertora",
            cantidad: 1,
            equipado: false,
            sintonizado: false, // NO sintonizado
            sintonizacionRequerida: true,
            contenedor: "mochila",
            categoria: "objetos-magicos",
            esConsumible: false,
            subcategoria: "Objeto Maravilloso",
            esMagico: true,
            rareza: "Poco Común",
            equipable: false,
            cargasMaximas: 4,
            cargasActuales: 4,
            hechizosVinculados: [
              {
                nombre: "Disfrazarse",
                costeCargas: 1,
                tipoAccion: "accion"
              }
            ],
            pesoLb: 0,
            notas: ""
          }
        ]
      };

      const resultado = resolverHechizosObjetosMagicos(pj, []);
      expect(resultado).toHaveLength(0);
    });

    it("excluye armas mágicas con hechizos vinculados si no están equipadas", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        inventario: [
          {
            idInstancia: "inv-espada-1",
            idObjeto: "o-espada-magica",
            nombre: "Espada de Llamas",
            cantidad: 1,
            equipado: false, // Arma NO equipada
            sintonizado: false,
            sintonizacionRequerida: false,
            contenedor: "mochila",
            categoria: "armas", // Requiere estar equipada
            esConsumible: false,
            subcategoria: "Arma Marcial",
            esMagico: true,
            rareza: "Raro",
            equipable: true,
            cargasMaximas: 3,
            cargasActuales: 3,
            hechizosVinculados: [
              {
                nombre: "Llama Sagrada",
                costeCargas: 1,
                tipoAccion: "accion"
              }
            ],
            pesoLb: 3,
            notas: ""
          }
        ]
      };

      const resultado = resolverHechizosObjetosMagicos(pj, []);
      expect(resultado).toHaveLength(0);
    });

    it("excluye objetos mágicos en contenedor almacen remoto", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        inventario: [
          {
            idInstancia: "inv-varita-almacen",
            idObjeto: "o-varita",
            nombre: "Varita en el Cofre del Campamento",
            cantidad: 1,
            equipado: false,
            sintonizado: true,
            sintonizacionRequerida: true,
            contenedor: "almacen", // Almacenamiento remoto
            categoria: "objetos-magicos",
            esConsumible: false,
            subcategoria: "Varita",
            esMagico: true,
            rareza: "Poco Común",
            equipable: false,
            cargasMaximas: 7,
            cargasActuales: 7,
            hechizosVinculados: [
              {
                nombre: "Proyectil Mágico",
                costeCargas: 1,
                tipoAccion: "accion"
              }
            ],
            pesoLb: 1,
            notas: ""
          }
        ]
      };

      const resultado = resolverHechizosObjetosMagicos(pj, []);
      expect(resultado).toHaveLength(0);
    });
  });
});

