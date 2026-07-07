// ============================================================
// Template.js
// Modela QUÉ ES una plantilla de WhatsApp.
// Cada vez que hacemos "new Template(...)" se crea un objeto
// con estos 4 datos. Esto es HU1: modelar la plantilla.
// ============================================================

class Template {
  constructor(titulo, mensaje, hashtag) {
    this.titulo = titulo;     // texto corto que identifica la plantilla
    this.mensaje = mensaje;   // el contenido, puede traer variables como {nombre}
    this.hashtag = hashtag;   // etiqueta normalizada (ej: #ventas)

    // new Date() captura el momento EXACTO (fecha y hora) en que
    // se crea la plantilla. No lo escribimos nosotros: JavaScript
    // lo genera automáticamente al ejecutar esta línea.
    this.fecha = new Date();
  }
}

// No usamos "export" porque este proyecto carga los scripts
// directamente con <script> en el HTML (sin módulos ES).
// Al cargarse antes que app.js, la clase Template ya está
// disponible como una variable global cuando app.js se ejecuta.
