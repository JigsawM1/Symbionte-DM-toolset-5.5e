# Sistema de Diseño Visual — Herramientas del Master (DM)
*Guía de estilo, arquitectura visual y principios de diseño para el Panel del Master en ToolSet D&D 5.5e (TaleSpire Symbiote)*

---

## 1. Filosofía y Principios Fundamentales del DM

1. **Visión Global y Control Rápido**:
   - La pantalla del Master debe priorizar el control simultáneo de múltiples entidades (monstruos, PNJ, PJs), el rastreador de combate y la consulta veloz del compendio de reglas y hechizos.
   - Acciones de un solo clic para daño, curación, condiciones, avance de turnos y sincronización con miniaturas de TaleSpire.

2. **Diferenciación de Facciones y Estados**:
   - Código de colores visual claro para identificar bando:
     - **Jugadores / Aliados**: Acentos verdes/azules (`#10b981` / `#60a5fa`).
     - **Monstruos / Enemigos**: Acentos rojos/carmesí (`#ef4444` / `#f87171`).
     - **Neutrales / Entorno**: Acentos dorados/ámbar (`#f59e0b`).
   - Visibilidad inmediata de criaturas inconscientes, con concentración activa o afectadas por condiciones tácticas.

3. **Compatibilidad Estricta TaleSpire CEF**:
   - Cero animaciones CSS fluidas (`transition: none !important; animation: none !important;`) para prevenir desincronizaciones de renderizado en Unity.
   - Controles interactivos accesibles con el ratón mediante clics directos o atajos compactos.

---

## 2. Paleta de Colores y Tokens para el Master

| Elemento / Rol | Variable / Color Hex | Propósito |
| :--- | :--- | :--- |
| **Fondo DM** | `#080b12` / `#0c101a` | Fondo carbón oscuro con sutil matiz pizarra |
| **Panel Maestro / Card** | `#121824` / `#182232` | Tarjetas de monstruos, tablas de iniciativa |
| **Cabecera de Combat Tracker** | `#1b2434` | Barra superior de control de rondas y turnos |
| **Turno Activo (Luz Táctica)**| `#38bdf8` / `rgba(56, 189, 248, 0.25)` | Resaltado luminoso de la criatura que tiene el turno |
| **Vida Crítica (< 50% / Inconsciente)**| `#ef4444` / `#7f1d1d` | Alertas de peligro vital en combate |
| **Concentración de Hechizo**| `#8b5cf6` / `#c084fc` | Indicador de concentración activa |
| **Homebrew / Creador** | `#10b981` / `#34d399` | Elementos personalizados por el Master |
| **Compendio y Búsqueda** | `#f59e0b` / `#fbbf24` | Tarjetas de hechizos, objetos y monstruos del SRD |

---

## 3. Arquitectura de Módulos del Master

### A. Combat Tracker (Rastreador de Iniciativa)
- **Fila de Criatura Compacta**:
  - Miniatura o Avatar + Nombre + Desafío (CR).
  - Barra de Vida interactiva con botones rápidos `[-5]`, `[-1]`, `[+1]`, `[+5]`.
  - Badge de Iniciativa y estado de turno activo.
  - Indicadores de Condiciones Activas con chips clicables para añadir/quitar.
  - Botón de menú contextual o modal de ficha rápida del monstruo.
- **Barra de Control de Combate**:
  - Contador de Ronda actual y Turno actual.
  - Botones de control: `Turno Siguiente`, `Turno Anterior`, `Iniciar Combate`, `Reiniciar`.
  - Toggle de Sincronización Automática con la cola de iniciativa de TaleSpire.

### B. Gestor de Encuentros y Generador de Monstruos
- **Ficha Táctica de Monstruo**:
  - Bloque de estadísticas oficial (CA, HP, Velocidad, Atributos, Salvaciones, Inmunidades).
  - Acciones Rápidas con fórmulas de ataque y daño listas para lanzar dados 3D.
  - Rasgos y Acciones Legendarias con contadores de usos restantes por asalto/día.

### C. Gestor de Homebrew y Compendio
- **Listados Densos y Filtrables**:
  - Buscador instantáneo por texto, nivel, escuela, tipo de daño o categoría.
  - Filtros multifaceta desplegables.
  - Modal de Creación/Edición con validación estricta de esquemas Zod en TypeScript.

---

## 4. Ergonomía Táctica en Sesión de Juego

- **Minimización de Fricción**: Todas las tiradas del Master (ataques de monstruos, salvaciones en grupo, tiradas de recarga) deben enviarse a la bandeja 3D de TaleSpire con un solo clic.
- **Ocultación / Revelación**: Indicadores claros cuando un monstruo o tirada es pública o privada/secreta del DM.
- **Feedback Inmediato**: Cambios de vida y condiciones se reflejan reactivamente en el estado global (Zustand) y en la sincronización nativa con TaleSpire.
