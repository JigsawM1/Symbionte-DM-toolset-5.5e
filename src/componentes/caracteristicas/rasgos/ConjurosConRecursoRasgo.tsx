import { useState, useMemo } from "react";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { HECHIZOS_INICIALES } from "@/utiles/datosIniciales";
import { usarLanzadorConjuros } from "@/hooks/usarLanzadorConjuros";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import { SelectorDesplegable } from "@/componentes/comunes";
import { obtenerConcesionConRecurso } from "@/servicios/rasgos/lanzamientoRecursoRasgos";
import { resolverRasgoRecurso } from "@/servicios/rasgos/utilidadesRasgos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { Sparkles, Info, Check, Shield } from "lucide-react";
import estilos from "./ConjurosConRecursoRasgo.module.css";

export function ConjurosConRecursoRasgo({ personaje, rasgo }: { personaje: PersonajeJugador; rasgo: RasgoPersonaje }) {
  const [id, elegir] = useState("");
  const [sinConcentracion, cambiar] = useState(false);
  const { lanzar, validar } = usarLanzadorConjuros({
    personaje,
    penalizacionArmadura: calcularEstadisticasPersonaje(personaje).penalizacionArmadura
  });

  const concesion = personaje.rasgos.find(r => r.id === rasgo.lanzamientoConRecurso?.idRasgoConcesion);
  const conjuros = useMemo(() => HECHIZOS_INICIALES.filter(h => rasgo.lanzamientoConRecurso
    ? obtenerConcesionConRecurso(personaje, rasgo.id, h)
    : h.id === rasgo.conjuroGratuito), [personaje, rasgo]);

  const hechizo = conjuros.find(h => h.id === id) ?? (rasgo.lanzamientoConRecurso?.lista || rasgo.lanzamientoConRecurso?.conjuros ? undefined : conjuros[0]);
  const cfg = hechizo && obtenerConcesionConRecurso(personaje, rasgo.id, hechizo);
  const solicitud = hechizo && {
    hechizo,
    claseLanzamiento: cfg?.clase ?? concesion?.claseConjurosOtorgados,
    ...(rasgo.varianteSinConcentracion ? { sinConcentracion } : {})
  };

  const normal = solicitud && { ...solicitud, modo: "espacio" as const };
  const especial = solicitud && (rasgo.lanzamientoConRecurso
    ? { ...solicitud, modo: "recursoRasgo" as const, idRasgoOrigen: rasgo.id }
    : { ...solicitud, modo: "gratuitoInnato" as const });

  const recurso = rasgo.gastarDePadre ? resolverRasgoRecurso(rasgo, personaje.rasgos) : rasgo;
  const usosRestantes = recurso?.usosRestantes ?? recurso?.usosMaximos ?? 0;
  const textoBoton = rasgo.lanzamientoConRecurso?.costeFijo
    ? `Lanzar · ${rasgo.lanzamientoConRecurso.costeFijo} uso`
    : rasgo.lanzamientoConRecurso
      ? `Lanzar por ${hechizo?.nivel ?? 0} puntos`
      : "Lanzar gratis";

  return (
    <section className={estilos.seccionLanzador} aria-label={`Lanzamientos de ${rasgo.nombre}`}>
      <div className={estilos.cabeceraSelector}>
        <span className={estilos.etiquetaCampo}>
          <Sparkles size={12} />
          <span>Conjuro concedido</span>
        </span>
        <span className={estilos.contadorConjuros}>
          {conjuros.length} {conjuros.length === 1 ? "disponible" : "disponibles"}
        </span>
      </div>

      <SelectorDesplegable
        titulo="Conjuro concedido"
        placeholder="Elige un conjuro"
        valor={hechizo?.id ?? ""}
        opciones={conjuros.map(h => ({
          valor: h.id,
          etiqueta: `${h.nombre} · Nivel ${h.nivel}`
        }))}
        alCambiar={elegir}
      />

      {hechizo && (
        <div className={estilos.tarjetaResumenConjuro}>
          <div className={estilos.insigniasMetadatos}>
            <span className={estilos.badgeNivel}>{hechizo.nivel === 0 ? "Truco" : `Nivel ${hechizo.nivel}`}</span>
            <span className={estilos.badgeEscuela}>{hechizo.escuela}</span>
            <span className={estilos.badgeTiempo}>{hechizo.tiempoLanzamiento}</span>
            {hechizo.concentracion && <span className={estilos.badgeConcentracion}>{rasgo.lanzamientoConRecurso?.sinConcentracion ? "Sin concentración con este rasgo" : "Concentración"}</span>}
          </div>
        </div>
      )}

      {rasgo.varianteSinConcentracion && (
        <label className={`${estilos.tarjetaToggle} ${sinConcentracion ? estilos.tarjetaToggleActiva : ""}`}>
          <input
            type="checkbox"
            className={estilos.checkboxOculto}
            checked={sinConcentracion}
            onChange={e => cambiar(e.target.checked)}
          />
          <span className={estilos.indicadorCheck}>
            {sinConcentracion && <Check size={12} strokeWidth={3} />}
          </span>
          <Shield size={14} />
          <span className={estilos.textoToggle}>Sin concentración · 1 minuto de duración</span>
        </label>
      )}

      {rasgo.lanzamientoConRecurso && (
        <div className={estilos.avisoRegla}>
          <Info size={14} className={estilos.iconoAviso} />
          <span>
            {rasgo.lanzamientoConRecurso.conjuros ? `Nivel base; componentes normales. No consume espacios.${rasgo.lanzamientoConRecurso.sinConcentracion ? " Sin concentración." : ""}${rasgo.lanzamientoConRecurso.duracionRondas ? ` Duración: ${rasgo.lanzamientoConRecurso.duracionRondas} rondas; fuera de iniciativa, finaliza el efecto cuando transcurra su duración.` : ""}`
              : rasgo.lanzamientoConRecurso.lista
              ? "Nivel base; no consume espacios ni materiales. Mantiene los demás componentes y la concentración."
              : "Por puntos: nivel base, sin componentes verbales ni somáticos. Comprueba manualmente los materiales consumidos o con coste."}
          </span>
        </div>
      )}

      {rasgo.lanzamientoConRecurso?.costeFijo && (
        <div className={estilos.franjaRecurso}>
          <div className={estilos.estadoUsos}>
            <span className={`${estilos.puntoEstado} ${usosRestantes > 0 ? estilos.puntoDisponible : estilos.puntoAgotado}`} />
            <span>Usos disponibles: <strong>{usosRestantes} / {recurso?.usosMaximos ?? 1}</strong></span>
          </div>
          <div className={estilos.costeAccion}>
            Coste: <strong>{rasgo.lanzamientoConRecurso.costeFijo} {rasgo.lanzamientoConRecurso.costeFijo === 1 ? "uso" : "usos"}</strong>
          </div>
        </div>
      )}

      <div className={estilos.filaBotones}>
        {!rasgo.lanzamientoConRecurso?.lista && (
          <button
            type="button"
            className={estilos.botonLanzarEspacio}
            disabled={!normal || !validar(normal).permitido}
            onClick={() => { if (normal) void lanzar(normal); }}
          >
            Lanzar con espacio
          </button>
        )}
        <button
          type="button"
          className={estilos.botonLanzarPrincipal}
          disabled={!especial || !validar(especial).permitido}
          onClick={() => { if (especial) void lanzar(especial); }}
        >
          <Sparkles size={14} />
          <span>{textoBoton}</span>
        </button>
      </div>
      {rasgo.conjurosTemporales?.map(e => {
        const h = conjuros.find(h => h.id === e.conjuroId);
        if (!h) return null;
        return <div key={e.conjuroId}><p>{h.nombre} activo · termina en la ronda {e.expiraRonda}. Destinatario y desplazamiento manuales.</p>
          {h.permiteAtaquePosterior && <button type="button" className={estilos.botonLanzarPrincipal} onClick={() => void lanzar({ hechizo: h, modo: "continuarConjuro", idRasgoOrigen: rasgo.id, claseLanzamiento: rasgo.claseConjurosOtorgados })}>Atacar con {h.nombre} · sin otro gasto</button>}
          <button type="button" className={estilos.botonLanzarEspacio} onClick={() => {
            const almacen = usarAlmacenDM.getState();
            if (!almacen.operarRecursoRasgoPersonaje(personaje.id, { tipo: "finalizarConjuroTemporal", idRasgo: rasgo.id, conjuroId: h.id }))
              almacen.agregarNotificacion("El efecto ya no está disponible.", "advertencia");
          }}>Finalizar {h.nombre}</button>
        </div>;
      })}
    </section>
  );
}
