/**
 * Archivo: estadisticas.js
 * Propósito: Conectarse al backend para traer el historial de reciclaje del usuario,
 * actualizar las tarjetas de resumen numéricas y pintar las gráficas (Chart.js).
 */

async function cargarEstadisticas() {
    // 1. Extraemos el usuario del LocalStorage para saber su ID
    const usuarioGuardado = localStorage.getItem("usuario");
    if (!usuarioGuardado) return;

    const usuario = JSON.parse(usuarioGuardado);

    try {
        // 2. Pedimos los datos a Flask usando nuestra función maestra
        // Asumimos que la ruta devolverá los totales y un desglose por material
        const endpoint = `/api/estadisticas/usuario/${usuario.id_usuario}`;
        const respuesta = await peticionSegura(endpoint, "GET");

        if (respuesta.ok) {
            const datosReales = respuesta.datos;

            // 3. Actualizamos las tarjetas numéricas (El HTML debe tener estos IDs)
            actualizarTexto("stat-total-puntos", datosReales.total_puntos || 0);
            actualizarTexto("stat-total-kg", datosReales.total_kg || 0);
            actualizarTexto("stat-co2", datosReales.co2_ahorrado || 0);

            // 4. Dibujamos la gráfica principal de Materiales
            dibujarGraficaMateriales(datosReales.desglose_materiales);

        } else {
            console.warn("No se pudieron cargar las estadísticas:", respuesta.datos.mensaje);
        }
    } catch (error) {
        console.error("Error de conexión al cargar estadísticas:", error);
    }
}

/**
 * Función auxiliar para inyectar texto rápidamente en los span/div del HTML.
 * @function actualizarTexto
 * @param {string} id - El ID del elemento HTML.
 * @param {string|number} valor - El valor real a inyectar.
 */
function actualizarTexto(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) {
        elemento.textContent = valor;
    }
}

/**
 * Función para renderizar una gráfica de dona (Doughnut) usando Chart.js
 * @function dibujarGraficaMateriales
 * @param {Array} materiales - Arreglo de objetos. Ej: [{ material: "Plástico", cantidad: 15 }, ...]
 */
function dibujarGraficaMateriales(materiales) {
    const canvas = document.getElementById("grafica-materiales");
    if (!canvas) return; // Si no hay canvas en esta pantalla, no hace nada

    // Datos por defecto por si el usuario es nuevo y no ha reciclado nada
    let etiquetas = ["Sin registros aún"];
    let cantidades = [1];
    let colores = ["#e6eeff"]; // Color gris/azulado claro

    if (materiales && materiales.length > 0) {
        // Extraemos las columnas de la base de datos
        etiquetas = materiales.map(item => item.material);
        cantidades = materiales.map(item => item.cantidad);

        // Paleta de colores corporativa de GreenUp
        colores = ['#003d6c', '#296c1f', '#acf597', '#f1c40f', '#e74c3c', '#8e44ad'];
    }

    // Magia de Chart.js
    new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: etiquetas,
            datasets: [{
                data: cantidades,
                backgroundColor: colores,
                borderWidth: 0,
                hoverOffset: 5 // Efecto de salto al pasar el mouse
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// Detonamos la carga justo cuando la pantalla termina de renderizarse
document.addEventListener("DOMContentLoaded", cargarEstadisticas);