(() => {
  const elementos = {
    usuarios: document.getElementById("kpi-total-usuarios"),
    kg: document.getElementById("kpi-kg-reciclados"),
    puntos: document.getElementById("kpi-puntos-ecologicos"),
  };

  const formatearNumero = (valor) => {
    const numero = Number(valor || 0);
    return new Intl.NumberFormat("es-CO", {
      maximumFractionDigits: 0,
    }).format(numero);
  };

  const formatearKg = (valor) => {
    const numero = Number(valor || 0);

    if (numero >= 1000) {
      return `${new Intl.NumberFormat("es-CO", {
        maximumFractionDigits: 1,
      }).format(numero / 1000)} ton`;
    }

    return `${new Intl.NumberFormat("es-CO", {
      maximumFractionDigits: 1,
    }).format(numero)} kg`;
  };

  const aplicarMetricas = (metricas) => {
    if (elementos.usuarios) {
      elementos.usuarios.textContent = formatearNumero(metricas.total_usuarios);
    }

    if (elementos.kg) {
      elementos.kg.textContent = formatearKg(metricas.total_kg_confirmados);
    }

    if (elementos.puntos) {
      elementos.puntos.textContent = formatearNumero(metricas.total_puntos_ecologicos);
    }
  };

  const cargarMetricasInicio = async () => {
    try {
      const respuesta = await fetch(`${API_URL}/api/public/inicio`);

      if (!respuesta.ok) {
        throw new Error("No se pudieron cargar las metricas publicas.");
      }

      const metricas = await respuesta.json();
      aplicarMetricas(metricas);
    } catch (error) {
      console.warn("GreenUp: indicadores publicos no disponibles.", error);
      aplicarMetricas({
        total_usuarios: 0,
        total_kg_confirmados: 0,
        total_puntos_ecologicos: 0,
      });
    }
  };

  document.addEventListener("DOMContentLoaded", cargarMetricasInicio);
})();
