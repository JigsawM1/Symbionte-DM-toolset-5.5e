import { describe, it, expect, beforeEach } from "vitest";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import type { Arma, Armadura } from "@/tipos";

describe("Pruebas de Integración: Formulario y Creación de Objetos (R7)", () => {
  beforeEach(() => {
    usarAlmacenDM.setState({
      objetosHomebrew: [
        {
          id: "item_cimatarra_base",
          nombre: "Cimatarra",
          tipoPrincipal: "Arma",
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
      tipoPrincipal: "Arma" as const,
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
      tipoPrincipal: "Armadura" as const,
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
      tipoPrincipal: "Arma" as const,
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
});
