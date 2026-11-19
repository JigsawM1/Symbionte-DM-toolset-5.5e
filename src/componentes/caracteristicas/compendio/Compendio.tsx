import React from "react";
import { BookOpen, Swords, Sparkles } from "lucide-react";
import { CompendioConjurosJugador } from "./CompendioConjurosJugador";
import { ListaHechizos } from "./ListaHechizos";
import { ListaHomebrew } from "@/componentes/caracteristicas/homebrew/ListaHomebrew";
import { PanelConjurosPersonaje } from "@/componentes/caracteristicas/personajes/PanelConjurosPersonaje";
import { BotonSubPestana } from "@/componentes/caracteristicas/personajes/BotonSubPestana";
import { usarHojaPersonaje } from "@/componentes/caracteristicas/personajes/usarHojaPersonaje";
import { usarEstadoConfiguracion, usarAccionesConfiguracion } from "@/almacen/selectores";
import { usarEstadoPersistido } from "@/hooks";
import { usarMagiaPersonaje } from "@/hooks/usarMagiaPersonaje";
import estilos from "./Compendio.module.css";
import estilosConjuros from "./CompendioConjurosJugador.module.css";

const VistaMagiaJugador: React.FC = () => {
  const { establecerPestaña } = usarAccionesConfiguracion();
  const [subPestanaMagia, setSubPestanaMagia] = usarEstadoPersistido<"lanzamiento" | "compendio">(
    "ts_magia_subpestana",
    "lanzamiento"
  );
  const {
    personajeActivo,
    statsCalculadas,
    sistemaMagia,
    baseDatosHechizos,
    modoTirada,
    manejarCambioModoTirada,
    alGastarEspacio,
    alRecuperarEspacio,
    alGastarPuntos,
    alRecuperarPuntos,
    alGastarEspacioPacto,
    alRecuperarEspaciosPacto,
    alRomperConcentracion,
    alQuitarTruco,
    alQuitarConjuro,
    alAlternarPreparado
  } = usarHojaPersonaje();

  const magia = usarMagiaPersonaje(personajeActivo, baseDatosHechizos);
  const totalConjurosListos = magia.trucosConocidos.length + magia.conteoEfectivo.total;

  return (
    <div className={estilos.contenedorMagiaJugador}>
      <div className={estilos.barraSubPestanasMagia}>
        <BotonSubPestana
          activa={subPestanaMagia === "lanzamiento"}
          etiqueta="LANZAMIENTO Y RECURSOS"
          icono={<Sparkles size={14} color={subPestanaMagia === "lanzamiento" ? "var(--pj-texto-magia)" : "var(--pj-texto-terciario)"} />}
          badge={totalConjurosListos}
          alClick={() => setSubPestanaMagia("lanzamiento")}
        />
        <BotonSubPestana
          activa={subPestanaMagia === "compendio"}
          etiqueta="COMPENDIO Y PREPARAR"
          icono={<BookOpen size={14} color={subPestanaMagia === "compendio" ? "var(--pj-texto-cian)" : "var(--pj-texto-terciario)"} />}
          badge={baseDatosHechizos.length}
          alClick={() => setSubPestanaMagia("compendio")}
        />
      </div>

      {subPestanaMagia === "lanzamiento" ? (
        <div className={`${estilos.areaLanzamientoMagia} u-scroll-cef`}>
          {!personajeActivo || !statsCalculadas ? (
            <div className={`${estilos.vacioMagiaJugador} u-flex-col u-alinear-centro u-gap-lg`}>
              <span>
                No hay ningún personaje activo seleccionado. Ve a la pestaña «Características» para crear o activar uno.
              </span>
              <button
                type="button"
                onClick={() => establecerPestaña("jugadores")}
                className={estilosConjuros.botonCtaVacio}
              >
                Ir a Características
              </button>
            </div>
          ) : (
            <div className={estilos.limiteAnchoMagia}>
              <PanelConjurosPersonaje
                personaje={personajeActivo}
                magia={magia}
                bonoCompetencia={statsCalculadas.bonoCompetencia}
                modificadores={statsCalculadas.modificadores}
                baseDatosHechizos={baseDatosHechizos}
                sistemaMagia={sistemaMagia}
                penalizacionArmadura={statsCalculadas.penalizacionArmadura}
                modoTirada={modoTirada}
                alCambiarModoTirada={manejarCambioModoTirada}
                alAbrirCompendio={() => setSubPestanaMagia("compendio")}
                alGastarEspacio={alGastarEspacio}
                alRecuperarEspacio={alRecuperarEspacio}
                alGastarPuntos={alGastarPuntos}
                alRecuperarPuntos={alRecuperarPuntos}
                alGastarEspacioPacto={alGastarEspacioPacto}
                alRecuperarEspaciosPacto={alRecuperarEspaciosPacto}
                alRomperConcentracion={alRomperConcentracion}
                alQuitarTruco={alQuitarTruco}
                alQuitarConjuro={alQuitarConjuro}
                alAlternarPreparado={alAlternarPreparado}
              />
            </div>
          )}
        </div>
      ) : (
        <div className={estilos.areaContenido}>
          <CompendioConjurosJugador personajeActivo={personajeActivo} baseDatosHechizos={baseDatosHechizos} magia={magia} />
        </div>
      )}
    </div>
  );
};

export const Compendio: React.FC = () => {
  const { esGM } = usarEstadoConfiguracion();
  const [subPestaña, setSubPestaña] = usarEstadoPersistido<"conjuros" | "bestiario" | "equipo">(
    "ts_compendio_subpestana",
    "conjuros"
  );

  // Para jugadores (!esGM), la pestaña Magia unifica Lanzamiento/Recursos y Compendio/Preparación
  if (!esGM) {
    return <VistaMagiaJugador />;
  }

  return (
    <div className={estilos.contenedorCompendio}>
      {/* Sub-Navegación del Compendio para DM */}
      <div className={estilos.subNavegacion}>
        <button
          onClick={() => setSubPestaña("conjuros")}
          className={`${estilos.subBotonNav} ${
            subPestaña === "conjuros" ? estilos.subBotonNavActivo : ""
          }`}
          type="button"
        >
          <BookOpen size={14} />
          Conjuros (Spells)
        </button>

        <button
          onClick={() => setSubPestaña("bestiario")}
          className={`${estilos.subBotonNav} ${
            subPestaña === "bestiario" ? estilos.subBotonNavActivo : ""
          }`}
          type="button"
        >
          <Swords size={14} />
          Bestiario (Criaturas)
        </button>

        <button
          onClick={() => setSubPestaña("equipo")}
          className={`${estilos.subBotonNav} ${
            subPestaña === "equipo" ? estilos.subBotonNavActivo : ""
          }`}
          type="button"
        >
          <Sparkles size={14} />
          Equipo y Objetos
        </button>
      </div>

      {/* Área principal según sub-pestaña activa */}
      <div className={estilos.areaContenido}>
        {subPestaña === "conjuros" && <ListaHechizos />}
        {subPestaña === "bestiario" && (
          <ListaHomebrew tipoHomebrew="criatura" soloLectura />
        )}
        {subPestaña === "equipo" && (
          <ListaHomebrew tipoHomebrew="objeto" soloLectura />
        )}
      </div>
    </div>
  );
};
