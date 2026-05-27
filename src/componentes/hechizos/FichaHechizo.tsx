import React, { useState } from "react";
import { Clock, MapPin, Layers, X } from "lucide-react";
import { lanzarDadosTaleSpire } from "../../utiles/lanzadorDados";
import { calcularFormulaEscalada } from "../../utiles/utilesConjuros";
import { HechizoBase } from "../../tipos";
import estilosClases from "./FichaHechizo.module.css";

interface FichaHechizoProps {
  hechizo: HechizoBase;
  onClose: () => void;
}

export const FichaHechizo: React.FC<FichaHechizoProps> = React.memo(({ hechizo, onClose }) => {
  // Inicializar nivel de Upcast con el nivel base del conjuro
  const nivelBase = hechizo.nivel;
  const [nivelLanzamiento, setNivelLanzamiento] = useState<number>(nivelBase > 0 ? nivelBase : 1);

  // Comprobar si el hechizo es escalable a niveles superiores
  const esEscalable = nivelBase > 0 && hechizo.dadosDañoNivelSuperior && hechizo.dadosDañoNivelSuperior !== "N/A";

  // Calcular dados escalados en tiempo real si aplica
  const dadosBaseValidos = hechizo.dadosDaño && hechizo.dadosDaño !== "N/A" ? hechizo.dadosDaño : "1d6";
  const formulaEscalada = esEscalable
    ? calcularFormulaEscalada(dadosBaseValidos, hechizo.dadosDañoNivelSuperior || "1d6", nivelBase, nivelLanzamiento)
    : { formula: dadosBaseValidos, adicionalText: "" };

  // Manejar el lanzamiento de dados en TaleSpire
  const manejarLanzamientoDados = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const tipoDanoText = hechizo.tipoDaño && hechizo.tipoDaño !== "N/A"
      ? ` (${hechizo.tipoDaño})`
      : "";

    if (nivelLanzamiento > nivelBase && esEscalable) {
      lanzarDadosTaleSpire(
        formulaEscalada.formula,
        `Conjuro: ${hechizo.nombre} [Niv ${nivelLanzamiento}]${tipoDanoText}`
      );
    } else {
      lanzarDadosTaleSpire(
        dadosBaseValidos,
        `Conjuro: ${hechizo.nombre}${tipoDanoText}`
      );
    }
  };

  return (
    <div className={estilosClases.contenedorFicha} onClick={(e) => e.stopPropagation()}>
      {/* Cabecera de la Ficha */}
      <div className={estilosClases.cabecera}>
        <div className={estilosClases.cabeceraIzquierda}>
          <span className={estilosClases.metaNivel}>
            NIVEL {hechizo.nivel === 0 ? "TRUCO" : hechizo.nivel}
          </span>
          <span className={estilosClases.titulo}>{hechizo.nombre}</span>
        </div>
        <button onClick={onClose} className={estilosClases.botonCerrar} title="Cerrar detalles">
          <X size={16} />
        </button>
      </div>

      {/* Cuerpo de la Ficha */}
      <div className={estilosClases.cuerpo}>
        {/* Fila de Propiedades Visuales */}
        <div className={estilosClases.filaChips}>
          {hechizo.concentracion && (
            <span className={estilosClases.chipConcentracion}>CONCENTRACIÓN</span>
          )}
          {hechizo.ritual && (
            <span className={estilosClases.chipRitual}>RITUAL</span>
          )}
          <span className={estilosClases.chipEscuela}>{hechizo.escuela.toUpperCase()}</span>
        </div>

        {/* Grid de Metadatos D&D */}
        <div className={estilosClases.gridMetadatos}>
          <div className={estilosClases.metaItem}>
            <Clock size={13} className={estilosClases.iconoMeta} />
            <div>
              <div className={estilosClases.metaLabel}>TIEMPO</div>
              <div className={estilosClases.metaValor}>{hechizo.tiempoLanzamiento}</div>
            </div>
          </div>
          <div className={estilosClases.metaItem}>
            <MapPin size={13} className={estilosClases.iconoMeta} />
            <div>
              <div className={estilosClases.metaLabel}>ALCANCE</div>
              <div className={estilosClases.metaValor}>{hechizo.alcance}</div>
            </div>
          </div>
          <div className={estilosClases.metaItem}>
            <Layers size={13} className={estilosClases.iconoMeta} />
            <div>
              <div className={estilosClases.metaLabel}>COMPONENTES</div>
              <div className={estilosClases.metaValor}>{hechizo.componentes}</div>
            </div>
          </div>
          <div className={estilosClases.metaItem}>
            <Clock size={13} className={estilosClases.iconoMeta} />
            <div>
              <div className={estilosClases.metaLabel}>DURACIÓN</div>
              <div className={estilosClases.metaValor}>{hechizo.duracion || "Instantáneo"}</div>
            </div>
          </div>
        </div>

        {/* Materiales si existen */}
        {hechizo.materiales && (
          <div className={estilosClases.seccionFicha}>
            <div className={estilosClases.seccionTitulo}>MATERIALES</div>
            <div className={estilosClases.textoMateriales}>{hechizo.materiales}</div>
          </div>
        )}

        {/* MECÁNICAS DE COMBATE (Daño / CD / Upcasting) */}
        {((hechizo.ataqueCd && hechizo.ataqueCd !== "N/A") || 
          (hechizo.dadosDaño && hechizo.dadosDaño !== "N/A") || 
          (hechizo.cdSalvacion && hechizo.cdSalvacion !== "N/A")) && (
          <div className={estilosClases.cajaCombate}>
            <div className={estilosClases.tituloCombate}>Mecánicas de Combate Integradas</div>
            
            <div className={estilosClases.gridCombate}>
              {hechizo.ataqueCd && hechizo.ataqueCd !== "N/A" && (
                <div className={estilosClases.combateItem}>
                  <span className={estilosClases.combateLabel}>Efecto/Ataque: </span>
                  <strong className={estilosClases.colorActivo}>{hechizo.ataqueCd}</strong>
                </div>
              )}
              {hechizo.cdSalvacion && hechizo.cdSalvacion !== "N/A" && (
                <div className={estilosClases.combateItem}>
                  <span className={estilosClases.combateLabel}>CD Salvación: </span>
                  <strong className={estilosClases.colorAlerta}>CD {hechizo.cdSalvacion}</strong>
                </div>
              )}
              {hechizo.dadosDaño && hechizo.dadosDaño !== "N/A" && (
                <div className={estilosClases.combateItem} style={{ gridColumn: esEscalable ? "1 / -1" : "auto" }}>
                  <span className={estilosClases.combateLabel}>Daño Base: </span>
                  <strong className={estilosClases.colorDano}>
                    {hechizo.dadosDaño} 
                    {hechizo.tipoDaño && hechizo.tipoDaño !== "N/A" ? ` (${hechizo.tipoDaño})` : ""}
                  </strong>
                </div>
              )}
            </div>

            {/* Panel de Upcasting Interactivo */}
            {esEscalable && (
              <div className={estilosClases.seccionUpcast}>
                <div className={estilosClases.lineaDivisoria}></div>
                <div className={estilosClases.upcastControlFila}>
                  <div className={estilosClases.upcastSelectContenedor}>
                    <span className={estilosClases.upcastLabel}>Lanzar con Ranura:</span>
                    <select
                      value={nivelLanzamiento}
                      onChange={(e) => setNivelLanzamiento(Number(e.target.value))}
                      className={estilosClases.upcastSelect}
                    >
                      {Array.from({ length: 10 - nivelBase }, (_, i) => nivelBase + i).map((lvl) => (
                        <option key={lvl} value={lvl}>
                          Nivel {lvl} {lvl === nivelBase ? "(Base)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  {nivelLanzamiento > nivelBase && (
                    <div className={estilosClases.formulasVista}>
                      <span className={estilosClases.formulaTotal}>{formulaEscalada.formula}</span>
                      <span className={estilosClases.formulaDetalle}>{formulaEscalada.adicionalText}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Botón de Lanzamiento de Dados */}
            {hechizo.dadosDaño && hechizo.dadosDaño !== "N/A" && (
              <button
                onClick={manejarLanzamientoDados}
                className={nivelLanzamiento > nivelBase && esEscalable ? estilosClases.botonTirarUpcast : estilosClases.botonTirarCombate}
              >
                🎲 Tirar Daño en TaleSpire {nivelLanzamiento > nivelBase && esEscalable ? `(Nivel ${nivelLanzamiento})` : ""}
              </button>
            )}
          </div>
        )}

        {/* Descripción */}
        <div className={estilosClases.seccionFicha}>
          <div className={estilosClases.seccionTitulo}>DESCRIPCIÓN DEL CONJURO</div>
          <div className={estilosClases.textoDescripcion}>{hechizo.descripcion}</div>
        </div>

        {/* Niveles superiores estático informativo si existe */}
        {hechizo.descNivelSuperior && (
          <div className={estilosClases.seccionFicha}>
            <div className={estilosClases.seccionTitulo}>EFECTO A NIVELES SUPERIORES</div>
            <div className={estilosClases.textoDescripcion} style={{ fontStyle: "italic" }}>
              {hechizo.descNivelSuperior}
            </div>
          </div>
        )}

        {/* Clases disponibles si existen */}
        {hechizo.clases && hechizo.clases.length > 0 && (
          <div className={estilosClases.seccionFicha}>
            <div className={estilosClases.seccionTitulo}>CLASES QUE PUEDEN UTILIZAR ESTE CONJURO</div>
            <div className={estilosClases.filaClases}>
              {hechizo.clases.map((clase) => (
                <span key={clase} className={estilosClases.chipClase}>
                  {clase}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
