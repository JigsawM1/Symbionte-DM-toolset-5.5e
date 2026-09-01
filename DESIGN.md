# Sistema de Diseño Visual — Hoja de Personaje y Vista de Jugador
*Guía de estilo, arquitectura visual y tokens globales para ToolSet D&D 5.5e (TaleSpire Symbiote)*

---

## 1. Filosofía y Arquitectura Visual Segregada

### A. Separación Arquitectónica: Master (DM) vs Jugador (Player)
Para mantener coherencia temática y evitar interferencias estilísticas entre los distintos modos de la aplicación:
1. **Modo Master (DM)**:
   - Identidad visual brutalista tecnológica cyberpunk con acentos violetas oscuros (`#7b2cbf`), cian eléctrico (`#00f5d4`) y magenta (`#f72585`).
   - Gobierna el Gestor de Encuentros, Iniciativa del DM, Creador Homebrew y Configuración Global.
2. **Modo Jugador (Player UI)**:
   - Identidad visual **Dark Fantasy Zafiro/Índigo Táctico** de alta densidad.
   - Centralizado en `src/estilos/temaJugador.css` con el prefijo global `--pj-*`.
   - Gobierna la Hoja de Personaje, Vista de Acciones/Ataques, Gestión de Magia/Conjuros, Inventario del Aventurero e Iniciativa de Jugador.

### B. Principios Fundamentales de la Vista de Jugador
1. **Densidad Táctica y Funcional**:
   - Cada píxel optimizado para acceso instantáneo a modificadores, recursos y tiradas de dados 3D en TaleSpire sin desplazamientos innecesarios.
2. **Entorno TaleSpire (Off-Screen Rendering / CEF)**:
   - **Prohibición Total de Animaciones CSS**: Cero transiciones y cero keyframes (`transition: none !important; animation: none !important;`) para latencia de 0ms en Chromium Embedded Framework.
   - **Prohibición de Selectores Nativos**: Uso exclusivo de componentes controlados (`<SelectorDesplegable />` o `<SelectorSugerencias />`).
3. **Tipografía Nítida y Accesible**:
   - Tamaño mínimo absoluto de **11px** para evitar pérdida de nitidez en resoluciones escaladas de TaleSpire.
   - Contraste WCAG AA/AAA estricto en todos los textos sobre fondos oscuros.
4. **Iconografía SVG Exclusiva**:
   - Iconos locales limpios vía `lucide-react`. Prohibición absoluta de emojis en toda la interfaz.

---

## 2. Tokens Globales de Jugador (`--pj-*`)

| Token CSS | Valor Hex / HSL | Propósito / Elementos |
| :--- | :--- | :--- |
| `--pj-fondo-base` | `#070a10` | Fondo general de la vista de jugador |
| `--pj-fondo-panel` | `#0d121c` | Contenedores y paneles secundarios |
| `--pj-fondo-tarjeta` | `#121722` | Tarjetas de atributos, habilidades, ataques |
| `--pj-fondo-tarjeta-hover` | `#1b2434` | Estado hover en tarjetas tácticas |
| `--pj-fondo-hundido` | `#080c14` | Inputs numéricos, desgloses matemáticos |
| `--pj-fondo-cabecera-gradiente` | `linear-gradient(180deg, #161e2c, #111622)` | Cabeceras de panel y modales |
| `--pj-borde-sutil` | `rgba(148, 163, 184, 0.16)` | Delimitadores de rejilla y separadores |
| `--pj-borde-medio` | `rgba(148, 163, 184, 0.26)` | Bordes de tarjeta estándar |
| `--pj-borde-acento-fuerte` | `#818cf8` | Foco activo, bordes destacados de héroe |
| `--pj-texto-primario` | `#ffffff` / `#f8fafc` | Nombres de personaje, números principales |
| `--pj-texto-secundario` | `#cbd5e1` / `#e2e8f0` | Modificadores, descripciones, notas |
| `--pj-texto-terciario` | `#94a3b8` / `#a0aec0` | Labels, fórmulas, badges inactivos |
| `--pj-texto-acento` | `#a5b4fc` | Modificadores positivos, títulos tácticos |
| `--pj-texto-cian` | `#38bdf8` | D&D Blue, pericias, valores destacados |
| `--pj-texto-alerta` | `#fca5a5` | Daño recibido, salvaciones fallidas |
| `--pj-texto-exito` | `#6ee7b7` | Curaciones, ventajas, miniaturas vinculadas |
| `--pj-texto-oro` | `#fde047` | Monedas, subclase, inspiraciones activas |

---

## 3. Escala Tipográfica de Alta Legibilidad

- **Fuente Base**: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Fuente Monospace**: `'JetBrains Mono', 'Fira Code', monospace`
- **Escala de Tamaños Mínimos**:
  - **Títulos Principales y Modales**: `16px` – `18px` (Font-Weight: 800)
  - **Valores Numéricos / Modificadores Clave**: `20px` – `26px` (Font-Weight: 800 Mono)
  - **Nombres de Tarjeta y Subtítulos**: `13.5px` – `15px` (Font-Weight: 700)
  - **Cuerpo, Descripciones y Fórmulas**: `12.5px` – `13px` (Font-Weight: 500 / 600, Line-Height: 1.45)
  - **Botones y Filtros Tácticos**: `11.5px` – `12.5px` (Font-Weight: 700)
  - **Badges, Etiquetas y Metadatos Mínimos**: `11px` – `11.5px` (Font-Weight: 700, Uppercase o Compacto)

---

## 4. Componentes y Patrones UI de la Hoja

### A. Tarjetas de Atributos y Habilidades
- **Modificador Principal**: Círculo hundido de alto contraste con texto de `24px` / `26px` (`--pj-texto-acento`).
- **Salvaciones**: Toggle táctico con indicador visual claro (`+PB`, `+Mod`) a `11.5px` legible.
- **Grados de Habilidad**: 4 estados visuales diferenciados (Sin entrenar, Medio PB, Competente, Pericia).

### B. Barra Táctica y Condiciones
- **Descansos y Ventajas**: Botones de 3 estados (Desventaja roja, Plano gris, Ventaja verde) a `11.5px`.
- **Chips de Condición**: Tags interactivos a `11px` con tooltips universales a `12px` de despliegue instantáneo (0ms hover).

### C. Vitalidad y Recursos
- **Barra de Vida**: Gradiente de 3 estados (Plena `#10b981`, Herida `#eab308`, Crítica `#ef4444`) con valores a `18px` y badges a `11px`.
- **Recursos Rápidos**: Dados de Golpe, Salvaciones de Muerte y Cansancio con contraste nítido.

---

## 5. Accesibilidad y Ergonomía

- Contraste WCAG AA ($\ge 4.5:1$ en texto pequeño y $\ge 7:1$ en texto estándar) sobre fondos oscuros.
- Áreas táctiles mínimas de `32x32px` para controles de clic en pantallas pequeñas.
- Indicación explícita del estado activo mediante bordes luminosos `--pj-borde-acento-fuerte` y sombras tenues.
