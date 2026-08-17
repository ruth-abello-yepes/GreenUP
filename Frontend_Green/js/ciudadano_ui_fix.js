/**
 * Archivo: ciudadano_ui_fix.js
 * Corrige enlaces heredados, soporte, footer, logout y módulos no deseados.
 */

/**
 * Reescribe rutas antiguas del ciudadano hacia las pantallas actuales.
 */
function corregirEnlacesCiudadano() {
    const mapaRutas = {
        "ajustes_cuenta.html": "ciudadano_config_perfil.html",
        "/ciudadano/inicio": "ciudadano_inicio.html",
        "ciudadano_log_comunidad.html": "ciudadano_noticias.html",
        "ciudadano_mapa_puntos.html": "ciudadano_mapa.html",
        "ciudadano_estadisticas_personales.html": "ciudadano_estadisticas.html",
        "ciudadano_contenido_educativo.html": "ciudadano_educacion.html",
    };

    document.querySelectorAll("a[href]").forEach((enlace) => {
        const href = enlace.getAttribute("href");
        if (href && mapaRutas[href]) {
            enlace.setAttribute("href", mapaRutas[href]);
        }
    });
}

/**
 * Quita secciones que el usuario ya no quiere mostrar.
 */
function quitarModulosNoDeseadosCiudadano() {
    const textosBloqueados = ["eco-desafíos", "eco-desafios", "billetera ecológica", "billetera ecologica"];
    const selectores = "section, article, div.card, div.gu-card, div.accordion-item";

    document.querySelectorAll(selectores).forEach((bloque) => {
        const texto = (bloque.textContent || "").trim().toLowerCase();
        if (!texto) return;
        if (textosBloqueados.some((item) => texto.includes(item))) {
            if (bloque.querySelector("h3, h4, h5, .accordion-button, .card-title")) {
                bloque.remove();
            }
        }
    });
}

/**
 * Da estilo de botón completo a cerrar sesión.
 */
function estilizarBotonesCerrarSesionCiudadano() {
    document.querySelectorAll("a, button").forEach((elemento) => {
        const texto = (elemento.textContent || "").trim().toLowerCase();
        if (!texto.includes("cerrar sesi")) return;

        elemento.classList.add("btn", "rounded-pill", "px-4", "py-2");
        if (elemento.closest(".offcanvas, .list-group")) {
            elemento.classList.add("btn-danger", "text-white", "w-100", "text-start");
            elemento.style.backgroundColor = "#dc3545";
        } else {
            elemento.classList.add("btn-outline-danger");
            elemento.style.backgroundColor = "#fff5f5";
        }
    });
}

/**
 * Corrige el footer para que la marca no use fondo blanco.
 */
function corregirFooterCiudadano() {
    document.querySelectorAll("footer span").forEach((span) => {
        const texto = (span.textContent || "").trim().toLowerCase();
        if (texto === "green" || texto === "up") {
            span.style.backgroundColor = "transparent";
            span.style.padding = "0";
        }
    });

    document.querySelectorAll("footer a").forEach((enlace) => {
        const texto = (enlace.textContent || "").trim().toLowerCase();
        if (texto.includes("soporte")) {
            enlace.href = "mailto:greenup213@gmail.com?subject=Soporte%20GreenUp";
            enlace.setAttribute("data-greenup-mail", "true");
        }
    });

    document.querySelectorAll("button, a").forEach((elemento) => {
        const texto = (elemento.textContent || "").trim().toLowerCase();
        if (texto.includes("contactar soporte")) {
            elemento.addEventListener("click", (evento) => {
                evento.preventDefault();
                window.location.href = "mailto:greenup213@gmail.com?subject=Soporte%20GreenUp";
            });
        }
    });
}

/**
 * Si existe una ruta de compatibilidad antigua, redirige al perfil real.
 */
function redirigirAjustesAntiguos() {
    const archivoActual = window.location.pathname.split("/").pop() || "";
    if (archivoActual === "ajustes_cuenta.html") {
        window.location.replace("ciudadano_config_perfil.html");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    redirigirAjustesAntiguos();
    corregirEnlacesCiudadano();
    quitarModulosNoDeseadosCiudadano();
    estilizarBotonesCerrarSesionCiudadano();
    corregirFooterCiudadano();
});
