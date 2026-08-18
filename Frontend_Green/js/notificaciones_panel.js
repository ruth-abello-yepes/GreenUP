/**
 * Archivo: notificaciones_panel.js
 * Da vida al botón de notificaciones del ciudadano y agrega accesos de soporte.
 */

/**
 * Crea el panel flotante de notificaciones para ciudadano.
 */
function asegurarPanelNotificacionesCiudadano() {
    if (document.getElementById("greenup-panel-notificaciones")) return;

    const panel = document.createElement("section");
    panel.id = "greenup-panel-notificaciones";
    panel.className = "card border-0 shadow position-fixed";
    panel.style.width = "min(360px, calc(100vw - 24px))";
    panel.style.top = "84px";
    panel.style.right = "12px";
    panel.style.zIndex = "1080";
    panel.style.borderRadius = "20px";
    panel.style.display = "none";
    panel.innerHTML = `
        <div class="card-body p-3">
            <div class="d-flex align-items-center justify-content-between mb-3">
                <div>
                    <h2 class="h6 mb-1">Notificaciones</h2>
                    <p class="small text-secondary mb-0">Actividad reciente de tu cuenta</p>
                </div>
                <span class="badge rounded-pill text-bg-success" id="greenup-badge-notificaciones-panel">0</span>
            </div>
            <div id="greenup-lista-notificaciones" class="d-grid gap-2">
                <div class="alert alert-light border mb-0">Cargando notificaciones...</div>
            </div>
        </div>
    `;
    document.body.appendChild(panel);
}

/**
 * Busca el botón de notificaciones en la navegación del ciudadano.
 * @returns {HTMLButtonElement|null}
 */
function obtenerBotonNotificacionesCiudadano() {
    return document.querySelector('button[aria-label*="notificación"], button[aria-label*="Notificaciones"]');
}

/**
 * Alterna la visibilidad del panel.
 */
function alternarPanelNotificacionesCiudadano() {
    asegurarPanelNotificacionesCiudadano();
    const panel = document.getElementById("greenup-panel-notificaciones");
    panel.style.display = panel.style.display === "none" ? "block" : "none";
}

/**
 * Carga notificaciones desde el backend.
 */
async function cargarPanelNotificacionesCiudadano() {
    const lista = document.getElementById("greenup-lista-notificaciones");
    const badge = document.getElementById("greenup-badge-notificaciones-panel");
    const indicador = document.getElementById("indicador-notificaciones");
    if (!lista || !badge) return;

    try {
        const respuesta = await peticionSegura("/api/notificaciones", "GET");
        if (!respuesta.ok) throw new Error(respuesta.datos.mensaje || "No fue posible cargar las notificaciones");
        const notificaciones = respuesta.datos || [];
        const noLeidas = notificaciones.filter((item) => !item.leida).length;

        badge.textContent = String(noLeidas);
        if (indicador) indicador.hidden = noLeidas === 0;

        if (!notificaciones.length) {
            lista.innerHTML = `<div class="border rounded-4 p-3 text-secondary bg-light">No tienes notificaciones nuevas.</div>`;
            return;
        }

        lista.innerHTML = notificaciones.map((item) => `
            <button type="button" class="btn btn-light text-start border rounded-4 p-3 ${item.leida ? "" : "border-success"}" data-notificacion-id="${item.id_notificacion}">
                <strong class="d-block mb-1">${item.titulo}</strong>
                <span class="small text-secondary d-block mb-2">${item.mensaje}</span>
                <small class="text-secondary">${new Date(item.fecha_hora).toLocaleString("es-CO")}</small>
            </button>
        `).join("");

        lista.querySelectorAll("[data-notificacion-id]").forEach((boton) => {
            boton.addEventListener("click", async () => {
                const id = boton.dataset.notificacionId;
                await peticionSegura(`/api/notificaciones/${id}/leida`, "PUT");
                await cargarPanelNotificacionesCiudadano();
            });
        });
    } catch (error) {
        lista.innerHTML = `<div class="border rounded-4 p-3 text-secondary bg-light">Tus notificaciones aparecerán aquí cuando estén disponibles.</div>`;
    }
}

/**
 * Agrega acciones reales de soporte y WhatsApp.
 */
function prepararAccionesSoporteGreenUp() {
    document.querySelectorAll("[data-greenup-mail]").forEach((enlace) => {
        enlace.href = "mailto:greenup213@gmail.com?subject=Soporte%20GreenUp";
    });
    document.querySelectorAll("[data-greenup-whatsapp]").forEach((enlace) => {
        enlace.href = "https://wa.me/573185810461?text=Hola%20GreenUp,%20necesito%20soporte";
        enlace.target = "_blank";
        enlace.rel = "noopener noreferrer";
    });

    document.querySelectorAll("a").forEach((enlace) => {
        const texto = (enlace.textContent || "").trim().toLowerCase();
        if (texto.includes("soporte")) {
            enlace.href = "mailto:greenup213@gmail.com?subject=Soporte%20GreenUp";
        }
    });

    if (!document.getElementById("greenup-whatsapp-float")) {
        const boton = document.createElement("a");
        boton.id = "greenup-whatsapp-float";
        boton.href = "https://wa.me/573185810461?text=Hola%20GreenUp,%20necesito%20soporte";
        boton.target = "_blank";
        boton.rel = "noopener noreferrer";
        boton.className = "btn btn-success rounded-circle shadow position-fixed d-inline-flex align-items-center justify-content-center";
        boton.style.width = "58px";
        boton.style.height = "58px";
        boton.style.right = "18px";
        boton.style.bottom = "18px";
        boton.style.zIndex = "1080";
        boton.title = "Escribir por WhatsApp";
        boton.innerHTML = '<span class="material-symbols-outlined">forum</span>';
        document.body.appendChild(boton);
    }

    if (!document.getElementById("greenup-reciclaje-float")) {
        const botonRegistro = document.createElement("button");
        botonRegistro.id = "greenup-reciclaje-float";
        botonRegistro.type = "button";
        botonRegistro.className = "btn btn-success rounded-circle shadow position-fixed d-inline-flex align-items-center justify-content-center";
        botonRegistro.style.width = "58px";
        botonRegistro.style.height = "58px";
        botonRegistro.style.right = "18px";
        botonRegistro.style.bottom = "88px";
        botonRegistro.style.zIndex = "1080";
        botonRegistro.title = "Registrar reciclaje";
        botonRegistro.setAttribute("aria-label", "Registrar reciclaje");
        botonRegistro.innerHTML = '<span class="material-symbols-outlined">add</span>';

        botonRegistro.addEventListener("click", () => {
            const token = localStorage.getItem("token");
            const usuarioGuardado = localStorage.getItem("usuario");

            if (!token || !usuarioGuardado) {
                window.location.href = "../public/public_login.html";
                return;
            }

            window.location.href = "ciudadano_registrar_reciclaje.html";
        });

        document.body.appendChild(botonRegistro);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    asegurarPanelNotificacionesCiudadano();
    prepararAccionesSoporteGreenUp();

    const boton = obtenerBotonNotificacionesCiudadano();
    if (boton) {
        boton.addEventListener("click", async (evento) => {
            evento.preventDefault();
            alternarPanelNotificacionesCiudadano();
            await cargarPanelNotificacionesCiudadano();
        });
    }

    document.addEventListener("click", (evento) => {
        const panel = document.getElementById("greenup-panel-notificaciones");
        const botonActual = obtenerBotonNotificacionesCiudadano();
        if (!panel || panel.style.display === "none") return;
        if (panel.contains(evento.target)) return;
        if (botonActual && botonActual.contains(evento.target)) return;
        panel.style.display = "none";
    });
});
