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
 * Mantiene disponibles las rutas principales del ciudadano en escritorio y
 * en el menu hamburguesa. Registrar reciclaje tambien se agrega al menu del
 * perfil para que no dependa exclusivamente del boton flotante "+".
 */
function completarNavegacionCiudadano() {
    const archivoActual = window.location.pathname.split("/").pop() || "";
    const rutasPrincipales = [
        { href: "ciudadano_inicio.html", icono: "home", texto: "Inicio" },
        { href: "ciudadano_noticias.html", icono: "newspaper", texto: "Noticias" },
        { href: "ciudadano_mapa.html", icono: "map", texto: "Mapa Eco" },
        { href: "ciudadano_estadisticas.html", icono: "bar_chart", texto: "Estadísticas" },
        { href: "ciudadano_educacion.html", icono: "school", texto: "Educación" },
    ];
    const rutaRegistro = {
        href: "ciudadano_registrar_reciclaje.html",
        icono: "recycling",
        texto: "Registrar reciclaje",
    };

    const tieneRuta = (contenedor, href) => Array.from(contenedor.querySelectorAll("a[href]"))
        .some((enlace) => enlace.getAttribute("href") === href);

    const navegacionEscritorio = document.querySelector(
        "nav.navbar .container-fluid > .d-none.d-md-flex"
    );
    if (navegacionEscritorio) {
        rutasPrincipales.forEach((ruta) => {
            if (tieneRuta(navegacionEscritorio, ruta.href)) return;

            const enlace = document.createElement("a");
            enlace.href = ruta.href;
            enlace.className = "nav-link text-secondary d-flex align-items-center gap-1";
            enlace.innerHTML = `<span class="material-symbols-outlined fs-5">${ruta.icono}</span> ${ruta.texto}`;
            navegacionEscritorio.appendChild(enlace);
        });
    }

    const menuMovil = document.querySelector("#mobileMenuSidebar .list-group");
    if (menuMovil) {
        [...rutasPrincipales, rutaRegistro].forEach((ruta) => {
            if (tieneRuta(menuMovil, ruta.href)) return;

            const enlace = document.createElement("a");
            enlace.href = ruta.href;
            enlace.className = "list-group-item list-group-item-action border-0 py-3 d-flex align-items-center gap-3 text-secondary";
            enlace.innerHTML = `<span class="material-symbols-outlined">${ruta.icono}</span> ${ruta.texto}`;

            const cerrarSesion = Array.from(menuMovil.querySelectorAll("a"))
                .find((item) => (item.textContent || "").toLowerCase().includes("cerrar sesi"));
            menuMovil.insertBefore(enlace, cerrarSesion || null);
        });

        const enlaceActual = Array.from(menuMovil.querySelectorAll("a[href]"))
            .find((enlace) => enlace.getAttribute("href") === archivoActual);
        if (enlaceActual) {
            enlaceActual.classList.remove("text-secondary");
            enlaceActual.classList.add("text-success", "fw-semibold", "bg-success-subtle");
            enlaceActual.setAttribute("aria-current", "page");
        }
    }

    document.querySelectorAll(".navbar .dropdown-menu").forEach((menuPerfil) => {
        if (tieneRuta(menuPerfil, rutaRegistro.href)) return;

        const opcion = document.createElement("li");
        const enlace = document.createElement("a");
        enlace.href = rutaRegistro.href;
        enlace.className = "dropdown-item d-flex align-items-center gap-2 text-success fw-semibold py-2";
        enlace.innerHTML = `<span class="material-symbols-outlined fs-5">${rutaRegistro.icono}</span>${rutaRegistro.texto}`;
        opcion.appendChild(enlace);

        const separador = menuPerfil.querySelector(".dropdown-divider")?.closest("li");
        menuPerfil.insertBefore(opcion, separador || menuPerfil.firstChild);
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
    completarNavegacionCiudadano();
    quitarModulosNoDeseadosCiudadano();
    estilizarBotonesCerrarSesionCiudadano();
    corregirFooterCiudadano();
});
