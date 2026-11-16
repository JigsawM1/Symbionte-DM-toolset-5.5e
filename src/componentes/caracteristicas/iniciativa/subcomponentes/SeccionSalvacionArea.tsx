import React from "react";
import { ShieldAlert, X } from "lucide-react";
import { BotonNumerico } from "@/componentes/comunes/BotonNumerico";
import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import type { Caracteristica } from "@/tipos";
import type { ResultadoSalvacionArea } from "@/almacen/slices/sliceIniciativa";
import estilosClases from "../SelectorCondiciones.module.css";

const LISTA_CARACTERISTICAS: { clave: Caracteristica; etiqueta: string }[] = [
  { clave: "fuerza", etiqueta: "FUE" },
  { clave: "destreza", etiqueta: "DES" },
  { clave: "constitucion", etiqueta: "CON" },
  { clave: "inteligencia", etiqueta: "INT" },
  { clave: "sabiduria", etiqueta: "SAB" },
  { clave: "carisma", etiqueta: "CAR" }
];

interface SeccionSalvacionAreaProps {
  cdSalvacion: string;
  onCambiarCd: (cd: string) => void;
  caracteristicaSalvacion: Caracteristica;
  onCambiarCaracteristica: (carac: Caracteristica) => void;
  mitigacionSalvacion: "mitad" | "nada";
  onCambiarMitigacion: (mitig: "mitad" | "nada") => void;
  menuAbierto: "carac" | "mitig" | null;
  onAlternarMenu: (menu: "carac" | "mitig") => void;
  onCerrarMenus: () => void;
  onEjecutarSalvacion: () => void;
  resultadoSalvacion: ResultadoSalvacionArea | null;
  onCerrarResultado: () => void;
}

export const SeccionSalvacionArea: React.FC<SeccionSalvacionAreaProps> = ({
  cdSalvacion,
  onCambiarCd,
  caracteristicaSalvacion,
  onCambiarCaracteristica,
  mitigacionSalvacion,
  onCambiarMitigacion,
  menuAbierto,
  onAlternarMenu,
  onCerrarMenus,
  onEjecutarSalvacion,
  resultadoSalvacion,
  onCerrarResultado
}) => {
  return (
    <>
      <div className={estilosClases.seccionSalvacion}>
        <div className={estilosClases.contenedorDropdownCustom}>
          <button
            type="button"
            onClick={() => onAlternarMenu("carac")}
            className={estilosClases.botonCustomSelectCarac}
            title="Característica para la salvación"
          >
            <span>{caracteristicaSalvacion.substring(0, 3).toUpperCase()}</span>
            <span className={estilosClases.flechaDropdown}>▼</span>
          </button>

          {menuAbierto === "carac" && (
            <div className={estilosClases.dropdownCustomMenu}>
              {LISTA_CARACTERISTICAS.map((item) => (
                <div
                  key={item.clave}
                  onClick={() => {
                    onCambiarCaracteristica(item.clave);
                    onCerrarMenus();
                  }}
                  className={`${estilosClases.dropdownCustomItem} ${
                    caracteristicaSalvacion === item.clave ? estilosClases.dropdownCustomItemActivo : ""
                  }`}
                >
                  {item.etiqueta}
                </div>
              ))}
            </div>
          )}
        </div>

        <CampoNumerico
          min="1"
          value={cdSalvacion}
          alConfirmar={(valor) => onCambiarCd(String(valor))}
          onKeyDown={(e) => e.key === "Enter" && onEjecutarSalvacion()}
          placeholder="CD..."
          className={estilosClases.inputCD}
          title="Dificultad CD para la salvación"
          alVaciar={() => onCambiarCd("")}
        />

        <div className={estilosClases.contenedorDropdownCustom}>
          <button
            type="button"
            onClick={() => onAlternarMenu("mitig")}
            className={estilosClases.botonCustomSelectMitig}
            title="Regla de daño si supera la salvación"
          >
            <span>{mitigacionSalvacion === "mitad" ? "1/2 DAÑO" : "0 DAÑO"}</span>
            <span className={estilosClases.flechaDropdown}>▼</span>
          </button>

          {menuAbierto === "mitig" && (
            <div className={`${estilosClases.dropdownCustomMenu} ${estilosClases.dropdownMitigMenu}`}>
              <div
                onClick={() => { onCambiarMitigacion("mitad"); onCerrarMenus(); }}
                className={`${estilosClases.dropdownCustomItem} ${mitigacionSalvacion === "mitad" ? estilosClases.dropdownCustomItemActivo : ""}`}
              >
                1/2 DAÑO EN ÉXITO
              </div>
              <div
                onClick={() => { onCambiarMitigacion("nada"); onCerrarMenus(); }}
                className={`${estilosClases.dropdownCustomItem} ${mitigacionSalvacion === "nada" ? estilosClases.dropdownCustomItemActivo : ""}`}
              >
                0 DAÑO EN ÉXITO
              </div>
            </div>
          )}
        </div>

        <BotonNumerico
          ambito="[data-acciones-condiciones]"
          onClick={onEjecutarSalvacion}
          className={estilosClases.botonSalvacion}
          title="Ejecutar salvación en área (aplica daño mitigado a éxito y condición/efecto a fallo)"
        >
          <ShieldAlert size={11} className={estilosClases.iconoShield} />
          TIRAR
        </BotonNumerico>
      </div>

      {resultadoSalvacion && (
        <div className={estilosClases.resumenSalvacionFlotante}>
          <div className={estilosClases.cabeceraResumen}>
            <span>
              SALVACIÓN <strong>{resultadoSalvacion.caracteristica.substring(0, 3).toUpperCase()}</strong> (CD {resultadoSalvacion.cd})
            </span>
            <button onClick={onCerrarResultado} className={estilosClases.botonCerrarResumen}>
              <X size={12} />
            </button>
          </div>

          <div className={estilosClases.listaResultadosSalvacion}>
            {resultadoSalvacion.resultados.map((r) => (
              <div key={r.id} className={estilosClases.filaResultadoSalvacion}>
                <span className={estilosClases.nombreResumen}>{r.nombre}:</span>
                {r.detalleHorda ? (
                  <>
                    <span className={estilosClases.formulaTirada}>
                      d20≥{r.detalleHorda.d20Necesario} · <strong>{r.detalleHorda.exitos}✓ / {r.detalleHorda.fallos}✗</strong>
                    </span>
                    <span className={r.detalleHorda.fallos === 0 ? estilosClases.badgeExito : estilosClases.badgeFallo}>
                      HORDA ({r.detalleHorda.afectados})
                    </span>
                  </>
                ) : (
                  <>
                    <span className={estilosClases.formulaTirada}>
                      d20({r.d20}){r.bono >= 0 ? `+${r.bono}` : r.bono} = <strong>{r.total}</strong>
                    </span>
                    <span className={r.exito ? estilosClases.badgeExito : estilosClases.badgeFallo}>
                      {r.exito ? "ÉXITO" : "FALLO"}
                    </span>
                  </>
                )}
                {r.dañoSufrido !== undefined && (
                  <span className={estilosClases.textoDanoSalvacion}>
                    (-{r.dañoSufrido} HP)
                  </span>
                )}
                {r.condicionAplicada && (
                  <span className={estilosClases.textoEfectoSalvacion}>
                    [EFECTO]
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
