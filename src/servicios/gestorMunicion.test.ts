import { describe, it, expect } from "vitest";
import {
  esMunicionCompatibleConArma,
  detectarContenedorMunicion,
  resolverEstadoMunicionArma,
  calcularAlmacenamientoMunicion,
  calcularContenidoContenedorMunicion
} from "./gestorMunicion";
import type { ObjetoInventario } from "@/tipos";

describe("gestorMunicion - Compatibilidad de Munición y Contenedores D&D 5.5e", () => {
  const crearItemInv = (nombre: string, cantidad: number = 1): ObjetoInventario => ({
    idInstancia: `inv-${nombre}`,
    idObjeto: `obj-${nombre}`,
    nombre,
    cantidad,
    equipado: false,
    sintonizado: false,
    notas: "",
    contenedor: "mochila",
    pesoLb: 1,
    tipoPrincipal: "Equipo de Aventuras",
    esMagico: false,
    rareza: "Común",
    equipable: false,
    sintonizacionRequerida: false
  });

  describe("Compatibilidad Específica Arma vs Munición", () => {
    it("Arco Largo solo es compatible con Flechas y rechaza Virotes o Balas", () => {
      const flechas = crearItemInv("Flechas", 20);
      const flechasFuego = crearItemInv("Flechas +1", 10);
      const virotes = crearItemInv("Virotes", 20);
      const balas = crearItemInv("Balas, Honda", 20);

      expect(esMunicionCompatibleConArma("Arco Largo", flechas, ["Munición", "A dos manos"])).toBe(true);
      expect(esMunicionCompatibleConArma("Arco Corto", flechasFuego, ["Munición"])).toBe(true);
      expect(esMunicionCompatibleConArma("Arco Largo", virotes, ["Munición"])).toBe(false);
      expect(esMunicionCompatibleConArma("Arco Largo", balas, ["Munición"])).toBe(false);
    });

    it("Ballesta Ligera solo es compatible con Virotes y rechaza Flechas", () => {
      const virotes = crearItemInv("Virotes", 20);
      const virotesMagicos = crearItemInv("Virotes de Ballesta +2", 5);
      const flechas = crearItemInv("Flechas", 20);

      expect(esMunicionCompatibleConArma("Ballesta Ligera", virotes, ["Munición", "Carga"])).toBe(true);
      expect(esMunicionCompatibleConArma("Ballesta de Mano", virotesMagicos, ["Munición"])).toBe(true);
      expect(esMunicionCompatibleConArma("Ballesta Pesada", flechas, ["Munición"])).toBe(false);
    });

    it("Honda solo es compatible con Balas de Honda", () => {
      const balasHonda = crearItemInv("Balas, Honda", 20);
      const balasFuego = crearItemInv("Balas, Arma de Fuego", 20);
      const flechas = crearItemInv("Flechas", 20);

      expect(esMunicionCompatibleConArma("Honda", balasHonda, ["Munición"])).toBe(true);
      expect(esMunicionCompatibleConArma("Honda", balasFuego, ["Munición"])).toBe(false);
      expect(esMunicionCompatibleConArma("Honda", flechas, ["Munición"])).toBe(false);
    });

    it("Cerbatana solo es compatible con Agujas", () => {
      const agujas = crearItemInv("Agujas", 50);
      const flechas = crearItemInv("Flechas", 20);

      expect(esMunicionCompatibleConArma("Cerbatana", agujas, ["Munición", "Carga"])).toBe(true);
      expect(esMunicionCompatibleConArma("Cerbatana", flechas, ["Munición"])).toBe(false);
    });

    it("Pistola solo es compatible con Balas de Arma de Fuego", () => {
      const balasFuego = crearItemInv("Balas, Arma de Fuego", 20);
      const balasHonda = crearItemInv("Balas, Honda", 20);

      expect(esMunicionCompatibleConArma("Pistola", balasFuego, ["Munición", "Carga"])).toBe(true);
      expect(esMunicionCompatibleConArma("Pistola", balasHonda, ["Munición"])).toBe(false);
    });

    it("NUNCA clasifica el propio contenedor (Caja de Virotes, Bolsa de Balas, Carcaj) como munición consumible", () => {
      const cajaVirotes = crearItemInv("Caja de Virotes de Ballesta", 1);
      const bolsaBalas = crearItemInv("Bolsa de Balas", 1);
      const carcaj = crearItemInv("Carcaj", 1);
      const estucheAgujas = crearItemInv("Estuche de Agujas", 1);

      // La Ballesta Ligera requiere Virotes, pero la Caja de Virotes es un contenedor, NO un virote
      expect(esMunicionCompatibleConArma("Ballesta Ligera", cajaVirotes, ["Munición", "Carga"])).toBe(false);
      // La Honda requiere Balas, pero la Bolsa de Balas es un contenedor
      expect(esMunicionCompatibleConArma("Honda", bolsaBalas, ["Munición"])).toBe(false);
      // El Arco requiere Flechas, pero el Carcaj es un contenedor
      expect(esMunicionCompatibleConArma("Arco Largo", carcaj, ["Munición"])).toBe(false);
      // La Cerbatana requiere Agujas, pero el Estuche de Agujas es un contenedor
      expect(esMunicionCompatibleConArma("Cerbatana", estucheAgujas, ["Munición"])).toBe(false);
    });
  });

  describe("Detección de Contenedores de Munición", () => {
    it("detecta Carcaj para Flechas", () => {
      const inventario = [crearItemInv("Carcaj"), crearItemInv("Flechas", 20)];
      const resultado = detectarContenedorMunicion("flechas", inventario);
      expect(resultado.tieneContenedor).toBe(true);
      expect(resultado.nombreContenedor).toBe("Carcaj");
      expect(resultado.capacidadTotal).toBe(20);
    });

    it("detecta Caja de Virotes para Virotes", () => {
      const inventario = [crearItemInv("Caja de Virotes de Ballesta"), crearItemInv("Virotes", 20)];
      const resultado = detectarContenedorMunicion("virotes", inventario);
      expect(resultado.tieneContenedor).toBe(true);
      expect(resultado.nombreContenedor).toBe("Caja de Virotes de Ballesta");
      expect(resultado.capacidadTotal).toBe(20);
    });

    it("informa si no se tiene contenedor", () => {
      const inventario = [crearItemInv("Mochila"), crearItemInv("Flechas", 20)];
      const resultado = detectarContenedorMunicion("flechas", inventario);
      expect(resultado.tieneContenedor).toBe(false);
      expect(resultado.capacidadTotal).toBe(0);
    });
  });

  describe("Cálculo de Capacidad Límite y Excedente en Mochila", () => {
    it("con 40 flechas y 1 Carcaj (capacidad 20): guarda 20 en Carcaj y 20 sueltas en mochila", () => {
      const flechas = crearItemInv("Flechas", 40);
      const carcaj = crearItemInv("Carcaj", 1);
      const inventario = [carcaj, flechas];

      const resultado = calcularAlmacenamientoMunicion(flechas, inventario);
      expect(resultado).not.toBeNull();
      expect(resultado?.tieneContenedor).toBe(true);
      expect(resultado?.capacidadTotal).toBe(20);
      expect(resultado?.almacenadasEnContenedor).toBe(20);
      expect(resultado?.sueltasEnMochila).toBe(20);
      expect(resultado?.estaLleno).toBe(true);
    });

    it("con 40 flechas y 2 Carcajes (capacidad 40): guarda las 40 completas", () => {
      const flechas = crearItemInv("Flechas", 40);
      const carcaj = crearItemInv("Carcaj", 2); // 2 unidades
      const inventario = [carcaj, flechas];

      const resultado = calcularAlmacenamientoMunicion(flechas, inventario);
      expect(resultado?.capacidadTotal).toBe(40);
      expect(resultado?.almacenadasEnContenedor).toBe(40);
      expect(resultado?.sueltasEnMochila).toBe(0);
    });

    it("con 10 flechas y 1 Carcaj: guarda 10/20 y no está lleno", () => {
      const flechas = crearItemInv("Flechas", 10);
      const carcaj = crearItemInv("Carcaj", 1);
      const inventario = [carcaj, flechas];

      const resultado = calcularAlmacenamientoMunicion(flechas, inventario);
      expect(resultado?.almacenadasEnContenedor).toBe(10);
      expect(resultado?.sueltasEnMochila).toBe(0);
      expect(resultado?.estaLleno).toBe(false);
    });

    it("calcula ocupación del Carcaj con 25 flechas (20/20 Lleno)", () => {
      const flechas = crearItemInv("Flechas", 25);
      const carcaj = crearItemInv("Carcaj", 1);
      const inventario = [carcaj, flechas];

      const infoContenedor = calcularContenidoContenedorMunicion(carcaj, inventario);
      expect(infoContenedor).not.toBeNull();
      expect(infoContenedor?.tipoProyectil).toBe("flechas");
      expect(infoContenedor?.totalAlmacenado).toBe(20);
      expect(infoContenedor?.capacidadTotal).toBe(20);
      expect(infoContenedor?.estaLleno).toBe(true);
    });

    it("con 50 agujas y 1 Bolsita: guarda 50/50 agujas en la Bolsita", () => {
      const agujas = crearItemInv("Agujas", 50);
      const bolsita = crearItemInv("Bolsita", 1);
      const inventario = [bolsita, agujas];

      const resultado = calcularAlmacenamientoMunicion(agujas, inventario);
      expect(resultado).not.toBeNull();
      expect(resultado?.tieneContenedor).toBe(true);
      expect(resultado?.nombreContenedor).toBe("Bolsita");
      expect(resultado?.capacidadTotal).toBe(50);
      expect(resultado?.almacenadasEnContenedor).toBe(50);
      expect(resultado?.sueltasEnMochila).toBe(0);
      expect(resultado?.estaLleno).toBe(true);

      const infoBolsita = calcularContenidoContenedorMunicion(bolsita, inventario);
      expect(infoBolsita).not.toBeNull();
      expect(infoBolsita?.tipoProyectil).toBe("agujas");
      expect(infoBolsita?.totalAlmacenado).toBe(50);
      expect(infoBolsita?.capacidadTotal).toBe(50);
      expect(infoBolsita?.estaLleno).toBe(true);
    });

    it("con 80 agujas y 1 Bolsita: guarda 50 en Bolsita y 30 sueltas en mochila", () => {
      const agujas = crearItemInv("Agujas", 80);
      const bolsita = crearItemInv("Bolsita", 1);
      const inventario = [bolsita, agujas];

      const resultado = calcularAlmacenamientoMunicion(agujas, inventario);
      expect(resultado?.capacidadTotal).toBe(50);
      expect(resultado?.almacenadasEnContenedor).toBe(50);
      expect(resultado?.sueltasEnMochila).toBe(30);
      expect(resultado?.estaLleno).toBe(true);
    });

    it("con 20 balas de honda y 1 Bolsita: guarda 20/20 balas en la Bolsita", () => {
      const balas = crearItemInv("Balas, Honda", 20);
      const bolsita = crearItemInv("Bolsita", 1);
      const inventario = [bolsita, balas];

      const resultado = calcularAlmacenamientoMunicion(balas, inventario);
      expect(resultado?.tieneContenedor).toBe(true);
      expect(resultado?.capacidadTotal).toBe(20);
      expect(resultado?.almacenadasEnContenedor).toBe(20);

      const infoBolsita = calcularContenidoContenedorMunicion(bolsita, inventario);
      expect(infoBolsita?.tipoProyectil).toBe("balas");
      expect(infoBolsita?.totalAlmacenado).toBe(20);
      expect(infoBolsita?.capacidadTotal).toBe(20);
    });

    it("resuelve el conflicto si existen Agujas y Balas de Honda con 1 sola Bolsita (asigna 1 y la otra queda suelta)", () => {
      const agujas = crearItemInv("Agujas", 50);
      const balas = crearItemInv("Balas, Honda", 20);
      const bolsita = crearItemInv("Bolsita", 1); // 1 sola bolsita para ambos
      const inventario = [bolsita, agujas, balas];

      // La primera munición (Agujas) toma la única Bolsita
      const resAgujas = calcularAlmacenamientoMunicion(agujas, inventario);
      expect(resAgujas?.tieneContenedor).toBe(true);
      expect(resAgujas?.almacenadasEnContenedor).toBe(50);
      expect(resAgujas?.sueltasEnMochila).toBe(0);

      // La segunda munición (Balas) detecta que la Bolsita ya está ocupada por las Agujas
      const resBalas = calcularAlmacenamientoMunicion(balas, inventario);
      expect(resBalas?.tieneContenedor).toBe(false);
      expect(resBalas?.almacenadasEnContenedor).toBe(0);
      expect(resBalas?.sueltasEnMochila).toBe(20);
    });

    it("aloja ambas municiones si el personaje tiene 2 Bolsitas en la mochila", () => {
      const agujas = crearItemInv("Agujas", 50);
      const balas = crearItemInv("Balas, Honda", 20);
      const bolsitas = crearItemInv("Bolsita", 2); // 2 bolsitas
      const inventario = [bolsitas, agujas, balas];

      // Bolsita 1 para Agujas
      const resAgujas = calcularAlmacenamientoMunicion(agujas, inventario);
      expect(resAgujas?.tieneContenedor).toBe(true);
      expect(resAgujas?.almacenadasEnContenedor).toBe(50);

      // Bolsita 2 para Balas
      const resBalas = calcularAlmacenamientoMunicion(balas, inventario);
      expect(resBalas?.tieneContenedor).toBe(true);
      expect(resBalas?.almacenadasEnContenedor).toBe(20);
    });

    it("calcula ocupación del Estuche de Agujas con 50 agujas (50/50 Lleno)", () => {
      const agujas = crearItemInv("Agujas", 50);
      const estuche = crearItemInv("Estuche de Agujas", 1);
      estuche.idObjeto = "needle-case";
      const inventario = [estuche, agujas];

      const info = calcularContenidoContenedorMunicion(estuche, inventario);
      expect(info).not.toBeNull();
      expect(info?.tipoProyectil).toBe("agujas");
      expect(info?.totalAlmacenado).toBe(50);
      expect(info?.capacidadTotal).toBe(50);
      expect(info?.estaLleno).toBe(true);
    });

    it("calcula ocupación de la Cartuchera con 20 balas de arma de fuego (20/20 Lleno)", () => {
      const balas = crearItemInv("Balas, Arma de Fuego", 20);
      const cartuchera = crearItemInv("Cartuchera", 1);
      cartuchera.idObjeto = "cartridge-pouch";
      const inventario = [cartuchera, balas];

      const info = calcularContenidoContenedorMunicion(cartuchera, inventario);
      expect(info).not.toBeNull();
      expect(info?.tipoProyectil).toBe("balas");
      expect(info?.totalAlmacenado).toBe(20);
      expect(info?.capacidadTotal).toBe(20);
      expect(info?.estaLleno).toBe(true);
    });

    it("calcula ocupación de la Bolsa de Balas con 20 balas de honda (20/20 Lleno)", () => {
      const balas = crearItemInv("Balas, Honda", 20);
      const bolsaBalas = crearItemInv("Bolsa de Balas", 1);
      bolsaBalas.idObjeto = "bullet-pouch";
      const inventario = [bolsaBalas, balas];

      const info = calcularContenidoContenedorMunicion(bolsaBalas, inventario);
      expect(info).not.toBeNull();
      expect(info?.tipoProyectil).toBe("balas");
      expect(info?.totalAlmacenado).toBe(20);
      expect(info?.capacidadTotal).toBe(20);
      expect(info?.estaLleno).toBe(true);
    });
  });

  describe("Resolución Completa de Estado de Munición", () => {
    it("calcula cantidad total y detecta contenedor para un Arco Largo con Flechas en un Carcaj", () => {
      const inventario = [
        crearItemInv("Carcaj"),
        crearItemInv("Flechas", 20),
        crearItemInv("Flechas +1", 5),
        crearItemInv("Virotes", 30) // No debe sumar
      ];

      const estado = resolverEstadoMunicionArma("Arco Largo", ["A dos manos", "Munición"], inventario);

      expect(estado.requiereMunicion).toBe(true);
      expect(estado.tipoMunicionEsperada).toBe("flechas");
      expect(estado.nombreMunicionEsperada).toBe("Flechas");
      expect(estado.nombreContenedorRecomendado).toBe("Carcaj");
      expect(estado.municionDisponibleCantidad).toBe(20); // 20 listas en el Carcaj
      expect(estado.municionTotalGlobal).toBe(25); // 25 totales
      expect(estado.tieneContenedorEnInventario).toBe(true);
      expect(estado.nombreContenedorDetectado).toBe("Carcaj");
      expect(estado.itemsCompatibles.length).toBe(2);
      expect(estado.municionEnContenedor).toBe(20);
      expect(estado.municionSueltEnMochila).toBe(5);
    });

    it("informa 0 munición disponible si el personaje solo tiene munición incompatible", () => {
      const inventario = [
        crearItemInv("Carcaj"),
        crearItemInv("Virotes", 20) // Incompatible con arco
      ];

      const estado = resolverEstadoMunicionArma("Arco Corto", ["Munición"], inventario);

      expect(estado.requiereMunicion).toBe(true);
      expect(estado.municionDisponibleCantidad).toBe(0);
      expect(estado.itemsCompatibles.length).toBe(0);
    });

    it("retorna requiereMunicion: false para armas cuerpo a cuerpo estándar", () => {
      const inventario = [crearItemInv("Flechas", 20)];
      const estado = resolverEstadoMunicionArma("Espada Larga", ["Versátil"], inventario);

      expect(estado.requiereMunicion).toBe(false);
      expect(estado.municionDisponibleCantidad).toBe(0);
    });

    it("consume prioritariamente los campos relacionales ammunition y storage del compendio", () => {
      const baseDatosCompendio = [
        {
          id: "custom-bow",
          nombre: "Arco Ancestral Rúnico",
          tipoPrincipal: "Arma",
          ammunition: { index: "runic-arrows", name: "Flechas Rúnicas" }
        },
        {
          id: "runic-arrows",
          nombre: "Flechas Rúnicas",
          tipoPrincipal: "Equipo de Aventuras",
          storage: { index: "runic-quiver", name: "Carcaj Rúnico" }
        },
        {
          id: "runic-quiver",
          nombre: "Carcaj Rúnico",
          tipoPrincipal: "Equipo de Aventuras"
        }
      ] as unknown as NonNullable<Parameters<typeof resolverEstadoMunicionArma>[3]>;

      const inventario = [
        crearItemInv("Carcaj Rúnico"),
        crearItemInv("Flechas Rúnicas", 15),
        crearItemInv("Flechas", 20) // Flechas estándar
      ];

      const estado = resolverEstadoMunicionArma(
        "Arco Ancestral Rúnico",
        ["Munición"],
        inventario,
        baseDatosCompendio
      );

      expect(estado.requiereMunicion).toBe(true);
      expect(estado.nombreMunicionEsperada).toBe("Flechas Rúnicas");
      expect(estado.nombreContenedorRecomendado).toBe("Carcaj Rúnico");
      expect(estado.tieneContenedorEnInventario).toBe(true);
      expect(estado.nombreContenedorDetectado).toBe("Carcaj Rúnico");
      expect(estado.municionDisponibleCantidad).toBe(15);
    });

    it("bloquea el disparo y no recarga el Carcaj si las flechas están en la Montura o Bolsa de Contención", () => {
      const carcajMochila = { ...crearItemInv("Carcaj", 1), contenedor: "mochila" as const };
      const flechasEnCarro = { ...crearItemInv("Flechas", 60), contenedor: "montura" as const };
      const inventario = [carcajMochila, flechasEnCarro];

      const estado = resolverEstadoMunicionArma("Arco Largo", ["Munición"], inventario);

      expect(estado.requiereMunicion).toBe(true);
      expect(estado.tieneContenedorEnInventario).toBe(true);
      expect(estado.municionEnContenedor).toBe(0);
      expect(estado.municionDisponibleCantidad).toBe(0); // El lanzador tiene 0 listas
      expect(estado.municionEnCompartimentosExternos).toBe(60);
      expect(estado.puedeDisparar).toBe(false);
      expect(estado.motivoBloqueo).toContain("carro/bolsa de contención");
    });

    it("bloquea el disparo si el Carcaj está en la Montura o Almacén aunque haya flechas en la mochila", () => {
      const carcajEnMontura = { ...crearItemInv("Carcaj", 1), contenedor: "montura" as const };
      const flechasMochila = { ...crearItemInv("Flechas", 20), contenedor: "mochila" as const };
      const inventario = [carcajEnMontura, flechasMochila];

      const estado = resolverEstadoMunicionArma("Arco Largo", ["Munición"], inventario);

      expect(estado.requiereMunicion).toBe(true);
      expect(estado.tieneContenedorEnInventario).toBe(false); // No tiene contenedor encima
      expect(estado.municionEnContenedor).toBe(0);
      expect(estado.puedeDisparar).toBe(false);
    });

    it("permite disparar exactamente las 20 flechas del Carcaj y no toca las 40 flechas de la Bolsa de Contención", () => {
      const carcajMochila = { ...crearItemInv("Carcaj", 1), contenedor: "mochila" as const };
      const flechasMochila = { ...crearItemInv("Flechas", 20), contenedor: "mochila" as const };
      const flechasBolsa = { ...crearItemInv("Flechas", 40), contenedor: "bolsa_contencion" as const };
      const inventario = [carcajMochila, flechasMochila, flechasBolsa];

      const estado = resolverEstadoMunicionArma("Arco Largo", ["Munición"], inventario);

      expect(estado.puedeDisparar).toBe(true);
      expect(estado.municionEnContenedor).toBe(20);
      expect(estado.municionDisponibleCantidad).toBe(20);
      expect(estado.municionEnCompartimentosExternos).toBe(40);
      expect(estado.municionTotalGlobal).toBe(60);
    });
  });
});
