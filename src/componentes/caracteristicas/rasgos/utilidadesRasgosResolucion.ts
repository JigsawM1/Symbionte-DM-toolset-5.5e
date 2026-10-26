const NOMBRES_HABILIDADES: Record<string, string> = {
  fuerza: "Fuerza",
  destreza: "Destreza",
  constitucion: "Constitución",
  inteligencia: "Inteligencia",
  sabiduria: "Sabiduría",
  carisma: "Carisma"
};

export function separarTituloRasgo(nombreCompleto: string): { categoria: string; titulo: string } {
  const indice = nombreCompleto.indexOf(":");
  if (indice !== -1) {
    return {
      categoria: nombreCompleto.slice(0, indice).trim(),
      titulo: nombreCompleto.slice(indice + 1).trim()
    };
  }
  return { categoria: "Resolución asistida", titulo: nombreCompleto };
}

export function formatearHabilidad(clave: string): string {
  return NOMBRES_HABILIDADES[clave.toLowerCase()] ?? (clave.charAt(0).toUpperCase() + clave.slice(1));
}

export function resolverColorOpcion(o: { id: string; tipo?: string; tipoDano?: string }): string | undefined {
  if (o.id === "curacion" || o.tipo === "curacion") return "var(--pj-texto-exito)";
  if (o.tipoDano === "Radiante" || o.id === "radiante") return "var(--pj-texto-oro-brillante)";
  if (o.tipoDano === "Necrótico" || o.id === "necrotico") return "var(--pj-texto-magia)";
  if (o.tipo === "hp_temporal") return "var(--pj-texto-cian-claro)";
  return undefined;
}
