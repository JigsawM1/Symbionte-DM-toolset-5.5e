import { describe, it, expect } from "vitest";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import { aplicarBuildClaseAPersonaje } from "@/servicios/gestorClases";
import {
  evaluarEfectosRasgosActivos,
  tieneConjuroGratuitoActivo,
  obtenerNombresConjurosGratuitosActivos,
  obtenerConjurosOtorgadosPorRasgos,
  obtenerVelocidadesEfectivas,
  calcularHpTemporalDeEfecto,
  obtenerConfiguracionPactoDelFilo,
  calcularBonoIniciativaRasgos,
  calcularBonoHPMaximoRasgos,
  evaluarAtaqueDesarmadoEspecial,
  obtenerCompetenciasExtraRasgos
} from "@/servicios/evaluadorEfectosRasgos";
import {
  resolverRasgosAcciones,
  resolverConjurosAcciones
} from "@/servicios/calculadorAccionesCombate";
import {
  CATALOGO_INVOCACIONES_SOBRENATURALES,
  obtenerNivelEspacioPacto
} from "@/constantes/invocacionesSobrenaturales";
import { prepararLanzamiento } from "@/servicios/servicioLanzamientoConjuros";
import { resolverBonosYDadosExtraCombate } from "@/servicios/calculadorDanoCombate";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import { calcularInfoTruco } from "@/utiles/utilesConjuros";
import { calcularAtaqueArmaEquipada } from "@/servicios/calculadorAtaquesArmas";
import { resolverOrigenConjuro } from "@/servicios/resolutorOrigenConjuros";
import type { PersonajeJugador, HechizoBase, ObjetoInventario, ObjetoJuego, Arma } from "@/tipos";

describe("D&D 5.5e - Mecánicas de Invocaciones Sobrenaturales del Brujo", () => {
  const hechizosMock: HechizoBase[] = [
    {
      id: "armadura_de_mago",
      nombre: "Armadura de mago",
      nivel: 1,
      escuela: "Abjuración",
      tiempoLanzamiento: "1 acción",
      alcance: "Toque",
      componentesSeleccionados: { verbal: true, somatico: true, material: true },
      materiales: "Un trozo de cuero",
      duracion: "8 horas",
      descripcion: "Tu CA base se convierte en 13 + Modificador de Destreza."
    },
    {
      id: "respirar_bajo_el_agua",
      nombre: "Respirar bajo el agua",
      nivel: 3,
      escuela: "Transmutación",
      tiempoLanzamiento: "1 acción",
      alcance: "30 pies",
      componentesSeleccionados: { verbal: true, somatico: true, material: true },
      materiales: "Una pajita",
      duracion: "24 horas",
      descripcion: "Permite respirar bajo el agua a hasta diez criaturas voluntarias."
    },
    {
      id: "descarga_sobrenatural",
      nombre: "Descarga sobrenatural",
      nivel: 0,
      escuela: "Evocación",
      tiempoLanzamiento: "1 acción",
      alcance: "120 pies",
      dadosDaño: "1d10",
      tipoDaño: "Fuerza",
      componentesSeleccionados: { verbal: true, somatico: true, material: false },
      duracion: "Instantánea",
      requiereAtaque: true,
      ataqueCd: "ATAQUE",
      descripcion: "Haz un ataque de conjuro a distancia."
    },
    {
      id: "rayo_de_escarcha",
      nombre: "Rayo de escarcha",
      nivel: 0,
      escuela: "Evocación",
      tiempoLanzamiento: "1 acción",
      alcance: "60 pies",
      dadosDaño: "1d8",
      tipoDaño: "Frío",
      componentesSeleccionados: { verbal: true, somatico: true, material: false },
      duracion: "Instantánea",
      requiereAtaque: true,
      ataqueCd: "ATAQUE",
      descripcion: "Un rayo gélido de luz azul."
    },
    {
      id: "toque_helado",
      nombre: "Toque helado",
      nivel: 0,
      escuela: "Nigromancia",
      tiempoLanzamiento: "1 acción",
      alcance: "Toque",
      dadosDaño: "1d10",
      tipoDaño: "Necrótico",
      componentesSeleccionados: { verbal: true, somatico: true, material: false },
      duracion: "1 asalto",
      requiereAtaque: true,
      ataqueCd: "ATAQUE",
      descripcion: "Ataque cuerpo a cuerpo de conjuro."
    }
  ];

  function crearBrujoConInvocaciones(nivel: number, invocacionesSeleccionadas: string[]): PersonajeJugador {
    const pjBase: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      id: `pj-brujo-test-${nivel}`,
      nombre: "Warlock Tester",
      clase: "Brujo",
      nivel,
      velocidad: { caminar: 30, planea: false },
      espaciosPactoMaximos: 2,
      espaciosPactoGastados: 0,
      nivelEspacioPacto: nivel >= 9 ? 5 : nivel >= 7 ? 4 : nivel >= 5 ? 3 : nivel >= 3 ? 2 : 1
    };

    const pjConstruido = aplicarBuildClaseAPersonaje(pjBase, "Brujo", nivel);

    // Configurar la selección de invocaciones en el rasgo
    const rasgosActualizados = (pjConstruido.rasgos || []).map((r) => {
      if (r.selectores) {
        const selectoresActualizados = r.selectores.map((sel) => {
          if (sel.id.includes("invocacion")) {
            return {
              ...sel,
              valorActual: invocacionesSeleccionadas
            };
          }
          return sel;
        });
        return { ...r, selectores: selectoresActualizados };
      }
      return r;
    });

    return {
      ...pjConstruido,
      trucosConocidosIds: ["descarga_sobrenatural", "rayo_de_escarcha", "toque_helado"],
      rasgos: rasgosActualizados
    };
  }

  describe("1. ARMADURA DE SOMBRAS", () => {
    it("permite el lanzamiento gratuito sobre sí mismo (modo gratuitoInnato) y normal con ranura de pacto (modo espacio)", () => {
      const pj = crearBrujoConInvocaciones(2, ["armadura_de_sombras"]);

      const nombresGratis = obtenerNombresConjurosGratuitosActivos(pj);
      expect(nombresGratis).toContain("Armadura de mago");

      const esGratis = tieneConjuroGratuitoActivo(pj, "Armadura de mago");
      expect(esGratis).toBe(true);

      const otorgados = obtenerConjurosOtorgadosPorRasgos(pj);
      expect(otorgados).toContain("Armadura de mago");

      const conjurosAcciones = resolverConjurosAcciones(pj, hechizosMock);
      const tieneArmaduraMago = conjurosAcciones.some((ca) => ca.hechizo.nombre === "Armadura de mago");
      expect(tieneArmaduraMago).toBe(true);

      const hechizoArmadura = hechizosMock.find((h) => h.id === "armadura_de_mago")!;

      // 1. Lanzamiento gratuito (botón 'Gratis') sobre sí mismo: no consume ranura
      const prepGratis = prepararLanzamiento(
        { modo: "gratuitoInnato", hechizo: hechizoArmadura, nivelLanzamiento: 1 },
        { esLanzadorPacto: true, nivelEspacioPacto: 1, espaciosPactoMaximos: 2, espaciosPactoGastados: 0 }
      );
      expect(prepGratis.gasto.tipo).toBe("gratuitoInnato");

      // 2. Lanzamiento normal (botón 'Lanzar') sobre otra criatura: gasta ranura de pacto
      const prepNormal = prepararLanzamiento(
        { modo: "espacio", hechizo: hechizoArmadura, nivelLanzamiento: 1 },
        { esLanzadorPacto: true, nivelEspacioPacto: 1, espaciosPactoMaximos: 2, espaciosPactoGastados: 0 }
      );
      expect(prepNormal.gasto.tipo).toBe("pacto");
    });
  });

  describe("2. CASTIGO ARCANO", () => {
    it("se sintetiza como acción de combate consumible que gasta espacio de pacto", () => {
      const pj = crearBrujoConInvocaciones(5, ["castigo_arcano"]);

      const acciones = resolverRasgosAcciones(pj);
      const castigo = acciones.find((a) => a.rasgo.nombre.toLowerCase().includes("castigo arcano"));

      expect(castigo).toBeDefined();
      expect(castigo?.esConsumible).toBe(true);
      expect(castigo?.tieneDados).toBe(true);
      expect(castigo?.usosMaximos).toBe(2);
      expect(castigo?.usosRestantes).toBe(2);
      expect(castigo?.rasgo.formulaDados).toBe("4d8");
    });

    it("escala la fórmula de dados según el nivel de pacto del brujo (4d8 en nv 5-6, 5d8 en nv 7-8, 6d8 en nv 9+)", () => {
      const pjNv5 = crearBrujoConInvocaciones(5, ["castigo_arcano"]);
      const accionesNv5 = resolverRasgosAcciones(pjNv5);
      const castigoNv5 = accionesNv5.find((a) => a.rasgo.nombre.toLowerCase().includes("castigo arcano"));
      expect(castigoNv5?.rasgo.formulaDados).toBe("4d8");

      const pjNv7 = crearBrujoConInvocaciones(7, ["castigo_arcano"]);
      const accionesNv7 = resolverRasgosAcciones(pjNv7);
      const castigoNv7 = accionesNv7.find((a) => a.rasgo.nombre.toLowerCase().includes("castigo arcano"));
      expect(castigoNv7?.rasgo.formulaDados).toBe("5d8");

      const pjNv9 = crearBrujoConInvocaciones(9, ["castigo_arcano"]);
      const accionesNv9 = resolverRasgosAcciones(pjNv9);
      const castigoNv9 = accionesNv9.find((a) => a.rasgo.nombre.toLowerCase().includes("castigo arcano"));
      expect(castigoNv9?.rasgo.formulaDados).toBe("6d8");
    });

    it("refleja fielmente los espacios de pacto gastados en sus usos disponibles", () => {
      const pj = crearBrujoConInvocaciones(5, ["castigo_arcano"]);
      pj.espaciosPactoGastados = 1;

      const acciones = resolverRasgosAcciones(pj);
      const castigo = acciones.find((a) => a.rasgo.nombre.toLowerCase().includes("castigo arcano"));

      expect(castigo?.usosRestantes).toBe(1);
      expect(castigo?.usosMaximos).toBe(2);
    });

    it("no añade dados extra pasivos al ataque base de arma", () => {
      const pj = crearBrujoConInvocaciones(5, ["castigo_arcano"]);
      const bonos = resolverBonosYDadosExtraCombate({
        personajeActivo: pj,
        statsCalculadas: calcularEstadisticasPersonaje(pj),
        contextoAtaque: { tipo: "arma", caracteristica: "fuerza", esCuerpoACuerpo: true, esDistancia: false },
        caracUsada: "fuerza",
        modAtributo: 3,
        bonoMagico: 0,
        furiaEstaActiva: false,
        yaIncluyeFuriaEnEfectos: false
      });

      expect(bonos.dadosExtra).not.toContain("4d8");
    });
  });

  describe("3. DESCARGA AHUYENTADORA", () => {
    it("está marcada como repetible en el catálogo oficial", () => {
      const def = CATALOGO_INVOCACIONES_SOBRENATURALES.find((i) => i.id === "descarga_ahuyentadora");
      expect(def).toBeDefined();
      expect(def?.repetible).toBe(true);
      expect(def?.categoriaMecanica).toBe("selector_informativo");
    });

    it("permite registrar repeticiones con trucos específicos consumiendo ranuras de invocación", () => {
      const pj = crearBrujoConInvocaciones(5, [
        "descarga_ahuyentadora:descarga_sobrenatural",
        "descarga_ahuyentadora__2:toque_helado"
      ]);

      const rasgoInvocaciones = pj.rasgos?.find((r) => r.selectores?.some((s) => s.id.includes("invocacion")));
      const selector = rasgoInvocaciones?.selectores?.find((s) => s.id.includes("invocacion"));

      expect(selector?.valorActual?.length).toBe(2);
      expect(selector?.valorActual).toContain("descarga_ahuyentadora:descarga_sobrenatural");
      expect(selector?.valorActual).toContain("descarga_ahuyentadora__2:toque_helado");
    });
  });

  describe("4. DEVORADOR DE VIDA", () => {
    it("aplica daño secundario de 1d6 necrótico por defecto y lo incluye en tiposDanoSecundarios", () => {
      const pj = crearBrujoConInvocaciones(9, ["devorador_de_vida"]);
      const efectos = evaluarEfectosRasgosActivos(pj);

      const efectoDano = efectos.find((e) => e.tipo === "dano_secundario" && e.valor === "1d6");
      expect(efectoDano).toBeDefined();
      expect(efectoDano?.tipoDano).toBe("Necrótico");

      const bonos = resolverBonosYDadosExtraCombate({
        personajeActivo: pj,
        statsCalculadas: calcularEstadisticasPersonaje(pj),
        contextoAtaque: { tipo: "arma", caracteristica: "fuerza", esCuerpoACuerpo: true, esDistancia: false },
        caracUsada: "fuerza",
        modAtributo: 3,
        bonoMagico: 0,
        furiaEstaActiva: false,
        yaIncluyeFuriaEnEfectos: false
      });

      expect(bonos.danosSecundarios).toContain("1d6");
      expect(bonos.tiposDanoSecundarios).toContain("Necrótico");
    });

    it("permite seleccionar daño psíquico mediante sufijo de selección y lo refleja en tiposDanoSecundarios", () => {
      const pj = crearBrujoConInvocaciones(9, ["devorador_de_vida:psiquico"]);
      const efectos = evaluarEfectosRasgosActivos(pj);

      const efectoDano = efectos.find((e) => e.tipo === "dano_secundario" && e.valor === "1d6");
      expect(efectoDano).toBeDefined();
      expect(efectoDano?.tipoDano).toBe("Psíquico");

      const bonos = resolverBonosYDadosExtraCombate({
        personajeActivo: pj,
        statsCalculadas: calcularEstadisticasPersonaje(pj),
        contextoAtaque: { tipo: "arma", caracteristica: "fuerza", esCuerpoACuerpo: true, esDistancia: false },
        caracUsada: "fuerza",
        modAtributo: 3,
        bonoMagico: 0,
        furiaEstaActiva: false,
        yaIncluyeFuriaEnEfectos: false
      });

      expect(bonos.tiposDanoSecundarios).toContain("Psíquico");
    });

    it("permite seleccionar daño radiante mediante sufijo de selección y lo refleja en tiposDanoSecundarios", () => {
      const pj = crearBrujoConInvocaciones(9, ["devorador_de_vida:radiante"]);
      const efectos = evaluarEfectosRasgosActivos(pj);

      const efectoDano = efectos.find((e) => e.tipo === "dano_secundario" && e.valor === "1d6");
      expect(efectoDano).toBeDefined();
      expect(efectoDano?.tipoDano).toBe("Radiante");

      const bonos = resolverBonosYDadosExtraCombate({
        personajeActivo: pj,
        statsCalculadas: calcularEstadisticasPersonaje(pj),
        contextoAtaque: { tipo: "arma", caracteristica: "fuerza", esCuerpoACuerpo: true, esDistancia: false },
        caracUsada: "fuerza",
        modAtributo: 3,
        bonoMagico: 0,
        furiaEstaActiva: false,
        yaIncluyeFuriaEnEfectos: false
      });

      expect(bonos.tiposDanoSecundarios).toContain("Radiante");
    });
  });

  describe("5. DON DE LAS PROFUNDIDADES", () => {
    it("otorga velocidad de nado igual a la velocidad de caminar y conjuro gratuito respirar bajo el agua", () => {
      const pj = crearBrujoConInvocaciones(5, ["don_de_las_profundidades"]);

      const velocidades = obtenerVelocidadesEfectivas(pj);
      expect(velocidades.nadar).toBe(30);
      expect(velocidades.nadar).toBe(velocidades.caminar);

      const esGratis = tieneConjuroGratuitoActivo(pj, "Respirar bajo el agua");
      expect(esGratis).toBe(true);

      const conjurosOtorgados = obtenerConjurosOtorgadosPorRasgos(pj);
      expect(conjurosOtorgados).toContain("Respirar bajo el agua");
    });
  });

  describe("6. DESCARGA AGÓNICA", () => {
    it("activa agregarModificadorHabilidad en el truco seleccionado y suma Carisma a cada proyectil", () => {
      const pj = crearBrujoConInvocaciones(2, ["descarga_agonica:descarga_sobrenatural"]);

      const conjurosAcciones = resolverConjurosAcciones(pj, hechizosMock);
      const descarga = conjurosAcciones.find((c) => c.hechizo.id === "descarga_sobrenatural");
      expect(descarga).toBeDefined();
      expect(descarga?.hechizo.agregarModificadorHabilidad).toBe(true);

      // Con modificador de Carisma +4 y nivel 2 (1 rayo de 1d10+4)
      const info1 = calcularInfoTruco(descarga!.hechizo, 2, 0, 4);
      expect(info1.etiquetaVisual).toBe("1d10+4");

      // A nivel 5 (2 rayos de 1d10+4 c/u según PHB 2024)
      const info5 = calcularInfoTruco(descarga!.hechizo, 5, 0, 4);
      expect(info5.esAtaqueMultiple).toBe(true);
      expect(info5.cantidadAtaques).toBe(2);
      expect(info5.etiquetaVisual).toContain("2 rayos (1d10+4 c/u)");
    });

    it("soporta múltiples trucos vinculados mediante selección repetible", () => {
      const pj = crearBrujoConInvocaciones(5, [
        "descarga_agonica:descarga_sobrenatural",
        "descarga_agonica__timestamp:rayo_de_escarcha"
      ]);

      const conjurosAcciones = resolverConjurosAcciones(pj, hechizosMock);
      const descarga = conjurosAcciones.find((c) => c.hechizo.id === "descarga_sobrenatural");
      const rayo = conjurosAcciones.find((c) => c.hechizo.id === "rayo_de_escarcha");

      expect(descarga?.hechizo.agregarModificadorHabilidad).toBe(true);
      expect(rayo?.hechizo.agregarModificadorHabilidad).toBe(true);

      // Truco no seleccionado no recibe el modificador
      const toque = conjurosAcciones.find((c) => c.hechizo.id === "toque_helado");
      expect(toque?.hechizo.agregarModificadorHabilidad).toBeUndefined();
    });
  });

  describe("7. DON DE LOS PROTECTORES", () => {
    it("se sintetiza en acciones de combate como reacción consumible con 1 uso por descanso largo", () => {
      const pj = crearBrujoConInvocaciones(9, ["don_de_los_protectores"]);

      const acciones = resolverRasgosAcciones(pj);
      const protector = acciones.find((a) => a.rasgo.nombre.toLowerCase().includes("don de los protectores"));

      expect(protector).toBeDefined();
      expect(protector?.esConsumible).toBe(true);
      expect(protector?.tipoAccionCalculado).toBe("reaccion");
      expect(protector?.usosMaximos).toBe(1);
      expect(protector?.usosRestantes).toBe(1);
      expect(protector?.rasgo.recuperacion).toBe("descanso_largo");
    });
  });

  describe("8. INVOCACIONES INFORMATIVAS (FILO SEDIENTO, HOJA DEVORADORA, INVERSIÓN DEL AMO)", () => {
    it("mantienen categoriaMecanica pasivo_permanente y no saturan las tiradas con dados espurios", () => {
      const invocacionFilo = CATALOGO_INVOCACIONES_SOBRENATURALES.find((i) => i.id === "filo_sediento");
      const invocacionHoja = CATALOGO_INVOCACIONES_SOBRENATURALES.find((i) => i.id === "hoja_devoradora");
      const invocacionAmo = CATALOGO_INVOCACIONES_SOBRENATURALES.find((i) => i.id === "inversion_del_amo_de_las_cadenas");

      expect(invocacionFilo?.categoriaMecanica).toBe("pasivo_permanente");
      expect(invocacionHoja?.categoriaMecanica).toBe("pasivo_permanente");
      expect(invocacionAmo?.categoriaMecanica).toBe("pasivo_permanente");

      expect(invocacionFilo?.tipoAccion).toBe("pasivo");
      expect(invocacionHoja?.tipoAccion).toBe("pasivo");
      expect(invocacionAmo?.tipoAccion).toBe("accion_adicional");
    });
  });

  describe("9. LANZA SOBRENATURAL", () => {
    it("aumenta el alcance del truco seleccionado en (nivelBrujo * 10) pies si su alcance es >= 10 pies", () => {
      // Brujo nivel 5 con Descarga sobrenatural (120 pies base) -> 120 + 50 = 170 pies
      const pjNivel5 = crearBrujoConInvocaciones(5, ["lanza_sobrenatural:descarga_sobrenatural"]);
      const conjurosNivel5 = resolverConjurosAcciones(pjNivel5, hechizosMock);
      const descarga5 = conjurosNivel5.find((c) => c.hechizo.id === "descarga_sobrenatural");
      expect(descarga5?.hechizo.alcance).toBe("170 pies");

      // Brujo nivel 2 con Rayo de escarcha (60 pies base) -> 60 + 20 = 80 pies
      const pjNivel2 = crearBrujoConInvocaciones(2, ["lanza_sobrenatural:rayo_de_escarcha"]);
      const conjurosNivel2 = resolverConjurosAcciones(pjNivel2, hechizosMock);
      const rayo2 = conjurosNivel2.find((c) => c.hechizo.id === "rayo_de_escarcha");
      expect(rayo2?.hechizo.alcance).toBe("80 pies");
    });

    it("no modifica el alcance de trucos de Toque o menores a 10 pies", () => {
      const pj = crearBrujoConInvocaciones(5, ["lanza_sobrenatural:toque_helado"]);
      const conjuros = resolverConjurosAcciones(pj, hechizosMock);
      const toque = conjuros.find((c) => c.hechizo.id === "toque_helado");
      expect(toque?.hechizo.alcance).toBe("Toque");
    });
  });

  describe("10. LECCIONES DE LOS PRIMEROS", () => {
    it("admite registrar dotes de origen canónicas en las selecciones de la ficha de manera repetible", () => {
      const pj = crearBrujoConInvocaciones(2, [
        "lecciones_de_los_primeros:dote_alerta",
        "lecciones_de_los_primeros__timestamp:dote_fabricante"
      ]);

      const rasgoInvocacion = pj.rasgos?.find((r) => r.selectores?.some((s) => s.id.includes("invocacion")));
      const selector = rasgoInvocacion?.selectores?.find((s) => s.id.includes("invocacion"));

      expect(selector?.valorActual).toContain("lecciones_de_los_primeros:dote_alerta");
      expect(selector?.valorActual).toContain("lecciones_de_los_primeros__timestamp:dote_fabricante");
    });

    it("aplica reactivamente el bono a iniciativa de Alerta (+PB) al brujo", () => {
      // Nivel 2: PB = +2
      const pjNivel2 = crearBrujoConInvocaciones(2, ["lecciones_de_los_primeros:dote_alerta"]);
      expect(calcularBonoIniciativaRasgos(pjNivel2)).toBe(2);

      // Nivel 5: PB = +3
      const pjNivel5 = crearBrujoConInvocaciones(5, ["lecciones_de_los_primeros:dote_alerta"]);
      expect(calcularBonoIniciativaRasgos(pjNivel5)).toBe(3);
    });

    it("aplica reactivamente el bono de vida de Duro (+2 HP por nivel) al brujo", () => {
      const pjNivel4 = crearBrujoConInvocaciones(4, ["lecciones_de_los_primeros:dote_duro"]);
      expect(calcularBonoHPMaximoRasgos(pjNivel4)).toBe(8);
    });

    it("aplica las mecánicas de Matón de Taberna (ataque desarmado 1d4 y armas improvisadas)", () => {
      const pj = crearBrujoConInvocaciones(2, ["lecciones_de_los_primeros:dote_maton_taberna"]);
      const desarmado = evaluarAtaqueDesarmadoEspecial(pj);
      expect(desarmado.aplica).toBe(true);
      expect(desarmado.dadoDanoBase).toBe("1d4");
      expect(desarmado.caracteristicaSugerida).toBe("fuerza");

      const comp = obtenerCompetenciasExtraRasgos(pj);
      expect(comp.armasImprovisadas).toBe(true);
    });

    it("mantiene compatibilidad con selecciones legadas (ej. 'alert', 'crafter')", () => {
      const pjLegacy = crearBrujoConInvocaciones(2, ["lecciones_de_los_primeros:alert"]);
      expect(calcularBonoIniciativaRasgos(pjLegacy)).toBe(2);
    });
  });

  describe("11. PACTO DEL FILO", () => {
    const espadaLargaCompendio: Arma = {
      id: "espada_larga",
      nombre: "Espada larga",
      descripcion: "Espada larga marcial",
      categoria: "armas",
      subcategoria: "Marcial",
      tipoAtaque: "Cuerpo a Cuerpo",
      dadoDano: "1d8",
      tipoDano: "Cortante",
      danoVersatil: "1d10",
      propiedades: ["Versátil"],
      valorPO: 15,
      pesoLb: 3,
      rareza: "Común",
      esMagico: false,
      esConsumible: false,
      equipable: true
    };

    const baseDatosMock: ObjetoJuego[] = [espadaLargaCompendio];

    const armaInstancia: ObjetoInventario = {
      idInstancia: "inst-espada-1",
      idObjeto: "espada_larga",
      nombre: "Espada larga",
      cantidad: 1,
      equipado: true,
      sintonizado: false,
      notas: "",
      pesoLb: 3,
      categoria: "armas",
      esConsumible: false,
      subcategoria: "Marcial",
      esMagico: false,
      rareza: "Común",
      equipable: true,
      sintonizacionRequerida: false
    };

    it("usa Carisma para ataque y daño en vez de Fuerza cuando Carisma es superior", () => {
      // Brujo nivel 3 con Carisma 16 (+3) y Fuerza 10 (+0)
      const pj = crearBrujoConInvocaciones(3, ["pacto_del_filo:propio"]);
      pj.caracteristicas = {
        ...pj.caracteristicas,
        fuerza: 10,
        destreza: 12,
        carisma: 16
      };

      expect(obtenerConfiguracionPactoDelFilo(pj)).toEqual({ activo: true, tipoDano: "propio" });

      const stats = calcularEstadisticasPersonaje(pj);
      const ataque = calcularAtaqueArmaEquipada(armaInstancia, {
        personajeActivo: pj,
        statsCalculadas: stats,
        baseDatosObjetos: baseDatosMock,
        caracteristicasArmas: {},
        gruposArmasConsolidados: [],
        furiaEstaActiva: false,
        yaIncluyeFuriaEnEfectos: false
      });

      expect(ataque.caracteristicaUsada).toBe("carisma");
      // Modificador de carisma es +3, bono de competencia es +2 -> bonoAtaque = +5
      expect(ataque.bonoAtaque).toBe(5);
      expect(ataque.esCompetenteConArma).toBe(true);
      expect(ataque.tipoDano).toBe("Cortante");
    });

    it("sustituye el tipo de daño según el selector: propio, necrótico, psíquico o radiante", () => {
      const stats = calcularEstadisticasPersonaje(crearBrujoConInvocaciones(3, ["pacto_del_filo"]));

      // Necrótico
      const pjNecrotico = crearBrujoConInvocaciones(3, ["pacto_del_filo:necrotico"]);
      expect(obtenerConfiguracionPactoDelFilo(pjNecrotico)).toEqual({ activo: true, tipoDano: "necrotico" });
      const atqNec = calcularAtaqueArmaEquipada(armaInstancia, {
        personajeActivo: pjNecrotico,
        statsCalculadas: stats,
        baseDatosObjetos: baseDatosMock,
        caracteristicasArmas: {},
        gruposArmasConsolidados: [],
        furiaEstaActiva: false,
        yaIncluyeFuriaEnEfectos: false
      });
      expect(atqNec.tipoDano).toBe("Necrótico");

      // Psíquico
      const pjPsiquico = crearBrujoConInvocaciones(3, ["pacto_del_filo:psiquico"]);
      const atqPsi = calcularAtaqueArmaEquipada(armaInstancia, {
        personajeActivo: pjPsiquico,
        statsCalculadas: stats,
        baseDatosObjetos: baseDatosMock,
        caracteristicasArmas: {},
        gruposArmasConsolidados: [],
        furiaEstaActiva: false,
        yaIncluyeFuriaEnEfectos: false
      });
      expect(atqPsi.tipoDano).toBe("Psíquico");

      // Radiante
      const pjRadiante = crearBrujoConInvocaciones(3, ["pacto_del_filo:radiante"]);
      const atqRad = calcularAtaqueArmaEquipada(armaInstancia, {
        personajeActivo: pjRadiante,
        statsCalculadas: stats,
        baseDatosObjetos: baseDatosMock,
        caracteristicasArmas: {},
        gruposArmasConsolidados: [],
        furiaEstaActiva: false,
        yaIncluyeFuriaEnEfectos: false
      });
      expect(atqRad.tipoDano).toBe("Radiante");
    });
  });

  describe("12. VIGOR INFERNAL", () => {
    it("evalúa la fórmula de PG temporales 12 + 5 * (nivel_espacio_pacto - 1) escalando por nivel", () => {
      const efectoHp = CATALOGO_INVOCACIONES_SOBRENATURALES.find((i) => i.id === "vigor_infernal")?.efectos?.find(
        (e) => e.tipo === "hp_temporal"
      );
      expect(efectoHp).toBeDefined();

      // Nivel 1 (Espacio pacto Nv 1) -> 12 + 5*0 = 12
      const pjNv1 = crearBrujoConInvocaciones(1, ["vigor_infernal"]);
      expect(calcularHpTemporalDeEfecto(efectoHp, pjNv1)).toBe(12);

      // Nivel 3 (Espacio pacto Nv 2) -> 12 + 5*1 = 17
      const pjNv3 = crearBrujoConInvocaciones(3, ["vigor_infernal"]);
      expect(calcularHpTemporalDeEfecto(efectoHp, pjNv3)).toBe(17);

      // Nivel 5 (Espacio pacto Nv 3) -> 12 + 5*2 = 22
      const pjNv5 = crearBrujoConInvocaciones(5, ["vigor_infernal"]);
      expect(calcularHpTemporalDeEfecto(efectoHp, pjNv5)).toBe(22);

      // Nivel 7 (Espacio pacto Nv 4) -> 12 + 5*3 = 27
      const pjNv7 = crearBrujoConInvocaciones(7, ["vigor_infernal"]);
      expect(calcularHpTemporalDeEfecto(efectoHp, pjNv7)).toBe(27);

      // Nivel 9 (Espacio pacto Nv 5) -> 12 + 5*4 = 32
      const pjNv9 = crearBrujoConInvocaciones(9, ["vigor_infernal"]);
      expect(calcularHpTemporalDeEfecto(efectoHp, pjNv9)).toBe(32);
    });

    it("obtenerNivelEspacioPacto escala correctamente de nivel 1 a 20", () => {
      expect(obtenerNivelEspacioPacto(1)).toBe(1);
      expect(obtenerNivelEspacioPacto(2)).toBe(1);
      expect(obtenerNivelEspacioPacto(3)).toBe(2);
      expect(obtenerNivelEspacioPacto(5)).toBe(3);
      expect(obtenerNivelEspacioPacto(7)).toBe(4);
      expect(obtenerNivelEspacioPacto(9)).toBe(5);
      expect(obtenerNivelEspacioPacto(20)).toBe(5);
    });
  });

  describe("13. CONJUROS GRATUITOS A VOLUNTAD (LOTE 3)", () => {
    it("habilita el lanzamiento a voluntad gratuito para las invocaciones del lote 3", () => {
      const invocacionesConjuros = [
        { idInvocacion: "maestro_de_las_formas_innumerables", nombreConjuro: "Alterar el propio aspecto" },
        { idInvocacion: "mascara_de_los_mil_rostros", nombreConjuro: "Disfrazarse" },
        { idInvocacion: "pacto_de_la_cadena", nombreConjuro: "Encontrar familiar" },
        { idInvocacion: "paso_ascendente", nombreConjuro: "Levitar" },
        { idInvocacion: "salto_sobrenatural", nombreConjuro: "Salto" },
        { idInvocacion: "susurros_del_sepulcro", nombreConjuro: "Hablar con los muertos" },
        { idInvocacion: "uno_con_las_sombras", nombreConjuro: "Invisibilidad" },
        { idInvocacion: "visiones_brumosas", nombreConjuro: "Imagen silenciosa" },
        { idInvocacion: "visiones_de_reinos_remotos", nombreConjuro: "Ojo arcano" }
      ];

      for (const item of invocacionesConjuros) {
        const pj = crearBrujoConInvocaciones(9, [item.idInvocacion]);
        expect(tieneConjuroGratuitoActivo(pj, item.nombreConjuro)).toBe(true);

        const dummyHechizo: HechizoBase = {
          id: item.nombreConjuro.toLowerCase().replace(/\s+/g, "_"),
          nombre: item.nombreConjuro,
          nivel: 1,
          escuela: "Transmutación",
          tiempoLanzamiento: "1 acción",
          alcance: "Propio",
          componentesSeleccionados: { verbal: true, somatico: true, material: false },
          duracion: "1 hora",
          descripcion: "Descripción de prueba"
        };
        expect(resolverOrigenConjuro(pj, dummyHechizo)).toBe("clase");
      }
    });
  });

  describe("14. INVOCACIONES INFORMATIVAS (LOTE 3)", () => {
    it("configura mente_sobrenatural, mirada_de_las_dos_mentes, pacto_del_grimorio, vision_bruja y vista_del_diablo como pasivo_permanente", () => {
      const ids = [
        "mente_sobrenatural",
        "mirada_de_las_dos_mentes",
        "pacto_del_grimorio",
        "vision_bruja",
        "vista_del_diablo"
      ];

      for (const id of ids) {
        const inv = CATALOGO_INVOCACIONES_SOBRENATURALES.find((i) => i.id === id);
        expect(inv).toBeDefined();
        expect(inv?.categoriaMecanica).toBe("pasivo_permanente");
      }
    });
  });
});
