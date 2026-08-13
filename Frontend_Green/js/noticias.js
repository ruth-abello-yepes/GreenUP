/** Noticias ambientales reales para la vista del ciudadano. */

const IMAGEN_NOTICIA_FALLBACK =
    "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=900&q=80";
let paginaNoticias = 1;
let temporizadorBusqueda = null;

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
    const articulo = crearElemento("article", "card gu-card h-100 border-0");
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

    if (noticia.url_original) {
        const enlace = crearElemento(
            "a",
            "text-gu-secondary fw-bold text-decoration-none d-flex align-items-center gap-1 mt-auto",
            "Leer noticia"
        );
        enlace.href = noticia.url_original;
        enlace.target = "_blank";
        enlace.rel = "noopener noreferrer";
        enlace.appendChild(crearElemento("span", "material-symbols-outlined fs-5", "chevron_right"));
        cuerpo.appendChild(enlace);
    }

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
    if (totalPaginas <= 1) {
        contenedor.closest("nav").hidden = true;
        return;
    }
    contenedor.closest("nav").hidden = false;

    const agregarBoton = (texto, pagina, deshabilitado = false, activo = false) => {
        const item = crearElemento("li", `page-item${deshabilitado ? " disabled" : ""}${activo ? " active" : ""}`);
        const boton = crearElemento("button", "page-link border-0", texto);
        boton.type = "button";
        boton.disabled = deshabilitado;
        boton.addEventListener("click", () => cargarNoticias(pagina));
        item.appendChild(boton);
        contenedor.appendChild(item);
    };

    agregarBoton("‹", paginacion.pagina - 1, paginacion.pagina <= 1);
    for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
        agregarBoton(String(pagina), pagina, false, pagina === paginacion.pagina);
    }
    agregarBoton("›", paginacion.pagina + 1, paginacion.pagina >= totalPaginas);
}

function pintarEstadoNoticias(mensaje, tipo = "info") {
    const estado = document.getElementById("estado-noticias");
    estado.className = `alert alert-${tipo} mb-4`;
    estado.textContent = mensaje;
    estado.hidden = !mensaje;
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
    buscador.addEventListener("input", () => {
        clearTimeout(temporizadorBusqueda);
        temporizadorBusqueda = setTimeout(() => cargarNoticias(1), 350);
    });
    cargarNoticias(paginaNoticias);
});
