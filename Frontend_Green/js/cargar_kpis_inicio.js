// Función para dibujar el gráfico semanal desde la Base de Datos
async function cargarActividadSemanal() {
    const chartContainer = document.getElementById("actividad-semanal-chart");

    try {
        // Petición ficticia a tu backend Flask (Ej: devuelve un array con los 7 días)
        // const respuesta = await fetch('/api/estadisticas/semanal', ...);
        // const datosSemana = await respuesta.json();

        // EJEMPLO DE DATOS REALES QUE TE ENVIARÍA MYSQL:
        const datosSemana = [
            { dia: 'LUN', kg: 12.5 },
            { dia: 'MAR', kg: 8.2 },
            { dia: 'MIE', kg: 24.0 }, // Este es el mayor (100% de altura)
            { dia: 'JUE', kg: 4.5 },
            { dia: 'VIE', kg: 18.1 },
            { dia: 'SAB', kg: 9.0 },
            { dia: 'DOM', kg: 10.2 }
        ];

        // 1. Encontrar cuál fue el día que más recicló para hacer la regla de 3
        const maxKg = Math.max(...datosSemana.map(d => d.kg));

        // Limpiamos el texto de "Cargando..."
        chartContainer.innerHTML = '';

        // 2. Dibujamos cada barra dinámicamente
        datosSemana.forEach(dato => {
            // Calculamos la altura en porcentaje (Regla de 3)
            // Si el maxKg es 24.0 (100%), ¿cuánto es 12.5?
            const alturaPorcentaje = maxKg === 0 ? 0 : (dato.kg / maxKg) * 100;

            // Lógica de colores: Pintamos de azul fuerte los días que recicló mucho (ej. más de 10kg)
            const esDiaDestacado = dato.kg >= 10;
            const colorBarra = esDiaDestacado ? 'bg-gu-primary' : 'style="background-color: rgba(6, 85, 145, 0.2);"';
            const colorTexto = esDiaDestacado ? 'text-gu-primary fw-bold' : '';

            // Generamos el bloque HTML
            const barraHTML = `
                <div class="chart-col">
                    <div class="chart-bar ${esDiaDestacado ? 'bg-gu-primary' : ''}" 
                         style="height: ${alturaPorcentaje}%; ${!esDiaDestacado ? 'background-color: rgba(6, 85, 145, 0.2);' : ''}">
                        <div class="chart-tooltip">${dato.kg.toFixed(1)}kg</div>
                    </div>
                    <div class="chart-label ${colorTexto}">${dato.dia}</div>
                </div>
            `;

            // Lo inyectamos al HTML
            chartContainer.innerHTML += barraHTML;
        });

    } catch (error) {
        console.error("Error al cargar la gráfica:", error);
        chartContainer.innerHTML = '<p class="text-danger small m-auto">Error al cargar datos.</p>';
    }
}

// Ejecutamos la función
cargarActividadSemanal();