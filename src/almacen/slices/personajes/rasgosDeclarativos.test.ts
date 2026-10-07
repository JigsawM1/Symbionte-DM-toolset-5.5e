import { beforeEach, describe, expect, it } from "vitest";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import type { RasgoPersonaje } from "@/tipos";
import { obtenerRasgosClaseYSubclase } from "@/servicios/gestorClases";
import { coincideCondicionConRasgo, desactivarRasgosPorCondicionOEfecto } from "./condicionesRasgosHelpers";

function rasgo(cambios: Partial<RasgoPersonaje>): RasgoPersonaje {
  return { id: "poder", nombre: "Poder propio", descripcion: "", origen: "personalizado", fuente: "Homebrew", tipoAccion: "especial",
    tieneUsosLimitados: false, recuperacion: "ninguno", personalizado: true, activo: false, esActivable: true, notas: "", ...cambios };
}

describe("Rasgos declarativos en el estado del personaje", () => {
  beforeEach(() => usarAlmacenDM.setState({ personajes: [], idPersonajeActivo: "" }));

  it("bloquea y desactiva hijos por ligadoA con nombres propios", () => {
    const padre = rasgo({ id: "padre", nombre: "Estado propio", condicionAlActivar: "Estado luminoso" });
    const hijo = rasgo({ id: "hijo", nombre: "Beneficio propio", ligadoA: "padre" });
    const independiente = rasgo({ id: "parecido", nombre: "Furia divina", ligadoA: "otro_padre", activo: true });
    const id = usarAlmacenDM.getState().crearPersonaje({ ...PERSONAJE_POR_DEFECTO, rasgos: [padre, hijo, independiente] });
    const estado = usarAlmacenDM.getState();
    const leer = (clave: string) => usarAlmacenDM.getState().personajes.find((p) => p.id === id)?.rasgos.find((r) => r.id === clave);
    estado.alternarActivoRasgo(id, "hijo");
    expect(leer("hijo")?.activo).toBe(false);
    estado.alternarActivoRasgo(id, "padre");
    estado.alternarActivoRasgo(id, "hijo");
    expect(leer("hijo")?.activo).toBe(true);
    estado.alternarActivoRasgo(id, "padre");
    expect(leer("hijo")?.activo).toBe(false);
    expect(leer("parecido")?.activo).toBe(true);
  });

  it("usa las condiciones declaradas y los alias del catálogo para apagar dependencias", () => {
    const padre = rasgo({ id: "padre", nombre: "Nombre ajeno", condicionAlActivar: "Furia (Rage)", activo: true });
    const hijo = rasgo({ id: "hijo", nombre: "Beneficio", ligadoA: "padre", activo: true });
    expect(coincideCondicionConRasgo("rage", padre)).toBe(true);
    expect(coincideCondicionConRasgo("Furia de los Dioses", padre)).toBe(false);
    expect(desactivarRasgosPorCondicionOEfecto("rage", [padre, hijo]).map((r) => r.activo)).toEqual([false, false]);
  });

  it("mantiene el máximo de invocaciones según el nivel de Brujo en multiclase", () => {
    const invocaciones = obtenerRasgosClaseYSubclase("Brujo", 3).find((r) => r.selectores?.some((s) => s.tipoSelector === "invocacion"))!;
    const id = usarAlmacenDM.getState().crearPersonaje({ ...PERSONAJE_POR_DEFECTO,
      clase: "Brujo", nivel: 20, clases: [{ nombre: "Brujo", subclase: "", nivel: 3 }, { nombre: "Guerrero", subclase: "", nivel: 17 }], rasgos: [invocaciones] });
    const selector = invocaciones.selectores![0];
    usarAlmacenDM.getState().actualizarSeleccionRasgo(id, invocaciones.id, selector.id, ["pacto_del_grimorio"]);
    const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === id)!;
    expect(pj.rasgos.find((r) => r.id === invocaciones.id)?.selectores?.[0].maxSelecciones).toBe(3);
  });
});
