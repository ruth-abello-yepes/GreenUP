/**
 * Inicio dinámico del ciudadano.
 * Todos los indicadores provienen de la sesión y la base de datos de GreenUp.
 */

const formatoNumeroInicio = new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 1
});

function asignarTextoInicio(id, texto) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = texto;
}

function mostrarEstadoInicio(mensaje = "") {
    const estado = document.getElementById("estado-inicio");
    if (!estado) return;
    estado.textContent = mensaje;
    estado.hidden = true;
}

function pintarResumenInicio(datos) {
    const kg = Number(datos.total_kg) || 0;
    const entregas = Number(datos.total_entregas) || 0;
    const posicion = Number(datos.posicion_ranking) || 0;
    const ciudadanos = Number(datos.total_ciudadanos) || 0;

    asignarTextoInicio("puntos-totales-display", formatoNumeroInicio.format(entregas));
    asignarTextoInicio("puntos-mes-display", `${formatoNumeroInicio.format(datos.kg_mes || 0)} kg este mes`);
    asignarTextoInicio("kg-total-display", formatoNumeroInicio.format(kg));
    asignarTextoInicio("kg-mes-display", `${formatoNumeroInicio.format(datos.kg_mes || 0)} kg este mes`);
    asignarTextoInicio(
        "entregas-total-display",
        `${formatoNumeroInicio.format(entregas)} ${entregas === 1 ? "entrega registrada" : "entregas registradas"}`
    );

    if (entregas === 0) {
        asignarTextoInicio(
            "resumen-impacto",
            "Aún no tienes entregas registradas. Registra tu primer reciclaje para comenzar a medir tu impacto."
        );
    } else {
        const ranking = posicion && ciudadanos
            ? ` Ocupas el puesto ${posicion} entre ${ciudadanos} ciudadanos.`
            : "";
        asignarTextoInicio(
            "resumen-impacto",
            `Has recuperado ${formatoNumeroInicio.format(kg)} kg en ${formatoNumeroInicio.format(entregas)} entregas.${ranking}`
        );
    }

    const metaKg = Math.max(10, (Math.floor(kg / 10) + 1) * 10);
    const progreso = Math.min(100, ((kg % 10) / 10) * 100);
    const faltantes = Math.max(0, metaKg - kg);
    const barra = document.getElementById("progreso-puntos");
    if (barra) {
        barra.style.width = `${progreso}%`;
        barra.setAttribute("aria-valuenow", String(Math.round(progreso)));
    }
    asignarTextoInicio(
        "proximo-nivel",
        `Meta sugerida: ${formatoNumeroInicio.format(metaKg)} kg (${formatoNumeroInicio.format(faltantes)} kg restantes)`
    );
}

function pintarActividadSemanal(datosSemana = []) {
    const contenedor = document.getElementById("actividad-semanal-chart");
    if (!contenedor) return;
    contenedor.replaceChildren();

    const maxKg = Math.max(...datosSemana.map(item => Number(item.kg) || 0), 0);

    datosSemana.forEach(item => {
        const kg = Number(item.kg) || 0;
        const porcentaje = maxKg === 0 ? 0 : (kg / maxKg) * 100;
        const destacado = maxKg > 0 && kg === maxKg;

        const columna = document.createElement("div");
        columna.className = "chart-col";

        const barra = document.createElement("div");
        barra.className = `chart-bar${destacado ? " bg-gu-primary" : ""}`;
        barra.style.height = `${Math.max(porcentaje, 3)}%`;
        if (!destacado) barra.style.backgroundColor = "rgba(6, 85, 145, 0.2)";

        const tooltip = document.createElement("div");
        tooltip.className = "chart-tooltip";
        tooltip.textContent = `${formatoNumeroInicio.format(kg)} kg`;
        barra.appendChild(tooltip);

        const etiqueta = document.createElement("div");
        etiqueta.className = `chart-label${destacado ? " text-gu-primary fw-bold" : ""}`;
        etiqueta.textContent = item.dia;

        columna.append(barra, etiqueta);
        contenedor.appendChild(columna);
    });

    if (!datosSemana.length) {
        const vacio = document.createElement("p");
        vacio.className = "text-muted small m-auto";
        vacio.textContent = "No hay actividad disponible.";
        contenedor.appendChild(vacio);
    }
}

function pintarAccesosInicio(datos) {
    const puntos = Number(datos.total_puntos_ecologicos) || 0;
    const contenidos = Number(datos.total_contenidos) || 0;
    const noLeidas = Number(datos.notificaciones_no_leidas) || 0;

    const indicador = document.getElementById("indicador-notificaciones");
    if (indicador) indicador.hidden = noLeidas === 0;
    const botonNotificaciones = document.querySelector('button[aria-label="Notificaciones"]');
    if (botonNotificaciones) {
        botonNotificaciones.setAttribute(
            "aria-label",
            noLeidas === 1 ? "1 notificación no leída" : `${noLeidas} notificaciones no leídas`
        );
    }

    asignarTextoInicio(
        "puntos-eco-disponibles",
        puntos === 1 ? "1 punto ecológico activo" : `${formatoNumeroInicio.format(puntos)} puntos ecológicos activos`
    );
    asignarTextoInicio(
        "contenidos-disponibles",
        contenidos === 1 ? "1 recurso educativo publicado" : `${formatoNumeroInicio.format(contenidos)} recursos educativos publicados`
    );

    const destacado = datos.contenido_destacado;
    if (destacado) {
        asignarTextoInicio("contenido-destacado-titulo", destacado.titulo || "Contenido educativo");
        asignarTextoInicio(
            "contenido-destacado-descripcion",
            destacado.descripcion || `Consulta este recurso de tipo ${destacado.tipo || "educativo"}.`
        );
    } else {
        asignarTextoInicio("contenido-destacado-titulo", "Biblioteca en preparación");
        asignarTextoInicio(
            "contenido-destacado-descripcion",
            "Todavía no hay recursos educativos activos. Cuando se publique el primero aparecerá aquí."
        );
    }
}

async function cargarInicioCiudadano() {
    try {
        const respuesta = await peticionSegura("/api/estadisticas/ciudadano/inicio", "GET");
        if (!respuesta.ok) {
            if (respuesta.status === 401) {
                localStorage.removeItem("usuario");
                localStorage.removeItem("token");
                window.location.href = "../public/public_login.html";
                return;
            }
            throw new Error(respuesta.datos.mensaje || "No se pudo cargar el inicio");
        }

        pintarResumenInicio(respuesta.datos);
        pintarActividadSemanal(respuesta.datos.actividad_semanal);
        pintarAccesosInicio(respuesta.datos);
        mostrarEstadoInicio();
    } catch (error) {
        console.error("Error al cargar el inicio ciudadano:", error);
        mostrarEstadoInicio("");
        pintarResumenInicio({});
        pintarActividadSemanal([]);
        pintarAccesosInicio({});
    }
}

document.addEventListener("DOMContentLoaded", cargarInicioCiudadano);
