import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RecuperarUsosConEspacio } from "./RecuperarUsosConEspacio";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";

describe("RecuperarUsosConEspacio (Patrón Strategy)", () => {
  const rasgoInspiracion: RasgoPersonaje = {
    id: "rasgo_cls_bardo_inspiracion_bardica",
    nombre: "Inspiración bárdica",
    descripcion: "Puedes inspirar a otros mediante tus palabras o música.",
    tipoAccion: "accion_adicional",
    categoriaMecanica: "consumible",
    tieneUsosLimitados: true,
    usosMaximos: 4,
    usosRestantes: 1,
    recuperacion: "descanso_corto",
    recuperarUsosConEspacio: 1,
    origen: "clase",
    fuente: "Bardo (Nivel 1)",
    personalizado: false,
    activo: true,
    notas: ""
  };

  const personajeBase: PersonajeJugador = {
    ...PERSONAJE_POR_DEFECTO,
    id: "pj-bardo-test",
    nombre: "Bardo de prueba",
    clase: "Bardo",
    nivel: 5,
    espaciosConjuroMaximos: { "1": 4, "2": 3, "3": 2 },
    espaciosConjuroGastados: { "1": 1 },
    puntosConjuroMaximos: 27,
    puntosConjuroGastados: 0,
    rasgos: [rasgoInspiracion]
  };

  it("renderiza el botón de activación con la estrategia tradicional de espacios", () => {
    usarAlmacenDM.setState({
      personajes: [personajeBase],
      idPersonajeActivo: personajeBase.id,
      sistemaMagia: "espacios"
    });

    const html = renderToStaticMarkup(
      <RecuperarUsosConEspacio personaje={personajeBase} rasgo={rasgoInspiracion} />
    );

    expect(html).toContain("Recuperar uso");
    expect(html).toContain("Gastar un espacio para recuperar usos");
  });

  it("renderiza el botón de activación adaptado a la estrategia de puntos cuando sistemaMagia es puntos", () => {
    usarAlmacenDM.setState({
      personajes: [personajeBase],
      idPersonajeActivo: personajeBase.id,
      sistemaMagia: "puntos"
    });

    const html = renderToStaticMarkup(
      <RecuperarUsosConEspacio personaje={personajeBase} rasgo={rasgoInspiracion} />
    );

    expect(html).toContain("Recuperar uso");
    expect(html).toContain("Gastar puntos para recuperar usos");
  });

  it("deshabilita el botón si la reserva de usos ya se encuentra al máximo", () => {
    const rasgoLleno = { ...rasgoInspiracion, usosRestantes: 4 };
    const pjLleno = { ...personajeBase, rasgos: [rasgoLleno] };
    usarAlmacenDM.setState({
      personajes: [pjLleno],
      idPersonajeActivo: pjLleno.id,
      sistemaMagia: "espacios"
    });

    const html = renderToStaticMarkup(
      <RecuperarUsosConEspacio personaje={pjLleno} rasgo={rasgoLleno} />
    );

    expect(html).toContain("disabled");
  });

  it("deshabilita el botón en modo puntos si los puntos disponibles son inferiores al coste del siguiente uso escalonado", () => {
    // Si ya se han recuperado 2 usos previos (m = 2), el siguiente uso cuesta (2 + 1) * 2 = 6 puntos
    const rasgoConPrevios = { ...rasgoInspiracion, usosRestantes: 1, usosRecuperadosConPuntos: 2 };
    // Solo le quedan 4 puntos disponibles (insuficiente para pagar 6)
    const pjConPocosPuntos = {
      ...personajeBase,
      puntosConjuroMaximos: 20,
      puntosConjuroGastados: 16,
      rasgos: [rasgoConPrevios]
    };
    usarAlmacenDM.setState({
      personajes: [pjConPocosPuntos],
      idPersonajeActivo: pjConPocosPuntos.id,
      sistemaMagia: "puntos"
    });

    const html = renderToStaticMarkup(
      <RecuperarUsosConEspacio personaje={pjConPocosPuntos} rasgo={rasgoConPrevios} />
    );

    expect(html).toContain("disabled");
  });
});
