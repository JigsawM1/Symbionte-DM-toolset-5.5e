import { describe, it, expect, beforeEach } from "vitest";
import {
  obtenerCriaturasNecesariasPorExito,
  escalarFormulaDano,
  calcularAtaqueHorda,
  construirBarrasHorda,
  sincronizarAgregadosHorda,
  aplicarDanoBarrasHorda,
  aplicarCuracionBarrasHorda,
  resolverSalvacionHordaEnArea
} from "./combateHordas";
import { usarAlmacenDM, type CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import { serializarIniciativaDM, deserializarIniciativaDM } from "@/tipos/sync";
import { empaquetarResumenCriaturaDM, desempaquetarResumenCriaturaDM } from "@/tipos/protocoloSync";
import { capturarSyncV4, proyectarSyncV4 } from "@/servicios/sincronizacion/proyeccionSyncV4";

describe("Combate por Hordas (D&D 5.5e) y Múltiples Barras de Vida", () => {
  beforeEach(() => {
    usarAlmacenDM.setState({
      colaIniciativa: [],
      indiceTurnoActivo: 0,
      rondaActual: 1,
      asociacionesFichas: {}
    });
  });

  it("aplica todos los tramos de la Tabla de Hordas canónica de D&D", () => {
    expect(obtenerCriaturasNecesariasPorExito(1)).toBe(1);
    expect(obtenerCriaturasNecesariasPorExito(5)).toBe(1);
    expect(obtenerCriaturasNecesariasPorExito(6)).toBe(2);
    expect(obtenerCriaturasNecesariasPorExito(12)).toBe(2);
    expect(obtenerCriaturasNecesariasPorExito(13)).toBe(3);
    expect(obtenerCriaturasNecesariasPorExito(14)).toBe(3);
    expect(obtenerCriaturasNecesariasPorExito(15)).toBe(4);
    expect(obtenerCriaturasNecesariasPorExito(16)).toBe(4);
    expect(obtenerCriaturasNecesariasPorExito(17)).toBe(5);
    expect(obtenerCriaturasNecesariasPorExito(18)).toBe(5);
    expect(obtenerCriaturasNecesariasPorExito(19)).toBe(10);
    expect(obtenerCriaturasNecesariasPorExito(20)).toBe(20);
    expect(obtenerCriaturasNecesariasPorExito(21)).toBe(Number.POSITIVE_INFINITY);
  });

  it("escala fórmulas de daño simples y compuestas y calcula impactos por Tabla de Hordas", () => {
    const escalado = escalarFormulaDano("2d6+1d4+3", 4);
    expect(escalado.formulaEscalada).toBe("8d6+4d4+12");
    expect(escalado.promedioPorImpacto).toBe(12);
    expect(escalado.promedioTotal).toBe(50);

    // 8 Goblins (+4 ataque, 1d6+2) contra CA 16 -> d20 necesario = 12 -> 2 por impacto -> 4 impactos
    const resNormal = calcularAtaqueHorda({
      miembrosVivos: 8,
      bonificadorAtaque: 4,
      caObjetivo: 16,
      formulaDano: "1d6+2",
      tipoTirada: "plano"
    });
    expect(resNormal.d20Necesario).toBe(12);
    expect(resNormal.criaturasPorImpacto).toBe(2);
    expect(resNormal.impactosTotales).toBe(4);
    expect(resNormal.formulaDanoEscalada).toBe("4d6+8");
    expect(resNormal.danoPromedioTotal).toBe(22);

    // Con ventaja (-5 al d20 necesario -> d20=7 -> sigue en tramo 2; contra CA 18 -> d20=14 pasa a d20=9 -> de 3 baja a 2)
    const resVentaja = calcularAtaqueHorda({
      miembrosVivos: 6,
      bonificadorAtaque: 4,
      caObjetivo: 18,
      formulaDano: "1d6+2",
      tipoTirada: "ventaja"
    });
    expect(resVentaja.d20Necesario).toBe(9);
    expect(resVentaja.criaturasPorImpacto).toBe(2);
    expect(resVentaja.impactosTotales).toBe(3);
  });

  it("gestiona daño en Modo Individual (sin desborde) y Modo Cascada (con desborde)", () => {
    const barras = construirBarrasHorda(4, 10);
    const hordaBase: CriaturaIniciativa = {
      id: "horda_1",
      nombre: "Guardias",
      iniciativa: 12,
      ca: 16,
      condiciones: [],
      bonificadorIniciativa: 1,
      esMonstruo: true,
      velocidad: "30 pies",
      modoDanoHorda: "individual",
      ...sincronizarAgregadosHorda(barras, 0)
    };

    expect(hordaBase.vidaMaxima).toBe(40);
    expect(hordaBase.vidaActual).toBe(40);

    // Modo individual: 15 de daño a la barra #1 (tiene 10 PG) -> mata la #1, el exceso (5) se pierde, avanza barra activa a #2
    const trasIndividual = aplicarDanoBarrasHorda(hordaBase, 15, "individual", 0);
    expect(trasIndividual.barrasVida?.[0].vidaActual).toBe(0);
    expect(trasIndividual.barrasVida?.[1].vidaActual).toBe(10);
    expect(trasIndividual.vidaActual).toBe(30);
    expect(trasIndividual.indiceBarraActiva).toBe(1);
    expect(trasIndividual.resumenHorda).toEqual({ vivos: 3, totales: 4 });

    // Modo cascada: 25 de daño empezando en barra #2 -> mata #2 (10), mata #3 (10) y deja #4 con 5 PG
    const trasCascada = aplicarDanoBarrasHorda(trasIndividual, 25, "cascada");
    expect(trasCascada.barrasVida?.map((b) => b.vidaActual)).toEqual([0, 0, 0, 5]);
    expect(trasCascada.vidaActual).toBe(5);
    expect(trasCascada.indiceBarraActiva).toBe(3);
    expect(trasCascada.resumenHorda).toEqual({ vivos: 1, totales: 4 });

    // Curar barra #1 caída cuando el DM la selecciona explícitamente
    const trasCurarCaida = aplicarCuracionBarrasHorda(trasCascada, 6, 0);
    expect(trasCurarCaida.barrasVida?.[0].vidaActual).toBe(6);
    expect(trasCurarCaida.resumenHorda).toEqual({ vivos: 2, totales: 4 });
  });

  it("resuelve Salvaciones en Área sobre una horda usando la Tabla de Hordas", () => {
    const barras = construirBarrasHorda(6, 20);
    const horda: CriaturaIniciativa = {
      id: "horda_orcos",
      nombre: "Orcos",
      iniciativa: 10,
      ca: 13,
      condiciones: [],
      bonificadorIniciativa: 1,
      esMonstruo: true,
      velocidad: "30 pies",
      ...sincronizarAgregadosHorda(barras, 0)
    };

    // CD 15, bono +2 -> d20 necesario = 13 -> 3 criaturas por éxito -> de 6 afectados: 2 éxitos y 4 fallos
    // Daño 16 (mitad = 8): 4 barras reciben 16 (quedan en 4 PG) y 2 barras reciben 8 (quedan en 12 PG)
    const { criaturaActualizada, detalle } = resolverSalvacionHordaEnArea(horda, {
      cd: 15,
      bonoSalvacion: 2,
      danoBruto: 16,
      mitigacion: "mitad"
    });

    expect(detalle.afectados).toBe(6);
    expect(detalle.exitos).toBe(2);
    expect(detalle.fallos).toBe(4);
    expect(detalle.danoTotalAplicado).toBe(4 * 16 + 2 * 8);
    expect(criaturaActualizada.barrasVida?.map((b) => b.vidaActual)).toEqual([4, 4, 4, 4, 12, 12]);
  });

  it("integra las acciones de Horda en el almacén Zustand y proyecta [vivos, totales] en Sync", () => {
    const store = usarAlmacenDM.getState();
    store.agregarCriaturaAIniciativa("Esqueleto", 14, 13, 13, true, "30 pies", 2, undefined, 5);

    let criatura = usarAlmacenDM.getState().colaIniciativa[0];
    expect(criatura.barrasVida?.length).toBe(5);
    expect(criatura.vidaMaxima).toBe(65);
    expect(criatura.resumenHorda).toEqual({ vivos: 5, totales: 5 });

    // Dañar en modo cascada para abatir 2 esqueletos y herir al 3ro (13 + 13 + 4 = 30)
    usarAlmacenDM.getState().alternarModoDanoHorda(criatura.id, "cascada");
    usarAlmacenDM.getState().dañarCriaturaIniciativa(criatura.id, 30);

    criatura = usarAlmacenDM.getState().colaIniciativa[0];
    expect(criatura.resumenHorda).toEqual({ vivos: 3, totales: 5 });
    expect(criatura.vidaActual).toBe(35);

    // Verificar serialización Sync v2 y protocoloSync
    const wireDM = serializarIniciativaDM({
      cola: [criatura],
      indiceTurnoActivo: 0,
      rondaActual: 1,
      mostrarPorcentajeVidaAJugadores: true,
      metodoVidaMonstruo: "estandar"
    });
    expect(wireDM.c[0].hr).toEqual([3, 5]);
    const restauradoDM = deserializarIniciativaDM(wireDM);
    expect(restauradoDM.cola[0].resumenHorda).toEqual({ vivos: 3, totales: 5 });

    const wireV2 = empaquetarResumenCriaturaDM(criatura);
    expect(wireV2.hr).toEqual([3, 5]);
    expect(desempaquetarResumenCriaturaDM(wireV2).resumenHorda).toEqual({ vivos: 3, totales: 5 });

    // Verificar proyección Sync V4
    const capturaV4 = capturarSyncV4(usarAlmacenDM.getState(), "dm-local");
    const entidadHorda = capturaV4.entidades.find((e) => e.fila === criatura.id);
    expect(entidadHorda?.grupos.datos.horda).toEqual([3, 5]);
    const proyectado = proyectarSyncV4(
      { ...usarAlmacenDM.getState(), colaIniciativa: [] },
      capturaV4
    );
    expect(proyectado.colaIniciativa?.[0].resumenHorda).toEqual({ vivos: 3, totales: 5 });
  });
});
