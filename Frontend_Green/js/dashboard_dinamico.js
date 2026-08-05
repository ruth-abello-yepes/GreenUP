document.addEventListener("DOMContentLoaded", function () {
    const chartContainer = document.getElementById("actividad-semanal-chart");

    async function cargarActividadSemanalReal() {
        try {
            // 1. Toca la puerta del Backend (Flask)
            const respuesta = await fetch('http://localhost:5000/api/estadisticas/semana_actual', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!respuesta.ok) throw new Error("Error en el servidor");

            // 2. Recibe los datos de MySQL
            const datosSemana = await respuesta.json();

            // 3. Regla matemática para calcular la altura
            const maxKg = Math.max(...datosSemana.map(d => d.kg));

            // 4. Limpiamos el "Cargando..."
            chartContainer.innerHTML = '';

            // 5. Dibujamos las barras reales
            datosSemana.forEach(dato => {
                const alturaPorcentaje = maxKg === 0 ? 0 : (dato.kg / maxKg) * 100;

                const esDiaDestacado = dato.kg >= 10;
                const colorBarra = esDiaDestacado ? 'bg-gu-primary' : 'style="background-color: rgba(6, 85, 145, 0.2);"';
                const colorTexto = esDiaDestacado ? 'text-gu-primary fw-bold' : '';

                const barraHTML = `
                    <div class="chart-col">
                        <div class="chart-bar ${esDiaDestacado ? 'bg-gu-primary' : ''}" 
                             style="height: ${alturaPorcentaje}%; ${!esDiaDestacado ? 'background-color: rgba(6, 85, 145, 0.2);' : ''}">
                            <div class="chart-tooltip">${dato.kg.toFixed(1)}kg</div>
                        </div>
                        <div class="chart-label ${colorTexto}">${dato.dia}</div>
                    </div>
                `;
                chartContainer.innerHTML += barraHTML;
            });

        } catch (error) {
            console.error("Error cargando gráfica:", error);
            chartContainer.innerHTML = '<p class="text-danger small m-auto">Error conectando con la Base de Datos.</p>';
        }
    }

    cargarActividadSemanalReal();
});