# Sistema de Diseño Visual — Hoja de Personaje (Jugador)
*Guía de estilo, arquitectura visual y principios de diseño para ToolSet D&D 5.5e (TaleSpire Symbiote)*

---

## 1. Filosofía y Principios Fundamentales

1. **Densidad Táctica y Funcional**:
   - La hoja de personaje debe optimizar cada píxel para que el jugador tenga acceso inmediato a sus modificadores, recursos y tiradas de dados 3D sin scroll innecesario.
   - Jerarquía visual marcada: Puntuación/Modificador grande y visible, etiquetas secundarias en tipografía compacta y apagada.

2. **Entorno TaleSpire (Off-Screen Rendering / CEF)**:
   - **Prohibición de Animaciones CSS**: Por restricciones de renderizado en Chromium CEF dentro de Unity, están prohibidas las transiciones complejas (`transition: none !important; animation: none !important;`). La interfaz debe sentirse ágil, instantánea y robusta.
   - **Prohibición de Selectores Nativos**: Los elementos `<select>` nativos fallan en CEF overlay. Se deben utilizar exclusivamente los componentes `<SelectorDesplegable />` o `<SelectorSugerencias />`.

3. **Iconografía SVG Consistente**:
   - Uso exclusivo de iconos vectoriales SVG limpios vía `lucide-react`.
   - Tamaños estandarizados: `12px` - `14px` para badges y acciones secundarias, `16px` - `18px` para cabeceras y botones principales.

---

## 2. Paleta de Colores y Tokens Visuales

| Elemento / Rol | Variable / Color Hex | Propósito |
| :--- | :--- | :--- |
| **Fondo Principal** | `#070a10` / `#0a0e16` | Fondo ultra oscuro con tono azulado profundo |
| **Superficie de Tarjeta (NeoRaised)** | `#111622` / `#161f2e` | Elevación táctica sobria con borde sutil |
| **Superficie Hundida (NeoPressed)** | `#0a0e16` / `#0d121c` | Inputs, contadores, desgloses matemáticos |
| **Bordes Tácticos** | `rgba(148, 163, 184, 0.12)` a `0.20` | Delimitación nítida sin contraste estridente |
| **Texto Primario** | `#f1f5f9` | Valores numéricos principales, nombres |
| **Texto Secundario** | `#cbd5e1` | Modificadores, texto descriptivo |
| **Texto Terciario / Labels** | `#94a3b8` / `#64748b` | Etiquetas, fórmulas, badges inactivos |
| **Acento Primario (D&D Blue)** | `#38bdf8` / `#60a5fa` / `#93c5fd` | Modificadores positivos, competencias, botones activos |
| **Acento Mágico (Pacto/Grimorio)**| `#a855f7` / `#d8b4fe` | Overrides fijos, recursos mágicos, espacios de pacto |
| **Alerta / Daño / Falo** | `#ef4444` / `#fca5a5` | Daño recibido, salvaciones fallidas, niveles máximos |
| **Éxito / Curación / Vida** | `#10b981` / `#6ee7b7` | Curación, miniatura 3D vinculada, inspiraciones |

---

## 3. Tipografía y Escalas de Texto

- **Fuente Base**: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Escala de Tamaños**:
  - **Títulos de Modal / Sección**: `15px` - `16px` (Font-Weight: 800)
  - **Números Clave / Modificadores**: `14px` - `18px` (Font-Weight: 800)
  - **Subtítulos y Nombres de Tarjeta**: `12px` - `13px` (Font-Weight: 700)
  - **Cuerpo / Descripciones**: `11px` - `12px` (Font-Weight: 500, Line-Height: 1.4)
  - **Etiquetas, Fórmulas y Badges**: `9px` - `10px` (Font-Weight: 700, Uppercase o Compacto)

---

## 4. Componentes y Patrones UI de la Hoja

### A. Tarjetas de Atributos y Habilidades
- **Estructura**:
  - **Badge de Sigla**: Contenedor cuadrado de `30x30px` con fondo `#18202e` y borde de `1px`.
  - **Identificador**: Nombre del atributo/habilidad con subtítulo indicando puntuación base.
  - **Caja de Modificador**: Contenedor hundido con valor numérico grande coloreado (`#60a5fa` positivo, `#fca5a5` negativo).
  - **Fila de Badges**: Etiquetas compactas para Salvación (`+PB`), Override Fijo (`Fijo: 19`) y Modificadores Extras.
  - **Botón de Acción**: Botón táctico inferior de ancho completo para abrir inspección o personalización.

### B. Modales de Detalle y Personalización
- **Estructura en 2 Sub-pestañas**:
  1. **Información y Tiradas**:
     - Cuadro explicativo oficial/personalizado.
     - Tabla de desglose matemático detallado (Base + Override + PB + Mod Extra = Total).
     - Notas rápidas si existen.
     - Botones de tirada 3D directos hacia TaleSpire.
  2. **Personalizar**:
     - Edición libre de Nombre y Descripción.
     - Controles incrementales `[-]` Input `[+]` con soporte de texto y `onBlur`.
     - Presets rápidos para overrides fijos (ej. 19, 21, 23).
     - Modificadores adicionales a pruebas y salvaciones.
     - Área de notas libres.

### C. Multiclase y Progresión de Niveles
- **Límite Estricto**: Suma de clases $\le 20$.
- **Sincronización Bidireccional**: Nivel $\leftrightarrow$ Rango de Experiencia (D&D 5.5e).
- **Control Visual**: Badge que indica los niveles disponibles restantes (`Puedes asignar hasta X niveles más`).

---

## 5. Accesibilidad y Ergonomía

- Contraste WCAG AA en textos sobre fondos oscuros.
- Áreas interactivas mínimas de `32x32px` para controles de clic en pantallas pequeñas.
- Indicación explícita del estado activo mediante borde luminoso y fondo coloreado tenue.
