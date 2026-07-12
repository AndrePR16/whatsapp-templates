// ============================================================
// state.js
// El estado central de la app y todas las funciones que LEEN
// o DERIVAN datos a partir de él. Nada de DOM aquí: este archivo
// no sabe que existen botones ni pantallas, solo datos.
// ============================================================

import { Template } from "./models/Template.js";

// Este objeto es la ÚNICA fuente de verdad de la app.
// Como es "export", cualquier otro módulo puede importarlo con
// "import { state } from './state.js'" y va a recibir SIEMPRE
// la misma referencia (el mismo objeto en memoria) — por eso,
// si un módulo cambia state.plantillas, todos los demás lo ven.
export const state = {
  plantillas: [],
  editandoId: null,  // null = creando. Con un id = editando esa plantilla.
  filtro: "",         // texto del buscador (HU4, C14)
  orden: "recientes", // "recientes" | "antiguas" | "alfabetico" (HU4, C16)
};


// ---------- Crear y normalizar (C13) ----------

// Crea una nueva plantilla (usando la clase Template) y la agrega
// al estado. No toca el DOM: solo cambia datos.
export function agregarPlantilla(titulo, mensaje, hashtag) {
  const nueva = new Template(titulo, mensaje, hashtag);
  state.plantillas.push(nueva);
}

// Un string en JS es un objeto: trae métodos que podemos llamar.
// Aquí encadenamos dos:
//   .trim()        -> quita espacios sobrantes al inicio/final
//   .toLowerCase() -> pasa todo a minúsculas
// Así, "  Ventas ", "VENTAS" y "ventas" terminan siendo el mismo texto.
export function normalizarHashtag(texto) {
  const limpio = texto.trim().toLowerCase();
  return limpio.startsWith("#") ? limpio : "#" + limpio;
}


// ---------- CRUD inmutable (C14) ----------

// .filter() NO modifica el array original: crea uno NUEVO que solo
// trae los elementos que cumplen la condición.
export function eliminarPlantilla(id) {
  state.plantillas = state.plantillas.filter(function (plantilla) {
    return plantilla.id !== id;
  });
}

// .map() tampoco muta: crea un array NUEVO. Solo la plantilla que
// coincide con el id se reemplaza por una copia actualizada
// (con spread ...plantilla); las demás vuelven intactas.
// Logro 3 (C15): además marcamos editadaEl con la fecha de edición.
export function editarPlantilla(id, datosNuevos) {
  state.plantillas = state.plantillas.map(function (plantilla) {
    if (plantilla.id === id) {
      return { ...plantilla, ...datosNuevos, editadaEl: new Date() };
    }
    return plantilla;
  });
}


// ---------- Datos derivados con funciones PURAS (C14) ----------

// Una función pura recibe datos y devuelve un resultado, SIN tocar
// nada de afuera. Por eso es fácil de entender y de probar.
export function contarPorHashtag(plantillas) {
  return plantillas.reduce(function (conteo, plantilla) {
    conteo[plantilla.hashtag] = (conteo[plantilla.hashtag] || 0) + 1;
    return conteo;
  }, {});
}

// Logro 2 (C14): a partir del conteo por hashtag, encuentra cuál es
// el más usado.
export function hashtagMasUsado(porTag) {
  const entradas = Object.entries(porTag);
  if (entradas.length === 0) return null;

  const mejor = entradas.reduce(function (mejorHastaAhora, entradaActual) {
    return entradaActual[1] > mejorHastaAhora[1] ? entradaActual : mejorHastaAhora;
  });

  return { hashtag: mejor[0], cantidad: mejor[1] };
}


// ---------- Ordenar la colección (HU4, C16) ----------

// .sort() ORDENA MUTANDO el array sobre el que se llama. Por eso
// primero copiamos con el spread [...plantillas]: así ordenamos la
// copia y state.plantillas (el original) queda intacto.
// El comparador (a, b) devuelve:
//   negativo -> "a" va antes que "b"
//   positivo -> "a" va después que "b"
function ordenar(plantillas) {
  const copia = [...plantillas];

  if (state.orden === "antiguas") {
    return copia.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  }

  if (state.orden === "alfabetico") {
    // Logro 2 (C16): orden alfabético con .localeCompare(), que
    // compara texto respetando tildes y mayúsculas correctamente
    // (mejor que usar < / > directamente).
    return copia.sort((a, b) => a.titulo.localeCompare(b.titulo));
  }

  // "recientes" (valor por defecto): las más nuevas primero.
  return copia.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}


// ---------- Filtro (HU4, C14) + Orden (HU4, C16) combinados ----------

// Este es el "dato derivado" que usa la interfaz para pintar la
// lista: no vive guardado en ningún lado, se recalcula cada vez
// a partir de state.plantillas, state.filtro y state.orden.
export function plantillasVisibles() {
  const filtroTexto = (state.filtro ?? "").trim().toLowerCase();

  const filtradas = filtroTexto === ""
    ? state.plantillas
    : state.plantillas.filter(function (plantilla) {
        return plantilla.hashtag.toLowerCase().includes(filtroTexto);
      });

  // Primero se filtra, LUEGO se ordena el resultado filtrado.
  return ordenar(filtradas);
}