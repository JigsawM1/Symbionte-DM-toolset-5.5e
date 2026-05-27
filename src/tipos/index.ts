export interface Caracteristicas {
  fuerza: number;
  destreza: number;
  constitucion: number;
  inteligencia: number;
  sabiduria: number;
  carisma: number;
}

export interface AccionMonstruo {
  nombre: string;
  descripcion: string;
  bonificadorAtaque?: number;
  daño?: string;
  uso?: string;
}

export interface RasgoBase {
  nombre: string;
  descripcion: string;
  uso?: string;
}

export interface Salvaciones {
  fuerza?: number;
  destreza?: number;
  constitucion?: number;
  inteligencia?: number;
  sabiduria?: number;
  carisma?: number;
}

export interface Habilidades {
  acrobacias?: number;
  manejoAnimales?: number;
  arcanos?: number;
  atletismo?: number;
  engaño?: number;
  historia?: number;
  perspicacia?: number;
  intimidacion?: number;
  investigacion?: number;
  medicina?: number;
  naturaleza?: number;
  percepcion?: number;
  interpretacion?: number;
  persuasion?: number;
  religion?: number;
  juegoManos?: number;
  sigilo?: number;
  supervivencia?: number;
}

export interface AccionRapida {
  nombre: string;
  bonificadorAtaque: string;
  dadosDaño: string;
  tipoDaño: string;
}

export type TipoMonstruo =
  | "Aberración"
  | "Bestia"
  | "Celestial"
  | "Constructo"
  | "Dragón"
  | "Elemental"
  | "Hada"
  | "Fata"
  | "Fiando"
  | "Demonio"
  | "Diablo"
  | "Gigante"
  | "Humanoide"
  | "Abominación"
  | "Monstruosidad"
  | "Cieno"
  | "Planta"
  | "No Muerto"
  | string;

export interface MonstruoBase {
  id: string;
  nombre: string;
  tipo: TipoMonstruo;
  ca: number;
  caNotas?: string;
  vidaMaxima: number;
  vidaActual: number;
  vidaNotas?: string;
  iniciativaBonificador: number;
  velocidad: string;
  sentidos?: string;
  idiomas?: string;
  desafio?: string;
  fuente?: string;
  caracteristicas: Caracteristicas;
  salvaciones?: Salvaciones;
  habilidades?: Habilidades;
  vulnerabilidades?: string[];
  resistencias?: string[];
  inmunidadesDaño?: string[];
  inmunidadesCondicion?: string[];
  accionesRapidas?: AccionRapida[];
  rasgos: RasgoBase[];
  acciones: AccionMonstruo[];
  reacciones?: RasgoBase[];
  accionesLegendarias?: RasgoBase[];
}

export type EscuelaHechizo =
  | "Abjuración"
  | "Conjuración"
  | "Adivinación"
  | "Encantamiento"
  | "Evocación"
  | "Ilusión"
  | "Nigromancia"
  | "Transmutación"
  | string;

export interface HechizoBase {
  id: string;
  nombre: string;
  nivel: number;
  escuela: EscuelaHechizo;
  tiempoLanzamiento: string;
  alcance: string;
  componentes: string;
  descripcion: string;
  concentracion?: boolean;
  ritual?: boolean;
  
  // Campos avanzados estructurados
  descNivelSuperior?: string;
  materiales?: string;
  componentesSeleccionados?: { verbal: boolean; somatico: boolean; material: boolean };
  duracion?: string;
  clases?: string[];
  ataqueCd?: string;
  dadosDaño?: string;
  dadosDañoNivelSuperior?: string;
  cdSalvacion?: string;
  agregarModificadorHabilidad?: boolean;
  tipoDaño?: string;
}

export type RarezaObjeto =
  | "Común"
  | "Poco Común"
  | "Raro"
  | "Muy Raro"
  | "Legendario"
  | "Artefacto"
  | string;

export type CategoriaObjeto =
  | "Arma"
  | "Armadura"
  | "Poción"
  | "Anillo"
  | "Bastón"
  | "Cetro"
  | "Varita"
  | "Pergamino"
  | "Objeto Maravilloso"
  | string;

export type UnidadCosto =
  | "PC"
  | "PP"
  | "PE"
  | "PO"
  | "PPT"
  | string;

export interface ObjetoHomebrew {
  id: string;
  nombre: string;
  rareza: RarezaObjeto;
  propiedades: string;
  descripcion: string;
  
  // Nuevos campos estructurados
  categoria?: CategoriaObjeto;
  costoValor?: number;
  costoUnidad?: UnidadCosto;
  peso?: string;
  tipoArma?: string;
  estiloAtaque?: string;
  alcance?: string;
  propiedadesArma?: string[]; // Sutil, Versátil, etc.
  dadosDaño?: string;
  tipoDaño?: string;
  bonoAtaque?: string;
  bonoDaño?: string;
  bonosMagicos?: { categoria: string; bono: string; valor: number }[];
}

export interface CondicionDnd {
  nombre: string;
  descripcion: string;
  efectos: string[];
}

export interface EfectoPredefinido {
  nombre: string;
  descripcion: string;
  duracionEstandar: number; // en rondas
}
