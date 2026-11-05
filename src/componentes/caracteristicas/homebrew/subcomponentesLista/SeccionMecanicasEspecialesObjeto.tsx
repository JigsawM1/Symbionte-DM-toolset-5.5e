import React from "react";
import { normalizarTexto } from "@/almacen/usarAlmacenDM";
import type { ObjetoJuego, HechizoBase, ObjetoHomebrew } from "@/tipos";
import { Dices, Skull } from "lucide-react";
import estilos from "../ListaHomebrew.module.css";
import { lanzarDadosTaleSpire, sanitizarEtiqueta } from "@/utiles/lanzadorDados";

interface SeccionMecanicasEspecialesObjetoProps {
  objeto: ObjetoJuego;
  esGM: boolean;
  baseDatosHechizos: HechizoBase[];
  objetosHomebrew: ObjetoHomebrew[];
  navegarAObjeto: (id: string) => void;
  alAbrirHechizo?: (idHechizo: string) => void;
}

export const SeccionMecanicasEspecialesObjeto: React.FC<SeccionMecanicasEspecialesObjetoProps> = ({
  objeto,
  esGM,
  baseDatosHechizos,
  objetosHomebrew,
  navegarAObjeto,
  alAbrirHechizo
}) => {
  return (
    <>
      {/* MECÁNICAS Y EFECTOS DEL VENENO */}
      {(objeto.esVeneno || objeto.tipoVeneno || objeto.efectoVeneno) && (
        <div className={`${estilos.cajaMecanicasCombateObjeto} ${estilos.cajaMecanicasVeneno}`}>
          <div className={`${estilos.tituloMecanicasObjeto} ${estilos.tituloMecanicasVeneno}`}>
            <span className="u-inline-flex u-items-center u-gap-xs">
              <Skull size={14} />
              <span>Propiedades y Mecánicas del Veneno</span>
            </span>
            <div className="u-flex u-items-center u-gap-xs">
              {(() => {
                const textoCompleto = `${objeto.descripcion || ""} ${objeto.efectoVeneno || ""}`;
                const matchDado = textoCompleto.match(/(\d+d\d+(?:\s*[+-]\s*\d+)?)/i);
                if (matchDado) {
                  const formulaDado = matchDado[1].replace(/\s+/g, "");
                  return (
                    <button
                      onClick={() => {
                        const label = sanitizarEtiqueta(`Dano Veneno (${formulaDado}) - ${objeto.nombre}`);
                        lanzarDadosTaleSpire(formulaDado, label);
                      }}
                      className={estilos.botonTirarDanoVeneno}
                      type="button"
                      title={`Lanzar daño de veneno (${formulaDado}) en TaleSpire`}
                    >
                      <Dices size={13} />
                      <span>Daño Veneno ({formulaDado})</span>
                    </button>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          <div className={estilos.gridMecanicas}>
            {objeto.tipoVeneno && (
              <div className={estilos.itemMecanica}>
                <span className={estilos.textoEtiquetaMecanica}>Tipo de Exposición: </span>
                <strong className={`${estilos.valorMecanicaDano} ${estilos.textoPurpuraVeneno}`}>
                  {objeto.tipoVeneno}
                </strong>
              </div>
            )}
            {objeto.efectoVeneno && (
              <div className={`${estilos.itemMecanica} ${estilos.itemMecanicaFullGrid}`}>
                <span className={estilos.textoEtiquetaMecanica}>Efecto Adicional: </span>
                <strong className={`${estilos.valorMecanicaCd} ${estilos.textoTextoPrincipal}`}>
                  {objeto.efectoVeneno}
                </strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PROPIEDADES MÁGICAS Y NARRATIVAS COMUNES */}
      {(objeto.cargas || objeto.sintonizacionRequerida || (objeto.modificadorAtaqueDano !== undefined && objeto.modificadorAtaqueDano !== null)) && (
        <div className={`${estilos.cajaMecanicasCombateObjeto} ${estilos.cajaMecanicasMagicas}`}>
          <div className={`${estilos.tituloMecanicasObjeto} ${estilos.tituloMecanicasMagicas}`}>
            Propiedades Mágicas y Narrativas
          </div>

          <div className={estilos.gridMecanicas}>
            {objeto.cargas && (
              <div className={estilos.itemMecanica}>
                <span className={estilos.textoEtiquetaMecanica}>Cargas Máximas: </span>
                <strong className={estilos.valorMecanicaDano}>
                  {objeto.cargas}
                  {objeto.formulaRecarga && ` (${objeto.formulaRecarga})`}
                </strong>
                {esGM && objeto.formulaRecarga && (
                  <button
                    type="button"
                    onClick={() => {
                      lanzarDadosTaleSpire(objeto.formulaRecarga!, `DM - Recarga ${objeto.nombre}`);
                    }}
                    className={estilos.botonTirarRecarga}
                    title={`Tirar fórmula de recarga (${objeto.formulaRecarga}) en TaleSpire`}
                  >
                    <Dices size={11} />
                    <span>Tirar Recarga</span>
                  </button>
                )}
              </div>
            )}
            {objeto.sintonizacionRequerida && (
              <div className={estilos.itemMecanica}>
                <span className={estilos.textoEtiquetaMecanica}>Sintonización: </span>
                <strong className={`${estilos.valorMecanicaCd} ${estilos.textoCian}`}>
                  Requerida
                  {objeto.condicionSintonizacion && ` (${objeto.condicionSintonizacion})`}
                </strong>
              </div>
            )}
            {objeto.modificadorAtaqueDano !== undefined && objeto.modificadorAtaqueDano !== null && (
              <div className={estilos.itemMecanica}>
                <span className={estilos.textoEtiquetaMecanica}>Bono Mágico Directo: </span>
                <strong className={estilos.valorMecanicaAtaque}>+{objeto.modificadorAtaqueDano}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MECÁNICAS DE MUNICIÓN O ALMACENAMIENTO */}
      {(() => {
        const cantidadItem = "cantidad" in objeto ? (objeto as { cantidad?: number }).cantidad : undefined;
        if (!objeto.storage && cantidadItem === undefined) return null;

        return (
          <div className={`${estilos.cajaMecanicasCombateObjeto} ${estilos.cajaMecanicasMunicion}`}>
            <div className={`${estilos.tituloMecanicasObjeto} ${estilos.tituloMecanicasMunicion}`}>
              Propiedades de Munición y Almacenamiento
            </div>
            <div className={estilos.gridMecanicas}>
              {cantidadItem !== undefined && (
                <div className={estilos.itemMecanica}>
                  <span className={estilos.textoEtiquetaMecanica}>Cantidad: </span>
                  <strong className={estilos.valorMecanicaDano}>{cantidadItem}</strong>
                </div>
              )}
              {objeto.storage && (
                <div className={estilos.itemMecanica}>
                  <span className={estilos.textoEtiquetaMecanica}>Almacenamiento: </span>
                  {(() => {
                    const idDestino = objeto.storage.index;
                    const destino = objetosHomebrew.find(o => o.id === idDestino || normalizarTexto(o.nombre) === normalizarTexto(objeto.storage!.name));
                    if (destino) {
                      return (
                        <strong
                          onClick={() => navegarAObjeto(destino.id)}
                          className={estilos.enlaceObjetoCompendio}
                        >
                          {objeto.storage.name}
                        </strong>
                      );
                    }
                    return <strong className={estilos.valorMecanicaCd}>{objeto.storage.name}</strong>;
                  })()}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Efectos Pasivos Aplicados */}
      {objeto.efectosPasivos && objeto.efectosPasivos.length > 0 && (
        <div className={estilos.seccionDescripcionFichaMargenGrande}>
          <div className={estilos.descripcionTituloFicha}>EFECTOS PASIVOS Y BONOS AUTOMÁTICOS</div>
          <div className={`${estilos.listaBonosMagicos} u-flex u-flex-col u-gap-xs`}>
            {objeto.efectosPasivos.map((efecto, idx: number) => (
              <div key={idx} className={`${estilos.cajaBonoMagico} ${estilos.cajaBonoMagicoVertical}`}>
                <div className="u-flex u-justify-between u-w-full">
                  <span className={`${estilos.textoEtiquetaMecanica} ${estilos.textoCian}`}>
                    [{efecto.tipo || "efecto"}] <strong>{efecto.bono}</strong>
                  </span>
                  {efecto.valor !== undefined && efecto.valor !== "" && (
                    <strong className={estilos.valorMecanicaAtaque}>
                      {isNaN(Number(efecto.valor)) ? efecto.valor : (Number(efecto.valor) >= 0 ? `+${efecto.valor}` : efecto.valor)}
                    </strong>
                  )}
                </div>
                {efecto.descripcion && (
                  <span className={estilos.textoDescBono}>
                    {efecto.descripcion}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hechizos Vinculados */}
      {objeto.hechizosVinculados && objeto.hechizosVinculados.length > 0 && (
        <div className={estilos.seccionDescripcionFichaMargenGrande}>
          <div className={estilos.descripcionTituloFicha}>HECHIZOS VINCULADOS AL OBJETO</div>
          <div className={`${estilos.listaBonosMagicos} u-flex u-flex-col u-gap-xs`}>
            {objeto.hechizosVinculados.map((hechizo: { nombre: string; cd?: number; bonoAtaque?: number; costeCargas?: number }, idx: number) => {
              const hechizoEnBD = baseDatosHechizos.find(
                (h) => h.id === hechizo.nombre.toLowerCase().replace(/\s+/g, "-") ||
                       normalizarTexto(h.nombre) === normalizarTexto(hechizo.nombre)
              );

              const tirarHechizoVinculado = () => {
                const etiqueta = sanitizarEtiqueta(`DM - ${hechizo.nombre} (${objeto.nombre})`);
                if (hechizo.bonoAtaque !== undefined && !isNaN(Number(hechizo.bonoAtaque))) {
                  const bonoSigno = Number(hechizo.bonoAtaque) >= 0 ? `+${hechizo.bonoAtaque}` : `${hechizo.bonoAtaque}`;
                  lanzarDadosTaleSpire(`!Ataque ${hechizo.nombre}:1d20${bonoSigno}`, `Ataque Mágico: ${etiqueta}`);
                } else if (hechizo.cd !== undefined && !isNaN(Number(hechizo.cd))) {
                  lanzarDadosTaleSpire("1d20", `Salvación vs CD ${hechizo.cd} (${etiqueta})`);
                } else if (hechizoEnBD && alAbrirHechizo) {
                  alAbrirHechizo(hechizoEnBD.id);
                } else {
                  lanzarDadosTaleSpire("1d20", etiqueta);
                }
              };

              return (
                <div key={idx} className={`${estilos.cajaBonoMagico} ${estilos.cajaHechizoVinculado}`}>
                  <div
                    onClick={hechizoEnBD && alAbrirHechizo ? () => alAbrirHechizo(hechizoEnBD.id) : undefined}
                    className={hechizoEnBD ? estilos.enlaceHechizoVinculado : undefined}
                    title={hechizoEnBD ? `Ver ficha completa de ${hechizo.nombre}` : undefined}
                  >
                    <strong className={estilos.nombreHechizoVinculado}>{hechizo.nombre}</strong>
                    <div className={estilos.subDetallesHechizoVinculado}>
                      {hechizo.cd !== undefined && <span>CD {hechizo.cd}</span>}
                      {hechizo.bonoAtaque !== undefined && <span>Ataque: +{hechizo.bonoAtaque}</span>}
                      {hechizoEnBD && <span className={estilos.badgeVerFichaHechizo}>Ver ficha</span>}
                    </div>
                  </div>
                  <div className="u-flex u-items-center u-gap-xs">
                    {hechizo.costeCargas !== undefined && (
                      <span className={estilos.badgeCosteCargas}>
                        Coste: {hechizo.costeCargas} carga{hechizo.costeCargas > 1 ? "s" : ""}
                      </span>
                    )}
                    {esGM && (
                      <button
                        type="button"
                        onClick={tirarHechizoVinculado}
                        className={estilos.botonTirarHechizoVinculado}
                        title={`Lanzar tirada de ${hechizo.nombre} en TaleSpire`}
                      >
                        <Dices size={11} />
                        <span>Tirar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};
