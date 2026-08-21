/**
 * Archivo: ciudadano_ui_fix.js
 * Corrige enlaces heredados, soporte, footer, logout y módulos no deseados.
 */

/**
 * Carga el archivo CSS propio del ciudadano si la pantalla no lo importó.
 */
function asegurarCssCiudadano() {
    if (document.querySelector('link[href*="ciudadano.css"]')) {
        return;
    }

    const enlaceCss = document.createElement("link");
    enlaceCss.rel = "stylesheet";
    enlaceCss.href = "../../css/ciudadano.css";
    document.head.appendChild(enlaceCss);
}

/**
 * Reescribe rutas antiguas del ciudadano hacia las pantallas actuales.
 */
function corregirEnlacesCiudadano() {
    const mapaRutas = {
        "ajustes_cuenta.html": "ciudadano_ajustes.html",
        "ciudadano_config_perfil.html": "ciudadano_ajustes.html",
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
 * Indica si una opción de la barra inferior corresponde a la pantalla actual.
 * @param {string} archivoActual Nombre del archivo abierto.
 * @param {string[]} archivosPermitidos Archivos que activan la opción.
 * @returns {boolean} Verdadero cuando la opción debe verse activa.
 */
function esRutaCiudadanoActiva(archivoActual, archivosPermitidos) {
    return archivosPermitidos.includes(archivoActual);
}

/**
 * Crea la navegación inferior del ciudadano para celular y tablet.
 */
function crearNavegacionInferiorCiudadano() {
    if (document.getElementById("ciudadano-bottom-nav")) {
        return;
    }

    const archivoActual = window.location.pathname.split("/").pop() || "ciudadano_inicio.html";
    const rutas = [
        {
            href: "ciudadano_inicio.html",
            icono: "home",
            texto: "Inicio",
            activos: ["ciudadano_inicio.html"],
        },
        {
            href: "ciudadano_noticias.html",
            icono: "newspaper",
            texto: "Noticias",
            activos: ["ciudadano_noticias.html"],
        },
        {
            href: "ciudadano_estadisticas.html",
            icono: "trending_up",
            texto: "Estadísticas",
            activos: ["ciudadano_estadisticas.html"],
        },
        {
            href: "ciudadano_registrar_reciclaje.html",
            icono: "add",
            texto: "Reciclar",
            activos: ["ciudadano_registrar_reciclaje.html"],
            principal: true,
            requiereSesion: true,
        },
        {
            href: "ciudadano_educacion.html",
            icono: "menu_book",
            texto: "Aprende",
            activos: ["ciudadano_educacion.html"],
        },
        {
            href: "ciudadano_ajustes.html",
            icono: "account_circle",
            texto: "Tu Perfil",
            activos: ["ciudadano_ajustes.html", "ajustes_cuenta.html"],
        },
    ];

    const navegacion = document.createElement("nav");
    navegacion.id = "ciudadano-bottom-nav";
    navegacion.className = "ciudadano-bottom-nav";
    navegacion.setAttribute("aria-label", "Navegación inferior del ciudadano");

    rutas.forEach((ruta) => {
        const enlace = document.createElement("a");
        const activa = esRutaCiudadanoActiva(archivoActual, ruta.activos);
        enlace.href = ruta.href;
        enlace.className = `ciudadano-bottom-nav__link${ruta.principal ? " ciudadano-bottom-nav__link--primary" : ""}${activa ? " is-active" : ""}`;
        enlace.setAttribute("aria-label", ruta.texto);

        if (activa) {
            enlace.setAttribute("aria-current", "page");
        }

        if (ruta.requiereSesion) {
            enlace.addEventListener("click", (evento) => {
                const token = localStorage.getItem("token");
                const usuarioGuardado = localStorage.getItem("usuario");

                if (!token || !usuarioGuardado) {
                    evento.preventDefault();
                    window.location.href = "../public/public_login.html";
                }
            });
        }

        if (ruta.principal) {
            enlace.innerHTML = `
                <span class="ciudadano-bottom-nav__main-icon">
                    <span class="material-symbols-outlined">${ruta.icono}</span>
                </span>
                <span>${ruta.texto}</span>
            `;
        } else {
            enlace.innerHTML = `
                <span class="material-symbols-outlined">${ruta.icono}</span>
                <span>${ruta.texto}</span>
            `;
        }

        navegacion.appendChild(enlace);
    });

    document.body.appendChild(navegacion);
}

/**
 * Crea un menú pequeño para el botón hamburguesa en móvil.
 * Este menú reemplaza la barra lateral antigua y muestra rutas reales.
 */
function crearMenuHamburguesaCiudadano() {
    const botonMenu = document.querySelector(
        '[data-bs-target="#mobileMenuSidebar"], [data-bs-target="#mobileOffcanvas"], [aria-controls="mobileMenuSidebar"], [aria-controls="mobileOffcanvas"]'
    );

    if (!botonMenu || document.getElementById("ciudadano-hamburger-panel")) {
        return;
    }

    const archivoActual = window.location.pathname.split("/").pop() || "ciudadano_inicio.html";
    const rutasMenu = [
        { href: "ciudadano_inicio.html", icono: "home", texto: "Inicio" },
        { href: "ciudadano_noticias.html", icono: "newspaper", texto: "Noticias" },
        { href: "ciudadano_mapa.html", icono: "recycling", texto: "Recicladoras" },
        { href: "ciudadano_estadisticas.html", icono: "trending_up", texto: "Estadísticas" },
        { href: "ciudadano_educacion.html", icono: "menu_book", texto: "Aprende" },
        { href: "ciudadano_registrar_reciclaje.html", icono: "add_circle", texto: "Registrar reciclaje", requiereSesion: true },
        { href: "ciudadano_ajustes.html", icono: "account_circle", texto: "Tu Perfil" },
    ];

    botonMenu.removeAttribute("data-bs-toggle");
    botonMenu.removeAttribute("data-bs-target");
    botonMenu.removeAttribute("aria-controls");
    botonMenu.setAttribute("aria-label", "Abrir menú ciudadano");
    botonMenu.setAttribute("aria-expanded", "false");

    const panel = document.createElement("section");
    panel.id = "ciudadano-hamburger-panel";
    panel.className = "ciudadano-hamburger-panel";
    panel.setAttribute("aria-label", "Menú ciudadano");
    panel.hidden = true;

    panel.innerHTML = `
        <div class="ciudadano-hamburger-panel__head">
            <strong>GreenUp</strong>
            <span>Menú ciudadano</span>
        </div>
        <div class="ciudadano-hamburger-panel__links">
            ${rutasMenu.map((ruta) => {
                const activo = ruta.href === archivoActual ? " is-active" : "";
                return `
                    <a class="ciudadano-hamburger-panel__link${activo}" href="${ruta.href}" data-requiere-sesion="${ruta.requiereSesion ? "true" : "false"}">
                        <span class="material-symbols-outlined">${ruta.icono}</span>
                        <span>${ruta.texto}</span>
                    </a>
                `;
            }).join("")}
            <button class="ciudadano-hamburger-panel__logout" type="button">
                <span class="material-symbols-outlined">logout</span>
                <span>Cerrar sesión</span>
            </button>
        </div>
    `;

    document.body.appendChild(panel);

    botonMenu.addEventListener("click", (evento) => {
        evento.preventDefault();
        evento.stopPropagation();
        cerrarOffcanvasViejoCiudadano();
        const abrir = panel.hidden;
        panel.hidden = !abrir;
        botonMenu.setAttribute("aria-expanded", String(abrir));
    }, true);

    panel.querySelectorAll("[data-requiere-sesion='true']").forEach((enlace) => {
        enlace.addEventListener("click", (evento) => {
            const token = localStorage.getItem("token");
            const usuarioGuardado = localStorage.getItem("usuario");

            if (!token || !usuarioGuardado) {
                evento.preventDefault();
                window.location.href = "../public/public_login.html";
            }
        });
    });

    panel.querySelector(".ciudadano-hamburger-panel__logout")?.addEventListener("click", (evento) => {
        if (typeof confirmarCerrarSesion === "function") {
            confirmarCerrarSesion(evento);
            return;
        }

        if (typeof cerrarSesion === "function" && confirm("¿Seguro que quieres cerrar sesión?")) {
            cerrarSesion();
        }
    });

    document.addEventListener("click", (evento) => {
        if (panel.hidden) {
            return;
        }

        if (panel.contains(evento.target) || botonMenu.contains(evento.target)) {
            return;
        }

        panel.hidden = true;
        botonMenu.setAttribute("aria-expanded", "false");
    });
}

/**
 * Cierra el offcanvas viejo de Bootstrap si llegó a abrirse.
 */
function cerrarOffcanvasViejoCiudadano() {
    document.querySelectorAll(".offcanvas.show").forEach((offcanvas) => {
        offcanvas.classList.remove("show");
        offcanvas.setAttribute("aria-hidden", "true");
        offcanvas.removeAttribute("aria-modal");
        offcanvas.removeAttribute("role");
    });

    document.querySelectorAll(".offcanvas-backdrop").forEach((fondo) => {
        fondo.remove();
    });

    document.body.classList.remove("offcanvas-backdrop", "modal-open");
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("padding-right");
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
        window.location.replace("ciudadano_ajustes.html");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    asegurarCssCiudadano();
    redirigirAjustesAntiguos();
    corregirEnlacesCiudadano();
    completarNavegacionCiudadano();
    crearNavegacionInferiorCiudadano();
    crearMenuHamburguesaCiudadano();
    cerrarOffcanvasViejoCiudadano();
    quitarModulosNoDeseadosCiudadano();
    estilizarBotonesCerrarSesionCiudadano();
    corregirFooterCiudadano();
});
