import type { RasgoPersonaje, OrigenRasgo, TipoAccionRasgo, RecuperacionRasgo, TipoEfectoMecanico } from "@/tipos";
export const OPCIONES_ORIGEN: {
    valor: OrigenRasgo;
    etiqueta: string;
}[] = [
    { valor: "personalizado", etiqueta: "Personalizado (Homebrew)" },
    { valor: "dote", etiqueta: "Dote" },
    { valor: "clase", etiqueta: "Rasgo de Clase" },
    { valor: "subclase", etiqueta: "Rasgo de Subclase" },
    { valor: "especie", etiqueta: "Rasgo de Especie" },
    { valor: "subespecie", etiqueta: "Rasgo de Subraza / Legado" }
];
export const OPCIONES_TIPO_ACCION: {
    valor: TipoAccionRasgo;
    etiqueta: string;
}[] = [
    { valor: "pasivo", etiqueta: "Pasivo (Permanente)" },
    { valor: "accion", etiqueta: "Acción Principal" },
    { valor: "accion_adicional", etiqueta: "Acción Adicional" },
    { valor: "reaccion", etiqueta: "Reacción" },
    { valor: "especial", etiqueta: "Especial / Variable" }
];
export const OPCIONES_RECUPERACION: {
    valor: RecuperacionRasgo;
    etiqueta: string;
}[] = [
    { valor: "descanso_corto", etiqueta: "Descanso Corto" },
    { valor: "descanso_largo", etiqueta: "Descanso Largo" },
    { valor: "manual", etiqueta: "Manual" },
    { valor: "ninguno", etiqueta: "Ninguno" }
];
export const OPCIONES_CATEGORIA_MECANICA: {
    valor: NonNullable<RasgoPersonaje["categoriaMecanica"]>;
    etiqueta: string;
}[] = [
    { valor: "consumible", etiqueta: "Consumible (Recurso con usos limitados)" },
    { valor: "activable", etiqueta: "Activable (Interruptor táctico ON / OFF)" },
    { valor: "pasivo_permanente", etiqueta: "Pasivo Permanente" },
    { valor: "selector_informativo", etiqueta: "Selector Informativo" },
    { valor: "curacion", etiqueta: "Curación" },
    { valor: "extension", etiqueta: "Extensión" }
];
export const OPCIONES_FORMULA_ESCALADO = [
    { valor: "", etiqueta: "Fijo (Sin escalado automático)" },
    { valor: "bono_competencia", etiqueta: "Bono de Competencia (PB: 2 a 6)" },
    { valor: "nivel", etiqueta: "Nivel del Personaje (1 a 20)" },
    { valor: "modificador_carisma", etiqueta: "Modificador de Carisma" },
    { valor: "modificador_constitucion", etiqueta: "Modificador de Constitución" },
    { valor: "modificador_sabiduria", etiqueta: "Modificador de Sabiduría" }
];
export const OPCIONES_OBJETIVO_HP_TEMPORAL = [
    { valor: "propio", etiqueta: "El propio personaje (Personal)" },
    { valor: "aliados", etiqueta: "Criaturas aliadas" },
    { valor: "general", etiqueta: "General" }
];
export const OPCIONES_PRESETS_HP_TEMPORAL = [
    { valor: "bono_competencia", etiqueta: "Bono de Competencia (PB)" },
    { valor: "nivel", etiqueta: "Nivel del Personaje" },
    { valor: "1*nivel", etiqueta: "1 × Nivel del Personaje" },
    { valor: "2*nivel", etiqueta: "2 × Nivel del Personaje" },
    { valor: "constitucion", etiqueta: "Modificador de Constitución" },
    { valor: "2_veces_dado_inspiracion", etiqueta: "2 × Dado de Inspiración" },
    { valor: "personalizado", etiqueta: "Personalizado / Otra fórmula" }
];
export const OPCIONES_APLICA_A_ATAQUE = [
    { valor: "arma_fuerza", etiqueta: "Armas con Fuerza" },
    { valor: "arma_cac", etiqueta: "Armas Cuerpo a Cuerpo" },
    { valor: "arma_distancia", etiqueta: "Armas a Distancia" },
    { valor: "arma_pesada", etiqueta: "Armas Pesadas" },
    { valor: "arma_arrojadiza", etiqueta: "Armas Arrojadizas" },
    { valor: "arma_duelo", etiqueta: "Armas a Una Mano (Duelo)" },
    { valor: "desarmado", etiqueta: "Golpe sin Armas (Desarmado)" },
    { valor: "todos_ataques", etiqueta: "Todos los Ataques" }
] as const;
export const OPCIONES_CONDICION_DESARMADO = [
    { valor: "", etiqueta: "Siempre activo (sin requisitos)" },
    { valor: "sin_escudo", etiqueta: "Sin Escudo embrazado (ej. 1d8 en Combate sin armas)" },
    { valor: "con_escudo", etiqueta: "Con Escudo embrazado" },
    { valor: "sin_armadura", etiqueta: "Sin Armadura puesta" },
    { valor: "sin_armadura_ni_escudo", etiqueta: "Sin Armadura ni Escudo (ej. Danza bárdica)" },
    { valor: "con_armadura", etiqueta: "Con Armadura puesta" }
];
export const OPCIONES_MODO_CA = [
    { valor: "defensa_sin_armadura", etiqueta: "Defensa sin Armadura (10 + DES + Atributo)" },
    { valor: "ca", etiqueta: "Bonificador Numérico a la CA (ej. +1 Defensa)" }
];
export const OPCIONES_CONDICION_CA = [
    { valor: "con_armadura", etiqueta: "Con Armadura puesta (ligera, media o pesada)" },
    { valor: "siempre", etiqueta: "Siempre activo (Incondicional)" },
    { valor: "sin_armadura", etiqueta: "Sin Armadura puesta" },
    { valor: "con_escudo", etiqueta: "Con Escudo embrazado" }
];
export const OPCIONES_APLICA_A_CONJURO = [
    { valor: "todos_conjuros", etiqueta: "Todos los Conjuros y Trucos" },
    { valor: "trucos", etiqueta: "Solo Trucos (Nivel 0)" },
    { valor: "espacios", etiqueta: "Solo Conjuros con Ranura (Nivel 1+)" },
    { valor: "fuego", etiqueta: "Daño de Fuego" },
    { valor: "radiante", etiqueta: "Daño Radiante" },
    { valor: "necrotico", etiqueta: "Daño Necrótico" },
    { valor: "evocacion", etiqueta: "Escuela de Evocación" }
] as const;
export const OPCIONES_ATRIBUTO_CA = [
    { valor: "constitucion", etiqueta: "Constitución (10 + DES + CON - Bárbaro)" },
    { valor: "sabiduria", etiqueta: "Sabiduría (10 + DES + SAB - Monje)" },
    { valor: "inteligencia", etiqueta: "Inteligencia (10 + DES + INT)" },
    { valor: "carisma", etiqueta: "Carisma (10 + DES + CAR)" }
];
export const OPCIONES_CARACTERISTICAS = [
    { valor: "fuerza", etiqueta: "Fuerza" },
    { valor: "destreza", etiqueta: "Destreza" },
    { valor: "constitucion", etiqueta: "Constitución" },
    { valor: "inteligencia", etiqueta: "Inteligencia" },
    { valor: "sabiduria", etiqueta: "Sabiduría" },
    { valor: "carisma", etiqueta: "Carisma" }
];
export const OPCIONES_VENTAJA = [
    { valor: "salvacion.fuerza", etiqueta: "Tiradas de Salvación de Fuerza" },
    { valor: "salvacion.destreza", etiqueta: "Tiradas de Salvación de Destreza" },
    { valor: "salvacion.constitucion", etiqueta: "Tiradas de Salvación de Constitución" },
    { valor: "salvacion.inteligencia", etiqueta: "Tiradas de Salvación de Inteligencia" },
    { valor: "salvacion.sabiduria", etiqueta: "Tiradas de Salvación de Sabiduría" },
    { valor: "salvacion.carisma", etiqueta: "Tiradas de Salvación de Carisma" },
    { valor: "salvaciones_fisicas", etiqueta: "Salvaciones Físicas (FUE, DES, CON)" },
    { valor: "salvaciones_mentales", etiqueta: "Salvaciones Mentales (INT, SAB, CAR)" },
    { valor: "salvacion.muerte", etiqueta: "Tiradas de Salvación contra la Muerte" },
    { valor: "ataque_fuerza", etiqueta: "Tiradas de Ataque que usan Fuerza" },
    { valor: "iniciativa", etiqueta: "Tiradas de Iniciativa" },
    { valor: "prueba.fuerza", etiqueta: "Pruebas de Característica de Fuerza" },
    { valor: "prueba.destreza", etiqueta: "Pruebas de Característica de Destreza" },
    { valor: "prueba.constitucion", etiqueta: "Pruebas de Característica de Constitución" },
    { valor: "prueba.inteligencia", etiqueta: "Pruebas de Característica de Inteligencia" },
    { valor: "prueba.sabiduria", etiqueta: "Pruebas de Característica de Sabiduría" },
    { valor: "prueba.carisma", etiqueta: "Pruebas de Característica de Carisma" }
];
export const OPCIONES_SALVACION_OBJETIVO = [
    { valor: "todas", etiqueta: "Todas las Salvaciones (Universal)" },
    { valor: "salvacion.fuerza", etiqueta: "Fuerza" },
    { valor: "salvacion.destreza", etiqueta: "Destreza" },
    { valor: "salvacion.constitucion", etiqueta: "Constitución" },
    { valor: "salvacion.inteligencia", etiqueta: "Inteligencia" },
    { valor: "salvacion.sabiduria", etiqueta: "Sabiduría" },
    { valor: "salvacion.carisma", etiqueta: "Carisma" }
];
export const TIPOS_EFECTO_DISPONIBLES: {
    tipo: TipoEfectoMecanico;
    etiqueta: string;
    desc: string;
}[] = [
    { tipo: "dado_extra_dano", etiqueta: "Dados Extra de Daño", desc: "Añade dados al arma o ataque (ej. 1d10 de Golpe Brutal o 2d6 de Frenesí)" },
    { tipo: "dano_secundario", etiqueta: "Daño Secundario con Tipo (/)", desc: "Grupo de daño independiente con tipo separado (ej. 1d6+mitad_nivel Radiante/Necrótico)" },
    { tipo: "bono_dano_ataque", etiqueta: "Bono Numérico de Daño a Ataques", desc: "Suma daño plano (+PB, +2, dano_furia, mitad_nivel) a ataques seleccionados" },
    { tipo: "bono_ataque", etiqueta: "Bono Numérico a Tiradas de Ataque", desc: "Suma un bono (+2, +PB) a tiradas de ataque (ej. Tiro con arco)" },
    { tipo: "bono_dano_conjuro", etiqueta: "Bono Numérico de Daño a Conjuros", desc: "Suma daño plano (+PB, +3, carisma, inteligencia) a conjuros o trucos" },
    { tipo: "bono_dano_fuerza", etiqueta: "Bono Numérico de Daño (Fuerza)", desc: "Suma daño plano (+2, dano_furia, mitad_nivel) a ataques con Fuerza" },
    { tipo: "modificador_ca", etiqueta: "Defensa sin Armadura / CA", desc: "Calcula CA sumando Constitución, Sabiduría o bono plano" },
    { tipo: "modificador_stat", etiqueta: "Modificador de Característica", desc: "Aumenta un atributo y permite elevar el límite de 20 a 25" },
    { tipo: "modificador_velocidad", etiqueta: "Velocidad de Movimiento", desc: "Aumenta la velocidad base a pie (+10 pies de Movimiento Rápido)" },
    { tipo: "movimiento_especial", etiqueta: "Movimiento Especial", desc: "Otorga velocidad de Vuelo, Nado o Escalada" },
    { tipo: "ventaja", etiqueta: "Ventaja en Tiradas d20", desc: "Otorga ventaja en salvaciones, ataques de Fuerza o iniciativa" },
    { tipo: "desventaja", etiqueta: "Desventaja en Tiradas d20", desc: "Aplica desventaja táctica en tiradas seleccionadas" },
    { tipo: "bono_salvacion", etiqueta: "Bono a Tiradas de Salvación", desc: "Bono a salvaciones de una característica o universales (ej. Enfoque Fanático)" },
    { tipo: "habilidad_con_fuerza", etiqueta: "Uso de Fuerza en Habilidades", desc: "Permite sustituir el atributo base por Fuerza en habilidades seleccionadas" },
    { tipo: "inmunidad_condicion", etiqueta: "Inmunidad a Condición", desc: "Inmunidad frente a estados o condiciones tácticas" },
    { tipo: "medio_bono_habilidades", etiqueta: "Aprendiz de Mucho / Medio Bono", desc: "Suma la mitad de competencia a habilidades no entrenadas" },
    { tipo: "ataque_desarmado", etiqueta: "Ataque Desarmado Especial", desc: "Permite usar Destreza y dados propios (ej. Daño Bárdico)" },
    { tipo: "conjuro_otorgado", etiqueta: "Conjuro Siempre Preparado", desc: "Otorga un conjuro siempre preparado por rasgo" },
    { tipo: "conjuro_gratuito", etiqueta: "Lanzamiento Gratuito de Conjuro", desc: "Permite lanzar un conjuro sin gastar espacios de conjuro (ej. Orden imperiosa)" },
    { tipo: "hp_temporal", etiqueta: "Puntos de Golpe Temporales", desc: "Otorga puntos de golpe temporales calculados o con multiplicador" },
    { tipo: "modificador_hp_maximo", etiqueta: "Modificador de Puntos de Golpe Máximos", desc: "Aumenta o reduce los HP máximos de forma plana o escalada por nivel (ej. 1*nivel, 2*nivel, +5)" },
    { tipo: "modificador_capacidad_carga", etiqueta: "Modificador de Capacidad de Carga", desc: "Multiplica o incrementa la capacidad de carga (ej. x2 para Constitución poderosa / categoría de tamaño superior)" },
    { tipo: "modificador_tamano", etiqueta: "Modificador de Tamaño", desc: "Modifica la categoría de tamaño activa de la criatura (ej. Grande en Forma grande o Agrandar)" },
    { tipo: "restaurar_recurso", etiqueta: "Restaurar Recursos Mecánicos", desc: "Restaura usos o cargas de otro rasgo al activarse (ej. Furia persistente)" },
    { tipo: "competencia", etiqueta: "Competencia en Armas, Armaduras o Útiles", desc: "Otorga competencia en armas marciales, armaduras medias, útiles, etc." },
    { tipo: "limite_des_armadura_media", etiqueta: "Límite de Destreza en Armadura Media", desc: "Aumenta el tope de Destreza aplicable a la CA con armadura media (ej. 3 para Maestro en armaduras medias)" },
    { tipo: "dado_extra_critico", etiqueta: "Dados Extra en Crítico", desc: "Añade dados adicionales al crítico del arma (ej. +1 dado para armas perforantes de Perforador)" },
    { tipo: "bono_habilidad", etiqueta: "Bono Numérico a Habilidades", desc: "Suma un bonificador (+MOD Sabiduría, etc.) a pruebas de habilidades seleccionadas (ej. Taumaturgo)" }
];
