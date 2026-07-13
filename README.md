# Gestor de Plantillas para WhatsApp

App para crear, guardar y reutilizar plantillas de mensajes de WhatsApp. Proyecto integrador del **Módulo 4** (Clases 13 a 16): modelado de datos, interacción y datos derivados, persistencia con `localStorage`, y arquitectura modular con ESM.

✅ **Persiste todo.** Tus plantillas, tu filtro y tu orden preferido se guardan en `localStorage` y sobreviven a un recargo o cierre de la pestaña.

## ¿Qué hace?

1. Crear una plantilla con título, mensaje (puede incluir `{nombre}` y `{producto}`) y hashtag.
2. Ver todas las plantillas en tarjetas, con su fecha de creación y contador de caracteres.
3. **Editar** una plantilla existente: sus datos se cargan en el formulario y, al guardar, se actualiza en su lugar (no se duplica).
4. **Eliminar** una plantilla puntual, con confirmación mediante un modal propio.
5. **Duplicar** una plantilla en un clic, para crear variantes rápido.
6. Marcar plantillas como **favoritas** ⭐, ancladas siempre arriba de la lista.
7. Ver un **panel de estadísticas**: total de plantillas, conteo por hashtag y el hashtag más usado.
8. **Filtrar** la lista escribiendo un hashtag en el buscador (con botón para limpiar el filtro).
9. **Ordenar** por más recientes, más antiguas o alfabéticamente.
10. Elegir una plantilla, escribir un nombre/producto real y generar el mensaje final con las variables reemplazadas.
11. Copiar ese mensaje al portapapeles con un clic.
12. **Persistir todo en el navegador**: plantillas, filtro y favoritos sobreviven a un recargo (`localStorage`).
13. **Vaciar** toda la colección de un clic (con confirmación), con un indicador visual del estado de guardado.
14. Ver un **estado vacío amigable** cuando no hay plantillas o cuando el filtro no encuentra nada.

## La clase `Template`

Ubicada en `js/models/Template.js`. Modela qué información tiene **cada** plantilla:

```js
export class Template {
  constructor(titulo, mensaje, hashtag) {
    this.id = crypto.randomUUID(); // id único para saber sobre cuál plantilla actuar
    this.titulo = titulo;
    this.mensaje = mensaje;
    this.hashtag = hashtag;
    this.fecha = new Date();
  }
}
```

- `id`: generado con `crypto.randomUUID()`. Necesario porque el título podría repetirse, y para eliminar/editar/duplicar una plantilla puntual hace falta un identificador único.
- `fecha`: objeto `Date` capturado automáticamente en el constructor, mostrado en pantalla con `.toLocaleDateString("es-PE")`.

Todas las plantillas viven en el **estado central** (`state`, en `js/state.js`), que también guarda `editandoId` (si es distinto de `null`, la app está en "modo edición"), `filtro` (texto del buscador) y `orden` (criterio de ordenamiento activo). La pantalla se redibuja completa desde `render()` cada vez que el estado cambia.

## Delegación de eventos

En vez de poner un `addEventListener` en cada botón de cada tarjeta (que habría que reconectar cada vez que `render()` las destruye y las vuelve a crear), hay **un solo listener en el `<ul>` padre** (`listaPlantillas`):

```js
lista.addEventListener("click", function (evento) {
  const botonEliminar = evento.target.closest(".btn-eliminar");
  const botonEditar = evento.target.closest(".btn-editar");
  const botonDuplicar = evento.target.closest(".btn-duplicar");
  const botonFavorito = evento.target.closest(".btn-favorito");

  if (botonEliminar) eliminarPlantilla(botonEliminar.dataset.id);
  if (botonEditar) cargarEnFormulario(botonEditar.dataset.id);
  if (botonDuplicar) { duplicarPlantilla(botonDuplicar.dataset.id); render(); }
  if (botonFavorito) { toggleFavorito(botonFavorito.dataset.id); render(); }
});
```

Como los botones tienen un ícono `<svg>` adentro, un clic puede caer en el ícono y no en el `<button>`. Por eso se usa `.closest(".btn-eliminar")` en vez de revisar `evento.target` directamente: sube por los ancestros del elemento clickeado hasta encontrar el botón correcto, sin importar en qué parte exacta del ícono se hizo clic. Así el listener funciona para 3 tarjetas o para 300, sin importar cuántas veces se destruyan y vuelvan a crear.

## CRUD inmutable

- **Eliminar** usa `.filter()`: crea un array nuevo sin la plantilla borrada, sin tocar el original.
- **Editar** usa `.map()` + spread (`{ ...plantilla, ... }`): crea un array nuevo donde solo la plantilla editada cambia; las demás se devuelven intactas.
- **Duplicar** crea una instancia nueva de `Template` (con `id`/`fecha` propios) y la agrega al array; no toca la plantilla original.
- **Favoritos** usa el mismo patrón de `.map()` + spread que editar, alternando el campo `favorito`.

## Funciones puras para datos derivados

```js
export function contarPorHashtag(plantillas) {
  return plantillas.reduce(function (conteo, plantilla) {
    conteo[plantilla.hashtag] = (conteo[plantilla.hashtag] || 0) + 1;
    return conteo;
  }, {});
}
```

`contarPorHashtag()` es una **función pura**: recibe el array de plantillas y devuelve un objeto `{ "#ventas": 2, "#soporte": 1 }` sin modificar nada externo. Se usa dentro de `renderStats()` para pintar el panel de estadísticas, junto con `hashtagMasUsado()`, que a partir de ese conteo determina cuál es el hashtag con más plantillas. Como ambas se llaman en cada `render()`, el panel nunca queda desactualizado.

## Métodos de String usados y para qué

| Método | Dónde se usa | Para qué |
|---|---|---|
| `.trim()` | Formulario y buscador | Quitar espacios sobrantes al inicio/final. |
| `.toLowerCase()` | `normalizarHashtag()` y `plantillasVisibles()` | Unificar mayúsculas/minúsculas para comparar o guardar igual. |
| `.startsWith("#")` | `normalizarHashtag()` | Evitar duplicar el `#` si el usuario ya lo escribió. |
| `.length` | Validación del form y contador de caracteres en la tarjeta | Detectar campos vacíos / mostrar cuántos caracteres tiene el mensaje. |
| `.slice(0, 60)` | Tarjeta | Recortar el mensaje mostrado si es muy largo. |
| `.includes()` | `plantillasVisibles()` (buscador) | Saber si el hashtag contiene el texto que escribió el usuario. |
| `.replaceAll("{nombre}", valor)` | `generarMensajeFinal()` | Reemplazar todas las apariciones de una variable por su valor real. |
| `.localeCompare()` | `ordenar()` (orden alfabético) | Comparar texto respetando tildes y mayúsculas correctamente. |

## Persistencia con `localStorage` y JSON

Toda la lógica de guardado vive en `js/storage.js`, un módulo ESM que `importa` el `state` que necesita.

**Guardar (`guardar()`):** `localStorage` solo puede almacenar texto, pero `state.plantillas` es un array de objetos. Por eso se "serializa" con `JSON.stringify()` antes de guardarlo:

```js
export function guardar() {
  state.plantillas.length === 0
    ? localStorage.removeItem(CLAVE)
    : localStorage.setItem(CLAVE, JSON.stringify(state.plantillas));

  localStorage.setItem(CLAVE_FILTRO, state.filtro ?? "");
}
```

Se usa `removeItem()` en vez de guardar un array vacío `"[]"` cuando no queda ninguna plantilla, para que "Vaciar todo" limpie de verdad la clave del navegador. El filtro, al ya ser texto, se guarda directo, sin `JSON.stringify`. `guardar()` se llama una sola vez, al final de `render()` en `ui.js` — como **todo** cambio de estado termina en un `render()`, basta ese único punto para mantener siempre sincronizados el estado y lo guardado.

**Cargar (`cargar()`):** al reconstruir el array desde el texto guardado se usa `JSON.parse()`, protegido con `try/catch`:

```js
export function cargar() {
  const guardado = localStorage.getItem(CLAVE);
  if (!guardado) return [];
  try {
    return JSON.parse(guardado);
  } catch (error) {
    console.warn("Datos corruptos en localStorage, empiezo de cero:", error);
    return [];
  }
}
```

**¿Por qué `try/catch`?** `JSON.parse()` lanza un error si el texto no es JSON válido (por ejemplo, si alguien edita el valor a mano en DevTools y lo deja mal formado). Sin el `try/catch`, ese error rompería toda la app al cargar. Con él, si el parseo falla, la app registra un aviso en consola y arranca con la lista vacía en vez de mostrar una pantalla rota.

**Detalle importante — las fechas:** JSON no sabe representar objetos `Date`, los convierte a texto plano. Al recargar la página, `plantilla.fecha` deja de ser un `Date` y pasa a ser un string. Por eso, en `render()`, la fecha se reconstruye antes de formatearla: `new Date(plantilla.fecha).toLocaleDateString("es-PE")`, sin importar si la plantilla se acaba de crear o se acaba de cargar desde `localStorage`.

## Módulos ESM

Hasta la Clase 15, todo el código se comunicaba por **variables globales**, dependiendo de que los `<script>` cargaran en el orden correcto. Desde C16, el proyecto usa **módulos ES (`export`/`import`)**:

```
whatsapp-templates/
├── index.html
├── README.md
└── js/
    ├── app.js              # arranque: importa y conecta todo (no exporta nada)
    ├── state.js            # estado central + funciones puras de datos (export)
    ├── storage.js          # guardar()/cargar() con localStorage + JSON (export)
    ├── ui.js                # render(), listeners, modal, tarjetas (export solo render)
    └── models/
        └── Template.js     # clase Template (export)
```

- **`index.html`** carga un único script: `<script type="module" src="js/app.js"></script>`. Con `type="module"`, cada archivo tiene su propio ámbito (nada de variables globales) y el **orden ya no importa**: el navegador resuelve el árbol de `import` solo.
- **`models/Template.js`** exporta la clase `Template`.
- **`state.js`** exporta el estado central (`state`) y las funciones que leen/derivan/mutan datos: `agregarPlantilla`, `eliminarPlantilla`, `editarPlantilla`, `duplicarPlantilla`, `toggleFavorito`, `normalizarHashtag`, `contarPorHashtag`, `hashtagMasUsado`, `plantillasVisibles`. No toca el DOM: es puro manejo de datos.
- **`storage.js`** exporta `CLAVE`, `CLAVE_FILTRO`, `CLAVE_VISITAS`, `guardar`, `cargar`, `registrarVisita`. Importa `state` de `state.js` para saber qué persistir.
- **`ui.js`** importa de `state.js` y `storage.js` todo lo que necesita, y exporta únicamente `render()` — todo lo demás (listeners, modal, `cargarEnFormulario`, colores por hashtag) queda privado a este archivo.
- **`app.js`** no exporta nada: solo importa `state`, `cargar` y `render`, y arranca la app.

**¿Por qué separar así?** Cada archivo tiene una única responsabilidad: `state.js` es el "cerebro" de los datos, `storage.js` es la memoria persistente, `ui.js` es lo único que toca la pantalla. Si mañana hay que cambiar `localStorage` por una API real, solo se toca `storage.js`; si hay que cambiar el diseño, solo se toca `ui.js`.

## Modal de confirmación propio

Eliminar una plantilla o vaciar toda la colección no usa el `confirm()` nativo del navegador: hay un modal propio (HTML + Tailwind) que empieza oculto con la clase `hidden`. La pieza clave es que la acción a ejecutar se **guarda en una variable** en vez de ejecutarse directo:

```js
function pedirConfirmacion(texto, accion) {
  modalTexto.textContent = texto;
  accionPendiente = accion;
  modal.classList.remove("hidden");
}
```

Solo si el usuario pulsa "Eliminar" en el cuadro se ejecuta `accionPendiente()`. Esto hace que **el mismo modal sirva para cualquier acción destructiva**, sin duplicar el cuadro de diálogo. También se cierra si el usuario hace clic en el fondo oscuro, comparando `evento.target === modal`.

## Estados vacíos

`render()` distingue dos situaciones que antes se veían igual (una lista en blanco):

- **No hay ninguna plantilla creada todavía** → `"Aún no tienes plantillas. ¡Crea la primera! 🚀"`
- **Hay plantillas, pero el filtro actual no encuentra ninguna** → `"No se encontraron plantillas con ese filtro."`

La diferencia se calcula comparando `state.plantillas.length` (el total real) contra `plantillasVisibles().length` (lo que hay que mostrar tras filtrar y ordenar).

## Ordenar la colección (con favoritos anclados)

Un `<select id="orden">` permite elegir entre "Más recientes", "Más antiguas" y "Alfabético". El orden se guarda en `state.orden` y se aplica dentro de `plantillasVisibles()`, después de filtrar:

```js
function comparadorSegunOrden(a, b) {
  if (state.orden === "antiguas")   return new Date(a.fecha) - new Date(b.fecha);
  if (state.orden === "alfabetico") return a.titulo.localeCompare(b.titulo);
  return new Date(b.fecha) - new Date(a.fecha); // "recientes" (por defecto)
}

function ordenar(plantillas) {
  const copia = [...plantillas]; // .sort() muta: copiamos antes de ordenar
  return copia.sort(function (a, b) {
    const favA = a.favorito ? 1 : 0;
    const favB = b.favorito ? 1 : 0;
    if (favA !== favB) return favB - favA;   // favoritas SIEMPRE primero
    return comparadorSegunOrden(a, b);        // desempate con el criterio elegido
  });
}
```

`.sort()` **muta** el array sobre el que se llama, por eso siempre se copia primero con el spread `[...plantillas]`. Las plantillas favoritas se comparan primero (`favB - favA`, así los `true` quedan antes que los `false`); solo si ambas plantillas empatan en "favorito" se usa el criterio de orden normal como desempate.

## Historias de Usuario propias (Proyecto Integrador)

Más allá de las HU de los laboratorios, el proyecto integrador suma estas dos:

### HU5: Duplicar plantilla
*Como usuario, quiero duplicar una plantilla existente, para crear variantes rápidamente sin escribir todo desde cero.*

- **Criterios de aceptación:**
  - Cada tarjeta tiene un botón "Duplicar".
  - La copia mantiene el mismo mensaje y hashtag, con el título + " (copia)".
  - La copia recibe un `id` y una `fecha` nuevos (independiente del original: editarla o borrarla no afecta a la plantilla original).
  - No pide confirmación: duplicar no es una acción destructiva.
- **Implementación:** `duplicarPlantilla(id)` en `state.js` busca la plantilla original con `.find()` y crea un `new Template(...)` con sus mismos datos (salvo el título). Al ser una instancia nueva de `Template`, `id` y `fecha` se generan solos en el constructor.

### HU6: Favoritos (anclar plantillas)
*Como usuario, quiero marcar mis plantillas más importantes como favoritas, para tenerlas siempre ancladas arriba de la lista, sin importar el orden elegido.*

- **Criterios de aceptación:**
  - Cada tarjeta tiene un ícono de estrella que alterna favorito/no favorito.
  - Las plantillas favoritas se muestran primero, **siempre**, sin importar si el `<select>` de orden está en "Recientes", "Antiguas" o "Alfabético".
  - Dentro de cada grupo (favoritas / no favoritas), se respeta el criterio de orden elegido.
  - El estado de favorito persiste en `localStorage` junto con el resto de la plantilla.
- **Implementación:** `toggleFavorito(id)` en `state.js` alterna el campo `favorito` de forma inmutable (mismo patrón que `editarPlantilla`). El comparador de `.sort()` en `ordenar()` compara primero `favorito` y solo usa el criterio de orden normal como desempate. Visualmente, cada tarjeta favorita lleva un anillo ámbar sutil (`ring-amber-400/40`) para distinguirse de un vistazo.

## Historias de Usuario implementadas (resumen completo)

| HU | Descripción | Laboratorio |
|---|---|---|
| HU1 | Modelar la plantilla con `class Template` y estado central | C13 |
| HU2 | Render desde el estado (`render()`) | C13 |
| HU3 | Limpiar y normalizar texto (`.trim()`, `.toLowerCase()`) | C13 |
| HU4 | Generador de mensaje con sustitución de variables | C13 |
| HU1 | Eliminar con delegación de eventos | C14 |
| HU2 | Editar sin mutar el estado | C14 |
| HU3 | Estadísticas con función pura (`contarPorHashtag`) | C14 |
| HU4 | Filtrar por hashtag | C14 |
| HU1 | Guardar en `localStorage` (JSON) | C15 |
| HU2 | Recuperar al abrir la app | C15 |
| HU3 | Proteger contra datos corruptos (`try/catch`) | C15 |
| HU4 | Vaciar colección + indicador de estado | C15 |
| HU5 | Recordar el filtro | C15 |
| HU1 | Modal de confirmación propio | C16 |
| HU2 | Estados vacíos (sin datos / sin resultados) | C16 |
| HU3 | Modularización con ESM | C16 |
| HU4 | Ordenar por fecha / alfabéticamente | C16 |
| **HU5** | **Duplicar plantilla** | **Proyecto Integrador** |
| **HU6** | **Favoritos (anclar arriba)** | **Proyecto Integrador** |

## Logros Adicionales implementados

**C13**
- **Logro 1 — Contador de caracteres**: cada tarjeta muestra `plantilla.mensaje.length`.
- **Logro 2 — Recortar en la tarjeta**: mensajes de más de 60 caracteres se muestran recortados con `.slice(0, 60) + "…"`.
- **Logro 3 — Más variables**: el generador soporta `{nombre}` y `{producto}` encadenando dos `.replaceAll()`.

**C14**
- **Logro 1 — Cancelar edición**: botón "Cancelar edición" en el formulario (visible solo mientras se edita). Pone `state.editandoId = null` y limpia el formulario, sin guardar ningún cambio.
- **Logro 2 — Hashtag más usado**: `hashtagMasUsado(porTag)` recibe el resultado de `contarPorHashtag()` y devuelve, con `.reduce()`, cuál hashtag tiene más plantillas. Se muestra en el panel de estadísticas como `⭐ Más usado: #hashtag (n)`.
- **Logro 3 — Confirmar al eliminar**: reemplazado luego por el modal propio de C16.

**C15**
- **Logro 1 — Exportar**: botón "Exportar (consola)" que imprime `JSON.stringify(state.plantillas, null, 2)` — el `2` le da sangría, para que el JSON se vea legible en consola.
- **Logro 2 — Contador persistente**: `registrarVisita()` en `storage.js` guarda, bajo otra clave (`whatsapp-templates-visitas`), cuántas veces se abrió la app. Se muestra debajo del título ("Abriste esta app N veces").
- **Logro 3 — Fecha de edición**: al guardar una edición, la plantilla recibe `editadaEl: new Date()`. Si existe, la tarjeta muestra "✏️ Editada: [fecha]" debajo del mensaje, y se persiste junto con el resto de la plantilla.

**C16**
- **Logro 1 — Cerrar al hacer clic fuera**: el modal se cierra si el clic cae exactamente en el fondo oscuro (`evento.target === modal`), no en el cuadro blanco de adentro.
- **Logro 2 — Orden alfabético**: tercera opción en el `<select id="orden">` que ordena con `.localeCompare()`, respetando tildes y mayúsculas.
- **Logro 3 — Limpiar filtro**: botón ✕ dentro del buscador que vacía `state.filtro` y el input de un solo clic.

## Diseño visual

La interfaz sigue una línea "glassmorphism" oscura, inspirada en tarjetas de perfil tipo link-in-bio, aplicada al mundo de quien la construyó (programación / QA / documentación funcional):

- **Paleta**: fondo azul marino (`#0b1220`) con resplandores radiales sutiles y una grilla de líneas finas de fondo, tarjetas de "vidrio" (`.glass` / `.glass-row`: fondo translúcido + `backdrop-filter: blur`), acento celeste (`#38bdf8`) para el header y botones principales, y verde WhatsApp (`#25D366`) reservado para la acción de "Generar" (enviar mensaje). El fondo además fusiona la grilla azul con un guiño directo a WhatsApp: un patrón sutil tileado de burbuja de chat + doble check (✓✓) en verde, apenas visible.
- **Tipografía**: `Space Grotesk` para títulos, `Inter` para texto general y `JetBrains Mono` para hashtags, fechas y el indicador de estado.
- **Íconos SVG en vez de emojis**: editar, eliminar, duplicar, favorito, copiar, generar, exportar y vaciar usan íconos vectoriales propios (trazo `currentColor`), cada uno dentro de un botón circular a color (`.icon-btn`).
- **Tarjetas de plantilla estilo "fila de perfil"**: cada plantilla se pinta como una fila con un badge circular a color (con el ícono `#`), título, subtítulo (mensaje recortado) y los botones de acción a la derecha.
- **Hashtags con color determinista** (`colorPorHashtag()` / `badgePorHashtag()`): cada hashtag recibe siempre el mismo color, calculado a partir de sus propias letras — igual que las etiquetas de un issue tracker (Jira/GitHub Issues).
- **Favoritas destacadas**: un anillo ámbar sutil (`ring-amber-400/40`) distingue las tarjetas favoritas de un vistazo.

## Decisiones técnicas clave

1. **Modelar con `class Template` en vez de objetos sueltos.** Centraliza en un solo lugar la generación del `id` (`crypto.randomUUID()`) y la `fecha` (`new Date()`), para que ninguna parte de la app pueda crear una plantilla "incompleta" o con un id duplicado.

2. **Un único estado central (`state`) en vez de variables sueltas por funcionalidad.** Todo lo que la pantalla muestra sale de `state` (plantillas, filtro, orden, edición en curso). Esto hace que `render()` sea predecible: siempre redibuja desde la misma fuente, sin importar qué acción lo disparó.

3. **`localStorage` + JSON en vez de un backend.** El alcance del proyecto es 100% cliente: no hay necesidad de autenticación ni de compartir datos entre dispositivos, así que un backend habría sido complejidad innecesaria. `JSON.stringify`/`parse` son el puente estándar entre objetos JS y lo que `localStorage` puede guardar (solo texto).

4. **CRUD inmutable (`.filter()` / `.map()` + spread) en vez de mutar el array directamente.** Evita bugs difíciles de rastrear por referencias compartidas, y hace que cada cambio de estado sea explícito: `state.plantillas = ...` siempre crea una versión nueva, nunca modifica la anterior a mitad de camino.

5. **Delegación de eventos (un listener en el `<ul>`, no uno por botón).** Las tarjetas se destruyen y se vuelven a crear en cada `render()`. Un solo listener en el contenedor padre, con `.closest()`, escala sin esfuerzo a cualquier cantidad de tarjetas.

6. **Modal propio con `accionPendiente` en vez de `confirm()` nativo.** Guardar la acción a ejecutar en una variable, en lugar de escribir un cuadro de confirmación por cada botón peligroso, permite que **un solo componente** sirva tanto para eliminar una plantilla como para vaciar toda la colección — y da control total sobre el diseño.

7. **Módulos ESM (`state.js` / `storage.js` / `ui.js` / `app.js`) en vez de un solo archivo.** Cada módulo tiene una única responsabilidad: `state.js` no sabe que existe el DOM, `storage.js` no sabe que existen botones, `ui.js` es lo único que los conecta con la pantalla. Facilita encontrar dónde cambiar algo y evita que un archivo gigante se vuelva difícil de razonar.

8. **Color determinista por hashtag (hash simple de sus letras) en vez de guardar un color en cada plantilla.** El mismo hashtag siempre cae en el mismo color, calculado al vuelo, sin ocupar espacio en el estado ni en `localStorage` — un "dato derivado" más, consistente con el resto del proyecto.

9. **Favoritos como criterio de orden primario, no como filtro aparte.** En vez de una vista separada de "solo favoritos", el comparador de `.sort()` compara primero `favorito` y usa el criterio elegido (recientes/antiguas/alfabético) solo como desempate. Así una sola función (`plantillasVisibles()`) sigue siendo la única fuente de qué mostrar y en qué orden.

## Cómo correrlo

⚠️ **Importante**: como el proyecto usa módulos ESM (`type="module"`), **no funciona abriendo `index.html` con doble clic** (protocolo `file://`). Necesitas un servidor local:

1. Clona el repositorio.
2. Ábrelo con **Live Server** (extensión de VS Code) o corre `python -m http.server` en la carpeta del proyecto.
3. Entra a `index.html` a través del servidor (`http://localhost:...`).

En GitHub Pages funciona sin ningún problema, porque ya sirve los archivos por HTTP.

## Despliegue

- Repositorio: `https://github.com/AndrePR16/whatsapp-templates`
- Sitio publicado (GitHub Pages): [https://andrepr16.github.io/whatsapp-templates/](https://andrepr16.github.io/whatsapp-templates/)