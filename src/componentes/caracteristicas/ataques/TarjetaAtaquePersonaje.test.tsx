import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TarjetaAtaquePersonaje } from "./TarjetaAtaquePersonaje";
import { SeccionAtaquesFisicos } from "./SeccionAtaquesFisicos";
import {
  formatearAlcanceLimpio,
  construirSubtituloAtaque,
  obtenerEtiquetaPropiedadCompacta,
  calcularFormulaCriticoVisual,
  obtenerResumenMaestriaVisual
} from "./utilesTarjetaAtaque";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import type { AtaquePersonajeCalculado, PersonajeJugador } from "@/tipos";

const ataqueEspadaLarga: AtaquePersonajeCalculado = {
  id: "arma-espada-larga",
  nombre: "Espada Larga +1",
  tipo: "Arma",
  subtipo: "Cuerpo a Cuerpo",
  tipoAccion: "accion",
  caracteristicaUsada: "fuerza",
  bonoAtaque: 8,
  dadoDano: "1d8+5",
  dadoDanoBase: "1d8",
  modificadorDano: 5,
  esDanoFijo: false,
  danoVersatil: "1d10+5",
  dadoVersatilBase: "1d10",
  tipoDano: "Cortante",
  alcance: "5/5 ft",
  propiedades: ["Versátil"],
  maestria: "Sap (Debilitar)",
  esMagico: true,
  tieneTiradaAtaque: true,
  esCompetenteConArma: true,
  esSutil: false,
  esDistancia: false
};

const ataqueArcoLargo: AtaquePersonajeCalculado = {
  id: "arma-arco-largo",
  nombre: "Arco Largo Táctico",
  tipo: "Arma",
  subtipo: "A Distancia",
  tipoAccion: "accion",
  caracteristicaUsada: "destreza",
  bonoAtaque: 7,
  dadoDano: "1d8+4",
  dadoDanoBase: "1d8",
  modificadorDano: 4,
  esDanoFijo: false,
  tipoDano: "Perforante",
  alcance: "150/600 ft",
  propiedades: ["Munición", "A dos manos"],
  maestria: "Slow (Ralentizar)",
  esMagico: false,
  tieneTiradaAtaque: true,
  requiereMunicion: true,
  municionNombre: "Flechas",
  municionCantidad: 18,
  nombreContenedor: "Carcaj",
  tieneContenedor: true,
  municionEnContenedor: 18,
  municionCapacidadContenedor: 20,
  municionItemId: "inv-flechas-1",
  puedeDisparar: true,
  esCompetenteConArma: true,
  esSutil: false,
  esDistancia: true
};

const ataqueImprovisado: AtaquePersonajeCalculado = {
  id: "ataque-arma-improvisada",
  nombre: "Golpe con Arma Improvisada",
  tipo: "Arma",
  subtipo: "Cuerpo a Cuerpo / Arrojadiza",
  tipoAccion: "accion",
  caracteristicaUsada: "fuerza",
  bonoAtaque: 0,
  dadoDano: "1d4",
  dadoDanoBase: "1d4",
  modificadorDano: 0,
  esDanoFijo: false,
  tipoDano: "Contundente",
  alcance: "5 ft (20/60 ft arrojadiza)",
  propiedades: ["Improvisada", "Arrojadiza (20/60 ft)"],
  tieneTiradaAtaque: true,
  esCompetenteConArma: false,
  esSutil: false,
  esDistancia: false
};

const ataqueDesarmado: AtaquePersonajeCalculado = {
  id: "ataque-desarmado",
  nombre: "Golpe sin Armas",
  tipo: "Desarmado",
  subtipo: "Cuerpo a Cuerpo",
  tipoAccion: "accion",
  caracteristicaUsada: "fuerza",
  bonoAtaque: 3,
  dadoDano: "1",
  dadoDanoBase: "1",
  modificadorDano: 0,
  esDanoFijo: true,
  tipoDano: "Contundente",
  alcance: "5 ft",
  propiedades: [],
  tieneTiradaAtaque: true,
  esCompetenteConArma: true
};

describe("utilesTarjetaAtaque — Formateo, deduplicación y fórmulas críticas", () => {
  it("deduplica alcances idénticos como 5/5 ft -> 5 ft", () => {
    expect(formatearAlcanceLimpio("5/5 ft")).toBe("5 ft");
    expect(formatearAlcanceLimpio("150/600 ft")).toBe("150/600 ft");
    expect(construirSubtituloAtaque("Cuerpo a Cuerpo", "5/5 ft")).toBe("Cuerpo a cuerpo · Alcance 5 ft");
    expect(construirSubtituloAtaque("A Distancia", "150/600 ft")).toBe("A distancia · Rango 150/600 ft");
  });

  it("evita repetir 'Arrojadiza' y el rango (20/60 ft) entre subtítulo y chips", () => {
    expect(construirSubtituloAtaque("Cuerpo a Cuerpo / Arrojadiza", "5 ft (20/60 ft arrojadiza)")).toBe(
      "Cuerpo a cuerpo · 5 ft (20/60 ft arrojadiza)"
    );
    expect(obtenerEtiquetaPropiedadCompacta("Arrojadiza (20/60 ft)", "5 ft (20/60 ft arrojadiza)")).toBe(
      "Arrojadiza"
    );
  });

  it("calcula la fórmula visual crítica duplicando dados simples, compuestos y sumando dados extra", () => {
    expect(calcularFormulaCriticoVisual("1d8", 5, 0)).toBe("2d8+5");
    expect(calcularFormulaCriticoVisual("1d10", 5, 1)).toBe("3d10+5");
    expect(calcularFormulaCriticoVisual("1d12 / 1d6+1", 4, 0)).toBe("2d12+4 / 2d6+1");
  });

  it("extrae nota de fallo para la maestría Graze (Rozar)", () => {
    expect(obtenerResumenMaestriaVisual("Graze (Rozar)", 4)).toEqual({
      etiqueta: "Graze (Rozar)",
      icono: "swords",
      notaFallo: "Fallo: 4 dmg"
    });
    expect(obtenerResumenMaestriaVisual("Slow (Ralentizar)", 3)).toEqual({
      etiqueta: "Slow (Ralentizar)",
      icono: "hourglass"
    });
  });
});

describe("TarjetaAtaquePersonaje v2 — El Dato como Botón y Modo Crítico", () => {
  it("renderiza arma versátil con bloques IMPACTO (+8) y DAÑO 1M | 2 MANOS, maestría y alcance limpio", () => {
    const html = renderToStaticMarkup(
      <TarjetaAtaquePersonaje
        ataque={ataqueEspadaLarga}
        alTirarAtaque={vi.fn()}
        alTirarDano={vi.fn()}
        alCambiarCaracteristica={vi.fn()}
      />
    );

    expect(html).toContain("Espada Larga +1");
    expect(html).toContain("Magia +1");
    expect(html).toContain("Cuerpo a cuerpo · Alcance 5 ft");
    expect(html).not.toContain("5/5 ft");
    expect(html).toContain("Sap (Debilitar)");
    expect(html).toContain("1d20 + 8");
    expect(html).toContain("+8");
    expect(html).toContain("Daño 1M");
    expect(html).toContain("1d8+5");
    expect(html).toContain("2 Manos");
    expect(html).toContain("1d10+5");
    // No repite el chip "ACCIÓN" en armas estándar
    expect(html).not.toContain(">Acción<");
  });

  it("duplica visualmente los dados en 1M y 2M cuando modoCritico está activo", () => {
    const html = renderToStaticMarkup(
      <TarjetaAtaquePersonaje
        ataque={ataqueEspadaLarga}
        modoCritico={true}
        alTirarAtaque={vi.fn()}
        alTirarDano={vi.fn()}
        alCambiarCaracteristica={vi.fn()}
      />
    );

    expect(html).toContain('data-critico="true"');
    expect(html).toContain("Crit 1M");
    expect(html).toContain("2d8+5");
    expect(html).toContain("Crit 2M");
    expect(html).toContain("2d10+5");
  });

  it("renderiza barra de munición con contador de capacidad y controles -1 / +1 en armas a distancia", () => {
    const html = renderToStaticMarkup(
      <TarjetaAtaquePersonaje
        ataque={ataqueArcoLargo}
        alTirarAtaque={vi.fn()}
        alTirarDano={vi.fn()}
        alCambiarCaracteristica={vi.fn()}
        alAjustarMunicion={vi.fn()}
      />
    );

    expect(html).toContain("Arco Largo Táctico");
    expect(html).toContain("A distancia · Rango 150/600 ft");
    expect(html).toContain("Carcaj (Flechas):");
    expect(html).toContain(">18<");
    expect(html).toContain("/ 20");
    expect(html).toContain(">-1<");
    expect(html).toContain(">+1<");
  });

  it("deduplica rango en arma improvisada no competente y muestra caja pasiva en Golpe sin Armas", () => {
    const htmlImprov = renderToStaticMarkup(
      <TarjetaAtaquePersonaje
        ataque={ataqueImprovisado}
        alTirarAtaque={vi.fn()}
        alTirarDano={vi.fn()}
        alCambiarCaracteristica={vi.fn()}
      />
    );

    expect(htmlImprov).toContain("No Competente");
    expect(htmlImprov).toContain("Cuerpo a cuerpo · 5 ft (20/60 ft arrojadiza)");
    expect(htmlImprov).toContain(">Arrojadiza<");

    const htmlDesarmado = renderToStaticMarkup(
      <TarjetaAtaquePersonaje
        ataque={ataqueDesarmado}
        modoCritico={true}
        alTirarAtaque={vi.fn()}
        alTirarDano={vi.fn()}
      />
    );

    expect(htmlDesarmado).toContain("Daño Fijo");
    expect(htmlDesarmado).toContain("Sin tirada");
    // Daño fijo pasivo nunca entra en estado crítico visual ni renderiza botón de daño
    expect(htmlDesarmado).not.toContain('data-critico="true"');
    expect(htmlDesarmado).not.toContain("Tirar daño");
  });

  it("renderiza la nota de fallo de Graze (Rozar) cuando el modificador de ataque es positivo", () => {
    const mandoble: AtaquePersonajeCalculado = {
      ...ataqueEspadaLarga,
      id: "arma-mandoble",
      nombre: "Mandoble de Batalla",
      dadoDano: "2d6+4",
      dadoDanoBase: "2d6",
      modificadorDano: 4,
      danoVersatil: undefined,
      dadoVersatilBase: undefined,
      propiedades: ["Pesada", "A dos manos"],
      maestria: "Graze (Rozar)",
      esMagico: false
    };

    const html = renderToStaticMarkup(
      <TarjetaAtaquePersonaje
        ataque={mandoble}
        modAtributoAtaque={4}
        alTirarAtaque={vi.fn()}
        alTirarDano={vi.fn()}
      />
    );

    expect(html).toContain("Graze (Rozar)");
    expect(html).toContain("Fallo: 4 dmg");
  });
});

describe("SeccionAtaquesFisicos — Divisor Ligero con Toggle Global Crítico (×2 Dados)", () => {
  const pjBase: PersonajeJugador = {
    ...PERSONAJE_POR_DEFECTO,
    id: "pj-guerrero-test",
    nombre: "Valerius"
  };

  it("renderiza el divisor ligero con toggle de crítico con aria-pressed y conserva el toggle en vista filtrada", () => {
    const html = renderToStaticMarkup(
      <SeccionAtaquesFisicos
        ataquesFisicos={[ataqueEspadaLarga, ataqueDesarmado]}
        personajeActivo={pjBase}
        statsCalculadas={null}
        alTirarAtaque={vi.fn()}
        alTirarDano={vi.fn()}
        alTirarCritico={vi.fn()}
        alCambiarCaracteristica={vi.fn()}
      />
    );

    expect(html).toContain("Armas y Maestría</h3>");
    expect(html).not.toContain("Clic para mostrar u ocultar armas");
    expect(html).not.toContain("Ataques con Armas &amp; Maestría");
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain("Crítico (×2 Dados)");

    const htmlFiltrado = renderToStaticMarkup(
      <SeccionAtaquesFisicos
        ataquesFisicos={[ataqueEspadaLarga]}
        personajeActivo={pjBase}
        statsCalculadas={null}
        mostrarDivisor={false}
        alTirarAtaque={vi.fn()}
        alTirarDano={vi.fn()}
        alTirarCritico={vi.fn()}
        alCambiarCaracteristica={vi.fn()}
      />
    );

    expect(htmlFiltrado).not.toContain("Armas y Maestría");
    expect(htmlFiltrado).toContain("Crítico (×2 Dados)");
  });
});
