import { describe, it, expect, beforeEach } from "vitest";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import type { Arma, Armadura, Escudo, EquipoAventuras } from "@/tipos";

describe("Pruebas de Integración: Formulario y Creación de Objetos (R7)", () => {
  beforeEach(() => {
    usarAlmacenDM.setState({
      objetosHomebrew: [
        {
          id: "item_cimatarra_base",
          nombre: "Cimatarra",
          categoria: "armas",
          esConsumible: false,
          subcategoria: "Marcial",
          tipoAtaque: "Cuerpo a Cuerpo",
          dadoDano: "1d6",
          tipoDano: "Cortante",
          propiedades: ["Sutil (Finesse)", "Ligera (Light)"],
          maestria: "Nick (Corte)",
          rareza: "Común",
          pesoLb: 3,
          valorPO: 25,
          descripcion: "Una espada curva ligera.",
          esMagico: false,
          equipable: true,
        } as unknown as Arma,
      ],
      notificaciones: [],
    });
  });

  it("Debe agregar un arma homebrew con maestrías y propiedades al store", () => {
    const estado = usarAlmacenDM.getState();
    const nuevaArma = {
      nombre: "Chuchumaru",
      categoria: "armas" as const,
      esConsumible: false,
      subcategoria: "Marcial" as const,
      tipoAtaque: "Cuerpo a Cuerpo" as const,
      dadoDano: "1d8",
      tipoDano: "Cortante",
      propiedades: ["Sutil (Finesse)", "Versátil (Versatile)"],
      maestria: "Vex (Irritar)",
      rareza: "Raro" as const,
      pesoLb: 2.5,
      valorPO: 500,
      descripcion: "Espada legendaria con filo fantasmal.",
      esMagico: true,
      equipable: true,
      danoVersatil: "1d10",
      efectosPasivos: [
        { tipo: "CA", bono: "CA", valor: 1, descripcion: "+1 a la CA al empuñarla" },
      ],
    };

    estado.agregarObjetoHomebrew(nuevaArma);

    const estadoActualizado = usarAlmacenDM.getState();
    const objetoGuardado = estadoActualizado.objetosHomebrew.find((o) => o.nombre === "Chuchumaru");

    expect(objetoGuardado).toBeDefined();
    expect(objetoGuardado?.id).toBeDefined();
    expect(objetoGuardado?.rareza).toBe("Raro");
    expect(objetoGuardado?.esMagico).toBe(true);
    const armaGuardada = objetoGuardado as Arma;
    expect(armaGuardada?.maestria).toBe("Vex (Molestar)");
    expect(armaGuardada?.danoVersatil).toBe("1d10");
    expect(objetoGuardado?.efectosPasivos?.length).toBe(1);
  });

  it("Debe agregar una armadura homebrew con CA base y bono de destreza", () => {
    const estado = usarAlmacenDM.getState();
    const nuevaArmadura = {
      nombre: "Placas del Dragón Dorado",
      categoria: "armaduras" as const,
      esConsumible: false,
      subcategoria: "Pesada" as const,
      caBase: 19,
      requisitoFuerza: 15,
      desventajaSigilo: true,
      bonoDestreza: "Sin Bono" as const,
      rareza: "Muy Raro" as const,
      pesoLb: 65,
      valorPO: 4000,
      descripcion: "Armadura forjada con escamas de dragón de oro.",
      esMagico: true,
      equipable: true,
      tiempoEquipar: "10 minutos",
      efectosPasivos: [
        { tipo: "Resistencia", bono: "Fuego", descripcion: "Resistencia al daño de fuego" },
      ],
    };

    estado.agregarObjetoHomebrew(nuevaArmadura as unknown as Omit<Armadura, "id">);

    const estadoActualizado = usarAlmacenDM.getState();
    const armaduraGuardada = estadoActualizado.objetosHomebrew.find(
      (o) => o.nombre === "Placas del Dragón Dorado"
    ) as Armadura | undefined;

    expect(armaduraGuardada).toBeDefined();
    expect(armaduraGuardada?.caBase).toBe(19);
    expect(armaduraGuardada?.requisitoFuerza).toBe(15);
    expect(armaduraGuardada?.desventajaSigilo).toBe(true);
    expect(armaduraGuardada?.efectosPasivos?.[0]?.bono).toBe("Fuego");
  });

  it("Debe actualizar un objeto existente sin perder sus propiedades", () => {
    const estado = usarAlmacenDM.getState();
    const idOriginal = "item_cimatarra_base";

    estado.actualizarObjetoHomebrew(idOriginal, {
      nombre: "Cimatarra Afilada +1",
      categoria: "armas" as const,
      esConsumible: false,
      subcategoria: "Marcial" as const,
      tipoAtaque: "Cuerpo a Cuerpo" as const,
      dadoDano: "1d6",
      tipoDano: "Cortante",
      propiedades: ["Sutil (Finesse)", "Ligera (Light)"],
      maestria: "Nick (Corte)",
      rareza: "Poco Común" as const,
      pesoLb: 3,
      valorPO: 300,
      descripcion: "Una cimatarra con filo mágico mejorado.",
      esMagico: true,
      equipable: true,
      modificadorAtaqueDano: 1,
    } as unknown as Omit<Arma, "id">);

    const estadoActualizado = usarAlmacenDM.getState();
    const objetoModificado = estadoActualizado.objetosHomebrew.find((o) => o.id === idOriginal);

    expect(objetoModificado).toBeDefined();
    expect(objetoModificado?.nombre).toBe("Cimatarra Afilada +1");
    expect(objetoModificado?.rareza).toBe("Poco Común");
    expect(objetoModificado?.modificadorAtaqueDano).toBe(1);
  });

  it("Debe eliminar un objeto del compendio correctamente", () => {
    const estado = usarAlmacenDM.getState();
    const idOriginal = "item_cimatarra_base";

    expect(estado.objetosHomebrew.some((o) => o.id === idOriginal)).toBe(true);

    estado.eliminarObjetoHomebrew(idOriginal);

    const estadoActualizado = usarAlmacenDM.getState();
    expect(estadoActualizado.objetosHomebrew.some((o) => o.id === idOriginal)).toBe(false);
  });

  it("Debe agregar un escudo homebrew como categoría de primera clase", () => {
    const estado = usarAlmacenDM.getState();
    const nuevoEscudo = {
      nombre: "Escudo Torre Pesado",
      categoria: "escudos" as const,
      esConsumible: false,
      subcategoria: "Escudo Torre",
      caBase: 3,
      desventajaSigilo: true,
      rareza: "Poco Común" as const,
      pesoLb: 10,
      valorPO: 50,
      descripcion: "Un gran escudo de madera reforzada que cubre gran parte del cuerpo.",
      esMagico: false,
      equipable: true,
    };

    estado.agregarObjetoHomebrew(nuevoEscudo as unknown as Omit<Escudo, "id">);

    const estadoActualizado = usarAlmacenDM.getState();
    const escudoGuardado = estadoActualizado.objetosHomebrew.find(
      (o) => o.nombre === "Escudo Torre Pesado"
    ) as Escudo | undefined;

    expect(escudoGuardado).toBeDefined();
    expect(escudoGuardado?.categoria).toBe("escudos");
    expect(escudoGuardado?.caBase).toBe(3);
    expect(escudoGuardado?.desventajaSigilo).toBe(true);
    expect(escudoGuardado?.equipable).toBe(true);
  });

  it("Debe agregar un consumible con esConsumible=true y efectos de veneno", () => {
    const estado = usarAlmacenDM.getState();
    const nuevoVeneno = {
      nombre: "Veneno de Serpiente Crepuscular",
      categoria: "consumibles" as const,
      esConsumible: true,
      subcategoria: "Veneno",
      rareza: "Raro" as const,
      pesoLb: 0.1,
      valorPO: 200,
      descripcion: "Toxina extraída de las víboras de la penumbra.",
      esMagico: false,
      equipable: false,
      esVeneno: true,
      tipoVeneno: "Lesión" as const,
      efectoVeneno: "El objetivo debe superar una salvación de CON CD 14 o recibir 3d6 daño de veneno y quedar envenenado por 1 hora.",
    };

    estado.agregarObjetoHomebrew(nuevoVeneno as unknown as Omit<EquipoAventuras, "id">);

    const estadoActualizado = usarAlmacenDM.getState();
    const venenoGuardado = estadoActualizado.objetosHomebrew.find(
      (o) => o.nombre === "Veneno de Serpiente Crepuscular"
    ) as EquipoAventuras | undefined;

    expect(venenoGuardado).toBeDefined();
    expect(venenoGuardado?.categoria).toBe("consumibles");
    expect(venenoGuardado?.esConsumible).toBe(true);
    expect(venenoGuardado?.esVeneno).toBe(true);
    expect(venenoGuardado?.tipoVeneno).toBe("Lesión");
  });

  it("Debe agregar munición con metadatos de lote (quantity) y pesoUnitario", () => {
    const estado = usarAlmacenDM.getState();
    const nuevoLote = {
      nombre: "Carcaj con Flechas de Caza",
      categoria: "municion" as const,
      esConsumible: true,
      subcategoria: "Flechas",
      rareza: "Común" as const,
      pesoLb: 1,
      valorPO: 1,
      descripcion: "Lote de 20 flechas para arco.",
      esMagico: false,
      equipable: false,
      quantity: 20,
      pesoUnitario: 0.05,
    };

    estado.agregarObjetoHomebrew(nuevoLote as unknown as Omit<EquipoAventuras, "id">);

    const estadoActualizado = usarAlmacenDM.getState();
    const loteGuardado = estadoActualizado.objetosHomebrew.find(
      (o) => o.nombre === "Carcaj con Flechas de Caza"
    ) as EquipoAventuras | undefined;

    expect(loteGuardado).toBeDefined();
    expect(loteGuardado?.categoria).toBe("municion");
    expect(loteGuardado?.quantity).toBe(20);
    expect(loteGuardado?.pesoUnitario).toBe(0.05);
    expect(loteGuardado?.esConsumible).toBe(true);
  });

  it("Debe persistir categorías de focos mágicos y contenedores sin revertir a equipo aventurero genérico", () => {
    const estado = usarAlmacenDM.getState();
    const nuevoFoco = {
      nombre: "Orbe Astral de Cuarzo",
      categoria: "focos-magicos" as const,
      esConsumible: false,
      subcategoria: "Foco Arcano",
      rareza: "Poco Común" as const,
      pesoLb: 1,
      valorPO: 150,
      descripcion: "Foco de canalización mística para hechiceros y magos.",
      esMagico: true,
      equipable: false,
    };

    estado.agregarObjetoHomebrew(nuevoFoco as unknown as Omit<EquipoAventuras, "id">);

    const estadoActualizado = usarAlmacenDM.getState();
    const focoGuardado = estadoActualizado.objetosHomebrew.find(
      (o) => o.nombre === "Orbe Astral de Cuarzo"
    );

    expect(focoGuardado).toBeDefined();
    expect(focoGuardado?.categoria).toBe("focos-magicos");
  });
});

