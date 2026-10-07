# Sistema de Diseño Visual — Hoja de Personaje y Vista de Jugador
*Guía de estilo, arquitectura visual y tokens de las vistas de jugador en ToolSet D&D 5.5e (TaleSpire Symbiote).*

---

## 1. Alcance e Identidad Visual del Jugador

### A. Ámbito de Esta Guía

Este documento comprende **solo el estilo de los jugadores (Player UI)**. La referencia para las herramientas del Master es [DESIGN_MASTER.md](DESIGN_MASTER.md).

- **Identidad visual**: Dark Fantasy Zafiro/Índigo Táctico de alta densidad, con superficies oscuras superpuestas, bordes pizarra, acentos índigo y azul, y sombras estáticas discretas.
- **Fuente de tokens**: `src/estilos/temaJugador.css`, con el prefijo `--pj-*`. Los CSS Modules de cada vista definen su composición y variantes locales.
- **Ámbito**: hoja y características del personaje, acciones y ataques, magia y conjuros, rasgos y dotes, inventario e iniciativa de jugador, incluidos sus paneles y modales.
- **Referencia de composición**: `HojaPersonaje.module.css` combina tarjetas elevadas, campos hundidos y radios de `6px`–`8px`; la hoja se centra con un ancho máximo de `640px`.

El compendio de jugador usa `CompendioConjurosJugador`; sus estilos se rigen por esta guía. Las notas personales y otros componentes reutilizados pueden conservar estilos compartidos: una variante de jugador debe aplicarse localmente, sin redefinir en `:root` los tokens generales de la aplicación. La configuración del personaje pertenece a esta guía; las herramientas de configuración global tienen su referencia en `DESIGN_MASTER.md`.

### B. Principios Fundamentales de la Vista de Jugador
1. **Densidad Táctica y Funcional**:
   - Cada píxel optimizado para acceso instantáneo a modificadores, recursos y tiradas de dados 3D en TaleSpire sin desplazamientos innecesarios.
2. **Entorno TaleSpire (Off-Screen Rendering / CEF)**:
   - **Prohibición Total de Animaciones CSS**: Cero transiciones y cero keyframes (`transition: none !important; animation: none !important;`). Los estados visuales cambian inmediatamente; esta regla no garantiza una latencia total de 0 ms en Chromium Embedded Framework.
   - **Prohibición de Selectores Nativos**: Uso exclusivo de componentes controlados (`<SelectorDesplegable />` o `<SelectorSugerencias />`).
3. **Tipografía Nítida y Accesible**:
   - Tamaño mínimo absoluto de **11px** para evitar pérdida de nitidez en resoluciones escaladas de TaleSpire.
   - Verificar el contraste de los textos sobre sus fondos reales, incluidos estados activos y deshabilitados; la paleta por sí sola no garantiza accesibilidad.
4. **Iconografía SVG Exclusiva**:
   - Iconos locales limpios vía `lucide-react`. Prohibición absoluta de emojis en toda la interfaz.

---

## 2. Tokens Globales de Jugador (`--pj-*`)

Los valores corresponden a `src/estilos/temaJugador.css`. Cada variante tiene su propio token: no tratar varios colores como valores intercambiables de una misma variable.

| Token CSS | Valor Hex / HSL | Propósito / Elementos |
| :--- | :--- | :--- |
| `--pj-fondo-base` | `#070a10` | Fondo general de la vista de jugador |
| `--pj-fondo-panel` | `#0d121c` | Contenedores y paneles secundarios |
| `--pj-fondo-tarjeta` | `#121722` | Tarjetas de atributos, habilidades, ataques |
| `--pj-fondo-tarjeta-elevada` | `#161e2c` | Bloques elevados y métricas destacadas |
| `--pj-fondo-tarjeta-hover` | `#1b2434` | Estado hover en tarjetas tácticas |
| `--pj-fondo-hundido` | `#080c14` | Inputs numéricos, desgloses matemáticos |
| `--pj-fondo-hundido-profundo` | `#05080e` | Superficies hundidas de mayor profundidad |
| `--pj-fondo-cabecera-gradiente` | `linear-gradient(180deg, #161e2c 0%, #111622 100%)` | Cabeceras de panel |
| `--pj-fondo-modal-overlay` | `rgba(0, 0, 0, 0.85)` | Fondo de superposición de modal |
| `--pj-fondo-modal-cuerpo` | `#0b0f16` | Cuerpo de modal |
| `--pj-fondo-modal-cabecera` | `#141a26` | Cabecera de modal |
| `--pj-borde-sutil` | `rgba(148, 163, 184, 0.16)` | Delimitadores de rejilla y separadores |
| `--pj-borde-medio` | `rgba(148, 163, 184, 0.26)` | Bordes de tarjeta estándar |
| `--pj-borde-acento-fuerte` | `#818cf8` | Foco activo, bordes destacados de héroe |
| `--pj-texto-primario` | `#ffffff` | Nombres de personaje, números principales |
| `--pj-texto-primario-suave` | `#f8fafc` | Texto principal suavizado |
| `--pj-texto-secundario` | `#cbd5e1` | Modificadores, descripciones, notas |
| `--pj-texto-secundario-claro` | `#e2e8f0` | Datos secundarios destacados |
| `--pj-texto-terciario` | `#94a3b8` | Fórmulas y metadatos |
| `--pj-texto-label` | `#a0aec0` | Etiquetas de datos |
| `--pj-texto-acento` | `#a5b4fc` | Modificadores positivos, títulos tácticos |
| `--pj-texto-cian` | `#38bdf8` | D&D Blue, pericias, valores destacados |
| `--pj-texto-alerta` | `#fca5a5` | Daño recibido, salvaciones fallidas |
| `--pj-texto-exito` | `#6ee7b7` | Curaciones, ventajas, miniaturas vinculadas |
| `--pj-texto-oro` | `#fde047` | Monedas, subclase, inspiraciones activas |
| `--pj-texto-magia` | `#d8b4fe` | Recursos y efectos mágicos |

Para acciones, usar las familias `--pj-acento-primario*`, `--pj-acento-cian*`, `--pj-acento-peligro*`, `--pj-acento-exito*`, `--pj-acento-oro*` y `--pj-acento-magia*`. Para monedas, usar `--pj-moneda-*`; para profundidad, `--pj-sombra-panel`, `--pj-sombra-tarjeta`, `--pj-sombra-hundida` y `--pj-sombra-modal`. Reservar los brillos `--pj-sombra-brillo-*` para estados destacados.

---

## 3. Escala Tipográfica de Alta Legibilidad

- **Fuente Base**: `var(--fuente-principal)` con fallback al sistema; en la hoja se usa `Inter`, `system-ui`, sans-serif.
- **Fuente Monospace**: `var(--fuente-codigo)` con fallbacks locales para valores y fórmulas.
- **Escala definida en el tema**:
  - **Títulos Principales y Modales**: `--pj-fuente-titulo` (`16px`) y `--pj-fuente-titulo-grande` (`18px`).
  - **Valores Numéricos**: `--pj-fuente-numero-md/lg/xl` (`15px`, `20px`, `24px`), peso `700`–`800`.
  - **Nombres de Tarjeta y Cuerpo**: `--pj-fuente-subtitulo` y `--pj-fuente-cuerpo` (`12.5px`); cuerpo con altura de línea aproximada de `1.45`.
  - **Botones y Filtros Tácticos**: `--pj-fuente-boton` (`12px`), peso `700`.
  - **Badges, Etiquetas y Metadatos**: `--pj-fuente-micro` y `--pj-fuente-label` (`11px`), `--pj-fuente-badge` (`11.5px`).

---

## 4. Componentes y Patrones UI de la Hoja

### A. Tarjetas de Atributos y Habilidades
- **Modificador Principal**: Círculo hundido de alto contraste con texto de `--pj-fuente-numero-xl` (`24px`) y color `--pj-texto-acento`.
- **Salvaciones**: Toggle táctico con indicador visual claro (`+PB`, `+Mod`) a `11.5px` legible.
- **Grados de Habilidad**: 4 estados visuales diferenciados (Sin entrenar, Medio PB, Competente, Pericia).

### B. Barra Táctica y Condiciones
- **Descansos y Ventajas**: Botones de 3 estados (Desventaja roja, Plano gris, Ventaja verde) a `11.5px`.
- **Chips de Condición**: Tags interactivos a `11px` con tooltips universales a `12px` de despliegue instantáneo (0ms hover).

### C. Vitalidad y Recursos
- **Barra de Vida**: Gradiente de 3 estados (Plena `#10b981`, Herida `#eab308`, Crítica `#ef4444`) con valores a `18px` y badges a `11px`.
- **Recursos Rápidos**: Dados de Golpe, Salvaciones de Muerte y Cansancio con contraste nítido.

### D. Acciones, Conjuros, Rasgos e Inventario

- **Acciones y Ataques**: tarjetas compactas con nombre, bonificador, daño y acción de tirada visibles; separar ataques físicos, magia y consumibles con cabeceras coherentes.
- **Conjuros y Magia**: agrupar por nivel, distinguir conocidos, preparados y recursos disponibles mediante texto e indicadores; reservar el violeta semántico para efectos mágicos.
- **Rasgos y Dotes**: agrupar por procedencia y tipo de acción; mostrar usos restantes junto al control que consume o recupera el recurso.
- **Inventario**: separar equipo, mochila y contenedores; alinear cantidad, peso y monedas, manteniendo el detalle en panel o modal.
- **Iniciativa de Jugador**: destacar turno y datos del personaje con los acentos del jugador, conservando una lectura compacta del combate.

### E. Paneles, Modales y Estados

- Usar tarjetas elevadas y campos hundidos para diferenciar lectura y edición; radios de `6px`–`8px` en paneles de la hoja.
- En modales, mantener cabecera, cierre y acciones identificables, con desplazamiento interno del contenido.
- Diferenciar hover, foco, activo y deshabilitado con cambios estáticos de superficie, borde y texto. Acompañar estados críticos con etiquetas o iconos.

---

## 5. Accesibilidad y Ergonomía

- Objetivo de contraste: al menos `4.5:1` para texto normal y `7:1` cuando se busque el nivel AAA para ese texto. Comprobar cada combinación sobre su fondo real.
- Áreas táctiles mínimas de `32x32px` para controles de clic en pantallas pequeñas.
- Indicación explícita del estado activo mediante bordes luminosos `--pj-borde-acento-fuerte` y sombras tenues.
- Los controles de icono deben tener un nombre accesible y un foco visible; el color debe acompañarse de otra señal de estado.

---

## 6. Aplicación y Aislamiento de Estilos

- Usar tokens `--pj-*` para superficies, bordes, textos y acentos de las vistas propias del jugador.
- Mantener los estilos de composición en el CSS Module del componente; las variantes compartidas deben quedar acotadas a la vista de jugador.
- El tema de jugador define tokens en `:root`, pero ese prefijo no aísla automáticamente los estilos. Evitar reglas globales nuevas sobre `button`, títulos, tarjetas o modales que alteren otros contextos.
- Al cambiar un componente reutilizado, verificar su presentación en los contextos que lo consumen. Esta guía no redefine las herramientas del Master.
