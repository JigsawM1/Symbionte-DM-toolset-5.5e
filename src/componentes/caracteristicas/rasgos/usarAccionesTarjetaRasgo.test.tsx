import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EsquemaRasgoPersonaje } from "@/tipos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { usarAccionesTarjetaRasgo } from "./usarAccionesTarjetaRasgo";

describe("Confirmación compartida de recuperación", () => {
  afterEach(() => { vi.restoreAllMocks(); });

  const rasgoRecuperacion = EsquemaRasgoPersonaje.parse({
    id: "rasgo_cls_mago_recuperacion_arcana",
    nombre: "Recuperación arcana",
    categoriaMecanica: "consumible",
    tieneUsosLimitados: true,
    usosMaximos: 1,
    usosRestantes: 1
  });

  it.each([false, true])("recupera antes de gastar una vez y respeta el callback explícito: %s", (usarCallback) => {
    const eventos: string[] = [];
    const estado = usarAlmacenDM.getState();
    vi.spyOn(estado, "recuperarEspacioConjuro").mockImplementation((id, nivel) => { eventos.push(`${id}:espacio:${nivel}`); });
    vi.spyOn(estado, "recuperarPuntosConjuro").mockImplementation((id, puntos) => { eventos.push(`${id}:puntos:${puntos}`); });
    vi.spyOn(estado, "gastarUsoRasgoPersonaje").mockImplementation((id, rasgo, cantidad) => { eventos.push(`${id}:${rasgo}:gasto:${cantidad}`); });
    vi.spyOn(estado, "agregarNotificacion").mockImplementation((mensaje, tipo) => { eventos.push(`${tipo}:${mensaje}`); });
    const alGastarUso = (cantidad?: number): void => { eventos.push(`callback:${cantidad}`); };
    const captura: { acciones?: ReturnType<typeof usarAccionesTarjetaRasgo> } = {};
    const Capturar = () => {
      captura.acciones = usarAccionesTarjetaRasgo({ rasgo: rasgoRecuperacion, nombrePersonaje: "Gale", idPersonaje: "pj", alGastarUso });
      return null;
    };
    renderToStaticMarkup(<Capturar />);
    captura.acciones!.manejarConfirmarRecuperacion({ 2: 1, 1: 2 }, 1, usarCallback ? alGastarUso : undefined);
    expect(eventos).toEqual([
      "pj:espacio:1", "pj:espacio:1", "pj:espacio:2", "pj:puntos:1",
      usarCallback ? "callback:1" : "pj:rasgo_cls_mago_recuperacion_arcana:gasto:1",
      "exito:¡Recuperación arcana! Se han recuperado 3 espacios de conjuro y 1 punto de conjuro."
    ]);
  });

  it.each<{ idPersonaje: string | undefined; espacios: Record<number, number>; puntos: number }>([
    { idPersonaje: undefined, espacios: { 1: 1 }, puntos: 1 },
    { idPersonaje: "pj", espacios: {}, puntos: 0 },
    { idPersonaje: "pj", espacios: { 1: 0 }, puntos: 0 }
  ])("no recupera, gasta ni notifica sin ID o selección: %j", ({ idPersonaje, espacios, puntos }) => {
    const estado = usarAlmacenDM.getState();
    const llamadas = ["recuperarEspacioConjuro", "recuperarPuntosConjuro", "gastarUsoRasgoPersonaje", "agregarNotificacion"] as const;
    const espias = llamadas.map(nombre => vi.spyOn(estado, nombre));
    const alGastarUso = vi.fn<[cantidad?: number], void>();
    const captura: { acciones?: ReturnType<typeof usarAccionesTarjetaRasgo> } = {};
    const Capturar = () => {
      captura.acciones = usarAccionesTarjetaRasgo({ rasgo: rasgoRecuperacion, nombrePersonaje: "Gale", idPersonaje, alGastarUso });
      return null;
    };
    renderToStaticMarkup(<Capturar />);
    captura.acciones!.manejarConfirmarRecuperacion(espacios, puntos, alGastarUso);
    for (const espia of [...espias, alGastarUso]) expect(espia).not.toHaveBeenCalled();
  });

});
