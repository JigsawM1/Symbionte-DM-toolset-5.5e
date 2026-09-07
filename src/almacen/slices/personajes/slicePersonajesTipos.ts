import type {
  PersonajeJugador,
  Caracteristica,
  Habilidad,
  GradoCompetencia,
  ObjetoInventario,
  ObjetoJuego,
  BolsaMonedas,
  TipoMonedaClave,
  TipoContenedor,
  RasgoPersonaje,
  ClaseLanzadora,
  PersonalizacionHabilidad,
  PersonalizacionCaracteristica,
  OpcionesAplicarBuild
} from "@/tipos";
import type { ResultadoDescanso } from "@/servicios/procesadorDescansos";

// ==========================================
// 1. SUB-SLICES SEGREGADOS POR RESPONSABILIDAD
// ==========================================

export interface SubSlicePersonajesBase {
  personajes: PersonajeJugador[];
  idPersonajeActivo: string | null;

  crearPersonaje: (datosIniciales?: Partial<PersonajeJugador>) => string;
  actualizarPersonaje: (id: string, cambios: Partial<PersonajeJugador>) => void;
  aplicarBuildClasePersonaje: (
    id: string,
    claseNombre: string,
    nivel: number,
    subclaseNombre?: string,
    opciones?: OpcionesAplicarBuild
  ) => void;
  eliminarPersonaje: (id: string) => void;
  duplicarPersonaje: (id: string) => string;
  seleccionarPersonajeActivo: (id: string | null) => void;
  vincularMiniaturaTSPersonaje: (id: string, idMiniatura: string | null) => void;
}

export interface SubSliceVitalidad {
  modificarHPPersonaje: (id: string, delta: number) => void;
  aplicarCuracionPersonaje: (id: string, cantidad: number) => void;
  aplicarDanoPersonaje: (id: string, cantidad: number) => void;
  establecerHPActualPersonaje: (id: string, valor: number) => void;
  modificarHPMaximoEfectivoPersonaje: (id: string, nuevoMax: number) => void;
  modificarHPMaximoBasePersonaje: (id: string, nuevoBase: number) => void;
  modificarHPTemporalPersonaje: (id: string, valor: number) => void;
  gastarDadoGolpePersonaje: (id: string, tiradas?: number[]) => void;
  establecerDadosGolpeRestantesPersonaje: (id: string, valor: number) => void;
  ejecutarDescansoPersonaje: (
    id: string,
    tipo: "corto" | "largo",
    dadosAGastar?: number,
    tiradas?: number[]
  ) => ResultadoDescanso | null;
  alternarInspiracionPersonaje: (id: string) => void;
  modificarSalvacionesMuertePersonaje: (id: string, tipo: "exitos" | "fallos", delta: number) => void;
  establecerSalvacionesMuertePersonaje: (id: string, tipo: "exitos" | "fallos", valor: number) => void;
  reiniciarSalvacionesMuertePersonaje: (id: string) => void;
  modificarCansancioPersonaje: (id: string, delta: number) => void;
}

export interface SubSliceCaracteristicasHabilidades {
  modificarCaracteristicaBasePersonaje: (id: string, carac: Caracteristica, valor: number) => void;
  alternarSalvacionPersonaje: (id: string, carac: Caracteristica) => void;
  ciclarGradoHabilidadPersonaje: (id: string, hab: Habilidad) => void;
  establecerGradoHabilidadPersonaje: (id: string, hab: Habilidad, grado: GradoCompetencia) => void;
  personalizarHabilidadPersonaje: (
    id: string,
    hab: Habilidad,
    datos: Partial<PersonalizacionHabilidad>
  ) => void;
  personalizarCaracteristicaPersonaje: (
    id: string,
    carac: Caracteristica,
    datos: Partial<PersonalizacionCaracteristica>
  ) => void;
}

export interface SubSliceCondiciones {
  aplicarCondicionPersonaje: (id: string, condicion: string) => void;
  quitarCondicionPersonaje: (id: string, condicion: string) => void;
  limpiarCondicionesPersonaje: (id: string) => void;
}

export interface SubSliceMagia {
  configurarLanzadorConjuros: (
    id: string,
    config: {
      esLanzador: boolean;
      clasesLanzadoras: ClaseLanzadora[];
    }
  ) => void;
  establecerConcentracion: (id: string, hechizoId: string, nombreHechizo: string) => void;
  romperConcentracion: (id: string) => void;

  agregarTrucoConocido: (id: string, hechizoId: string) => void;
  quitarTrucoConocido: (id: string, hechizoId: string) => void;

  agregarConjuroConocido: (id: string, hechizoId: string) => void;
  quitarConjuroConocido: (id: string, hechizoId: string) => void;
  alternarConjuroPreparado: (id: string, hechizoId: string) => void;
  desprepararConjuroPersonaje: (id: string, hechizoId: string) => void;

  gastarEspacioConjuro: (id: string, nivel: number) => void;
  recuperarEspacioConjuro: (id: string, nivel: number) => void;
  recuperarTodosEspaciosConjuro: (id: string) => void;

  gastarPuntosConjuro: (id: string, cantidad: number) => void;
  recuperarPuntosConjuro: (id: string, cantidad: number) => void;
  recuperarTodosPuntosConjuro: (id: string) => void;

  gastarEspacioPacto: (id: string) => void;
  recuperarEspaciosPacto: (id: string) => void;

  modificarPuntosHechiceria: (id: string, delta: number) => void;
  asignarArcanoMistico: (id: string, nivel: number, hechizoId: string) => void;
  quitarArcanoMistico: (id: string, nivel: number) => void;
  gastarArcanoMistico: (id: string, nivel: number) => void;
  recuperarArcanoMistico: (id: string, nivel: number) => void;
  sincronizarConjurosSubclase: (id: string) => void;

  establecerOverridesMagia: (
    id: string,
    overrides: {
      overrideEspacios?: Record<string, number> | null;
      overridePuntos?: number | null;
    }
  ) => void;

  establecerOverrideEspacios: (id: string, overrides: Record<string, number> | null) => void;
  establecerOverridePuntos: (id: string, override: number | null) => void;
  recalcularRecursosMagicos: (id: string) => void;
}

export interface SubSliceInventario {
  agregarObjetoInventario: (idPj: string, objeto: ObjetoInventario) => void;
  quitarObjetoInventario: (idPj: string, idInstancia: string) => void;
  modificarCantidadObjeto: (idPj: string, idInstancia: string, delta: number) => void;
  alternarEquipadoObjeto: (idPj: string, idInstancia: string) => void;
  alternarSintonizadoObjeto: (idPj: string, idInstancia: string) => void;
  actualizarNotasObjeto: (idPj: string, idInstancia: string, notas: string) => void;
  actualizarObjetoInventario: (idPj: string, idInstancia: string, cambios: Partial<ObjetoInventario>) => void;
  modificarCargasObjeto: (idPj: string, idInstancia: string, delta: number) => void;
  cambiarContenedorObjeto: (idPj: string, idInstancia: string, contenedor: TipoContenedor) => void;
  reordenarInventario: (idPj: string, idInstanciaOrigen: string, idInstanciaDestino: string) => void;
  desempaquetarPaquete: (idPj: string, idInstancia: string, baseDatosObjetos: ObjetoJuego[]) => void;
  establecerMonedas: (idPj: string, monedas: Partial<BolsaMonedas>) => void;
  modificarMoneda: (idPj: string, tipo: TipoMonedaClave, delta: number) => void;
}

export interface SubSliceRasgos {
  agregarRasgoPersonaje: (idPj: string, rasgo: RasgoPersonaje) => void;
  actualizarRasgoPersonaje: (idPj: string, idRasgo: string, cambios: Partial<RasgoPersonaje>) => void;
  eliminarRasgoPersonaje: (idPj: string, idRasgo: string) => void;
  gastarUsoRasgoPersonaje: (idPj: string, idRasgo: string) => void;
  recuperarUsoRasgoPersonaje: (idPj: string, idRasgo: string) => void;
  establecerUsosRestantesRasgoPersonaje: (idPj: string, idRasgo: string, usos: number) => void;
  sincronizarRasgosPersonaje: (idPj: string) => void;
  alternarActivoRasgo: (idPj: string, idRasgo: string) => void;
  actualizarSeleccionRasgo: (idPj: string, idRasgo: string, idSelector: string, valorActual: string[]) => void;
}

// ==========================================
// 2. INTERFAZ COMPUESTA UNIFICADA
// ==========================================

export interface SlicePersonajes
  extends SubSlicePersonajesBase,
    SubSliceVitalidad,
    SubSliceCaracteristicasHabilidades,
    SubSliceCondiciones,
    SubSliceMagia,
    SubSliceInventario,
    SubSliceRasgos {}
