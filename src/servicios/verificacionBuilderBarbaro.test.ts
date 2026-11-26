import { describe, it, expect } from "vitest";
import { construirBuildClase, aplicarBuildClaseAPersonaje } from "./clases/buildClase";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { evaluarEfectosRasgosActivos } from "./rasgos/evaluadorExpresionesRasgos";
import { calcularDefensaSinArmaduraRasgos, evaluarVentajasDeRasgosEnTirada } from "./evaluadorEfectosRasgos";
import { obtenerResumenDefensasRasgos } from "./rasgos/resumenDefensasRasgos";
import { calcularVelocidadPersonaje, obtenerSentidosEfectivos } from "./rasgos/evaluadorMovilidadRasgos";
import { prepararDanoIntegrado, prepararResolucionAsistida } from "./rasgos/resolucionAsistidaRasgos";
import { calcularEstadisticasPersonaje } from "@/servicios/personajes/calculadorEstadisticasPersonaje";
import type { EfectoMecanicoRasgo } from "@/tipos/rasgos";
import { EsquemaCamposConstructor } from "./rasgos/camposConstructor";
import catalogo from "@/datos/clases/barbaro.json";

interface RasgoCatalogoRaw {
  nombre: string;
  efectos?: EfectoMecanicoRasgo[];
}

interface SubclaseCatalogoRaw {
  nombre: string;
  rasgos?: RasgoCatalogoRaw[];
}

interface CatalogoBarbaroRaw {
  rasgos: RasgoCatalogoRaw[];
  subclases?: SubclaseCatalogoRaw[];
}

interface EfectoEsperado {
  origen: "clase" | "subclase";
  subclase?: string;
  rasgo: string;
  tipo: string;
  objetivo: string;
}

const catalogoTipado = catalogo as unknown as CatalogoBarbaroRaw;
const efectosCatalogo: EfectoEsperado[] = [];

for (const r of catalogoTipado.rasgos) {
  if (r.efectos && r.efectos.length > 0) {
    for (const ef of r.efectos) {
      efectosCatalogo.push({
        origen: "clase",
        rasgo: r.nombre,
        tipo: ef.tipo,
        objetivo: ef.objetivo
      });
    }
  }
}

for (const sub of (catalogoTipado.subclases || [])) {
  for (const r of (sub.rasgos || [])) {
    if (r.efectos && r.efectos.length > 0) {
      for (const ef of r.efectos) {
        efectosCatalogo.push({
          origen: "subclase",
          subclase: sub.nombre,
          rasgo: r.nombre,
          tipo: ef.tipo,
          objetivo: ef.objetivo
        });
      }
    }
  }
}

describe("Verificación exhaustiva del Bárbaro y consumo de efectos en el Builder", () => {
  it("contabiliza exactamente 21 efectos declarados y consolidados en barbaro.json", () => {
    expect(efectosCatalogo).toHaveLength(21);
  });

  const subclases = [
    "Senda del Berserker",
    "Senda del Corazón Salvaje",
    "Senda del Árbol del Mundo",
    "Senda del Fanático"
  ];

  it.each(subclases)("construye y consume todos los efectos para %s", (subNombre) => {
    const build = construirBuildClase("Bárbaro", 20, subNombre);
    expect(build).not.toBeNull();
    if (!build) return;

    expect(build.nivel).toBe(20);
    expect(build.clase.nombre).toBe("Bárbaro");
    expect(build.subclase?.nombre).toBe(subNombre);

    // Todos los efectos de la clase base y de esta subclase
    const esperados = efectosCatalogo.filter((e) => e.origen === "clase" || e.subclase === subNombre);

    // Todos los efectos en los rasgos generados por el builder
    const todosEfectos = build.rasgos.flatMap((r) => r.efectos || []);

    for (const exp of esperados) {
      const existe = todosEfectos.some((ef) => ef.tipo === exp.tipo && ef.objetivo === exp.objetivo);
      expect(existe, `El efecto [${exp.tipo}] obj="${exp.objetivo}" del rasgo "${exp.rasgo}" debe estar presente en build.rasgos`).toBe(true);
    }

    // Efectos activos resueltos
    expect(build.efectosActivosResueltos).toBeDefined();
    expect(build.efectosActivosResueltos!.length).toBeGreaterThan(0);

    // Aplicar a un personaje completo
    const pj = aplicarBuildClaseAPersonaje(PERSONAJE_POR_DEFECTO, "Bárbaro", 20, subNombre);
    expect(pj.clase).toBe("Bárbaro");
    expect(pj.nivel).toBe(20);
    expect(pj.subclase).toBe(subNombre);

    const efectosPj = pj.rasgos.flatMap((r) => r.efectos || []);
    for (const exp of esperados) {
      const existeEnPj = efectosPj.some((ef) => ef.tipo === exp.tipo && ef.objetivo === exp.objetivo);
      expect(existeEnPj, `El efecto [${exp.tipo}] obj="${exp.objetivo}" debe estar en pj.rasgos`).toBe(true);
    }
  });

  it("verifica el consumo de los 15 tipos de efectos en los evaluadores del motor", () => {
    // 1. Bono daño fuerza y resistencias con Furia
    const pjBase = aplicarBuildClaseAPersonaje(
      {
        ...PERSONAJE_POR_DEFECTO,
        caracteristicas: { fuerza: 20, destreza: 14, constitucion: 16, inteligencia: 10, sabiduria: 12, carisma: 10 }
      },
      "Bárbaro",
      20,
      "Senda del Berserker"
    );

    const pjFuria = {
      ...pjBase,
      rasgos: pjBase.rasgos.map((r) => (r.nombre === "Furia" ? { ...r, activo: true } : r))
    };

    const efectosActivos = evaluarEfectosRasgosActivos(pjFuria);

    // bono_dano_fuerza
    const bonoFuria = efectosActivos.find((e) => e.tipo === "bono_dano_fuerza");
    expect(bonoFuria).toBeDefined();
    expect(bonoFuria?.valor).toBe(4); // a nivel 20 escala a 4

    // resistencia_dano
    const resumenDef = obtenerResumenDefensasRasgos(pjFuria);
    expect(resumenDef.resistencias).toEqual(expect.arrayContaining(["Contundente", "Cortante", "Perforante"]));

    // restriccion
    expect(efectosActivos.some((e) => e.tipo === "restriccion" && e.objetivo === "conjuros")).toBe(true);
    expect(efectosActivos.some((e) => e.tipo === "restriccion" && e.objetivo === "concentracion")).toBe(true);

    // modificador_ca (Defensa sin armadura)
    const ca = calcularDefensaSinArmaduraRasgos(pjBase, {
      fuerza: 5,
      destreza: 2,
      constitucion: 5,
      inteligencia: 0,
      sabiduria: 1,
      carisma: 0
    });
    expect(ca?.aplica).toBe(true);
    expect(ca?.caracteristicaExtra).toBe("constitucion");

    // modificador_velocidad (Movimiento rápido +10 ft)
    const vel = calcularVelocidadPersonaje(pjBase);
    expect(vel.caminar).toBe(40); // 30 base + 10

    // modificador_stat (Campeón primigenio +4 FUE, +4 CON con tope de 25)
    const stats = calcularEstadisticasPersonaje(pjBase);
    expect(stats.puntuacionesEfectivas.fuerza).toBe(24); // 20 + 4
    expect(stats.puntuacionesEfectivas.constitucion).toBe(20); // 16 + 4

    // ventaja en iniciativa (Instinto salvaje)
    const ventInic = evaluarVentajasDeRasgosEnTirada(pjBase, { tipoTirada: "iniciativa" });
    expect(ventInic.tieneVentaja).toBe(true);

    // ventaja en salvación destreza (Sentido del peligro)
    const ventSalvDes = evaluarVentajasDeRasgosEnTirada(pjBase, { tipoTirada: "salvacion", subtipo: "destreza" });
    expect(ventSalvDes.tieneVentaja).toBe(true);

    // ventaja en prueba y salvación de fuerza bajo furia
    const ventFuerza = evaluarVentajasDeRasgosEnTirada(pjFuria, { tipoTirada: "salvacion", subtipo: "fuerza" });
    expect(ventFuerza.tieneVentaja).toBe(true);

    // habilidad_con_fuerza (Conocimiento primigenio)
    const efHabFuerza = efectosActivos.find((e) => e.tipo === "habilidad_con_fuerza");
    expect(efHabFuerza).toBeDefined();

    // inmunidad_condicion (Furia ciega de Berserker integrada en Furia)
    const furia = pjFuria.rasgos.find((r) => r.nombre === "Furia");
    expect(furia?.efectos?.some((e) => e.tipo === "inmunidad_condicion" && e.objetivo.includes("Hechizado") && e.objetivo.includes("Asustado"))).toBe(true);
    // inmunidad consolidada verificada en la línea anterior

    // Subclase Fanático nivel 14
    const pjFanatico = aplicarBuildClaseAPersonaje(PERSONAJE_POR_DEFECTO, "Bárbaro", 14, "Senda del Fanático");
    const furiaDioses = pjFanatico.rasgos.find((r) => r.nombre === "Furia de los dioses");
    expect(furiaDioses).toBeDefined();
    expect(furiaDioses?.efectos?.some((e) => e.tipo === "movimiento_especial" && e.objetivo === "velocidad.volar_flota")).toBe(true);
    const pjFanaticoActivo = {
      ...pjFanatico,
      rasgos: pjFanatico.rasgos.map((r) => (r.nombre === "Furia de los dioses" ? { ...r, activo: true } : r))
    };
    expect(calcularVelocidadPersonaje(pjFanaticoActivo)).toMatchObject({ volar: 40, planea: true });
    expect(furiaDioses?.efectos?.some((e) => e.tipo === "resistencia_dano" && e.objetivo.includes("Necrótico"))).toBe(true);

    // Subclase Árbol del Mundo nivel 3
    const pjArbol = aplicarBuildClaseAPersonaje(PERSONAJE_POR_DEFECTO, "Bárbaro", 3, "Senda del Árbol del Mundo");
    const vitalidad = pjArbol.rasgos.find((r) => r.nombre === "Vitalidad del Árbol");
    expect(vitalidad?.efectos?.some((e) => e.tipo === "hp_temporal")).toBe(true);
  });
});

/** Mecánicas que el builder actual no puede modelar; se resuelven en mesa. */
const RESOLUCION_EN_MESA: ReadonlyArray<{ rasgo: string; subclase?: string; mecanica: string; motivo: string }> = [
  { rasgo: "Ataque adicional", mecanica: "Dos ataques por acción de atacar", motivo: "No existe campo declarativo ni evaluador de número de ataques por acción para personajes." },
  { rasgo: "Poderío indómito", mecanica: "Sustituir el total de prueba o salvación de Fuerza por la puntuación de Fuerza", motivo: "No existe tipo de efecto de suelo para el total de una tirada de característica (minimo_d20 solo fija el d20)." },
  { rasgo: "Salto instintivo", mecanica: "Moverse media velocidad al activar Furia", motivo: "No existe efecto de movimiento gratuito ligado a la activación de otro rasgo." },
  { rasgo: "Furia implacable", mecanica: "Salvación de CON con CD creciente al llegar a 0 PG y fijar PG al doble del nivel", motivo: "No existe disparador al caer a 0 PG con CD acumulativa ni recarga por descanso del contador." },
  { rasgo: "Golpe brutal", mecanica: "Empuje 15 pies (Golpe contundente) y reducción de velocidad de 15 pies (Golpe inmovilizador) en la ficha del objetivo", motivo: "El dado extra, la renuncia a ventaja y la elección del efecto en la etiqueta de tirada están modelados; aplicar desplazamiento o penalización de velocidad sobre otra criatura se resuelve en mesa." },
  { rasgo: "Golpe brutal mejorado", mecanica: "Desventaja en salvación (Golpe desestabilizador) y +5 al ataque de aliados (Golpe desgarrador) en la ficha del objetivo", motivo: "La elección en la etiqueta de tirada está modelada; imponer desventaja o bonificadores sobre objetivos terceros se resuelve en mesa." },
  { rasgo: "Golpe brutal mejorado (II)", mecanica: "Aplicar dos efectos mecánicos de Golpe brutal sobre el objetivo", motivo: "El dado 2d10 y la elección de dos efectos en la etiqueta de tirada (maxElecciones: 2) están modelados; su efecto sobre el objetivo se aplica en mesa." },
  { rasgo: "Represalia", subclase: "Senda del Berserker", mecanica: "Reacción de ataque cuerpo a cuerpo al recibir daño", motivo: "No existe efecto de ataque como reacción disparado por daño recibido." },
  { rasgo: "Presencia intimidante", subclase: "Senda del Berserker", mecanica: "Aplicar Asustado a criaturas en un área", motivo: "El recurso, la CD y la recarga con Furia están modelados; no existe efecto que imponga condiciones a terceros." },
  { rasgo: "Raíces golpeadoras", subclase: "Senda del Árbol del Mundo", mecanica: "Alcance +10 pies con armas pesadas o versátiles y maestría adicional", motivo: "No existe efecto de alcance cuerpo a cuerpo condicionado a propiedades de arma ni activación extra de maestrías." },
  { rasgo: "Ramas del Árbol", subclase: "Senda del Árbol del Mundo", mecanica: "Reacción para teletransportar a una criatura y reducir su velocidad", motivo: "No existe efecto de desplazamiento forzado de otras criaturas." },
  { rasgo: "Viaje por el Árbol", subclase: "Senda del Árbol del Mundo", mecanica: "Teletransporte de 60 pies (150 pies con acompañantes)", motivo: "El teletransporte es un movimiento posicional sin tipo de efecto; el uso por Furia sí está modelado." },
  { rasgo: "Presencia fervorosa", subclase: "Senda del Fanático", mecanica: "Ventaja en ataques y salvaciones para hasta diez aliados", motivo: "El uso y la recarga están modelados; no existe efecto que otorgue ventajas a terceros." },
  { rasgo: "Revivificación", subclase: "Senda del Fanático", mecanica: "Fijar los PG de otra criatura a tu nivel de Bárbaro", motivo: "El gasto de Furia está modelado; el builder no puede modificar los PG de un tercero." }
];

/** Rasgos sin efecto mecánico calculable, con el motivo. */
const RASGOS_NARRATIVOS: ReadonlyArray<{ rasgo: string; subclase?: string; motivo: string }> = [
  { rasgo: "Subclase de bárbaro", motivo: "Marcador de nivel: la subclase se elige y se hidrata por separado." },
  { rasgo: "Rasgo de subclase", motivo: "Marcador de nivel: los rasgos reales viven en cada subclase." }
];

type RasgoCrudo = Record<string, unknown> & { nombre: string; efectos?: unknown[] };
const camposConstructor = new Set<string>([
  ...Object.keys(EsquemaCamposConstructor.shape),
  "selectores", "tablaProgresion", "formulaDados", "tieneUsosLimitados", "usosMaximos", "esActivable", "recuperacion"
]);

function tieneMecanicaDeclarada(r: RasgoCrudo): boolean {
  if ((r.efectos ?? []).length > 0) return true;
  return Object.keys(r).some((k) => camposConstructor.has(k));
}

describe("Guardia de cobertura del Bárbaro: resolución en mesa y rasgos narrativos", () => {
  const crudos = catalogo as unknown as { rasgos: RasgoCrudo[]; subclases: Array<{ nombre: string; rasgos: RasgoCrudo[] }> };
  const todos = [
    ...crudos.rasgos.map((r) => ({ r, subclase: undefined as string | undefined })),
    ...crudos.subclases.flatMap((s) => s.rasgos.map((r) => ({ r, subclase: s.nombre })))
  ];
  const enLista = (lista: ReadonlyArray<{ rasgo: string; subclase?: string }>, rasgo: string, subclase?: string): boolean =>
    lista.some((e) => e.rasgo === rasgo && e.subclase === subclase);

  it("todo rasgo sin efectos ni campos del constructor está en RESOLUCION_EN_MESA o RASGOS_NARRATIVOS", () => {
    const huerfanos = todos
      .filter(({ r }) => !tieneMecanicaDeclarada(r))
      .filter(({ r, subclase }) => !enLista(RESOLUCION_EN_MESA, r.nombre, subclase) && !enLista(RASGOS_NARRATIVOS, r.nombre, subclase))
      .map(({ r, subclase }) => `${subclase ?? "base"}: ${r.nombre}`);
    expect(huerfanos).toEqual([]);
  });

  it("las listas solo referencian rasgos existentes y no se solapan", () => {
    for (const e of [...RESOLUCION_EN_MESA, ...RASGOS_NARRATIVOS]) {
      expect(todos.some(({ r, subclase }) => r.nombre === e.rasgo && subclase === e.subclase), `Rasgo inexistente: ${e.rasgo}`).toBe(true);
    }
    for (const n of RASGOS_NARRATIVOS) {
      expect(enLista(RESOLUCION_EN_MESA, n.rasgo, n.subclase), `Solapado: ${n.rasgo}`).toBe(false);
    }
    for (const e of [...RESOLUCION_EN_MESA, ...RASGOS_NARRATIVOS]) {
      expect(e.motivo.length).toBeGreaterThan(10);
    }
  });
});

describe("Escalados y niveles límite del Bárbaro", () => {
  const pjNivel = (nivel: number, sub: string) => aplicarBuildClaseAPersonaje(PERSONAJE_POR_DEFECTO, "Bárbaro", nivel, sub);
  const activar = (pj: ReturnType<typeof pjNivel>) => ({
    ...pj,
    rasgos: pj.rasgos.map((r) => (r.nombre === "Furia" ? { ...r, activo: true } : r))
  });

  it.each([
    [1, 2], [8, 2], [9, 3], [15, 3], [16, 4]
  ])("el daño de Furia a nivel %i es +%i", (nivel, esperado) => {
    const bono = evaluarEfectosRasgosActivos(activar(pjNivel(nivel, "Senda del Berserker"))).find((e) => e.tipo === "bono_dano_fuerza");
    expect(bono?.valor).toBe(esperado);
  });

  it("sin Furia activa no hay bono de daño ni resistencias", () => {
    const pj = pjNivel(20, "Senda del Berserker");
    expect(evaluarEfectosRasgosActivos(pj).some((e) => e.tipo === "bono_dano_fuerza")).toBe(false);
    expect(obtenerResumenDefensasRasgos(pj).resistencias).not.toEqual(expect.arrayContaining(["Contundente"]));
  });

  it.each([
    [4, false], [5, true]
  ])("Movimiento rápido a nivel %i: velocidad extra=%s", (nivel, aplica) => {
    expect(calcularVelocidadPersonaje(pjNivel(nivel, "Senda del Berserker")).caminar).toBe(aplica ? 40 : 30);
  });

  it.each([
    [6, false], [7, true]
  ])("Instinto salvaje a nivel %i: ventaja en iniciativa=%s", (nivel, aplica) => {
    expect(evaluarVentajasDeRasgosEnTirada(pjNivel(nivel, "Senda del Berserker"), { tipoTirada: "iniciativa" }).tieneVentaja).toBe(aplica);
  });

  it.each([
    [1, 2], [3, 3], [6, 4], [12, 5], [17, 6]
  ])("los usos máximos de Furia a nivel %i son %i", (nivel, usos) => {
    const furia = pjNivel(nivel, "Senda del Berserker").rasgos.find((r) => r.nombre === "Furia");
    expect(furia?.usosMaximos).toBe(usos);
  });

  it.each([
    [3, 4], [6, 5], [12, 6], [17, 7]
  ])("la reserva de Guerrero de los dioses a nivel %i es %i", (nivel, usos) => {
    const g = pjNivel(nivel, "Senda del Fanático").rasgos.find((r) => r.nombre === "Guerrero de los dioses");
    expect(g?.usosMaximos).toBe(usos);
  });

  it("los rasgos de subclase no aparecen antes de su nivel", () => {
    expect(pjNivel(2, "Senda del Fanático").rasgos.some((r) => r.nombre === "Furia divina")).toBe(false);
    expect(pjNivel(3, "Senda del Fanático").rasgos.some((r) => r.nombre === "Furia divina")).toBe(true);
    expect(pjNivel(13, "Senda del Fanático").rasgos.some((r) => r.nombre === "Furia de los dioses")).toBe(false);
    expect(pjNivel(14, "Senda del Fanático").rasgos.some((r) => r.nombre === "Furia de los dioses")).toBe(true);
    expect(pjNivel(19, "Senda del Berserker").rasgos.some((r) => r.nombre === "Campeón primigenio")).toBe(false);
  });

  it("Ataque temerario y Golpe brutal conservan preguntarAlAtacar tras construirBuildClase", () => {
    const build = construirBuildClase("Bárbaro", 20, "Senda del Berserker");
    expect(build).not.toBeNull();
    const temerario = build?.rasgos.find((r) => r.nombre === "Ataque temerario");
    const golpeBrutal = build?.rasgos.find((r) => r.nombre === "Golpe brutal");

    expect(temerario?.preguntarAlAtacar).toMatchObject({ caracteristica: "fuerza", soloArmaODesarmado: true });
    expect(golpeBrutal?.preguntarAlAtacar).toMatchObject({ caracteristica: "fuerza", soloArmaODesarmado: true });
    expect(golpeBrutal?.eleccionEfectoEnTirada?.maxElecciones).toBe(2);
    expect(golpeBrutal?.eleccionEfectoEnTirada?.opciones?.map((o) => o.id)).toEqual([
      "contundente", "inmovilizador", "desestabilizador", "desgarrador"
    ]);
  });

  it("consume Aspecto de las tierras salvajes (búho/pantera/salmón), Oso y Halcón en los evaluadores", () => {
    const pj = pjNivel(14, "Senda del Corazón Salvaje");
    const conSeleccion = (opcionAspecto: string, opcionFuria = "oso", opcionPoder = "halcon", furiaActiva = false) => ({
      ...pj,
      rasgos: pj.rasgos.map((r) => {
        if (r.nombre === "Aspecto de las tierras salvajes") {
          return { ...r, selectores: r.selectores?.map((s) => ({ ...s, valorActual: [opcionAspecto] })) };
        }
        if (r.nombre === "Furia") {
          return {
            ...r,
            activo: furiaActiva,
            selectores: r.selectores?.map((s) => {
              if (s.id === "furia_tierras_salvajes_opcion") return { ...s, valorActual: [opcionFuria] };
              if (s.id === "poder_tierras_salvajes_opcion") return { ...s, valorActual: [opcionPoder] };
              return s;
            })
          };
        }
        return r;
      })
    });

    expect(obtenerSentidosEfectivos(conSeleccion("buho")).visionOscuridad).toBe(60);
    expect(calcularVelocidadPersonaje(conSeleccion("pantera")).escalar).toBe(40);
    expect(calcularVelocidadPersonaje(conSeleccion("salmon")).nadar).toBe(40);

    const pjFuriaOsoHalcon = conSeleccion("buho", "oso", "halcon", true);
    expect(obtenerResumenDefensasRasgos(pjFuriaOsoHalcon).resistencias).toEqual(expect.arrayContaining([
      "Ácido", "Contundente", "Cortante", "Frío", "Fuego", "Perforante", "Relámpago", "Trueno", "Veneno"
    ]));
    expect(calcularVelocidadPersonaje(pjFuriaOsoHalcon).volar).toBe(40);
  });

  it("consume Frenesí, Furia divina y Vitalidad del Árbol mediante resolución asistida", () => {
    const pjBerserker = pjNivel(16, "Senda del Berserker");
    const pjBerserkerListo = {
      ...pjBerserker,
      rasgos: pjBerserker.rasgos.map((r) =>
        ["Furia", "Ataque temerario"].includes(r.nombre) ? { ...r, activo: true } : r
      )
    };
    const idFrenesi = pjBerserkerListo.rasgos.find((r) => r.nombre === "Frenesí")!.id;
    expect(prepararDanoIntegrado(pjBerserkerListo, {
      idRasgo: idFrenesi, idOpcion: "frenesi", confirmado: true, incluirDados: true, propio: false
    }, "Cortante", "fuerza")).toEqual({ formula: "4d6", tipoDano: "Cortante" });

    const pjFanatico = activar(pjNivel(10, "Senda del Fanático"));
    const idFuriaDivina = pjFanatico.rasgos.find((r) => r.nombre === "Furia divina")!.id;
    expect(prepararDanoIntegrado(pjFanatico, {
      idRasgo: idFuriaDivina, idOpcion: "radiante", confirmado: true, incluirDados: true, propio: false
    }, "Contundente", "destreza")).toEqual({ formula: "1d6+5", tipoDano: "Radiante" });
    expect(prepararDanoIntegrado(pjFanatico, {
      idRasgo: idFuriaDivina, idOpcion: "necrotico", confirmado: true, incluirDados: true, propio: false
    }, "Contundente", "fuerza")).toEqual({ formula: "1d6+5", tipoDano: "Necrótico" });

    const pjArbol = activar(pjNivel(9, "Senda del Árbol del Mundo"));
    const idVitalidad = pjArbol.rasgos.find((r) => r.nombre === "Vitalidad del Árbol")!.id;
    expect(prepararResolucionAsistida(pjArbol, {
      idRasgo: idVitalidad, idOpcion: "aliado", confirmado: true, incluirDados: true, propio: true
    })).toBeUndefined();
    expect(prepararResolucionAsistida(pjArbol, {
      idRasgo: idVitalidad, idOpcion: "aliado", confirmado: true, incluirDados: true, propio: false
    })?.formula).toBe("3d6");
  });
});