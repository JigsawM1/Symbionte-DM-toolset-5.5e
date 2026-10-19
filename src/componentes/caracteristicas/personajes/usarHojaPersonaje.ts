import { useState, useEffect, useMemo, useCallback } from "react";
import { dadosAdicionalesTirada, emitirTiradaConRasgos } from "@/servicios/rasgos/emisionTiradaRasgos";
import { emitirSalvacionConRasgos } from "@/servicios/rasgos/emisionSalvacionRasgos";
import { resolverTiradaHabilidadRasgos } from "@/servicios/rasgos/tiradaHabilidadRasgos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { usarPersonajeActivo, usarAccionesPersonajes, calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import { usarTipoTirada, usarSistemaMagia, usarPestanaActiva } from "@/almacen/selectores/usarEstadoConfiguracion";
import { usarEstadoHomebrew } from "@/almacen/selectores/usarEstadoHomebrew";
import { usarAccionesIniciativa, usarEstadoIniciativa } from "@/almacen/selectores/usarEstadoIniciativa";
import { lanzarDadosTaleSpire, sanitizarEtiqueta, type MetadataIniciativa } from "@/utiles/lanzadorDados";
import { ts } from "@/utiles/TaleSpireAdapter";
import { logger } from "@/utiles/logger";
import { evaluarEfectosCondicionesEnTirada } from "@/servicios/procesadorCondiciones";
import { calcularBonoIniciativaRasgos, evaluarVentajasDeRasgosEnTirada } from "@/servicios/evaluadorEfectosRasgos";
import type { Caracteristica, Habilidad } from "@/tipos";
import type { ModoTirada } from "./BarraTacticaPersonaje";
import type { CategoriaCompetencia } from "./ModalSelectorCompetencias";
import type { AccionDescanso } from "@/servicios/procesadorDescansos";
import { usarEstadoPersistido } from "@/hooks";

export type SubPestanaHoja = "general" | "conjuros";

export function usarHojaPersonaje(alAbrirConfiguracion?: () => void) {
  const personajeActivo = usarPersonajeActivo();
  const tipoTirada = usarTipoTirada();
  const sistemaMagia = usarSistemaMagia();
  const pestañaActiva = usarPestanaActiva();
  const { baseDatosHechizos, objetosHomebrew } = usarEstadoHomebrew();
  const {
    actualizarPersonaje, modificarHPPersonaje, establecerHPActualPersonaje,
    modificarHPMaximoEfectivoPersonaje, modificarHPTemporalPersonaje,
    establecerDadosGolpeRestantesPersonaje, ejecutarDescansoPersonaje,
    alternarInspiracionPersonaje, establecerSalvacionesMuertePersonaje,
    reiniciarSalvacionesMuertePersonaje, modificarCansancioPersonaje,
    modificarCaracteristicaBasePersonaje, alternarSalvacionPersonaje,
    ciclarGradoHabilidadPersonaje, aplicarCondicionPersonaje,
    quitarCondicionPersonaje, vincularMiniaturaTSPersonaje,
    establecerPosicionInicialTSPersonaje, gastarEspacioConjuro,
    recuperarEspacioConjuro, recuperarTodosEspaciosConjuro,
    gastarPuntosConjuro, recuperarPuntosConjuro, recuperarTodosPuntosConjuro,
    gastarEspacioPacto, recuperarEspaciosPacto, establecerConcentracion,
    romperConcentracion, quitarTrucoConocido, alternarConjuroPreparado,
    desprepararConjuroPersonaje, quitarEfectoPersonaje,
    dispararRasgosIniciativaPersonaje
  } = usarAccionesPersonajes();

  const { establecerTipoTirada } = usarAccionesIniciativa();
  const { rondaActual } = usarEstadoIniciativa();

  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false);
  const [modalCompetencias, setModalCompetencias] = useState<CategoriaCompetencia | null>(null);
  const [modalDescanso, setModalDescanso] = useState<{
    abierto: boolean;
    tipo: "corto" | "largo";
    acciones: AccionDescanso[];
  }>({ abierto: false, tipo: "corto", acciones: [] });
  const [subPestanaActiva, setSubPestanaActiva] = usarEstadoPersistido<SubPestanaHoja>(
    "ts_hoja_subpestana",
    "general"
  );

  // Precargar posición inicial de TaleSpire si el personaje tiene miniatura vinculada pero no posición base
  useEffect(() => {
    if (!personajeActivo?.idMiniaturaTS || personajeActivo.ultimaPosicionTS) return;
    ts.creatures
      .getMoreInfo([personajeActivo.idMiniaturaTS])
      .then((infos) => {
        if (infos && infos.length > 0 && infos[0]?.position) {
          logger.info(`[HojaPersonaje] Posición física inicial detectada para '${personajeActivo.nombre}':`, infos[0].position);
          establecerPosicionInicialTSPersonaje(personajeActivo.id, infos[0].position, infos[0].boardId);
        }
      })
      .catch((err) => {
        logger.debug("[HojaPersonaje] Error al precargar posición de miniatura:", err);
      });
  }, [personajeActivo?.id, personajeActivo?.idMiniaturaTS, personajeActivo?.ultimaPosicionTS, personajeActivo?.nombre, establecerPosicionInicialTSPersonaje]);

  useEffect(() => {
    if (pestañaActiva === "conjuros") setSubPestanaActiva("conjuros");
  }, [pestañaActiva, setSubPestanaActiva]);

  const manejarAbrirEdicion = useCallback(() => {
    if (alAbrirConfiguracion) alAbrirConfiguracion();
    else setModalEdicionAbierto(true);
  }, [alAbrirConfiguracion]);

  const statsCalculadas = useMemo(
    () => (personajeActivo ? calcularEstadisticasPersonaje(personajeActivo, objetosHomebrew) : null),
    [personajeActivo, objetosHomebrew]
  );

  const modoTirada: ModoTirada = useMemo(
    () => (tipoTirada === "ventaja" ? "vent" : tipoTirada === "desventaja" ? "disv" : "plano"),
    [tipoTirada]
  );

  const manejarCambioModoTirada = useCallback((modo: ModoTirada) => {
    establecerTipoTirada(modo === "vent" ? "ventaja" : modo === "disv" ? "desventaja" : "plano");
  }, [establecerTipoTirada]);

  const manejarDescansoCorto = useCallback(() => {
    if (!personajeActivo) return;
    const res = ejecutarDescansoPersonaje(personajeActivo.id, "corto", 0);
    setModalDescanso({ abierto: true, tipo: "corto", acciones: res?.acciones || [] });
  }, [personajeActivo, ejecutarDescansoPersonaje]);

  const manejarDescansoLargo = useCallback(() => {
    if (!personajeActivo) return;
    const res = ejecutarDescansoPersonaje(personajeActivo.id, "largo");
    setModalDescanso({ abierto: true, tipo: "largo", acciones: res?.acciones || [] });
  }, [personajeActivo, ejecutarDescansoPersonaje]);

  const lanzarTiradaD20Personaje = useCallback(async (
    etiqueta: string,
    bono: number,
    metaIniciativa?: MetadataIniciativa,
    tipoTiradaCondicion?: "ventaja" | "desventaja" | "plano",
    sufijoMotivo?: string,
    objetivoRasgo?: string
  ) => {
    if (!personajeActivo) return false;
    try {
      const nombrePj = personajeActivo.nombre?.trim() || "Personaje";
      const formulaDados = `!${sanitizarEtiqueta(etiqueta)}:1d20${bono >= 0 ? "+" : ""}${bono}${objetivoRasgo ? dadosAdicionalesTirada(personajeActivo, objetivoRasgo) : ""}`;
      const seAnulan = (tipoTirada === "ventaja" && tipoTiradaCondicion === "desventaja") || (tipoTirada === "desventaja" && tipoTiradaCondicion === "ventaja");
      const sufijoLog = seAnulan
        ? " (Ventaja y Desventaja se anulan -> Tirada Plana)"
        : sufijoMotivo && tipoTirada === "plano" ? ` (${sufijoMotivo})` : "";
      const etiquetaLog = `${nombrePj} - ${etiqueta}${sufijoLog}`;
      const emitir = () => lanzarDadosTaleSpire(formulaDados, etiquetaLog, metaIniciativa, undefined, tipoTiradaCondicion);

      return await emitirTiradaConRasgos(personajeActivo, objetivoRasgo ?? "d20", emitir, (id, consumir) => {
        const estado = usarAlmacenDM.getState();
        if (consumir) estado.operarRecursoRasgoPersonaje(personajeActivo.id, { tipo: "finalizarPreparacion", idRasgo: id });
        else if (estado.personajes.find(p => p.id === personajeActivo.id)?.rasgos.find(r => r.id === id)?.activo)
          estado.alternarActivoRasgo(personajeActivo.id, id);
      });
    } catch (err) {
      logger.error("[HojaPersonaje] Error al enviar tirada 3D:", err);
      return false;
    }
  }, [personajeActivo, tipoTirada]);

  const penalizacionSinComp = !!statsCalculadas?.penalizacionArmadura?.sinCompetencia;
  const desventajaSigiloArmadura = !!statsCalculadas?.desventajaSigiloArmadura;

  const manejarTirarCaracteristica = useCallback((carac: Caracteristica, etiqueta: string, bono: number) => {
    if (!personajeActivo) return;
    const ev = evaluarEfectosCondicionesEnTirada({
      tipo: "caracteristica", caracteristica: carac, penalizacionArmadura: penalizacionSinComp,
      desventajaSigiloArmadura, condicionesActivas: personajeActivo.condicionesActivas, personaje: personajeActivo
    });
    const motivos = [...ev.motivosDesventaja, ...ev.motivosVentaja, ...ev.motivosModificadores].join(", ");
    void lanzarTiradaD20Personaje(`Prueba de ${etiqueta}`, bono + ev.penalizadorD20, undefined, ev.modoEfectivo !== "plano" ? ev.modoEfectivo : undefined, motivos);
  }, [personajeActivo, penalizacionSinComp, desventajaSigiloArmadura, lanzarTiradaD20Personaje]);

  const manejarTirarSalvacion = useCallback(async (carac: Caracteristica, etiqueta: string, bono: number) => {
    if (!personajeActivo) return;
    const etiquetaLimpia = etiqueta.replace(/^Salvaci[oó]n(\s+de)?\s+/i, "");
    const ev = evaluarEfectosCondicionesEnTirada({
      tipo: "salvacion", caracteristica: carac, penalizacionArmadura: penalizacionSinComp,
      desventajaSigiloArmadura, condicionesActivas: personajeActivo.condicionesActivas, personaje: personajeActivo
    });
    const motivos = [...ev.motivosDesventaja, ...ev.motivosVentaja, ...ev.motivosModificadores].join(", ");
    await emitirSalvacionConRasgos(personajeActivo, () => lanzarTiradaD20Personaje(
      `Salvación de ${etiquetaLimpia}`, bono + ev.penalizadorD20, undefined,
      ev.modoEfectivo !== "plano" ? ev.modoEfectivo : undefined, motivos
    ), idRasgo => {
      const estado = usarAlmacenDM.getState();
      if (estado.personajes.find(p => p.id === personajeActivo.id)?.rasgos.find(r => r.id === idRasgo)?.activo)
        estado.alternarActivoRasgo(personajeActivo.id, idRasgo);
    }, idRasgo => usarAlmacenDM.getState().gastarUsoRasgoPersonaje(personajeActivo.id, idRasgo));
  }, [personajeActivo, penalizacionSinComp, desventajaSigiloArmadura, lanzarTiradaD20Personaje]);

  const manejarTirarHabilidad = useCallback((hab: Habilidad, nombre: string, bono: number, caracteristica?: Caracteristica) => {
    if (!personajeActivo || !statsCalculadas) return;
    const tirada = resolverTiradaHabilidadRasgos(personajeActivo, hab, statsCalculadas.modificadores, statsCalculadas.habilidades[hab], caracteristica);
    const ev = evaluarEfectosCondicionesEnTirada({
      tipo: "caracteristica", caracteristica: tirada.caracteristica, habilidad: hab,
      penalizacionArmadura: penalizacionSinComp, desventajaSigiloArmadura,
      condicionesActivas: personajeActivo.condicionesActivas, personaje: personajeActivo
    });
    const bonoFinal = (caracteristica ? tirada.bono : bono) + ev.penalizadorD20;
    const motivos = [...ev.motivosDesventaja, ...ev.motivosVentaja, ...ev.motivosModificadores].join(", ");
    void lanzarTiradaD20Personaje(`Prueba de ${nombre}`, bonoFinal, undefined, ev.modoEfectivo !== "plano" ? ev.modoEfectivo : undefined, motivos, `habilidad.${hab}`);
  }, [personajeActivo, statsCalculadas, penalizacionSinComp, desventajaSigiloArmadura, lanzarTiradaD20Personaje]);

  const manejarTirarIniciativa = useCallback(async () => {
    if (!personajeActivo || !statsCalculadas) return;
    const ev = evaluarEfectosCondicionesEnTirada({
      tipo: "iniciativa", caracteristica: "destreza", penalizacionArmadura: penalizacionSinComp,
      desventajaSigiloArmadura, condicionesActivas: personajeActivo.condicionesActivas, personaje: personajeActivo
    });
    const bonoFinal = statsCalculadas.modificadores.destreza + (personajeActivo.iniciativaBono || 0) + calcularBonoIniciativaRasgos(personajeActivo) + ev.penalizadorD20;
    const metaInic: MetadataIniciativa = {
      tipo: "iniciativa", criaturaId: personajeActivo.idMiniaturaTS || personajeActivo.id,
      nombrePersonaje: personajeActivo.nombre, idMiniaturaTS: personajeActivo.idMiniaturaTS, idPersonaje: personajeActivo.id
    };
    const emitida = await lanzarTiradaD20Personaje("Iniciativa", bonoFinal, metaInic, ev.modoEfectivo !== "plano" ? ev.modoEfectivo : undefined, undefined, "iniciativa");
    if (emitida) dispararRasgosIniciativaPersonaje(personajeActivo.id);
  }, [personajeActivo, statsCalculadas, penalizacionSinComp, desventajaSigiloArmadura, lanzarTiradaD20Personaje, dispararRasgosIniciativaPersonaje]);

  const manejarTirarSalvacionMuerte3D = useCallback(async () => {
    if (!personajeActivo) return;
    const nombrePj = personajeActivo.nombre?.trim() || "Personaje";
    const resVentaja = evaluarVentajasDeRasgosEnTirada(personajeActivo, { tipoTirada: "salvacion", subtipo: "muerte" });
    const modoForzado = resVentaja.tieneVentaja && !resVentaja.tieneDesventaja
      ? "ventaja" : resVentaja.tieneDesventaja && !resVentaja.tieneVentaja ? "desventaja" : undefined;

    await emitirTiradaConRasgos(personajeActivo, "salvacion.muerte", () => lanzarDadosTaleSpire(
      "!Salvacion Muerte:1d20", `${nombrePj} - Salvación Muerte`, undefined,
      { tipo: "salvacionMuerte", personajeId: personajeActivo.id }, modoForzado
    ), (id, consumir) => {
      if (consumir) usarAlmacenDM.getState().operarRecursoRasgoPersonaje(personajeActivo.id, { tipo: "finalizarPreparacion", idRasgo: id });
      else usarAlmacenDM.getState().alternarActivoRasgo(personajeActivo.id, id);
    });
  }, [personajeActivo]);

  const manejarTirarDadoGolpe = useCallback(async () => {
    const pjActual = usarAlmacenDM.getState().personajes.find((p) => p.id === personajeActivo?.id) ?? personajeActivo;
    if (!pjActual || pjActual.dadosGolpeRestantes <= 0) return;
    const tipoDado = pjActual.tipoDadoGolpe || "d8";
    const nombrePj = pjActual.nombre?.trim() || "Personaje";
    await lanzarDadosTaleSpire(
      `!Dado de Golpe:1${tipoDado}`, `${nombrePj} - Dado de Golpe (${tipoDado})`,
      undefined, undefined, undefined, undefined,
      { tipo: "dadoGolpe", personajeId: pjActual.id, nombrePersonaje: nombrePj, tipoDado }
    );
  }, [personajeActivo]);

  const pjId = personajeActivo?.id;
  const alModificarHP = useCallback((d: number) => { if (pjId) modificarHPPersonaje(pjId, d); }, [pjId, modificarHPPersonaje]);
  const alEstablecerHPActual = useCallback((v: number) => { if (pjId) establecerHPActualPersonaje(pjId, v); }, [pjId, establecerHPActualPersonaje]);
  const alModificarHPMaximoEfectivo = useCallback((v: number) => { if (pjId) modificarHPMaximoEfectivoPersonaje(pjId, v); }, [pjId, modificarHPMaximoEfectivoPersonaje]);
  const alModificarHPTemporal = useCallback((v: number) => { if (pjId) modificarHPTemporalPersonaje(pjId, v); }, [pjId, modificarHPTemporalPersonaje]);
  const alEstablecerDadosGolpeRestantes = useCallback((v: number) => { if (pjId) establecerDadosGolpeRestantesPersonaje(pjId, v); }, [pjId, establecerDadosGolpeRestantesPersonaje]);
  const alEstablecerSalvacionMuerte = useCallback((t: "exitos" | "fallos", v: number) => { if (pjId) establecerSalvacionesMuertePersonaje(pjId, t, v); }, [pjId, establecerSalvacionesMuertePersonaje]);
  const alReiniciarSalvacionesMuerte = useCallback(() => { if (pjId) reiniciarSalvacionesMuertePersonaje(pjId); }, [pjId, reiniciarSalvacionesMuertePersonaje]);
  const alModificarCansancio = useCallback((d: number) => { if (pjId) modificarCansancioPersonaje(pjId, d); }, [pjId, modificarCansancioPersonaje]);
  const alAlternarSalvacion = useCallback((c: Caracteristica) => { if (pjId) alternarSalvacionPersonaje(pjId, c); }, [pjId, alternarSalvacionPersonaje]);
  const alModificarCaracteristicaBase = useCallback((c: Caracteristica, v: number) => { if (pjId) modificarCaracteristicaBasePersonaje(pjId, c, v); }, [pjId, modificarCaracteristicaBasePersonaje]);
  const alCiclarGradoHabilidad = useCallback((h: Habilidad) => { if (pjId) ciclarGradoHabilidadPersonaje(pjId, h); }, [pjId, ciclarGradoHabilidadPersonaje]);
  const alGastarEspacio = useCallback((n: number) => { if (pjId) gastarEspacioConjuro(pjId, n); }, [pjId, gastarEspacioConjuro]);
  const alRecuperarEspacio = useCallback((n: number) => { if (pjId) recuperarEspacioConjuro(pjId, n); }, [pjId, recuperarEspacioConjuro]);
  const alRecuperarTodosEspacios = useCallback(() => { if (pjId) recuperarTodosEspaciosConjuro(pjId); }, [pjId, recuperarTodosEspaciosConjuro]);
  const alGastarPuntos = useCallback((c: number) => { if (pjId) gastarPuntosConjuro(pjId, c); }, [pjId, gastarPuntosConjuro]);
  const alRecuperarPuntos = useCallback((c: number) => { if (pjId) recuperarPuntosConjuro(pjId, c); }, [pjId, recuperarPuntosConjuro]);
  const alRecuperarTodosPuntos = useCallback(() => { if (pjId) recuperarTodosPuntosConjuro(pjId); }, [pjId, recuperarTodosPuntosConjuro]);
  const alGastarEspacioPacto = useCallback(() => { if (pjId) gastarEspacioPacto(pjId); }, [pjId, gastarEspacioPacto]);
  const alRecuperarEspaciosPacto = useCallback(() => { if (pjId) recuperarEspaciosPacto(pjId); }, [pjId, recuperarEspaciosPacto]);
  const alEstablecerConcentracion = useCallback((hId: string, nom: string) => { if (pjId) establecerConcentracion(pjId, hId, nom); }, [pjId, establecerConcentracion]);
  const alRomperConcentracion = useCallback(() => { if (pjId) romperConcentracion(pjId); }, [pjId, romperConcentracion]);
  const alQuitarTruco = useCallback((hId: string) => { if (pjId) quitarTrucoConocido(pjId, hId); }, [pjId, quitarTrucoConocido]);
  const alQuitarConjuro = useCallback((hId: string) => { if (pjId) desprepararConjuroPersonaje(pjId, hId); }, [pjId, desprepararConjuroPersonaje]);
  const alAlternarPreparado = useCallback((hId: string) => { if (pjId) alternarConjuroPreparado(pjId, hId); }, [pjId, alternarConjuroPreparado]);

  const totalConjurosYTrucos =
    (personajeActivo?.trucosConocidosIds?.length || 0) +
    (personajeActivo?.conjurosConocidosIds?.length || 0);

  return {
    personajeActivo, statsCalculadas, sistemaMagia, baseDatosHechizos, rondaActual,
    modoTirada, modalEdicionAbierto, setModalEdicionAbierto, modalCompetencias,
    setModalCompetencias, modalDescanso, setModalDescanso, subPestanaActiva,
    setSubPestanaActiva, totalConjurosYTrucos, actualizarPersonaje,
    alternarInspiracionPersonaje, aplicarCondicionPersonaje, quitarCondicionPersonaje,
    quitarEfectoPersonaje, romperConcentracion, vincularMiniaturaTSPersonaje,
    manejarAbrirEdicion, manejarCambioModoTirada, manejarDescansoCorto,
    manejarDescansoLargo, manejarTirarCaracteristica, manejarTirarSalvacion,
    manejarTirarHabilidad, manejarTirarIniciativa, manejarTirarSalvacionMuerte3D,
    manejarTirarDadoGolpe, alModificarHP, alEstablecerHPActual,
    alModificarHPMaximoEfectivo, alModificarHPTemporal, alEstablecerDadosGolpeRestantes,
    alEstablecerSalvacionMuerte, alReiniciarSalvacionesMuerte, alModificarCansancio,
    alAlternarSalvacion, alModificarCaracteristicaBase, alCiclarGradoHabilidad,
    alGastarEspacio, alRecuperarEspacio, alRecuperarTodosEspacios, alGastarPuntos,
    alRecuperarPuntos, alRecuperarTodosPuntos, alGastarEspacioPacto,
    alRecuperarEspaciosPacto, alEstablecerConcentracion, alRomperConcentracion,
    alQuitarTruco, alQuitarConjuro, alAlternarPreparado
  };
}
