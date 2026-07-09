// ============================================================
// app.js
// Aquí vive el ESTADO de la app y toda la lógica.
// Regla de oro de este proyecto: cambias el estado -> llamas render().
// ============================================================


// ---------- HU1 (C13): Estado central ----------

// Este objeto es la ÚNICA fuente de verdad de la app.
// Si una plantilla no está en state.plantillas, no existe
// para la app, aunque el usuario la haya escrito en el form.
//
// C14 agrega dos campos nuevos al estado, que NO son plantillas
// sino "modo de la UI": editandoId (¿estamos editando algo?) y
// filtro (¿qué escribió el usuario en el buscador?).
const state = {
  plantillas: [],
  editandoId: null,  // null = estamos creando. Si tiene un id, estamos editando esa plantilla.
  filtro: "",         // texto del buscador (HU4 de C14)
};

// Crea una nueva plantilla (usando la clase Template) y la
// agrega al estado central. Nadie dibuja nada aquí todavía:
// esta función solo TOCA DATOS.
function agregarPlantilla(titulo, mensaje, hashtag) {
  const nueva = new Template(titulo, mensaje, hashtag);
  state.plantillas.push(nueva);
}


// ---------- HU3 (C13): Limpieza y normalización de texto ----------

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


// ---------- HU1 (C14): Eliminar una plantilla, sin mutar el estado ----------

// .filter() NO modifica el array original: crea uno NUEVO que solo
// trae los elementos que cumplen la condición. Aquí nos quedamos con
// "todas las plantillas cuyo id sea DISTINTO al que queremos borrar",
// que es justo lo mismo que "eliminar esa plantilla".
function eliminarPlantilla(id) {
  state.plantillas = state.plantillas.filter(function (plantilla) {
    return plantilla.id !== id;
  });
  render(); // el estado cambió -> redibujamos
}


// ---------- HU2 (C14): Cargar una plantilla en el formulario para editarla ----------

// Busca la plantilla por id y copia sus datos en los inputs del form.
// Además guarda su id en state.editandoId, que es la "bandera" que
// usaremos en el submit para saber si hay que CREAR o ACTUALIZAR.
function cargarEnFormulario(id) {
  const plantilla = state.plantillas.find(function (plantilla) {
    return plantilla.id === id;
  });
  if (!plantilla) return; // por seguridad, si no la encuentra no hace nada

  titulo.value = plantilla.titulo;
  mensaje.value = plantilla.mensaje;
  hashtag.value = plantilla.hashtag;
  state.editandoId = id;

  // Mejora visual: el botón "Cancelar edición" solo tiene sentido mientras
  // se está editando algo, así que lo mostramos recién aquí (estaba oculto
  // con la clase "hidden" desde el HTML).
  document.getElementById("btn-cancelar").classList.remove("hidden");

  // Detalle de UX: llevamos el foco al formulario para que el usuario
  // vea de inmediato que ya está editando.
  titulo.focus();
}


// ---------- HU3 (C14): Datos derivados con una función PURA ----------

// Una función pura recibe datos y devuelve un resultado, SIN tocar
// nada de afuera (no lee ni escribe "state" directamente, no toca
// el DOM). Por eso es fácil de entender y de probar: mismos datos
// de entrada -> siempre el mismo resultado.
//
// .reduce() recorre el array y va "acumulando" un resultado.
// Aquí el acumulador es un objeto { hashtag: cantidad, ... }.
function contarPorHashtag(plantillas) {
  return plantillas.reduce(function (conteo, plantilla) {
    const elHashtag = plantilla.hashtag;
    // Si el hashtag ya existe en el acumulador, le sumamos 1.
    // Si no existe todavía, empieza en 1.
    conteo[elHashtag] = (conteo[elHashtag] || 0) + 1;
    return conteo; // .reduce necesita que devolvamos el acumulador en cada vuelta
  }, {}); // {} es el acumulador inicial: "caja" vacía
}

// Logro 2 (C14): a partir del conteo por hashtag, encuentra cuál es
// el más usado. También es una función pura: recibe el objeto de
// conteo y devuelve un resultado, sin tocar nada externo.
function hashtagMasUsado(porTag) {
  const entradas = Object.entries(porTag); // [["#ventas", 2], ["#soporte", 1]]
  if (entradas.length === 0) return null;   // no hay plantillas todavía

  // .reduce() para quedarnos con la entrada de mayor cantidad.
  // "mejor" es la entrada [hashtag, cantidad] más alta vista hasta ahora.
  const mejor = entradas.reduce(function (mejorHastaAhora, entradaActual) {
    return entradaActual[1] > mejorHastaAhora[1] ? entradaActual : mejorHastaAhora;
  });

  return { hashtag: mejor[0], cantidad: mejor[1] };
}


// ---------- HU4 (C14): Vista filtrada (dato derivado, no se guarda) ----------

// Esta función tampoco muta el estado: solo CALCULA qué plantillas
// se deben mostrar, según el texto del buscador. state.plantillas
// sigue teniendo TODAS las plantillas siempre.
function plantillasVisibles() {
  const filtroTexto = state.filtro.trim().toLowerCase();

  // Si no hay filtro, se muestran todas tal cual.
  if (filtroTexto === "") return state.plantillas;

  // .includes() revisa si un texto contiene otro texto adentro.
  // Filtramos las plantillas cuyo hashtag incluye lo que el usuario escribió.
  return state.plantillas.filter(function (plantilla) {
    return plantilla.hashtag.toLowerCase().includes(filtroTexto);
  });
}


// ---------- Diseño: color determinista por hashtag ----------

// Le da a cada hashtag un color consistente (como las etiquetas de
// Jira/GitHub Issues), calculado a partir de sus propias letras. El
// mismo hashtag SIEMPRE cae en el mismo color, sin necesidad de
// guardarlo en el estado.
const PALETA_HASHTAG = [
  "bg-rose-500/15 text-rose-300",
  "bg-sky-500/15 text-sky-300",
  "bg-violet-500/15 text-violet-300",
  "bg-amber-500/15 text-amber-300",
  "bg-teal-500/15 text-teal-300",
  "bg-pink-500/15 text-pink-300",
  "bg-indigo-500/15 text-indigo-300",
];

// La misma paleta, pero como color SÓLIDO de fondo para el "badge" circular
// de cada tarjeta (necesita más contraste que el chip de texto).
const PALETA_BADGE = [
  "bg-rose-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-teal-500",
  "bg-pink-500",
  "bg-indigo-500",
];

function indicePorHashtag(hashtag) {
  let suma = 0;
  for (let i = 0; i < hashtag.length; i++) {
    suma += hashtag.charCodeAt(i);
  }
  return suma % PALETA_HASHTAG.length;
}

function colorPorHashtag(hashtag) {
  return PALETA_HASHTAG[indicePorHashtag(hashtag)];
}

function badgePorHashtag(hashtag) {
  return PALETA_BADGE[indicePorHashtag(hashtag)];
}


// ---------- HU2 (C13) + HU1/HU2/HU3/HU4 (C14): render() ----------

const lista = document.getElementById("listaPlantillas");
const selector = document.getElementById("selector");     // <select> del generador
const panelStats = document.getElementById("panel-stats"); // panel de estadísticas

// render() sigue siendo el corazón del patrón "estado -> pantalla".
// SIEMPRE hace lo mismo, sin importar qué cambió (agregar, editar,
// eliminar o filtrar):
//   1. Limpia todo lo que había dibujado antes.
//   2. Recorre lo que HAY QUE MOSTRAR (plantillasVisibles(), no
//      siempre state.plantillas completo).
//   3. Crea un nodo por cada dato y lo agrega a la pantalla.
//   4. Refresca el selector y las estadísticas.
function render() {
  lista.innerHTML = "";

  plantillasVisibles().forEach(function (plantilla) {
    // HU2 (C15): JSON no sabe guardar objetos Date, los convierte a texto.
    // Al recargar la página, plantilla.fecha ya NO es un objeto Date sino
    // un string. Por eso lo envolvemos en new Date(...) de nuevo antes de
    // llamar a .toLocaleDateString(): así funciona recién creada o recién cargada.
    const fechaTexto = new Date(plantilla.fecha).toLocaleDateString("es-PE");

    // Logro 2 (C13): recortar el mensaje si es muy largo, solo para mostrarlo.
    const esLargo = plantilla.mensaje.length > 60;
    const mensajeMostrado = esLargo
      ? plantilla.mensaje.slice(0, 60) + "…"
      : plantilla.mensaje;

    // Logro 3 (C15): si la plantilla tiene editadaEl, la mostramos.
    // El operador ternario decide entre mostrar el texto o una cadena vacía.
    const textoEditada = plantilla.editadaEl
      ? `<p class="text-[10px] text-slate-400 mt-1">✏️ Editada: ${new Date(plantilla.editadaEl).toLocaleDateString("es-PE")}</p>`
      : "";

    const li = document.createElement("li");
    li.className = "glass-row rounded-xl p-3 flex flex-col gap-2 sm:col-span-1";
    li.innerHTML = `
      <div class="flex items-start gap-3">
        <!-- Badge circular con el ícono "#", coloreado según el hashtag (Logro visual) -->
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
        <!-- HU1/HU2 (C14): botones de acciones, cada uno con data-id -->
        <!-- para que la delegación de eventos sepa sobre CUÁL plantilla actuar. -->
        <div class="flex gap-1">
          <button class="btn-editar icon-btn bg-sky-500/10 hover:bg-sky-500/20 text-sky-300" data-id="${plantilla.id}" title="Editar">
            <svg class="w-3.5 h-3.5 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-id="${plantilla.id}"><path d="M4 20h4L18.5 9.5a2.121 2.121 0 0 0-3-3L5 17v3z" data-id="${plantilla.id}"/><path d="M13.5 6.5l3 3" data-id="${plantilla.id}"/></svg>
          </button>
          <button class="btn-eliminar icon-btn bg-red-500/10 hover:bg-red-500/20 text-red-400" data-id="${plantilla.id}" title="Eliminar">
            <svg class="w-3.5 h-3.5 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-id="${plantilla.id}"><path d="M5 7h14" data-id="${plantilla.id}"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" data-id="${plantilla.id}"/><path d="M7 7l1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" data-id="${plantilla.id}"/></svg>
          </button>
        </div>
      </div>`;
    lista.appendChild(li);
  });

  renderSelector(); // HU4 (C13): el <select> del generador
  renderStats();    // HU3 (C14): total y conteo por hashtag

  // HU1 (C15): cada vez que render() corre, el estado acaba de cambiar
  // (se agregó, editó, eliminó o filtró algo). Por eso persistimos aquí,
  // en un único lugar, en vez de llamar guardar() en cada función suelta.
  guardar();
}

// Llena el <select> con una <option> por cada plantilla.
// Nota: usamos SIEMPRE state.plantillas completo aquí (no la vista
// filtrada), porque el generador de mensajes debe poder usar
// cualquier plantilla, esté o no visible en la lista filtrada.
function renderSelector() {
  selector.innerHTML = state.plantillas
    .map((plantilla, indice) => `<option value="${indice}">${plantilla.titulo}</option>`)
    .join("");
}

// Dibuja el panel de estadísticas (HU3, C14): total real de
// plantillas + una etiqueta por cada hashtag con su conteo.
// Ojo: usa state.plantillas completo (el total REAL), no la
// vista filtrada, tal como pide el checkpoint 4 del laboratorio.
function renderStats() {
  const total = state.plantillas.length;
  const porTag = contarPorHashtag(state.plantillas);

  // Object.entries() convierte { "#ventas": 2, "#soporte": 1 }
  // en [["#ventas", 2], ["#soporte", 1]] para poder recorrerlo con .map()
  const etiquetas = Object.entries(porTag)
    .map(([hashtag, cantidad]) =>
      `<span class="text-xs font-mono-ui px-2 py-0.5 rounded-full ${colorPorHashtag(hashtag)}">${hashtag} · ${cantidad}</span>`)
    .join("");

  // Logro 2 (C14): calculamos y mostramos cuál es el hashtag con más plantillas.
  const masUsado = hashtagMasUsado(porTag);
  const textoMasUsado = masUsado
    ? `<span class="text-xs text-amber-700 font-mono-ui">⭐ Más usado: ${masUsado.hashtag} (${masUsado.cantidad})</span>`
    : "";

  panelStats.innerHTML = `
    <div class="flex items-center gap-2 flex-wrap">
      <span class="text-sm font-display font-semibold text-[var(--accent-azul)]">${total} plantilla(s)</span>
      ${etiquetas}
      ${textoMasUsado}
    </div>`;
}


// ---------- HU1/HU2 (C14): Delegación de eventos en la lista ----------

// En vez de poner un listener por cada botón "Editar"/"Eliminar"
// (que tendríamos que re-enganchar cada vez que render() destruye
// y vuelve a crear las tarjetas), ponemos UN SOLO listener en el
// <ul> padre. Cuando el usuario hace clic en CUALQUIER hijo,
// el evento "burbujea" hasta el padre y aquí decidimos qué hacer
// según en qué elemento exacto se hizo clic (evento.target).
lista.addEventListener("click", function (evento) {
  // Como ahora cada botón tiene un ícono <svg> adentro, un clic puede
  // "aterrizar" en el SVG (o en un <path> del SVG) y no en el <button>
  // mismo. .closest(".btn-eliminar") sube por los ancestros del elemento
  // clickeado hasta encontrar el que tiene esa clase, sin importar en
  // qué hijo exacto se hizo clic.
  const botonEliminar = evento.target.closest(".btn-eliminar");
  const botonEditar = evento.target.closest(".btn-editar");

  if (botonEliminar) {
    const id = botonEliminar.dataset.id;
    // Logro 3 (C14): confirm() muestra un aviso simple del navegador
    // con "Aceptar"/"Cancelar". Solo si el usuario acepta, eliminamos.
    // En C16 esto se reemplazará por un modal propio, más lindo.
    const confirmado = confirm("¿Seguro que quieres eliminar esta plantilla?");
    if (confirmado) {
      eliminarPlantilla(id);
    }
  }

  if (botonEditar) {
    cargarEnFormulario(botonEditar.dataset.id);
  }
});


// ---------- HU2 (C13) + HU2 (C14): Conectar el formulario (crear O editar) ----------

const form = document.getElementById("form-plantilla");
const titulo = document.getElementById("titulo");
const mensaje = document.getElementById("mensaje");
const hashtag = document.getElementById("hashtag");

form.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const tituloTexto = titulo.value.trim();
  const mensajeTexto = mensaje.value.trim();

  if (tituloTexto.length === 0 || mensajeTexto.length === 0) {
    alert("Título y mensaje son obligatorios");
    return;
  }

  const hashtagNormalizado = normalizarHashtag(hashtag.value);

  // HU2 (C14): decidimos si ACTUALIZAMOS una plantilla existente
  // o CREAMOS una nueva, según si state.editandoId tiene un id guardado.
  if (state.editandoId) {
    // .map() tampoco muta: crea un array NUEVO. Recorremos todas las
    // plantillas y, SOLO para la que coincide con el id que estamos
    // editando, devolvemos una copia actualizada con el spread (...).
    // Las demás plantillas se devuelven intactas, tal cual estaban.
    state.plantillas = state.plantillas.map(function (plantilla) {
      if (plantilla.id === state.editandoId) {
        // Logro 3 (C15): además de actualizar los datos, guardamos CUÁNDO
        // se editó por última vez. new Date() captura el momento actual,
        // igual que hace "fecha" en el constructor de Template.
        return { ...plantilla, titulo: tituloTexto, mensaje: mensajeTexto, hashtag: hashtagNormalizado, editadaEl: new Date() };
      }
      return plantilla;
    });
    state.editandoId = null; // salimos del "modo edición"
    // Mejora visual: ya no estamos editando, así que el botón vuelve a ocultarse.
    document.getElementById("btn-cancelar").classList.add("hidden");
  } else {
    agregarPlantilla(tituloTexto, mensajeTexto, hashtagNormalizado);
  }

  render();
  form.reset();
});

// Logro 1 (C14): botón "Cancelar edición". Si el usuario está editando
// una plantilla y se arrepiente, esto limpia el formulario y saca a
// la app del "modo edición" sin guardar ningún cambio.
document.getElementById("btn-cancelar").addEventListener("click", function () {
  state.editandoId = null;
  form.reset();
  // Mejora visual: al cancelar, el botón se vuelve a ocultar.
  this.classList.add("hidden");
});


// ---------- HU4 (C14): Buscador que filtra por hashtag ----------

document.getElementById("buscador").addEventListener("input", function (evento) {
  // Cada vez que el usuario teclea, guardamos el texto en el estado...
  state.filtro = evento.target.value;
  // ...y volvemos a renderizar. render() usa plantillasVisibles(),
  // que ya sabe filtrar según state.filtro.
  render();
});


// ---------- HU4 (C15): Vaciar toda la colección ----------

document.getElementById("btn-vaciar").addEventListener("click", function () {
  // No hace falta .filter() ni nada especial: vaciar la colección
  // es simplemente dejar el array en [].
  state.plantillas = [];
  render(); // render() -> guardar(); como no queda nada, removeItem() limpia localStorage
});

// Logro 1 (C15): JSON.stringify acepta un tercer argumento (el número
// de espacios de sangría) para imprimir el texto "bonito" y legible,
// en vez de todo pegado en una sola línea.
document.getElementById("btn-exportar").addEventListener("click", function () {
  console.log(JSON.stringify(state.plantillas, null, 2));
  alert("Tus plantillas se imprimieron en la consola (F12 → Console).");
});


// ---------- HU4 (C13): Generador de mensaje final ----------

// Toma una plantilla y los valores reales, y devuelve el mensaje ya armado.
// .replaceAll() busca TODAS las apariciones de un marcador en el texto
// (no solo la primera, como haría .replace()) y las cambia por el valor real.
function generarMensajeFinal(plantilla, valorNombre, valorProducto) {
  return plantilla.mensaje
    .replaceAll("{nombre}", valorNombre)
    .replaceAll("{producto}", valorProducto);
}

const salida = document.getElementById("mensaje-final");
const valorNombre = document.getElementById("valorNombre");
const valorProducto = document.getElementById("valorProducto");

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


// ---------- Arranque de la app: recuperar lo guardado (C15) ----------

// HU2 + HU3 (C15): cargar() ya viene protegida con try/catch (ver
// persistence.js), así que si el dato guardado está corrupto, esto
// simplemente devuelve un array vacío en vez de romper la app.
state.plantillas = cargar();

// HU5 (C15): recuperamos también el filtro guardado. Como es texto,
// no necesita JSON.parse. Si nunca se guardó nada, usamos "" (vacío).
state.filtro = localStorage.getItem(CLAVE_FILTRO) ?? "";

// Reflejamos el filtro recuperado en el input del buscador ANTES de
// renderizar, para que la pantalla y el estado arranquen sincronizados.
document.getElementById("buscador").value = state.filtro;

// Logro 2 (C15): sumamos esta apertura al contador y lo mostramos.
const visitas = registrarVisita();
document.getElementById("contador-visitas").textContent =
  `Abriste esta app ${visitas} ${visitas === 1 ? "vez" : "veces"}`;

// Primer dibujo, ya con los datos (si había) recuperados del navegador.
render();