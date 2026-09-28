import { describe, it, expect } from "vitest";
import { importarDesdeJSON } from "./importadorJSON";
import {
  IDS_INICIALES_MONSTRUOS,
  IDS_INICIALES_HECHIZOS,
  IDS_INICIALES_OBJETOS,
  MONSTRUOS_INICIALES,
  HECHIZOS_INICIALES,
  OBJETOS_INICIALES,
} from "@/utiles/datosIniciales";
import type { MonstruoBase, HechizoBase, ObjetoHomebrew } from "@/tipos";

describe("Filtrado y Exportación/Importación de Homebrew", () => {
  it("excluye los registros oficiales de fábrica y solo conserva entidades homebrew", () => {
    // 1. Simular base de datos combinada (compendio oficial + creaciones homebrew)
    const monstruoCustom: MonstruoBase = {
      ...MONSTRUOS_INICIALES[0],
      id: "m_custom_dragon_cristal",
      nombre: "Dragón de Cristal Antiguo",
      tipo: "Dragón",
      ca: 19,
      vidaMaxima: 220,
      iniciativaBonificador: 2,
    };

    const hechizoCustom: HechizoBase = {
      id: "h_custom_rayo_astral",
      nombre: "Rayo Astral",
      nivel: 3,
      escuela: "Evocación",
      tiempoLanzamiento: "1 acción",
      alcance: "120 pies",
      descripcion: "Dispara un rayo de energía cósmica.",
      concentracion: false,
      ritual: false,
      componentesSeleccionados: { verbal: true, somatico: true, material: false },
    };

    const objetoCustom: ObjetoHomebrew = {
      ...OBJETOS_INICIALES[0],
      id: "o_custom_anillo_vórtice",
      nombre: "Anillo del Vórtice",
      categoria: "objetos-magicos",
      rareza: "Raro",
      descripcion: "Permite manipular corrientes de aire.",
      pesoLb: 0.1,
      valorPO: 500,
      propiedades: ["Sintonización"],
      esMagico: true,
      sintonizacionRequerida: true,
      efectosPasivos: [],
      hechizosVinculados: [],
      esConsumible: false,
      equipable: true,
    };

    const baseDatosMonstruos: MonstruoBase[] = [...MONSTRUOS_INICIALES, monstruoCustom];
    const baseDatosHechizos: HechizoBase[] = [...HECHIZOS_INICIALES, hechizoCustom];
    const objetosHomebrew: ObjetoHomebrew[] = [...OBJETOS_INICIALES, objetoCustom];

    // 2. Aplicar el filtrado canónico de ConfiguracionDM
    const monstruosHomebrew = baseDatosMonstruos.filter((m) => !IDS_INICIALES_MONSTRUOS.has(m.id));
    const hechizosHomebrew = baseDatosHechizos.filter((h) => !IDS_INICIALES_HECHIZOS.has(h.id));
    const objetosHomebrewSolo = objetosHomebrew.filter((o) => !IDS_INICIALES_OBJETOS.has(o.id));

    // Validar que ninguno de los elementos iniciales esté en los arrays filtrados
    expect(monstruosHomebrew).toHaveLength(1);
    expect(monstruosHomebrew[0].id).toBe("m_custom_dragon_cristal");

    expect(hechizosHomebrew).toHaveLength(1);
    expect(hechizosHomebrew[0].id).toBe("h_custom_rayo_astral");

    expect(objetosHomebrewSolo).toHaveLength(1);
    expect(objetosHomebrewSolo[0].id).toBe("o_custom_anillo_vórtice");

    // 3. Estructura exacta exportada por ConfiguracionDM
    const datosExportacion = {
      version: "5.5",
      fechaExportacion: new Date().toISOString(),
      monstruos: monstruosHomebrew,
      hechizos: hechizosHomebrew,
      objetos: objetosHomebrewSolo,
    };

    // Verificar que el compendio base oficial no está presente en los datos exportados
    expect(datosExportacion.monstruos.some((m) => IDS_INICIALES_MONSTRUOS.has(m.id))).toBe(false);
    expect(datosExportacion.hechizos.some((h) => IDS_INICIALES_HECHIZOS.has(h.id))).toBe(false);
    expect(datosExportacion.objetos.some((o) => IDS_INICIALES_OBJETOS.has(o.id))).toBe(false);

    // 4. Verificar que el importador procesa el archivo de exportación correctamente
    const resultadoImportacion = importarDesdeJSON(datosExportacion, {
      baseDatosMonstruos: MONSTRUOS_INICIALES,
      baseDatosHechizos: HECHIZOS_INICIALES,
      objetosHomebrew: OBJETOS_INICIALES,
    });

    expect(resultadoImportacion.modificado).toBe(true);
    expect(resultadoImportacion.baseDatosMonstruos.some((m) => m.id === "m_custom_dragon_cristal")).toBe(true);
    expect(resultadoImportacion.baseDatosHechizos.some((h) => h.id === "h_custom_rayo_astral")).toBe(true);
    expect(resultadoImportacion.objetosHomebrew.some((o) => o.id === "o_custom_anillo_vórtice")).toBe(true);
  });

  it("importa correctamente backups con claves alternativas (compatibilidad legacy y blob)", () => {
    const backupConClavesLegacy = {
      version: "5.5",
      fechaExportacion: new Date().toISOString(),
      baseDatosMonstruos: [
        {
          nombre: "Goblin Piromante",
          tipo: "Humanoide",
          ca: 14,
          vidaMaxima: 22,
        },
      ],
      baseDatosHechizos: [
        {
          nombre: "Chispa Errática",
          nivel: 1,
          escuela: "Evocación",
          tiempoLanzamiento: "1 acción",
          alcance: "60 pies",
          descripcion: "Genera chispas que saltan.",
        },
      ],
      objetosHomebrew: [
        {
          nombre: "Báculo de Cenizas",
          categoria: "bastones",
          rareza: "Poco común",
          descripcion: "Un bastón chamuscado.",
        },
      ],
    };

    const resultado = importarDesdeJSON(backupConClavesLegacy, {
      baseDatosMonstruos: [],
      baseDatosHechizos: [],
      objetosHomebrew: [],
    });

    expect(resultado.modificado).toBe(true);
    expect(resultado.baseDatosMonstruos).toHaveLength(1);
    expect(resultado.baseDatosMonstruos[0].nombre).toBe("Goblin Piromante");
    expect(resultado.baseDatosHechizos).toHaveLength(1);
    expect(resultado.baseDatosHechizos[0].nombre).toBe("Chispa Errática");
    expect(resultado.objetosHomebrew).toHaveLength(1);
    expect(resultado.objetosHomebrew[0].nombre).toBe("Báculo de Cenizas");
  });
});
