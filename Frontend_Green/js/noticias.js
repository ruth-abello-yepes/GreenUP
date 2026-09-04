/** Noticias ambientales reales para vistas publicas y Aprende del ciudadano. */

const IMAGEN_NOTICIA_FALLBACK =
    "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=900&q=80";
const MODO_NOTICIAS_PUBLICO = document.body.dataset.newsMode === "public";
let paginaNoticias = 1;
let temporizadorBusqueda = null;
const noticiasCompletadas = new Set();

window.addEventListener("noticia-respondida", (evento) => {
    const idNoticia = Number(evento.detail?.idNoticia);
    if (!idNoticia) return;
    noticiasCompletadas.add(idNoticia);
    const boton = document.querySelector(`[data-noticia-id="${idNoticia}"]`);
    if (!boton) return;
    boton.disabled = true;
    boton.classList.remove("btn-gu-primary", "btn-outline-secondary");
    boton.classList.add("btn-success");
    boton.textContent = "Ya respondiste esta noticia";
    boton.appendChild(crearElemento("span", "material-symbols-outlined fs-5", "check_circle"));
});

function formatearFechaNoticia(fecha) {
    const valor = new Date(fecha);
    if (Number.isNaN(valor.getTime())) return "Fecha no disponible";
    return new Intl.DateTimeFormat("es-CO", {
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(valor);
}

function crearElemento(etiqueta, clase, texto) {
    const elemento = document.createElement(etiqueta);
    if (clase) elemento.className = clase;
    if (texto !== undefined) elemento.textContent = texto;
    return elemento;
}

function crearTarjetaNoticia(noticia) {
    const columna = crearElemento("div", "col-lg-4 col-md-6");
    const articulo = crearElemento(
        "article",
        MODO_NOTICIAS_PUBLICO ? "news-card h-100" : "card gu-card h-100 border-0"
    );
    const imagenWrapper = crearElemento("div", "img-wrapper");
    const imagen = document.createElement("img");
    imagen.src = noticia.imagen || IMAGEN_NOTICIA_FALLBACK;
    imagen.alt = noticia.titulo || "Noticia ambiental";
    imagen.loading = "lazy";
    imagen.decoding = "async";
    imagen.addEventListener("error", () => { imagen.src = IMAGEN_NOTICIA_FALLBACK; }, { once: true });

    const categoria = crearElemento(
        "span",
        "badge bg-gu-secondary position-absolute top-0 start-0 m-3 px-3 py-1 rounded-pill",
        noticia.categoria || "Medio ambiente"
    );
    imagenWrapper.append(imagen, categoria);

    const cuerpo = crearElemento("div", "card-body d-flex flex-column p-4");
    const metadatos = crearElemento("div", "d-flex align-items-center gap-2 mb-2 text-muted small");
    metadatos.append(
        crearElemento("span", "material-symbols-outlined fs-6", "calendar_today"),
        document.createTextNode(`${formatearFechaNoticia(noticia.fecha_publicacion)} · ${noticia.fuente || "GreenUp"}`)
    );
    const titulo = crearElemento("h5", "fw-bold text-gu-primary mb-3", noticia.titulo);
    const descripcion = crearElemento(
        "p",
        "text-secondary small mb-4 flex-grow-1",
        noticia.descripcion || "Consulta la noticia completa en el medio que la publicó."
    );
    cuerpo.append(metadatos, titulo, descripcion);

    const acciones = crearElemento("div", "d-flex flex-wrap gap-2 mt-auto");

    if (noticia.id_noticia) {
        const enlace = crearElemento(
            "a",
            "btn btn-outline-success rounded-pill d-inline-flex align-items-center gap-1",
            "Leer noticia"
        );
        enlace.href = "#";
        enlace.addEventListener("click", (evento) => {
            evento.preventDefault();
            abrirDetalleNoticia(noticia);
        });
        enlace.appendChild(crearElemento("span", "material-symbols-outlined fs-5", "chevron_right"));
        acciones.appendChild(enlace);
    }

    if (noticia.id_noticia && !MODO_NOTICIAS_PUBLICO) {
        const juego = crearElemento(
            "button",
            "btn btn-gu-primary rounded-pill d-inline-flex align-items-center gap-1",
            "Responde las preguntas"
        );
        juego.type = "button";
        juego.dataset.noticiaId = String(noticia.id_noticia);
        juego.addEventListener("click", () => {
            if (noticiasCompletadas.has(Number(noticia.id_noticia))) return;
            if (typeof abrirQuizNoticia === "function") {
                abrirQuizNoticia(noticia.id_noticia, noticia.titulo || "Noticia ambiental");
            }
        });
        juego.appendChild(crearElemento("span", "material-symbols-outlined fs-5", "quiz"));
        if (noticiasCompletadas.has(Number(noticia.id_noticia))) {
            juego.disabled = true;
            juego.classList.remove("btn-gu-primary");
            juego.classList.add("btn-success");
            juego.textContent = "Ya respondiste esta noticia";
            juego.appendChild(crearElemento("span", "material-symbols-outlined fs-5", "check_circle"));
        }
        acciones.appendChild(juego);
    }

    cuerpo.appendChild(acciones);

    articulo.append(imagenWrapper, cuerpo);
    columna.appendChild(articulo);
    return columna;
}

function pintarDestacada(noticia) {
    const seccion = document.getElementById("noticia-destacada");
    if (!seccion) return;
    if (!noticia) {
        seccion.style.display = "none";
        return;
    }

    const imagen = document.getElementById("noticia-destacada-imagen");
    imagen.src = noticia.imagen || IMAGEN_NOTICIA_FALLBACK;
    imagen.alt = noticia.titulo;
    imagen.decoding = "async";
    imagen.fetchPriority = "high";
    imagen.onerror = () => { imagen.src = IMAGEN_NOTICIA_FALLBACK; };
    document.getElementById("noticia-destacada-fuente").textContent = noticia.fuente || "Medio colombiano";
    document.getElementById("noticia-destacada-titulo").textContent = noticia.titulo;
    document.getElementById("noticia-destacada-descripcion").textContent =
        noticia.descripcion || "Consulta todos los detalles en el medio original.";

    const enlace = document.getElementById("noticia-destacada-enlace");
    enlace.href = noticia.url_original || "#";
    enlace.hidden = !noticia.url_original;
    seccion.style.display = "";
}

function pintarPaginacion(paginacion) {
    const contenedor = document.getElementById("paginacion-noticias");
    contenedor.replaceChildren();
    const totalPaginas = Number(paginacion.total_paginas) || 0;
    const paginaActual = Number(paginacion.pagina) || 1;
    if (totalPaginas <= 1) {
        contenedor.closest("nav").hidden = true;
        return;
    }
    contenedor.closest("nav").hidden = false;
    contenedor.classList.add("flex-wrap", "justify-content-center", "gap-1");

    const agregarBoton = (texto, pagina, deshabilitado = false, activo = false, etiqueta = "") => {
        const item = crearElemento("li", `page-item${deshabilitado ? " disabled" : ""}${activo ? " active" : ""}`);
        const boton = crearElemento("button", "page-link border-0", texto);
        boton.type = "button";
        boton.disabled = deshabilitado;
        if (etiqueta) boton.setAttribute("aria-label", etiqueta);
        if (activo) boton.setAttribute("aria-current", "page");
        boton.addEventListener("click", () => cargarNoticias(pagina));
        item.appendChild(boton);
        contenedor.appendChild(item);
    };

    const agregarSeparador = () => {
        const item = crearElemento("li", "page-item disabled");
        const separador = crearElemento("span", "page-link border-0 bg-transparent text-muted", "...");
        separador.setAttribute("aria-hidden", "true");
        item.appendChild(separador);
        contenedor.appendChild(item);
    };

    const paginas = [];
    if (totalPaginas <= 7) {
        for (let pagina = 1; pagina <= totalPaginas; pagina += 1) paginas.push(pagina);
    } else {
        paginas.push(1);
        if (paginaActual > 3) paginas.push("...");
        const inicio = Math.max(2, paginaActual - 1);
        const fin = Math.min(totalPaginas - 1, paginaActual + 1);
        for (let pagina = inicio; pagina <= fin; pagina += 1) paginas.push(pagina);
        if (paginaActual < totalPaginas - 2) paginas.push("...");
        paginas.push(totalPaginas);
    }

    agregarBoton("‹", paginaActual - 1, paginaActual <= 1, false, "Página anterior");
    paginas.forEach(pagina => {
        if (pagina === "...") {
            agregarSeparador();
            return;
        }
        agregarBoton(String(pagina), pagina, false, pagina === paginaActual, `Página ${pagina}`);
    });
    agregarBoton("›", paginaActual + 1, paginaActual >= totalPaginas, false, "Página siguiente");
}

function prepararModalNoticia() {
    if (document.getElementById("modalDetalleNoticia")) return;
    const modal = document.createElement("div");
    modal.id = "modalDetalleNoticia";
    modal.className = "modal fade";
    modal.tabIndex = -1;
    modal.innerHTML = `<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content border-0 rounded-4 shadow">
            <div class="modal-header"><h2 id="detalleNoticiaTitulo" class="modal-title h4"></h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>
            <div class="modal-body"><img id="detalleNoticiaImagen" class="w-100 rounded-4 mb-3" style="max-height:280px;object-fit:cover" alt="">
                <p id="detalleNoticiaMeta" class="small text-secondary mb-2"></p><p id="detalleNoticiaDescripcion" class="mb-4"></p>
                <div id="detalleNoticiaEstado" class="alert alert-info">Cargando las 3 preguntas relacionadas...</div>
                <div id="detalleNoticiaPreguntas" class="d-grid gap-3"></div>
                <a id="detalleNoticiaFuente" class="btn btn-outline-success rounded-pill mt-4" target="_blank" rel="noopener noreferrer">Ver fuente original</a>
            </div></div></div>`;
    document.body.appendChild(modal);
}

async function abrirDetalleNoticia(noticia) {
    prepararModalNoticia();
    document.getElementById("detalleNoticiaTitulo").textContent = noticia.titulo || "Noticia ambiental";
    const imagen = document.getElementById("detalleNoticiaImagen");
    imagen.src = noticia.imagen || IMAGEN_NOTICIA_FALLBACK;
    imagen.alt = noticia.titulo || "Noticia ambiental";
    document.getElementById("detalleNoticiaMeta").textContent = `${formatearFechaNoticia(noticia.fecha_publicacion)} · ${noticia.fuente || "GreenUp"}`;
    document.getElementById("detalleNoticiaDescripcion").textContent = noticia.descripcion || "Esta noticia no tiene una descripción adicional.";
    const fuente = document.getElementById("detalleNoticiaFuente");
    fuente.href = noticia.url_original || "#";
    fuente.hidden = !noticia.url_original;
    const estado = document.getElementById("detalleNoticiaEstado");
    const preguntas = document.getElementById("detalleNoticiaPreguntas");
    preguntas.replaceChildren();
    new bootstrap.Modal(document.getElementById("modalDetalleNoticia")).show();
    try {
        const respuesta = await peticionSegura(`/api/comunidad/juego/noticias/${noticia.id_noticia}/preguntas`, "GET");
        const datos = respuesta.datos || {};
        if (!respuesta.ok) throw new Error(datos.mensaje || "No se pudieron cargar las preguntas.");
        const tres = (datos.preguntas || []).slice(0, 3);
        if (tres.length < 3) throw new Error("Esta noticia aún no tiene sus 3 preguntas relacionadas.");
        estado.className = "alert alert-success";
        estado.textContent = "Comprueba lo aprendido con estas 3 preguntas relacionadas:";
        tres.forEach((pregunta, indice) => {
            const bloque = document.createElement("article");
            bloque.className = "border rounded-4 p-3";
            bloque.innerHTML = `<strong>${indice + 1}. ${escaparTextoNoticia(pregunta.pregunta)}</strong><p class="small text-secondary mb-0 mt-2">Lee la noticia y luego responde el cuestionario desde tu cuenta.</p>`;
            preguntas.appendChild(bloque);
        });
    } catch (error) {
        estado.className = "alert alert-warning";
        estado.textContent = error.message || "No fue posible cargar las preguntas relacionadas.";
    }
}

function escaparTextoNoticia(valor) {
    const div = document.createElement("div");
    div.textContent = valor || "";
    return div.innerHTML;
}

function pintarEstadoNoticias(mensaje, tipo = "info") {
    const estado = document.getElementById("estado-noticias");
    if (!estado) return;
    const esMensajeTecnico = String(mensaje || "").includes("WORLD_NEWS_API_KEY");
    estado.className = `alert alert-${tipo} mb-4`;
    estado.textContent = esMensajeTecnico ? "" : mensaje;
    estado.hidden = !mensaje || esMensajeTecnico;
}

function pintarRespuestaNoticias(datos, pagina, busqueda) {
    const grid = document.getElementById("noticias-grid");
    paginaNoticias = pagina;
    grid.replaceChildren();
    grid.style.display = "";
    const noticiaDestacada = pagina === 1 ? datos.noticias[0] : null;
    const noticiasGrid = noticiaDestacada ? datos.noticias.slice(1) : datos.noticias;
    noticiasGrid.forEach(noticia => grid.appendChild(crearTarjetaNoticia(noticia)));
    pintarDestacada(noticiaDestacada);
    pintarPaginacion(datos.paginacion);

    const atribucion = document.getElementById("atribucion-noticias");
    atribucion.replaceChildren();
    const fuentes = datos.atribuciones || [datos.atribucion];
    atribucion.appendChild(document.createTextNode("Fuentes: "));
    fuentes.forEach((fuente, indice) => {
        if (indice > 0) atribucion.appendChild(document.createTextNode(" · "));
        const enlaceAtribucion = crearElemento("a", "text-muted", fuente.texto);
        enlaceAtribucion.href = fuente.url;
        enlaceAtribucion.target = "_blank";
        enlaceAtribucion.rel = "noopener noreferrer";
        atribucion.appendChild(enlaceAtribucion);
    });
    atribucion.hidden = false;

    if (!datos.noticias.length) {
        const vacio = crearElemento("div", "col-12 text-center py-5");
        vacio.append(
            crearElemento("span", "material-symbols-outlined display-4 text-muted", "newspaper"),
            crearElemento("h5", "text-gu-primary mt-3", busqueda ? "No encontramos coincidencias" : "Aún no hay noticias disponibles"),
            crearElemento(
                "p",
                "text-muted",
                datos.sincronizacion.configurada
                    ? "La próxima sincronización volverá a buscar noticias ambientales de Colombia."
                    : "Configura WORLD_NEWS_API_KEY en el backend para iniciar la sincronización gratuita."
            )
        );
        grid.appendChild(vacio);
    }

    const mensajeSincronizacion = datos.sincronizacion.mensaje || "Noticias actualizadas";
    const tiposEstado = {
        completada: "success",
        cache: "info",
        actualizando: "info",
        no_configurada: "warning",
        error: "warning"
    };
    pintarEstadoNoticias(mensajeSincronizacion, tiposEstado[datos.sincronizacion.estado] || "info");
}

async function cargarNoticias(pagina = 1) {
    const grid = document.getElementById("noticias-grid");
    const busqueda = document.getElementById("buscar-noticias").value.trim();
    if (!MODO_NOTICIAS_PUBLICO && !noticiasCompletadas.size) {
        try {
            const progreso = await peticionSegura("/api/comunidad/juego/mi-puntaje", "GET");
            if (progreso.ok) (progreso.datos.noticias_completadas_ids || []).forEach((id) => noticiasCompletadas.add(Number(id)));
        } catch (error) {
            console.warn("No se pudo cargar el progreso de noticias", error);
        }
    }
    const parametros = new URLSearchParams({ pagina: String(pagina), por_pagina: "10" });
    if (busqueda) parametros.set("buscar", busqueda);
    const claveCache = `greenup:noticias:${parametros}`;
    let cacheMostrado = false;

    try {
        const cacheGuardado = sessionStorage.getItem(claveCache);
        if (cacheGuardado) {
            const cache = JSON.parse(cacheGuardado);
            if (Date.now() - cache.guardadoEn < 10 * 60 * 1000) {
                pintarRespuestaNoticias(cache.datos, pagina, busqueda);
                cacheMostrado = true;
            }
        }
    } catch (error) {
        sessionStorage.removeItem(claveCache);
    }

    if (!cacheMostrado) pintarEstadoNoticias("Consultando noticias ambientales de Colombia...");

    try {
        const respuesta = await peticionSegura(`/api/noticias/ambientales?${parametros}`, "GET");
        if (!respuesta.ok) throw new Error(respuesta.datos.mensaje || "No fue posible cargar las noticias");

        const datos = respuesta.datos;
        pintarRespuestaNoticias(datos, pagina, busqueda);
        sessionStorage.setItem(claveCache, JSON.stringify({ guardadoEn: Date.now(), datos }));
    } catch (error) {
        console.error("Error cargando noticias ambientales:", error);
        if (cacheMostrado) return;
        grid.replaceChildren();
        grid.style.display = "";
        pintarDestacada(null);
        pintarEstadoNoticias("No pudimos cargar las noticias. Inténtalo de nuevo más tarde.", "danger");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const buscador = document.getElementById("buscar-noticias");
    if (!buscador || !document.getElementById("noticias-grid")) return;

    buscador.addEventListener("input", () => {
        clearTimeout(temporizadorBusqueda);
        temporizadorBusqueda = setTimeout(() => cargarNoticias(1), 350);
    });
    cargarNoticias(paginaNoticias);
});
