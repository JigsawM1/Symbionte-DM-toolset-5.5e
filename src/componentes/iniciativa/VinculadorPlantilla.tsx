import React, { useState } from "react";
import { Link, Search, X, Check } from "lucide-react";
import { MonstruoBase } from "../../utiles/datosIniciales";
import estilos from "./VinculadorPlantilla.module.css";

interface VinculadorPlantillaProps {
  criaturaId: string;
  baseDatosMonstruos: MonstruoBase[];
  onAsociar: (criaturaId: string, plantillaId: string) => void;
}

export const VinculadorPlantilla: React.FC<VinculadorPlantillaProps> = ({
  criaturaId,
  baseDatosMonstruos,
  onAsociar
}) => {
  const [filtroBuscadorVinculo, setFiltroBuscadorVinculo] = useState("");
  const [mostrarListaVinculos, setMostrarListaVinculos] = useState(false);

  const plantillasFiltradas = baseDatosMonstruos.filter((m) =>
    m.nombre.toLowerCase().includes(filtroBuscadorVinculo.toLowerCase())
  );

  return (
    <div className={estilos.cajaVinculacionManual}>
      <div className={estilos.alertaVinculoInfo}>
        <Link size={20} className={estilos.iconoEnlace} />
        <span className={estilos.tituloAlertaVinculo}>SISTEMA DE ASOCIACIÓN DE FICHA</span>
        <span className={estilos.descAlertaVinculo}>
          Esta criatura física no cuenta con un bloque de estadísticas de D&D 5.5e cargado. Asóciala ahora con un monstruo del manual para habilitar tiradas y visualización en tiempo real.
        </span>
      </div>

      <div className={estilos.buscadorVincularArea}>
        <div className={estilos.barraBuscadoraVinc}>
          <Search size={13} className={estilos.iconoBuscador} />
          <input
            type="text"
            value={filtroBuscadorVinculo}
            onChange={(e) => {
              setFiltroBuscadorVinculo(e.target.value);
              setMostrarListaVinculos(true);
            }}
            onFocus={() => setMostrarListaVinculos(true)}
            placeholder="Buscar en el manual (Orco, Goblin, etc...)"
            className={estilos.inputBuscadorVinculo}
          />
          {filtroBuscadorVinculo && (
            <button
              onClick={() => {
                setFiltroBuscadorVinculo("");
                setMostrarListaVinculos(false);
              }}
              className={estilos.botonLimpiarVinculo}
            >
              <X size={11} />
            </button>
          )}
        </div>

        {mostrarListaVinculos && (
          <div className={estilos.listaFlotanteVinculos}>
            {plantillasFiltradas.length === 0 ? (
              <div className={estilos.itemVinculoVacio}>No se encontraron monstruos.</div>
            ) : (
              plantillasFiltradas.slice(0, 6).map((plant) => (
                <div
                  key={plant.id}
                  onClick={() => {
                    onAsociar(criaturaId, plant.id);
                    setMostrarListaVinculos(false);
                    setFiltroBuscadorVinculo("");
                  }}
                  className={estilos.itemVinculoOpcion}
                >
                  <div>
                    <strong className={estilos.itemNombreMonstruo}>{plant.nombre}</strong>
                    <span className={estilos.itemMetaMonstruo}>
                      {plant.tipo} | CR: {plant.desafio || "—"}
                    </span>
                  </div>
                  <Check size={13} className={estilos.iconoCheck} />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
