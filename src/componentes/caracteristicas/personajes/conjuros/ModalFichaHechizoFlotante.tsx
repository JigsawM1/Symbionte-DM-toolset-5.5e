import React from "react";
import type { PersonajeJugador, HechizoBase } from "@/tipos";
import type { ModoLanzamiento } from "@/servicios/servicioLanzamientoConjuros";
import { FichaHechizo } from "@/componentes/caracteristicas/compendio/FichaHechizo";

interface ModalFichaHechizoFlotanteProps {
  hechizoModal: HechizoBase | null;
  alCerrar: () => void;
  personaje: PersonajeJugador;
  bonoAtaqueMagico: number;
  esLanzadorPacto: boolean;
  nivelEspacioPacto: number;
  sistemaMagia: "espacios" | "puntos";
  estaBloqueadoPorArmadura: boolean;
  motivoBloqueoArmadura?: string;
  lanzar: (solicitud: { modo: ModoLanzamiento; hechizo: HechizoBase; nivelLanzamiento?: number }) => Promise<boolean | void>;
}

export const ModalFichaHechizoFlotante: React.FC<ModalFichaHechizoFlotanteProps> = ({
  hechizoModal,
  alCerrar,
  personaje,
  bonoAtaqueMagico,
  esLanzadorPacto,
  nivelEspacioPacto,
  sistemaMagia,
  estaBloqueadoPorArmadura,
  motivoBloqueoArmadura,
  lanzar
}) => {
  if (!hechizoModal) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16
      }}
      onClick={alCerrar}
    >
      <div
        style={{
          maxWidth: 550,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          backgroundColor: "#161b22",
          borderRadius: 8
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <FichaHechizo
          hechizo={hechizoModal}
          nombrePersonaje={personaje.nombre}
          nivelPersonaje={personaje.nivel || 1}
          bonoAtaqueMagico={bonoAtaqueMagico}
          esLanzadorPacto={esLanzadorPacto}
          nivelEspacioPacto={nivelEspacioPacto}
          espaciosPactoMaximos={personaje.espaciosPactoMaximos || 0}
          espaciosConjuroMaximos={personaje.espaciosConjuroMaximos || {}}
          nivelConjuroMaximo={personaje.nivelConjuroMaximo || 0}
          sistemaMagia={sistemaMagia}
          bloqueadoPorArmadura={estaBloqueadoPorArmadura}
          motivoBloqueoArmadura={motivoBloqueoArmadura}
          onClose={alCerrar}
          alLanzar={async (modo, nivelLanzamiento) => {
            const exito = await lanzar({
              modo,
              hechizo: hechizoModal,
              nivelLanzamiento
            });
            if (exito) {
              alCerrar();
            }
          }}
        />
      </div>
    </div>
  );
};
