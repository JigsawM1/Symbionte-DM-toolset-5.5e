import { describe, it, expect, beforeEach } from "vitest";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";

describe("Selectores y Acciones de Zustand (R6)", () => {
  beforeEach(() => {
    // Restablecer estado a valores limpios controlados
    usarAlmacenDM.setState({
      colaIniciativa: [],
      rondaActual: 1,
      indiceTurnoActivo: 0,
      pestañaActiva: "iniciativa",
      listaPendientes: [],
      notasDM: "Notas de prueba",
      notificaciones: [],
    });
  });

  it("Iniciativa: debe permitir agregar criaturas y avanzar rondas", () => {
    const estadoInicial = usarAlmacenDM.getState();
    expect(estadoInicial.colaIniciativa).toEqual([]);
    expect(estadoInicial.rondaActual).toBe(1);

    // Agregar criatura a la iniciativa
    estadoInicial.agregarCriaturaAIniciativa(
      "Goblin Explorador",
      15,
      12,
      13,
      true,
      "30 pies",
      2
    );

    const estadoTrasAgregar = usarAlmacenDM.getState();
    expect(estadoTrasAgregar.colaIniciativa.length).toBe(1);
    expect(estadoTrasAgregar.colaIniciativa[0].nombre).toBe("Goblin Explorador");
    expect(estadoTrasAgregar.colaIniciativa[0].vidaActual).toBe(12);

    // Avanzar ronda
    estadoTrasAgregar.avanzarRonda();

    const estadoFinal = usarAlmacenDM.getState();
    expect(estadoFinal.rondaActual).toBe(2);
  });

  it("Configuración: debe cambiar pestañas y despachar notificaciones", () => {
    const estado = usarAlmacenDM.getState();
    expect(estado.pestañaActiva).toBe("iniciativa");

    estado.establecerPestaña("compendio");
    expect(usarAlmacenDM.getState().pestañaActiva).toBe("compendio");

    // Probar notificaciones
    estado.agregarNotificacion("Guardado con éxito", "exito");
    const notifs = usarAlmacenDM.getState().notificaciones;
    expect(notifs.length).toBe(1);
    expect(notifs[0].mensaje).toBe("Guardado con éxito");
  });

  it("Útiles: debe gestionar notas y alternar estado de tareas pendientes", () => {
    const estado = usarAlmacenDM.getState();
    expect(estado.notasDM).toBe("Notas de prueba");

    estado.guardarNotasDM("Nuevas notas de campaña");
    expect(usarAlmacenDM.getState().notasDM).toBe("Nuevas notas de campaña");

    // Agregar y alternar pendiente
    estado.agregarPendiente("Preparar mapa del templo");
    const pendientes = usarAlmacenDM.getState().listaPendientes;
    expect(pendientes.length).toBe(1);
    const idItem = pendientes[0].id;
    expect(pendientes[0].completado).toBe(false);

    estado.alternarPendiente(idItem);
    expect(usarAlmacenDM.getState().listaPendientes[0].completado).toBe(true);
  });

  it("Homebrew: debe permitir conmutar modos y gestionar tipos activos", () => {
    const estado = usarAlmacenDM.getState();
    expect(Array.isArray(estado.baseDatosMonstruos)).toBe(true);

    estado.establecerModoHomebrew("crear");
    estado.establecerTipoHomebrew("hechizo");

    const estadoHomebrew = usarAlmacenDM.getState();
    expect(estadoHomebrew.modoHomebrew).toBe("crear");
    expect(estadoHomebrew.tipoHomebrewActivo).toBe("hechizo");
  });

  it("calcularEstadisticasPersonaje: calcula la CA automáticamente según armadura y destreza", async () => {
    const { calcularEstadisticasPersonaje } = await import("./usarEstadoPersonajes");
    const { PERSONAJE_POR_DEFECTO } = await import("@/constantes");

    // 1. Sin armadura con DES 14 (+2) -> CA 12
    const pjSinArmadura = {
      ...PERSONAJE_POR_DEFECTO,
      caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, destreza: 14 },
      inventario: []
    };
    const statsSinArmadura = calcularEstadisticasPersonaje(pjSinArmadura);
    expect(statsSinArmadura.claseArmadura.total).toBe(12);
    expect(statsSinArmadura.claseArmadura.tipoArmadura).toBe("Sin Armadura");

    // 2. Armadura de Cuero (CA 11) + DES 16 (+3) -> CA 14
    const pjCuero = {
      ...PERSONAJE_POR_DEFECTO,
      caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, destreza: 16 },
      inventario: [
        {
          idInstancia: "cuero-1",
          idObjeto: "cuero",
          nombre: "Armadura de Cuero",
          cantidad: 1,
          equipado: true,
          sintonizado: false,
          notas: "",
          pesoLb: 10,
          tipoPrincipal: "Armadura" as const,
          rareza: "Común" as const,
          esMagico: false,
          equipable: true,
          sintonizacionRequerida: false
        }
      ]
    };
    const statsCuero = calcularEstadisticasPersonaje(pjCuero);
    expect(statsCuero.claseArmadura.total).toBe(14); // 11 + 3

    // 3. Cota de Escamas (CA 14 Mediana) + DES 16 (+3) -> Tope +2 -> CA 16
    const pjEscamas = {
      ...PERSONAJE_POR_DEFECTO,
      caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, destreza: 16 },
      inventario: [
        {
          idInstancia: "escamas-1",
          idObjeto: "escamas",
          nombre: "Cota de Escamas",
          cantidad: 1,
          equipado: true,
          sintonizado: false,
          notas: "",
          pesoLb: 45,
          tipoPrincipal: "Armadura" as const,
          rareza: "Común" as const,
          esMagico: false,
          equipable: true,
          sintonizacionRequerida: false
        }
      ]
    };
    const statsEscamas = calcularEstadisticasPersonaje(pjEscamas);
    expect(statsEscamas.claseArmadura.total).toBe(16); // 14 + 2

    // 4. Placas (CA 18 Pesada) + DES 16 (+3) -> No suma DES -> CA 18
    // + Escudo (+2) -> CA 20
    const pjPlacasConEscudo = {
      ...PERSONAJE_POR_DEFECTO,
      caracteristicas: { ...PERSONAJE_POR_DEFECTO.caracteristicas, destreza: 16 },
      inventario: [
        {
          idInstancia: "placas-1",
          idObjeto: "placas",
          nombre: "Armadura de Placas",
          cantidad: 1,
          equipado: true,
          sintonizado: false,
          notas: "",
          pesoLb: 65,
          tipoPrincipal: "Armadura" as const,
          rareza: "Común" as const,
          esMagico: false,
          equipable: true,
          sintonizacionRequerida: false
        },
        {
          idInstancia: "escudo-1",
          idObjeto: "escudo",
          nombre: "Escudo",
          cantidad: 1,
          equipado: true,
          sintonizado: false,
          notas: "",
          pesoLb: 6,
          tipoPrincipal: "Armadura" as const,
          rareza: "Común" as const,
          esMagico: false,
          equipable: true,
          sintonizacionRequerida: false
        }
      ]
    };
    const statsPlacasEscudo = calcularEstadisticasPersonaje(pjPlacasConEscudo);
    expect(statsPlacasEscudo.claseArmadura.total).toBe(20); // 18 + 0 + 2
  });
});
