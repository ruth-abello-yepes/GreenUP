/* Carga las preguntas frecuentes administrables desde la base de datos. */
(function () {
  "use strict";

  const contenedor = document.getElementById("faqBaseDatos");
  if (!contenedor) return;

  const escapar = (valor) => String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  async function cargarPreguntas() {
    try {
      const respuesta = await peticionSegura("/faq", "GET");
      if (!respuesta.ok) throw new Error("No fue posible consultar las preguntas.");
      const preguntas = Array.isArray(respuesta.datos) ? respuesta.datos : [];
      if (!preguntas.length) {
        contenedor.innerHTML = '<div class="alert alert-light border">Todavía no hay preguntas publicadas.</div>';
        return;
      }
      contenedor.innerHTML = preguntas.map((item, indice) => {
        const id = `faq-db-${item.id_pregunta || indice}`;
        return `<div class="accordion-item faq-item">
          <h4 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${id}">
            ${escapar(item.pregunta)}
          </button></h4>
          <div id="${id}" class="accordion-collapse collapse"><div class="accordion-body">${escapar(item.respuesta)}</div></div>
        </div>`;
      }).join("");
    } catch (error) {
      contenedor.innerHTML = '<div class="alert alert-warning">No se pudieron cargar las preguntas actualizadas. Intenta nuevamente más tarde.</div>';
      console.warn("FAQ ciudadano:", error);
    }
  }

  cargarPreguntas();
})();
