import React from "react";
import { PawPrint, Search, X, Plus } from "lucide-react";
import type { MonstruoBase, PlantillaInvocacion } from "@/tipos";
import estilos from "./SeccionAcompanantesPersonaje.module.css";

export interface ResultadoCompendioAcompanante {
  esInvocacion: boolean;
  invocacion?: PlantillaInvocacion;
  monstruo?: MonstruoBase;
  id: string;
  nombre: string;
  tipo: string;
  ca: number;
  vidaMaxima: number;
  desafio: string;
  conjuroAsociado?: string;
}

export interface CabeceraBuscadorAcompanantesProps {
  totalAcompanantes: number;
  busqueda: string;
  alCambiarBusqueda: (valor: string) => void;
  mostrarSugerencias: boolean;
  setMostrarSugerencias: (mostrar: boolean) => void;
  resultadosFiltrados: ResultadoCompendioAcompanante[];
  alSeleccionarInvocacion: (invocacion: PlantillaInvocacion) => void;
  alSeleccionarMonstruo: (monstruo: MonstruoBase) => void;
}

export const CabeceraBuscadorAcompanantes: React.FC<CabeceraBuscadorAcompanantesProps> = ({
  totalAcompanantes,
  busqueda,
  alCambiarBusqueda,
  mostrarSugerencias,
  setMostrarSugerencias,
  resultadosFiltrados,
  alSeleccionarInvocacion,
  alSeleccionarMonstruo
}) => {
  return (
    <section className={estilos.cabeceraSeccion}>
      <div className={estilos.tituloFila}>
        <h2 className={estilos.tituloPrincipal}>
          <PawPrint size={18} className={estilos.iconoTitulo} />
          Acompañantes y Sidekicks
        </h2>
        <span className={estilos.contadorAcompanantes}>
          {totalAcompanantes} {totalAcompanantes === 1 ? "criatura" : "criaturas"}
        </span>
      </div>

      <div className={estilos.barraAcciones}>
        <div className={estilos.cajaBuscador}>
          <Search size={14} className={estilos.iconoBuscador} />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => {
              alCambiarBusqueda(e.target.value);
              setMostrarSugerencias(true);
            }}
            onFocus={() => setMostrarSugerencias(true)}
            placeholder="Buscar criatura o invocación (ej. Corcel, Bestial, Lobo...)"
            className={estilos.inputBuscador}
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => {
                alCambiarBusqueda("");
                setMostrarSugerencias(false);
              }}
              className={estilos.botonLimpiar}
              title="Limpiar búsqueda"
            >
              <X size={12} />
            </button>
          )}

          {/* Menú flotante de resultados del compendio */}
          {mostrarSugerencias && busqueda && (
            <div className={estilos.menuSugerencias}>
              {resultadosFiltrados.length === 0 ? (
                <div className={estilos.vacioSugerencias}>
                  No se encontraron criaturas ni invocaciones con "{busqueda}".
                </div>
              ) : (
                resultadosFiltrados.map((res) => (
                  <div
                    key={res.id}
                    className={estilos.itemSugerencia}
                    onClick={() => {
                      if (res.esInvocacion && res.invocacion) {
                        alSeleccionarInvocacion(res.invocacion);
                      } else if (res.monstruo) {
                        alSeleccionarMonstruo(res.monstruo);
                      }
                    }}
                  >
                    <div>
                      <span className={estilos.nombreMonstruo}>
                        {res.nombre}
                        {res.esInvocacion && (
                          <span className={estilos.badgeInvocacionSugerencia}>
                            Invocación
                          </span>
                        )}
                      </span>
                      <span className={estilos.metaMonstruo}>
                        {res.tipo} | CA {res.ca} | PV {res.vidaMaxima} | {res.desafio}
                        {res.conjuroAsociado && ` (${res.conjuroAsociado})`}
                      </span>
                    </div>
                    <Plus size={14} color="var(--pj-texto-cian)" />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
