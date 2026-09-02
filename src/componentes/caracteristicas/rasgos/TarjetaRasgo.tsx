import React from "react";
import type { RasgoPersonaje, TipoAccionRasgo, OrigenRasgo } from "@/tipos";
import { lanzarDadosTaleSpire } from "@/utiles/lanzadorDados";
import {
  Sparkles,
  Zap,
  Clock,
  Shield,
  Dices,
  Edit2,
  Trash2,
  BookOpen,
  Layers
} from "lucide-react";
import estilos from "./VistaRasgosJugador.module.css";

interface TarjetaRasgoProps {
  rasgo: RasgoPersonaje;
  nombrePersonaje: string;
  alGastarUso: () => void;
  alRecuperarUso: () => void;
  alEditar: () => void;
  alEliminar: () => void;
}

const ICONO_POR_ACCION: Record<TipoAccionRasgo, React.ReactNode> = {
  pasivo: <Shield size={10} />,
  accion: <Zap size={10} />,
  accion_adicional: <Clock size={10} />,
  reaccion: <Sparkles size={10} />,
  especial: <Layers size={10} />
};

const CLASE_BADGE_ACCION: Record<TipoAccionRasgo, string> = {
  pasivo: estilos.badgePasivo,
  accion: estilos.badgeAccionPrincipal,
  accion_adicional: estilos.badgeAccionAdicional,
  reaccion: estilos.badgeReaccion,
  especial: estilos.badgeEspecial
};

const ETIQUETA_ACCION: Record<TipoAccionRasgo, string> = {
  pasivo: "Pasivo",
  accion: "Acción",
  accion_adicional: "Acción Adicional",
  reaccion: "Reacción",
  especial: "Especial"
};

const ETIQUETA_ORIGEN: Record<OrigenRasgo, string> = {
  clase: "Clase",
  subclase: "Subclase",
  especie: "Especie",
  dote: "Dote",
  trasfondo: "Trasfondo",
  personalizado: "Personalizado / Homebrew"
};

const CLASE_ORIGEN_BORDE: Record<OrigenRasgo, string> = {
  clase: estilos.origenClase,
  subclase: estilos.origenSubclase,
  especie: estilos.origenEspecie,
  dote: estilos.origenDote,
  trasfondo: estilos.origenDote,
  personalizado: estilos.origenPersonalizado
};

export const TarjetaRasgo: React.FC<TarjetaRasgoProps> = ({
  rasgo,
  nombrePersonaje,
  alGastarUso,
  alRecuperarUso,
  alEditar,
  alEliminar
}) => {
  const manejarTirarDados = async () => {
    if (!rasgo.formulaDados) return;
    try {
      const formula = `!${rasgo.nombre}:${rasgo.formulaDados}`;
      const etiqueta = `${nombrePersonaje} - ${rasgo.nombre} (${rasgo.formulaDados})`;
      await lanzarDadosTaleSpire(formula, etiqueta);
    } catch (error) {
      console.error("[TarjetaRasgo] Error al tirar dados:", error);
    }
  };

  const claseOrigen = CLASE_ORIGEN_BORDE[rasgo.origen] || estilos.origenPersonalizado;
  const tieneUsos = rasgo.tieneUsosLimitados && typeof rasgo.usosMaximos === "number";
  const usosRestantes = rasgo.usosRestantes ?? (rasgo.usosMaximos || 1);
  const usosMaximos = rasgo.usosMaximos || 1;
  const esHomebrewOPersonalizado = rasgo.personalizado || rasgo.origen === "personalizado" || rasgo.origen === "dote";

  return (
    <article className={`${estilos.tarjetaRasgo} ${claseOrigen}`}>
      {/* Fila Superior: Título, Badges y Acciones */}
      <div className={estilos.filaSuperiorTarjeta}>
        <div className={estilos.tituloYBadges}>
          <span className={estilos.nombreRasgo}>{rasgo.nombre}</span>

          {/* Badge de Tipo de Acción */}
          <span className={`${estilos.badgeAccion} ${CLASE_BADGE_ACCION[rasgo.tipoAccion]}`}>
            {ICONO_POR_ACCION[rasgo.tipoAccion]}
            <span>{ETIQUETA_ACCION[rasgo.tipoAccion]}</span>
          </span>

          {/* Badge de Nivel Requerido */}
          {rasgo.nivelRequerido && rasgo.nivelRequerido > 0 && (
            <span className={estilos.badgeNivel} title={`Nivel requerido: ${rasgo.nivelRequerido}`}>
              Nvl {rasgo.nivelRequerido}
            </span>
          )}

          {/* Badge de Fuente u Origen */}
          {rasgo.fuente && (
            <span className={estilos.badgeFuente} title={`Origen: ${ETIQUETA_ORIGEN[rasgo.origen]}`}>
              <BookOpen size={9} />
              <span>{rasgo.fuente}</span>
            </span>
          )}
        </div>

        {/* Zona de Recursos y Botones Interactivos */}
        <div className={estilos.zonaAccionesTarjeta}>
          {/* Contador de Usos */}
          {tieneUsos && (
            <div className={estilos.contadorUsos} title={`Recuperación: ${rasgo.recuperacion || "Descanso"}`}>
              <button
                type="button"
                className={estilos.botonPasoUso}
                onClick={alGastarUso}
                disabled={usosRestantes <= 0}
                title="Gastar 1 uso"
              >
                -
              </button>

              <span className={estilos.textoUsos}>
                {usosRestantes} / {usosMaximos}
              </span>

              <button
                type="button"
                className={estilos.botonPasoUso}
                onClick={alRecuperarUso}
                disabled={usosRestantes >= usosMaximos}
                title="Recuperar 1 uso"
              >
                +
              </button>

              {rasgo.recuperacion === "descanso_corto" && (
                <span className={estilos.badgeRecuperacion} title="Recupera con descanso corto">
                  D. Corto
                </span>
              )}
              {rasgo.recuperacion === "descanso_largo" && (
                <span className={estilos.badgeRecuperacion} title="Recupera con descanso largo">
                  D. Largo
                </span>
              )}
            </div>
          )}

          {/* Botón de Tirada de Dados 3D */}
          {rasgo.formulaDados && (
            <button
              type="button"
              className={estilos.botonTirarDados}
              onClick={manejarTirarDados}
              title={`Lanzar ${rasgo.formulaDados} a TaleSpire`}
            >
              <Dices size={11} />
              <span>{rasgo.formulaDados}</span>
            </button>
          )}

          {/* Botones de Editar y Eliminar (para rasgos personalizados / homebrew / dotes) */}
          {esHomebrewOPersonalizado && (
            <>
              <button
                type="button"
                className={estilos.botonIconoAccion}
                onClick={alEditar}
                title="Editar rasgo"
              >
                <Edit2 size={13} color="#94a3b8" strokeWidth={2} />
              </button>

              <button
                type="button"
                className={`${estilos.botonIconoAccion} ${estilos.botonIconoPeligro}`}
                onClick={alEliminar}
                title="Eliminar rasgo"
              >
                <Trash2 size={13} color="#f87171" strokeWidth={2} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Descripción Principal */}
      {rasgo.descripcion && (
        <p className={estilos.descripcionRasgo}>{rasgo.descripcion}</p>
      )}

      {/* Notas Opcionales */}
      {rasgo.notas && (
        <div className={estilos.notasRasgo}>
          <strong>Nota:</strong> {rasgo.notas}
        </div>
      )}
    </article>
  );
};
