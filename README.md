# Gestor de Plantillas para WhatsApp

App para crear, guardar y reutilizar plantillas de mensajes de WhatsApp. Proyecto del **Módulo 4**, en construcción a lo largo de las clases 13 a 16.

✅ **Ya persiste.** Desde la Clase 15, tus plantillas y tu filtro se guardan en `localStorage` y sobreviven a un recargo o cierre de la pestaña.

## ¿Qué hace? (hasta C15)

1. Crear una plantilla con título, mensaje (puede incluir `{nombre}` y `{producto}`) y hashtag.
2. Ver todas las plantillas en tarjetas, con su fecha de creación y contador de caracteres.
3. **Editar** una plantilla existente: sus datos se cargan en el formulario y, al guardar, se actualiza en su lugar (no se duplica).
4. **Eliminar** una plantilla puntual sin afectar las demás.
5. Ver un **panel de estadísticas**: total de plantillas y conteo por hashtag, siempre actualizado.
6. **Filtrar** la lista escribiendo un hashtag en el buscador.
7. Elegir una plantilla, escribir un nombre/producto real y generar el mensaje final con las variables reemplazadas.
8. Copiar ese mensaje al portapapeles con un clic.
9. **Persistir todo en el navegador**: plantillas y filtro sobreviven a un recargo (`localStorage`).
10. **Vaciar** toda la colección de un clic, con un indicador visual del estado de guardado.

## La clase `Template`

Ubicada en `js/models/Template.js`. Modela qué información tiene **cada** plantilla:

```js
class Template {
  constructor(titulo, mensaje, hashtag) {
    this.id = crypto.randomUUID(); // id único para saber sobre cuál plantilla actuar (C14)
    this.titulo = titulo;
    this.mensaje = mensaje;
    this.hashtag = hashtag;
    this.fecha = new Date();
  }
}
```

- `id`: generado con `crypto.randomUUID()`. Se agregó en la Clase 14 porque, para eliminar o editar una plantilla puntual, no basta con el título (podría repetirse) — se necesita un identificador único.
- `fecha`: objeto `Date` capturado automáticamente en el constructor, mostrado en pantalla con `.toLocaleDateString("es-PE")`.

Todas las plantillas viven en el **estado central** (`state.plantillas`, en `js/app.js`). Desde C14, el estado también guarda `editandoId` (si es distinto de `null`, la app está en "modo edición") y `filtro` (el texto escrito en el buscador). La pantalla se redibuja completa desde `render()` cada vez que el estado cambia.

## Delegación de eventos (C14)

En vez de poner un `addEventListener` en cada botón "Editar"/"Eliminar" de cada tarjeta (que habría que reconectar cada vez que `render()` destruye y crea las tarjetas de nuevo), se puso **un solo listener en el `<ul>` padre** (`listaPlantillas`):

```js
lista.addEventListener("click", function (evento) {
  const id = evento.target.dataset.id;

  if (evento.target.classList.contains("btn-eliminar")) eliminarPlantilla(id);
  if (evento.target.classList.contains("btn-editar"))   cargarEnFormulario(id);
});
```

Cuando el usuario hace clic en cualquier botón dentro de la lista, el clic "burbujea" hasta el `<ul>`. Ahí se revisa:

- **`evento.target`**: el elemento exacto donde se hizo clic.
- **`classList.contains(...)`**: si ese elemento tiene la clase `btn-editar` o `btn-eliminar`.
- **`dataset.id`**: lee el atributo `data-id="..."` del botón, para saber sobre qué plantilla actuar.

Así el listener funciona para 3 tarjetas o para 300, sin importar cuántas veces se destruyan y vuelvan a crear.

## CRUD inmutable

- **Eliminar** usa `.filter()`: crea un array nuevo sin la plantilla borrada, sin tocar el original.
- **Editar** usa `.map()` + spread (`{ ...plantilla, ... }`): crea un array nuevo donde solo la plantilla editada cambia; las demás se devuelven intactas.

## `contarPorHashtag()`: función pura para datos derivados

```js
function contarPorHashtag(plantillas) {
  return plantillas.reduce(function (conteo, plantilla) {
    conteo[plantilla.hashtag] = (conteo[plantilla.hashtag] || 0) + 1;
    return conteo;
  }, {});
}
```

Es una **función pura**: recibe el array de plantillas y devuelve un objeto `{ "#ventas": 2, "#soporte": 1 }` sin modificar nada externo (no toca `state`, no toca el DOM). Se usa dentro de `renderStats()` para pintar el panel de estadísticas con el total real de plantillas y un contador por cada hashtag. Como se llama en cada `render()`, el panel nunca queda desactualizado, sin importar si se agregó, editó, eliminó o filtró.

## Métodos de String usados y para qué

| Método | Dónde se usa | Para qué |
|---|---|---|
| `.trim()` | Formulario y buscador | Quitar espacios sobrantes al inicio/final. |
| `.toLowerCase()` | `normalizarHashtag()` y `plantillasVisibles()` | Unificar mayúsculas/minúsculas para comparar o guardar igual. |
| `.startsWith("#")` | `normalizarHashtag()` | Evitar duplicar el `#` si el usuario ya lo escribió. |
| `.length` | Validación del form y contador de caracteres en la tarjeta | Detectar campos vacíos / mostrar cuántos caracteres tiene el mensaje. |
| `.slice(0, 60)` | Tarjeta (Logro 2, C13) | Recortar el mensaje mostrado si es muy largo. |
| `.includes()` | `plantillasVisibles()` (buscador, C14) | Saber si el hashtag contiene el texto que escribió el usuario. |
| `.replaceAll("{nombre}", valor)` | `generarMensajeFinal()` | Reemplazar todas las apariciones de una variable por su valor real. |

## Persistencia con `localStorage` y JSON (C15)

Toda la lógica de guardado vive en `js/storage.js` (desde C16, un módulo ESM que `importa` el `state` que necesita en vez de depender del orden de los `<script>`).

**Guardar (`guardar()`):** `localStorage` solo puede almacenar texto, pero `state.plantillas` es un array de objetos. Por eso se "serializa" con `JSON.stringify()` antes de guardarlo:

```js
function guardar() {
  state.plantillas.length === 0
    ? localStorage.removeItem(CLAVE)
    : localStorage.setItem(CLAVE, JSON.stringify(state.plantillas));

  localStorage.setItem(CLAVE_FILTRO, state.filtro ?? "");
  // ...actualiza el indicador "Guardado ✓" / "Vacío"...
}
```

Se usa `removeItem()` en vez de guardar un array vacío `"[]"` cuando no queda ninguna plantilla, para que "Vaciar todo" limpie de verdad la clave del navegador. El filtro, al ya ser texto, se guarda directo, sin `JSON.stringify`.

`guardar()` se llama una sola vez, al final de `render()` — como **todo** cambio de estado (crear, editar, eliminar, filtrar, vaciar) termina en un `render()`, basta ese único punto para mantener siempre sincronizados el estado y lo guardado.

**Cargar (`cargar()`):** al reconstruir el array desde el texto guardado se usa `JSON.parse()`, protegido con `try/catch`:

```js
function cargar() {
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

**¿Por qué `try/catch`?** `JSON.parse()` lanza un error si el texto no es JSON válido (por ejemplo, si alguien edita el valor a mano en DevTools y lo deja mal formado). Sin el `try/catch`, ese error se propagaría y rompería toda la app al cargar. Con él, si el parseo falla, la app simplemente registra un aviso en consola y arranca con la lista vacía en vez de mostrar una pantalla rota.

**Detalle importante — las fechas:** JSON no sabe representar objetos `Date`, los convierte a texto plano. Al recargar la página, `plantilla.fecha` deja de ser un `Date` y pasa a ser un string. Por eso, en `render()`, la fecha se reconstruye antes de formatearla: `new Date(plantilla.fecha).toLocaleDateString("es-PE")`, sin importar si la plantilla se acaba de crear (con un `Date` real) o se acaba de cargar desde `localStorage` (con un string).

## Logros Adicionales implementados (C16)

- **Logro 1 — Cerrar al hacer clic fuera**: el modal se cierra si el clic cae exactamente en el fondo oscuro (`evento.target === modal`) y no en el cuadro blanco de adentro (sus hijos tienen otro `evento.target`).
- **Logro 2 — Orden alfabético**: tercera opción en el `<select id="orden">` que ordena con `a.titulo.localeCompare(b.titulo)`, respetando tildes y mayúsculas correctamente.
- **Logro 3 — Limpiar filtro**: botón ✕ dentro del buscador que vacía `state.filtro` y el input de un solo clic, sin borrar letra por letra.

## Historias de Usuario propias (Proyecto Integrador, Módulo 4)

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
- **Implementación:** `toggleFavorito(id)` en `state.js` alterna el campo `favorito` de forma inmutable (mismo patrón que `editarPlantilla`, con `.map()` + spread). El verdadero truco está en `ordenar()`: el comparador de `.sort()` primero compara `favorito` (`favB - favA`, así los `true` quedan antes que los `false`) y **solo si empatan** (ambas favoritas o ambas no favoritas) usa el criterio de orden normal como desempate. Visualmente, cada tarjeta favorita lleva además un anillo ámbar sutil (`ring-amber-400/40`) para distinguirse de un vistazo.

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

## Logros Adicionales implementados (C13)

- **Logro 1 — Contador de caracteres**: cada tarjeta muestra `plantilla.mensaje.length`.
- **Logro 2 — Recortar en la tarjeta**: mensajes de más de 60 caracteres se muestran recortados con `.slice(0, 60) + "…"`.
- **Logro 3 — Más variables**: el generador soporta `{nombre}` y `{producto}` encadenando dos `.replaceAll()`.

## Logros Adicionales implementados (C14)

- **Logro 1 — Cancelar edición**: botón "Cancelar edición" en el formulario. Pone `state.editandoId = null` y limpia el formulario, sin guardar ningún cambio, por si el usuario abrió "Editar" por error o se arrepiente.
- **Logro 2 — Hashtag más usado**: la función `hashtagMasUsado(porTag)` recibe el resultado de `contarPorHashtag()` y devuelve, con `.reduce()`, cuál hashtag tiene más plantillas. Se muestra en el panel de estadísticas como `⭐ Más usado: #hashtag (n)`.
- **Logro 3 — Confirmar al eliminar**: antes de borrar, se usa `confirm("¿Seguro que quieres eliminar esta plantilla?")`. Solo si el usuario acepta, se llama a `eliminarPlantilla()`. En la Clase 16 se reemplazará por un modal propio.

## Logros Adicionales implementados (C15)

- **Logro 1 — Exportar**: botón "Exportar (consola)" que imprime `JSON.stringify(state.plantillas, null, 2)` — el tercer argumento (`2`) le da sangría, para que el JSON se vea legible en la consola en vez de todo pegado en una línea.
- **Logro 2 — Contador persistente**: `registrarVisita()` en `storage.js` guarda, bajo otra clave (`whatsapp-templates-visitas`), cuántas veces se abrió la app. Se suma 1 cada vez que carga la página y se muestra debajo del título ("Abriste esta app N veces").
- **Logro 3 — Fecha de edición**: al guardar una edición, la plantilla actualizada recibe un campo `editadaEl: new Date()`. Si existe, la tarjeta muestra "✏️ Editada: [fecha]" debajo del mensaje. Al ser parte del objeto, `editadaEl` se persiste junto con el resto de la plantilla.

## Diseño visual

La interfaz sigue una línea "glassmorphism" oscura, inspirada en tarjetas de perfil tipo link-in-bio, aplicada al mundo de quien la construyó (programación / QA / documentación funcional):

- **Paleta**: fondo azul marino (`#0b1220`) con resplandores radiales sutiles y una grilla de líneas finas de fondo, tarjetas de "vidrio" (`.glass` / `.glass-row`: fondo translúcido + `backdrop-filter: blur`), acento celeste (`#38bdf8`) para el header y botones principales, y verde WhatsApp (`#25D366`) reservado para la acción de "Generar" (enviar mensaje), como guiño directo a la app.
- **Tipografía**: `Space Grotesk` para títulos, `Inter` para texto general y `JetBrains Mono` para hashtags, fechas y el indicador de estado.
- **Íconos SVG en vez de emojis**: editar, eliminar, copiar, generar, exportar y vaciar usan íconos vectoriales propios (trazo `currentColor`), no emojis — cada uno dentro de un botón circular a color (`.icon-btn`).
- **Tarjetas de plantilla estilo "fila de perfil"**: cada plantilla se pinta como una fila con un badge circular a color (con el ícono `#`), título, subtítulo (mensaje recortado) y los botones de acción a la derecha — el mismo patrón visual que las filas de LinkedIn/GitHub/WhatsApp de una tarjeta de perfil.
- **Hashtags con color determinista** (`colorPorHashtag()` / `badgePorHashtag()`): cada hashtag recibe siempre el mismo color (calculado a partir de sus propias letras), tanto en el chip de texto como en el badge del ícono — igual que las etiquetas de un issue tracker (Jira/GitHub Issues).

⚠️ Nota técnica: como los botones de acción ahora tienen un `<svg>` adentro, un clic puede caer en el ícono y no en el `<button>`. Por eso el listener de delegación de eventos usa `evento.target.closest(".btn-editar")` / `.closest(".btn-eliminar")` en vez de revisar `evento.target` directamente — así encuentra el botón correcto sin importar en qué parte exacta del ícono se hizo clic.

**Ajustes visuales posteriores:**
- El botón **"Cancelar edición"** empieza oculto (clase `hidden` en el HTML) y solo se muestra cuando `cargarEnFormulario()` activa el modo edición; se vuelve a ocultar al guardar los cambios o al pulsar "Cancelar". Es un cambio puramente visual: no toca la lógica de `state.editandoId` del Laboratorio 14.
- Se quitó el subtítulo de roles bajo el título.
- El fondo fusiona la grilla/resplandores azules con un guiño directo a WhatsApp: un patrón sutil tileado de burbuja de chat + doble check (✓✓) en verde, apenas visible.

## Estructura del proyecto (arquitectura modular ESM, C16)

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

## Módulos ESM (C16)

Hasta la Clase 15, todo el código vivía en 2-3 archivos que se comunicaban por **variables globales**, dependiendo de que `<script>` los cargara en el orden correcto. Desde C16, el proyecto usa **módulos ES (`export`/`import`)**:

- **`index.html`** carga un único script: `<script type="module" src="js/app.js"></script>`. Con `type="module"`, cada archivo tiene su propio ámbito (nada de variables globales) y el **orden ya no importa**: el navegador resuelve el árbol de `import` solo.
- **`models/Template.js`** exporta la clase `Template`.
- **`state.js`** exporta el estado central (`state`) y las funciones que leen/derivan datos: `agregarPlantilla`, `eliminarPlantilla`, `editarPlantilla`, `normalizarHashtag`, `contarPorHashtag`, `hashtagMasUsado`, `plantillasVisibles`. No toca el DOM: es puro manejo de datos.
- **`storage.js`** exporta `CLAVE`, `CLAVE_FILTRO`, `CLAVE_VISITAS`, `guardar`, `cargar`, `registrarVisita`. Importa `state` de `state.js` para saber qué persistir.
- **`ui.js`** importa de `state.js` y `storage.js` todo lo que necesita, y exporta únicamente `render()` — todo lo demás (los listeners, `eliminarPlantilla` con el modal, `cargarEnFormulario`, las funciones de color por hashtag) queda privado a este archivo, porque nadie más lo necesita.
- **`app.js`** no exporta nada: solo importa `state`, `cargar` y `render`, y arranca la app.

**¿Por qué separar así?** Cada archivo tiene una única responsabilidad: `state.js` es el "cerebro" de los datos, `storage.js` es la memoria persistente, `ui.js` es lo único que toca la pantalla. Si mañana hay que cambiar `localStorage` por una API real, solo se toca `storage.js`; si hay que cambiar el diseño, solo se toca `ui.js`.

## Modal de confirmación propio (HU1, C16)

Eliminar una plantilla o vaciar toda la colección ya no usa el `confirm()` nativo del navegador: ahora hay un modal propio (HTML + Tailwind) que empieza oculto con la clase `hidden`.

La pieza clave es que la acción a ejecutar se **guarda en una variable** (`accionPendiente`) en vez de ejecutarse directo:

```js
function pedirConfirmacion(texto, accion) {
  modalTexto.textContent = texto;
  accionPendiente = accion;
  modal.classList.remove("hidden");
}
```

Solo si el usuario pulsa "Eliminar" en el cuadro, se ejecuta `accionPendiente()`. Esto hace que **el mismo modal sirva para cualquier acción destructiva** (eliminar una plantilla puntual o vaciar todas), sin duplicar el cuadro de diálogo.

## Estados vacíos (HU2, C16)

`render()` distingue dos situaciones que antes se veían igual (una lista en blanco):

- **No hay ninguna plantilla creada todavía** → `"Aún no tienes plantillas. ¡Crea la primera! 🚀"`
- **Hay plantillas, pero el filtro actual no encuentra ninguna** → `"No se encontraron plantillas con ese filtro."`

La diferencia se calcula comparando `state.plantillas.length` (el total real) contra `plantillasVisibles().length` (lo que hay que mostrar tras filtrar y ordenar).

## Ordenar la colección (HU4, C16)

Un `<select id="orden">` permite elegir entre "Más recientes", "Más antiguas" y "Alfabético". El orden se guarda en `state.orden` y se aplica dentro de `plantillasVisibles()`, **después** de filtrar:

```js
function ordenar(plantillas) {
  const copia = [...plantillas]; // .sort() muta: copiamos antes de ordenar
  if (state.orden === "antiguas")    return copia.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  if (state.orden === "alfabetico")  return copia.sort((a, b) => a.titulo.localeCompare(b.titulo));
  return copia.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); // "recientes" (por defecto)
}
```

`.sort()` **muta** el array sobre el que se llama, por eso siempre se copia primero con el spread `[...plantillas]` — el mismo principio de inmutabilidad usado en el CRUD de la Clase 14.

## Cómo correrlo

⚠️ **Importante**: como el proyecto usa módulos ESM (`type="module"`), **no funciona abriendo `index.html` con doble clic** (protocolo `file://`). Necesitas un servidor local:

1. Clona el repositorio.
2. Ábrelo con **Live Server** (extensión de VS Code) o corre `python -m http.server` en la carpeta del proyecto.
3. Entra a `index.html` a través del servidor (`http://localhost:...`).

En GitHub Pages funciona sin ningún problema, porque ya sirve los archivos por HTTP.

## Despliegue

Publicado con GitHub Pages: `[agregar aquí el link una vez desplegado]`