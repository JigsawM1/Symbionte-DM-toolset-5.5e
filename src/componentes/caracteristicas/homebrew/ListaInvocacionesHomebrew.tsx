import React, { useState, useMemo } from "react";
import { Ghost, Pencil, Search, Trash2 } from "lucide-react";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { coincideBusquedaTolerante } from "@/utiles/busquedaTolerante";
import { ConfirmDialog } from "@/componentes/comunes/ConfirmDialog";
import type { PlantillaInvocacion } from "@/tipos";
import estilos from "./ListaInvocacionesHomebrew.module.css";

export interface ListaInvocacionesHomebrewProps {
  iniciarEdicionInvocacion?: (inv: PlantillaInvocacion) => void;
  cancelarEdicion?: () => void;
  idEnEdicion?: string | null;
  soloLectura?: boolean;
}

/**
 * Listado filtrable de plantillas homebrew de invocaciones de PJ.
 */
export const ListaInvocacionesHomebrew: React.FC<ListaInvocacionesHomebrewProps> = ({
  iniciarEdicionInvocacion,
  cancelarEdicion,
  idEnEdicion,
  soloLectura = false
}) => {
  const baseDatosInvocaciones = usarAlmacenDM(s => s.baseDatosInvocaciones);
  const eliminarInvocacionHomebrew = usarAlmacenDM(s => s.eliminarInvocacionHomebrew);

  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [idAEliminar, setIdAEliminar] = useState<string | null>(null);
  const invocacionAEliminar = baseDatosInvocaciones.find(inv => inv.id === idAEliminar);

  const invocacionesFiltradas = useMemo(() => {
    const consulta = filtroBusqueda.trim();
    return baseDatosInvocaciones
      .filter(inv => !consulta || coincideBusquedaTolerante([inv.nombre, inv.conjuroAsociado, inv.tipoCriatura], consulta))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [baseDatosInvocaciones, filtroBusqueda]);

  return (
    <div className={estilos.panelLista}>
      {baseDatosInvocaciones.length > 0 && (
        <div className={estilos.buscador}>
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            aria-label="Buscar invocaciones"
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
            placeholder="Nombre, conjuro o tipo"
          />
        </div>
      )}

      {invocacionesFiltradas.length === 0 ? (
        <div className={estilos.estadoVacio}>
          {baseDatosInvocaciones.length === 0 && <Ghost size={26} aria-hidden="true" />}
          <strong>{baseDatosInvocaciones.length === 0 ? "Todavía no hay invocaciones" : "Sin coincidencias"}</strong>
          {baseDatosInvocaciones.length === 0
            ? <span>Crea una plantilla para usarla como acompañante.</span>
            : <button type="button" onClick={() => setFiltroBusqueda("")}>Limpiar búsqueda</button>}
        </div>
      ) : (
        <ul className={`${estilos.lista} u-scroll-cef`}>
          {invocacionesFiltradas.map(inv => (
              <li key={inv.id} className={estilos.tarjeta}>
                <div className={estilos.cabecera}>
                  <div className={estilos.identidad}>
                    <h2>{inv.nombre}</h2>
                    <p>{inv.conjuroAsociado}</p>
                    <p>{inv.tipoCriatura} · {inv.tamano}</p>
                  </div>
                  {!soloLectura && (
                    <div className={estilos.acciones}>
                      {iniciarEdicionInvocacion && (
                        <button
                          type="button"
                          onClick={() => iniciarEdicionInvocacion(inv)}
                          aria-label={`Editar ${inv.nombre}`}
                          title="Editar invocación"
                        >
                          <Pencil size={15} aria-hidden="true" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIdAEliminar(inv.id)}
                        className={estilos.eliminar}
                        aria-label={`Eliminar ${inv.nombre}`}
                        title="Eliminar invocación"
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>

                <dl className={estilos.metricas}>
                  <div><dt>Nivel de conjuro</dt><dd>{inv.nivelMinimo}–{inv.nivelMaximo}</dd></div>
                  <div><dt>CA base</dt><dd>{inv.formulaCA.base}</dd></div>
                  <div><dt>PG base</dt><dd>{inv.formulaVida.base}</dd></div>
                  <div><dt>Ataques</dt><dd>{inv.ataques.length}</dd></div>
                </dl>
              </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        abierto={Boolean(invocacionAEliminar)}
        titulo="Eliminar invocación"
        mensaje={invocacionAEliminar ? `¿Eliminar «${invocacionAEliminar.nombre}» del compendio?` : ""}
        onConfirmar={() => {
          if (!invocacionAEliminar) return;
          eliminarInvocacionHomebrew(invocacionAEliminar.id);
          if (idEnEdicion === invocacionAEliminar.id) cancelarEdicion?.();
          setIdAEliminar(null);
        }}
        onCancelar={() => setIdAEliminar(null)}
      />
    </div>
  );
};
