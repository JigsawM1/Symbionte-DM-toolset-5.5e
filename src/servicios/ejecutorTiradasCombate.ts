import type {
  PersonajeJugador,
  Caracteristica,
  ObjetoJuego
} from "@/tipos";
import type { EstadisticasCalculadasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import type { AtaquePersonajeCalculado } from "@/componentes/caracteristicas/ataques/TarjetaAtaquePersonaje";
import type { ConsumibleAccionCalculado } from "@/componentes/caracteristicas/ataques/TarjetaConsumibleAccion.tipos";
import { lanzarDadosTaleSpire, sanitizarEtiqueta } from "@/utiles/lanzadorDados";
import { evaluarEfectosCondicionesEnTirada } from "@/servicios/procesadorCondiciones";
import { esMunicionCompatibleConArma } from "@/servicios/gestorMunicion";
import { evaluarFormulaDados } from "@/servicios/procesadorConsumibles";
import { logger } from "@/utiles/logger";

export interface ContextoTiradaAtaqueFisico {
  ataque: AtaquePersonajeCalculado;
  personajeActivo: PersonajeJugador | null;
  statsCalculadas: EstadisticasCalculadasPersonaje | null;
  baseDatosObjetos: ObjetoJuego[];
  modificarCantidadObjeto: (idPersonaje: string, idInstancia: string, cambio: number) => void;
  agregarNotificacion: (mensaje: string, tipo?: "info" | "exito" | "advertencia" | "error") => void;
}

export async function ejecutarTiradaAtaqueFisico(ctx: ContextoTiradaAtaqueFisico): Promise<void> {
  const {
    ataque,
    personajeActivo,
    statsCalculadas,
    baseDatosObjetos,
    modificarCantidadObjeto,
    agregarNotificacion
  } = ctx;

  try {
    const nombrePj = personajeActivo?.nombre?.trim() || "Personaje";

    const evaluacionCondiciones = evaluarEfectosCondicionesEnTirada({
      tipo: "ataque",
      caracteristica: ataque.caracteristicaUsada as Caracteristica,
      penalizacionArmadura: !!statsCalculadas?.penalizacionArmadura?.sinCompetencia,
      desventajaSigiloArmadura: !!statsCalculadas?.desventajaSigiloArmadura,
      condicionesActivas: personajeActivo?.condicionesActivas,
      personaje: personajeActivo || undefined
    });

    const bonoFinal = ataque.bonoAtaque + evaluacionCondiciones.penalizadorD20;
    const bonoStr = bonoFinal >= 0 ? `+${bonoFinal}` : `${bonoFinal}`;

    if (ataque.caracteristicaUsada === "fuerza") {
      const rasgoGolpeBrutal = (personajeActivo?.rasgos || []).find(
        (r) => (r.id.includes("golpe_brutal") || r.nombre.toLowerCase().includes("golpe brutal")) && r.activo
      );
      if (rasgoGolpeBrutal && evaluacionCondiciones.modoEfectivo === "ventaja") {
        evaluacionCondiciones.modoEfectivo = "plano";
        evaluacionCondiciones.motivosModificadores.push("Golpe Brutal (Renuncia a ventaja)");
      }
    }

    const motivos = [
      ...evaluacionCondiciones.motivosDesventaja,
      ...evaluacionCondiciones.motivosVentaja,
      ...evaluacionCondiciones.motivosModificadores
    ].join(", ");

    const sufijoMotivo = motivos ? ` (${motivos})` : "";

    let formula = `1d20${bonoStr}`;
    let etiqueta = `${nombrePj}: Ataque con ${ataque.nombre}${sufijoMotivo}`;

    if (evaluacionCondiciones.modoEfectivo === "ventaja") {
      formula = `2d20kh1${bonoStr}`;
      etiqueta = `${nombrePj}: Ataque con ${ataque.nombre} (Ventaja)${sufijoMotivo}`;
    } else if (evaluacionCondiciones.modoEfectivo === "desventaja") {
      formula = `2d20kl1${bonoStr}`;
      etiqueta = `${nombrePj}: Ataque con ${ataque.nombre} (Desventaja)${sufijoMotivo}`;
    }

    if (ataque.requiereMunicion) {
      if (!ataque.puedeDisparar) {
        agregarNotificacion(
          ataque.motivoBloqueo || `No puedes disparar con ${ataque.nombre}. Falta munición lista.`,
          "error"
        );
        return;
      }

      const inventarioActual = personajeActivo?.inventario || [];
      const municionEncontrada = inventarioActual.find((it) =>
        esMunicionCompatibleConArma(ataque.nombre, it, ataque.propiedades, baseDatosObjetos)
      );

      if (municionEncontrada && personajeActivo) {
        modificarCantidadObjeto(personajeActivo.id, municionEncontrada.idInstancia, -1);
        const cantidadRestante = municionEncontrada.cantidad - 1;
        const avisoMunicion =
          cantidadRestante > 0
            ? `Quedan ${cantidadRestante} ${municionEncontrada.nombre}.`
            : `¡Has agotado tu reserva de ${municionEncontrada.nombre}!`;

        agregarNotificacion(
          `Has disparado 1 ${municionEncontrada.nombre}. ${avisoMunicion}`,
          cantidadRestante > 0 ? "info" : "advertencia"
        );
      }
    }

    await lanzarDadosTaleSpire(formula, etiqueta);
  } catch (error) {
    logger.error("Error al tirar ataque:", error);
  }
}

export async function ejecutarTiradaDanoFisico(
  ataque: AtaquePersonajeCalculado,
  personajeActivo: PersonajeJugador | null,
  esVersatil: boolean = false
): Promise<void> {
  try {
    const nombrePj = personajeActivo?.nombre?.trim() || "Personaje";
    const formulaRaw = esVersatil && ataque.danoVersatil ? ataque.danoVersatil : ataque.dadoDano;

    const subgrupos = formulaRaw.split("/");
    const formulasTaleSpire: string[] = [];

    for (let i = 0; i < subgrupos.length; i++) {
      const sub = subgrupos[i].trim();
      const etiquetaSub = i === 0
        ? `${nombrePj} - Daño ${ataque.nombre}${esVersatil ? " (A dos manos)" : ""}`
        : `${nombrePj} - Daño Extra ${ataque.nombre} (Efecto)`;
      const etiquetaLimpia = sanitizarEtiqueta(etiquetaSub);

      if (!sub.includes("d")) {
        const valorFijo = parseInt(sub, 10);
        if (!isNaN(valorFijo)) {
          formulasTaleSpire.push(`${etiquetaLimpia}:1d1+${valorFijo - 1}`);
        } else {
          formulasTaleSpire.push(`${etiquetaLimpia}:${sub}`);
        }
      } else {
        formulasTaleSpire.push(`${etiquetaLimpia}:${sub}`);
      }
    }

    const formulaCompuesta = formulasTaleSpire.join("/");
    await lanzarDadosTaleSpire(formulaCompuesta, `${nombrePj}: Daño ${ataque.nombre}`);
  } catch (error) {
    logger.error("Error al tirar daño:", error);
  }
}

export async function ejecutarTiradaCritico(
  ataque: AtaquePersonajeCalculado,
  personajeActivo: PersonajeJugador | null,
  esVersatil: boolean = false
): Promise<void> {
  try {
    const nombrePj = personajeActivo?.nombre?.trim() || "Personaje";
    const dadoBaseRaw = esVersatil && ataque.dadoVersatilBase ? ataque.dadoVersatilBase : ataque.dadoDanoBase;
    const mod = ataque.modificadorDano;

    const subgruposBase = dadoBaseRaw.split("/");
    const formulasTaleSpire: string[] = [];

    for (let i = 0; i < subgruposBase.length; i++) {
      const subBase = subgruposBase[i].trim();
      const etiquetaSub = i === 0
        ? `${nombrePj} - CRÍTICO ${ataque.nombre}${esVersatil ? " (A dos manos)" : ""}`
        : `${nombrePj} - CRÍTICO Extra ${ataque.nombre}`;
      const etiquetaLimpia = sanitizarEtiqueta(etiquetaSub);

      const partesDados = subBase.match(/(\d+)d(\d+)/gi);

      if (partesDados && partesDados.length > 0) {
        let formulaDadosDuplicados = subBase;
        for (const p of partesDados) {
          const m = p.match(/(\d+)d(\d+)/i);
          if (m) {
            const cant = parseInt(m[1], 10) * 2;
            const caras = m[2];
            formulaDadosDuplicados = formulaDadosDuplicados.replace(p, `${cant}d${caras}`);
          }
        }

        if (i === 0 && mod !== 0) {
          const signo = mod >= 0 ? `+${mod}` : `${mod}`;
          formulasTaleSpire.push(`${etiquetaLimpia}:${formulaDadosDuplicados}${signo}`);
        } else {
          formulasTaleSpire.push(`${etiquetaLimpia}:${formulaDadosDuplicados}`);
        }
      } else {
        const valorFijo = parseInt(subBase, 10);
        if (!isNaN(valorFijo)) {
          const modTotal = (i === 0 ? mod : 0) + valorFijo - 1;
          const signo = modTotal >= 0 ? `+${modTotal}` : `${modTotal}`;
          formulasTaleSpire.push(`${etiquetaLimpia}:1d1${signo}`);
        } else {
          formulasTaleSpire.push(`${etiquetaLimpia}:${subBase}`);
        }
      }
    }

    const formulaFinal = formulasTaleSpire.join("/");
    await lanzarDadosTaleSpire(formulaFinal, `${nombrePj}: CRÍTICO con ${ataque.nombre}`);
  } catch (error) {
    logger.error("Error al tirar daño crítico:", error);
  }
}

export interface ContextoUsoConsumible {
  consumible: ConsumibleAccionCalculado;
  personajeActivo: PersonajeJugador | null;
  aplicarCuracionPersonaje: (idPersonaje: string, cantidad: number) => void;
  modificarCantidadObjeto: (idPersonaje: string, idInstancia: string, cambio: number) => void;
  agregarNotificacion: (mensaje: string, tipo?: "info" | "exito" | "advertencia" | "error") => void;
}

export async function ejecutarUsoConsumible(ctx: ContextoUsoConsumible): Promise<void> {
  const {
    consumible,
    personajeActivo,
    aplicarCuracionPersonaje,
    modificarCantidadObjeto,
    agregarNotificacion
  } = ctx;

  if (!personajeActivo) return;

  try {
    if (consumible.esCurativo && consumible.formulaCuracion) {
      const nombrePj = personajeActivo.nombre?.trim() || "Personaje";
      const formula = consumible.formulaCuracion;
      const etiqueta = `${nombrePj}: Curación con ${consumible.nombre}`;

      await lanzarDadosTaleSpire(formula, etiqueta);

      const resultadoEstimado = evaluarFormulaDados(formula);
      if (resultadoEstimado > 0) {
        aplicarCuracionPersonaje(personajeActivo.id, resultadoEstimado);
      }

      modificarCantidadObjeto(personajeActivo.id, consumible.idInstancia, -1);
      agregarNotificacion(
        `Has usado ${consumible.nombre} y recuperado ${resultadoEstimado} PG (aprox). Quedan ${consumible.cantidad - 1}.`,
        "exito"
      );
    } else {
      modificarCantidadObjeto(personajeActivo.id, consumible.idInstancia, -1);
      agregarNotificacion(
        `Has usado ${consumible.nombre}. Quedan ${consumible.cantidad - 1}.`,
        "info"
      );
    }
  } catch (error) {
    logger.error("Error al usar consumible:", error);
  }
}
