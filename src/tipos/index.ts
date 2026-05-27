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

export interface MonstruoBase {
  id: string;
  nombre: string;
  tipo: string;
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
  salvaciones?: {
    fuerza?: number;
    destreza?: number;
    constitucion?: number;
    inteligencia?: number;
    sabiduria?: number;
    carisma?: number;
  };
  habilidades?: {
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
  };
  vulnerabilidades?: string[];
  resistencias?: string[];
  inmunidadesDaño?: string[];
  inmunidadesCondicion?: string[];
  accionesRapidas?: {
    nombre: string;
    bonificadorAtaque: string;
    dadosDaño: string;
    tipoDaño: string;
  }[];
  rasgos: { nombre: string; descripcion: string; uso?: string }[];
  acciones: AccionMonstruo[];
  reacciones?: { nombre: string; descripcion: string; uso?: string }[];
  accionesLegendarias?: { nombre: string; descripcion: string; uso?: string }[];
}

export interface HechizoBase {
  id: string;
  nombre: string;
  nivel: number;
  escuela: string;
  tiempoLanzamiento: string;
  alcance: string;
  componentes: string;
  descripcion: string;
  concentracion?: string | boolean;
  ritual?: string | boolean;
  
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

export interface ObjetoHomebrew {
  id: string;
  nombre: string;
  rareza: string;
  propiedades: string;
  descripcion: string;
  
  // Nuevos campos estructurados
  categoria?: string;
  costoValor?: number;
  costoUnidad?: string; // PC, PP, PE, PO, PPT
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
