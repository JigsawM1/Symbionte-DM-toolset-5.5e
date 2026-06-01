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

export type Rareza = 'Común' | 'Poco Común' | 'Raro' | 'Muy Raro' | 'Legendario' | 'Artefacto';

export interface ObjetoBase {
  id: string;
  nombre: string;
  descripcion: string;
  pesoLb: number;
  valorPO: number;
  rareza: Rareza;
  esMagico: boolean; 
  bonosMagicos?: { categoria: string; bono: string; valor: number }[]; // Mantener compatibilidad con bonos dinámicos
  propiedades?: string | string[]; // Cambiado a string | string[] para compatibilidad de herencia con Arma
}

// --- 1. ARMAS ---
export interface Arma extends ObjetoBase {
  tipoPrincipal: 'Arma';
  subcategoria: 'Sencilla' | 'Marcial' | 'De Fuego';
  tipoAtaque: 'Cuerpo a Cuerpo' | 'A Distancia';
  dadoDano: string;
  tipoDano: string;
  propiedades: string[]; // Propiedades como array (pills/chips)
  maestria: string;
  alcanceNormal?: number;
  alcanceLargo?: number;
}

// --- 2. ARMADURAS ---
export type TipoBonoDestreza = 'Completo' | 'Máximo 2' | 'Sin Bono';
export interface Armadura extends ObjetoBase {
  tipoPrincipal: 'Armadura';
  subcategoria: 'Ligera' | 'Mediana' | 'Pesada' | 'Escudo';
  caBase: number;
  requisitoFuerza?: number;
  desventajaSigilo: boolean;
  bonoDestreza: TipoBonoDestreza;
}

// --- 3. EQUIPO DE AVENTURAS ---
export type SubcategoriaEquipo = 'Consumible' | 'Munición' | 'Herramienta' | 'Instrumento' | 'Paquete' | 'Maravilloso'; 
export interface EquipoAventuras extends ObjetoBase {
  tipoPrincipal: 'Equipo de Aventuras';
  subcategoria: SubcategoriaEquipo;
  cantidad?: number;
  sintonizacionRequerida?: boolean;
  cargas?: number;
}

export type ObjetoJuego = Arma | Armadura | EquipoAventuras;
export type ObjetoHomebrew = ObjetoJuego;

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
