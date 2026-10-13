# Migración de campos numéricos universales

Implementación local para DM y jugadores. No cambia el formato de fichas ni el protocolo de sincronización.

## Contrato

- Números directos y expresiones con suma, resta, multiplicación, división, signos y paréntesis. Precedencia matemática habitual.
- `+5` y `-5` ajustan el último valor confirmado; `=-5` asigna un negativo. Se interpreta toda la expresión relativa, incluyendo `+10+5`.
- Vacío obligatorio recupera el valor confirmado; opcional ejecuta el adaptador de limpieza del destino.
- Enter/blur confirman una vez; Escape descarta; flechas usan el paso sin cuantizar resultados.
- Enter no envía implícitamente un formulario; los atajos explícitos de daño y gasto se conservan. Vacío o cero no ejecutan acciones.
- Enteros usan Math.round. Decimales admiten punto o coma y notación científica finita para conservar resultados pequeños/grandes. No hay separadores de miles.
- Resultados fuera de rango se ajustan al límite. Entradas inválidas no modifican datos y bloquean guardado/acciones.
- Cambios externos conservan borradores y rebasan incrementos sobre el valor reciente. Cambiar destino descarta el borrador.

## Arquitectura

Evaluador puro en utiles; hook y componente sin estilos de campo en comunes. FormularioNumerico confirma los borradores y consulta el manejador actualizado antes de construir el envío. BotonNumerico protege acciones que consumen cantidades. Los formularios y almacenes reciben números o la representación opcional original, nunca operaciones incompletas.

Se conservan etiquetas, clases CSS, foco, referencias y botones existentes. Los errores tienen validación nativa, aria-invalid, descripción accesible y texto de ayuda. El contador de monedas mantiene su API como adaptador del evaluador común.

## Cobertura

81 declaraciones de CampoNumerico en 36 archivos: las 73 casillas numéricas iniciales, el campo de monedas repetido para las cinco divisas y siete campos que antes eran de texto (base/override, tres bonificadores de ataque, desafío y bono plano de CA). Las listas generan instancias adicionales para atributos, habilidades, clases y niveles de conjuro.

Las fórmulas persistentes de dados/rasgos, velocidades con unidades, límites con palabras y valores mixtos como `Ventaja` conservan sus editores. Los selectores de opciones numéricas permanecen selectores.

| Archivo | Campo/valor | Tipo | Mínimo | Máximo | Vacío | Destino de confirmación |
|---|---|---|---|---|---|---|
| caracteristicas/homebrew/subcomponentes/SeccionAtributos.tsx | valorCaract | entero | 0 | 30 | Recuperar valor | (valor) => actualizarCaracteristica(clave, valor) |
| caracteristicas/homebrew/subcomponentes/SeccionAtributos.tsx | valorSalvacion | entero | — | — | () => actualizarSalvacion(clave, "") | (valor) => actualizarSalvacion(clave, String(valor)) |
| caracteristicas/homebrew/subcomponentes/SeccionGeneral.tsx | monstruoForm.ca | entero | 1 | — | Recuperar valor | (valor) => actualizarGeneral("ca", valor) |
| caracteristicas/homebrew/subcomponentes/SeccionGeneral.tsx | monstruoForm.vidaMaxima | entero | 1 | — | Recuperar valor | (valor) => actualizarGeneral("vidaMaxima", valor) |
| caracteristicas/homebrew/subcomponentes/SeccionGeneral.tsx | monstruoForm.iniciativaBonificador \|\| 0 | entero | — | — | Recuperar valor | (valor) => actualizarGeneral("iniciativaBonificador", valor) |
| caracteristicas/homebrew/subcomponentes/SeccionGeneral.tsx | monstruoForm.desafio \|\| "" | decimal | 0 | — | () => actualizarGeneral("desafio", "") | (valor) => actualizarGeneral("desafio", ( 0.125: "1/8", 0.25: "1/4", 0.5: "1/2" as Record<number, string>)[valor] ?? String(valor)) |
| caracteristicas/homebrew/subcomponentes/SeccionHabilidades.tsx | valorHabilidad | entero | — | — | () => actualizarHabilidad(clave, "") | (valor) => actualizarHabilidad(clave, String(valor)) |
| caracteristicas/homebrew/subcomponentes/SeccionListasAtaques.tsx | tQBono | entero | — | — | () => setTQBono("") | (valor) => setTQBono(valor >= 0 ? `+$valor` : String(valor)) |
| caracteristicas/homebrew/subcomponentes/SeccionListasAtaques.tsx | tAccionBono | entero | — | — | () => setTAccionBono("") | (valor) => setTAccionBono(valor >= 0 ? `+$valor` : String(valor)) |
| caracteristicas/homebrew/subcomponentes/SeccionListasAtaques.tsx | tAccionAdicionalBono | entero | — | — | () => setTAccionAdicionalBono("") | (valor) => setTAccionAdicionalBono(valor >= 0 ? `+$valor` : String(valor)) |
| caracteristicas/homebrew/subcomponentesObjeto/SeccionArma.tsx | oAlcanceNormal | entero | 0 | — | () => setOAlcanceNormal("") | setOAlcanceNormal |
| caracteristicas/homebrew/subcomponentesObjeto/SeccionArma.tsx | oAlcanceLargo | entero | 0 | — | () => setOAlcanceLargo("") | setOAlcanceLargo |
| caracteristicas/homebrew/subcomponentesObjeto/SeccionArmadura.tsx | oCaBase | entero | 1 | — | Recuperar valor | setOCaBase |
| caracteristicas/homebrew/subcomponentesObjeto/SeccionArmadura.tsx | oRequisitoFuerza | entero | 0 | — | () => setORequisitoFuerza("") | setORequisitoFuerza |
| caracteristicas/homebrew/subcomponentesObjeto/SeccionDatosGenerales.tsx | oPesoLb | decimal | 0 | — | Recuperar valor | setOPesoLb |
| caracteristicas/homebrew/subcomponentesObjeto/SeccionDatosGenerales.tsx | oCostoCantidad | decimal | "0" | — | Recuperar valor | setOCostoCantidad |
| caracteristicas/homebrew/subcomponentesObjeto/SeccionDatosGenerales.tsx | oQuantity | entero | "1" | — | () => setOQuantity("") | setOQuantity |
| caracteristicas/homebrew/subcomponentesObjeto/SeccionDatosGenerales.tsx | oPesoUnitario | decimal | "0" | — | () => setOPesoUnitario("") | setOPesoUnitario |
| caracteristicas/homebrew/subcomponentesObjeto/SeccionEfectosPasivos.tsx | oCargas | entero | "0" | — | () => setOCargas("") | setOCargas |
| caracteristicas/homebrew/subcomponentesObjeto/SeccionEfectosPasivos.tsx | oModificadorAtaqueDano | entero | -5 | 10 | () => setOModificadorAtaqueDano("") | setOModificadorAtaqueDano |
| caracteristicas/homebrew/subcomponentesObjeto/SeccionEfectosPasivos.tsx | oNuevoHechizoCd | entero | 0 | — | () => setONuevoHechizoCd("") | setONuevoHechizoCd |
| caracteristicas/homebrew/subcomponentesObjeto/SeccionEfectosPasivos.tsx | oNuevoHechizoBonoAtaque | entero | — | — | () => setONuevoHechizoBonoAtaque("") | setONuevoHechizoBonoAtaque |
| caracteristicas/homebrew/subcomponentesObjeto/SeccionEfectosPasivos.tsx | oNuevoHechizoCosteCargas | entero | 0 | — | () => setONuevoHechizoCosteCargas("") | setONuevoHechizoCosteCargas |
| caracteristicas/homebrew/subcomponentesObjeto/SeccionEquipoContenedor.tsx | oCantidad | entero | 1 | — | () => setOCantidad("") | setOCantidad |
| caracteristicas/homebrew/subcomponentesObjeto/SeccionEquipoContenedor.tsx | nuevoContenidoQty | entero | "1" | — | Recuperar valor | setNuevoContenidoQty |
| caracteristicas/homebrew/subcomponentesObjeto/SeccionEscudo.tsx | oCaEscudo | entero | 1 | — | Recuperar valor | setOCaEscudo |
| caracteristicas/iniciativa/SelectorCondiciones.tsx | cantidadDaño | entero | "0" | — | () => setCantidadDaño("") | (valor) => setCantidadDaño(String(valor)) |
| caracteristicas/iniciativa/SelectorCondiciones.tsx | cdSalvacion | entero | "1" | — | () => setCdSalvacion("") | (valor) => setCdSalvacion(String(valor)) |
| caracteristicas/iniciativa/TarjetaCriaturaIniciativa.tsx | criatura.iniciativa | entero | — | — | Recuperar valor | onEstablecerIniciativa |
| caracteristicas/iniciativa/TarjetaCriaturaIniciativa.tsx | criatura.vidaMaxima | entero | "1" | — | Recuperar valor | (valor) => onEstablecerVidaMaxima?.(valor) |
| caracteristicas/iniciativa/TarjetaCriaturaIniciativa.tsx | hpInput | entero | "0" | — | () => setHpInput("") | (valor) => setHpInput(String(valor)) |
| caracteristicas/iniciativa/TarjetaCriaturaIniciativa.tsx | criatura.vidaTemporal ?? 0 | entero | "0" | — | Recuperar valor | onCambiarTempHP |
| caracteristicas/inventario/BarraMetricasInventario.tsx | valorActual | entero | 0 | — | Recuperar valor | (valor) => alGuardar(clave, valor) |
| caracteristicas/inventario/ModalAgregarObjeto.tsx | cantidadCompendio | entero | "1" | — | Recuperar valor | setCantidadCompendio |
| caracteristicas/inventario/ModalAgregarObjeto.tsx | cantidadPosesion | entero | "1" | — | Recuperar valor | setCantidadPosesion |
| caracteristicas/inventario/ModalAgregarObjeto.tsx | pesoPosesion | decimal | "0" | — | Recuperar valor | (valor) => setPesoPosesion(String(valor)) |
| caracteristicas/personajes/acompanantes/SeccionAcompanantesPersonaje.tsx | estadoVelocidad.movimientoRestante | decimal | "0" | estadoVelocidad.velocidadTotal * 2 | Recuperar valor | (valor) => modificarMovimientoRestanteManualAcompanante(personajeId, acomp.id, valor) |
| caracteristicas/personajes/caracteristica/EditorPuntuacionYOverride.tsx | valorBaseForm | entero | 1 | 30 | Recuperar valor | (valor) => setValorBaseForm(String(valor)) |
| caracteristicas/personajes/caracteristica/EditorPuntuacionYOverride.tsx | overrideForm | entero | 1 | 30 | () => setOverrideForm("") | (valor) => setOverrideForm(String(valor)) |
| caracteristicas/personajes/caracteristica/PestanaPersonalizarCaracteristica.tsx | modExtraForm | entero | — | — | () => setModExtraForm("") | (valor) => setModExtraForm(String(valor)) |
| caracteristicas/personajes/caracteristica/PestanaPersonalizarCaracteristica.tsx | bonoSalvacionExtraForm | entero | — | — | () => setBonoSalvacionExtraForm("") | (valor) => setBonoSalvacionExtraForm(String(valor)) |
| caracteristicas/personajes/configuracion/PestanaIdentidad.tsx | form.nivel | entero | "1" | "20" | Recuperar valor | (valor) => alCambiarNivelTotal(String(valor)) |
| caracteristicas/personajes/configuracion/PestanaIdentidad.tsx | form.experiencia | entero | "0" | — | Recuperar valor | (valor) => alCambiarExperiencia(String(valor)) |
| caracteristicas/personajes/configuracion/PestanaMagia.tsx | claseItem.nivel | entero | 1 | 20 | Recuperar valor | (valor) => alActualizarClaseLanzadora(idx, "nivel", valor) |
| caracteristicas/personajes/configuracion/PestanaMagia.tsx | valActual | entero | 0 | 10 | () => alActualizarOverrideEspacios(nv, undefined) | (valor) => alActualizarOverrideEspacios(nv, valor) |
| caracteristicas/personajes/configuracion/PestanaSentidosSalud.tsx | form.hpMaximoBase \|\| 10 | entero | "1" | — | Recuperar valor | alActualizarHPMaximoBase |
| caracteristicas/personajes/configuracion/PestanaSentidosSalud.tsx | form.ca | entero | "1" | — | Recuperar valor | (valor) => alActualizarCampo("ca", valor) |
| caracteristicas/personajes/configuracion/PestanaSentidosSalud.tsx | form.iniciativaBono | entero | — | — | Recuperar valor | (valor) => alActualizarCampo("iniciativaBono", valor) |
| caracteristicas/personajes/configuracion/SeccionMulticlase.tsx | claseItem.nivel | entero | "1" | maxNivelClase | Recuperar valor | (valor) => alCambiarClaseNivel(index, String(valor)) |
| caracteristicas/personajes/MetricasRapidasPersonaje.tsx | estadoVelocidad.movimientoRestante | decimal | "0" | estadoVelocidad.velocidadTotal * 2 | Recuperar valor | ejecutarModificarRestante |
| caracteristicas/personajes/ModalDetalleHabilidad.tsx | modExtraForm | entero | — | — | () => setModExtraForm("") | (valor) => setModExtraForm(String(valor)) |
| caracteristicas/personajes/ModalDetalleHabilidad.tsx | valorFijoForm | entero | — | — | () => setValorFijoForm("") | (valor) => setValorFijoForm(String(valor)) |
| caracteristicas/personajes/ModalEditarPersonaje.tsx | form.nivel | entero | "1" | "20" | Recuperar valor | (valor) => manejarCambioNivel(String(valor)) |
| caracteristicas/personajes/ModalEditarPersonaje.tsx | form.experiencia | entero | "0" | — | Recuperar valor | (valor) => actualizarCampo("experiencia", valor) |
| caracteristicas/personajes/ModalEditarPersonaje.tsx | valorBase | entero | "1" | "30" | Recuperar valor | (valor) => actualizarCaracteristicaBase(carac, valor) |
| caracteristicas/personajes/ModalEditarPersonaje.tsx | override !== null && override !== undefined ? override : "" | entero | "1" | "30" | () => actualizarOverrideFijo(carac, null) | (valor) => actualizarOverrideFijo(carac, valor) |
| caracteristicas/personajes/ModalEditarPersonaje.tsx | form.hpMaximoBase \|\| 10 | entero | "1" | — | Recuperar valor | (valor) => setForm(prev => ( ...prev, hpMaximoBase: valor, hpMaximo: valor, hpActual: Math.min(prev.hpActual, valor) )) |
| caracteristicas/personajes/ModalEditarPersonaje.tsx | form.ca | entero | "1" | — | Recuperar valor | (valor) => actualizarCampo("ca", valor) |
| caracteristicas/personajes/ModalEditarPersonaje.tsx | form.iniciativaBono | entero | — | — | Recuperar valor | (valor) => actualizarCampo("iniciativaBono", valor) |
| caracteristicas/personajes/PanelAtributosPersonaje.tsx | valorMostrar | entero | 1 | 30 | Recuperar valor | (valor) => alModificarCaracteristicaBase(carac, valor) |
| caracteristicas/personajes/PanelVitalidadPersonaje.tsx | valorDeltaHp | entero | "0" | — | () => setValorDeltaHp("") | (valor) => setValorDeltaHp(String(valor)) |
| caracteristicas/personajes/PanelVitalidadPersonaje.tsx | personaje.hpActual | entero | 0 | personaje.hpMaximo | Recuperar valor | alEstablecerHPActual |
| caracteristicas/personajes/PanelVitalidadPersonaje.tsx | personaje.hpMaximo | entero | 1 | — | Recuperar valor | alModificarHPMaximoEfectivo |
| caracteristicas/personajes/PanelVitalidadPersonaje.tsx | personaje.hpTemporal ?? 0 | entero | "0" | — | Recuperar valor | (valor) => alModificarHPTemporal(valor) |
| caracteristicas/personajes/PanelVitalidadPersonaje.tsx | personaje.dadosGolpeRestantes | entero | "0" | personaje.dadosGolpeTotal | Recuperar valor | (valor) => alEstablecerDadosGolpeRestantes?.(valor) |
| caracteristicas/personajes/TrackerPuntosConjuro.tsx | puntosPersonalizados | entero | 0 | puntosMaximos | () => setPuntosPersonalizados("") | (valor) => setPuntosPersonalizados(String(valor)) |
| caracteristicas/rasgos/constructor/ActivacionConstructor.tsx | duracionEfectoAlActivar ?? "" | entero | 1 | — | () => actualizarBorrador("duracionEfectoAlActivar", undefined) | (valor) => actualizarBorrador("duracionEfectoAlActivar", valor) |
| caracteristicas/rasgos/constructor/ActivacionConstructor.tsx | cantidadRestaurarFija | entero | 1 | — | Recuperar valor | (valor) => actualizarBorrador("cantidadRestaurarFija", valor) |
| caracteristicas/rasgos/constructor/CamposEstadisticas.tsx | nuevoValor | entero | — | — | Recuperar valor | (valor) => setNuevoValor(String(valor)) |
| caracteristicas/rasgos/constructor/CamposEstadisticas.tsx | nuevoValor | entero | — | — | Recuperar valor | (valor) => setNuevoValor(String(valor)) |
| caracteristicas/rasgos/constructor/CamposEstadisticas.tsx | nuevoLimiteMaximo | entero | 20 | 30 | Recuperar valor | setNuevoLimiteMaximo |
| caracteristicas/rasgos/constructor/CamposEstadisticas.tsx | nuevoValor | entero | 5 | — | Recuperar valor | (valor) => setNuevoValor(String(valor)) |
| caracteristicas/rasgos/constructor/CamposEstadisticas.tsx | nuevoValor | decimal | "0.5" | — | Recuperar valor | (valor) => setNuevoValor(String(valor)) |
| caracteristicas/rasgos/constructor/IdentidadConstructor.tsx | nivelRequerido ?? "" | entero | 1 | 20 | () => actualizarBorrador("nivelRequerido", undefined) | (valor) => actualizarBorrador("nivelRequerido", valor) |
| caracteristicas/rasgos/constructor/RecursosConstructor.tsx | Number.isNaN(usosMaximos) ? "" : usosMaximos | entero | 1 | — | Recuperar valor | (valor) => actualizarBorrador("usosMaximos", valor); if (usosRestantes > valor) actualizarBorrador("usosRestantes", valor); |
| caracteristicas/rasgos/constructor/RecursosConstructor.tsx | Number.isNaN(usosRestantes) ? "" : usosRestantes | entero | 0 | usosMaximos | Recuperar valor | (valor) => actualizarBorrador("usosRestantes", valor) |
| caracteristicas/rasgos/constructor/SelectoresConstructor.tsx | nuevoSelectorMax | entero | 1 | — | Recuperar valor | setNuevoSelectorMax |
| caracteristicas/tablas/CalculadoraSalto.tsx | puntuacionFuerza | entero | 1 | 30 | Recuperar valor | setPuntuacionFuerza |
| caracteristicas/tablas/CalculadoraViaje.tsx | horasViaje | entero | 1 | 24 | Recuperar valor | setHorasViaje |
| caracteristicas/tablas/ConversorDivisas.tsx | cantidadDivisa | decimal | 0 | — | Recuperar valor | setCantidadDivisa |
| layout/PanelDados.tsx | modificador | entero | — | — | Recuperar valor | setModificador |

## Verificación

- pnpm run ci: salida 0; 129 suites y 1.784 pruebas, TypeScript, ESLint, límite de líneas y build correctos. Se conserva el aviso de chunks mayores de 500 kB. Log: scratch/ci-campos-numericos.log.
- pnpm run test:campos-numericos: salida 0; 35 regresiones independientes y 36 combinaciones dimensionales (9 vistas, ambos temas, 599/433 px). Incluye casos de edición, sincronización simulada, bloqueos, formularios sin blur, acciones, límites dependientes y tipos de datos al guardar.
- pnpm run test:tema-jugador: salida 0; las 22 regresiones visuales existentes pasan, sin errores JavaScript.
- Auditoría de fuentes: cero inputs type=number y cero lecturas de valueAsNumber en componentes; 81 declaraciones inventariadas. git diff --check sin incidencias.

Resultados de navegador: scratch/resultados-campos-numericos.json; inventario estructurado: scratch/cobertura-campos-numericos.json. Las comprobaciones dimensionales comparan los mismos campos con un input nativo y no constituyen una certificación visual integral. La simulación de actualizaciones externas y Chromium local no certifican CEF ni una sesión multicliente de TaleSpire. No se desplegó.
