const REFRESH_INTERVAL_MS = 5000;
const pageExportState = { rows: [], filename: "greenup_export.csv" };
function getCurrentFile() {
  return window.location.pathname.split("/").pop() || "recicladora_panel.html";
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("usuario")) || {};
  } catch {
    return {};
  }
}

function getApiBase() {
  return typeof API_URL !== "undefined" ? API_URL : "http://10.228.218.23:5000";
}

function getSessionHeaders() {
  const user = getUser();
  return {
    "Content-Type": "application/json",
    ...(user.id_usuario ? { id_usuario: user.id_usuario, "id-usuario": user.id_usuario } : {}),
    ...(user.id_rol ? { id_rol: user.id_rol, "id-rol": user.id_rol } : {}),
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statusClass(status) {
  const text = String(status).toLowerCase();
  if (text.includes("pendiente")) return "warning";
  if (text.includes("rechaz")) return "danger";
  if (text.includes("confirm")) return "success";
  if (text.includes("revision") || text.includes("programada") || text.includes("proceso")) return "warning";
  if (text.includes("transito") || text.includes("en ruta") || text.includes("enviado") || text.includes("recolectado")) return "blue";
  if (text.includes("inactivo") || text.includes("cerrado")) return "danger";
  return "success";
}

async function fetchJson(endpoint, options = {}) {
  const response = await fetch(`${getApiBase()}${endpoint}`, {
    ...options,
    headers: {
      ...getSessionHeaders(),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.mensaje || "No se pudo cargar la informacion");
  return data;
}

async function fetchFile(endpoint) {
  const response = await fetch(`${getApiBase()}${endpoint}`, {
    headers: getSessionHeaders(),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.mensaje || "No se pudo generar el archivo");
  }
  return response.blob();
}

function formatKg(value) {
  const number = Number(value) || 0;
  return `${number.toLocaleString("es-CO", { maximumFractionDigits: 2 })} kg`;
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}
function setExportData(rows, filename) {
  pageExportState.rows = rows || [];
  pageExportState.filename = filename || "greenup_export.csv";
  document.querySelectorAll(".btn-soft").forEach((button) => {
    if (!/exportar/i.test(button.textContent)) return;
    button.disabled = pageExportState.rows.length === 0;
    button.title = pageExportState.rows.length ? "Exportar datos" : "No hay datos para exportar";
  });
}

function downloadCsv(rows, filename) {
  if (!rows.length) return;
  const csv = rows.map((row) => row.map((cell) => {
    const text = String(cell ?? "").replace(/"/g, '""');
    return `"${text}"`;
  }).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function bindGenericExportButtons() {
  if (getCurrentFile() === "recicladora_reportes.html") return;
  document.querySelectorAll(".btn-soft").forEach((button) => {
    if (!/exportar/i.test(button.textContent) || button.dataset.exportBound === "true") return;
    button.dataset.exportBound = "true";
    button.addEventListener("click", () => {
      if (!pageExportState.rows.length) return;
      downloadCsv(pageExportState.rows, pageExportState.filename);
    });
  });
}
function rowsToTable(tableTitle, rows) {
  const tableCards = [...document.querySelectorAll(".table-card")];
  const card = tableCards.find((item) => item.querySelector("h2")?.textContent === tableTitle);
  const tbody = card?.querySelector("tbody");
  if (!tbody) return;

  if (!rows.length) {
    const columnCount = card.querySelectorAll("thead th").length || 1;
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="${columnCount}" class="empty-table-cell">
          <span class="material-symbols-outlined">inbox</span>
          <strong>Sin registros</strong>
          <small>Cuando haya informacion en la base de datos aparecera aqui automaticamente.</small>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = rows.map((row) => `
    <tr>
      ${row.map((cell, index) => index === row.length - 1
    ? `<td><span class="status-pill status-${statusClass(cell)}">${escapeHtml(cell)}</span></td>`
    : `<td>${escapeHtml(cell)}</td>`
  ).join("")}
      <td><span class="action-group"><button class="btn-icon" type="button" aria-label="Ver"><span class="material-symbols-outlined">visibility</span></button></span></td>
    </tr>
  `).join("");
}
function renderMaterialsTable(materiales) {
  const card = [...document.querySelectorAll(".table-card")]
    .find((item) => item.querySelector("h2")?.textContent === "Materiales aceptados");
  const tbody = card?.querySelector("tbody");
  if (!tbody) return;

  if (!materiales.length) {
    rowsToTable("Materiales aceptados", []);
    return;
  }

  tbody.innerHTML = materiales.map((item) => {
    const aceptado = Boolean(item.aceptado);
    return `
      <tr>
        <td>${escapeHtml(`#MAT-${item.id_tipo_material}`)}</td>
        <td>${escapeHtml(item.nombre || "Material")}</td>
        <td>${escapeHtml(item.descripcion || "")}</td>
        <td>${escapeHtml(`${item.puntos_por_kg || 0} / ${item.unidad || "kg"}`)}</td>
        <td><span class="status-pill status-${aceptado ? "success" : "danger"}">${aceptado ? "Aceptado" : "Inactivo"}</span></td>
        <td>
          <span class="action-group">
            <button class="btn-icon material-toggle" type="button" data-material-id="${item.id_tipo_material}" data-next-state="${aceptado ? "0" : "1"}" aria-label="${aceptado ? "Inactivar" : "Activar"} material">
              <span class="material-symbols-outlined">${aceptado ? "toggle_on" : "toggle_off"}</span>
            </button>
          </span>
        </td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll(".material-toggle").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = Number(button.dataset.materialId);
      const nextActive = button.dataset.nextState === "1";
      const current = await fetchJson("/api/recicladoras/materiales");
      const ids = current
        .filter((item) => item.aceptado && Number(item.id_tipo_material) !== id)
        .map((item) => item.id_tipo_material);
      if (nextActive) ids.push(id);
      await fetchJson("/api/recicladoras/materiales", {
        method: "PUT",
        body: JSON.stringify({ ids_materiales: ids }),
      });
      refreshCurrentPage();
    });
  });
}

function renderRegistrosRecicladoraTable(registros) {
  const card = [...document.querySelectorAll(".table-card")]
    .find((item) => item.querySelector("h2")?.textContent === "Entradas recientes");
  const tbody = card?.querySelector("tbody");
  if (!tbody) return;

  if (!registros.length) {
    rowsToTable("Entradas recientes", []);
    return;
  }

  tbody.innerHTML = registros.map((item) => {
    const estado = String(item.estado || "").toLowerCase();
    const pendiente = estado === "pendiente";
    const rechazado = estado === "rechazado";
    const confirmado = estado === "confirmado";

    return `
      <tr>
        <td>#RR-${item.id_registro}</td>
        <td>${escapeHtml(item.usuario || `Usuario ${item.id_usuario}`)}</td>
        <td>${escapeHtml(item.material || `Material ${item.id_tipo_material}`)}</td>
        <td>${formatKg(item.cantidad)}</td>
        <td><span class="status-pill status-${statusClass(item.estado || "pendiente")}">${escapeHtml(item.estado || "pendiente")}</span></td>
        <td>
          <span class="action-group">
            ${pendiente ? `
              <button class="btn-icon registro-confirmar" type="button" data-id="${item.id_registro}" aria-label="Confirmar">
                <span class="material-symbols-outlined">task_alt</span>
              </button>
              <button class="btn-icon registro-rechazar" type="button" data-id="${item.id_registro}" aria-label="Rechazar">
                <span class="material-symbols-outlined">cancel</span>
              </button>
            ` : ""}
            ${confirmado ? `<small class="text-success fw-semibold">Confirmado</small>` : ""}
            ${rechazado ? `<small class="text-danger fw-semibold">Rechazado</small>` : ""}
          </span>
          ${item.motivo_rechazo ? `<div class="small text-danger mt-1">${escapeHtml(item.motivo_rechazo)}</div>` : ""}
        </td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll(".registro-confirmar").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = Number(button.dataset.id);
      const confirmar = window.confirm("¿Confirmar este reciclaje y sumar puntos al ciudadano?");
      if (!confirmar) return;
      try {
        await fetchJson(`/api/recicladoras/registros/${id}/estado`, {
          method: "PUT",
          body: JSON.stringify({ id_estado: 2 }),
        });
        alert("Registro confirmado correctamente");
        refreshCurrentPage();
      } catch (error) {
        alert(error.message);
      }
    });
  });

  tbody.querySelectorAll(".registro-rechazar").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = Number(button.dataset.id);
      const motivo = window.prompt("Escribe el motivo del rechazo:");
      if (motivo === null) return;
      try {
        await fetchJson(`/api/recicladoras/registros/${id}/estado`, {
          method: "PUT",
          body: JSON.stringify({ id_estado: 3, motivo_rechazo: motivo.trim() || "Sin motivo adicional" }),
        });
        alert("Registro rechazado correctamente");
        refreshCurrentPage();
      } catch (error) {
        alert(error.message);
      }
    });
  });
}
function updateDashboard(data) {
  setText('[data-summary-label="Hoy"]', formatKg(data.material_recuperado_kg));
  setText('[data-summary-label="Actividad"]', `${Number(data.cargas_activas) || 0} cargas`);
  setText('[data-metric-label="Material recuperado"]', formatKg(data.material_recuperado_kg));
  setText('[data-metric-label="Cargas activas"]', Number(data.cargas_activas) || 0);
  setText('[data-metric-label="Recicladores"]', Number(data.recicladores) || 0);
  setText('[data-metric-label="Alertas"]', Number(data.alertas) || 0);
  setText('[data-metric-change="Material recuperado"]', data.material_recuperado_kg ? "Actualizado desde la base de datos" : "Sin registros");
  setText('[data-metric-change="Cargas activas"]', data.cargas_activas ? "Con actividad registrada" : "Sin actividad");
  setText('[data-metric-change="Recicladores"]', data.recicladores ? "Con registros confirmados" : "Sin actividad");
  setText('[data-metric-change="Alertas"]', data.alertas ? "Revisar novedades" : "Sin alertas");

  const max = Math.max(...(data.actividad_semanal || []).map((item) => Number(item.cantidad) || 0), 0);
  (data.actividad_semanal || []).forEach((item) => {
    const bar = document.querySelector(`[data-chart-value="${item.dia}"]`);
    if (bar) bar.style.height = max ? `${Math.max((Number(item.cantidad) / max) * 100, 6)}%` : "0%";
  });

  const operaciones = (data.operaciones_recientes || []).map((item) => [
    `#${item.id_registro}`,
    `${item.material} - ${formatKg(item.cantidad)}`,
    item.usuario,
    item.punto,
    "Activo",
  ]);
  rowsToTable("Operacion reciente", operaciones);
}

function updateOwnPointPage(profile, current) {
  const status = Number(profile.id_estado_recicladora) === 1 ? "Activo" : "Inactivo";
  const responsible = `${profile.nombres || ""} ${profile.apellidos || ""}`.trim() || profile.usuario || "Responsable por confirmar";
  const phone = profile.telefono_empresa || "Telefono por confirmar";
  const address = profile.direccion_empresa || "Direccion por confirmar";
  const name = profile.nombre_empresa || "Mi recicladora";
  const tableTitle = current === "recicladora_puntos_reciclaje.html" ? "Datos de mi punto" : "Datos de mi recicladora";

  setText('[data-summary-label="Mi punto"]', name);
  setText('[data-summary-label="Registro"]', name);
  setText('[data-summary-label="Estado"]', status);
  setText('[data-own-point-status="Ubicacion"]', address);
  setText('[data-own-point-status="Contacto"]', phone);
  setText('[data-own-point-status="Estado"]', status);
  rowsToTable(tableTitle, [[name, address, phone, responsible, status]]);
}
async function refreshCurrentPage() {
  const current = getCurrentFile();

  if (current === "recicladora_panel.html" || current === "recicladora_estadisticas.html") {
    const dashboard = await fetchJson("/api/recicladoras/dashboard");
    updateDashboard(dashboard);
    if (current === "recicladora_estadisticas.html") {
      setText('[data-summary-label="Recuperado"]', formatKg(dashboard.material_recuperado_kg));
      setText('[data-summary-label="Crecimiento"]', "0%");
    }
  }

  if (current === "recicladora_materiales.html") {
    const materiales = await fetchJson("/api/recicladoras/materiales");
    const aceptados = materiales.filter((item) => item.aceptado);
    setText('[data-summary-label="Catalogados"]', `${materiales.length} tipos`);
    setText('[data-summary-label="Activos"]', `${aceptados.length} materiales`);
    renderMaterialsTable(materiales);
    setExportData(materiales.map((item) => [
      `#MAT-${item.id_tipo_material}`,
      item.nombre || "Material",
      item.descripcion || "",
      `${item.puntos_por_kg || 0} / ${item.unidad || "kg"}`,
      item.aceptado ? "Aceptado" : "Inactivo",
    ]), "materiales_recicladora.csv");
  }

  if (current === "recicladora_residuos.html" || current === "recicladora_registros_reciclaje.html") {
    const registros = await fetchJson("/api/recicladoras/registros");
    const activos = registros.filter((item) => Number(item.id_estado) === 1);
    const totalKg = activos.reduce((total, item) => total + (Number(item.cantidad) || 0), 0);

    if (current === "recicladora_residuos.html") {
      setText('[data-summary-label="Procesados"]', formatKg(totalKg));
      setText('[data-summary-label="En transito"]', "0 cargas");
      rowsToTable("Residuos registrados", activos.map((item) => [
        `#GR-${item.id_registro}`,
        `Material ${item.id_tipo_material}`,
        formatKg(item.cantidad),
        item.id_punto ? `Punto ${item.id_punto}` : "Punto sin asignar",
        "Activo",
      ]));
    }

    if (current === "recicladora_registros_reciclaje.html") {
      setText('[data-summary-label="Registros"]', registros.length);
      setText('[data-summary-label="Pendientes"]', registros.filter((item) => String(item.estado || "").toLowerCase() === "pendiente").length);
      renderRegistrosRecicladoraTable(registros);
      setExportData(registros.map((item) => [
        `#RR-${item.id_registro}`,
        item.usuario || `Usuario ${item.id_usuario}`,
        item.material || `Material ${item.id_tipo_material}`,
        formatKg(item.cantidad),
        item.estado || "pendiente",
      ]), "registros_recicladora.csv");
    }
  }

  if (current === "mi_punto_ecologico.html" || current === "recicladora_puntos_reciclaje.html") {
    const profile = await fetchJson("/api/recicladoras/perfil");
    updateOwnPointPage(profile, current);
  }

  if (current === "recicladora_faq.html") {
    const preguntas = await fetchJson("/faq");
    const activas = preguntas.filter((item) => Number(item.id_estado) === 1);
    setText('[data-summary-label="Preguntas"]', preguntas.length);
    setText('[data-summary-label="Visibles"]', activas.length);
    rowsToTable("FAQ visibles", activas.map((item) => [item.pregunta, item.categoria || "", item.orden || 0, "Visible"]));
  }

  if (current === "recicladora_contenido_educativo.html") {
    const contenidos = await fetchJson("/contenido");
    const activos = contenidos.filter((item) => Number(item.id_estado) === 1);
    setText('[data-summary-label="Publicados"]', activos.length);
    setText('[data-summary-label="Borradores"]', 0);
    rowsToTable("Recursos educativos", activos.map((item) => [item.titulo, item.tipo, "Educacion", "Publicado"]));
    setExportData(activos.map((item) => [item.titulo, item.tipo, item.descripcion || "", item.url_recurso || "", item.imagen || ""]), "contenido_educativo.csv");
  }

  if (current === "recicladora_novedades.html") {
    const novedades = await fetchJson("/api/recicladoras/novedades");
    const activas = novedades.filter((item) => Number(item.id_estado) === 1);
    setText('[data-summary-label="Activas"]', activas.length);
    setText('[data-summary-label="Programadas"]', 0);
    rowsToTable("Comunicaciones", activas.map((item) => [item.titulo, item.fecha || item.fecha_publicacion || "", item.usuario || "Ciudadano", item.estado || "Activa"]));
    setExportData(activas.map((item) => [item.titulo, item.fecha || item.fecha_publicacion || "", item.usuario || "", item.descripcion || "", item.estado || "Activa"]), "novedades_recicladora.csv");
  }

  if (current === "recicladora_reportes.html") {
    const registros = await fetchJson("/api/recicladoras/reportes");
    setExportData(registros.map((item) => [
      `Registro #${item.id_registro}`,
      item.fecha_hora || "",
      item.usuario || "",
      item.material || "",
      item.cantidad || "",
      item.estado || "",
    ]), "reportes_recicladora.csv");
    setText('[data-summary-label="Generados"]', registros.length ? "Disponible" : "0");
    const generateButtons = [...document.querySelectorAll("button")].filter((button) => /generar|exportar|sin datos/i.test(button.textContent));
    generateButtons.forEach((button) => {
      button.disabled = registros.length === 0;
      button.title = registros.length ? "Exportar reporte" : "No hay datos para exportar";
      if (registros.length && /sin datos/i.test(button.textContent)) {
        button.innerHTML = '<span class="material-symbols-outlined">download</span>Generar reporte';
      }
    });
    rowsToTable("Reportes recientes", registros.slice(0, 8).map((item) => [
      `Registro #${item.id_registro}`,
      item.fecha_hora || "",
      item.material || "Material",
      item.estado || "Activo",
    ]));
  }

  if (current === "recicladora_estadisticas.html") {
    const stats = await fetchJson("/api/recicladoras/estadisticas");
    rowsToTable("Usuarios destacados", (stats.ranking_usuarios || []).map((item) => [
      `#${item.id_usuario}`,
      item.usuario,
      formatKg(item.cantidad),
      `${item.registros} registros`,
      "Activo",
    ]));
  }
}

function startAutoRefresh() {
  refreshCurrentPage().catch((error) => console.warn(error.message));
  window.setInterval(() => refreshCurrentPage().catch((error) => console.warn(error.message)), REFRESH_INTERVAL_MS);
}
function bindUserMenu() {
  const button = document.querySelector(".user-avatar");
  const dropdown = document.getElementById("userDropdown");
  if (!button || !dropdown) return;

  button.addEventListener("click", () => dropdown.classList.toggle("open"));
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".user-menu")) dropdown.classList.remove("open");
  });
}

function mostrarNotificacionesRecicladora() {
  const menu = document.getElementById("notificationsMenu");
  if (!menu) return;
  const isOpen = menu.classList.toggle("open");
  menu.setAttribute("aria-hidden", String(!isOpen));
  if (isOpen) cargarNotificacionesRecicladora();
}

async function cargarNotificacionesRecicladora() {
  const menu = document.getElementById("notificationsMenu");
  if (!menu) return;

  try {
    const notificaciones = await fetchJson("/api/notificaciones");
    const badge = menu.querySelector(".notifications-badge");
    const unread = notificaciones.filter((item) => !item.leida).length;
    if (badge) badge.textContent = unread;

    const list = menu.querySelector(".notifications-list") || menu.querySelector(".inline-empty-state");
    if (!list) return;

    if (!notificaciones.length) {
      list.innerHTML = `
        <article class="notification-item empty">
          <span class="material-symbols-outlined">notifications_off</span>
          <div>
            <strong>Sin notificaciones</strong>
            <p>No tienes alertas nuevas para tu recicladora.</p>
          </div>
        </article>
      `;
      return;
    }

    list.innerHTML = notificaciones.map((item) => `
      <article class="notification-item ${item.leida ? "" : "unread"}" data-notification-id="${item.id_notificacion}">
        <span class="material-symbols-outlined">${item.leida ? "notifications" : "notifications_active"}</span>
        <div>
          <strong>${escapeHtml(item.titulo)}</strong>
          <p>${escapeHtml(item.mensaje)}</p>
          <small>${escapeHtml(item.fecha_hora || "")}</small>
        </div>
      </article>
    `).join("");

    list.querySelectorAll("[data-notification-id]").forEach((item) => {
      item.addEventListener("click", async () => {
        const id = item.getAttribute("data-notification-id");
        await fetchJson(`/api/notificaciones/${id}/leida`, { method: "PUT" });
        item.classList.remove("unread");
        cargarNotificacionesRecicladora();
      });
    });
  } catch (error) {
    console.warn(error.message);
  }
}

function bindNotificationsMenu() {
  const menu = document.getElementById("notificationsMenu");
  if (!menu) return;

  document.addEventListener("click", (event) => {
    if (event.target.closest('[aria-label="Notificaciones"]')) return;
    if (event.target.closest("#notificationsMenu")) return;
    menu.classList.remove("open");
    menu.setAttribute("aria-hidden", "true");
  });
}

function quitarTemaOscuroRecicladora() {
  document.body.classList.remove("recicladora-theme-dark");
  localStorage.removeItem("recicladora_tema");
  document.querySelectorAll(".theme-toggle").forEach((button) => button.remove());
}
function abrirModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function cerrarModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function abrirModalFaq() {
  abrirModal("modalFaq");
}

async function abrirModalMateriales() {
  abrirModal("modalMateriales");
  const container = document.getElementById("materialesChecklist");
  if (!container) return;

  try {
    const materiales = await fetchJson("/api/recicladoras/materiales");
    container.innerHTML = materiales.map((item) => `
      <label class="check-card">
        <input type="checkbox" name="ids_materiales" value="${item.id_tipo_material}" ${item.aceptado ? "checked" : ""}>
        <span>
          <strong>${escapeHtml(item.nombre || "Material")}</strong>
          <small>${escapeHtml(item.descripcion || "Sin descripcion")}</small>
        </span>
      </label>
    `).join("");
  } catch (error) {
    container.innerHTML = `<div class="inline-empty-state"><strong>${escapeHtml(error.message)}</strong></div>`;
  }
}

function abrirModalContenido() {
  abrirModal("modalContenido");
}

function abrirModalNovedad() {
  abrirModal("modalNovedad");
}

function bindModalForms() {
  document.querySelectorAll(".gu-modal-backdrop").forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) cerrarModal(modal.id);
    });
  });

  const formFaq = document.getElementById("formFaq");
  if (formFaq) formFaq.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(formFaq);
    const data = Object.fromEntries(formData.entries());
    data.orden = Number(data.orden) || 0;

    try {
      await fetchJson("/faq", {
        method: "POST",
        body: JSON.stringify(data),
      });
      formFaq.reset();
      cerrarModal("modalFaq");
      refreshCurrentPage();
    } catch (error) {
      alert(error.message);
    }
  });

  const formMateriales = document.getElementById("formMateriales");
  if (formMateriales) formMateriales.addEventListener("submit", async (event) => {
    event.preventDefault();
    const ids = [...formMateriales.querySelectorAll('input[name="ids_materiales"]:checked')]
      .map((input) => Number(input.value));
    try {
      await fetchJson("/api/recicladoras/materiales", {
        method: "PUT",
        body: JSON.stringify({ ids_materiales: ids }),
      });
      cerrarModal("modalMateriales");
      refreshCurrentPage();
    } catch (error) {
      alert(error.message);
    }
  });

  const formContenido = document.getElementById("formContenido");
  if (formContenido) formContenido.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(formContenido).entries());
    data.id_usuario = getUser().id_usuario;
    try {
      await fetchJson("/contenido", {
        method: "POST",
        body: JSON.stringify(data),
      });
      formContenido.reset();
      cerrarModal("modalContenido");
      refreshCurrentPage();
    } catch (error) {
      alert(error.message);
    }
  });

  const formNovedad = document.getElementById("formNovedad");
  if (formNovedad) formNovedad.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(formNovedad).entries());
    data.comentario = data.descripcion;
    try {
      await fetchJson("/api/recicladoras/novedades", {
        method: "POST",
        body: JSON.stringify(data),
      });
      formNovedad.reset();
      cerrarModal("modalNovedad");
      refreshCurrentPage();
    } catch (error) {
      alert(error.message);
    }
  });
}
function updateProfilePhotoUI(src) {
  const preview = document.getElementById("profilePhotoPreview");
  if (preview) {
    preview.innerHTML = src
      ? `<img src="${src}" alt="Foto de perfil">`
      : '<span class="material-symbols-outlined">person</span>';
  }

  document.querySelectorAll(".user-avatar").forEach((avatar) => {
    if (!src) return;
    avatar.classList.add("has-photo");
    avatar.innerHTML = `<img src="${src}" alt="Foto de perfil">`;
  });
}

function bindProfilePhotoInput() {
  const input = document.getElementById("profilePhotoInput");
  const hidden = document.getElementById("profilePhotoValue");
  const label = document.getElementById("profilePhotoName");
  if (!input || !hidden) return;

  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Selecciona una imagen valida");
      input.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("La imagen debe pesar maximo 2 MB");
      input.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      hidden.value = reader.result;
      if (label) label.textContent = file.name;
      updateProfilePhotoUI(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

async function hydrateProfilePhotoOnly() {
  if (!document.getElementById("profilePhotoValue")) return;
  try {
    const profile = await fetchJson("/api/recicladoras/perfil");
    const hidden = document.getElementById("profilePhotoValue");
    if (hidden) hidden.value = profile.foto_perfil || "";
    if (profile.foto_perfil) {
      const user = getUser();
      localStorage.setItem("usuario", JSON.stringify({ ...user, foto_perfil: profile.foto_perfil }));
    }
    updateProfilePhotoUI(profile.foto_perfil || "");
  } catch (error) {
    console.warn(error.message);
  }
}

function bindProfilePhotoSave() {
  const button = document.getElementById("profilePhotoSaveButton");
  const hidden = document.getElementById("profilePhotoValue");
  if (!button || !hidden) return;

  button.addEventListener("click", async () => {
    try {
      await fetchJson("/api/recicladoras/perfil", {
        method: "PUT",
        body: JSON.stringify({ foto_perfil: hidden.value }),
      });
      const user = getUser();
      localStorage.setItem("usuario", JSON.stringify({ ...user, foto_perfil: hidden.value }));
      updateProfilePhotoUI(hidden.value);
      alert("Foto de perfil actualizada correctamente");
    } catch (error) {
      alert(error.message);
    }
  });
}

function bindProfileSave() {
  const current = getCurrentFile();
  if (current !== "recicladora_perfil.html") return;

  const saveButton = [...document.querySelectorAll("button")].find((button) => button.textContent.includes("Guardar perfil"));
  if (!saveButton) return;

  saveButton.addEventListener("click", async () => {
    const data = {};
    document.querySelectorAll("[data-profile-field]").forEach((input) => {
      const key = input.getAttribute("data-profile-field");
      if (key !== "administrador" && key !== "usuario") data[key] = input.value.trim();
    });

    try {
      await fetchJson("/api/recicladoras/perfil", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      await fetchJson("/api/recicladoras/mi-punto", {
        method: "PUT",
        body: JSON.stringify({
          nombre_empresa: data.nombre_empresa,
          direccion_empresa: data.direccion_empresa,
          telefono_empresa: data.telefono_empresa,
        }),
      });
      alert("Perfil actualizado correctamente");
      const user = getUser();
      localStorage.setItem("usuario", JSON.stringify({ ...user, foto_perfil: data.foto_perfil || user.foto_perfil }));
      updateProfilePhotoUI(data.foto_perfil || user.foto_perfil || "");
      hydrateRecicladoraProfile();
      refreshCurrentPage();
    } catch (error) {
      alert(error.message);
    }
  });
}
function bindReportExports() {
  if (getCurrentFile() !== "recicladora_reportes.html") return;

  const buttons = [...document.querySelectorAll("button")].filter((button) => /generar|exportar/i.test(button.textContent));
  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      if (button.disabled) return;
      const formatSelect = [...document.querySelectorAll("select")].find((select) => /formato/i.test(select.getAttribute("aria-label") || ""));
      const value = (formatSelect?.value || "PDF").toLowerCase();
      const formato = value.includes("excel") ? "excel" : value.includes("csv") ? "csv" : "pdf";

      try {
        const blob = await fetchFile(`/api/recicladoras/reportes?formato=${formato}`);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `reporte_recicladora.${formato === "excel" ? "xlsx" : formato}`;
        link.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        alert(error.message);
      }
    });
  });
}

function iniciarCambioContrasenaDesdePerfil() {
  const correo = document.querySelector('[data-profile-field="correo"]')?.value?.trim() || getUser().correo || "";
  if (correo && correo !== "Cargando...") {
    localStorage.setItem("correo_recuperacion_prellenado", correo);
  }
  localStorage.removeItem("codigo_recuperacion");
  window.location.href = "../public/public_recuperar_contrasena.html";
}

async function hydrateRecicladoraProfile() {
  try {
    const profile = await fetchJson("/api/recicladoras/perfil");
    const values = {
      ...profile,
      administrador: `${profile.nombres || ""} ${profile.apellidos || ""}`.trim(),
    };

    document.querySelectorAll("[data-profile-field]").forEach((input) => {
      const key = input.getAttribute("data-profile-field");
      input.value = values[key] || "";
    });

    if (profile.foto_perfil) {
      const user = getUser();
      localStorage.setItem("usuario", JSON.stringify({ ...user, foto_perfil: profile.foto_perfil }));
    }
    updateProfilePhotoUI(profile.foto_perfil || "");

    const title = document.querySelector(".page-title");
    if (title && profile.nombre_empresa) {
      title.innerHTML = `Perfil de <strong>${escapeHtml(profile.nombre_empresa)}</strong>`;
    }

    const subtitle = document.querySelector(".page-subtitle");
    if (subtitle && profile.direccion_empresa) {
      subtitle.textContent = `Datos cargados desde la base de datos para ${profile.direccion_empresa}.`;
    }
  } catch (error) {
    console.error("Error cargando perfil de recicladora:", error);
  }
}
function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      if (existing.dataset.loaded === "true") resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function loadStyleOnce(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

async function initRecicladoraMap() {
  loadStyleOnce("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
  loadStyleOnce("https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css");

  await loadScriptOnce("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
  await loadScriptOnce("https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.js");
  await loadScriptOnce("../../js/mapa.js");

  if (typeof window.initGreenupMap === "function") {
    window.initGreenupMap({ scope: "recicladora" });
  }
}
document.addEventListener("DOMContentLoaded", function () {
  if (typeof protegerRol === "function") {
    protegerRol(2);
  }

  document.body.classList.add("recicladora-app");

  const user = getUser();
  const avatar = document.querySelector(".user-avatar");
  if (avatar) avatar.title = `Perfil: ${user.nombres || user.usuario || "Recicladora"}`;
  if (user.foto_perfil) updateProfilePhotoUI(user.foto_perfil);

  bindUserMenu();
  bindNotificationsMenu();
  quitarTemaOscuroRecicladora();
  bindModalForms();
  bindProfilePhotoInput();
  bindProfilePhotoSave();
  bindGenericExportButtons();
  bindProfileSave();
  bindReportExports();

  const current = getCurrentFile();
  if (current === "recicladora_perfil.html") {
    hydrateRecicladoraProfile();
  }
  if (current === "recicladora_configuracion.html") {
    hydrateProfilePhotoOnly();
  }

  if (document.getElementById("eco-map")) {
    initRecicladoraMap();
  }

  startAutoRefresh();
});
