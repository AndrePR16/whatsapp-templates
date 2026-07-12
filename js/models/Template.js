// ============================================================
// Template.js
// Modela QUÉ ES una plantilla de WhatsApp.
// Cada vez que hacemos "new Template(...)" se crea un objeto
// con estos 4 datos. Esto es HU1 (C13): modelar la plantilla.
//
// C16: este archivo ahora es un MÓDULO ESM. "export" expone la
// clase para que cualquier otro archivo pueda traerla con
// "import { Template } from './models/Template.js'".
// ============================================================

export class Template {
  constructor(titulo, mensaje, hashtag) {
    // crypto.randomUUID() genera un texto único garantizado (ej: "3fa8...").
    // Lo necesitamos para saber, en un botón "Eliminar" o "Editar",
    // sobre CUÁL plantilla exacta actuar (el título podría repetirse,
    // el id nunca).
    this.id = crypto.randomUUID();

    this.titulo = titulo;     // texto corto que identifica la plantilla
    this.mensaje = mensaje;   // el contenido, puede traer variables como {nombre}
    this.hashtag = hashtag;   // etiqueta normalizada (ej: #ventas)

    // new Date() captura el momento EXACTO (fecha y hora) en que
    // se crea la plantilla. No lo escribimos nosotros: JavaScript
    // lo genera automáticamente al ejecutar esta línea.
    this.fecha = new Date();
  }
}