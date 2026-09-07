import React from "react";
import type { ObjetoInventario, HechizoVinculado } from "@/tipos";
import { Dices } from "lucide-react";
import { lanzarDadosTaleSpire, sanitizarEtiqueta } from "@/utiles/lanzadorDados";
import estilos from "../ModalDetalleObjetoInventario.module.css";

interface ListaHechizosVinculadosObjetoProps {
  objeto: ObjetoInventario;
  hechizosVinculados: HechizoVinculado[];
  alModificarCargas?: (delta: number) => void;
  alLanzarHechizo?: (hechizo: HechizoVinculado, objetoNombre: string, coste: number) => Promise<boolean | void>;
  bloqueadoPorArmadura?: boolean;
  motivoBloqueoArmadura?: string;
}

export const ListaHechizosVinculadosObjeto: React.FC<ListaHechizosVinculadosObjetoProps> = ({
  objeto,
  hechizosVinculados,
  alModificarCargas,
  alLanzarHechizo,
  bloqueadoPorArmadura = false,
  motivoBloqueoArmadura
}) => {
  if (!hechizosVinculados || hechizosVinculados.length === 0) {
    return null;
  }

  return (
    <div className={estilos.seccionBloque}>
      <span className={`${estilos.tituloSeccion} ${estilos.tituloSeccionHechizos}`}>
        Hechizos Vinculados
      </span>
      <div className={estilos.listaItemsVertical}>
        {hechizosVinculados.map((hechizo: HechizoVinculado, idx: number) => {
          const coste = Number(hechizo.costeCargas) || 0;
          const cargasDisponibles = objeto.cargasActuales ?? (objeto.cargasMaximas || 0);
          const tieneCargasSuficientes = coste === 0 || cargasDisponibles >= coste;

          const lanzarHechizoVinculado = async () => {
            if (bloqueadoPorArmadura) return;
            if (alLanzarHechizo) {
              await alLanzarHechizo(hechizo, objeto.nombre, coste);
              return;
            }
            if (coste > 0 && alModificarCargas) alModificarCargas(-coste);
            const etiqueta = sanitizarEtiqueta(`Hechizo ${hechizo.nombre} (${objeto.nombre})`);
            if (hechizo.bonoAtaque !== undefined && !isNaN(Number(hechizo.bonoAtaque))) {
              await lanzarDadosTaleSpire(`1d20+${hechizo.bonoAtaque}`, `Ataque Mágico: ${etiqueta}`);
            } else if (hechizo.cd !== undefined && !isNaN(Number(hechizo.cd))) {
              await lanzarDadosTaleSpire("1d20", `Salvación vs CD ${hechizo.cd} (${etiqueta})`);
            } else {
              await lanzarDadosTaleSpire("1d20", etiqueta);
            }
          };

          return (
            <div key={idx} className={estilos.tarjetaHechizoVinculado}>
              <div>
                <strong className={estilos.nombreHechizoVinculado}>{hechizo.nombre}</strong>
                <span className={estilos.metaHechizoVinculado}>
                  {hechizo.cd !== undefined ? `CD ${hechizo.cd}` : ""}
                  {hechizo.bonoAtaque !== undefined ? ` | Ataque +${hechizo.bonoAtaque}` : ""}
                  {coste > 0 ? ` (${coste} ${coste === 1 ? "carga" : "cargas"})` : ""}
                </span>
              </div>
              <button
                type="button"
                onClick={lanzarHechizoVinculado}
                disabled={!tieneCargasSuficientes || bloqueadoPorArmadura}
                className={estilos.botonLanzarHechizoModal}
                title={bloqueadoPorArmadura ? (motivoBloqueoArmadura || "Bloqueado por armadura") : undefined}
                style={bloqueadoPorArmadura ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
              >
                <Dices size={11} />
                <span>Lanzar {coste > 0 ? `(-${coste})` : ""}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
