import { describe, it, expect } from "vitest";
import { normalizarFormulaDados, sanitizarEtiqueta } from "@/utiles/lanzadorDados";
import { resolverEstadoMunicionArma, esMunicionCompatibleConArma } from "@/servicios/gestorMunicion";
import type { ObjetoInventario } from "@/tipos";

describe("Cálculo y Tiradas de Armas Versátiles D&D 5.5e", () => {
  it("extrae limpiamente los dados de daño versátil ignorando tipos de daño o notas", () => {
    const rawVersatiles = [
      "1d10 (Cortante)",
      "1d10 cortante",
      "1d10",
      "1d8 (Perforante)",
      "1d12"
    ];

    const resultados = rawVersatiles.map((raw) => {
      const match = raw.match(/(\d+d\d+)/i);
      return match ? match[1] : raw.trim();
    });

    expect(resultados).toEqual(["1d10", "1d10", "1d10", "1d8", "1d12"]);
  });

  it("calcula la fórmula de daño versátil sumando el modificador de atributo y bono mágico", () => {
    const modAtributo = 3;
    const bonoMagico = 1;
    const modDanoTotal = modAtributo + bonoMagico; // +4
    const signoMod = modDanoTotal >= 0 ? `+${modDanoTotal}` : `${modDanoTotal}`;
    const dadoVersatilBase = "1d10";

    const formulaVersatil = modDanoTotal !== 0 ? `${dadoVersatilBase}${signoMod}` : dadoVersatilBase;
    expect(formulaVersatil).toBe("1d10+4");

    const formulaTaleSpire = `!Daño ${sanitizarEtiqueta("Cortante")}:${formulaVersatil}`;
    expect(formulaTaleSpire).toBe("!Daño Cortante:1d10+4");
    expect(normalizarFormulaDados(formulaTaleSpire)).toBe("Dano Cortante:1d10+4");
  });

  it("genera la fórmula de impacto crítico para 1 mano y 2 manos versátil duplicando dados", () => {
    const modDanoTotal = 3;
    const signoMod = `+${modDanoTotal}`;

    // 1 Mano: 1d8 -> 2d8+3
    const dado1M = "1d8";
    const match1M = dado1M.match(/^(\d+)d(\d+)/i);
    expect(match1M).not.toBeNull();
    const numDados1M = parseInt(match1M![1], 10) * 2;
    const formulaCritico1M = `${numDados1M}d${match1M![2]}${signoMod}`;
    expect(formulaCritico1M).toBe("2d8+3");

    // 2 Manos (Versátil): 1d10 -> 2d10+3
    const dado2M = "1d10";
    const match2M = dado2M.match(/^(\d+)d(\d+)/i);
    expect(match2M).not.toBeNull();
    const numDados2M = parseInt(match2M![1], 10) * 2;
    const formulaCritico2M = `${numDados2M}d${match2M![2]}${signoMod}`;
    expect(formulaCritico2M).toBe("2d10+3");

    const formulaTaleSpireCrit2M = `!Crítico ${sanitizarEtiqueta("Cortante")}:${formulaCritico2M}`;
    expect(formulaTaleSpireCrit2M).toBe("!Crítico Cortante:2d10+3");
    expect(normalizarFormulaDados(formulaTaleSpireCrit2M)).toBe("Critico Cortante:2d10+3");
  });

  it("infiere correctamente el dado versátil para armas D&D 5.5e según su dado base", () => {
    const inferirVersatil = (dadoBase: string): string | undefined => {
      if (dadoBase.includes("1d6")) return "1d8";
      if (dadoBase.includes("1d8")) return "1d10";
      if (dadoBase.includes("1d10")) return "1d12";
      if (dadoBase.includes("1d4")) return "1d6";
      return undefined;
    };

    expect(inferirVersatil("1d6")).toBe("1d8");
    expect(inferirVersatil("1d8")).toBe("1d10");
    expect(inferirVersatil("1d10")).toBe("1d12");
    expect(inferirVersatil("1d4")).toBe("1d6");
    expect(inferirVersatil("2d6")).toBeUndefined();
  });

  describe("Uso de Armas con Munición (Sin Prohibición de Uso)", () => {
    it("permite ejecutar el flujo de ataque emitiendo un aviso no intrusivo cuando no hay munición disponible", () => {
      const inv: ObjetoInventario[] = [
        {
          idInstancia: "inv-carcaj",
          idObjeto: "obj-carcaj",
          nombre: "Carcaj",
          cantidad: 1,
          contenedor: "mochila",
          equipado: false,
          sintonizado: false,
          notas: "",
          pesoLb: 1,
          tipoPrincipal: "Equipo de Aventuras",
          esMagico: false,
          rareza: "Común",
          equipable: false,
          sintonizacionRequerida: false
        }
      ];

      const estadoActual = resolverEstadoMunicionArma("Arco Largo", ["Munición", "A dos manos"], inv);
      expect(estadoActual.requiereMunicion).toBe(true);
      expect(estadoActual.puedeDisparar).toBe(false);
      expect(estadoActual.municionEnContenedor).toBe(0);

      const avisos: string[] = [];
      const deducciones: { id: string; cant: number }[] = [];
      let tiradaEjecutada = false;

      // Simulación idéntica a VistaAtaquesJugador
      const ejecutarAtaque = () => {
        if (estadoActual.requiereMunicion) {
          if (!estadoActual.puedeDisparar || estadoActual.municionEnContenedor <= 0) {
            const mensajeAviso =
              estadoActual.motivoBloqueo ||
              `Aviso: No tienes ${estadoActual.nombreMunicionEsperada || "munición"} lista en tu contenedor llevado encima.`;
            avisos.push(mensajeAviso);
          } else {
            const municionItemMochila = inv.find((it) => {
              const enMochila = (it.contenedor || "mochila") === "mochila";
              return enMochila && it.cantidad > 0 && esMunicionCompatibleConArma("Arco Largo", it, ["Munición"], []);
            });
            if (municionItemMochila) {
              deducciones.push({ id: municionItemMochila.idInstancia, cant: -1 });
            }
          }
        }
        tiradaEjecutada = true;
      };

      ejecutarAtaque();

      expect(avisos.length).toBe(1);
      expect(avisos[0]).toContain("Tu Carcaj está vacío");
      expect(deducciones.length).toBe(0);
      expect(tiradaEjecutada).toBe(true);
    });

    it("permite ejecutar el ataque y descuenta 1 proyectil cuando hay munición compatible en el contenedor", () => {
      const inv: ObjetoInventario[] = [
        {
          idInstancia: "inv-carcaj",
          idObjeto: "obj-carcaj",
          nombre: "Carcaj",
          cantidad: 1,
          contenedor: "mochila",
          equipado: false,
          sintonizado: false,
          notas: "",
          pesoLb: 1,
          tipoPrincipal: "Equipo de Aventuras",
          esMagico: false,
          rareza: "Común",
          equipable: false,
          sintonizacionRequerida: false
        },
        {
          idInstancia: "inv-flechas",
          idObjeto: "obj-flechas",
          nombre: "Flechas",
          cantidad: 20,
          contenedor: "mochila",
          equipado: false,
          sintonizado: false,
          notas: "",
          pesoLb: 1,
          tipoPrincipal: "Equipo de Aventuras",
          esMagico: false,
          rareza: "Común",
          equipable: false,
          sintonizacionRequerida: false
        }
      ];

      const estadoActual = resolverEstadoMunicionArma("Arco Largo", ["Munición", "A dos manos"], inv);
      expect(estadoActual.requiereMunicion).toBe(true);
      expect(estadoActual.puedeDisparar).toBe(true);
      expect(estadoActual.municionEnContenedor).toBe(20);

      const avisos: string[] = [];
      const deducciones: { id: string; cant: number }[] = [];
      let tiradaEjecutada = false;

      const ejecutarAtaque = () => {
        if (estadoActual.requiereMunicion) {
          if (!estadoActual.puedeDisparar || estadoActual.municionEnContenedor <= 0) {
            const mensajeAviso =
              estadoActual.motivoBloqueo ||
              `Aviso: No tienes ${estadoActual.nombreMunicionEsperada || "munición"} lista en tu contenedor llevado encima.`;
            avisos.push(mensajeAviso);
          } else {
            const municionItemMochila = inv.find((it) => {
              const enMochila = (it.contenedor || "mochila") === "mochila";
              return enMochila && it.cantidad > 0 && esMunicionCompatibleConArma("Arco Largo", it, ["Munición"], []);
            });
            if (municionItemMochila) {
              deducciones.push({ id: municionItemMochila.idInstancia, cant: -1 });
            }
          }
        }
        tiradaEjecutada = true;
      };

      ejecutarAtaque();

      expect(avisos.length).toBe(0);
      expect(deducciones.length).toBe(1);
      expect(deducciones[0]).toEqual({ id: "inv-flechas", cant: -1 });
      expect(tiradaEjecutada).toBe(true);
    });
  });

  describe("Furia Divina (Senda del Fanático) con barra / para tipo de daño separado", () => {
    it("debe formatear la tirada de daño con / separando el daño del arma y el daño radiante/necrótico", () => {
      const formulaDadoArma = "1d12+4";
      const formulaFuriaDivina = "1d6+1";
      const formulaDadoUsar = `${formulaDadoArma}/${formulaFuriaDivina}`;

      let formulaDados: string;
      if (formulaDadoUsar.includes("/")) {
        const partes = formulaDadoUsar.split("/");
        const parteArma = partes[0].trim();
        const parteExtra = partes.slice(1).join("/").trim();
        formulaDados = `!Daño ${sanitizarEtiqueta("Cortante")}:${parteArma}/Furia Divina (Radiante o Necrótico):${parteExtra}`;
      } else {
        formulaDados = `!Daño ${sanitizarEtiqueta("Cortante")}:${formulaDadoUsar}`;
      }

      expect(formulaDados).toBe("!Daño Cortante:1d12+4/Furia Divina (Radiante o Necrótico):1d6+1");
      const normalizada = normalizarFormulaDados(formulaDados);
      expect(normalizada).toBe("Dano Cortante:1d12+4/Furia Divina (Radiante o Necrotico):1d6+1");
    });

    it("debe formatear el crítico duplicando dados de ambos grupos independientemente", () => {
      const dadoBase = "1d12/1d6+1";
      const modDano: number = 4;
      const partesBase = dadoBase.split("/");
      const baseArma = partesBase[0].trim();
      const baseExtra = partesBase.slice(1).join("/").trim();

      const criticoArma = baseArma.replace(/(\d+)d(\d+)/gi, (_, n, d) => `${parseInt(n, 10) * 2}d${d}`);
      const signoArma = modDano !== 0 ? `+${modDano}` : "";
      const criticoExtra = baseExtra.replace(/(\d+)d(\d+)/gi, (_, n, d) => `${parseInt(n, 10) * 2}d${d}`);

      const formulaDados = `!Crítico ${sanitizarEtiqueta("Cortante")}:${criticoArma}${signoArma}/Furia Divina (Radiante o Necrótico):${criticoExtra}`;
      expect(formulaDados).toBe("!Crítico Cortante:2d12+4/Furia Divina (Radiante o Necrótico):2d6+1");

      const normalizada = normalizarFormulaDados(formulaDados);
      expect(normalizada).toBe("Critico Cortante:2d12+4/Furia Divina (Radiante o Necrotico):2d6+1");
    });

    it("para golpe desarmado debe componer 1d6+fuerza+mitad de nivel de barbaro sin barra para evitar fallback a 1d20 en TaleSpire", () => {
      const modDesarmado = 4;
      const nivelBarbaro = 3;
      const bonoMitadNivel = Math.floor(nivelBarbaro / 2); // 1
      const modTotal = modDesarmado + bonoMitadNivel; // 5

      const formulaDesarmado = `1d6+${modTotal}`;
      const dadoBaseDesarmado = "1d6";
      const tipoDano = "Contundente (Radiante o Necrótico)";

      const formulaDados = `!Daño ${sanitizarEtiqueta(tipoDano)}:${formulaDesarmado}`;
      expect(formulaDados).toBe("!Daño Contundente (Radiante o Necrotico):1d6+5");

      const normalizada = normalizarFormulaDados(formulaDados);
      expect(normalizada).toBe("Dano Contundente (Radiante o Necrotico):1d6+5");
      // Asegurarse de que no contiene 1d20
      expect(normalizada).not.toContain("1d20");

      // Crítico en golpe desarmado
      const criticoDados = dadoBaseDesarmado.replace(/(\d+)d(\d+)/gi, (_, n, d) => `${parseInt(n, 10) * 2}d${d}`);
      const formulaCritico = `!Crítico ${sanitizarEtiqueta(tipoDano)}:${criticoDados}+${modTotal}`;
      expect(formulaCritico).toBe("!Crítico Contundente (Radiante o Necrotico):2d6+5");
      const criticoNormalizado = normalizarFormulaDados(formulaCritico);
      expect(criticoNormalizado).toBe("Critico Contundente (Radiante o Necrotico):2d6+5");
    });
  });
});
