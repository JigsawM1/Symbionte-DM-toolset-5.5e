import { useState } from "react";
import {
  TODAS_ARMAS_SENCILLAS,
  TODAS_ARMAS_MARCIALES,
  ARMAS_DE_FUEGO,
  ARMADURAS_LIGERAS,
  ARMADURAS_MEDIAS,
  ARMADURAS_PESADAS,
  ESCUDOS,
  formatearResumenCompetenciasArmas,
  formatearResumenCompetenciasArmaduras
} from "@/constantes";
import { sonHerramientasEquivalentes } from "@/servicios/evaluadorEfectosRasgos";

export type CategoriaCompetencia = "armas" | "armaduras" | "idiomas" | "herramientas";

export interface EstadoCompetenciasModal {
  competenciasArmasGrupos: ("sencillas" | "marciales" | "fuego")[];
  competenciasArmasLista: string[];
  competenciasArmadurasGrupos: ("ligeras" | "medias" | "pesadas" | "escudos")[];
  competenciasArmadurasLista: string[];
  idiomasLista: string[];
  herramientasLista: string[];
}

export interface ResultadoCompetenciasGuardadas {
  competenciasArmasGrupos: ("sencillas" | "marciales" | "fuego")[];
  competenciasArmasLista: string[];
  competenciasArmas: string;
  competenciasArmadurasGrupos: ("ligeras" | "medias" | "pesadas" | "escudos")[];
  competenciasArmadurasLista: string[];
  competenciasArmaduras: string;
  idiomasLista: string[];
  idiomas: string;
  herramientasLista: string[];
  herramientas: string;
}

interface PropiedadesHookSelectorCompetencias {
  categoriaInicial?: CategoriaCompetencia;
  estadoInicial: EstadoCompetenciasModal;
  alGuardar: (nuevasCompetencias: ResultadoCompetenciasGuardadas) => void;
  alCerrar: () => void;
}

export const usarSelectorCompetencias = ({
  categoriaInicial = "armas",
  estadoInicial,
  alGuardar,
  alCerrar
}: PropiedadesHookSelectorCompetencias) => {
  const [pestaña, setPestaña] = useState<CategoriaCompetencia>(categoriaInicial);
  const [filtroTexto, setFiltroTexto] = useState("");

  const [armasGrupos, setArmasGrupos] = useState<("sencillas" | "marciales" | "fuego")[]>(
    estadoInicial.competenciasArmasGrupos || []
  );
  const [armasLista, setArmasLista] = useState<string[]>(
    estadoInicial.competenciasArmasLista || []
  );
  const [armadurasGrupos, setArmadurasGrupos] = useState<("ligeras" | "medias" | "pesadas" | "escudos")[]>(
    estadoInicial.competenciasArmadurasGrupos || []
  );
  const [armadurasLista, setArmadurasLista] = useState<string[]>(
    estadoInicial.competenciasArmadurasLista || []
  );
  const [idiomas, setIdiomas] = useState<string[]>(estadoInicial.idiomasLista || []);
  const [herramientas, setHerramientas] = useState<string[]>(estadoInicial.herramientasLista || []);

  const alternarGrupoArmas = (grupoId: "sencillas" | "marciales" | "fuego") => {
    const yaSeleccionado = armasGrupos.includes(grupoId);
    const nuevosGrupos = yaSeleccionado
      ? armasGrupos.filter((g) => g !== grupoId)
      : [...armasGrupos, grupoId];

    let nuevaLista = [...armasLista];
    let armasDelGrupo: readonly string[] = [];
    if (grupoId === "sencillas") armasDelGrupo = TODAS_ARMAS_SENCILLAS;
    else if (grupoId === "marciales") armasDelGrupo = TODAS_ARMAS_MARCIALES;
    else if (grupoId === "fuego") armasDelGrupo = ARMAS_DE_FUEGO;

    if (yaSeleccionado) {
      nuevaLista = nuevaLista.filter((a) => !armasDelGrupo.includes(a));
    } else {
      for (const arma of armasDelGrupo) {
        if (!nuevaLista.includes(arma)) {
          nuevaLista.push(arma);
        }
      }
    }

    setArmasGrupos(nuevosGrupos);
    setArmasLista(nuevaLista);
  };

  const alternarArmaIndividual = (arma: string) => {
    let nuevaLista = [...armasLista];
    if (nuevaLista.includes(arma)) {
      nuevaLista = nuevaLista.filter((a) => a !== arma);
    } else {
      nuevaLista.push(arma);
    }

    const nuevosGrupos = [...armasGrupos];
    for (const [grupo, armas] of [
      ["sencillas", TODAS_ARMAS_SENCILLAS],
      ["marciales", TODAS_ARMAS_MARCIALES],
      ["fuego", ARMAS_DE_FUEGO]
    ] as const) {
      const completo = armas.every((arma) => nuevaLista.includes(arma));
      const indice = nuevosGrupos.indexOf(grupo);
      if (completo && indice === -1) nuevosGrupos.push(grupo);
      else if (!completo && indice !== -1) nuevosGrupos.splice(indice, 1);
    }

    setArmasGrupos(nuevosGrupos);
    setArmasLista(nuevaLista);
  };

  const alternarGrupoArmaduras = (grupoId: "ligeras" | "medias" | "pesadas" | "escudos") => {
    const yaSeleccionado = armadurasGrupos.includes(grupoId);
    const nuevosGrupos = yaSeleccionado
      ? armadurasGrupos.filter((g) => g !== grupoId)
      : [...armadurasGrupos, grupoId];

    let nuevaLista = [...armadurasLista];
    let armadurasDelGrupo: readonly string[] = [];
    if (grupoId === "ligeras") armadurasDelGrupo = ARMADURAS_LIGERAS;
    else if (grupoId === "medias") armadurasDelGrupo = ARMADURAS_MEDIAS;
    else if (grupoId === "pesadas") armadurasDelGrupo = ARMADURAS_PESADAS;
    else if (grupoId === "escudos") armadurasDelGrupo = ESCUDOS;

    if (yaSeleccionado) {
      nuevaLista = nuevaLista.filter((a) => !armadurasDelGrupo.includes(a));
    } else {
      for (const arm of armadurasDelGrupo) {
        if (!nuevaLista.includes(arm)) {
          nuevaLista.push(arm);
        }
      }
    }

    setArmadurasGrupos(nuevosGrupos);
    setArmadurasLista(nuevaLista);
  };

  const alternarArmaduraIndividual = (armadura: string) => {
    let nuevaLista = [...armadurasLista];
    if (nuevaLista.includes(armadura)) {
      nuevaLista = nuevaLista.filter((a) => a !== armadura);
    } else {
      nuevaLista.push(armadura);
    }

    const nuevosGrupos = [...armadurasGrupos];
    for (const [grupo, armaduras] of [
      ["ligeras", ARMADURAS_LIGERAS],
      ["medias", ARMADURAS_MEDIAS],
      ["pesadas", ARMADURAS_PESADAS],
      ["escudos", ESCUDOS]
    ] as const) {
      const completo = armaduras.every((armadura) => nuevaLista.includes(armadura));
      const indice = nuevosGrupos.indexOf(grupo);
      if (completo && indice === -1) nuevosGrupos.push(grupo);
      else if (!completo && indice !== -1) nuevosGrupos.splice(indice, 1);
    }

    setArmadurasGrupos(nuevosGrupos);
    setArmadurasLista(nuevaLista);
  };

  const alternarIdioma = (idioma: string) => {
    setIdiomas((prev) =>
      prev.includes(idioma) ? prev.filter((i) => i !== idioma) : [...prev, idioma]
    );
  };

  const alternarHerramienta = (herramienta: string) => {
    setHerramientas((prev) => {
      const existe = prev.some((h) => sonHerramientasEquivalentes(h, herramienta));
      return existe
        ? prev.filter((h) => !sonHerramientasEquivalentes(h, herramienta))
        : [...prev, herramienta];
    });
  };

  const manejarGuardar = () => {
    const resumenArmas = formatearResumenCompetenciasArmas(armasGrupos, armasLista);
    const resumenArmaduras = formatearResumenCompetenciasArmaduras(
      armadurasGrupos,
      armadurasLista
    );
    const resumenIdiomas = idiomas.join(", ");
    const resumenHerramientas = herramientas.join(", ");

    alGuardar({
      competenciasArmasGrupos: armasGrupos,
      competenciasArmasLista: armasLista,
      competenciasArmas: resumenArmas,
      competenciasArmadurasGrupos: armadurasGrupos,
      competenciasArmadurasLista: armadurasLista,
      competenciasArmaduras: resumenArmaduras,
      idiomasLista: idiomas,
      idiomas: resumenIdiomas,
      herramientasLista: herramientas,
      herramientas: resumenHerramientas
    });
    alCerrar();
  };

  return {
    pestaña,
    setPestaña,
    filtroTexto,
    setFiltroTexto,
    armasGrupos,
    armasLista,
    armadurasGrupos,
    armadurasLista,
    idiomas,
    herramientas,
    alternarGrupoArmas,
    alternarArmaIndividual,
    alternarGrupoArmaduras,
    alternarArmaduraIndividual,
    alternarIdioma,
    alternarHerramienta,
    manejarGuardar
  };
};
