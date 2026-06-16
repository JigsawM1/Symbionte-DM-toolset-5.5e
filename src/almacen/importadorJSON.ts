import { MonstruoBase, HechizoBase, ObjetoHomebrew, EsquemaMonstruoBase, EsquemaHechizoBase, EsquemaObjetoJuego } from '../tipos';
import { aplanarValor, sanearObjetoHomebrew, sanearHechizoCD, parsearVelocidad, parsearSentidos, sanearMonstruoSentidosYPasiva } from './sanitizacion';

export interface ResultadoImportacion {
  modificado: boolean;
  baseDatosMonstruos: MonstruoBase[];
  baseDatosHechizos: HechizoBase[];
  objetosHomebrew: ObjetoHomebrew[];
}

function limpiarTipoCriatura(tipoRaw: unknown): string {
  if (!tipoRaw) return "Humanoide";
  const t = String(tipoRaw).toLowerCase();
  if (t.includes("aberración") || t.includes("aberracion") || t.includes("aberration")) return "Aberración";
  if (t.includes("bestia") || t.includes("beast")) return "Bestia";
  if (t.includes("celestial")) return "Celestial";
  if (t.includes("constructo") || t.includes("construct")) return "Constructo";
  if (t.includes("dragón") || t.includes("dragon")) return "Dragón";
  if (t.includes("elemental")) return "Elemental";
  if (t.includes("hada") || t.includes("fata") || t.includes("fey") || t.includes("feérico") || t.includes("feerico")) return "Feérico";
  if (t.includes("gigante") || t.includes("giant")) return "Gigante";
  if (t.includes("humanoide") || t.includes("humanoid")) return "Humanoide";
  if (t.includes("monstruosidad") || t.includes("monstrosity")) return "Monstruosidad";
  if (t.includes("no muerto") || t.includes("no-muerto") || t.includes("undead")) return "No Muerto";
  if (t.includes("planta") || t.includes("plant")) return "Planta";
  if (t.includes("cieno") || t.includes("limo") || t.includes("ooze") || t.includes("slime")) return "Cieno";
  if (t.includes("fiando") || t.includes("demonio") || t.includes("diablo") || t.includes("fiend") || t.includes("infiando") || t.includes("devil") || t.includes("demon") || t.includes("infernal")) return "Infernal";
  
  return "Humanoide";
}

export function importarDesdeJSON(
  datosJSON: unknown,
  estadoActual: {
    baseDatosMonstruos: MonstruoBase[];
    baseDatosHechizos: HechizoBase[];
    objetosHomebrew: ObjetoHomebrew[];
  }
): ResultadoImportacion {
  try {
    let modificado = false;
    
    let monstruosFinales = estadoActual.baseDatosMonstruos;
    let hechizosFinales = estadoActual.baseDatosHechizos;
    let objetosFinales = estadoActual.objetosHomebrew;

    let monstruosCandidatos: unknown[] = [];
    let hechizosCandidatos: unknown[] = [];
    let objetosCandidatos: unknown[] = [];

    const datosObj = (datosJSON && typeof datosJSON === "object" ? datosJSON : {}) as Record<string, unknown>;

    // 1. Si viene con el formato de backup o estructura agrupada o global.json
    if (datosObj.monstruos) {
      monstruosCandidatos = Array.isArray(datosObj.monstruos) ? datosObj.monstruos : Object.values(datosObj.monstruos);
    }
    if (datosObj["Custom Monsters"]) {
      monstruosCandidatos = Array.isArray(datosObj["Custom Monsters"]) ? (datosObj["Custom Monsters"] as unknown[]) : Object.values(datosObj["Custom Monsters"] as Record<string, unknown>);
    }

    if (datosObj.hechizos) {
      hechizosCandidatos = Array.isArray(datosObj.hechizos) ? datosObj.hechizos : Object.values(datosObj.hechizos);
    }
    if (datosObj["Custom Spells"]) {
      hechizosCandidatos = Array.isArray(datosObj["Custom Spells"]) ? (datosObj["Custom Spells"] as unknown[]) : Object.values(datosObj["Custom Spells"] as Record<string, unknown>);
    }

    if (datosObj.objetos) {
      objetosCandidatos = Array.isArray(datosObj.objetos) ? datosObj.objetos : Object.values(datosObj.objetos);
    }
    if (datosObj["Custom Equipment"]) {
      objetosCandidatos = Array.isArray(datosObj["Custom Equipment"]) ? (datosObj["Custom Equipment"] as unknown[]) : Object.values(datosObj["Custom Equipment"] as Record<string, unknown>);
    }

    // 2. Si el archivo JSON es en sí mismo una lista o diccionario plano
    if (monstruosCandidatos.length === 0 && hechizosCandidatos.length === 0 && objetosCandidatos.length === 0) {
      const listaElementos = Array.isArray(datosJSON) ? datosJSON : Object.values(datosObj);
      
      if (listaElementos.length > 0) {
        const primerElem = listaElementos[0] as Record<string, unknown> | undefined;
        if (primerElem && (primerElem.equipment_category !== undefined || primerElem.weapon_category !== undefined || primerElem.armor_category !== undefined || primerElem.tool_category !== undefined || primerElem.cost !== undefined)) {
          objetosCandidatos = listaElementos;
        } else if (primerElem && (primerElem.HP !== undefined || primerElem.AC !== undefined || primerElem.vidaMaxima !== undefined || primerElem.vidaActual !== undefined)) {
          monstruosCandidatos = listaElementos;
        } else if (primerElem && (
          primerElem.school !== undefined || primerElem.level !== undefined ||
          primerElem.escuela !== undefined || primerElem.casting_time !== undefined ||
          primerElem.tiempo_de_lanzamiento !== undefined || primerElem.tirada_de_salvacion !== undefined ||
          primerElem.requiere_ataque !== undefined
        )) {
          hechizosCandidatos = listaElementos;
        } else if (primerElem && (primerElem.rareza !== undefined || primerElem.rare !== undefined || primerElem.propiedades !== undefined)) {
          objetosCandidatos = listaElementos;
        }
      }
    }

    // Procesar Monstruos importados
    if (monstruosCandidatos.length > 0) {
      const nuevosMonstruosFormateados: MonstruoBase[] = monstruosCandidatos.map((item, idx) => {
        const m = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;

        // Extraer HP
        let vidaMax = 10;
        let vidaNotas = "";
        const hpRaw = m.vidaMaxima !== undefined ? m.vidaMaxima : m.HP;
        if (hpRaw !== undefined) {
          if (typeof hpRaw === "object" && hpRaw !== null) {
            const hpObj = hpRaw as Record<string, unknown>;
            vidaMax = Number(hpObj.Value) || 10;
            vidaNotas = aplanarValor(hpObj.Notes || "");
          } else {
            vidaMax = Number(hpRaw) || 10;
          }
        }
        if (m.vidaNotas !== undefined && !vidaNotas) {
          vidaNotas = aplanarValor(m.vidaNotas);
        }

        // Extraer AC
        let caVal = 10;
        let caNotas = "";
        const caRaw = m.ca !== undefined ? m.ca : m.AC;
        if (caRaw !== undefined) {
          if (typeof caRaw === "object" && caRaw !== null) {
            const acObj = caRaw as Record<string, unknown>;
            caVal = Number(acObj.Value) || 10;
            caNotas = aplanarValor(acObj.Notes || "");
          } else {
            caVal = Number(caRaw) || 10;
          }
        }

        // Extraer Habilidades (Características)
        const caracteristicasFormateadas = {
          fuerza: 10,
          destreza: 10,
          constitucion: 10,
          inteligencia: 10,
          sabiduria: 10,
          carisma: 10
        };
        if (m.caracteristicas && typeof m.caracteristicas === "object") {
          const cObj = m.caracteristicas as Record<string, unknown>;
          caracteristicasFormateadas.fuerza = Number(cObj.fuerza) || 10;
          caracteristicasFormateadas.destreza = Number(cObj.destreza) || 10;
          caracteristicasFormateadas.constitucion = Number(cObj.constitucion) || 10;
          caracteristicasFormateadas.inteligencia = Number(cObj.inteligencia) || 10;
          caracteristicasFormateadas.sabiduria = Number(cObj.sabiduria) || 10;
          caracteristicasFormateadas.carisma = Number(cObj.carisma) || 10;
        } else if (m.Abilities && typeof m.Abilities === "object") {
          const aObj = m.Abilities as Record<string, unknown>;
          caracteristicasFormateadas.fuerza = Number(aObj.Fue || aObj.STR || aObj.Str) || 10;
          caracteristicasFormateadas.destreza = Number(aObj.Des || aObj.DEX || aObj.Dex) || 10;
          caracteristicasFormateadas.constitucion = Number(aObj.Con || aObj.CON || aObj.Con) || 10;
          caracteristicasFormateadas.inteligencia = Number(aObj.Int || aObj.INT || aObj.Int) || 10;
          caracteristicasFormateadas.sabiduria = Number(aObj.Sab || aObj.WIS || aObj.Wis) || 10;
          caracteristicasFormateadas.carisma = Number(aObj.Car || aObj.CHA || aObj.Cha) || 10;
        }

        // Extraer Velocidad
        let velocidadStr = "30 pies";
        const velRaw = m.velocidad !== undefined ? m.velocidad : m.Speed;
        if (Array.isArray(velRaw)) {
          velocidadStr = velRaw.join(", ");
        } else if (velRaw !== undefined && velRaw !== null) {
          velocidadStr = String(velRaw);
        }

        // Extraer iniciativa bonificador
        let inicBonif = 0;
        if (m.iniciativaBonificador !== undefined) {
          inicBonif = Number(m.iniciativaBonificador);
        } else if (m.InitiativeModifier !== undefined) {
          inicBonif = Number(m.InitiativeModifier);
        }

        // Mapear rasgos y acciones
        const rasgosRaw = Array.isArray(m.rasgos) ? m.rasgos : (Array.isArray(m.Traits) ? m.Traits : []);
        const rasgosFormateados = rasgosRaw.map((rRaw) => {
          const r = (rRaw && typeof rRaw === "object" ? rRaw : {}) as Record<string, unknown>;
          return {
            nombre: aplanarValor(r.nombre || r.Name || ""),
            descripcion: aplanarValor(r.descripcion || r.Content || ""),
            uso: aplanarValor(r.uso || r.Usage || "")
          };
        });

        const accionesRaw = Array.isArray(m.acciones) ? m.acciones : (Array.isArray(m.Actions) ? m.Actions : []);
        const accionesFormateadas = accionesRaw.map((aRaw) => {
          const a = (aRaw && typeof aRaw === "object" ? aRaw : {}) as Record<string, unknown>;
          const bonifAtaqueRaw = a.bonificadorAtaque !== undefined ? a.bonificadorAtaque : a.ToHit;
          let bonifAtaqueNum: number | undefined = undefined;
          if (bonifAtaqueRaw !== undefined && bonifAtaqueRaw !== null && bonifAtaqueRaw !== "") {
            const numClean = String(bonifAtaqueRaw).replace(/[^\d-]/g, "");
            const parsed = parseInt(numClean, 10);
            if (!isNaN(parsed)) {
              bonifAtaqueNum = parsed;
            }
          }
          return {
            nombre: aplanarValor(a.nombre || a.Name || ""),
            descripcion: aplanarValor(a.descripcion || a.Content || ""),
            bonificadorAtaque: bonifAtaqueNum,
            daño: aplanarValor(a.daño || a.Damage || ""),
            uso: aplanarValor(a.uso || a.Usage || "")
          };
        });

        const reaccionesRaw = Array.isArray(m.reacciones) ? m.reacciones : (Array.isArray(m.Reactions) ? m.Reactions : []);
        const reaccionesFormateadas = reaccionesRaw.map((rRaw) => {
          const r = (rRaw && typeof rRaw === "object" ? rRaw : {}) as Record<string, unknown>;
          return {
            nombre: aplanarValor(r.nombre || r.Name || ""),
            descripcion: aplanarValor(r.descripcion || r.Content || ""),
            uso: aplanarValor(r.uso || r.Usage || "")
          };
        });

        const legendariasRaw = Array.isArray(m.accionesLegendarias) ? m.accionesLegendarias : (Array.isArray(m.LegendaryActions) ? m.LegendaryActions : []);
        const legendariasFormateadas = legendariasRaw.map((lRaw) => {
          const l = (lRaw && typeof lRaw === "object" ? lRaw : {}) as Record<string, unknown>;
          return {
            nombre: aplanarValor(l.nombre || l.Name || ""),
            descripcion: aplanarValor(l.descripcion || l.Content || ""),
            uso: aplanarValor(l.uso || l.Usage || "")
          };
        });

        // Mapear salvaciones
        const salvacionesMap: Record<string, number> = {};
        if (Array.isArray(m.Saves)) {
          m.Saves.forEach((s) => {
            const sObj = (s && typeof s === "object" ? s : {}) as Record<string, unknown>;
            const nameLower = String(sObj.Name || "").toLowerCase();
            if (nameLower.includes("fue") || nameLower.includes("str")) salvacionesMap.fuerza = Number(sObj.Modifier);
            if (nameLower.includes("des") || nameLower.includes("dex")) salvacionesMap.destreza = Number(sObj.Modifier);
            if (nameLower.includes("con")) salvacionesMap.constitucion = Number(sObj.Modifier);
            if (nameLower.includes("int")) salvacionesMap.inteligencia = Number(sObj.Modifier);
            if (nameLower.includes("sab") || nameLower.includes("wis")) salvacionesMap.sabiduria = Number(sObj.Modifier);
            if (nameLower.includes("car") || nameLower.includes("cha")) salvacionesMap.carisma = Number(sObj.Modifier);
          });
        } else if (m.salvaciones && typeof m.salvaciones === "object") {
          const sObj = m.salvaciones as Record<string, unknown>;
          if (sObj.fuerza !== undefined) salvacionesMap.fuerza = Number(sObj.fuerza);
          if (sObj.destreza !== undefined) salvacionesMap.destreza = Number(sObj.destreza);
          if (sObj.constitucion !== undefined) salvacionesMap.constitucion = Number(sObj.constitucion);
          if (sObj.inteligencia !== undefined) salvacionesMap.inteligencia = Number(sObj.inteligencia);
          if (sObj.sabiduria !== undefined) salvacionesMap.sabiduria = Number(sObj.sabiduria);
          if (sObj.carisma !== undefined) salvacionesMap.carisma = Number(sObj.carisma);
        }

        // Mapear habilidades (skills)
        const habilidadesMap: Record<string, number> = {};
        if (Array.isArray(m.Skills)) {
          m.Skills.forEach((s) => {
            const sObj = (s && typeof s === "object" ? s : {}) as Record<string, unknown>;
            const nameLower = String(sObj.Name || "").toLowerCase();
            if (nameLower.includes("acrobacias") || nameLower.includes("acrobatics")) habilidadesMap.acrobacias = Number(sObj.Modifier);
            if (nameLower.includes("manejo") || nameLower.includes("animal")) habilidadesMap.manejoAnimales = Number(sObj.Modifier);
            if (nameLower.includes("arcana") || nameLower.includes("arcanos")) habilidadesMap.arcanos = Number(sObj.Modifier);
            if (nameLower.includes("atletismo") || nameLower.includes("athletics")) habilidadesMap.atletismo = Number(sObj.Modifier);
            if (nameLower.includes("engaño") || nameLower.includes("deception")) habilidadesMap.engaño = Number(sObj.Modifier);
            if (nameLower.includes("historia") || nameLower.includes("history")) habilidadesMap.historia = Number(sObj.Modifier);
            if (nameLower.includes("perspicacia") || nameLower.includes("insight")) habilidadesMap.perspicacia = Number(sObj.Modifier);
            if (nameLower.includes("intimidación") || nameLower.includes("intimidation")) habilidadesMap.intimidacion = Number(sObj.Modifier);
            if (nameLower.includes("investigación") || nameLower.includes("investigation")) habilidadesMap.investigacion = Number(sObj.Modifier);
            if (nameLower.includes("medicina") || nameLower.includes("medicine")) habilidadesMap.medicina = Number(sObj.Modifier);
            if (nameLower.includes("naturaleza") || nameLower.includes("nature")) habilidadesMap.naturaleza = Number(sObj.Modifier);
            if (nameLower.includes("percepción") || nameLower.includes("perception")) habilidadesMap.percepcion = Number(sObj.Modifier);
            if (nameLower.includes("interpretación") || nameLower.includes("performance")) habilidadesMap.interpretacion = Number(sObj.Modifier);
            if (nameLower.includes("persuasión") || nameLower.includes("persuasion")) habilidadesMap.persuasion = Number(sObj.Modifier);
            if (nameLower.includes("religión") || nameLower.includes("religion")) habilidadesMap.religion = Number(sObj.Modifier);
            if (nameLower.includes("juego") || nameLower.includes("sleight")) habilidadesMap.juegoManos = Number(sObj.Modifier);
            if (nameLower.includes("sigilo") || nameLower.includes("stealth")) habilidadesMap.sigilo = Number(sObj.Modifier);
            if (nameLower.includes("supervivencia") || nameLower.includes("survival")) habilidadesMap.supervivencia = Number(sObj.Modifier);
          });
        } else if (m.habilidades && typeof m.habilidades === "object") {
          const hObj = m.habilidades as Record<string, unknown>;
          if (hObj.acrobacias !== undefined) habilidadesMap.acrobacias = Number(hObj.acrobacias);
          if (hObj.manejoAnimales !== undefined) habilidadesMap.manejoAnimales = Number(hObj.manejoAnimales);
          if (hObj.arcanos !== undefined) habilidadesMap.arcanos = Number(hObj.arcanos);
          if (hObj.atletismo !== undefined) habilidadesMap.atletismo = Number(hObj.atletismo);
          if (hObj.engaño !== undefined) habilidadesMap.engaño = Number(hObj.engaño);
          if (hObj.historia !== undefined) habilidadesMap.historia = Number(hObj.historia);
          if (hObj.perspicacia !== undefined) habilidadesMap.perspicacia = Number(hObj.perspicacia);
          if (hObj.intimidacion !== undefined || hObj.intimidación !== undefined) habilidadesMap.intimidacion = Number(hObj.intimidacion ?? hObj.intimidación);
          if (hObj.investigacion !== undefined || hObj.investigación !== undefined) habilidadesMap.investigacion = Number(hObj.investigacion ?? hObj.investigación);
          if (hObj.medicina !== undefined) habilidadesMap.medicina = Number(hObj.medicina);
          if (hObj.naturaleza !== undefined) habilidadesMap.naturaleza = Number(hObj.naturaleza);
          if (hObj.percepcion !== undefined || hObj.percepción !== undefined) habilidadesMap.percepcion = Number(hObj.percepcion ?? hObj.percepción);
          if (hObj.interpretacion !== undefined || hObj.interpretación !== undefined) habilidadesMap.interpretacion = Number(hObj.interpretacion ?? hObj.interpretación);
          if (hObj.persuasion !== undefined || hObj.persuasión !== undefined) habilidadesMap.persuasion = Number(hObj.persuasion ?? hObj.persuasión);
          if (hObj.religion !== undefined || hObj.religión !== undefined) habilidadesMap.religion = Number(hObj.religion ?? hObj.religión);
          if (hObj.juegoManos !== undefined) habilidadesMap.juegoManos = Number(hObj.juegoManos);
          if (hObj.sigilo !== undefined) habilidadesMap.sigilo = Number(hObj.sigilo);
          if (hObj.supervivencia !== undefined) habilidadesMap.supervivencia = Number(hObj.supervivencia);
        }

        // Acciones rápidas (Quick actions)
        let accionesRapidasFormateadas: { nombre: string; bonificadorAtaque: string; dadosDaño: string; tipoDaño: string }[] = [];
        const qaRawList = Array.isArray(m.accionesRapidas) ? m.accionesRapidas : (Array.isArray(m.QuickAction) ? m.QuickAction : []);
        if (qaRawList.length > 0) {
          accionesRapidasFormateadas = qaRawList.map((qaRaw) => {
            const qa = (qaRaw && typeof qaRaw === "object" ? qaRaw : {}) as Record<string, unknown>;
            return {
              nombre: aplanarValor(qa.nombre || qa.Name || "Ataque"),
              bonificadorAtaque: aplanarValor(qa.bonificadorAtaque || qa.ToHit || "+0"),
              dadosDaño: aplanarValor(qa.dadosDaño || qa.Damage || "1d6"),
              tipoDaño: aplanarValor(qa.tipoDaño || qa.DamageType || "físico")
            };
          });
        }

        const monstruoSaneado = {
          id: aplanarValor(m.Id || m.id || `m_importado_${Date.now()}_${idx}`),
          nombre: aplanarValor(m.Name || m.nombre || "Monstruo Desconocido"),
          tipo: limpiarTipoCriatura(m.Type || m.tipo || "Humanoide"),
          ca: caVal,
          caNotas: aplanarValor(caNotas),
          vidaMaxima: vidaMax,
          vidaActual: vidaMax,
          vidaNotas: aplanarValor(vidaNotas),
          iniciativaBonificador: inicBonif,
          velocidad: (velRaw && typeof velRaw === "object" && !Array.isArray(velRaw))
            ? (velRaw as any)
            : parsearVelocidad(velocidadStr),
          sentidos: (m.sentidos && typeof m.sentidos === "object")
            ? (m.sentidos as any)
            : parsearSentidos(aplanarValor(m.sentidos || m.Senses)),
          idiomas: aplanarValor(m.idiomas || m.Languages),
          desafio: aplanarValor(m.Challenge || m.desafio || m.CR || "0"),
          fuente: aplanarValor(m.Source || m.fuente || "Manual de Monstruos"),
          caracteristicas: caracteristicasFormateadas,
          salvaciones: salvacionesMap,
          habilidades: habilidadesMap,
          vulnerabilidades: Array.isArray(m.vulnerabilidades) ? m.vulnerabilidades.map(aplanarValor) : (Array.isArray(m.DamageVulnerabilities) ? m.DamageVulnerabilities.map(aplanarValor) : []),
          resistencias: Array.isArray(m.resistencias) ? m.resistencias.map(aplanarValor) : (Array.isArray(m.DamageResistances) ? m.DamageResistances.map(aplanarValor) : []),
          inmunidadesDaño: Array.isArray(m.inmunidadesDaño) ? m.inmunidadesDaño.map(aplanarValor) : (Array.isArray(m.DamageImmunities) ? m.DamageImmunities.map(aplanarValor) : []),
          inmunidadesCondicion: Array.isArray(m.inmunidadesCondicion) ? m.inmunidadesCondicion.map(aplanarValor) : (Array.isArray(m.ConditionImmunities) ? m.ConditionImmunities.map(aplanarValor) : []),
          accionesRapidas: accionesRapidasFormateadas.map((qa) => ({
            nombre: aplanarValor(qa.nombre),
            bonificadorAtaque: aplanarValor(qa.bonificadorAtaque),
            dadosDaño: aplanarValor(qa.dadosDaño),
            tipoDaño: aplanarValor(qa.tipoDaño)
          })),
          rasgos: rasgosFormateados.map((r) => ({
            nombre: aplanarValor(r.nombre),
            descripcion: aplanarValor(r.descripcion),
            uso: aplanarValor(r.uso)
          })),
          acciones: accionesFormateadas.map((a) => ({
            nombre: aplanarValor(a.nombre),
            descripcion: aplanarValor(a.descripcion),
            bonificadorAtaque: a.bonificadorAtaque,
            daño: aplanarValor(a.daño),
            uso: aplanarValor(a.uso)
          })),
          reacciones: reaccionesFormateadas.map((r) => ({
            nombre: aplanarValor(r.nombre),
            descripcion: aplanarValor(r.descripcion),
            uso: aplanarValor(r.uso)
          })),
          accionesLegendarias: legendariasFormateadas.map((l) => ({
            nombre: aplanarValor(l.nombre),
            descripcion: aplanarValor(l.descripcion),
            uso: aplanarValor(l.uso)
          }))
        };

        const monstruoSaneadoConPasiva = sanearMonstruoSentidosYPasiva(monstruoSaneado as any);
        const val = EsquemaMonstruoBase.safeParse(monstruoSaneadoConPasiva);
        if (val.success) {
          return val.data;
        } else {
          console.warn("[Importador] Monstruo omitido por inconsistencias en el esquema:", monstruoSaneado.nombre, val.error.format());
          return null;
        }
      }).filter((m): m is MonstruoBase => m !== null);

      // Combinar, evitando duplicidad por nombre
      const monstruosFiltrados = estadoActual.baseDatosMonstruos.filter(
        (mExistente) => !nuevosMonstruosFormateados.some((mNuevo) => mNuevo.nombre.toLowerCase() === mExistente.nombre.toLowerCase())
      );

      monstruosFinales = [...monstruosFiltrados, ...nuevosMonstruosFormateados];
      modificado = true;
    }

    // Procesar Hechizos importados
    if (hechizosCandidatos.length > 0) {
      const nuevosHechizosFormateados: HechizoBase[] = hechizosCandidatos.map((item, idx) => {
        const h = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
        
        let nivelNum = 0;
        if (h.nivel !== undefined) {
          nivelNum = Number(h.nivel);
        } else if (h.level !== undefined) {
          const lvlStr = String(h.level).toLowerCase();
          if (lvlStr.includes("cantrip") || lvlStr.includes("truco")) {
            nivelNum = 0;
          } else {
            const matches = lvlStr.match(/\d+/);
            nivelNum = matches ? Number(matches[0]) : 1;
          }
        }

        let concentracionVal = false;
        if (h.concentracion !== undefined) {
          concentracionVal = !!h.concentracion;
        } else if (h.concentration !== undefined) {
          const cStr = String(h.concentration).toLowerCase();
          concentracionVal = cStr === "yes" || cStr === "true" || cStr === "sí" || cStr === "si";
        }

        let ritualVal = false;
        if (h.ritual !== undefined) {
          const rStr = String(h.ritual).toLowerCase().trim();
          ritualVal = rStr.length > 0 && rStr !== "no" && rStr !== "false";
        }

        // Componentes: admite array ["V","S","M"] (nuevo formato) o string "V, S, M" (formato clásico)
        let compStr: string;
        const compRaw = h.componentes || h.components;
        if (Array.isArray(compRaw)) {
          compStr = compRaw.map(aplanarValor).join(", ").toUpperCase();
        } else {
          compStr = aplanarValor(compRaw || "V, S").toUpperCase();
        }
        const componentesSeleccionados = {
          verbal: compStr.includes("V"),
          somatico: compStr.includes("S"),
          material: compStr.includes("M")
        };

        // Clases de hechizos (array o string separado por comas)
        let clasesArray: string[] = [];
        const claseRaw = h.clases || h.class || h.clase;
        if (Array.isArray(claseRaw)) {
          clasesArray = claseRaw.map(aplanarValor);
        } else if (typeof claseRaw === "string" && claseRaw.trim()) {
          clasesArray = claseRaw.split(",").map((c: string) => c.trim()).filter(Boolean);
        }

        // Alcance: nuevo formato puede ser array ["60 pies", "18 m"] → usar versión imperial/pies (primera)
        let alcanceStr: string;
        if (Array.isArray(h.alcance)) {
          const arr = (h.alcance as unknown[]).map(aplanarValor).filter(Boolean);
          alcanceStr = arr[0] || "Personal"; // primer elemento = imperial/pies
        } else {
          alcanceStr = aplanarValor(h.alcance || h.range || "Personal");
        }

        // Descripción: nuevo formato puede ser array [imperial, métrico] → usar imperial/pies (primer elemento)
        // Si es string, usarlo directamente.
        let desc: string;
        if (Array.isArray(h.descripcion)) {
          const arr = (h.descripcion as unknown[]).map(aplanarValor).filter(Boolean);
          desc = arr[0] || ""; // primer elemento = versión imperial/pies
        } else {
          desc = aplanarValor(h.descripcion || h.desc || "");
        }

        // Sanitizar el texto de descripción corrigiendo las corrupciones del JSON original
        const descClean = desc
          .replace(/(\d+)d26\s*pies[áa]s/gi, "$1d8 más")
          .replace(/(\d+)d40\s*pies[áa]s/gi, "$1d12 más")
          .replace(/(\d+)d13\s*piesenos/gi, "$1d4 menos")
          .replace(/pies[áa]s/gi, "más")
          .replace(/piesenos/gi, "menos");

        // Extraer "a niveles superiores" y su daño de upcast
        let descNivelSuperior = h.descNivelSuperior || h.higher_level 
          ? aplanarValor(h.descNivelSuperior || h.higher_level).replace(/^(?:\s*<\/?[a-z0-9]+>)+/gi, '').trim() 
          : undefined;
        let dadosDanoNivelSuperior = h.dadosDañoNivelSuperior || h.dadosDanoNivelSuperior || h.damage_dice_upcast || h.higher_level_damage ? aplanarValor(h.dadosDañoNivelSuperior || h.dadosDanoNivelSuperior || h.damage_dice_upcast || h.higher_level_damage) : undefined;

        if (!descNivelSuperior) {
          const upcastRegex = /(?:con un espacio de conjuro de nivel superior|a niveles superiores|al lanzarse a un nivel superior|lanzado con un espacio de nivel superior).*?[\.:]\s*(.*)/i;
          const upcastMatch = descClean.match(upcastRegex);
          if (upcastMatch) {
            descNivelSuperior = upcastMatch[1].replace(/^(?:\s*<\/?[a-z0-9]+>)+/gi, '').trim();
          }
        }

        // Extraer dados de daño base si no vienen definidos
        let dadosDano = h.dadosDaño || h.dadosDano || h.damage_dice ? aplanarValor(h.dadosDaño || h.dadosDano || h.damage_dice) : undefined;
        if (!dadosDano) {
          let descSencilla = descClean;
          const upcastIndex = descClean.search(/(?:con un espacio de conjuro de nivel superior|a niveles superiores|al lanzarse a un nivel superior|lanzado con un espacio de nivel superior)/i);
          if (upcastIndex !== -1) {
            descSencilla = descClean.substring(0, upcastIndex);
          }
          const diceMatch = descSencilla.match(/(\d+d\d+(?:\s*[\+\-]\s*\d+)?)/);
          if (diceMatch) {
            dadosDano = diceMatch[1].replace(/\s+/g, "");
          }
        }

        // Extraer dados de daño de nivel superior
        if (descNivelSuperior && !dadosDanoNivelSuperior) {
          const upcastDiceMatch = descNivelSuperior.match(/(\d+d\d+(?:\s*[\+\-]\s*\d+)?)/);
          if (upcastDiceMatch) {
            dadosDanoNivelSuperior = upcastDiceMatch[1].replace(/\s+/g, "");
          } else if (dadosDano) {
            const descNivelSuperiorLower = descNivelSuperior.toLowerCase();
            if (
              descNivelSuperiorLower.includes("dardo adicional") ||
              descNivelSuperiorLower.includes("rayo adicional") ||
              descNivelSuperiorLower.includes("proyectil adicional") ||
              descNivelSuperiorLower.includes("flecha adicional") ||
              descNivelSuperiorLower.includes("un dardo más") ||
              descNivelSuperiorLower.includes("un rayo más") ||
              descNivelSuperiorLower.includes("un proyectil más")
            ) {
              dadosDanoNivelSuperior = dadosDano;
            } else {
              const matchBaseDice = dadosDano.match(/\d+d(\d+)/);
              if (matchBaseDice) {
                const caras = matchBaseDice[1];
                if (descNivelSuperiorLower.includes("daño") || descNivelSuperiorLower.includes("dano") || descNivelSuperiorLower.includes("aumenta")) {
                  dadosDanoNivelSuperior = `1d${caras}`;
                }
              }
            }
          }
        }

        // Extraer/inferir tipo de daño
        let tipoDano = h.tipoDaño || h.tipoDano || h.damage_type_01 ? aplanarValor(h.tipoDaño || h.tipoDano || h.damage_type_01).toLowerCase() : undefined;
        if (!tipoDano && dadosDano) {
          const danoTypes = ["ácido", "frío", "fuego", "relámpago", "veneno", "psíquico", "radiante", "cortante", "contundente", "perforante", "fuerza", "trueno", "necrótico", "curación"];
          const descLower = descClean.toLowerCase();
          for (const t of danoTypes) {
            if (descLower.includes(t)) {
              tipoDano = t;
              break;
            }
          }
        }
        
        // Preservar compatibilidad rústica: solo agregar extras a la descripción si es formato
        // clásico (tiene damage_dice / dadosDaño como campo separado) Y no tiene tirada_de_salvacion
        // explícita (nuevo formato ya tiene toda la info en el texto de descripcion).
        // NUNCA concatenar el 'A Niveles Superiores' a la descripción — va en su campo propio.
        const esFormatoNuevo = h.tirada_de_salvacion !== undefined || h.requiere_ataque !== undefined || h.tiempo_de_lanzamiento !== undefined;
        if (!esFormatoNuevo) {
          const extras: string[] = [];
          const dmgDiceRaw = h.damage_dice || h.dadosDaño || h.dadosDano;
          if (dmgDiceRaw) {
            let mech = `**Daño:** ${aplanarValor(dmgDiceRaw)}`;
            const dmgTypeRaw = h.damage_type_01 || h.tipoDaño || h.tipoDano;
            if (dmgTypeRaw) mech += ` (${aplanarValor(dmgTypeRaw)})`;
            if (h.spell_save_dc_type) mech += ` | CD Salvación: ${String(h.spell_save_dc_type).toUpperCase()}`;
            extras.push(mech);
          }
          if (extras.length > 0) {
            desc += "\n\n" + extras.join("\n");
          }
        }

        // tirada_de_salvacion (nuevo formato) → cdSalvacion
        // Mapear tanto el nuevo campo tirada_de_salvacion como el clásico spell_save_dc_type
        const tiradaSalv = h.tirada_de_salvacion || h.spell_save_dc_type;

        // CD de salvación mapeado (nuevo: tirada_de_salvacion | clásico: spell_save_dc_type)
        let cdSalv = "";
        if (tiradaSalv) {
          const dcType = String(tiradaSalv).toUpperCase().trim();
          if (dcType.includes("STR") || dcType.includes("FUE") || dcType.includes("FUERZA")) cdSalv = "Fuerza";
          else if (dcType.includes("DEX") || dcType.includes("DES") || dcType.includes("DESTREZA")) cdSalv = "Destreza";
          else if (dcType.includes("CON") || dcType.includes("CONSTITUCIÓN") || dcType.includes("CONSTITUCION")) cdSalv = "Constitución";
          else if (dcType.includes("INT") || dcType.includes("INTELIGENCIA")) cdSalv = "Inteligencia";
          else if (dcType.includes("WIS") || dcType.includes("SAB")) cdSalv = "Sabiduría";
          else if (dcType.includes("CHA") || dcType.includes("CAR")) cdSalv = "Carisma";
        }

        if (!cdSalv) {
          // Escanear descripción para deducir la característica de salvación
          const descLower = descClean.toLowerCase();
          if (descLower.includes("salvación de destreza") || descLower.includes("tirada de salvación de destreza") || descLower.includes("salvación: dex") || descLower.includes("salvación: des") || descLower.includes("salvacion de destreza")) {
            cdSalv = "Destreza";
          } else if (descLower.includes("salvación de sabiduría") || descLower.includes("tirada de salvación de sabiduría") || descLower.includes("salvación: sab") || descLower.includes("salvación: wis") || descLower.includes("salvacion de sabiduria") || descLower.includes("salvación de sabidur")) {
            cdSalv = "Sabiduría";
          } else if (descLower.includes("salvación de constitución") || descLower.includes("tirada de salvación de constitución") || descLower.includes("salvación: con") || descLower.includes("salvacion de constitucion")) {
            cdSalv = "Constitución";
          } else if (descLower.includes("salvación de inteligencia") || descLower.includes("tirada de salvación de inteligencia") || descLower.includes("salvación: int") || descLower.includes("salvacion de inteligencia")) {
            cdSalv = "Inteligencia";
          } else if (descLower.includes("salvación de fuerza") || descLower.includes("tirada de salvación de fuerza") || descLower.includes("salvación: fue") || descLower.includes("salvación: str") || descLower.includes("salvacion de fuerza")) {
            cdSalv = "Fuerza";
          } else if (descLower.includes("salvación de carisma") || descLower.includes("tirada de salvación de carisma") || descLower.includes("salvación: car") || descLower.includes("salvación: cha") || descLower.includes("salvacion de carisma")) {
            cdSalv = "Carisma";
          }
        }

        // Tiempo de lanzamiento: nuevo campo tiempo_de_lanzamiento | clásico: tiempoLanzamiento | inglés: casting_time
        const tiempoLanzamiento = aplanarValor(
          h.tiempo_de_lanzamiento || h.tiempoLanzamiento || h.casting_time || "1 acción"
        );

        // Duración: nuevo campo duracion | clásico: duracion | inglés: duration
        const duracion = aplanarValor(h.duracion || h.duration || "");

        const hechizoMapeado = {
          id: aplanarValor(h.id || h.Id || `h_importado_${Date.now()}_${idx}`),
          nombre: aplanarValor(h.nombre || h.name || "Hechizo Desconocido"),
          nivel: nivelNum,
          escuela: aplanarValor(h.escuela || h.school || "Universal"),
          tiempoLanzamiento,
          alcance: alcanceStr,
          componentes: compStr,
          descripcion: aplanarValor(descClean),
          concentracion: concentracionVal,
          ritual: ritualVal,
          
          descNivelSuperior: descNivelSuperior || undefined,
          materiales: (h.materiales !== null && h.materiales !== undefined) ? aplanarValor(h.materiales) : (h.material ? aplanarValor(h.material) : undefined),
          componentesSeleccionados,
          duracion: duracion || undefined,
          clases: clasesArray.length > 0 ? clasesArray : undefined,
          ataqueCd: h.ataqueCd ? aplanarValor(h.ataqueCd)
            : (h.requiere_ataque === true ? "TIRADA DE ATAQUE"
            : (tiradaSalv ? "CD DE SALVACIÓN"
            : (dadosDano ? "TIRADA DE ATAQUE" : "N/A"))),
          dadosDaño: dadosDano || undefined,
          dadosDañoNivelSuperior: dadosDanoNivelSuperior || undefined,
          cdSalvacion: cdSalv || (h.cdSalvacion && String(h.cdSalvacion).toUpperCase().trim() !== "CD DC" && String(h.cdSalvacion).toUpperCase().trim() !== "DC" ? aplanarValor(h.cdSalvacion) : (h.toHitOrDC && String(h.toHitOrDC).toUpperCase().trim() !== "CD DC" && String(h.toHitOrDC).toUpperCase().trim() !== "DC" ? aplanarValor(h.toHitOrDC) : undefined)),
          agregarModificadorHabilidad: h.agregarModificadorHabilidad !== undefined ? !!h.agregarModificadorHabilidad : (h.ability_modifier === "yes" || h.ability_modifier === true || h.add_ability_modifier === "yes" || h.add_ability_modifier === true || undefined),
          tipoDaño: tipoDano || undefined
        };

        const saneado = sanearHechizoCD(hechizoMapeado);
        const val = EsquemaHechizoBase.safeParse(saneado);
        if (val.success) {
          return val.data;
        } else {
          console.warn("[Importador] Hechizo omitido por inconsistencias en el esquema:", saneado.nombre, val.error.format());
          return null;
        }
      }).filter((h): h is HechizoBase => h !== null);

      const hechizosFiltrados = estadoActual.baseDatosHechizos.filter(
        (hExistente) => !nuevosHechizosFormateados.some((hNuevo) => hNuevo.nombre.toLowerCase().trim() === hExistente.nombre.toLowerCase().trim())
      );

      hechizosFinales = [...hechizosFiltrados, ...nuevosHechizosFormateados];
      modificado = true;
    }

    // Procesar Objetos importados (incluyendo equipamiento de equipment-es.json)
    if (objetosCandidatos.length > 0) {
      const nuevosObjetosFormateados: ObjetoHomebrew[] = objetosCandidatos.map((item, idx) => {
        const o = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;

        const nombre = aplanarValor(o.nombre || o.name || "Objeto Desconocido");
        const rareza = aplanarValor(o.rareza || o.rarity || (o.magic_item ? "Mágico" : "Común"));
        
        const propiedadesArr: string[] = [];
        
        // Categoría de equipamiento
        let categoriaStr = "OTRO";
        if (o.equipment_category) {
          categoriaStr = aplanarValor(typeof o.equipment_category === 'object' && o.equipment_category !== null ? (o.equipment_category as Record<string, unknown>).name : o.equipment_category);
        } else if (o.magic_item) {
          categoriaStr = "OBJETO MÁGICO";
        } else if (o.weapon_category) {
          categoriaStr = "ARMA";
        } else if (o.armor_category) {
          categoriaStr = "ARMADURA";
        }
        if (categoriaStr) propiedadesArr.push(categoriaStr);

        if (o.weapon_category) propiedadesArr.push(`Arma ${aplanarValor(o.weapon_category)}`);
        if (o.armor_category) propiedadesArr.push(`Armadura ${aplanarValor(o.armor_category)}`);
        
        // Costo y unidad traducida en español
        let cVal = 0;
        let cUni = "PO";
        if (o.cost) {
          if (typeof o.cost === 'object' && o.cost !== null) {
            const costObj = o.cost as Record<string, unknown>;
            cVal = Number(costObj.quantity) || 0;
            const unitRaw = String(costObj.unit || "gp").toLowerCase().trim();
            if (unitRaw === "cp") cUni = "PC";
            else if (unitRaw === "sp") cUni = "PP";
            else if (unitRaw === "ep") cUni = "PE";
            else if (unitRaw === "gp") cUni = "PO";
            else if (unitRaw === "pp") cUni = "PPT";
            propiedadesArr.push(`Coste: ${cVal} ${cUni}`);
          } else {
            const costStr = String(o.cost).trim();
            const matches = costStr.match(/(\d+)\s*([a-zA-Z]+)/);
            if (matches) {
              cVal = Number(matches[1]) || 0;
              const unitRaw = matches[2].toLowerCase();
              if (unitRaw === "cp") cUni = "PC";
              else if (unitRaw === "sp") cUni = "PP";
              else if (unitRaw === "ep") cUni = "PE";
              else if (unitRaw === "gp") cUni = "PO";
              else if (unitRaw === "pp") cUni = "PPT";
            } else {
              cVal = Number(costStr) || 0;
            }
            propiedadesArr.push(`Coste: ${cVal} ${cUni}`);
          }
        }
        
        // Peso
        let pesoStr = "";
        if (o.weight !== undefined && o.weight !== null) {
          pesoStr = `${aplanarValor(o.weight)} lb`;
          propiedadesArr.push(`Peso: ${pesoStr}`);
        }
        
        // Daño (para armas)
        let dmgDice = "";
        let dmgType = "";
        if (o.damage) {
          if (typeof o.damage === 'object' && o.damage !== null) {
            const dmgObj = o.damage as Record<string, unknown>;
            dmgDice = aplanarValor(dmgObj.damage_dice || "");
            const dmgTypeName = dmgObj.damage_type ? (typeof dmgObj.damage_type === 'object' && dmgObj.damage_type !== null ? (dmgObj.damage_type as Record<string, unknown>).name : dmgObj.damage_type) : "";
            dmgType = aplanarValor(dmgTypeName).toLowerCase();
            if (dmgDice) {
              propiedadesArr.push(`Daño: ${dmgDice}${dmgType ? ` (${dmgType})` : ""}`);
            }
          } else {
            dmgDice = String(o.damage);
            propiedadesArr.push(`Daño: ${dmgDice}`);
          }
        }

        // Bonificación mágica
        let bonoAtkStr = "";
        let bonoDmgStr = "";
        if (o.toHitBonus) {
          bonoAtkStr = String(o.toHitBonus);
          propiedadesArr.push(`Bono Ataque: +${bonoAtkStr}`);
        }
        if (o.damageBonus) {
          bonoDmgStr = String(o.damageBonus);
          propiedadesArr.push(`Bono Daño: +${bonoDmgStr}`);
        }
        
        // Cargas / Sintonización
        const propArmaArr: string[] = [];
        if (o.hasCharges || o.tieneCargas) {
          propArmaArr.push("Tiene cargas");
          let cargasStr = "Tiene Cargas";
          if (o.chargesOptions && typeof o.chargesOptions === 'object') {
            const coObj = o.chargesOptions as Record<string, unknown>;
            const maxC = coObj.max || coObj.cantidadMax;
            if (maxC) cargasStr = `Cargas: ${aplanarValor(maxC)} máx`;
          }
          propiedadesArr.push(cargasStr);
        }

        // Deducir propiedades de armas desde el array original 'properties'
        if (Array.isArray(o.properties)) {
          o.properties.forEach((p) => {
            const propName = aplanarValor(p && typeof p === 'object' ? (p as Record<string, unknown>).name : p).toLowerCase().trim();
            if (propName.includes("finesse") || propName.includes("sutil")) propArmaArr.push("Sutil");
            else if (propName.includes("versatile") || propName.includes("versátil")) propArmaArr.push("Versátil");
            else if (propName.includes("heavy") || propName.includes("pesado")) propArmaArr.push("Pesado");
            else if (propName.includes("light") || propName.includes("ligero")) propArmaArr.push("Ligero");
            else if (propName.includes("loading") || propName.includes("carga")) propArmaArr.push("Carga");
            else if (propName.includes("reach") || propName.includes("alcance")) propArmaArr.push("Alcance");
            else if (propName.includes("thrown") || propName.includes("arrojadiza")) propArmaArr.push("Arrojadiza");
            else if (propName.includes("two-handed") || propName.includes("a dos manos")) propArmaArr.push("A dos manos");
            else if (propName.includes("silvered") || propName.includes("plateado")) propArmaArr.push("Plateado");
            else if (propName.includes("special") || propName.includes("especial")) propArmaArr.push("Especial");
            else if (propName.includes("ammunition") || propName.includes("munición")) propArmaArr.push("Munición");
            else if (propName.includes("sintonización") || propName.includes("attunement") || propName.includes("sintonizacion")) propArmaArr.push("Sintonización");
          });
        }

        // Bonos adicionales
        let bonosMagicosLista: { categoria: string; bono: string; valor: number }[] = [];
        if (Array.isArray(o.bonus) && o.bonus.length > 0) {
          bonosMagicosLista = o.bonus.map((b) => {
            if (b && typeof b === 'object') {
              const bObj = b as Record<string, unknown>;
              return {
                categoria: aplanarValor(bObj.category || bObj.categoria || "OTRO"),
                bono: aplanarValor(bObj.bonus || bObj.bono || ""),
                valor: Number(bObj.value || bObj.valor) || 0
              };
            }
            return { categoria: "OTRO", bono: aplanarValor(b), valor: 0 };
          });

          const bonosStr = bonosMagicosLista.map(b => `${b.categoria} ${b.bono}: +${b.valor}`).join(', ');
          if (bonosStr) propiedadesArr.push(`Bonos: ${bonosStr}`);
        }
        
        if (Array.isArray(o.properties)) {
          const props = o.properties.map((p) => aplanarValor(p && typeof p === 'object' ? (p as Record<string, unknown>).name : p)).filter(Boolean).join(', ');
          if (props) propiedadesArr.push(`Propiedades: ${props}`);
        } else if (typeof o.properties === 'string' && o.properties.trim()) {
          propiedadesArr.push(aplanarValor(o.properties));
        }
        
        let propiedadesFinal = propiedadesArr.join(" | ");
        if (!propiedadesFinal) propiedadesFinal = aplanarValor(o.propiedades || "Ninguna");
        
        // Descripción
        const descRaw = o.desc || o.descripcion || o.description || "";
        let descripcion = aplanarValor(descRaw);
        
        // Si no tiene descripción pero tiene otras claves (como armor_class, speed, etc.)
        if (!descripcion && o.armor_class && typeof o.armor_class === "object" && o.armor_class !== null) {
          const acObj = o.armor_class as Record<string, unknown>;
          descripcion = `Clase de Armadura (CA): ${acObj.base}` + (acObj.dex_bonus ? ` + Des (Máx ${acObj.max_bonus || "ilimitado"})` : "") + (o.str_minimum ? ` | Requisito Fuerza: ${o.str_minimum}` : "") + (o.stealth_disadvantage ? " | Desventaja en Sigilo" : "");
        }
        
        const objetoMapeado = sanearObjetoHomebrew({
          ...o, // Conservar todas las propiedades originales clásicas para que sanearObjetoHomebrew las mapee con total precisión (armor_class, armor_category, str_minimum, etc.)
          id: o.index || o.id || `o_importado_${Date.now()}_${idx}`,
          nombre,
          rareza,
          // IMPORTANTE: NO sobreescribir 'propiedades' aquí — sanearObjetoHomebrew lee 'o.properties' (array original)
          // para armas. Usar '_propiedadesTexto' como metadato de display sin pisar el array fuente.
          _propiedadesTexto: propiedadesFinal,
          descripcion: descripcion || "Sin descripción disponible.",
          
          // Metadatos enriquecidos
          categoria: categoriaStr,
          costoValor: cVal,
          costoUnidad: cUni,
          peso: pesoStr,
          tipoArma: o.weapon_category ? String(o.weapon_category).toUpperCase() : "N/A",
          estiloAtaque: o.weapon_range ? String(o.weapon_range).toUpperCase() : "N/A",
          alcance: o.range ? aplanarValor(typeof o.range === "object" && o.range !== null ? (o.range as Record<string, unknown>).normal : o.range) : undefined,
          propiedadesArma: propArmaArr,
          dadosDaño: dmgDice || undefined,
          tipoDaño: dmgType || undefined,
          bonoAtaque: bonoAtkStr || undefined,
          bonoDaño: bonoDmgStr || undefined,
          bonosMagicos: bonosMagicosLista.length > 0 ? bonosMagicosLista : undefined
        });

        const val = EsquemaObjetoJuego.safeParse(objetoMapeado);
        if (val.success) {
          return val.data as ObjetoHomebrew;
        } else {
          console.warn("[Importador] Objeto omitido por inconsistencias en el esquema Zod:", objetoMapeado.nombre, val.error.format());
          return null;
        }
      }).filter((o): o is ObjetoHomebrew => o !== null);

      const objetosFiltrados = estadoActual.objetosHomebrew
        .map(sanearObjetoHomebrew)
        .filter(
          (oExistente) => !nuevosObjetosFormateados.some((oNuevo) => oNuevo.nombre.toLowerCase().trim() === oExistente.nombre.toLowerCase().trim())
        );

      objetosFinales = [...objetosFiltrados, ...nuevosObjetosFormateados];
      modificado = true;
    }

    return {
      modificado,
      baseDatosMonstruos: monstruosFinales,
      baseDatosHechizos: hechizosFinales,
      objetosHomebrew: objetosFinales
    };
  } catch (e) {
    console.error("[Importador] Falló la importación del JSON:", e);
    return {
      modificado: false,
      baseDatosMonstruos: estadoActual.baseDatosMonstruos,
      baseDatosHechizos: estadoActual.baseDatosHechizos,
      objetosHomebrew: estadoActual.objetosHomebrew
    };
  }
}
