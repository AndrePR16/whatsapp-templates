// ============================================================
// persistence.js
// Toda la lógica de guardar/cargar en localStorage vive aquí.
// Convención del proyecto: SIEMPRE usar las mismas claves (CLAVE
// y CLAVE_FILTRO) para no perder de vista dónde están los datos.
//
// Se carga ANTES que app.js. Aunque acá adentro se use "state",
// no hay problema: el CUERPO de una función se ejecuta recién
// cuando se LLAMA, no cuando se define. Para cuando render() llame
// a guardar(), app.js ya habrá creado "state".
// ============================================================

const CLAVE = "whatsapp-templates";           // clave para el array de plantillas
const CLAVE_FILTRO = "whatsapp-templates-filtro"; // clave para el texto del buscador


// ---------- HU1 (C15): Guardar el estado en localStorage ----------

// localStorage SOLO guarda texto (strings). Como state.plantillas
// es un array de objetos, hay que "serializarlo": convertirlo a
// texto con JSON.stringify antes de guardarlo.
function guardar() {
  // HU4 (C15): si no queda ninguna plantilla, removeItem() borra la
  // clave por completo. Si dejáramos siempre setItem(), "Vaciar todo"
  // guardaría un array vacío "[]" en vez de limpiar de verdad.
  state.plantillas.length === 0
    ? localStorage.removeItem(CLAVE)
    : localStorage.setItem(CLAVE, JSON.stringify(state.plantillas));

  // HU5 (C15): el filtro ya es texto, así que se guarda directo,
  // sin JSON.stringify (eso solo hace falta para objetos/arrays).
  localStorage.setItem(CLAVE_FILTRO, state.filtro ?? "");

  // HU4 (C15): pequeño indicador visual de que se guardó (o se vació).
  const estado = document.getElementById("estado");
  if (estado) {
    estado.textContent = state.plantillas.length > 0 ? "Guardado ✓" : "Vacío";
  }
}


// ---------- HU2 + HU3 (C15): Cargar el estado guardado, a prueba de errores ----------

// Lee lo guardado y lo "deserializa": reconstruye el array de
// objetos a partir del texto con JSON.parse.
//
// HU3: JSON.parse() puede fallar si el texto guardado está corrupto
// (por ejemplo, alguien lo editó a mano en DevTools y quedó inválido).
// Por eso todo el intento va dentro de un try/catch: si algo sale
// mal, avisamos por consola y devolvemos una lista vacía en vez de
// dejar que el error rompa toda la app.
function cargar() {
  const guardado = localStorage.getItem(CLAVE); // texto o null si no hay nada

  if (!guardado) return []; // nunca se guardó nada: arranca vacío

  try {
    return JSON.parse(guardado); // intenta reconstruir el array de objetos
  } catch (error) {
    console.warn("Datos corruptos en localStorage, empiezo de cero:", error);
    return []; // si el texto no es JSON válido, no rompas la app: lista vacía
  }
}