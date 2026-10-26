import type { RasgoPersonaje } from "@/tipos";
import { CampoNumerico } from "@/componentes/comunes";
import { HeartHandshake, Target, Plus, Minus, Zap } from "lucide-react";
import estilos from "./CamposResolucionAdicionales.module.css";

interface CamposResolucionAdicionalesProps {
  rasgo: RasgoPersonaje;
  idOpcion: string;
  propio: boolean;
  cantidad: number;
  tirada: number;
  cambiarCantidad: (n: number) => void;
  cambiarTirada: (n: number) => void;
}

export function CamposResolucionAdicionales({
  rasgo,
  idOpcion,
  propio,
  cantidad,
  tirada,
  cambiarCantidad,
  cambiarTirada
}: CamposResolucionAdicionalesProps) {
  const opcion = rasgo.resolucionAsistida?.opciones.find(o => o.id === idOpcion);

  return (
    <>
      {propio && rasgo.resolucionAsistida?.reparto && (
        <div className={`${estilos.tarjetaCampoAdicional} ${estilos.tarjetaCampoCuracion}`}>
          <div className={estilos.filaPrincipalCampo}>
            <div className={estilos.infoCampo}>
              <div className={estilos.iconoCampoCuracion} aria-hidden="true">
                <HeartHandshake size={15} />
              </div>
              <div className={estilos.textosCabecera}>
                <span className={estilos.tituloCampo}>PG para mi personaje</span>
                <span className={estilos.subtituloCampo}>El resto se reparte manualmente en mesa</span>
              </div>
            </div>

            <div className={estilos.controlStepper}>
              <button
                type="button"
                className={estilos.botonPaso}
                onClick={() => cambiarCantidad(Math.max(0, cantidad - 1))}
                disabled={cantidad <= 0}
                aria-label="Reducir PG para mi personaje"
                title="Reducir 1 PG"
              >
                <Minus size={13} />
              </button>

              <div className={estilos.cajaInputUnidad}>
                <CampoNumerico
                  min={0}
                  value={cantidad}
                  alConfirmar={cambiarCantidad}
                  className={estilos.inputCampo}
                  title="PG propios a recibir"
                />
                <span className={estilos.insigniaUnidad} aria-hidden="true">PG</span>
              </div>

              <button
                type="button"
                className={estilos.botonPaso}
                onClick={() => cambiarCantidad(cantidad + 1)}
                aria-label="Aumentar PG para mi personaje"
                title="Aumentar 1 PG"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {opcion?.tipo === "modificador_tirada" && (
        <div className={`${estilos.tarjetaCampoAdicional} ${estilos.tarjetaCampoTirada}`}>
          <div className={estilos.filaPrincipalCampo}>
            <div className={estilos.infoCampo}>
              <div className={estilos.iconoCampoTirada} aria-hidden="true">
                <Target size={15} />
              </div>
              <div className={estilos.textosCabecera}>
                <span className={estilos.tituloCampo}>Total del ataque fallido</span>
                <span className={estilos.subtituloCampo}>Resultado previo sin volver a tirar</span>
              </div>
            </div>

            <div className={estilos.controlStepper}>
              <button
                type="button"
                className={estilos.botonPaso}
                onClick={() => cambiarTirada(Math.max(0, tirada - 1))}
                disabled={tirada <= 0}
                aria-label="Reducir valor del ataque fallido"
                title="Reducir 1"
              >
                <Minus size={13} />
              </button>

              <div className={estilos.cajaInputUnidad}>
                <CampoNumerico
                  value={tirada}
                  alConfirmar={cambiarTirada}
                  className={estilos.inputCampo}
                  title="Total del ataque fallido"
                />
                <span className={estilos.insigniaUnidad} aria-hidden="true">D20</span>
              </div>

              <button
                type="button"
                className={estilos.botonPaso}
                onClick={() => cambiarTirada(tirada + 1)}
                aria-label="Aumentar valor del ataque fallido"
                title="Aumentar 1"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>

          <div className={estilos.badgeReglaAccion}>
            <Zap size={11} aria-hidden="true" />
            <span>
              {opcion.tipoAccion === "reaccion"
                ? "Consume tu reacción · Ataque de otra criatura a 30 pies"
                : "Ataque propio · Sin coste de acción"}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
