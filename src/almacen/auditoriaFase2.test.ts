import { describe, it, expect, beforeEach } from "vitest";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";

describe("Auditoría Fase 2: Estado Global, Persistencia, Recursos y Selectores", () => {
  const idPjTest = "pj-auditoria-fase2";

  beforeEach(() => {
    const pjInicial: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      id: idPjTest,
      nombre: "Héroe Auditoría",
      nivel: 5,
      hpMaximo: 40,
      hpActual: 40,
      hpTemporal: 0,
      esLanzador: true,
      clasesLanzadoras: [
        {
          clase: "Mago",
          nivel: 5,
          tipoLanzador: "completo",
          habilidadConjuro: "inteligencia",
          modeloConjuros: "grimorio",
          listaConjuros: "mago"
        }
      ],
      espaciosConjuroMaximos: { "1": 4, "2": 3, "3": 2 },
      espaciosConjuroGastados: {},
      rasgos: [
        {
          id: "rasgo-recurso-intacto",
          nombre: "Canalizar Divinidad",
          descripcion: "Recurso de prueba intacto",
          origen: "clase",
          fuente: "Clérigo",
          tipoAccion: "especial",
          recuperacion: "descanso_corto",
          personalizado: false,
          notas: "",
          nivelRequerido: 2,
          esActivable: true,
          activo: false,
          tieneUsosLimitados: true,
          usosMaximos: 4,
          usosRestantes: undefined // Estado intacto al 100%
        },
        {
          id: "rasgo-bastion-arcano",
          nombre: "Bastión Arcano",
          descripcion: "Recarga con espacio de conjuro",
          origen: "subclase",
          fuente: "Mago",
          tipoAccion: "accion_adicional",
          recuperacion: "descanso_largo",
          tieneUsosLimitados: false,
          personalizado: false,
          notas: "",
          nivelRequerido: 2,
          multiplicadorRecargaEspacio: 2
        }
      ] as RasgoPersonaje[]
    };

    usarAlmacenDM.setState({
      personajes: [pjInicial],
      idPersonajeActivo: idPjTest,
      colaIniciativa: []
    });
  });

  it("[F2-01] recuperarUsoRasgoPersonaje sobre rasgo intacto (usosRestantes: undefined) preserva el máximo y no degrada a 1", () => {
    const { recuperarUsoRasgoPersonaje } = usarAlmacenDM.getState();

    // Invocar recuperación de 1 uso sobre un recurso que estaba intacto (undefined)
    recuperarUsoRasgoPersonaje(idPjTest, "rasgo-recurso-intacto", 1);

    const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === idPjTest);
    const rasgo = pj?.rasgos.find((r) => r.id === "rasgo-recurso-intacto");

    // Con el fallo previo, 'usosRestantes ?? 0' evaluaba a 0 + 1 = 1.
    // Con la corrección defensiva, evalúa a Math.min(4, 4 + 1) = 4.
    expect(rasgo?.usosRestantes).toBe(4);
  });

  it("[F2-04] recargarRasgoConEspacio no otorga PG temporales si el personaje no dispone de espacios de conjuro", () => {
    const { recargarRasgoConEspacio } = usarAlmacenDM.getState();

    // Consumir intencionalmente todos los espacios de nivel 3
    usarAlmacenDM.setState((s) => ({
      personajes: s.personajes.map((p) =>
        p.id === idPjTest
          ? { ...p, espaciosConjuroGastados: { "3": 2 } }
          : p
      )
    }));

    // Intentar recargar Bastión Arcano con un espacio de nivel 3 (agotado)
    recargarRasgoConEspacio(idPjTest, "rasgo-bastion-arcano", 3);

    const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === idPjTest);
    expect(pj?.hpTemporal).toBe(0); // No debe haberse otorgado vida temporal gratuita
  });

  it("[F2-04] recargarRasgoConEspacio consume el espacio y otorga PG temporales cuando sí hay espacios disponibles", () => {
    const { recargarRasgoConEspacio } = usarAlmacenDM.getState();

    // Recargar con espacio de nivel 1 (tiene 4 disponibles)
    recargarRasgoConEspacio(idPjTest, "rasgo-bastion-arcano", 1);

    const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === idPjTest);
    // Espacios nivel 1 gastados = 1
    expect(pj?.espaciosConjuroGastados?.["1"]).toBe(1);
    // Vida temporal = 1 * multiplicador (2) = 2
    expect(pj?.hpTemporal).toBe(2);
  });

  it("[F2-06] guardarEncuentroActual y cargarEncuentro usan copias profundas aisladas", () => {
    const { agregarCriaturaAIniciativa, guardarEncuentroActual, cargarEncuentro } = usarAlmacenDM.getState();

    agregarCriaturaAIniciativa("Goblin Explorador", 14, 7, 15, true, "30 pies", 2);
    const guardadoExitoso = guardarEncuentroActual("Encuentro Bosque");
    expect(guardadoExitoso).toBe(true);

    // Modificar la criatura en la cola activa
    const criaturaId = usarAlmacenDM.getState().colaIniciativa[0].id;
    usarAlmacenDM.getState().modificarVidaCriaturaIniciativa(criaturaId, 1);

    // Verificar que en el encuentro guardado la criatura NO sufrió la mutación de la cola activa
    const encuentro = usarAlmacenDM.getState().encuentrosGuardados.find((e) => e.nombre === "Encuentro Bosque");
    expect(encuentro?.cola[0].vidaActual).toBe(7);

    // Cargar el encuentro y verificar aislamiento de la copia
    cargarEncuentro("Encuentro Bosque");
    expect(usarAlmacenDM.getState().colaIniciativa[0].vidaActual).toBe(7);
  });
});
