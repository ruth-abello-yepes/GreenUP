/* Panel de educacion del ciudadano: datos, progreso y desafios desde Flask/PostgreSQL. */

(() => {
  "use strict";

  const estado = {
    datos: null,
    categoria: "Todos",
    toast: null,
  };

  const $ = (selector) => document.querySelector(selector);
  const escapar = (valor) => String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function urlSegura(valor, fallback = "") {
    try {
      const url = new URL(String(valor || ""));
      return ["http:", "https:"].includes(url.protocol) ? url.href : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function mostrarEstado(mensaje, tipo = "danger") {
    const alerta = $("#education-status");
    if (!alerta) return;
    alerta.className = `alert alert-${tipo} mb-4`;
    alerta.textContent = mensaje;
  }

  function ocultarEstado() {
    const alerta = $("#education-status");
    if (alerta) alerta.className = "alert d-none mb-4";
  }

  function mostrarToast(mensaje) {
    const elemento = $("#pointsToast");
    const texto = $("#toastMessage");
    if (!elemento || !texto) return;
    texto.textContent = mensaje;
    estado.toast ??= new bootstrap.Toast(elemento, { delay: 3200 });
    estado.toast.show();
  }

  function escribirTexto(selector, texto) {
    const elemento = $(selector);
    if (elemento) elemento.textContent = texto;
  }

  function escribirAtributo(selector, atributo, valor) {
    const elemento = $(selector);
    if (elemento) elemento.setAttribute(atributo, valor);
  }

  function renderResumen() {
    const resumen = estado.datos?.resumen || {};
    const completados = Number(resumen.contenidos_completados || 0);
    const total = Math.max(estado.datos?.contenidos?.length || 0, 1);

    if ($("#lessons-completed-display")) {
      $("#lessons-completed-display").textContent = completados.toLocaleString("es-CO");
    }
    if ($("#community-reads")) {
      $("#community-reads").textContent = Number(resumen.lecturas_comunidad || 0).toLocaleString("es-CO");
    }
    if ($("#community-challenges")) {
      $("#community-challenges").textContent = Number(resumen.desafios_comunidad || 0).toLocaleString("es-CO");
    }
    if ($("#education-progress-bar")) {
      $("#education-progress-bar").style.width = `${Math.min(100, Math.round((completados / total) * 100))}%`;
    }
  }

  function videos() {
    return (estado.datos?.contenidos || []).filter((item) => item.tipo === "video");
  }

  function renderDestacado() {
    const contenido = videos().find((item) => item.destacado) || videos()[0];
    const medio = $("#featured-media");
    if (!contenido || !medio) {
      escribirTexto("#featured-title", "Aún no hay videos disponibles");
      escribirTexto("#featured-description", "El administrador puede publicar contenido o configurar YouTube en el backend.");
      $("#featured-play")?.classList.add("d-none");
      return;
    }

    const imagen = urlSegura(contenido.imagen, "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=900&q=80");
    escribirAtributo("#featured-image", "src", imagen);
    escribirAtributo("#featured-image", "alt", contenido.titulo);
    escribirTexto("#featured-title", contenido.titulo);
    escribirTexto("#featured-description", contenido.descripcion || "Video educativo de reciclaje y sostenibilidad.");
    escribirTexto("#featured-duration", `${Number(contenido.duracion_minutos || 5)} min`);
    medio.dataset.contentId = contenido.id_contenido;
    medio.onclick = () => reproducirVideo(contenido);
  }

  function reproducirVideo(contenido) {
    const url = urlSegura(contenido.url_recurso);
    if (!url) return;
    const host = new URL(url).hostname.toLowerCase();
    if (!host.endsWith("youtube-nocookie.com") && !host.endsWith("youtube.com")) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    const medio = $("#featured-media");
    medio.innerHTML = `
      <iframe class="w-100 h-100 border-0" src="${escapar(url)}?autoplay=1&rel=0"
        title="${escapar(contenido.titulo)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    medio.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function renderFiltros() {
    const contenedor = $("#education-filters");
    if (!contenedor) return;
    const contenidos = (estado.datos?.contenidos || []).filter((item) => item.tipo !== "recurso");
    const categorias = ["Todos", ...new Set(contenidos.map((item) => item.categoria || "General"))];
    contenedor.innerHTML = categorias.map((categoria) => {
      const activo = categoria === estado.categoria;
      return `<button type="button" class="btn ${activo ? "btn-gu-primary" : "btn-outline-secondary bg-light border-0 text-dark"} px-4 py-2 rounded-pill fw-medium text-nowrap education-filter" data-category="${escapar(categoria)}">${escapar(categoria)}</button>`;
    }).join("");

    contenedor.querySelectorAll(".education-filter").forEach((boton) => {
      boton.addEventListener("click", () => {
        estado.categoria = boton.dataset.category;
        renderFiltros();
        renderContenidos();
      });
    });
  }

  function tarjetaContenido(item) {
    const imagen = urlSegura(item.imagen, "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=700&q=80");
    const recurso = urlSegura(item.url_recurso);
    const esVideo = item.tipo === "video";
    const completado = Boolean(item.completado);
    const abrir = esVideo
      ? `<button type="button" class="btn btn-light border w-100 content-open" data-content-id="${item.id_contenido}"><span class="material-symbols-outlined fs-6">play_circle</span> Ver video</button>`
      : `<a class="btn btn-light border w-100" href="${escapar(recurso)}" target="_blank" rel="noopener noreferrer"><span class="material-symbols-outlined fs-6">open_in_new</span> Abrir guía</a>`;

    return `
      <div class="col-md-4">
        <article class="card gu-card h-100 border-0 d-flex flex-column">
          <div class="img-wrapper">
            <img src="${escapar(imagen)}" alt="${escapar(item.titulo)}" loading="lazy" referrerpolicy="no-referrer">
            <div class="position-absolute top-0 start-0 m-3 d-flex gap-2 flex-wrap">
              <span class="badge bg-dark bg-opacity-75 rounded-pill py-2 px-3">${Number(item.duracion_minutos || 5)} min</span>
              <span class="badge bg-primary rounded-pill py-2 px-3">${escapar(item.categoria || "General")}</span>
            </div>
            <span class="badge bg-success position-absolute top-0 end-0 m-3 rounded-pill py-2 px-3 shadow">Formativo</span>
          </div>
          <div class="card-body p-4 d-flex flex-column border-start border-4 ${completado ? "border-success" : "border-primary"}">
            <div class="small text-muted mb-1">${escapar(item.fuente || item.origen || "GreenUp")}</div>
            <h5 class="fw-bold text-gu-primary mb-2">${escapar(item.titulo)}</h5>
            <p class="text-secondary small mb-4 flex-grow-1">${escapar(item.descripcion || "Contenido educativo ambiental.")}</p>
            <div class="d-flex flex-column gap-2">
              ${abrir}
              <button type="button" class="btn ${completado ? "btn-success" : "btn-outline-primary"} w-100 rounded-3 fw-bold content-complete" data-content-id="${item.id_contenido}" ${completado ? "disabled" : ""}>
                <span class="material-symbols-outlined fs-6">${completado ? "verified" : "check_circle"}</span>
                ${completado ? "Lección registrada" : "Registrar como visto"}
              </button>
            </div>
          </div>
        </article>
      </div>`;
  }

  function renderContenidos() {
    const contenedor = $("#education-content-grid");
    if (!contenedor) return;
    let contenidos = (estado.datos?.contenidos || []).filter((item) => item.tipo !== "recurso");
    if (estado.categoria !== "Todos") {
      contenidos = contenidos.filter((item) => (item.categoria || "General") === estado.categoria);
    }
    contenedor.innerHTML = contenidos.length
      ? contenidos.map(tarjetaContenido).join("")
      : '<div class="col-12"><div class="alert alert-light border">No hay contenidos en esta categoría.</div></div>';

    contenedor.querySelectorAll(".content-open").forEach((boton) => {
      boton.addEventListener("click", () => {
        const contenido = estado.datos.contenidos.find((item) => Number(item.id_contenido) === Number(boton.dataset.contentId));
        if (contenido) reproducirVideo(contenido);
      });
    });
    contenedor.querySelectorAll(".content-complete:not([disabled])").forEach((boton) => {
      boton.addEventListener("click", () => completarLeccion(boton));
    });
  }

  function renderMateriales() {
    const contenedor = $("#education-materials");
    if (!contenedor) return;
    const materiales = estado.datos?.materiales || [];
    contenedor.innerHTML = materiales.length ? materiales.map((material) => {
      const imagen = urlSegura(material.imagen, "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=700&q=80");
      const fuente = urlSegura(material.fuente_url);
      return `
        <div class="col-md-6">
          <article class="card gu-card h-100 border-0 overflow-hidden material-info">
            <img src="${escapar(imagen)}" class="card-img-top object-fit-cover" style="height: 145px" alt="${escapar(material.nombre)}" loading="lazy" referrerpolicy="no-referrer">
            <div class="card-body">
              <div class="d-flex justify-content-between gap-2 align-items-start mb-2">
                <h5 class="fw-bold text-gu-primary mb-0">${escapar(material.nombre)}</h5>
                <span class="badge text-bg-success">${escapar(material.tipo_residuo || "Aprovechable")}</span>
              </div>
              <p class="small text-secondary">${escapar(material.descripcion || material.tipo_residuo)}</p>
              <details class="small">
                <summary class="fw-bold text-gu-secondary mb-2" style="cursor:pointer">Ver cómo separarlo</summary>
                <p><strong>De dónde sale:</strong> ${escapar(material.origen_material || "Información en actualización.")}</p>
                <p><strong>Preparación:</strong> ${escapar(material.preparacion || "Entrégalo limpio, seco y separado.")}</p>
                <p class="mb-1"><strong>Sí:</strong> ${escapar(material.objetos_permitidos || "Consulta el punto de reciclaje.")}</p>
                <p><strong>No:</strong> ${escapar(material.objetos_no_permitidos || "No mezclar con residuos contaminados.")}</p>
                <p><strong>Impacto:</strong> ${escapar(material.impacto_ambiental || "Su aprovechamiento evita residuos en el relleno sanitario.")}</p>
                ${fuente ? `<a href="${escapar(fuente)}" target="_blank" rel="noopener noreferrer" class="fw-bold">Consultar fuente oficial</a>` : ""}
              </details>
            </div>
          </article>
        </div>`;
    }).join("") : '<div class="col-12"><div class="alert alert-light border">No hay materiales activos.</div></div>';
  }

  function renderDesafios() {
    const contenedor = $("#education-challenges");
    if (!contenedor) return;
    const desafios = estado.datos?.desafios || [];
    contenedor.innerHTML = desafios.length ? desafios.map((desafio) => {
      const disponible = desafio.estado_usuario === "disponible";
      const completado = desafio.estado_usuario === "completado";
      const accion = disponible ? "aceptar" : "completar";
      const texto = disponible ? "Aceptar" : (completado ? "Auto-reportado" : "Reportar realizado");
      return `
        <div class="bg-white p-3 rounded-3 border d-flex gap-3">
          <div class="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center flex-shrink-0" style="width:48px;height:48px">
            <span class="material-symbols-outlined">${escapar(desafio.icono || "eco")}</span>
          </div>
          <div class="flex-grow-1">
            <h6 class="fw-bold text-dark mb-1 small">${escapar(desafio.titulo)}</h6>
            <p class="text-muted mb-2" style="font-size:.8rem">${escapar(desafio.descripcion)}</p>
            <div class="d-flex justify-content-between align-items-center gap-2">
              <span class="badge text-success bg-success-subtle">${Number(desafio.duracion_dias || 1)} día(s)</span>
              <button type="button" class="btn btn-link p-0 text-gu-primary small fw-bold challenge-action" data-id="${desafio.id_desafio}" data-action="${accion}" ${completado ? "disabled" : ""}>${texto}</button>
            </div>
          </div>
        </div>`;
    }).join("") : '<p class="small text-muted mb-0">No hay desafíos disponibles.</p>';

    contenedor.querySelectorAll(".challenge-action:not([disabled])").forEach((boton) => {
      boton.addEventListener("click", () => cambiarDesafio(boton));
    });
  }

  function renderRecursos() {
    const contenedor = $("#education-resources");
    if (!contenedor) return;
    const recursos = (estado.datos?.contenidos || []).filter((item) => ["guia", "recurso"].includes(item.tipo));
    contenedor.innerHTML = recursos.length ? recursos.map((item) => {
      const url = urlSegura(item.url_recurso);
      const icono = item.tipo === "guia" ? "picture_as_pdf" : "public";
      return `
        <li class="list-group-item px-0 py-3 border-bottom d-flex align-items-start gap-3">
          <span class="material-symbols-outlined text-danger mt-1">${icono}</span>
          <div>
            <a href="${escapar(url)}" target="_blank" rel="noopener noreferrer" class="text-dark fw-bold text-decoration-none small d-block mb-1">${escapar(item.titulo)}</a>
            <span class="text-muted" style="font-size:.75rem">${escapar(item.fuente || "Fuente pública")} · ${Number(item.duracion_minutos || 5)} min</span>
          </div>
        </li>`;
    }).join("") : '<li class="list-group-item px-0 text-muted small">No hay recursos publicados.</li>';
  }

  async function completarLeccion(boton) {
    boton.disabled = true;
    const id = Number(boton.dataset.contentId);
    try {
      const respuesta = await peticionSegura(`/api/educacion/contenidos/${id}/completar`, "POST", {});
      if (!respuesta.ok) throw new Error(respuesta.datos?.mensaje || "No fue posible guardar el progreso");
      mostrarToast(respuesta.datos.mensaje);
      await cargarPanel(false);
    } catch (error) {
      boton.disabled = false;
      mostrarEstado(error.message);
    }
  }

  async function cambiarDesafio(boton) {
    boton.disabled = true;
    const accion = boton.dataset.action;
    try {
      const respuesta = await peticionSegura(`/api/educacion/desafios/${boton.dataset.id}/${accion}`, "POST", {});
      if (!respuesta.ok) throw new Error(respuesta.datos?.mensaje || "No fue posible actualizar el desafío");
      mostrarToast(respuesta.datos.mensaje);
      await cargarPanel(false);
    } catch (error) {
      boton.disabled = false;
      mostrarEstado(error.message);
    }
  }

  function renderTodo() {
    ocultarEstado();
    renderResumen();
    renderDestacado();
    renderFiltros();
    renderContenidos();
    renderMateriales();
    renderDesafios();
    renderRecursos();
  }

  async function cargarPanel(mostrarCarga = true) {
    if (mostrarCarga) mostrarEstado("Cargando contenidos y progreso...", "info");
    try {
      const respuesta = await peticionSegura("/api/educacion");
      if (!respuesta.ok) {
        if (respuesta.status === 401) {
          window.location.href = "../public/public_login.html";
          return;
        }
        throw new Error(respuesta.datos?.mensaje || "No fue posible cargar Educación");
      }
      estado.datos = respuesta.datos;
      renderTodo();
    } catch (error) {
      mostrarEstado(`${error.message}. Verifica que Flask esté ejecutándose y que la migración de Educación se haya aplicado.`);
      if ($("#education-content-grid")) {
        $("#education-content-grid").innerHTML = '<div class="col-12"><div class="alert alert-light border">Sin conexión con el backend.</div></div>';
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("#show-all-videos")?.addEventListener("click", () => {
      estado.categoria = "Todos";
      renderFiltros();
      renderContenidos();
    });
    cargarPanel();
  });
})();
