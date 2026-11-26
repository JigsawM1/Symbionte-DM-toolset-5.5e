import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { aplicarBuildClaseAPersonaje } from "@/servicios/clases/buildClase";
import { EsquemaPersonajeJugador, EsquemaRasgoPersonaje } from "@/tipos";
import { ChipsSelectoresYDadosRasgo } from "./ChipsSelectoresYDadosRasgo";
import { ConfiguracionRespuestaPredefinida } from "./ConfiguracionRespuestaPredefinida";
import { ResolucionAsistidaRasgo } from "./ResolucionAsistidaRasgo";

describe("UI de respuestas predefinidas en rasgos", () => {
  it("muestra la píldora Auto y botón para restablecer en ChipsSelectoresYDadosRasgo", () => {
    const rasgo = EsquemaRasgoPersonaje.parse({
      id: "ataque_temerario",
      nombre: "Ataque temerario",
      preguntarAlAtacar: { soloArmaODesarmado: true },
      respuestaPredefinida: { alAtacar: "activar" }
    });
    const html = renderToStaticMarkup(<ChipsSelectoresYDadosRasgo rasgo={rasgo} idPersonaje="pj1" />);
    expect(html).toContain("Auto: Activar");
    expect(html).toContain('aria-label="Volver a preguntar siempre"');
  });

  it("muestra el botón de 1 clic en ResolucionAsistidaRasgo solo cuando no tiene coste", () => {
    const sinCoste = EsquemaRasgoPersonaje.parse({
      id: "aura_libre",
      nombre: "Aura libre",
      resolucionAsistida: {
        permitePropio: true,
        opciones: [{ id: "temp", etiqueta: "Escudo vital", tipo: "hp_temporal", formula: "5" }]
      },
      respuestaPredefinida: { resolucion: { idOpcion: "temp", propio: true } }
    });
    const pj = EsquemaPersonajeJugador.parse({ ...PERSONAJE_POR_DEFECTO, id: "pj1", rasgos: [sinCoste] });
    usarAlmacenDM.setState({ personajes: [pj], idPersonajeActivo: pj.id });

    const htmlUnClic = renderToStaticMarkup(<ResolucionAsistidaRasgo personaje={pj} rasgo={sinCoste} />);
    expect(htmlUnClic).toContain("Resolver: Escudo vital");
    expect(htmlUnClic).toContain('aria-label="Configurar resolución"');

    const conCoste = EsquemaRasgoPersonaje.parse({
      ...sinCoste,
      tieneUsosLimitados: true,
      usosMaximos: 2,
      usosRestantes: 2
    });
    const pjCoste = EsquemaPersonajeJugador.parse({ ...PERSONAJE_POR_DEFECTO, id: "pj2", rasgos: [conCoste] });
    const htmlModal = renderToStaticMarkup(<ResolucionAsistidaRasgo personaje={pjCoste} rasgo={conCoste} />);
    expect(htmlModal).toContain("Resolver capacidad");
    expect(htmlModal).not.toContain("Resolver: Escudo vital");
  });

  it("renderiza ConfiguracionRespuestaPredefinida en el detalle del rasgo", () => {
    const rasgo = EsquemaRasgoPersonaje.parse({
      id: "furia_divina",
      nombre: "Furia divina",
      resolucionAsistida: {
        integrarEnDanoDeArma: true,
        opciones: [{ id: "radiante", etiqueta: "Radiante", tipo: "dano", tipoDano: "Radiante", formula: "1d6" }]
      },
      respuestaPredefinida: { danoIntegrado: { modo: "automatico", idOpcion: "radiante" } }
    });
    const pj = EsquemaPersonajeJugador.parse({ ...PERSONAJE_POR_DEFECTO, id: "pj3", rasgos: [rasgo] });
    const html = renderToStaticMarkup(<ConfiguracionRespuestaPredefinida personaje={pj} rasgo={rasgo} />);
    expect(html).toContain("Respuesta automática");
    expect(html).toContain("Daño adicional al impactar");
    expect(html).toContain("Aplicar: Radiante");
  });

  it("resuelve extensiones de nivel (Golpe brutal nv 17) en el detalle y en la píldora", () => {
    const base = aplicarBuildClaseAPersonaje(
      { ...PERSONAJE_POR_DEFECTO, id: "pj-barbaro-17" },
      "Bárbaro",
      17,
      "Senda del Berserker"
    );
    const pj17 = {
      ...base,
      rasgos: base.rasgos.map(r => (r.nombre === "Golpe brutal"
        ? { ...r, respuestaPredefinida: { efectosTirada: ["desgarrador", "desestabilizador"] } }
        : r))
    };
    const golpeBrutal = pj17.rasgos.find(r => r.nombre === "Golpe brutal")!;
    usarAlmacenDM.setState({ personajes: [pj17], idPersonajeActivo: pj17.id });

    const htmlDetalle = renderToStaticMarkup(<ConfiguracionRespuestaPredefinida personaje={pj17} rasgo={golpeBrutal} />);
    expect(htmlDetalle).toContain("Golpe desgarrador");
    expect(htmlDetalle).toContain("Golpe desestabilizador");
    expect(htmlDetalle).toContain("Máx. 2");

    const htmlPildora = renderToStaticMarkup(<ChipsSelectoresYDadosRasgo rasgo={golpeBrutal} idPersonaje={pj17.id} />);
    expect(htmlPildora).toContain("Auto: Golpe desgarrador + Golpe desestabilizador");
  });
});
