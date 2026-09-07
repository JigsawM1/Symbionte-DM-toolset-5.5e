import React from "react";
import type {
  ObjetoInventario,
  ObjetoJuego,
  TipoContenedor,
  EfectoPasivo,
  HechizoVinculado
} from "@/tipos";
import {
  Sparkles,
  Link2,
  BookOpen,
  Hammer,
  Package,
  PackageOpen,
  FlaskConical,
  Save,
  Check
} from "lucide-react";
import { SeccionContenedorYUbicacion } from "./SeccionContenedorYUbicacion";
import { ListaHechizosVinculadosObjeto } from "./ListaHechizosVinculadosObjeto";
import estilos from "../ModalDetalleObjetoInventario.module.css";

interface SeccionMagiaYEfectosObjetoProps {
  objeto: ObjetoInventario;
  objetoBase: ObjetoJuego | null;
  descripcion: string;
  puedeSintonizar: boolean;
  alAlternarSintonizado?: () => void;
  alCambiarContenedor?: (contenedor: TipoContenedor) => void;
  alDesempaquetar?: () => void;
  alCerrar: () => void;
  alModificarCargas?: (delta: number) => void;
  alLanzarHechizo?: (hechizo: HechizoVinculado, objetoNombre: string, coste: number) => Promise<boolean | void>;
  bloqueadoPorArmadura?: boolean;
  motivoBloqueoArmadura?: string;
  notasTemp: string;
  setNotasTemp: (notas: string) => void;
  notasGuardadas: boolean;
  manejarGuardarNotas: () => void;
  alActualizarNotas?: (notas: string) => void;
}

export const SeccionMagiaYEfectosObjeto: React.FC<SeccionMagiaYEfectosObjetoProps> = ({
  objeto,
  objetoBase,
  descripcion,
  puedeSintonizar,
  alAlternarSintonizado,
  alCambiarContenedor,
  alDesempaquetar,
  alCerrar,
  alModificarCargas,
  alLanzarHechizo,
  bloqueadoPorArmadura = false,
  motivoBloqueoArmadura,
  notasTemp,
  setNotasTemp,
  notasGuardadas,
  manejarGuardarNotas,
  alActualizarNotas
}) => {
  return (
    <>
      {/* Recarga de Cargas */}
      {objetoBase?.formulaRecarga && (
        <div className={estilos.filaBadges}>
          <span className={estilos.badgeRecargaCargas}>
            <Sparkles size={10} /> Recarga: {objetoBase.formulaRecarga}
          </span>
        </div>
      )}

      {/* Venenos */}
      {(objetoBase?.esVeneno || objetoBase?.tipoVeneno || objetoBase?.efectoVeneno) && (
        <div className={estilos.seccionVeneno}>
          <span className={`${estilos.tituloSeccion} ${estilos.tituloSeccionVeneno}`}>
            <FlaskConical size={12} /> Propiedades del Veneno
          </span>
          {objetoBase.tipoVeneno && (
            <div className={estilos.filaBadges}>
              <span className={`${estilos.badgeMeta} ${estilos.badgeVenenoTipo}`}>
                Tipo: {objetoBase.tipoVeneno}
              </span>
            </div>
          )}
          {objetoBase.efectoVeneno && (
            <div className={estilos.cajaTextoVeneno}>{objetoBase.efectoVeneno}</div>
          )}
        </div>
      )}

      {/* Sintonización */}
      {(objeto.sintonizacionRequerida || objetoBase?.sintonizacionRequerida) && (
        <div className={`${estilos.filaInteractiva} ${objeto.sintonizado ? estilos.filaInteractivaSintonizado : ""}`}>
          <div className={estilos.bloqueInfoInteractiva}>
            <Link2 size={14} color={objeto.sintonizado ? "#c084fc" : "#94a3b8"} />
            <div>
              <span className={objeto.sintonizado ? estilos.textoInteractivaActivo : estilos.textoInteractiva}>
                {objeto.sintonizado ? "Sintonizado con este personaje" : "Requiere Sintonización (No sintonizado)"}
              </span>
              {objetoBase?.condicionSintonizacion && (
                <div className={estilos.subtextoCondicionSintonizacion}>
                  Condición: {objetoBase.condicionSintonizacion}
                </div>
              )}
            </div>
          </div>
          {alAlternarSintonizado && (
            <button
              type="button"
              onClick={alAlternarSintonizado}
              disabled={!puedeSintonizar}
              className={`${estilos.botonAccionModal} ${objeto.sintonizado ? estilos.botonDesintonizar : estilos.botonSintonizar}`}
            >
              {objeto.sintonizado ? "Desintonizar" : "Sintonizar"}
            </button>
          )}
        </div>
      )}

      {/* Contenedor Especial */}
      <SeccionContenedorYUbicacion
        contenedorActual={objeto.contenedor}
        equipado={objeto.equipado}
        alCambiarContenedor={alCambiarContenedor}
      />

      {/* Descripción y Reglas */}
      <div className={estilos.seccionBloque}>
        <span className={`${estilos.tituloSeccion} ${estilos.tituloSeccionDescripcion}`}>
          <BookOpen size={12} /> Descripción y Reglas
        </span>
        <div className={estilos.cajaTextoDescripcion}>
          {descripcion || "Sin descripción adicional disponible."}
        </div>
      </div>

      {/* Artesanía */}
      {((objetoBase?.artesania && (objetoBase.artesania.tallerRequerido || (objetoBase.artesania.componentes && objetoBase.artesania.componentes.length > 0))) || (objetoBase?.craft && objetoBase.craft.length > 0)) && (
        <div className={estilos.seccionArtesania}>
          <span className={`${estilos.tituloSeccion} ${estilos.tituloSeccionArtesania}`}>
            <Hammer size={12} /> Receta de Artesanía y Fabricación
          </span>
          {objetoBase.artesania?.tallerRequerido && (
            <div className={estilos.filaArtesaniaMeta}>
              <div><span>Taller: </span><strong style={{ color: "#f8fafc" }}>{objetoBase.artesania.tallerRequerido}</strong></div>
            </div>
          )}
          {objetoBase.craft && objetoBase.craft.length > 0 && (
            <div>
              <span style={{ fontSize: "10.5px", color: "#94a3b8", display: "block", marginBottom: 3 }}>Herramientas Requeridas:</span>
              <div className={estilos.listaComponentesChips}>
                {objetoBase.craft.map((c: { name: string; index: string }, idx: number) => (
                  <span key={idx} className={estilos.chipHerramientaCraft}>{c.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contenido del Paquete */}
      {objetoBase?.contents && objetoBase.contents.length > 0 && (
        <div className={estilos.seccionBloque}>
          <div className={estilos.cabeceraContents}>
            <span className={`${estilos.tituloSeccion} ${estilos.tituloSeccionContents}`}>
              <Package size={12} /> Contenido del Paquete ({objetoBase.contents.length} objetos)
            </span>
            {alDesempaquetar && (
              <button
                type="button"
                onClick={() => { alDesempaquetar(); alCerrar(); }}
                className={estilos.botonDesempaquetarModal}
                title="Desempaquetar todos los ítems a tu mochila"
              >
                <PackageOpen size={12} />
                <span>Desempaquetar</span>
              </button>
            )}
          </div>
          <div className={estilos.listaItemsVertical}>
            {objetoBase.contents.map((itemContenido: { item: { name: string; index: string }; quantity: number }, idx: number) => (
              <div key={idx} className={estilos.filaItemContenido}>
                <span>{itemContenido.item.name}</span>
                <strong className={estilos.cantidadItemContenido}>×{itemContenido.quantity}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Efectos Pasivos */}
      {objetoBase?.efectosPasivos && objetoBase.efectosPasivos.length > 0 && (
        <div className={estilos.seccionBloque}>
          <span className={`${estilos.tituloSeccion} ${estilos.tituloSeccionPasivos}`}>Efectos Pasivos y Bonos</span>
          <div className={estilos.listaItemsVertical}>
            {objetoBase.efectosPasivos.map((efecto: EfectoPasivo, idx: number) => (
              <div key={idx} className={estilos.filaEfectoPasivo}>
                <strong>[{efecto.tipo}] {efecto.bono}</strong>: {efecto.descripcion || efecto.valor}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hechizos Vinculados */}
      {objetoBase?.hechizosVinculados && (
        <ListaHechizosVinculadosObjeto
          objeto={objeto}
          hechizosVinculados={objetoBase.hechizosVinculados}
          alModificarCargas={alModificarCargas}
          alLanzarHechizo={alLanzarHechizo}
          bloqueadoPorArmadura={bloqueadoPorArmadura}
          motivoBloqueoArmadura={motivoBloqueoArmadura}
        />
      )}

      {/* Notas Personales */}
      <div className={estilos.seccionBloque}>
        <div className={estilos.cabeceraNotas}>
          <span className={estilos.tituloSeccion}>Notas Personales</span>
          {notasGuardadas && (
            <span className={estilos.textoGuardado}><Check size={12} /> Guardado</span>
          )}
        </div>
        <textarea
          className={estilos.textareaNotasModal}
          value={notasTemp}
          onChange={(e) => setNotasTemp(e.target.value)}
          placeholder="Añade notas sobre el origen, marcas, runas o uso de este objeto..."
          rows={2}
        />
        {alActualizarNotas && (
          <button type="button" className={estilos.botonGuardarNotas} onClick={manejarGuardarNotas}>
            <Save size={12} />
            <span>Guardar Notas</span>
          </button>
        )}
      </div>
    </>
  );
};
