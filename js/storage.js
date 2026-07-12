// ============================================================
// storage.js
// Toda la lógica de guardar/cargar en localStorage vive aquí.
// Este archivo NO toca el DOM: solo lee y escribe en el
// almacenamiento del navegador a partir del estado.
//
// C16: antes (persistence.js) dependíamos del ORDEN de los
// <script> para que esto funcionara con "state" como variable
// global. Con ESM ya no hace falta: importamos "state"
// explícitamente, sin depender de en qué orden se cargue nada.
// ============================================================

import { state } from "./state.js";

export const CLAVE = "whatsapp-templates";              // array de plantillas
export const CLAVE_FILTRO = "whatsapp-templates-filtro"; // texto del buscador
export const CLAVE_VISITAS = "whatsapp-templates-visitas"; // Logro 2 (C15)


// ---------- Guardar el estado en localStorage (C15) ----------

// localStorage SOLO guarda texto. Como state.plantillas es un
// array de objetos, hay que "serializarlo" con JSON.stringify
// antes de guardarlo.
export function guardar() {
  // Si no queda ninguna plantilla, removeItem() borra la clave
  // por completo, en vez de dejar guardado un "[]" vacío.
  state.plantillas.length === 0
    ? localStorage.removeItem(CLAVE)
    : localStorage.setItem(CLAVE, JSON.stringify(state.plantillas));

  // El filtro ya es texto, así que se guarda directo, sin JSON.stringify.
  localStorage.setItem(CLAVE_FILTRO, state.filtro ?? "");
}


// ---------- Cargar el estado guardado, a prueba de errores (C15) ----------

// JSON.parse() puede fallar si el texto guardado está corrupto
// (por ejemplo, editado a mano en DevTools). El try/catch evita
// que ese error rompa toda la app: si falla, devolvemos [].
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


// ---------- Logro 2 (C15): contador persistente de aperturas ----------

// Cada vez que se llama, suma 1 al contador guardado y devuelve
// el nuevo total. Usa su propia clave, separada de las plantillas.
export function registrarVisita() {
  const guardado = localStorage.getItem(CLAVE_VISITAS);
  const visitasPrevias = guardado ? Number(guardado) : 0;
  const visitasActuales = visitasPrevias + 1;
  localStorage.setItem(CLAVE_VISITAS, String(visitasActuales));
  return visitasActuales;
}