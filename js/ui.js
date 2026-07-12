// ============================================================
// ui.js
// Todo lo que TOCA EL DOM vive aquí: render(), los listeners de
// clic/submit/input, el modal de confirmación y las tarjetas.
// Importa de state.js y storage.js lo que necesita, sin variables
// globales.
// ============================================================

import { guardar, registrarVisita } from "./storage.js";
import {
  state,
  agregarPlantilla,
  eliminarPlantilla as eliminarDelEstado,
  editarPlantilla,
  normalizarHashtag,
  contarPorHashtag,
  hashtagMasUsado,
  plantillasVisibles,
} from "./state.js";


// ---------- Referencias al DOM (una sola vez, al cargar el módulo) ----------

const lista = document.getElementById("listaPlantillas");
const selector = document.getElementById("selector");
const panelStats = document.getElementById("panel-stats");
const form = document.getElementById("form-plantilla");
const titulo = document.getElementById("titulo");
const mensaje = document.getElementById("mensaje");
const hashtag = document.getElementById("hashtag");
const salida = document.getElementById("mensaje-final");
const valorNombre = document.getElementById("valorNombre");
const valorProducto = document.getElementById("valorProducto");
const btnCancelar = document.getElementById("btn-cancelar");


// ---------- Diseño: color determinista por hashtag ----------

const PALETA_HASHTAG = [
  "bg-rose-500/15 text-rose-300",
  "bg-sky-500/15 text-sky-300",
  "bg-violet-500/15 text-violet-300",
  "bg-amber-500/15 text-amber-300",
  "bg-teal-500/15 text-teal-300",
  "bg-pink-500/15 text-pink-300",
  "bg-indigo-500/15 text-indigo-300",
];

const PALETA_BADGE = [
  "bg-rose-500", "bg-sky-500", "bg-violet-500", "bg-amber-500",
  "bg-teal-500", "bg-pink-500", "bg-indigo-500",
];

function indicePorHashtag(texto) {
  let suma = 0;
  for (let i = 0; i < texto.length; i++) suma += texto.charCodeAt(i);
  return suma % PALETA_HASHTAG.length;
}

function colorPorHashtag(texto) {
  return PALETA_HASHTAG[indicePorHashtag(texto)];
}

function badgePorHashtag(texto) {
  return PALETA_BADGE[indicePorHashtag(texto)];
}


// ---------- HU1 (C16): Modal de confirmación propio ----------

const modal = document.getElementById("modal");
const modalTexto = document.getElementById("modal-texto");
let accionPendiente = null; // qué función ejecutar si el usuario confirma

// Cualquier acción "peligrosa" (eliminar una plantilla, vaciar todo)
// pasa por aquí: en vez de ejecutarse de una, se GUARDA en
// accionPendiente y se muestra el modal. Solo se ejecuta si el
// usuario pulsa "Eliminar" en el cuadro. Así el mismo modal sirve
// para cualquier acción destructiva, sin repetir código.
function pedirConfirmacion(texto, accion) {
  modalTexto.textContent = texto;
  accionPendiente = accion;
  modal.classList.remove("hidden");
}

function cerrarModal() {
  modal.classList.add("hidden");
  accionPendiente = null;
}

document.getElementById("modal-cancelar").addEventListener("click", cerrarModal);

document.getElementById("modal-confirmar").addEventListener("click", function () {
  if (accionPendiente) accionPendiente();
  cerrarModal();
});

// Logro 1 (C16): cerrar el modal si el usuario hace clic en el fondo
// oscuro (el "backdrop"), no en el cuadro blanco de adentro.
// evento.target es el elemento EXACTO donde cayó el clic: si es el
// propio div #modal (el fondo), y no alguno de sus hijos, cerramos.
modal.addEventListener("click", function (evento) {
  if (evento.target === modal) {
    cerrarModal();
  }
});


// ---------- HU1/HU2 (C14) + HU1 (C16): eliminar y cargar en formulario ----------

function eliminarPlantilla(id) {
  pedirConfirmacion("¿Eliminar esta plantilla? Esta acción no se puede deshacer.", function () {
    eliminarDelEstado(id); // función pura de state.js: quita la plantilla del array
    render();              // el estado cambió -> redibujamos (y guardamos)
  });
}

function cargarEnFormulario(id) {
  const plantilla = state.plantillas.find(function (p) {
    return p.id === id;
  });
  if (!plantilla) return;

  titulo.value = plantilla.titulo;
  mensaje.value = plantilla.mensaje;
  hashtag.value = plantilla.hashtag;
  state.editandoId = id;

  // Mejora visual: el botón "Cancelar edición" solo tiene sentido
  // mientras se está editando, así que aparece recién aquí.
  btnCancelar.classList.remove("hidden");
  titulo.focus();
}


// ---------- HU2 (C16): render() con estados vacíos ----------

function render() {
  const visibles = plantillasVisibles();
  lista.innerHTML = "";

  if (visibles.length === 0) {
    // Dos "vacíos" distintos: no hay NADA creado todavía, o hay
    // plantillas pero el filtro actual no encuentra ninguna.
    const mensajeVacio = state.plantillas.length === 0
      ? "Aún no tienes plantillas. ¡Crea la primera! 🚀"
      : "No se encontraron plantillas con ese filtro.";

    lista.innerHTML = `
      <li class="sm:col-span-2 glass-row rounded-xl py-10 px-4 text-center text-slate-400">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-10 h-10 mx-auto mb-3 text-slate-600">
          <path d="M21 8v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/>
          <path d="M3 8l2-5h14l2 5"/>
          <path d="M3 8h18"/>
          <path d="M9 12h6"/>
        </svg>
        <p class="text-sm">${mensajeVacio}</p>
      </li>`;
  } else {
    visibles.forEach(function (plantilla) {
      // JSON no sabe guardar objetos Date: al recargar, plantilla.fecha
      // es un string. new Date(...) funciona igual recién creada o cargada.
      const fechaTexto = new Date(plantilla.fecha).toLocaleDateString("es-PE");

      const esLargo = plantilla.mensaje.length > 60;
      const mensajeMostrado = esLargo ? plantilla.mensaje.slice(0, 60) + "…" : plantilla.mensaje;

      const textoEditada = plantilla.editadaEl
        ? `<p class="text-[10px] text-slate-400 mt-1">✏️ Editada: ${new Date(plantilla.editadaEl).toLocaleDateString("es-PE")}</p>`
        : "";

      const li = document.createElement("li");
      li.className = "glass-row rounded-xl p-3 flex flex-col gap-2 sm:col-span-1";
      li.innerHTML = `
        <div class="flex items-start gap-3">
          <div class="icon-badge ${badgePorHashtag(plantilla.hashtag)} text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M4 9h16"/><path d="M4 15h16"/><path d="M10 3 8 21"/><path d="M16 3l-2 18"/></svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <strong class="text-slate-100 truncate">${plantilla.titulo}</strong>
              <span class="text-[10px] text-slate-500 shrink-0 font-mono-ui">${fechaTexto}</span>
            </div>
            <p class="text-sm text-slate-400 mt-0.5">${mensajeMostrado}</p>
            ${textoEditada}
          </div>
        </div>
        <div class="flex items-center justify-between pl-[52px]">
          <div class="flex items-center gap-2">
            <span class="inline-block text-[11px] font-mono-ui px-2 py-0.5 rounded-full ${colorPorHashtag(plantilla.hashtag)}">${plantilla.hashtag}</span>
            <span class="text-[10px] text-slate-500 font-mono-ui">${plantilla.mensaje.length} car.</span>
          </div>
          <div class="flex gap-1">
            <button class="btn-editar icon-btn bg-sky-500/10 hover:bg-sky-500/20 text-sky-300" data-id="${plantilla.id}" title="Editar">
              <svg class="w-3.5 h-3.5 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L18.5 9.5a2.121 2.121 0 0 0-3-3L5 17v3z"/><path d="M13.5 6.5l3 3"/></svg>
            </button>
            <button class="btn-eliminar icon-btn bg-red-500/10 hover:bg-red-500/20 text-red-400" data-id="${plantilla.id}" title="Eliminar">
              <svg class="w-3.5 h-3.5 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h14"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M7 7l1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13"/></svg>
            </button>
          </div>
        </div>`;
      lista.appendChild(li);
    });
  }

  renderSelector();
  renderStats();
  guardar(); // el estado ya cambió (crear/editar/eliminar/filtrar/ordenar) -> persistir

  // El indicador de guardado vive en la interfaz (ui.js), no en storage.js:
  // guardar() solo persiste datos, la pantalla la actualiza quien la dibuja.
  const estado = document.getElementById("estado");
  if (estado) estado.textContent = state.plantillas.length > 0 ? "Guardado ✓" : "Vacío";
}

function renderSelector() {
  selector.innerHTML = state.plantillas
    .map((plantilla, indice) => `<option value="${indice}">${plantilla.titulo}</option>`)
    .join("");
}

function renderStats() {
  const total = state.plantillas.length;
  const porTag = contarPorHashtag(state.plantillas);

  const etiquetas = Object.entries(porTag)
    .map(([tag, cantidad]) =>
      `<span class="text-xs font-mono-ui px-2 py-0.5 rounded-full ${colorPorHashtag(tag)}">${tag} · ${cantidad}</span>`)
    .join("");

  const masUsado = hashtagMasUsado(porTag);
  const textoMasUsado = masUsado
    ? `<span class="text-xs text-amber-400 font-mono-ui">⭐ Más usado: ${masUsado.hashtag} (${masUsado.cantidad})</span>`
    : "";

  panelStats.innerHTML = `
    <div class="flex items-center gap-2 flex-wrap">
      <span class="text-sm font-display font-semibold text-[var(--accent-azul)]">${total} plantilla(s)</span>
      ${etiquetas}
      ${textoMasUsado}
    </div>`;
}


// ---------- Delegación de eventos en la lista (C14, adaptada al modal C16) ----------

// .closest() sube por los ancestros del elemento clickeado hasta
// encontrar el que tiene esa clase, así funciona sin importar si
// el clic cayó en el <button> o en el <svg>/<path> de adentro.
lista.addEventListener("click", function (evento) {
  const botonEliminar = evento.target.closest(".btn-eliminar");
  const botonEditar = evento.target.closest(".btn-editar");

  if (botonEliminar) eliminarPlantilla(botonEliminar.dataset.id);
  if (botonEditar) cargarEnFormulario(botonEditar.dataset.id);
});


// ---------- Formulario: crear o editar ----------

form.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const tituloTexto = titulo.value.trim();
  const mensajeTexto = mensaje.value.trim();

  if (tituloTexto.length === 0 || mensajeTexto.length === 0) {
    alert("Título y mensaje son obligatorios");
    return;
  }

  const hashtagNormalizado = normalizarHashtag(hashtag.value);

  if (state.editandoId) {
    editarPlantilla(state.editandoId, { titulo: tituloTexto, mensaje: mensajeTexto, hashtag: hashtagNormalizado });
    state.editandoId = null;
    btnCancelar.classList.add("hidden"); // ya no se está editando: se vuelve a ocultar
  } else {
    agregarPlantilla(tituloTexto, mensajeTexto, hashtagNormalizado);
  }

  render();
  form.reset();
});

btnCancelar.addEventListener("click", function () {
  state.editandoId = null;
  form.reset();
  btnCancelar.classList.add("hidden");
});


// ---------- Buscador (HU4, C14) ----------

document.getElementById("buscador").addEventListener("input", function (evento) {
  state.filtro = evento.target.value;
  render();
});

// Logro 3 (C16): botón ✕ que borra el buscador y vuelve a mostrar todas
// las plantillas, sin tener que borrar el texto letra por letra.
document.getElementById("btn-limpiar-filtro").addEventListener("click", function () {
  const buscador = document.getElementById("buscador");
  buscador.value = "";
  state.filtro = "";
  render();
  buscador.focus();
});


// ---------- HU4 (C16): selector de orden ----------

document.getElementById("orden").addEventListener("change", function (evento) {
  state.orden = evento.target.value;
  render();
});


// ---------- Vaciar toda la colección (con modal de confirmación) ----------

document.getElementById("btn-vaciar").addEventListener("click", function () {
  pedirConfirmacion("Esto borrará TODAS tus plantillas. ¿Continuar?", function () {
    state.plantillas = [];
    render(); // render -> guardar(); como queda vacío, guardar() usa removeItem()
  });
});


// ---------- Logro 1 (C15): exportar en formato JSON legible ----------

document.getElementById("btn-exportar").addEventListener("click", function () {
  console.log(JSON.stringify(state.plantillas, null, 2));
  alert("Tus plantillas se imprimieron en la consola (F12) en formato JSON.");
});


// ---------- Generador de mensaje final (HU4, C13) ----------

function generarMensajeFinal(plantilla, valorNombreTexto, valorProductoTexto) {
  return plantilla.mensaje
    .replaceAll("{nombre}", valorNombreTexto)
    .replaceAll("{producto}", valorProductoTexto);
}

document.getElementById("btn-generar").addEventListener("click", function () {
  if (state.plantillas.length === 0) {
    alert("Primero crea al menos una plantilla");
    return;
  }
  const plantillaElegida = state.plantillas[Number(selector.value)];
  const nombreReal = valorNombre.value.trim();
  const productoReal = valorProducto.value.trim();
  salida.textContent = generarMensajeFinal(plantillaElegida, nombreReal, productoReal);
});

document.getElementById("btn-copiar").addEventListener("click", function () {
  if (salida.textContent.length === 0) {
    alert("Primero genera un mensaje");
    return;
  }
  navigator.clipboard.writeText(salida.textContent);
});


// ---------- Contador persistente de aperturas (Logro 2, C15) ----------

const contadorVisitas = document.getElementById("contador-visitas");
if (contadorVisitas) {
  contadorVisitas.textContent = `Abriste esta app ${registrarVisita()} veces`;
}


// render() se exporta porque es lo único que app.js necesita para
// arrancar la pantalla; todo lo demás de este archivo es privado.
export { render };