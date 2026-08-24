/**
 * Dashboard de estadisticas del ciudadano.
 * Consume exclusivamente los datos del usuario autenticado.
 */

let graficaMateriales = null;
let graficaEvolucion = null;

const formateadorNumero = new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 1
});

function actualizarTexto(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = valor;
}

function mostrarEstado(mensaje = "", tipo = "danger") {
    const estado = document.getElementById("estado-estadisticas");
    if (!estado) return;

    estado.textContent = mensaje;
    estado.className = `alert alert-${tipo} mb-4`;
    estado.hidden = true;
}

function formatearUltimaEntrega(fechaIso) {
    if (!fechaIso) return "Aún no tienes entregas registradas";

    const fecha = new Date(fechaIso);
    if (Number.isNaN(fecha.getTime())) return "Fecha no disponible";

    return `Última: ${new Intl.DateTimeFormat("es-CO", {
        day: "numeric",
        month: "short",
        year: "numeric"
    }).format(fecha)}`;
}

function pintarResumen(datos) {
    actualizarTexto("total-puntos", formateadorNumero.format(datos.kg_mes || 0));
    actualizarTexto("total-kgs", formateadorNumero.format(datos.total_kg || 0));
    actualizarTexto("total-entregas", formateadorNumero.format(datos.total_entregas || 0));
    actualizarTexto("puntos-mes", "Material confirmado este mes");
    actualizarTexto("kgs-mes", `${formateadorNumero.format(datos.kg_mes || 0)} kg este mes`);
    actualizarTexto("ultima-entrega", formatearUltimaEntrega(datos.ultima_entrega));
}

function crearGraficaMateriales(materiales = []) {
    const canvas = document.getElementById("graficaMateriales");
    if (!canvas) return;

    const tieneDatos = materiales.some(item => Number(item.cantidad) > 0);
    const etiquetas = tieneDatos ? materiales.map(item => item.material) : ["Sin registros"];
    const cantidades = tieneDatos ? materiales.map(item => Number(item.cantidad)) : [1];

    if (graficaMateriales) graficaMateriales.destroy();
    graficaMateriales = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: etiquetas,
            datasets: [{
                data: cantidades,
                backgroundColor: tieneDatos
                    ? ["#003d6c", "#296c1f", "#343d42", "#a0caff", "#90d87d", "#f1c40f", "#8e44ad"]
                    : ["#e6eeff"],
                borderWidth: 0,
                hoverOffset: tieneDatos ? 12 : 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "70%",
            plugins: {
                legend: {
                    position: "right",
                    labels: { usePointStyle: true, padding: 20, font: { family: "Inter", size: 12 } }
                },
                tooltip: { enabled: tieneDatos }
            }
        }
    });
}

function etiquetaMes(mes) {
    const fecha = new Date(`${mes}-01T00:00:00`);
    if (Number.isNaN(fecha.getTime())) return mes;
    const texto = new Intl.DateTimeFormat("es-CO", { month: "short" }).format(fecha);
    return texto.charAt(0).toUpperCase() + texto.slice(1).replace(".", "");
}

function crearGraficaEvolucion(evolucion = []) {
    const canvas = document.getElementById("graficaEvolucion");
    if (!canvas) return;

    const contexto = canvas.getContext("2d");
    const gradiente = contexto.createLinearGradient(0, 0, 0, 400);
    gradiente.addColorStop(0, "rgba(0, 61, 108, 0.2)");
    gradiente.addColorStop(1, "rgba(0, 61, 108, 0)");

    if (graficaEvolucion) graficaEvolucion.destroy();
    graficaEvolucion = new Chart(contexto, {
        type: "line",
        data: {
            labels: evolucion.map(item => etiquetaMes(item.mes)),
            datasets: [{
                label: "Kg recuperados",
                data: evolucion.map(item => Number(item.kg)),
                borderColor: "#003d6c",
                backgroundColor: gradiente,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: "#003d6c",
                pointBorderColor: "#ffffff",
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                    grid: { color: "rgba(193, 199, 209, 0.2)" },
                    border: { display: false }
                },
                x: { grid: { display: false }, border: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function iniciales(nombre = "Eco Líder") {
    return nombre.split(/\s+/).filter(Boolean).slice(0, 2).map(parte => parte[0]).join("").toUpperCase();
}

function crearRanking(ranking = []) {
    const contenedor = document.getElementById("ranking-ciudadanos");
    if (!contenedor) return;
    contenedor.replaceChildren();

    if (!ranking.length) {
        const vacio = document.createElement("p");
        vacio.className = "text-muted small text-center p-4 mb-0";
        vacio.textContent = "Aún no hay ciudadanos en el ranking.";
        contenedor.appendChild(vacio);
        return;
    }

    ranking.forEach((item, indice) => {
        const fila = document.createElement("div");
        fila.className = "ranking-item p-3 d-flex align-items-center gap-3";
        if (item.es_usuario_actual) fila.classList.add("ranking-active-user");
        if (indice === 5) fila.classList.add("border-top", "border-2");

        const posicion = document.createElement("div");
        posicion.className = "fw-bold fs-5 text-center";
        posicion.style.width = "25px";
        posicion.style.color = ["#d69e00", "#94a3b8", "#fb923c"][item.posicion - 1] || "#64748b";
        posicion.textContent = item.posicion;

        const avatar = document.createElement("div");
        avatar.className = "rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0";
        avatar.style.width = "40px";
        avatar.style.height = "40px";
        avatar.style.backgroundColor = item.es_usuario_actual ? "#296c1f" : "#e6eeff";
        avatar.style.color = item.es_usuario_actual ? "white" : "#003d6c";
        avatar.textContent = iniciales(item.nombre);

        const datos = document.createElement("div");
        datos.className = "flex-grow-1";
        const nombre = document.createElement("p");
        nombre.className = `fw-bold mb-0 small ${item.es_usuario_actual ? "text-gu-secondary" : "text-dark"}`;
        nombre.textContent = `${item.nombre}${item.es_usuario_actual ? " (Tú)" : ""}`;
        const impacto = document.createElement("p");
        impacto.className = "text-muted small mb-0";
        impacto.style.fontSize = "0.75rem";
        impacto.textContent = `${formateadorNumero.format(item.total_kg || 0)} kg recuperados`;
        datos.append(nombre, impacto);

        fila.append(posicion, avatar, datos);
        if (item.posicion <= 3) {
            const medalla = document.createElement("span");
            medalla.className = "material-symbols-outlined";
            medalla.style.color = posicion.style.color;
            medalla.textContent = "workspace_premium";
            fila.appendChild(medalla);
        }
        contenedor.appendChild(fila);
    });
}

async function cargarEstadisticas() {
    try {
        const respuesta = await peticionSegura("/api/estadisticas/ciudadano", "GET");
        if (!respuesta.ok) {
            if (respuesta.status === 401) {
                localStorage.removeItem("usuario");
                localStorage.removeItem("token");
                window.location.href = "../public/public_login.html";
                return;
            }
            throw new Error(respuesta.datos.mensaje || "No se pudieron cargar las estadísticas");
        }

        pintarResumen(respuesta.datos);
        crearGraficaMateriales(respuesta.datos.desglose_materiales);
        crearGraficaEvolucion(respuesta.datos.evolucion_mensual);
        crearRanking(respuesta.datos.ranking);
        mostrarEstado();
    } catch (error) {
        console.error("Error al cargar las estadísticas:", error);
        mostrarEstado("");
        crearGraficaMateriales([]);
        crearGraficaEvolucion([]);
        crearRanking([]);
    }
}

document.addEventListener("DOMContentLoaded", cargarEstadisticas);
