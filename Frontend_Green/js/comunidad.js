/**
 * Archivo: comunidad.js
 * Maneja foro, respuestas con foto, feed de noticias y juego educativo.
 */

/**
 * Escapa texto plano para mostrarlo de forma segura en HTML.
 * @param {string} valor
 * @returns {string}
 */
function escaparComunidad(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/**
 * Muestra mensajes suaves dentro de la pantalla del foro.
 * @param {string} selector
 * @param {string} tipo
 * @param {string} mensaje
 */
function mostrarAvisoComunidad(selector, tipo, mensaje) {
    const contenedor = document.querySelector(selector);
    if (!contenedor) return;
    contenedor.className = `alert alert-${tipo}`;
    contenedor.textContent = mensaje;
    contenedor.hidden = !mensaje;
}

/**
 * Convierte una letra de respuesta en texto legible para el usuario.
 * @param {string} letra
 * @returns {string}
 */
function formatearLetraRespuesta(letra) {
    const valor = String(letra || "").toUpperCase();
    return valor ? `Opción ${valor}` : "Sin respuesta";
}

/**
 * Lee una imagen local y la convierte a Base64 para enviarla en JSON.
 * @param {HTMLInputElement|null} input
 * @returns {Promise<string>}
 */
function leerImagenBase64(input) {
    return new Promise((resolve) => {
        const archivo = input?.files?.[0];
        if (!archivo) {
            resolve("");
            return;
        }

        if (!archivo.type.startsWith("image/")) {
            resolve("");
            return;
        }

        const lector = new FileReader();
        lector.onload = () => resolve(String(lector.result || ""));
        lector.onerror = () => resolve("");
        lector.readAsDataURL(archivo);
    });
}

/**
 * Obtiene el usuario guardado localmente.
 * @returns {Record<string, any>}
 */
function obtenerUsuarioComunidad() {
    try {
        return JSON.parse(localStorage.getItem("usuario") || "{}");
    } catch {
        return {};
    }
}

/**
 * Detecta si la pantalla actual pertenece al ciudadano.
 * Se usa como respaldo cuando el localStorage no trae bien el rol.
 * @returns {boolean}
 */
function esPantallaCiudadano() {
    return window.location.pathname.toLowerCase().includes("/pages/ciudadano/");
}

/**
 * Determina si el usuario actual debe comportarse como ciudadano.
 * Prioriza el rol guardado, pero usa la ruta como respaldo visual.
 * @returns {boolean}
 */
function esCiudadanoActual() {
    const usuario = obtenerUsuarioComunidad();
    const rolNumerico = Number(usuario.id_rol ?? usuario.rol_id ?? usuario.idRol ?? 0);
    const rolTexto = String(usuario.rol || usuario.nombre_rol || "").toLowerCase();

    if (rolNumerico === 3) return true;
    if (rolNumerico === 1 || rolNumerico === 2) return false;
    if (rolTexto.includes("ciudad")) return true;

    return esPantallaCiudadano();
}

/**
 * Renderiza el formulario correcto según el rol actual.
 * Ciudadano responde; admin y recicladora publican.
 */
function prepararFormularioForoSegunRol() {
    const panel = document.getElementById("foro-panel-accion");
    if (!panel) return;

    const esCiudadano = esCiudadanoActual();

    if (esCiudadano) {
        panel.innerHTML = `
            <div class="card border-0 shadow-sm rounded-4 h-100">
                <div class="card-body p-4 p-lg-4">
                    <span class="badge rounded-pill px-3 py-2 mb-3" style="background:#003d6c; color:#ffffff;">Participación ciudadana</span>
                    <h2 class="h4 fw-bold mb-3" style="color:#003d6c;">Tu espacio es responder</h2>
                    <p class="text-secondary mb-4">En esta sección el ciudadano no crea foros nuevos. Tu participación consiste en leer los temas activos y responder con dudas, opiniones o aportes útiles para la comunidad.</p>
                    <div class="rounded-4 border p-3 mb-3" style="background:#f7fbff;">
                        <div class="d-flex align-items-center gap-3">
                            <span class="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style="width: 48px; height: 48px; background:#eaf7ef; color:#14803c;">
                                <span class="material-symbols-outlined">thumb_up</span>
                            </span>
                            <div>
                                <div class="fw-semibold">Ganas eco-puntos por responder</div>
                                <div class="small text-secondary">Cada aporte aprobado suma puntos a tu actividad.</div>
                            </div>
                        </div>
                    </div>
                    <div class="rounded-4 border p-3" style="background:#f9fbfc;">
                        <div class="fw-semibold mb-2" style="color:#003d6c;">Recuerda</div>
                        <ul class="small text-secondary ps-3 mb-0">
                            <li>Usa lenguaje respetuoso.</li>
                            <li>Comparte información relacionada con reciclaje y cultura ambiental.</li>
                            <li>Si deseas participar, baja a los temas y responde el que te interese.</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    panel.innerHTML = `
        <article class="card border-0 shadow-sm rounded-4 h-100">
            <div class="card-body p-4">
                <div id="estado-foro" class="alert alert-secondary" hidden></div>
                <form id="form-foro" class="row g-3">
                    <div class="col-12">
                        <label class="form-label fw-semibold">Tipo de publicación</label>
                        <select class="form-select" name="tipo_publicacion" required>
                            <option value="pregunta">Pregunta</option>
                            <option value="opinion">Opinión</option>
                            <option value="tema">Tema</option>
                        </select>
                    </div>
                    <div class="col-12">
                        <label class="form-label fw-semibold">Título</label>
                        <input class="form-control" name="titulo" required maxlength="220">
                    </div>
                    <div class="col-12">
                        <label class="form-label fw-semibold">Imagen opcional</label>
                        <input class="form-control" name="imagen_url" placeholder="https://...">
                    </div>
                    <div class="col-12">
                        <label class="form-label fw-semibold">O sube una foto</label>
                        <input class="form-control" id="foro-imagen-archivo" type="file" accept="image/*">
                    </div>
                    <div class="col-12">
                        <label class="form-label fw-semibold">Contenido</label>
                        <textarea class="form-control" name="contenido" rows="5" required></textarea>
                    </div>
                    <div class="col-12">
                        <button class="btn btn-success rounded-pill px-4" type="submit">Publicar en el foro</button>
                    </div>
                </form>
            </div>
        </article>
    `;

    document.getElementById("form-foro")?.addEventListener("submit", publicarTemaForo);
}

/**
 * Carga los temas del foro y sus respuestas.
 */
async function cargarForoGreenUp() {
    const listado = document.getElementById("foro-listado");
    if (!listado) return;

    try {
        listado.innerHTML = `
            <div class="col-12">
                <div class="card border-0 shadow-sm rounded-4">
                    <div class="card-body p-4 text-center text-secondary">Cargando publicaciones de la comunidad...</div>
                </div>
            </div>
        `;

        const respuesta = await peticionSegura("/api/comunidad/foro", "GET");
        if (!respuesta.ok) throw new Error(respuesta.datos.mensaje || "No fue posible cargar el foro");

        const temas = respuesta.datos || [];
        listado.innerHTML = "";

        if (!temas.length) {
            listado.innerHTML = `
                <div class="col-12">
                    <div class="card border-0 shadow-sm rounded-4">
                        <div class="card-body p-4 text-center">
                            <span class="material-symbols-outlined fs-1 text-secondary">forum</span>
                            <h3 class="h5 mt-3 mb-2">Aún no hay temas publicados</h3>
                            <p class="text-secondary mb-0">Cuando GreenUp o una recicladora publiquen, aparecerán aquí.</p>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        temas.forEach((tema) => {
            const esCiudadano = esCiudadanoActual();
            const columna = document.createElement("div");
            columna.className = "col-12";
            columna.innerHTML = `
                <article class="card border-0 shadow-sm rounded-4 overflow-hidden">
                    ${tema.imagen ? `<img src="${escaparComunidad(tema.imagen)}" class="w-100" alt="${escaparComunidad(tema.titulo)}" style="height:240px;object-fit:cover;">` : ""}
                    <div class="card-body p-4">
                        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
                            <div class="d-flex align-items-center gap-2">
                                <span class="badge text-bg-success rounded-pill px-3 py-2 text-capitalize">${escaparComunidad(tema.tipo_publicacion)}</span>
                                <span class="badge text-bg-light border rounded-pill px-3 py-2">${escaparComunidad(tema.total_respuestas || 0)} respuestas</span>
                            </div>
                            <small class="text-secondary">${new Date(tema.fecha_publicacion).toLocaleString("es-CO")}</small>
                        </div>
                        <h3 class="h4 fw-bold mb-2" style="color:#003d6c;">${escaparComunidad(tema.titulo)}</h3>
                        <p class="text-secondary mb-3">${escaparComunidad(tema.contenido)}</p>
                        <div class="small text-secondary mb-4"><strong>Publicado por:</strong> ${escaparComunidad(tema.autor)}</div>

                        <div class="border-top pt-3">
                            <h4 class="h6 fw-bold mb-3">Respuestas</h4>
                            <div class="d-grid gap-3 mb-4">
                                ${(tema.respuestas || []).length ? (tema.respuestas || []).map((item) => `
                                    <div class="border rounded-4 p-3 bg-light-subtle">
                                        <div class="d-flex justify-content-between gap-3 mb-2">
                                            <strong>${escaparComunidad(item.autor)}</strong>
                                            <small class="text-secondary">${new Date(item.fecha_respuesta).toLocaleString("es-CO")}</small>
                                        </div>
                                        <p class="mb-2 text-secondary">${escaparComunidad(item.respuesta)}</p>
                                        ${item.imagen ? `<img src="${escaparComunidad(item.imagen)}" alt="Respuesta del foro" class="rounded-4 border" style="max-width: 220px; width: 100%; height: auto;">` : ""}
                                    </div>
                                `).join("") : '<p class="text-secondary mb-0">Todavía no hay respuestas en este tema.</p>'}
                            </div>

                            ${esCiudadano ? `
                                <form class="row g-3 formulario-respuesta-foro" data-tema-id="${tema.id_tema}">
                                    <div class="col-12">
                                        <label class="form-label fw-semibold">Tu respuesta</label>
                                        <textarea class="form-control" name="respuesta" rows="3" required></textarea>
                                    </div>
                                    <div class="col-12 col-lg-6">
                                        <label class="form-label fw-semibold">Imagen opcional</label>
                                        <input class="form-control" name="imagen_url" placeholder="https://...">
                                    </div>
                                    <div class="col-12 col-lg-6">
                                        <label class="form-label fw-semibold">O sube una foto</label>
                                        <input class="form-control respuesta-imagen-archivo" type="file" accept="image/*">
                                    </div>
                                    <div class="col-12">
                                        <button class="btn btn-outline-success rounded-pill px-4" type="submit">Responder y ganar puntos</button>
                                    </div>
                                </form>
                            ` : ""}
                        </div>
                    </div>
                </article>
            `;
            listado.appendChild(columna);
        });

        listado.querySelectorAll(".formulario-respuesta-foro").forEach((formulario) => {
            formulario.addEventListener("submit", responderTemaForo);
        });
    } catch (error) {
        listado.innerHTML = `
            <div class="col-12">
                <div class="card border-0 shadow-sm rounded-4">
                    <div class="card-body p-4 text-center text-secondary">No fue posible cargar el foro en este momento.</div>
                </div>
            </div>
        `;
    }
}

/**
 * Publica un tema desde admin o recicladora.
 * @param {SubmitEvent} evento
 */
async function publicarTemaForo(evento) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const datos = Object.fromEntries(new FormData(formulario).entries());
    const base64 = await leerImagenBase64(document.getElementById("foro-imagen-archivo"));
    datos.imagen = base64 || datos.imagen_url || "";
    delete datos.imagen_url;

    try {
        const respuesta = await peticionSegura("/api/comunidad/foro", "POST", datos);
        if (!respuesta.ok) throw new Error(respuesta.datos.mensaje || "No se pudo publicar el tema");
        formulario.reset();
        mostrarAvisoComunidad("#estado-foro", "success", "Tema publicado correctamente.");
        await cargarForoGreenUp();
    } catch (error) {
        mostrarAvisoComunidad("#estado-foro", "warning", error.message || "No se pudo publicar el tema.");
    }
}

/**
 * Envía una respuesta de un ciudadano a un tema del foro.
 * @param {SubmitEvent} evento
 */
async function responderTemaForo(evento) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const idTema = formulario.dataset.temaId;
    const datos = Object.fromEntries(new FormData(formulario).entries());
    const base64 = await leerImagenBase64(formulario.querySelector(".respuesta-imagen-archivo"));
    datos.imagen = base64 || datos.imagen_url || "";
    delete datos.imagen_url;

    try {
        const respuesta = await peticionSegura(`/api/comunidad/foro/${idTema}/respuestas`, "POST", datos);
        if (!respuesta.ok) throw new Error(respuesta.datos.mensaje || "No se pudo responder el tema");
        formulario.reset();
        alert(`Respuesta enviada correctamente. Sumaste ${respuesta.datos.puntos_otorgados || 0} puntos.`);
        await cargarForoGreenUp();
        await cargarResumenJuegoCiudadano();
    } catch (error) {
        alert(error.message || "No se pudo enviar la respuesta.");
    }
}

/**
 * Crea el modal del juego educativo.
 */
function prepararModalJuegoNoticias() {
    if (document.getElementById("modalJuegoNoticias")) return;
    const modal = document.createElement("div");
    modal.className = "modal fade";
    modal.id = "modalJuegoNoticias";
    modal.tabIndex = -1;
    modal.innerHTML = `
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content rounded-4 border-0 shadow">
                <div class="modal-header">
                    <div>
                        <h2 class="modal-title h5 mb-1" id="juegoNoticiasTitulo">Juego educativo</h2>
                        <p class="text-secondary small mb-0">Responde y gana puntos como ciudadano GreenUp.</p>
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body">
                    <div id="estado-juego-noticias" class="alert alert-info">Cargando preguntas...</div>
                    <form id="form-juego-noticias" class="d-grid gap-4"></form>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

/**
 * Abre el quiz de una noticia.
 * @param {number} idNoticia
 * @param {string} titulo
 */
async function abrirQuizNoticia(idNoticia, titulo) {
    prepararModalJuegoNoticias();
    document.getElementById("juegoNoticiasTitulo").textContent = `Juego educativo: ${titulo}`;
    const formulario = document.getElementById("form-juego-noticias");
    formulario.innerHTML = "";
    formulario.dataset.idNoticia = String(idNoticia);
    formulario.noValidate = true;
    new bootstrap.Modal(document.getElementById("modalJuegoNoticias")).show();

    try {
        const respuesta = await peticionSegura(`/api/comunidad/juego/noticias/${idNoticia}/preguntas`, "GET");
        if (!respuesta.ok) throw new Error(respuesta.datos.mensaje || "No se pudieron cargar las preguntas");

        const preguntas = respuesta.datos.preguntas || [];
        if (!preguntas.length) {
            throw new Error("Esta noticia todavía no tiene preguntas disponibles.");
        }

        const encabezado = document.createElement("div");
        encabezado.className = "alert alert-light border rounded-4 mb-0";
        encabezado.innerHTML = `
            <strong class="d-block mb-1">Cuestionario de la noticia</strong>
            <span class="text-secondary small">Responde las ${preguntas.length} preguntas. Si dejas alguna vacía, el sistema te la marcará antes de guardar.</span>
        `;
        formulario.appendChild(encabezado);

        preguntas.forEach((pregunta, indice) => {
            const bloque = document.createElement("fieldset");
            bloque.className = "border rounded-4 p-3 pregunta-juego";
            bloque.dataset.preguntaId = String(pregunta.id_pregunta);
            bloque.innerHTML = `
                <legend class="float-none w-auto px-2 fs-6 fw-bold mb-2">${indice + 1}. ${escaparComunidad(pregunta.pregunta)}</legend>
                ${["A", "B", "C", "D"].map((letra) => `
                    <label class="form-check mb-2">
                        <input class="form-check-input" type="radio" name="pregunta_${pregunta.id_pregunta}" value="${letra}">
                        <span class="form-check-label">${escaparComunidad(pregunta[`opcion_${letra.toLowerCase()}`])}</span>
                    </label>
                `).join("")}
                <div class="invalid-feedback d-block small mt-2" hidden></div>
            `;
            formulario.appendChild(bloque);
        });

        const boton = document.createElement("button");
        boton.type = "submit";
        boton.className = "btn btn-success rounded-pill px-4 py-2";
        boton.textContent = "Enviar respuestas";
        formulario.appendChild(boton);
        formulario.onsubmit = resolverJuegoNoticias;
        mostrarAvisoComunidad("#estado-juego-noticias", "info", "Responde las preguntas para sumar puntos.");
    } catch (error) {
        mostrarAvisoComunidad("#estado-juego-noticias", "warning", error.message || "No fue posible abrir el juego.");
    }
}

/**
 * Envía respuestas del quiz.
 * @param {SubmitEvent} evento
 */
async function resolverJuegoNoticias(evento) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const idNoticia = formulario.dataset.idNoticia;
    const respuestas = {};
    const faltantes = [];

    formulario.querySelectorAll(".pregunta-juego").forEach((bloque, indice) => {
        const aviso = bloque.querySelector(".invalid-feedback");
        if (aviso) {
            aviso.hidden = true;
            aviso.textContent = "";
        }
        bloque.classList.remove("border-danger", "bg-danger-subtle");

        const marcada = bloque.querySelector('input[type="radio"]:checked');
        if (!marcada) {
            faltantes.push(indice + 1);
            bloque.classList.add("border-danger", "bg-danger-subtle");
            if (aviso) {
                aviso.hidden = false;
                aviso.textContent = `Debes responder la pregunta ${indice + 1}.`;
            }
        }
    });

    if (faltantes.length) {
        mostrarAvisoComunidad(
            "#estado-juego-noticias",
            "warning",
            `Faltan respuestas en las preguntas: ${faltantes.join(", ")}.`
        );
        document.getElementById("estado-juego-noticias")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
    }

    new FormData(formulario).forEach((valor, llave) => {
        respuestas[llave.replace("pregunta_", "")] = valor;
    });

    try {
        const respuesta = await peticionSegura(`/api/comunidad/juego/noticias/${idNoticia}/resolver`, "POST", { respuestas });
        if (!respuesta.ok) {
            const errorControlado = new Error(respuesta.datos.mensaje || "No se pudo calificar el juego");
            errorControlado.detalles = respuesta.datos;
            throw errorControlado;
        }
        const datos = respuesta.datos;
        mostrarAvisoComunidad("#estado-juego-noticias", "success", `Obtuviste ${datos.puntaje_obtenido} puntos y acertaste ${datos.respuestas_correctas} de ${datos.total_preguntas}.`);
        document.getElementById("estado-juego-noticias")?.scrollIntoView({ behavior: "smooth", block: "center" });
        formulario.querySelectorAll(".pregunta-juego").forEach((bloque) => {
            bloque.classList.remove("border-danger", "bg-danger-subtle");
        });

        const resumenViejo = formulario.querySelector(".resultado-juego-detalle");
        if (resumenViejo) resumenViejo.remove();

        const detalle = Array.isArray(datos.detalle) ? datos.detalle : [];
        const errores = detalle.filter((item) => !item.correcta);
        const panelResultado = document.createElement("div");
        panelResultado.className = `resultado-juego-detalle alert ${errores.length ? "alert-warning" : "alert-success"} mb-0`;
        panelResultado.innerHTML = errores.length
            ? `
                <strong class="d-block mb-2">Revisa estos errores</strong>
                <ul class="mb-0 ps-3">
                    ${errores.map((item) => `
                        <li class="mb-2">
                            <strong>Pregunta ${escaparComunidad(item.numero)}:</strong> ${escaparComunidad(item.pregunta)}<br>
                            <span>Tu respuesta: ${escaparComunidad(formatearLetraRespuesta(item.seleccion))}.</span><br>
                            <span>Respuesta correcta: ${escaparComunidad(formatearLetraRespuesta(item.respuesta_correcta))}.</span><br>
                            <span class="text-secondary">${escaparComunidad(item.explicacion || "Revisa el contenido de la noticia para reforzar este punto.")}</span>
                        </li>
                    `).join("")}
                </ul>
            `
            : `
                <strong class="d-block mb-2">Excelente</strong>
                <span>Respondiste correctamente las ${detalle.length} preguntas de esta noticia.</span>
            `;
        formulario.appendChild(panelResultado);
        await cargarResumenJuegoCiudadano();
    } catch (error) {
        const respuestaError = error?.detalles || {};
        const errores = Array.isArray(respuestaError.errores) ? respuestaError.errores : [];
        if (errores.length) {
            errores.forEach((item) => {
                const numero = Number(item.numero || 0);
                if (!numero) return;
                const bloque = formulario.querySelectorAll(".pregunta-juego")[numero - 1];
                const aviso = bloque?.querySelector(".invalid-feedback");
                bloque?.classList.add("border-danger", "bg-danger-subtle");
                if (aviso) {
                    aviso.hidden = false;
                    aviso.textContent = item.mensaje || `Debes responder la pregunta ${numero}.`;
                }
            });
        }
        mostrarAvisoComunidad("#estado-juego-noticias", "warning", error.message || "No se pudo enviar el juego.");
        document.getElementById("estado-juego-noticias")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}

/**
 * Carga el puntaje del ciudadano.
 */
async function cargarResumenJuegoCiudadano() {
    const tarjeta = document.getElementById("puntaje-juego-resumen");
    if (!tarjeta) return;
    try {
        const respuesta = await peticionSegura("/api/comunidad/juego/mi-puntaje", "GET");
        if (!respuesta.ok) throw new Error();
        const puntaje = respuesta.datos.puntaje || {};
        tarjeta.innerHTML = `
            <strong class="d-block fs-4 text-gu-primary mb-1">${escaparComunidad(Number(puntaje.puntos_total) || 0)} pts</strong>
            <span class="text-secondary">Participaciones y noticias: ${escaparComunidad(Number(puntaje.noticias_completadas) || 0)}</span>
        `;
    } catch {
        tarjeta.innerHTML = `<span class="text-secondary">Puntaje no disponible</span>`;
    }
}

/**
 * Carga noticias ambientales compactas.
 */
async function cargarFeedNoticiasComunidad() {
    const contenedor = document.getElementById("feed-noticias-comunidad");
    if (!contenedor) return;

    try {
        const respuesta = await peticionSegura("/api/noticias/ambientales?pagina=1&por_pagina=4", "GET");
        if (!respuesta.ok) throw new Error();
        const noticias = respuesta.datos.noticias || [];
        contenedor.innerHTML = noticias.map((noticia) => `
            <article class="card border-0 shadow-sm rounded-4 h-100">
                ${noticia.imagen ? `<img src="${escaparComunidad(noticia.imagen)}" class="card-img-top" alt="${escaparComunidad(noticia.titulo)}" style="height: 180px; object-fit: cover;">` : ""}
                <div class="card-body">
                    <span class="badge text-bg-success rounded-pill mb-2">${escaparComunidad(noticia.categoria || "Ambiental")}</span>
                    <h3 class="h6 fw-bold">${escaparComunidad(noticia.titulo)}</h3>
                    <p class="small text-secondary mb-3">${escaparComunidad(noticia.descripcion || "")}</p>
                    <a class="btn btn-outline-success btn-sm rounded-pill" href="${escaparComunidad(noticia.url_original || "#")}" target="_blank" rel="noopener noreferrer">Leer noticia</a>
                </div>
            </article>
        `).join("");
    } catch {
        contenedor.innerHTML = `<div class="col-12"><div class="card border-0 shadow-sm rounded-4"><div class="card-body text-secondary">Las noticias se mostrarán cuando la fuente esté disponible.</div></div></div>`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    prepararFormularioForoSegunRol();
    cargarForoGreenUp();
    cargarResumenJuegoCiudadano();
    cargarFeedNoticiasComunidad();
});

window.abrirQuizNoticia = abrirQuizNoticia;
