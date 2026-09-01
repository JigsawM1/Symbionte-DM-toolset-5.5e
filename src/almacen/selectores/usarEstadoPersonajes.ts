/**
 * usarEstadoPersonajes.ts
 * -----------------------
 * Hook Facade que agrupa en una sola suscripción al store todos los selectores
 * relacionados con los personajes de los jugadores.
 */

import { useShallow } from 'zustand/react/shallow';
import { usarAlmacenDM } from '@/almacen/usarAlmacenDM';
import type { PersonajeJugador, Caracteristica, Habilidad, EfectoPasivo } from '@/tipos';
import {
  obtenerBonoCompetenciaPorNivel,
  MAPA_HABILIDAD_A_CARACTERISTICA
} from '@/constantes';
import { esCompetenteConArmadura } from '@/constantes/competenciasConstantes';
import { calcularModificadorCaracteristica } from '@/servicios/procesadorDescansos';
import { OBJETOS_INICIALES } from '@/utiles/datosIniciales';

export interface InformacionCA {
  total: number;
  base: number;
  modDestrezaAplicado: number;
  bonoEscudo: number;
  bonosMagicos: number;
  armaduraEquipadaNombre: string | null;
  escudoEquipadoNombre: string | null;
  tipoArmadura: "Sin Armadura" | "Ligera" | "Mediana" | "Pesada";
  desglose: string;
  desventajaSigilo?: boolean;
}

export interface PenalizacionArmadura {
  sinCompetencia: boolean;
  armaduraNoCompetente: string | null;
  escudoNoCompetente: string | null;
}

/** Estadísticas y bonificadores dinámicos calculados a partir de un personaje. */
export interface EstadisticasCalculadasPersonaje {
  bonoCompetencia: number;
  puntuacionesEfectivas: Record<Caracteristica, number>;
  modificadores: Record<Caracteristica, number>;
  salvaciones: Record<Caracteristica, number>;
  habilidades: Record<Habilidad, number>;
  pasivas: {
    percepcion: number;
    investigacion: number;
    perspicacia: number;
  };
  claseArmadura: InformacionCA;
  penalizacionArmadura: PenalizacionArmadura;
  desventajaSigiloArmadura: boolean;
}

/**
 * Tabla de referencia de armaduras oficiales de D&D 5.5e
 */
interface ReferenciaArmadura {
  caBase: number;
  tipo: "Ligera" | "Mediana" | "Pesada";
  limiteDes: number | null; // null = sin límite, 2 = máx +2, 0 = no suma
  desventajaSigilo?: boolean;
}

const ARMADURAS_OFICIALES: Record<string, ReferenciaArmadura> = {
  "acolchada": { caBase: 11, tipo: "Ligera", limiteDes: null, desventajaSigilo: true },
  "armadura acolchada": { caBase: 11, tipo: "Ligera", limiteDes: null, desventajaSigilo: true },
  "cuero": { caBase: 11, tipo: "Ligera", limiteDes: null },
  "armadura de cuero": { caBase: 11, tipo: "Ligera", limiteDes: null },
  "cuero tachonado": { caBase: 12, tipo: "Ligera", limiteDes: null },
  "armadura de cuero tachonado": { caBase: 12, tipo: "Ligera", limiteDes: null },

  "pieles": { caBase: 12, tipo: "Mediana", limiteDes: 2 },
  "armadura de pieles": { caBase: 12, tipo: "Mediana", limiteDes: 2 },
  "camison de malla": { caBase: 13, tipo: "Mediana", limiteDes: 2 },
  "camisa de malla": { caBase: 13, tipo: "Mediana", limiteDes: 2 },
  "cota de escamas": { caBase: 14, tipo: "Mediana", limiteDes: 2, desventajaSigilo: true },
  "coraza": { caBase: 14, tipo: "Mediana", limiteDes: 2 },
  "semiplacas": { caBase: 15, tipo: "Mediana", limiteDes: 2, desventajaSigilo: true },
  "semi-placas": { caBase: 15, tipo: "Mediana", limiteDes: 2, desventajaSigilo: true },

  "cota de anillas": { caBase: 14, tipo: "Pesada", limiteDes: 0, desventajaSigilo: true },
  "cota de malla": { caBase: 16, tipo: "Pesada", limiteDes: 0, desventajaSigilo: true },
  "bandas": { caBase: 17, tipo: "Pesada", limiteDes: 0, desventajaSigilo: true },
  "cota de bandas": { caBase: 17, tipo: "Pesada", limiteDes: 0, desventajaSigilo: true },
  "placas": { caBase: 18, tipo: "Pesada", limiteDes: 0, desventajaSigilo: true },
  "armadura de placas": { caBase: 18, tipo: "Pesada", limiteDes: 0, desventajaSigilo: true }
};

/**
 * Función pura que calcula todas las estadísticas derivadas de un personaje
 * conforme a las reglas oficiales de D&D 5.5e.
 */
export function calcularEstadisticasPersonaje(pj: PersonajeJugador): EstadisticasCalculadasPersonaje {
  const nivel = pj?.nivel || 1;
  const bonoCompetencia = obtenerBonoCompetenciaPorNivel(nivel);

  const carac = pj?.caracteristicas || {
    fuerza: 10,
    destreza: 10,
    constitucion: 10,
    inteligencia: 10,
    sabiduria: 10,
    carisma: 10
  };

  const overrides = pj?.overridesFijos || {
    fuerza: null,
    destreza: null,
    constitucion: null,
    inteligencia: null,
    sabiduria: null,
    carisma: null
  };

  const personalizacionesCarac = pj?.personalizacionesCaracteristicas || {};
  const inventario = pj?.inventario || [];
  const normalizar = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  // Mapeo tolerante de alias de características
  const MAPA_ALIAS_CARAC: Record<string, Caracteristica> = {
    fue: "fuerza",
    fuerza: "fuerza",
    str: "fuerza",
    des: "destreza",
    destreza: "destreza",
    dex: "destreza",
    con: "constitucion",
    constitucion: "constitucion",
    int: "inteligencia",
    inteligencia: "inteligencia",
    sab: "sabiduria",
    sabiduria: "sabiduria",
    wis: "sabiduria",
    car: "carisma",
    carisma: "carisma",
    cha: "carisma"
  };

  // Recopilar efectos pasivos activos de objetos equipados y sintonizados
  const efectosPasivosActivos: EfectoPasivo[] = [];
  let bonosModificadorDirectoArmadura = 0;
  const homebrews = usarAlmacenDM.getState?.()?.objetosHomebrew || [];

  for (const item of inventario) {
    if (!item.equipado) continue;
    if (item.sintonizacionRequerida && !item.sintonizado) continue;

    const objetoComp =
      homebrews.find((b) => b.id === item.idObjeto || normalizar(b.nombre) === normalizar(item.nombre)) ||
      OBJETOS_INICIALES.find((b) => b.id === item.idObjeto || normalizar(b.nombre) === normalizar(item.nombre));

    const efectosDirectos = (item as any).efectosPasivos;
    const efectosComp = objetoComp?.efectosPasivos;
    const listaEfectos = Array.isArray(efectosDirectos) && efectosDirectos.length > 0 ? efectosDirectos : efectosComp;

    if (listaEfectos && Array.isArray(listaEfectos)) {
      efectosPasivosActivos.push(...listaEfectos);
    }

    const modDirecto = (item as any).modificadorAtaqueDano ?? objetoComp?.modificadorAtaqueDano;
    if (modDirecto && item.tipoPrincipal === "Armadura") {
      bonosModificadorDirectoArmadura += Number(modDirecto) || 0;
    }
  }

  const puntuacionesEfectivas: Record<Caracteristica, number> = {
    fuerza: personalizacionesCarac.fuerza?.valorFijo ?? overrides.fuerza ?? carac.fuerza ?? 10,
    destreza: personalizacionesCarac.destreza?.valorFijo ?? overrides.destreza ?? carac.destreza ?? 10,
    constitucion: personalizacionesCarac.constitucion?.valorFijo ?? overrides.constitucion ?? carac.constitucion ?? 10,
    inteligencia: personalizacionesCarac.inteligencia?.valorFijo ?? overrides.inteligencia ?? carac.inteligencia ?? 10,
    sabiduria: personalizacionesCarac.sabiduria?.valorFijo ?? overrides.sabiduria ?? carac.sabiduria ?? 10,
    carisma: personalizacionesCarac.carisma?.valorFijo ?? overrides.carisma ?? carac.carisma ?? 10
  };

  // Aplicar bonos y overrides pasivos a características
  for (const efecto of efectosPasivosActivos) {
    const tipoNorm = normalizar(efecto.tipo || "");
    if (tipoNorm.includes("caracteristica") || tipoNorm === "atributo") {
      const caracClave = MAPA_ALIAS_CARAC[normalizar(efecto.bono || "")];
      if (caracClave) {
        const valNum = Number(efecto.valor);
        if (!isNaN(valNum)) {
          if (valNum >= 19) {
            puntuacionesEfectivas[caracClave] = Math.max(puntuacionesEfectivas[caracClave], valNum);
          } else {
            puntuacionesEfectivas[caracClave] += valNum;
          }
        }
      }
    }
  }

  const modificadores: Record<Caracteristica, number> = {
    fuerza: calcularModificadorCaracteristica(puntuacionesEfectivas.fuerza) + (personalizacionesCarac.fuerza?.modificadorExtra || 0),
    destreza: calcularModificadorCaracteristica(puntuacionesEfectivas.destreza) + (personalizacionesCarac.destreza?.modificadorExtra || 0),
    constitucion: calcularModificadorCaracteristica(puntuacionesEfectivas.constitucion) + (personalizacionesCarac.constitucion?.modificadorExtra || 0),
    inteligencia: calcularModificadorCaracteristica(puntuacionesEfectivas.inteligencia) + (personalizacionesCarac.inteligencia?.modificadorExtra || 0),
    sabiduria: calcularModificadorCaracteristica(puntuacionesEfectivas.sabiduria) + (personalizacionesCarac.sabiduria?.modificadorExtra || 0),
    carisma: calcularModificadorCaracteristica(puntuacionesEfectivas.carisma) + (personalizacionesCarac.carisma?.modificadorExtra || 0)
  };

  const compSalv = pj?.competenciasSalvacion || {
    fuerza: false,
    destreza: false,
    constitucion: false,
    inteligencia: false,
    sabiduria: false,
    carisma: false
  };

  const salvaciones: Record<Caracteristica, number> = {
    fuerza: modificadores.fuerza + (compSalv.fuerza ? bonoCompetencia : 0) + (personalizacionesCarac.fuerza?.bonoSalvacionExtra || 0),
    destreza: modificadores.destreza + (compSalv.destreza ? bonoCompetencia : 0) + (personalizacionesCarac.destreza?.bonoSalvacionExtra || 0),
    constitucion: modificadores.constitucion + (compSalv.constitucion ? bonoCompetencia : 0) + (personalizacionesCarac.constitucion?.bonoSalvacionExtra || 0),
    inteligencia: modificadores.inteligencia + (compSalv.inteligencia ? bonoCompetencia : 0) + (personalizacionesCarac.inteligencia?.bonoSalvacionExtra || 0),
    sabiduria: modificadores.sabiduria + (compSalv.sabiduria ? bonoCompetencia : 0) + (personalizacionesCarac.sabiduria?.bonoSalvacionExtra || 0),
    carisma: modificadores.carisma + (compSalv.carisma ? bonoCompetencia : 0) + (personalizacionesCarac.carisma?.bonoSalvacionExtra || 0)
  };

  // Aplicar bonos pasivos a tiradas de salvación
  for (const efecto of efectosPasivosActivos) {
    const tipoNorm = normalizar(efecto.tipo || "");
    if (tipoNorm.includes("salvacion")) {
      const bonoNorm = normalizar(efecto.bono || "");
      const valNum = Number(efecto.valor) || 0;
      if (bonoNorm === "todas" || bonoNorm === "universal" || bonoNorm === "todas las salvaciones") {
        for (const k of Object.keys(salvaciones) as Caracteristica[]) {
          salvaciones[k] += valNum;
        }
      } else {
        const caracClave = MAPA_ALIAS_CARAC[bonoNorm];
        if (caracClave) {
          salvaciones[caracClave] += valNum;
        }
      }
    }
  }

  const habilidades = {} as Record<Habilidad, number>;
  const listaHabilidades = Object.keys(MAPA_HABILIDAD_A_CARACTERISTICA) as Habilidad[];
  const grados = pj?.gradosHabilidades || {};
  const personalizaciones = pj?.personalizacionesHabilidades || {};

  for (const hab of listaHabilidades) {
    const caracAsociada = MAPA_HABILIDAD_A_CARACTERISTICA[hab];
    const modBase = modificadores[caracAsociada] || 0;
    const grado = grados[hab] || "ninguna";
    const custom = personalizaciones[hab];

    if (custom?.valorFijo !== null && custom?.valorFijo !== undefined) {
      habilidades[hab] = custom.valorFijo;
    } else {
      let bonoHabilidad = 0;
      if (grado === "competente") {
        bonoHabilidad = bonoCompetencia;
      } else if (grado === "pericia") {
        bonoHabilidad = bonoCompetencia * 2;
      } else if (grado === "medio") {
        bonoHabilidad = Math.floor(bonoCompetencia / 2);
      }

      const modExtra = custom?.modificadorExtra || 0;
      habilidades[hab] = modBase + bonoHabilidad + modExtra;
    }
  }

  // Aplicar bonos pasivos a habilidades
  for (const efecto of efectosPasivosActivos) {
    const tipoNorm = normalizar(efecto.tipo || "");
    if (tipoNorm.includes("habilidad") || tipoNorm.includes("pericia")) {
      const bonoNorm = normalizar(efecto.bono || "");
      const valNum = Number(efecto.valor) || 0;
      if (bonoNorm === "todas" || bonoNorm === "universal") {
        for (const hab of listaHabilidades) {
          habilidades[hab] += valNum;
        }
      } else {
        const matchHab = listaHabilidades.find((h) => normalizar(h) === bonoNorm);
        if (matchHab) {
          habilidades[matchHab] += valNum;
        }
      }
    }
  }

  const pasivas = {
    percepcion: 10 + (habilidades.percepcion || 0),
    investigacion: 10 + (habilidades.investigacion || 0),
    perspicacia: 10 + (habilidades.perspicacia || 0)
  };

  // ==========================================
  // CÁLCULO DE CLASE DE ARMADURA (CA - D&D 5.5e)
  // ==========================================

  // 1. Identificar armadura corporal y escudo equipados
  const armaduraObj = inventario.find(
    (o) => o.equipado && o.tipoPrincipal === "Armadura" && !normalizar(o.nombre).includes("escudo")
  );
  const escudoObj = inventario.find(
    (o) => o.equipado && (normalizar(o.nombre).includes("escudo") || (o.tipoPrincipal === "Armadura" && normalizar(o.nombre).startsWith("escudo")))
  );

  let caBase = 10;
  let modDesAplicado = modificadores.destreza || 0;
  let tipoArmadura: InformacionCA["tipoArmadura"] = "Sin Armadura";
  let armaduraNombre: string | null = null;
  let desglosePartes: string[] = [];

  const clasePrincipal = pj?.clase || "";
  const clasesPj = (pj?.clases || []).map((c) => c.nombre);
  const esBarbaro = clasePrincipal === "Bárbaro" || clasesPj.includes("Bárbaro");
  const esMonje = clasePrincipal === "Monje" || clasesPj.includes("Monje");

  if (armaduraObj) {
    armaduraNombre = armaduraObj.nombre;
    const nombreNorm = normalizar(armaduraObj.nombre);
    const refOficial = ARMADURAS_OFICIALES[nombreNorm];

    if (refOficial) {
      caBase = refOficial.caBase;
      tipoArmadura = refOficial.tipo;
      if (refOficial.limiteDes === null) {
        modDesAplicado = modificadores.destreza;
      } else if (refOficial.limiteDes === 2) {
        modDesAplicado = Math.min(2, Math.max(0, modificadores.destreza));
      } else {
        modDesAplicado = 0;
      }
    } else {
      // Fallback para armaduras homebrew / custom
      caBase = 11; // Base genérica
      tipoArmadura = "Ligera";
      modDesAplicado = modificadores.destreza;
    }
    desglosePartes.push(`${armaduraObj.nombre} ${caBase}`);
    if (modDesAplicado !== 0) {
      desglosePartes.push(`DES ${modDesAplicado >= 0 ? `+${modDesAplicado}` : modDesAplicado}`);
    }
  } else {
    // Sin armadura equipada
    caBase = 10;
    desglosePartes.push(`Base 10`);
    if (esBarbaro) {
      // Defensa sin armadura Bárbaro: 10 + DES + CON
      const modCon = modificadores.constitucion || 0;
      desglosePartes.push(`DES ${modDesAplicado >= 0 ? `+${modDesAplicado}` : modDesAplicado}`);
      if (modCon !== 0) {
        desglosePartes.push(`CON ${modCon >= 0 ? `+${modCon}` : modCon}`);
        caBase += modCon;
      }
    } else if (esMonje && !escudoObj) {
      // Defensa sin armadura Monje: 10 + DES + SAB (sin escudo)
      const modSab = modificadores.sabiduria || 0;
      desglosePartes.push(`DES ${modDesAplicado >= 0 ? `+${modDesAplicado}` : modDesAplicado}`);
      if (modSab !== 0) {
        desglosePartes.push(`SAB ${modSab >= 0 ? `+${modSab}` : modSab}`);
        caBase += modSab;
      }
    } else {
      if (modDesAplicado !== 0) {
        desglosePartes.push(`DES ${modDesAplicado >= 0 ? `+${modDesAplicado}` : modDesAplicado}`);
      }
    }
  }

  // 2. Escudo
  let bonoEscudo = 0;
  let escudoNombre: string | null = null;
  if (escudoObj) {
    escudoNombre = escudoObj.nombre;
    bonoEscudo = 2;
    desglosePartes.push(`${escudoObj.nombre} +2`);
  }

  // 3. Bonos Mágicos y Efectos Pasivos de CA
  let bonosMagicos = 0;
  if (armaduraObj?.esMagico && armaduraObj.nombre.includes("+")) {
    const match = armaduraObj.nombre.match(/\+(\d+)/);
    if (match) {
      const b = parseInt(match[1], 10);
      bonosMagicos += b;
      desglosePartes.push(`Magia +${b}`);
    }
  }
  if (escudoObj?.esMagico && escudoObj.nombre.includes("+")) {
    const match = escudoObj.nombre.match(/\+(\d+)/);
    if (match) {
      const b = parseInt(match[1], 10);
      bonosMagicos += b;
      desglosePartes.push(`Escudo Mágico +${b}`);
    }
  }

  let bonosPasivosCA = 0;
  for (const efecto of efectosPasivosActivos) {
    const tipoNorm = normalizar(efecto.tipo || "");
    if (tipoNorm === "ca" || tipoNorm === "defensa" || tipoNorm === "clase de armadura") {
      const valNum = Number(efecto.valor) || (efecto.bono && !isNaN(Number(efecto.bono)) ? Number(efecto.bono) : 1);
      bonosPasivosCA += valNum;
    }
  }

  if (bonosPasivosCA > 0) {
    bonosMagicos += bonosPasivosCA;
    desglosePartes.push(`Objetos Mágicos +${bonosPasivosCA}`);
  }

  if (bonosModificadorDirectoArmadura > 0 && !armaduraObj?.nombre.includes("+") && !escudoObj?.nombre.includes("+")) {
    bonosMagicos += bonosModificadorDirectoArmadura;
    desglosePartes.push(`Refuerzo Mágico +${bonosModificadorDirectoArmadura}`);
  }

  let desventajaSigiloArmadura = false;
  if (armaduraObj) {
    const nombreNorm = normalizar(armaduraObj.nombre);
    const refOficial = ARMADURAS_OFICIALES[nombreNorm];
    if (refOficial?.desventajaSigilo || (armaduraObj.notas && normalizar(armaduraObj.notas).includes("desventaja en sigilo"))) {
      desventajaSigiloArmadura = true;
    }
  }

  const totalCA = caBase + modDesAplicado + bonoEscudo + bonosMagicos;

  const claseArmadura: InformacionCA = {
    total: totalCA,
    base: caBase,
    modDestrezaAplicado: modDesAplicado,
    bonoEscudo,
    bonosMagicos,
    armaduraEquipadaNombre: armaduraNombre,
    escudoEquipadoNombre: escudoNombre,
    tipoArmadura,
    desglose: `CA ${totalCA} (${desglosePartes.join(" + ")})`,
    desventajaSigilo: desventajaSigiloArmadura
  };

  // ==========================================
  // PENALIZACIÓN POR ARMADURA SIN COMPETENCIA (D&D 5.5e)
  // ==========================================
  let armaduraNoCompetente: string | null = null;
  let escudoNoCompetente: string | null = null;

  const gruposArmadura = pj?.competenciasArmadurasGrupos || [];
  const listaArmaduras = pj?.competenciasArmadurasLista || [];

  if (armaduraObj) {
    const subcat = tipoArmadura !== "Sin Armadura" ? tipoArmadura : "Ligera";
    const esCompArmadura = esCompetenteConArmadura(
      armaduraObj.nombre,
      subcat,
      gruposArmadura,
      listaArmaduras
    );
    if (!esCompArmadura) {
      armaduraNoCompetente = armaduraObj.nombre;
    }
  }

  if (escudoObj) {
    const esCompEscudo = esCompetenteConArmadura(
      escudoObj.nombre,
      "Escudo",
      gruposArmadura,
      listaArmaduras
    );
    if (!esCompEscudo) {
      escudoNoCompetente = escudoObj.nombre;
    }
  }

  const penalizacionArmadura: PenalizacionArmadura = {
    sinCompetencia: !!armaduraNoCompetente || !!escudoNoCompetente,
    armaduraNoCompetente,
    escudoNoCompetente
  };

  return {
    bonoCompetencia,
    puntuacionesEfectivas,
    modificadores,
    salvaciones,
    habilidades,
    pasivas,
    claseArmadura,
    penalizacionArmadura,
    desventajaSigiloArmadura
  };
}

/** Estado de lectura de personajes. */
export function usarEstadoPersonajes() {
  return usarAlmacenDM(
    useShallow((s) => {
      const listaPjs = s.personajes || [];
      const activo =
        listaPjs.find((pj) => pj && pj.id === s.idPersonajeActivo) ||
        listaPjs[0] ||
        null;

      return {
        personajes: listaPjs,
        idPersonajeActivo: s.idPersonajeActivo || (activo ? activo.id : null),
        personajeActivo: activo
      };
    })
  );
}

/** Acciones de escritura de personajes. */
export function usarAccionesPersonajes() {
  return usarAlmacenDM(
    useShallow((s) => ({
      crearPersonaje:                      s.crearPersonaje,
      actualizarPersonaje:                s.actualizarPersonaje,
      eliminarPersonaje:                  s.eliminarPersonaje,
      duplicarPersonaje:                  s.duplicarPersonaje,
      seleccionarPersonajeActivo:         s.seleccionarPersonajeActivo,
      modificarHPPersonaje:               s.modificarHPPersonaje,
      aplicarCuracionPersonaje:           s.aplicarCuracionPersonaje,
      aplicarDanoPersonaje:               s.aplicarDanoPersonaje,
      establecerHPActualPersonaje:        s.establecerHPActualPersonaje,
      modificarHPMaximoEfectivoPersonaje: s.modificarHPMaximoEfectivoPersonaje,
      modificarHPMaximoBasePersonaje:     s.modificarHPMaximoBasePersonaje,
      modificarHPTemporalPersonaje:       s.modificarHPTemporalPersonaje,
      gastarDadoGolpePersonaje:           s.gastarDadoGolpePersonaje,
      ejecutarDescansoPersonaje:          s.ejecutarDescansoPersonaje,
      alternarInspiracionPersonaje:       s.alternarInspiracionPersonaje,
      modificarSalvacionesMuertePersonaje: s.modificarSalvacionesMuertePersonaje,
      establecerSalvacionesMuertePersonaje: s.establecerSalvacionesMuertePersonaje,
      reiniciarSalvacionesMuertePersonaje: s.reiniciarSalvacionesMuertePersonaje,
      modificarCansancioPersonaje:        s.modificarCansancioPersonaje,
      modificarCaracteristicaBasePersonaje: s.modificarCaracteristicaBasePersonaje,
      alternarSalvacionPersonaje:         s.alternarSalvacionPersonaje,
      ciclarGradoHabilidadPersonaje:      s.ciclarGradoHabilidadPersonaje,
      establecerGradoHabilidadPersonaje:  s.establecerGradoHabilidadPersonaje,
      personalizarHabilidadPersonaje:     s.personalizarHabilidadPersonaje,
      personalizarCaracteristicaPersonaje: s.personalizarCaracteristicaPersonaje,
      aplicarCondicionPersonaje:          s.aplicarCondicionPersonaje,
      quitarCondicionPersonaje:           s.quitarCondicionPersonaje,
      vincularMiniaturaTSPersonaje:       s.vincularMiniaturaTSPersonaje,

      // Magia y Lanzamiento de Conjuros
      configurarLanzadorConjuros:         s.configurarLanzadorConjuros,
      establecerConcentracion:            s.establecerConcentracion,
      romperConcentracion:                s.romperConcentracion,
      agregarTrucoConocido:               s.agregarTrucoConocido,
      quitarTrucoConocido:                s.quitarTrucoConocido,
      agregarConjuroConocido:             s.agregarConjuroConocido,
      quitarConjuroConocido:              s.quitarConjuroConocido,
      alternarConjuroPreparado:           s.alternarConjuroPreparado,
      gastarEspacioConjuro:               s.gastarEspacioConjuro,
      recuperarEspacioConjuro:            s.recuperarEspacioConjuro,
      recuperarTodosEspaciosConjuro:      s.recuperarTodosEspaciosConjuro,
      gastarPuntosConjuro:                s.gastarPuntosConjuro,
      recuperarPuntosConjuro:             s.recuperarPuntosConjuro,
      recuperarTodosPuntosConjuro:        s.recuperarTodosPuntosConjuro,
      gastarEspacioPacto:                 s.gastarEspacioPacto,
      recuperarEspaciosPacto:             s.recuperarEspaciosPacto,
      establecerOverrideEspacios:         s.establecerOverrideEspacios,
      establecerOverridePuntos:           s.establecerOverridePuntos,
      recalcularRecursosMagicos:          s.recalcularRecursosMagicos,

      // Inventario y Monedas
      agregarObjetoInventario:            s.agregarObjetoInventario,
      quitarObjetoInventario:             s.quitarObjetoInventario,
      modificarCantidadObjeto:            s.modificarCantidadObjeto,
      alternarEquipadoObjeto:             s.alternarEquipadoObjeto,
      alternarSintonizadoObjeto:          s.alternarSintonizadoObjeto,
      actualizarNotasObjeto:              s.actualizarNotasObjeto,
      actualizarObjetoInventario:         s.actualizarObjetoInventario,
      modificarCargasObjeto:              s.modificarCargasObjeto,
      cambiarContenedorObjeto:            s.cambiarContenedorObjeto,
      reordenarInventario:                s.reordenarInventario,
      desempaquetarPaquete:               s.desempaquetarPaquete,
      establecerMonedas:                  s.establecerMonedas,
      modificarMoneda:                    s.modificarMoneda
    }))
  );
}
