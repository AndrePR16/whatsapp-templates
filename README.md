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

Toda la lógica de guardado vive en `js/persistence.js`, cargado antes que `app.js` porque `app.js` llama a sus funciones (`guardar()`, `cargar()`).

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
- **Logro 2 — Contador persistente**: `registrarVisita()` en `persistence.js` guarda, bajo otra clave (`whatsapp-templates-visitas`), cuántas veces se abrió la app. Se suma 1 cada vez que carga la página y se muestra debajo del título ("Abriste esta app N veces").
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

## Estructura del proyecto

```
whatsapp-templates/
├── index.html
├── README.md
└── js/
    ├── app.js              # estado central, render(), lógica del form y del generador
    ├── persistence.js      # guardar()/cargar() con localStorage + JSON
    └── models/
        └── Template.js     # clase Template
```

## Cómo correrlo

1. Clona el repositorio.
2. Ábrelo con **Live Server** (extensión de VS Code) o cualquier servidor estático.
3. Abre `index.html` en el navegador.

## Despliegue

Publicado con GitHub Pages: `[agregar aquí el link una vez desplegado]`