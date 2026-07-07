# Gestor de Plantillas para WhatsApp

App para crear, guardar y reutilizar plantillas de mensajes de WhatsApp. Proyecto del **Módulo 4**, en construcción a lo largo de las clases 13 a 16.

⚠️ **Todo vive en memoria.** Si recargas la página, se pierden las plantillas creadas. La persistencia con `localStorage` se agrega en la Clase 15.

## ¿Qué hace? (hasta C14)

1. Crear una plantilla con título, mensaje (puede incluir `{nombre}` y `{producto}`) y hashtag.
2. Ver todas las plantillas en tarjetas, con su fecha de creación y contador de caracteres.
3. **Editar** una plantilla existente: sus datos se cargan en el formulario y, al guardar, se actualiza en su lugar (no se duplica).
4. **Eliminar** una plantilla puntual sin afectar las demás.
5. Ver un **panel de estadísticas**: total de plantillas y conteo por hashtag, siempre actualizado.
6. **Filtrar** la lista escribiendo un hashtag en el buscador.
7. Elegir una plantilla, escribir un nombre/producto real y generar el mensaje final con las variables reemplazadas.
8. Copiar ese mensaje al portapapeles con un clic.

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

## Logros Adicionales implementados (C13)

- **Logro 1 — Contador de caracteres**: cada tarjeta muestra `plantilla.mensaje.length`.
- **Logro 2 — Recortar en la tarjeta**: mensajes de más de 60 caracteres se muestran recortados con `.slice(0, 60) + "…"`.
- **Logro 3 — Más variables**: el generador soporta `{nombre}` y `{producto}` encadenando dos `.replaceAll()`.

## Logros Adicionales implementados (C14)

- **Logro 1 — Cancelar edición**: botón "Cancelar edición" en el formulario. Pone `state.editandoId = null` y limpia el formulario, sin guardar ningún cambio, por si el usuario abrió "Editar" por error o se arrepiente.
- **Logro 2 — Hashtag más usado**: la función `hashtagMasUsado(porTag)` recibe el resultado de `contarPorHashtag()` y devuelve, con `.reduce()`, cuál hashtag tiene más plantillas. Se muestra en el panel de estadísticas como `⭐ Más usado: #hashtag (n)`.
- **Logro 3 — Confirmar al eliminar**: antes de borrar, se usa `confirm("¿Seguro que quieres eliminar esta plantilla?")`. Solo si el usuario acepta, se llama a `eliminarPlantilla()`. En la Clase 16 se reemplazará por un modal propio.

## Estructura del proyecto

```
whatsapp-templates/
├── index.html
├── README.md
└── js/
    ├── app.js              # estado central, render(), lógica del form y del generador
    └── models/
        └── Template.js     # clase Template
```

## Cómo correrlo

1. Clona el repositorio.
2. Ábrelo con **Live Server** (extensión de VS Code) o cualquier servidor estático.
3. Abre `index.html` en el navegador.

## Despliegue

Publicado con GitHub Pages: `[agregar aquí el link una vez desplegado]`