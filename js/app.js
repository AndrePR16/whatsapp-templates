// ============================================================
// app.js
// Aquí vive el ESTADO de la app y toda la lógica.
// Regla de oro de este proyecto: cambias el estado -> llamas render().
// ============================================================


// ---------- HU1: Estado central ----------

// Este objeto es la ÚNICA fuente de verdad de la app.
// Si una plantilla no está en state.plantillas, no existe
// para la app, aunque el usuario la haya escrito en el form.
const state = {
  plantillas: [],
};

// Crea una nueva plantilla (usando la clase Template) y la
// agrega al estado central. Nadie dibuja nada aquí todavía:
// esta función solo TOCA DATOS.
function agregarPlantilla(titulo, mensaje, hashtag) {
  const nueva = new Template(titulo, mensaje, hashtag);
  state.plantillas.push(nueva);
}


// ---------- HU3: Limpieza y normalización de texto ----------

// Un string en JS es un objeto: trae métodos que podemos llamar.
// Aquí encadenamos dos:
//   .trim()        -> quita espacios sobrantes al inicio/final
//   .toLowerCase() -> pasa todo a minúsculas
// Así, "  Ventas ", "VENTAS" y "ventas" terminan siendo el mismo texto.
function normalizarHashtag(texto) {
  const limpio = texto.trim().toLowerCase();

  // .startsWith() revisa si el string empieza con cierto texto.
  // Si el usuario ya escribió "#ventas", lo dejamos igual.
  // Si escribió solo "ventas", le agregamos el "#" nosotros.
  return limpio.startsWith("#") ? limpio : "#" + limpio;
}


// ---------- HU2: Referencias al DOM y patrón render() ----------

const lista = document.getElementById("listaPlantillas");
const selector = document.getElementById("selector"); // <select> del generador (HU4)

// render() es el corazón del patrón "estado -> pantalla".
// SIEMPRE hace lo mismo, sin importar qué cambió:
//   1. Limpia todo lo que había dibujado antes.
//   2. Recorre el estado ACTUAL de arriba a abajo.
//   3. Crea un nodo por cada dato y lo agrega a la pantalla.
// Así nunca quedan tarjetas viejas ni duplicadas: la pantalla
// siempre es un espejo fiel de state.plantillas.
function render() {
  // 1. Limpiar el contenedor de tarjetas
  lista.innerHTML = "";

  // 2. Recorrer el estado y 3. dibujar una tarjeta por plantilla
  state.plantillas.forEach(function (plantilla) {
    // El objeto Date que guardamos en el constructor no es texto,
    // así que lo convertimos a un formato legible para el usuario.
    const fechaTexto = plantilla.fecha.toLocaleDateString("es-PE");

    // --- Logro 2: recortar el mensaje en la tarjeta ---
    // .length nos dice cuántos caracteres tiene el mensaje.
    // Si supera los 60, mostramos solo los primeros 60 con .slice(0, 60)
    // y agregamos "…" para indicar que el texto continúa.
    // .slice() no modifica el string original: devuelve uno nuevo.
    const esLargo = plantilla.mensaje.length > 60;
    const mensajeMostrado = esLargo
      ? plantilla.mensaje.slice(0, 60) + "…"
      : plantilla.mensaje;

    const li = document.createElement("li");
    li.className = "bg-white p-4 rounded-lg shadow";
    li.innerHTML = `
      <div class="flex items-start justify-between gap-2">
        <strong class="text-slate-800">${plantilla.titulo}</strong>
        <span class="text-xs text-slate-400 shrink-0">${fechaTexto}</span>
      </div>
      <p class="text-sm text-slate-600 mt-1">${mensajeMostrado}</p>
      <div class="flex items-center justify-between mt-2">
        <span class="inline-block text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">${plantilla.hashtag}</span>
        <!-- Logro 1: contador de caracteres del mensaje completo (útil para WhatsApp) -->
        <span class="text-xs text-slate-400">${plantilla.mensaje.length} caracteres</span>
      </div>`;
    lista.appendChild(li);
  });

  // También refrescamos el <select> del generador (HU4) para que
  // siempre muestre la lista de plantillas al día.
  renderSelector();
}

// Llena el <select> con una <option> por cada plantilla.
// Usamos el índice del array como "value" para poder recuperar
// fácilmente la plantilla elegida más adelante.
function renderSelector() {
  selector.innerHTML = state.plantillas
    .map((plantilla, indice) => `<option value="${indice}">${plantilla.titulo}</option>`)
    .join("");
}


// ---------- HU2 + HU3: Conectar el formulario ----------

const form = document.getElementById("form-plantilla");
const titulo = document.getElementById("titulo");
const mensaje = document.getElementById("mensaje");
const hashtag = document.getElementById("hashtag");

form.addEventListener("submit", function (evento) {
  // Evita que el navegador recargue la página al enviar el form
  // (comportamiento por defecto de todo <form>).
  evento.preventDefault();

  // Limpiamos espacios sobrantes de título y mensaje ANTES de validar
  // y de guardar, para que nunca se cuele un "  Hola  " con espacios.
  const tituloTexto = titulo.value.trim();
  const mensajeTexto = mensaje.value.trim();

  // Validación: si título o mensaje quedan vacíos después del trim,
  // no dejamos avanzar (por ejemplo, si el usuario solo escribió espacios).
  if (tituloTexto.length === 0 || mensajeTexto.length === 0) {
    alert("Título y mensaje son obligatorios");
    return; // corta la función aquí, no se agrega nada al estado
  }

  // 1. Cambiamos el estado (agregamos la plantilla, ya limpia y normalizada)
  agregarPlantilla(tituloTexto, mensajeTexto, normalizarHashtag(hashtag.value));

  // 2. El estado cambió -> redibujamos TODO desde cero
  render();

  // Limpia los campos del formulario para la siguiente plantilla
  form.reset();
});


// ---------- HU4: Generador de mensaje final ----------

// Toma una plantilla y los valores reales, y devuelve el mensaje ya armado.
// .replaceAll() busca TODAS las apariciones de un marcador en el texto
// (no solo la primera, como haría .replace()) y las cambia por el valor real.
//
// Logro 3: encadenamos dos .replaceAll() para soportar dos variables
// distintas dentro del mismo mensaje: {nombre} y {producto}.
// Si el usuario no llenó "producto", igual reemplazamos {producto}
// por un string vacío para que no se quede el marcador sin reemplazar.
function generarMensajeFinal(plantilla, valorNombre, valorProducto) {
  return plantilla.mensaje
    .replaceAll("{nombre}", valorNombre)
    .replaceAll("{producto}", valorProducto);
}

const salida = document.getElementById("mensaje-final");
const valorNombre = document.getElementById("valorNombre");
const valorProducto = document.getElementById("valorProducto"); // Logro 3

document.getElementById("btn-generar").addEventListener("click", function () {
  // No hay plantillas todavía: no hacemos nada
  if (state.plantillas.length === 0) {
    alert("Primero crea al menos una plantilla");
    return;
  }

  // selector.value es un texto ("0", "1", ...), lo convertimos a
  // número con Number() para usarlo como índice del array.
  const plantillaElegida = state.plantillas[Number(selector.value)];
  const nombreReal = valorNombre.value.trim();
  const productoReal = valorProducto.value.trim(); // Logro 3

  // Mostramos el mensaje final con las variables ya reemplazadas.
  // Usamos textContent (no innerHTML) porque es texto plano del
  // usuario, no necesitamos interpretar HTML.
  salida.textContent = generarMensajeFinal(plantillaElegida, nombreReal, productoReal);
});

// Copia el mensaje generado al portapapeles usando la API del navegador.
document.getElementById("btn-copiar").addEventListener("click", function () {
  if (salida.textContent.length === 0) {
    alert("Primero genera un mensaje");
    return;
  }
  navigator.clipboard.writeText(salida.textContent);
});


// ---------- Primer dibujo al cargar la página ----------
// El estado empieza vacío, pero llamamos render() igual para que
// el <select> y la lista queden en un estado inicial consistente.
render();