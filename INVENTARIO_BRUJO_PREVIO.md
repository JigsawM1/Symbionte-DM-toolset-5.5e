# Inventario previo del Brujo

Inspección del árbol limpio del 13-10-2026, antes de modificar los catálogos. Alcance: las cuatro subclases del PHB 2024. No se recibió una fuente adjunta.

Fuentes contrastadas: [reglas oficiales 2024](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes), [Archihadas](https://roll20.net/compendium/dnd5e/Subclasses%3AArchfey%20Patron?expansion=32231&iframe=true), [Celestial](https://roll20.net/compendium/dnd5e/Subclasses%3ACelestial%20Patron?expansion=32231&iframe=true), [Gran Primigenio](https://roll20.net/compendium/dnd5e/Subclasses%3AGreat%20Old%20One%20Patron?expansion=32231&iframe=true).

Carencias detectadas antes de ampliar contratos: recuperación de espacios de pacto al consumir un rasgo, recarga de un uso con pacto, gasto variable y destinatario de curación, filtro de conjuros de referencia, alcance de conjuro elegido y estado persistente de opciones consumibles. Arcano místico ya tiene un consumidor por nivel en la vista de conjuros: debe reutilizarse. Los efectos sobre objetivos y los eventos de impacto no tienen contexto suficiente.

Hallazgos del contraste entre los datos anteriores y sus consumidores, detallados en el informe final:

| Rasgos afectados | Estado anterior y necesidad concreta | Soporte que faltaba |
|---|---|---|
| Astucia / Maestro | Contador y descripción sin recuperación ejecutable; Maestro no modificaba la reserva de pacto | Operación atómica y propiedad fusionada en el padre |
| Arcanos 11/13/15/17 | Consumible y extensiones con contador compartido, frente al consumidor existente por nivel | Conectar selectores a reservas independientes, filtrar opciones y validar gasto |
| Invocaciones | La selección no construía todos los metadatos ni conservaba recursos propios de la opción | Rasgos hijos persistentes y requisitos compartidos entre UI/almacén/evaluadores |
| Agónica / Lanza | Reconocimiento particular y selección de referencia confundida con aprendizaje; alcance incorrecto | Selección explícita, filtro y efecto dirigido al conjuro; 30 pies por nivel de Brujo |
| Grimorio / Lecciones | Elecciones predeterminadas y opciones anidadas incompletas | Fuentes dinámicas completas, instancias independientes, activación y procedencia |
| Pacto del filo / Devorador | Aportaciones extendidas a todas las armas cuerpo a cuerpo | Vínculo real a una instancia; retirar daño inseguro mientras falta evento de impacto |
| Vigor / Profundidades | Vigor escalaba como espacio de pacto; el gratuito de Profundidades no tenía estado propio efectivo | 12 PG temporales fijos y reserva de lanzamiento independiente de la movilidad |
| Luz sanadora | Reserva indicada, pero gasto variable y receptor no llegaban al flujo de curación | Dados elegidos y receptor local, sin coste fijo ni autocuración del emisor |
| Defensas / Arrojar / Combatiente | Recuperación por descanso sin recarga adicional ejecutable con pacto | Recarga de un uso mediante un único espacio |
| Alma / Escudo / Resiliencia infernal | Efectos personalizados o no consumidos como resistencias | Efectos de resistencia con objetivo y tipo de daño interpretados |
| Resiliencia celestial | PG temporales sin evento de descanso/Astucia | Eventos propios declarados; aliados continúan manuales |
| Conjuros de subclase | Listas que mezclaban aportaciones anteriores y etiquetas distintas de las entradas reales | Progresiones PHB 2024 a 3/5/7/9 y retirada por procedencia |
| Mejora / Don | Constructor añadía decisiones automáticamente | Elección explícita nueva y conservación de las decisiones ya guardadas |

No se intentó representar ventajas contra blancos concretos, telepatía, sentidos del tablero o efectos de impacto mediante condiciones ficticias. Sus límites se identifican por rasgo en [IMPLEMENTACION_BRUJO.md](IMPLEMENTACION_BRUJO.md).

| Rasgo | Nivel | Origen | Regla y fuente | Estado previo | Cambio necesario | Soporte o limitación |
|---|---:|---|---|---|---|---|
| Invocaciones sobrenaturales | 1 | Brujo | PHB 2024, Brujo | selector_informativo; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Magia del pacto | 1 | Brujo | PHB 2024, Brujo | pasivo_permanente; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Astucia mágica | 2 | Brujo | PHB 2024, Brujo | consumible; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Subclase de brujo | 3 | Brujo | PHB 2024, Brujo | pasivo_permanente; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Mejora de característica | 4 | Brujo | PHB 2024, Brujo | selector_informativo; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Rasgo de subclase | 6 | Brujo | PHB 2024, Brujo | pasivo_permanente; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Mejora de característica | 8 | Brujo | PHB 2024, Brujo | selector_informativo; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Contactar con el patrón | 9 | Brujo | PHB 2024, Brujo | consumible; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Rasgo de subclase | 10 | Brujo | PHB 2024, Brujo | pasivo_permanente; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Arcano místico | 11 | Brujo | PHB 2024, Brujo | consumible; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Mejora de característica | 12 | Brujo | PHB 2024, Brujo | selector_informativo; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Arcano místico II | 13 | Brujo | PHB 2024, Brujo | extension; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Rasgo de subclase | 14 | Brujo | PHB 2024, Brujo | pasivo_permanente; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Arcano místico III | 15 | Brujo | PHB 2024, Brujo | extension; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Mejora de característica | 16 | Brujo | PHB 2024, Brujo | selector_informativo; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Arcano místico IV | 17 | Brujo | PHB 2024, Brujo | extension; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Don épico | 19 | Brujo | PHB 2024, Brujo | selector_informativo; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Maestro sobrenatural | 20 | Brujo | PHB 2024, Brujo | extension; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Conjuros de archihada | 3 | Patrón de los Archihadas | PHB 2024, Brujo | pasivo_permanente; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Pasos feéricos | 3 | Patrón de los Archihadas | PHB 2024, Brujo | consumible; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Escapada brumosa | 6 | Patrón de los Archihadas | PHB 2024, Brujo | consumible; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Defensas fascinantes | 10 | Patrón de los Archihadas | PHB 2024, Brujo | consumible; inmunidad_condicion | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Magia embrujadora | 14 | Patrón de los Archihadas | PHB 2024, Brujo | pasivo_permanente; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Conjuros celestiales | 3 | Patrón Celestial | PHB 2024, Brujo | pasivo_permanente; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Luz sanadora | 3 | Patrón Celestial | PHB 2024, Brujo | curacion; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Alma radiante | 6 | Patrón Celestial | PHB 2024, Brujo | pasivo_permanente; personalizado | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Resiliencia celestial | 10 | Patrón Celestial | PHB 2024, Brujo | pasivo_permanente; hp_temporal | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Venganza abrasadora | 14 | Patrón Celestial | PHB 2024, Brujo | consumible; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Conjuros infernales | 3 | Patrón Infernal | PHB 2024, Brujo | pasivo_permanente; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Bendición del Oscuro | 3 | Patrón Infernal | PHB 2024, Brujo | pasivo_permanente; hp_temporal | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Propia suerte del Oscuro | 6 | Patrón Infernal | PHB 2024, Brujo | consumible; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Resiliencia infernal | 10 | Patrón Infernal | PHB 2024, Brujo | selector_informativo; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Arrojar al Infierno | 14 | Patrón Infernal | PHB 2024, Brujo | consumible; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Conjuros del Gran Primigenio | 3 | Patrón del Gran Primigenio | PHB 2024, Brujo | pasivo_permanente; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Mente despierta | 3 | Patrón del Gran Primigenio | PHB 2024, Brujo | pasivo_permanente; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Conjuros psíquicos | 3 | Patrón del Gran Primigenio | PHB 2024, Brujo | pasivo_permanente; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Combatiente clarividente | 6 | Patrón del Gran Primigenio | PHB 2024, Brujo | consumible; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Maldición sobrenatural | 10 | Patrón del Gran Primigenio | PHB 2024, Brujo | pasivo_permanente; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Escudo de pensamientos | 10 | Patrón del Gran Primigenio | PHB 2024, Brujo | pasivo_permanente; personalizado | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Crear esclavo | 14 | Patrón del Gran Primigenio | PHB 2024, Brujo | pasivo_permanente; sin efectos | Contrastar progresión y consumidor; ver informe final | Contratos y consumidores inspeccionados |
| Armadura de sombras | 1 | Invocaciones sobrenaturales | PHB 2024, opciones de invocación | pasivo_permanente | Validar requisitos, elecciones y aportaciones | Proyección de opciones y recursos incompleta |
| Mente sobrenatural | 1 | Invocaciones sobrenaturales | PHB 2024, opciones de invocación | pasivo_permanente | Validar requisitos, elecciones y aportaciones | Proyección de opciones y recursos incompleta |
| Pacto de la cadena | 1 | Invocaciones sobrenaturales | PHB 2024, opciones de invocación | pasivo_permanente | Validar requisitos, elecciones y aportaciones | Proyección de opciones y recursos incompleta |
| Pacto del filo | 1 | Invocaciones sobrenaturales | PHB 2024, opciones de invocación | selector_informativo | Validar requisitos, elecciones y aportaciones | Proyección de opciones y recursos incompleta |
| Pacto del grimorio | 1 | Invocaciones sobrenaturales | PHB 2024, opciones de invocación | pasivo_permanente | Validar requisitos, elecciones y aportaciones | Proyección de opciones y recursos incompleta |
| Descarga agónica | 2 | Invocaciones sobrenaturales | PHB 2024, opciones de invocación | selector_informativo | Validar requisitos, elecciones y aportaciones | Proyección de opciones y recursos incompleta |
| Descarga ahuyentadora | 2 | Invocaciones sobrenaturales | PHB 2024, opciones de invocación | selector_informativo | Validar requisitos, elecciones y aportaciones | Proyección de opciones y recursos incompleta |
| Lanza sobrenatural | 2 | Invocaciones sobrenaturales | PHB 2024, opciones de invocación | selector_informativo | Validar requisitos, elecciones y aportaciones | Proyección de opciones y recursos incompleta |
| Lecciones de los Primeros | 2 | Invocaciones sobrenaturales | PHB 2024, opciones de invocación | selector_informativo | Validar requisitos, elecciones y aportaciones | Proyección de opciones y recursos incompleta |
| Máscara de los mil rostros | 2 | Invocaciones sobrenaturales | PHB 2024, opciones de invocación | pasivo_permanente | Validar requisitos, elecciones y aportaciones | Proyección de opciones y recursos incompleta |
| Salto sobrenatural | 2 | Invocaciones sobrenaturales | PHB 2024, opciones de invocación | pasivo_permanente | Validar requisitos, elecciones y aportaciones | Proyección de opciones y recursos incompleta |
| Vigor infernal | 2 | Invocaciones sobrenaturales | PHB 2024, opciones de invocación | pasivo_permanente | Validar requisitos, elecciones y aportaciones | Proyección de opciones y recursos incompleta |
| Visiones brumosas | 2 | Invocaciones sobrenaturales | PHB 2024, opciones de invocación | pasivo_permanente | Validar requisitos, elecciones y aportaciones | Proyección de opciones y recursos incompleta |
| Vista del diablo | 2 | Invocaciones sobrenaturales | PHB 2024, opciones de invocación | pasivo_permanente | Validar requisitos, elecciones y aportaciones | Proyección de opciones y recursos incompleta |
| Castigo arcano | 5 | Invocaciones sobrenaturales | PHB 2024, opciones de invocación | consumible | Validar requisitos, elecciones y aportaciones | Proyección de opciones y recursos incompleta |
| Don de las profundidades | 5 | Invocaciones sobrenaturales | PHB 2024, opciones de invocación | pasivo_permanente | Validar requisitos, elecciones y aportaciones | Proyección de opciones y recursos incompleta |
| Filo sediento | 5 | Invocaciones sobrenaturales | PHB 2024, opciones de invocación | pasivo_permanente | Validar requisitos, elecciones y aportaciones | Proyección de opciones y recursos incompleta |
| Inversión del amo de las cadenas | 5 | Invocaciones sobrenaturales | PHB 2024, opciones de invocación | pasivo_permanente | Validar requisitos, elecciones y aportaciones | Proyección de opciones y recursos incompleta |
| Maestro de las formas innumerables | 5 | Invocaciones sobrenaturales | PHB 2024, opciones de invocación | pasivo_permanente | Validar requisitos, elecciones y aportaciones | Proyección de opciones y recursos incompleta |
| Mirada de las dos mentes | 5 | Invocaciones sobrenaturales | PHB 2024, opciones de invocación | pasivo_permanente | Validar requisitos, elecciones y aportaciones | Proyección de opciones y recursos incompleta |
| Paso ascendente | 5 | Invocaciones sobrenaturales | PHB 2024, opciones de invocación | pasivo_permanente | Validar requisitos, elecciones y aportaciones | Proyección de opciones y recursos incompleta |
| Uno con las sombras | 5 | Invocaciones sobrenaturales | PHB 2024, opciones de invocación | pasivo_permanente | Validar requisitos, elecciones y aportaciones | Proyección de opciones y recursos incompleta |
| Susurros del sepulcro | 7 | Invocaciones sobrenaturales | PHB 2024, opciones de invocación | pasivo_permanente | Validar requisitos, elecciones y aportaciones | Proyección de opciones y recursos incompleta |
| Devorador de vida | 9 | Invocaciones sobrenaturales | PHB 2024, opciones de invocación | pasivo_permanente | Validar requisitos, elecciones y aportaciones | Proyección de opciones y recursos incompleta |
| Don de los protectores | 9 | Invocaciones sobrenaturales | PHB 2024, opciones de invocación | consumible | Validar requisitos, elecciones y aportaciones | Proyección de opciones y recursos incompleta |
| Visiones de reinos remotos | 9 | Invocaciones sobrenaturales | PHB 2024, opciones de invocación | pasivo_permanente | Validar requisitos, elecciones y aportaciones | Proyección de opciones y recursos incompleta |
| Hoja devoradora | 12 | Invocaciones sobrenaturales | PHB 2024, opciones de invocación | pasivo_permanente | Validar requisitos, elecciones y aportaciones | Proyección de opciones y recursos incompleta |
| Visión bruja | 15 | Invocaciones sobrenaturales | PHB 2024, opciones de invocación | pasivo_permanente | Validar requisitos, elecciones y aportaciones | Proyección de opciones y recursos incompleta |
