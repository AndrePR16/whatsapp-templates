// ============================================================
// app.js
// El punto de ARRANQUE de la app. No exporta nada: solo importa
// lo que necesita de los otros módulos y los pone a funcionar.
//
// C16: antes, este archivo tenía TODO (estado, persistencia,
// render, listeners...). Ahora cada responsabilidad vive en su
// propio módulo (state.js, storage.js, ui.js) y aquí solo se
// conectan entre sí con import. El orden de los <script> ya no
// importa: los import arman el rompecabezas solos.
// ============================================================

import { state } from "./state.js";
import { cargar, CLAVE_FILTRO } from "./storage.js";
import { render } from "./ui.js";

// Recupera lo guardado en localStorage (ver HU2/HU3 de C15 en storage.js,
// ya protegido con try/catch contra datos corruptos).
state.plantillas = cargar();

// El filtro también se recupera y se refleja en el input del buscador
// ANTES de renderizar, para que pantalla y estado arranquen sincronizados.
state.filtro = localStorage.getItem(CLAVE_FILTRO) ?? "";
document.getElementById("buscador").value = state.filtro;

// Primer dibujo de la app, ya con los datos (si había) recuperados.
render();