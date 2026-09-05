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
        "ciudadano_log_comunidad.html": "ciudadano_educacion.html#noticias",
        "ciudadano_noticias.html": "ciudadano_educacion.html#noticias",
        "ciudadano_mapa_puntos.html": "ciudadano_mapa.html",
        "ciudadano_estadisticas_personales.html": "ciudadano_estadisticas.html",
        "ciudadano_contenido_educativo.html": "ciudadano_educacion.html",
    };

    document.querySelectorAll("a[href]").forEach((enlace) => {
        const href = enlace.getAttribute("href");
        if (href && mapaRutas[href]) {
            enlace.setAttribute("href", mapaRutas[href]);
        }

        if (href && href.split("?")[0].split("#")[0].endsWith("ciudadano_noticias.html")) {
            enlace.setAttribute("href", "ciudadano_educacion.html#noticias");
        }
    });
}

/**
 * Noticias vive dentro de Aprende; se eliminan entradas duplicadas de la
 * navegacion principal y movil sin tocar enlaces informativos del footer.
 */
function normalizarNavegacionAprendeCiudadano() {
    const contenedores = [
        document.querySelector("nav.navbar .container-fluid > .d-none.d-md-flex"),
        document.querySelector("#mobileMenuSidebar .list-group"),
        document.getElementById("ciudadano-hamburger-panel")?.querySelector(".ciudadano-hamburger-panel__links"),
    ].filter(Boolean);

    contenedores.forEach((contenedor) => {
        contenedor.querySelectorAll("a[href]").forEach((enlace) => {
            const href = enlace.getAttribute("href") || "";
            const texto = (enlace.textContent || "").trim().toLowerCase();

            if (href.includes("ciudadano_educacion.html#noticias") || texto === "noticias") {
                enlace.remove();
            }

            if (href === "ciudadano_educacion.html" && texto.includes("educaci")) {
                enlace.innerHTML = enlace.innerHTML.replace(/Educaci[oó]n/g, "Aprende");
            }
        });
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
            href: "ciudadano_estadisticas.html",
            icono: "trending_up",
            texto: "Estadísticas",
            activos: ["ciudadano_estadisticas.html"],
        },
        {
            href: "ciudadano_registrar_reciclaje.html",
            icono: "add",
            texto: "Reciclar",
            activos: ["ciudadano_registrar_reciclaje.html", "ciudadano_historial_reciclaje.html"],
            principal: true,
            requiereSesion: true,
        },
        {
            href: "ciudadano_educacion.html",
            icono: "menu_book",
            texto: "Aprende",
            activos: ["ciudadano_educacion.html", "ciudadano_noticias.html"],
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
 * Crea el boton flotante de registro de reciclaje para todas las pantallas.
 *
 * El boton queda abajo a la derecha y muestra una ayuda visual al pasar el
 * cursor encima. Si el ciudadano no ha iniciado sesion, se envia al login.
 */
function crearBotonFlotanteReciclajeCiudadano() {
    if (document.getElementById("greenup-reciclaje-float")) {
        return;
    }

    const boton = document.createElement("a");
    boton.id = "greenup-reciclaje-float";
    boton.className = "greenup-reciclaje-float";
    boton.href = "ciudadano_registrar_reciclaje.html";
    boton.setAttribute("aria-label", "Registrar reciclaje");
    boton.setAttribute("data-tooltip", "Registrar reciclaje");
    boton.innerHTML = `
        <span class="material-symbols-outlined" aria-hidden="true">add</span>
        <span class="greenup-reciclaje-float__texto">Registrar reciclaje</span>
    `;

    boton.addEventListener("click", (evento) => {
        const token = localStorage.getItem("token");
        const usuarioGuardado = localStorage.getItem("usuario");

        if (!token || !usuarioGuardado) {
            evento.preventDefault();
            window.location.href = "../public/public_login.html";
        }
    });

    document.body.appendChild(boton);
}

/**
 * Mantiene las preguntas frecuentes visibles sin depender del menu de perfil.
 * Se muestra encima del boton flotante de registro de reciclaje.
 */
function crearBotonFlotanteAyudaCiudadano() {
    if (document.getElementById("greenup-ayuda-float")) {
        return;
    }

    const boton = document.createElement("a");
    boton.id = "greenup-ayuda-float";
    boton.className = "greenup-ayuda-float";
    boton.href = "ciudadano_faq.html";
    boton.setAttribute("aria-label", "Ayuda y preguntas frecuentes");
    boton.setAttribute("data-tooltip", "Ayuda");
    boton.innerHTML = `
        <span class="material-symbols-outlined" aria-hidden="true">question_mark</span>
        <span class="greenup-ayuda-float__texto">Ayuda</span>
    `;

    document.body.appendChild(boton);
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
        { href: "ciudadano_mapa.html", icono: "map", texto: "Mapa Eco" },
        { href: "ciudadano_estadisticas.html", icono: "trending_up", texto: "Estadísticas" },
        { href: "ciudadano_educacion.html", icono: "menu_book", texto: "Aprende" },
        { href: "ciudadano_registrar_reciclaje.html", icono: "add_circle", texto: "Registrar reciclaje", requiereSesion: true },
        { href: "ciudadano_historial_reciclaje.html", icono: "history", texto: "Mi historial", requiereSesion: true },
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

    panel.querySelector(".ciudadano-hamburger-panel__logout")?.addEventListener("click", async (evento) => {
        if (typeof confirmarCerrarSesion === "function") {
            confirmarCerrarSesion(evento);
            return;
        }

        if (typeof cerrarSesion === "function" && await window.greenupConfirm("¿Seguro que quieres cerrar sesión?", "Cerrar sesión")) {
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
        { href: "ciudadano_mapa.html", icono: "map", texto: "Mapa Eco" },
        { href: "ciudadano_historial_reciclaje.html", icono: "history", texto: "Historial" },
        { href: "ciudadano_estadisticas.html", icono: "bar_chart", texto: "Estadísticas" },
        { href: "ciudadano_educacion.html", icono: "school", texto: "Aprende" },
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
        navegacionEscritorio.innerHTML = "";
        rutasPrincipales.forEach((ruta) => {
            const enlace = document.createElement("a");
            const rutaActual = ruta.href === archivoActual;
            enlace.href = ruta.href;
            enlace.className = `nav-link ${rutaActual ? "active-custom h-100" : "text-secondary"} d-flex align-items-center gap-1`;
            if (rutaActual) enlace.setAttribute("aria-current", "page");
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
 * Mantiene disponible la pagina institucional desde todas las pantallas del
 * ciudadano sin agregarla a la barra de navegacion principal.
 */
function asegurarEnlaceSobreGreenUpCiudadano() {
    const rutaSobreGreenUp = "../public/public_sobre_nosotros.html";
    let footer = document.querySelector("footer");

    if (!footer) {
        footer = document.createElement("footer");
        footer.className = "ciudadano-about-footer";
        footer.setAttribute("aria-label", "Información de GreenUp");
        footer.innerHTML = `
            <span>© 2026 GreenUp</span>
            <a href="${rutaSobreGreenUp}">
                <span class="material-symbols-outlined" aria-hidden="true">info</span>
                Sobre GreenUp
            </a>
        `;

        const contenidoPrincipal = document.querySelector("main");
        if (contenidoPrincipal) {
            contenidoPrincipal.insertAdjacentElement("afterend", footer);
        } else {
            document.body.appendChild(footer);
        }
        return;
    }

    if (footer.querySelector(`a[href="${rutaSobreGreenUp}"]`)) return;

    const listaInformativa = Array.from(footer.querySelectorAll("nav ul")).at(-1);
    if (!listaInformativa) return;

    const item = document.createElement("li");
    item.innerHTML = `<a href="${rutaSobreGreenUp}" class="text-white-50 text-decoration-none hover-white">Sobre GreenUp</a>`;
    listaInformativa.appendChild(item);
}

/**
 * Corrige el footer para que la marca no use fondo blanco.
 */
function corregirFooterCiudadano() {
    const rutasFooter = {
        "misión": "../public/public_sobre_nosotros.html",
        "mision": "../public/public_sobre_nosotros.html",
        "visión": "../public/public_sobre_nosotros.html",
        "vision": "../public/public_sobre_nosotros.html",
        "impacto": "../public/public_estadisticas.html",
        "equipo": "../public/public_sobre_nosotros.html",
        "carreras": "mailto:greenup213@gmail.com?subject=Quiero%20hacer%20parte%20de%20GreenUp",
        "boletín": "ciudadano_educacion.html#noticias",
        "boletin": "ciudadano_educacion.html#noticias",
        "eventos": "ciudadano_educacion.html#noticias",
        "eco-blog": "ciudadano_educacion.html#noticias",
        "novedades": "ciudadano_educacion.html#noticias",
        "privacidad": "../public/public_sobre_nosotros.html#privacidad",
        "términos": "../public/public_sobre_nosotros.html#terminos",
        "terminos": "../public/public_sobre_nosotros.html#terminos",
        "cookies": "../public/public_sobre_nosotros.html#cookies",
        "contacto": "mailto:greenup213@gmail.com?subject=Contacto%20GreenUp",
        "soporte": "mailto:greenup213@gmail.com?subject=Soporte%20GreenUp",
    };

    document.querySelectorAll("footer span").forEach((span) => {
        const texto = (span.textContent || "").trim().toLowerCase();
        if (texto === "green" || texto === "up") {
            span.style.backgroundColor = "transparent";
            span.style.padding = "0";
        }
    });

    document.querySelectorAll("footer a").forEach((enlace) => {
        const texto = (enlace.textContent || "").trim().toLowerCase();
        const icono = enlace.querySelector(".material-symbols-outlined")?.textContent?.trim().toLowerCase() || "";
        if ((enlace.getAttribute("href") || "") === "#") {
            if (icono === "mail") {
                enlace.href = "mailto:greenup213@gmail.com?subject=Contacto%20GreenUp";
                return;
            }
            if (icono === "public") {
                enlace.href = "../public/public_sobre_nosotros.html";
                return;
            }
            if (icono === "share") {
                enlace.href = window.location.href;
                enlace.addEventListener("click", async (evento) => {
                    evento.preventDefault();
                    const url = window.location.origin + "/pages/public/public_inicio.html";
                    if (navigator.share) {
                        await navigator.share({
                            title: "GreenUp",
                            text: "Conoce GreenUp, una plataforma para reciclar mejor y ubicar puntos ecológicos.",
                            url,
                        });
                        return;
                    }
                    await navigator.clipboard?.writeText(url);
                    alert("Enlace de GreenUp copiado para compartir.");
                });
                return;
            }
            const destino = Object.entries(rutasFooter).find(([clave]) => texto.includes(clave))?.[1];
            enlace.href = destino || "mailto:greenup213@gmail.com?subject=GreenUp";
        }
        if (texto.includes("soporte")) {
            enlace.href = "mailto:greenup213@gmail.com?subject=Soporte%20GreenUp";
            enlace.setAttribute("data-greenup-mail", "true");
        }
    });

    document.querySelectorAll("[data-greenup-mail]").forEach((enlace) => {
        enlace.href = "mailto:greenup213@gmail.com?subject=Soporte%20GreenUp";
    });

    document.querySelectorAll("[data-greenup-whatsapp]").forEach((enlace) => {
        enlace.href = "https://wa.me/573185810461?text=Hola%20GreenUp,%20necesito%20soporte";
        enlace.target = "_blank";
        enlace.rel = "noopener noreferrer";
        enlace.textContent = enlace.textContent || "WhatsApp GreenUp";
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
 * Da una accion real a enlaces heredados que quedaron como href="#".
 */
function conectarEnlacesVaciosCiudadano() {
    document.querySelectorAll('a[href="#"]').forEach((enlace) => {
        const texto = (enlace.textContent || "").trim().toLowerCase();
        const icono = enlace.querySelector(".material-symbols-outlined")?.textContent?.trim().toLowerCase() || "";

        if (enlace.getAttribute("onclick") || texto.includes("cerrar sesi")) return;

        if (enlace.closest("footer")) {
            return;
        }

        if (enlace.classList.contains("navbar-brand") || texto.includes("green up") || texto.includes("greenup")) {
            enlace.href = "ciudadano_inicio.html";
            return;
        }

        if (icono === "arrow_back") {
            enlace.href = "ciudadano_educacion.html";
            return;
        }

        if (texto.includes("consejo") || texto.includes("evento") || texto.includes("desaf")) {
            enlace.href = "ciudadano_educacion.html";
            return;
        }

        if (icono === "share") {
            enlace.href = window.location.href;
            enlace.addEventListener("click", async (evento) => {
                evento.preventDefault();
                const url = window.location.origin + "/pages/public/public_inicio.html";
                if (navigator.share) {
                    await navigator.share({
                        title: "GreenUp",
                        text: "Conoce GreenUp, una plataforma para reciclar mejor y ubicar puntos ecológicos.",
                        url,
                    });
                    return;
                }
                await navigator.clipboard?.writeText(url);
                alert("Enlace de GreenUp copiado para compartir.");
            });
            return;
        }

        if (icono === "public") {
            enlace.href = "../public/public_sobre_nosotros.html";
            return;
        }

        if (icono === "mail") {
            enlace.href = "mailto:greenup213@gmail.com?subject=Contacto%20GreenUp";
            return;
        }

        if (texto.includes("privacidad")) {
            enlace.href = "../public/public_sobre_nosotros.html#privacidad";
            return;
        }

        if (texto.includes("cookies")) {
            enlace.href = "../public/public_sobre_nosotros.html#cookies";
            return;
        }

        if (texto.includes("términos") || texto.includes("terminos")) {
            enlace.href = "../public/public_sobre_nosotros.html#terminos";
        }
    });
}

/**
 * Conecta el modal de "Sugerir Punto" del mapa ciudadano con el backend de novedades.
 */
function conectarSugerenciaPuntoCiudadano() {
    const abrirBtn = document.getElementById("btn-abrir-sugerencia");
    const enviarBtn = document.getElementById("btn-enviar-sugerencia");
    const modal = document.getElementById("modalSugerirPunto");
    const formulario = document.getElementById("form-sugerir-punto");

    if (!abrirBtn || !enviarBtn || !modal || !formulario) return;

    const obtenerInstanciaModal = () => {
        if (!window.bootstrap?.Modal) return null;
        return window.bootstrap.Modal.getOrCreateInstance(modal);
    };

    const mostrarToast = () => {
        const toast = document.getElementById("successToast");
        if (toast && window.bootstrap?.Toast) {
            window.bootstrap.Toast.getOrCreateInstance(toast).show();
            return;
        }
        alert("¡Gracias! Tu sugerencia ha sido enviada para revisión.");
    };

    abrirBtn.type = "button";
    abrirBtn.addEventListener("click", () => {
        const modalBootstrap = obtenerInstanciaModal();
        if (modalBootstrap) {
            modalBootstrap.show();
        } else {
            modal.classList.add("show");
            modal.style.display = "block";
            modal.removeAttribute("aria-hidden");
        }
    });

    const enviarSugerencia = async (evento) => {
        evento.preventDefault();

        const campos = formulario.querySelectorAll("input");
        const nombreLugar = (campos[0]?.value || "").trim();
        const direccion = (campos[1]?.value || "").trim();
        const materiales = (campos[2]?.value || "").trim();

        if (!nombreLugar || !direccion || !materiales) {
            formulario.reportValidity();
            return;
        }

        const textoOriginal = enviarBtn.textContent;
        enviarBtn.disabled = true;
        enviarBtn.textContent = "Enviando...";

        const payload = {
            titulo: "Sugerencia de punto ecológico",
            motivo: "Sugerencia de punto ecológico",
            descripcion: `${nombreLugar}. Dirección aproximada: ${direccion}. Materiales recibidos: ${materiales}.`,
            comentario: `Materiales recibidos: ${materiales}`,
            ubicacion: direccion
        };

        try {
            let respuesta;
            if (typeof peticionSegura === "function") {
                respuesta = await peticionSegura("/novedades", "POST", payload);
            } else {
                const token = localStorage.getItem("token");
                const response = await fetch(`${window.API_URL || "https://greenup-hoxj.onrender.com/"}/novedades`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify(payload)
                });
                respuesta = { ok: response.ok, datos: await response.json().catch(() => ({})) };
            }

            if (!respuesta.ok) {
                throw new Error(respuesta.datos?.mensaje || "No se pudo enviar la sugerencia.");
            }

            formulario.reset();
            obtenerInstanciaModal()?.hide();
            mostrarToast();
        } catch (error) {
            console.error("Error enviando sugerencia de punto:", error);
            alert(error.message || "No se pudo enviar la sugerencia. Intenta de nuevo.");
        } finally {
            enviarBtn.disabled = false;
            enviarBtn.textContent = textoOriginal;
        }
    };

    formulario.addEventListener("submit", enviarSugerencia);
    enviarBtn.type = "submit";
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

/**
 * Etiqueta las tablas del ciudadano para que CSS pueda presentarlas como
 * fichas legibles en celular y tablet. También cubre filas cargadas después
 * desde la API, por ejemplo el historial de reciclaje.
 */
function prepararTablasResponsivasCiudadano(root = document) {
    const tablas = [];
    if (root.matches?.("table.historial-tabla, table.historial-table")) tablas.push(root);
    root.querySelectorAll?.("table.historial-tabla, table.historial-table").forEach((tabla) => tablas.push(tabla));

    tablas.forEach((tabla) => {
        const etiquetas = Array.from(tabla.querySelectorAll("thead th"))
            .map((encabezado) => encabezado.textContent.trim());
        tabla.classList.add("responsive-table-ready");

        tabla.querySelectorAll("tbody tr").forEach((fila) => {
            Array.from(fila.children).forEach((celda, indice) => {
                if (celda.tagName !== "TD") return;
                if (celda.hasAttribute("colspan")) {
                    celda.classList.add("responsive-table-empty");
                    return;
                }
                celda.dataset.label = etiquetas[indice] || "Dato";
            });
        });
    });
}

function textoAccesibleDesdeControl(control) {
    const id = control.id || "";
    const placeholder = control.getAttribute("placeholder") || "";
    const nombre = control.getAttribute("name") || "";
    const textos = {
        "search-input": "Buscar direccion o barrio",
        "filter-select": "Filtrar puntos por residuo",
        "btn-search-address": "Buscar direccion en el mapa",
        "btn-abrir-sugerencia": "Sugerir un nuevo punto ecologico",
        "btn-enviar-sugerencia": "Enviar sugerencia de punto ecologico",
        "sidebar-collapse-trigger": "Contraer panel de puntos ecologicos",
    };
    const iconos = {
        menu: "Abrir menu",
        notifications: "Notificaciones",
        account_circle: "Menu de usuario",
        expand_more: "Abrir opciones",
        search: "Buscar",
        add_location_alt: "Sugerir punto ecologico",
        chevron_left: "Contraer panel",
        my_location: "Centrar mapa",
        add: "Acercar mapa",
        remove: "Alejar mapa",
        download: "Descargar",
        refresh: "Actualizar",
        logout: "Cerrar sesion",
    };
    const icono = control.querySelector?.(".material-symbols-outlined")?.textContent?.trim();

    if (textos[id]) return textos[id];
    if (icono && iconos[icono]) return iconos[icono];
    if (placeholder) return placeholder.replace(/\.+$/, "");
    if (nombre) return nombre.replaceAll("_", " ");
    if (control.textContent?.trim()) return control.textContent.trim();
    return "Campo de formulario";
}

function asegurarNombreAccesibleControl(control) {
    if (!control || control.hasAttribute("aria-label") || control.hasAttribute("aria-labelledby")) {
        return;
    }

    const id = control.id;
    if (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) {
        return;
    }

    const labelCercano = control.closest("label");
    if (labelCercano?.textContent?.trim()) {
        return;
    }

    const labelPrevio = control.parentElement?.querySelector?.(`label:not([for])`);
    if (id && labelPrevio?.textContent?.trim()) {
        labelPrevio.setAttribute("for", id);
        return;
    }

    control.setAttribute("aria-label", textoAccesibleDesdeControl(control));
}

function repararReferenciasAriaCiudadano(root = document) {
    root.querySelectorAll?.("[aria-labelledby], [aria-describedby], [aria-controls]").forEach((elemento) => {
        ["aria-labelledby", "aria-describedby", "aria-controls"].forEach((atributo) => {
            const valor = elemento.getAttribute(atributo);
            if (!valor) return;

            const idsValidos = valor
                .split(/\s+/)
                .filter((id) => id && document.getElementById(id));

            if (idsValidos.length) {
                elemento.setAttribute(atributo, idsValidos.join(" "));
            } else {
                elemento.removeAttribute(atributo);
            }
        });
    });
}

function mejorarAccesibilidadCiudadano(root = document) {
    root.querySelectorAll?.(".material-symbols-outlined").forEach((icono) => {
        const contenedorInteractivo = icono.closest("button, a");
        if (!contenedorInteractivo || contenedorInteractivo.textContent.trim() !== icono.textContent.trim()) {
            icono.setAttribute("aria-hidden", "true");
        }
    });

    root.querySelectorAll?.("img").forEach((imagen) => {
        const alt = (imagen.getAttribute("alt") || "").trim().toLowerCase();
        if (!alt || alt === "logo" || alt === "foto de perfil") {
            imagen.setAttribute("alt", alt === "foto de perfil" ? "Foto de perfil del usuario" : "GreenUP");
        }
    });

    root.querySelectorAll?.("input, select, textarea").forEach(asegurarNombreAccesibleControl);

    root.querySelectorAll?.("button, a").forEach((control) => {
        const soloIcono = control.textContent.trim().length > 0
            && control.querySelector(".material-symbols-outlined")
            && control.textContent.trim() === control.querySelector(".material-symbols-outlined")?.textContent.trim();
        if (soloIcono && !control.hasAttribute("aria-label")) {
            control.setAttribute("aria-label", textoAccesibleDesdeControl(control));
        }
    });

    root.querySelectorAll?.('[role="tab"]').forEach((tab) => {
        const destino = tab.getAttribute("data-bs-target") || tab.getAttribute("href");
        if (destino?.startsWith("#")) {
            const panel = document.querySelector(destino);
            if (panel?.id) {
                tab.setAttribute("aria-controls", panel.id);
                if (tab.id) panel.setAttribute("aria-labelledby", tab.id);
            }
        }
        if (!tab.hasAttribute("aria-selected")) {
            tab.setAttribute("aria-selected", String(tab.classList.contains("active") || tab.classList.contains("is-active")));
        }
    });

    repararReferenciasAriaCiudadano(root);
}

document.addEventListener("DOMContentLoaded", () => {
    asegurarCssCiudadano();
    redirigirAjustesAntiguos();
    corregirEnlacesCiudadano();
    completarNavegacionCiudadano();
    crearMenuHamburguesaCiudadano();
    crearBotonFlotanteReciclajeCiudadano();
    crearBotonFlotanteAyudaCiudadano();
    normalizarNavegacionAprendeCiudadano();
    cerrarOffcanvasViejoCiudadano();
    quitarModulosNoDeseadosCiudadano();
    estilizarBotonesCerrarSesionCiudadano();
    asegurarEnlaceSobreGreenUpCiudadano();
    corregirFooterCiudadano();
    conectarEnlacesVaciosCiudadano();
    conectarSugerenciaPuntoCiudadano();
    prepararTablasResponsivasCiudadano();
    mejorarAccesibilidadCiudadano();

    const observadorTablasResponsive = new MutationObserver((cambios) => {
        cambios.forEach((cambio) => {
            cambio.addedNodes.forEach((nodo) => {
                if (nodo.nodeType !== Node.ELEMENT_NODE) return;
                prepararTablasResponsivasCiudadano(nodo);
                mejorarAccesibilidadCiudadano(nodo);
                const tabla = nodo.closest?.("table.historial-tabla, table.historial-table");
                if (tabla) prepararTablasResponsivasCiudadano(tabla);
            });
        });
    });
    observadorTablasResponsive.observe(document.body, { childList: true, subtree: true });
});

(function cargarAccesibilidadCiudadana() {
    if (document.querySelector("script[data-greenup-accessibility]")) return;
    const script = document.createElement("script");
    script.dataset.greenupAccessibility = "true";
    script.src = `${new URL("accessibility.js", document.currentScript.src).href}?v=20260901-a11y3`;
    document.head.appendChild(script);
})();
