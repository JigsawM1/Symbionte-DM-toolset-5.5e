import React from "react";
import type { MonstruoBase } from "@/tipos";
import {
  Shield,
  Heart,
  Wind,
  PawPrint,
  Eye,
  Zap,
  Sparkles,
  Swords
} from "lucide-react";
import {
  formatearSubtituloCriatura,
  formatearVelocidad,
  formatearSentidos
} from "@/almacen/sanitizacion";
import estilos from "../PanelFormaSalvaje.module.css";

interface TarjetaBestiaReservaProps {
  bestia: MonstruoBase;
  estaActiva: boolean;
  usosRestantes: number;
  esElegible: boolean;
  alVerFicha: (bestia: MonstruoBase) => void;
  alAdoptar: (id: string) => void;
}

const calcularModificador = (val: number | undefined): string => {
  const n = val ?? 10;
  const m = Math.floor((n - 10) / 2);
  return m >= 0 ? `+${m}` : `${m}`;
};

/**
 * Tarjeta táctica de criatura conocida en reserva de Forma Salvaje.
 */
export const TarjetaBestiaReserva: React.FC<TarjetaBestiaReservaProps> = ({
  bestia,
  estaActiva,
  usosRestantes,
  esElegible,
  alVerFicha,
  alAdoptar
}) => {
  const subtitulo = formatearSubtituloCriatura(bestia.tipo, bestia.tamaño, bestia.alineacion);
  const velocidadStr = formatearVelocidad(bestia.velocidad);
  const sentidosStr = formatearSentidos(bestia.sentidos);

  const atributos = [
    { clave: "FUE", etiqueta: "Fuerza", valor: bestia.caracteristicas?.fuerza ?? 10, esFisico: true },
    { clave: "DES", etiqueta: "Destreza", valor: bestia.caracteristicas?.destreza ?? 10, esFisico: true },
    { clave: "CON", etiqueta: "Constitución", valor: bestia.caracteristicas?.constitucion ?? 10, esFisico: true },
    { clave: "INT", etiqueta: "Inteligencia", valor: bestia.caracteristicas?.inteligencia ?? 10, esFisico: false },
    { clave: "SAB", etiqueta: "Sabiduría", valor: bestia.caracteristicas?.sabiduria ?? 10, esFisico: false },
    { clave: "CAR", etiqueta: "Carisma", valor: bestia.caracteristicas?.carisma ?? 10, esFisico: false }
  ];

  const tieneRasgos = Array.isArray(bestia.rasgos) && bestia.rasgos.length > 0;
  const tieneAcciones = Array.isArray(bestia.acciones) && bestia.acciones.length > 0;
  const puedeAdoptar = usosRestantes > 0 && esElegible;

  return (
    <article
      className={`${estilos.tarjetaBestia} ${estaActiva ? estilos.activa : ""}`}
      aria-label={`Ficha de reserva: ${bestia.nombre}`}
    >
      {/* Cabecera de la Tarjeta */}
      <header className={estilos.cabeceraTarjeta}>
        <div className={estilos.ladoIzquierdoTarjeta}>
          <div className={estilos.nombreFila}>
            <span className={estilos.nombreBestia}>{bestia.nombre}</span>
            {estaActiva && (
              <span className={estilos.badgeFormaActiva}>
                <PawPrint size={11} /> Activa
              </span>
            )}
          </div>
          {subtitulo && <span className={estilos.subtituloBestia}>{subtitulo}</span>}
        </div>

        <div className={estilos.ladoDerechoBadges}>
          <div className={estilos.vdMedallon} title={`Valor de Desafío: ${bestia.desafio}`}>
            <span className={estilos.vdTexto}>VD {bestia.desafio}</span>
          </div>
        </div>
      </header>

      {/* Métricas Principales (CA, PG, Velocidad) */}
      <div className={estilos.metricasPrincipalesBestia}>
        <div className={estilos.metricaItem}>
          <div className={estilos.metricaCabecera}>
            <Shield size={12} className={estilos.iconoMetrica} />
            <span className={estilos.metricaEtiqueta}>CA</span>
          </div>
          <span className={estilos.metricaValor}>{bestia.ca || 10}</span>
        </div>

        <div className={estilos.metricaItem}>
          <div className={estilos.metricaCabecera}>
            <Heart size={12} className={estilos.iconoMetrica} />
            <span className={estilos.metricaEtiqueta}>PG Base</span>
          </div>
          <span className={estilos.metricaValor}>
            {bestia.vidaMaxima || "-"}
            {bestia.vidaNotas ? (
              <span className={estilos.formulaDadosPg}> ({bestia.vidaNotas})</span>
            ) : null}
          </span>
        </div>

        <div className={estilos.metricaItem}>
          <div className={estilos.metricaCabecera}>
            <Wind size={12} className={estilos.iconoMetrica} />
            <span className={estilos.metricaEtiqueta}>Velocidad</span>
          </div>
          <span className={estilos.metricaValor} title={velocidadStr || "30 pies"}>
            {velocidadStr || "30 pies"}
          </span>
        </div>
      </div>

      {/* Cuadrícula de 6 Características */}
      <div className={estilos.gridCaracteristicasBestia}>
        {atributos.map((at) => (
          <div
            key={at.clave}
            className={`${estilos.itemCaract} ${at.esFisico ? estilos.caractFisica : estilos.caractMental}`}
            title={`${at.etiqueta}: ${at.valor} (${calcularModificador(at.valor)})`}
          >
            <span className={estilos.nombreCaract}>{at.clave}</span>
            <span className={estilos.valorCaract}>{at.valor}</span>
            <span className={estilos.modCaract}>{calcularModificador(at.valor)}</span>
          </div>
        ))}
      </div>

      {/* Sentidos Especiales */}
      {sentidosStr && sentidosStr !== "-" && (
        <div className={estilos.filaSentidosBestia}>
          <Eye size={12} className={estilos.iconoSentidos} />
          <span>
            <strong>Sentidos:</strong> {sentidosStr}
          </span>
        </div>
      )}

      {/* Rasgos Especiales */}
      {tieneRasgos && (
        <div className={estilos.rasgosEspecialesBestia}>
          <div className={estilos.etiquetaSeccionInterna}>
            <Sparkles size={12} />
            <span>Rasgos Especiales:</span>
          </div>
          <div className={estilos.listaRasgosInternos}>
            {bestia.rasgos?.map((r, i) => (
              <div key={`${r.nombre}_${i}`} className={estilos.itemRasgoBestia}>
                <strong className={estilos.tituloRasgoBestia}>{r.nombre}:</strong> {r.descripcion}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones y Ataques */}
      {tieneAcciones && (
        <div className={estilos.accionesBestia}>
          <div className={estilos.etiquetaSeccionInterna}>
            <Swords size={12} />
            <span>Acciones y Ataques:</span>
          </div>
          <div className={estilos.listaAccionesInternas}>
            {bestia.acciones?.map((a, i) => {
              const tieneAtaque = a.bonificadorAtaque !== undefined;
              const bonoFormateado = tieneAtaque ? `+${String(a.bonificadorAtaque).replace(/^\+/, "")}` : "";

              return (
                <div key={`${a.nombre}_${i}`} className={estilos.itemAccionBestia}>
                  <div className={estilos.accionCabecera}>
                    <strong className={estilos.accionNombre}>{a.nombre}:</strong>
                    {tieneAtaque && (
                      <span className={estilos.chipAtaque}>Ataque {bonoFormateado}</span>
                    )}
                    {a.daño && (
                      <span className={estilos.chipDanio}>{a.daño} daño</span>
                    )}
                  </div>
                  {a.descripcion && !a.daño && (
                    <div className={estilos.accionDescripcion}>{a.descripcion}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Botonera de Acciones Tácticas */}
      <footer className={estilos.botoneraTarjetaBestia}>
        <button
          type="button"
          className={estilos.botonVerFicha}
          onClick={() => alVerFicha(bestia)}
          title={`Inspeccionar ficha completa de ${bestia.nombre}`}
        >
          <Eye size={14} />
          Ver Ficha
        </button>

        <button
          type="button"
          className={estilos.botonAdoptar}
          onClick={() => alAdoptar(bestia.id)}
          disabled={!puedeAdoptar}
          title={
            !puedeAdoptar
              ? usosRestantes <= 0
                ? "No tienes usos disponibles de Forma Salvaje"
                : "Esta criatura no es elegible para tu nivel actual"
              : `Metamorfosearse en ${bestia.nombre}`
          }
        >
          <Zap size={14} />
          {estaActiva ? "Volver a adoptar" : "Adoptar Forma"}
        </button>
      </footer>
    </article>
  );
};
