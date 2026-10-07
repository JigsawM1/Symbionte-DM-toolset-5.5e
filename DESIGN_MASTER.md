# Sistema de Diseño Visual — Herramientas del Master (DM)

*Guía de estilo, composición y patrones visuales del DM Screen en ToolSet D&D 5.5e (TaleSpire Symbiote).*

---

## 1. Alcance e Identidad del DM

Este documento es la referencia del **estilo del Master (DM)**. La hoja y las vistas propias de jugadores se rigen por [DESIGN.md](DESIGN.md).

- **Identidad visual**: brutalismo tecnológico de alta densidad con acentos cyberpunk. Fondos negros azulados, paneles compactos, bordes definidos y geometría predominantemente rectangular.
- **Acentos**: violeta para acciones principales y contenido arcano, cian eléctrico para interacción y turno activo, magenta para énfasis de alerta. Los brillos son estáticos y localizados.
- **Ámbito**: gestor de iniciativa y encuentros, fichas tácticas de criaturas, compendio del DM, creador Homebrew, tablas y calculadoras, pendientes, notas del DM y configuración global.
- **Fuentes de implementación**: `src/index.css`, los CSS Modules de esos módulos y los controles de layout usados por el DM. Los tokens cromáticos son `--color-*`; espaciados, radios, sombras y fuentes tienen sus propias familias.
- **Tema por contexto**: `src/estilos/temaMaster.css` define los alias `--dm-*` dentro de `[data-tema="dm"]`. `App.tsx` asigna ese contexto según el rol y `TooltipUniversal` lo traslada a sus portales. Los CSS Modules usan esos alias con fallback al estilo original para los componentes reutilizados fuera del DM.

Los tokens globales también son consumidos por componentes compartidos. Eso no convierte esta guía en el tema de jugadores: cualquier variante visual de jugador debe quedar acotada a su contenedor o CSS Module, sin redefinir los tokens del DM en `:root`.

## 2. Principios Visuales y de Interacción

1. **Visión global y control rápido**: mostrar varias criaturas, iniciativa, vitalidad y condiciones a la vez. Priorizar las acciones frecuentes de combate y la consulta de fichas.
2. **Jerarquía táctica**: turno activo, selección de miniatura, vitalidad y condiciones deben distinguirse sin depender exclusivamente del color. Acompañar los acentos con etiquetas, iconos, números o bordes.
3. **Densidad legible en CEF de 599px**: diseñar y verificar las vistas con un ancho de viewport de `599px`, descontando padding, bordes y scrollbars del área útil. Usar `12.5px` como mínimo de texto; reorganizar filas y cuadrículas antes de reducir la letra o recortar controles.
4. **Respuesta estática en TaleSpire CEF**: mantener `transition: none !important; animation: none !important;`. Los cambios de hover, foco, selección y estado son inmediatos, sin pulsos, keyframes ni desplazamientos animados. Esta regla no implica que toda la aplicación tenga latencia de 0 ms.
5. **Controles coherentes**: usar `SelectorDesplegable` o `SelectorSugerencias` en lugar de selectores nativos; iconografía SVG local mediante `lucide-react`, sin emojis como controles o indicadores.

## 3. Paleta y Tokens del Master

Los valores siguientes corresponden a los tokens existentes en `src/index.css`. Usar las variables en los módulos del DM en lugar de crear una segunda paleta con colores literales.

| Token CSS | Valor base | Uso visual |
| :--- | :--- | :--- |
| `--color-fondo-profundo` | `hsl(222, 25%, 6%)` | Fondo general negro azulado |
| `--color-fondo-panel` | `hsl(222, 20%, 10%)` | Paneles, barras y formularios |
| `--color-fondo-tarjeta` | `hsl(222, 18%, 14%)` | Tarjetas de criatura y bloques destacados |
| `--color-fondo-tarjeta-foco` | `hsl(222, 18%, 18%)` | Superficie de controles enfocados |
| `--color-borde-brutal` | `hsl(222, 15%, 18%)` | Bordes y separadores estructurales |
| `--color-borde-neon` | `hsl(265, 80%, 55%)` | Énfasis violeta |
| `--color-borde-cian` | `hsl(172, 90%, 48%)` | Interacción, foco y turno activo |
| `--color-borde-alerta` | `hsl(325, 90%, 55%)` | Énfasis magenta de alerta |
| `--color-texto-principal` | `hsl(210, 30%, 98%)` | Nombres, títulos y valores principales |
| `--color-texto-secundario` | `hsl(215, 20%, 84%)` | Descripciones y datos secundarios |
| `--color-texto-apagado` | `hsl(215, 22%, 65%)` | Metadatos y etiquetas auxiliares |
| `--color-primario` | `hsl(265, 80%, 60%)` | Acciones principales |
| `--color-primario-brillante` | `hsl(265, 90%, 65%)` | Acción activa o seleccionada |
| `--color-arcano` | `#7b2cbf` | Magia y distinción de criaturas en el tracker |
| `--color-info` | `#74b9ff` | Información de apoyo |
| `--color-exito` | `hsl(150, 80%, 42%)` | Curación y confirmación |
| `--color-peligro` | `hsl(355, 80%, 50%)` | Daño, acciones destructivas y peligro |
| `--color-advertencia` | `hsl(40, 95%, 55%)` | Avisos y selección de miniatura |

En modo oscuro, TaleSpire puede proporcionar `--ts-background-color`, `--ts-foreground-color`, `--ts-brand-color` y `--ts-border-color`. Los tokens correspondientes conservan sus valores base como fallback; no fijar colores alternativos para eludir esa integración.

### Estados tácticos del tracker

- **Turno activo**: borde cian, fondo con matiz cian y brillo estático tenue, como en `TarjetaCriaturaIniciativa.module.css`.
- **Miniatura seleccionada en TaleSpire**: borde ámbar de mayor grosor. Si coincide con el turno activo, conservar una señal que permita reconocer ambos estados.
- **Tipo de entidad**: la barra lateral actual distingue personajes con cian y monstruos con violeta. No interpretarla automáticamente como una clasificación de aliados y enemigos.
- **Criatura muerta**: atenuación visual, conservando nombre y valores legibles.
- **Condiciones**: chips compactos con icono o texto; rojo para desangrado, dorado para concentración y violeta para efectos mágicos, según las variantes existentes en `src/index.css`.

## 4. Tipografía, Espaciado y Superficies

- **Texto**: `--fuente-principal` (`Inter` con fallback al sistema); base global de `14px` y altura de línea `1.3`.
- **Títulos**: `--fuente-titulo` (`Outfit` con fallback al sistema), peso `700`, mayúsculas y espaciado de letras contenido.
- **Valores y fórmulas**: `--fuente-codigo` (`JetBrains Mono`, `Cascadia Code`, `Fira Code` y fallbacks locales), con cifras de mayor peso visual.
- **Escala orientativa**: cuerpo, botones, etiquetas, badges y tooltips a partir de `12.5px` (`--dm-fuente-minima`); nombres y subtítulos a `13px`–`14px`, cifras principales a `16px`–`20px`. Los tamaños originales inferiores quedan como fallback para contextos distintos del DM.
- **Ancho de referencia**: `599px` en TaleSpire CEF. Permitir que navegación, acciones y filtros se distribuyan en varias filas; usar columnas flexibles y desplazamiento vertical interno, sin depender de scroll horizontal para operar.
- **Acentos con texto pequeño**: usar `--dm-primario-hover` para los fondos activos con texto claro; su alias conserva el acento principal para evitar que una variante más luminosa reduzca el contraste. Verificar el contraste si TaleSpire inyecta otros colores.
- **Espaciado**: `--espaciado-xs/sm/md/lg/xl` = `4/8/12/16/24px`. Usar gaps de `4px` en listados tácticos y más espacio en formularios o bloques de lectura.
- **Radios**: `--radio-sm/md/lg` = `2/4/8px`. Radios pequeños en controles y tarjetas; reservar los mayores para contenedores o modales.
- **Sombras**: `--sombra-tarjeta`, `--sombra-elevada` y `--sombra-overlay` para profundidad estática. Evitar que el brillo compita con los datos.
- **Desplazamiento**: barras estrechas y zonas de scroll internas; cabeceras y controles de combate deben seguir accesibles.

## 5. Patrones por Módulo

### A. Iniciativa y Encuentros

- Tarjeta horizontal compacta: iniciativa, avatar o icono, nombre, vitalidad y condiciones con controles próximos al dato que modifican.
- Barra de control separada del listado: ronda, navegación de turnos y acciones de combate con jerarquía clara.
- Selección, turno activo y vínculo con miniatura deben tener señales diferenciadas.
- A `599px`, los menús de condiciones y efectos de las tarjetas se despliegan dentro del flujo, con scroll interno, para conservar todas sus opciones accesibles. Reservar espacio al final del tracker para el botón flotante de dados.
- Ficha de criatura en panel de detalle o modal: estadísticas, defensas, rasgos y acciones agrupados para consulta rápida.

### B. Compendio y Homebrew

- Navegación compacta entre conjuros, bestiario y equipo; pestaña activa violeta con borde cian.
- Listados densos con buscador y filtros visibles, evitando adornos que reduzcan el área de resultados.
- Formularios en paneles oscuros, agrupados por secciones con cabeceras cian y errores junto al campo correspondiente.
- Separar visualmente creación, edición y consulta mediante títulos y estado de controles.

### C. Tablas, Pendientes, Notas y Configuración

- Mantener las mismas superficies, bordes y tipografía del DM.
- En tablas y calculadoras, alinear datos numéricos y destacar resultados con acentos semánticos.
- En notas y bloques de reglas, favorecer la lectura con mayor altura de línea y texto sin mayúsculas sostenidas.
- En configuración, distinguir grupos de opciones, estado de conexión y acciones de importación o reinicio.

## 6. Ergonomía y Límites de Estilo

- Favorecer acciones directas para tiradas, daño, curación y condiciones; mostrar el resultado y el estado de sincronización cuando corresponda.
- Si una acción admite visibilidad pública o privada, identificarla explícitamente con texto o icono.
- Conservar foco visible, etiquetas para controles de icono y contraste suficiente sobre la superficie real, incluidos estados hover y deshabilitado.
- Los componentes compartidos deben conservar variantes acotadas por contexto. No utilizar tokens `--pj-*` para definir la identidad del DM ni modificar su tema desde una vista de jugador.
- Esta guía define estilo y presentación; no presupone funciones nuevas por describir un patrón visual.
