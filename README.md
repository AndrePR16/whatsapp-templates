# Gestor de Plantillas para WhatsApp

App para crear, guardar y reutilizar plantillas de mensajes de WhatsApp. Proyecto del **Módulo 4 — Clase 13: Modelado de Datos y Manipulación de Texto**.

⚠️ **Todo vive en memoria.** Si recargas la página, se pierden las plantillas creadas. La persistencia con `localStorage` se agrega en la Clase 15.

## ¿Qué hace?

1. Crear una plantilla con título, mensaje (puede incluir la variable `{nombre}`) y hashtag.
2. Ver todas las plantillas en tarjetas, con su fecha de creación.
3. Elegir una plantilla, escribir un nombre real y generar el mensaje final con la variable ya reemplazada.
4. Copiar ese mensaje al portapapeles con un clic.

## La clase `Template`

Ubicada en `js/models/Template.js`. Modela qué información tiene **cada** plantilla:

```js
class Template {
  constructor(titulo, mensaje, hashtag) {
    this.titulo = titulo;
    this.mensaje = mensaje;
    this.hashtag = hashtag;
    this.fecha = new Date(); // se guarda automáticamente al crear la plantilla
  }
}
```

- `titulo`, `mensaje`, `hashtag`: los datos que escribe el usuario en el formulario.
- `fecha`: un objeto `Date` generado automáticamente en el constructor, con el momento exacto en que se creó la plantilla. Para mostrarla en pantalla se convierte a texto legible con `plantilla.fecha.toLocaleDateString("es-PE")`.

Todas las plantillas creadas se guardan en un **estado central** (`state.plantillas`, en `js/app.js`), que es la única fuente de verdad de la app. La pantalla se redibuja completa cada vez que el estado cambia, siguiendo el patrón `render()`.

## Métodos de String usados y para qué

| Método | Dónde se usa | Para qué |
|---|---|---|
| `.trim()` | Al leer `titulo`, `mensaje` y `hashtag` del formulario | Quitar espacios sobrantes al inicio/final, para que `" Ventas "` y `"Ventas"` se guarden igual. |
| `.toLowerCase()` | En `normalizarHashtag()` | Unificar mayúsculas/minúsculas: `"VENTAS"`, `"Ventas"` y `"ventas"` terminan siendo el mismo texto. |
| `.startsWith("#")` | En `normalizarHashtag()` | Revisar si el usuario ya escribió el `#` y evitar duplicarlo (`##ventas`). |
| `.length` | Al validar el formulario | Detectar campos vacíos (`titulo.length === 0`) y bloquear el envío si título o mensaje quedaron vacíos. |
| `.replaceAll("{nombre}", valor)` | En `generarMensajeFinal()` | Reemplazar **todas** las apariciones de la variable `{nombre}` dentro del mensaje por el valor real escrito por el usuario. |

## Logros Adicionales implementados

- **Logro 1 — Contador de caracteres**: cada tarjeta muestra `plantilla.mensaje.length` (el total de caracteres del mensaje completo, sin recortar), útil para controlar el límite de WhatsApp.
- **Logro 2 — Recortar en la tarjeta**: si `plantilla.mensaje.length` supera 60 caracteres, la tarjeta muestra el mensaje recortado con `plantilla.mensaje.slice(0, 60) + "…"` para que la rejilla se vea pareja. El mensaje completo se sigue guardando en el estado; solo se recorta lo que se **muestra**.
- **Logro 3 — Más variables**: el generador ahora soporta `{nombre}` **y** `{producto}` en el mismo mensaje, encadenando dos `.replaceAll()`:

```js
function generarMensajeFinal(plantilla, valorNombre, valorProducto) {
  return plantilla.mensaje
    .replaceAll("{nombre}", valorNombre)
    .replaceAll("{producto}", valorProducto);
}
```

Se agregó un segundo input ("Producto") en la sección "Usar plantilla" para capturar ese valor.

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