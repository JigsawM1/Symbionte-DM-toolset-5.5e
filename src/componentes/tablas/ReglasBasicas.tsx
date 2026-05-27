import React from "react";
import estilosClases from "./ReglasBasicas.module.css";

export const ReglasBasicas: React.FC = () => {
  return (
    <div className={estilosClases.seccionReglasBasicasGrid}>
      <div className={estilosClases.tarjetaReglaBrutal}>
        <div className={estilosClases.cabeceraReglaBrutal}>DIFICULTAD DE PRUEBAS (CD 5.5e)</div>
        <table className={estilosClases.tablaRegla}>
          <thead>
            <tr className={estilosClases.filaTablaReglaHead}>
              <th>DIFICULTAD</th>
              <th>CD</th>
            </tr>
          </thead>
          <tbody>
            <tr className={estilosClases.filaTablaRegla}><td>Muy Fácil</td><td className="dato-numerico">5</td></tr>
            <tr className={estilosClases.filaTablaRegla}><td>Fácil</td><td className="dato-numerico">10</td></tr>
            <tr className={estilosClases.filaTablaRegla}><td>Moderado</td><td className="dato-numerico">15</td></tr>
            <tr className={estilosClases.filaTablaRegla}><td>Difícil</td><td className="dato-numerico">20</td></tr>
            <tr className={estilosClases.filaTablaRegla}><td>Muy Difícil</td><td className="dato-numerico">25</td></tr>
            <tr className={estilosClases.filaTablaRegla}><td>Casi Imposible</td><td className="dato-numerico">30</td></tr>
          </tbody>
        </table>
      </div>

      <div className={estilosClases.tarjetaReglaBrutal}>
        <div className={estilosClases.cabeceraReglaBrutal}>COBERTURAS DE COMBATE (5.5e)</div>
        <ul className={estilosClases.listaCobertura}>
          <li className={estilosClases.itemCobertura}>
            <strong>Cobertura Media (+2 CA):</strong> Al menos la mitad del cuerpo está a cubierto. Otorga +2 a CA y salvaciones de Destreza.
          </li>
          <li className={estilosClases.itemCobertura}>
            <strong>Cobertura 3/4 (+5 CA):</strong> Otorga +5 a CA y salvaciones de Destreza. 3/4 partes del cuerpo cubiertas.
          </li>
          <li className={estilosClases.itemCobertura}>
            <strong>Cobertura Total:</strong> No puede ser objetivo directo de ningún ataque o conjuro, salvo efectos de área curvos.
          </li>
        </ul>
      </div>

      <div className={estilosClases.tarjetaReglaBrutal}>
        <div className={estilosClases.cabeceraReglaBrutal}>VISIBILIDAD Y SIGILO (Manual 2024)</div>
        <div className={estilosClases.textoCuerpoRegla}>
          • <strong>Acción Esconderse:</strong> Superar prueba de <strong>Destreza (Sigilo) CD 15</strong>. Con éxito, ganas la condición <strong>Invisible</strong> (ventaja en ataques, enemigos tienen desventaja en golpearte, etc.) hasta que hagas ruido, ataques o te vean.
          <br /><br />
          • <strong>Búsqueda activa:</strong> Detectar criaturas escondidas requiere una acción de Buscar superando una prueba de Sabiduría CD igual a la tirada del escondido.
        </div>
      </div>

      <div className={estilosClases.tarjetaReglaBrutal}>
        <div className={estilosClases.cabeceraReglaBrutal}>CONCENTRACIÓN Y CONJUROS (5.5e)</div>
        <div className={estilosClases.textoCuerpoRegla}>
          • <strong>Daño sufrido:</strong> Haz una <strong>salvación de Constitución CD 10</strong> o la mitad del daño recibido (lo que sea mayor) para no perder la concentración de tu conjuro activo.
          <br /><br />
          • <strong>Interrupción:</strong> Lanzar otro conjuro de concentración rompe el actual inmediatamente. Quedar Incapacitado o Muerto también la rompe.
        </div>
      </div>

      <div className={estilosClases.tarjetaReglaBrutal}>
        <div className={estilosClases.cabeceraReglaBrutal}>REGLAS DE ASFIXIA (Manual 2024)</div>
        <div className={estilosClases.textoCuerpoRegla}>
          Una criatura puede aguantar la respiración una cantidad de minutos igual a <strong>1 + su modificador de Constitución</strong> (mínimo 30 segundos).
          <br /><br />
          Cuando se le acaba el aire, sobrevive una cantidad de asaltos igual a su <strong>modificador de Constitución</strong> (mínimo 1 asalto). Al inicio de su siguiente turno, cae a <strong>0 Puntos de Golpe</strong> y empieza a morir (realizar salvaciones de muerte).
        </div>
      </div>
    </div>
  );
};
