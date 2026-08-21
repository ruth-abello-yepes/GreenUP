/**
 * Archivo: notificaciones_panel.js
 * Da vida al botón de notificaciones del ciudadano y agrega accesos de soporte.
 */

/**
 * Escapa texto antes de escribirlo en HTML para evitar contenido extraño.
 */
function escaparNotificacion(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/**
 * Convierte fechas de Supabase en un texto corto para el panel.
 */
function formatearFechaNotificacion(valor) {
    if (!valor) return "Ahora";
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return "Ahora";
    return fecha.toLocaleString("es-CO", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * Crea el panel flotante de notificaciones para ciudadano.
 */
function asegurarPanelNotificacionesCiudadano() {
    if (document.getElementById("greenup-panel-notificaciones")) return;

    const panel = document.createElement("section");
    panel.id = "greenup-panel-notificaciones";
    panel.className = "greenup-notifications-menu";
    panel.setAttribute("aria-hidden", "true");
    panel.setAttribute("aria-label", "Panel de notificaciones");
    panel.style.width = "min(360px, calc(100vw - 24px))";
    panel.style.width = "min(390px, calc(100vw - 24px))";
    panel.style.top = "74px";
    panel.style.right = "12px";
    panel.style.zIndex = "1080";
    panel.style.display = "none";
    panel.innerHTML = `
        <div class="notifications-header">
            <div>
                <h2>Notificaciones</h2>
                    <p>Actividad reciente del ciudadano</p>
            </div>
            <span class="notifications-badge" id="greenup-badge-notificaciones-panel">0</span>
        </div>
        <div id="greenup-lista-notificaciones" class="notifications-list">
            <article class="notification-item empty">
                <span class="material-symbols-outlined">hourglass_empty</span>
                <div>
                    <strong>Cargando notificaciones</strong>
                    <p>Estamos consultando tus alertas guardadas.</p>
                </div>
            </article>
        </div>
    `;
    document.body.appendChild(panel);
    asegurarEstilosNotificacionesCiudadano();
}

/**
 * Agrega estilos propios del panel ciudadano sin depender de cada HTML.
 */
function asegurarEstilosNotificacionesCiudadano() {
    if (document.getElementById("greenup-notificaciones-style")) return;

    const estilos = document.createElement("style");
    estilos.id = "greenup-notificaciones-style";
    estilos.textContent = `
        .greenup-notifications-menu {
            background: #ffffff;
            border: 1px solid #d9eadf;
            border-radius: 16px;
            box-shadow: 0 20px 45px rgba(0, 61, 108, .16);
            padding: 16px;
            position: fixed;
        }

        .greenup-notifications-menu .notifications-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
            border-bottom: 1px solid #e5efe9;
            padding-bottom: 14px;
            margin-bottom: 14px;
        }

        .greenup-notifications-menu h2 {
            color: #0f172a;
            font-size: 1.18rem;
            font-weight: 800;
            margin: 0;
        }

        .greenup-notifications-menu p {
            color: #64748b;
            margin: 0;
        }

        .greenup-notifications-menu .notifications-badge {
            align-items: center;
            background: #087a2e;
            border-radius: 999px;
            color: #ffffff;
            display: inline-flex;
            font-weight: 800;
            height: 30px;
            justify-content: center;
            min-width: 30px;
            padding: 0 10px;
        }

        .greenup-notifications-menu .notifications-list {
            display: grid;
            gap: 10px;
            max-height: 420px;
            overflow-y: auto;
        }

        .greenup-notifications-menu .notification-item {
            align-items: flex-start;
            background: #f8fbf9;
            border: 1px solid #d8eadf;
            border-radius: 16px;
            color: #0f172a;
            display: flex;
            gap: 12px;
            padding: 14px;
            text-align: left;
            width: 100%;
        }

        .greenup-notifications-menu button.notification-item {
            cursor: pointer;
        }

        .greenup-notifications-menu .notification-item.unread {
            background: #eefbf2;
            border-color: #10a64a;
        }

        .greenup-notifications-menu .notification-item.empty {
            align-items: center;
            border-style: dashed;
            justify-content: center;
            color: #0f172a;
            flex-direction: column;
            gap: 10px;
            min-height: 168px;
            text-align: center;
        }

        .greenup-notifications-menu .notification-item.empty .material-symbols-outlined {
            border: 1px solid #bfe3cc;
            border-radius: 10px;
            font-size: 2rem;
            padding: 4px;
        }

        .greenup-notifications-menu .material-symbols-outlined {
            color: #087a2e;
            flex: 0 0 auto;
        }

        .greenup-notifications-menu strong {
            display: block;
            font-weight: 800;
            margin-bottom: 4px;
        }

        .greenup-notifications-menu small {
            color: #64748b;
            display: block;
            margin-top: 8px;
        }
    `;
    document.head.appendChild(estilos);
}

/**
 * Busca el botón de notificaciones en la navegación del ciudadano.
 * @returns {HTMLButtonElement|null}
 */
function obtenerBotonNotificacionesCiudadano() {
    const botonPorNombre = document.querySelector(
        'button[aria-label*="notificación"], button[aria-label*="Notificaciones"], button[title*="Notificaciones"]'
    );

    if (botonPorNombre) {
        return botonPorNombre;
    }

    const iconoNotificaciones = Array.from(document.querySelectorAll(".material-symbols-outlined"))
        .find((icono) => (icono.textContent || "").trim() === "notifications");

    if (!iconoNotificaciones) {
        return null;
    }

    const boton = iconoNotificaciones.closest("button");

    if (boton) {
        boton.setAttribute("aria-label", "Notificaciones");
        return boton;
    }

    return null;
}

/**
 * Busca el punto rojo de notificaciones aunque algunas pantallas no tengan ID.
 * @returns {HTMLElement|null}
 */
function obtenerIndicadorNotificacionesCiudadano() {
    const indicadorPorId = document.getElementById("indicador-notificaciones");

    if (indicadorPorId) {
        return indicadorPorId;
    }

    const boton = obtenerBotonNotificacionesCiudadano();

    if (!boton) {
        return null;
    }

    const indicador = boton.querySelector(".bg-danger.rounded-circle");

    if (indicador) {
        indicador.id = "indicador-notificaciones";
        return indicador;
    }

    return null;
}

/**
 * Alterna la visibilidad del panel.
 */
function alternarPanelNotificacionesCiudadano() {
    asegurarPanelNotificacionesCiudadano();
    const panel = document.getElementById("greenup-panel-notificaciones");
    const abrir = panel.style.display === "none";
    panel.style.display = abrir ? "block" : "none";
    panel.setAttribute("aria-hidden", String(!abrir));
}

/**
 * Carga notificaciones desde el backend.
 */
async function cargarPanelNotificacionesCiudadano() {
    const lista = document.getElementById("greenup-lista-notificaciones");
    const badge = document.getElementById("greenup-badge-notificaciones-panel");
    const indicador = obtenerIndicadorNotificacionesCiudadano();
    if (!lista || !badge) return;

    try {
        if (typeof peticionSegura !== "function") {
            throw new Error("No se cargó el archivo api.js en esta pantalla");
        }

        const respuesta = await peticionSegura("/api/notificaciones", "GET");
        if (!respuesta.ok) throw new Error(respuesta.datos.mensaje || "No fue posible cargar las notificaciones");
        const notificaciones = respuesta.datos || [];
        const noLeidas = notificaciones.filter((item) => !item.leida).length;

        badge.textContent = String(noLeidas);
        if (indicador) indicador.hidden = noLeidas === 0;

        if (!notificaciones.length) {
            lista.innerHTML = `
                <article class="notification-item empty">
                    <span class="material-symbols-outlined">inbox</span>
                    <div>
                        <strong>Sin notificaciones</strong>
                        <p>Cuando haya alertas, solicitudes o cambios importantes aparecerán aquí.</p>
                    </div>
                </article>
            `;
            return;
        }

        lista.innerHTML = notificaciones.map((item) => `
            <button type="button" class="notification-item ${item.leida ? "" : "unread"}" data-notificacion-id="${item.id_notificacion}">
                <span class="material-symbols-outlined">${item.leida ? "notifications" : "notifications_active"}</span>
                <div>
                    <strong>${escaparNotificacion(item.titulo)}</strong>
                    <p>${escaparNotificacion(item.mensaje)}</p>
                    <small>${escaparNotificacion(formatearFechaNotificacion(item.fecha_hora || item.fecha))}</small>
                </div>
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
        lista.innerHTML = `
            <article class="notification-item empty">
                <span class="material-symbols-outlined">wifi_off</span>
                <div>
                    <strong>No se pudieron cargar</strong>
                    <p>Verifica que el backend esté activo e inténtalo de nuevo.</p>
                </div>
            </article>
        `;
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
        boton.innerHTML = '<span class="material-symbols-outlined">support_agent</span>';
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
        cargarPanelNotificacionesCiudadano();
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
