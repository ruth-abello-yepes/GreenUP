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
  if (typeof API_URL !== "undefined") return API_URL;
  if (window.GREENUP_API_URL) return window.GREENUP_API_URL;
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)
    ? `http://${window.location.hostname === "localhost" ? "localhost" : "127.0.0.1"}:5000`
    : "https://greenup-hoxj.onrender.com";
}

function getSessionHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
  if (text.includes("inactivo") || text.includes("cerrado") || text.includes("oculto") || text.includes("borrador")) return "danger";
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

function showRecicladoraDetail(title, rows) {
  let modal = document.getElementById("recicladoraDetailModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "recicladoraDetailModal";
    modal.className = "gu-modal-backdrop";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <section class="gu-modal" role="dialog" aria-modal="true" aria-labelledby="recicladoraDetailTitle">
        <header class="gu-modal-header">
          <div>
            <h2 id="recicladoraDetailTitle">Detalle</h2>
            <p>Información cargada desde la pantalla actual.</p>
          </div>
          <button class="btn-icon" type="button" data-close-detail aria-label="Cerrar">
            <span class="material-symbols-outlined">close</span>
          </button>
        </header>
        <div class="form-grid" id="recicladoraDetailBody"></div>
      </section>
    `;
    document.body.appendChild(modal);
    modal.addEventListener("click", (event) => {
      if (event.target === modal || event.target.closest("[data-close-detail]")) {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
      }
    });
  }

  modal.querySelector("#recicladoraDetailTitle").textContent = title || "Detalle";
  modal.querySelector("#recicladoraDetailBody").innerHTML = rows.map((value, index) => `
    <label class="field-full">
      <span class="form-label">Dato ${index + 1}</span>
      <input class="form-control" value="${escapeHtml(value)}" readonly>
    </label>
  `).join("");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
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
function rowsToTable(tableTitle, rows, options = {}) {
  const tableCards = [...document.querySelectorAll(".table-card")];
  const card = tableCards.find((item) => item.querySelector("h2")?.textContent === tableTitle);
  const tbody = card?.querySelector("tbody");
  if (!tbody) return;

  if (!rows.length) {
    const columnCount = card.querySelectorAll("thead th").length || 1;
    const emptyIcon = options.emptyIcon || "inbox";
    const emptyTitle = options.emptyTitle || "Sin registros";
    const emptyMessage = options.emptyMessage || "Cuando haya informacion en la base de datos aparecera aqui automaticamente.";
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="${columnCount}" class="empty-table-cell">
          <span class="material-symbols-outlined">${escapeHtml(emptyIcon)}</span>
          <strong>${escapeHtml(emptyTitle)}</strong>
          <small>${escapeHtml(emptyMessage)}</small>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = rows.map((row, index) => {
    const values = Array.isArray(row) ? row : row.values || [];
    const customActions = typeof options.renderActions === "function" ? options.renderActions(row, index) : "";
    const detailButton = `
      <button class="btn-icon row-view-detail" type="button" aria-label="Ver detalle" data-title="${escapeHtml(tableTitle)}" data-row="${encodeURIComponent(JSON.stringify(values))}">
        <span class="material-symbols-outlined">visibility</span>
      </button>
    `;
    return `
    <tr>
      ${values.map((cell, cellIndex) => cellIndex === values.length - 1
      ? `<td><span class="status-pill status-${statusClass(cell)}">${escapeHtml(cell)}</span></td>`
      : `<td>${escapeHtml(cell)}</td>`
    ).join("")}
      <td>
        <span class="action-group">
          ${customActions || detailButton}
        </span>
      </td>
    </tr>
  `;
  }).join("");

  tbody.querySelectorAll(".row-view-detail").forEach((button) => {
    button.addEventListener("click", () => {
      const datos = JSON.parse(decodeURIComponent(button.dataset.row || "%5B%5D"));
      showRecicladoraDetail(button.dataset.title || tableTitle, datos);
    });
  });
}

function nombreEstadoVisibilidad(idEstado) {
  return Number(idEstado) === 1 ? "Publicado" : "Oculto";
}

async function alternarContenidoEducativoRecicladora(idContenido, idEstadoActual) {
  const idEstado = Number(idEstadoActual) === 1 ? 2 : 1;
  const accion = idEstado === 1 ? "publicar" : "ocultar";
  if (!(await window.greenupConfirm(`¿Quieres ${accion} este recurso educativo?`, "Contenido educativo"))) return;

  await fetchJson(`/contenido/${idContenido}/estado`, {
    method: "PUT",
    body: JSON.stringify({ id_estado: idEstado }),
  });
  await refreshCurrentPage();
}

async function alternarNovedadRecicladora(idNovedad, idEstadoActual) {
  const idEstado = Number(idEstadoActual) === 1 ? 2 : 1;
  const accion = idEstado === 1 ? "activar" : "ocultar";
  if (!(await window.greenupConfirm(`¿Quieres ${accion} esta novedad?`, "Novedades"))) return;

  await fetchJson(`/api/recicladoras/novedades/${idNovedad}`, {
    method: "PUT",
    body: JSON.stringify({
      id_estado: idEstado,
      respuesta: idEstado === 1 ? "Novedad publicada nuevamente." : "Novedad ocultada por la recicladora.",
    }),
  });
  await refreshCurrentPage();
}
function renderMaterialsTable(materiales) {
  const card = [...document.querySelectorAll(".table-card")]
    .find((item) => item.querySelector("h2")?.textContent.includes("Materiales aceptados"));
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
        <td>${escapeHtml(item.unidad || "kg")}</td>
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

function clasificarResiduo(item) {
  const nombre = String(item.residuo || item.nombre_residuo || "").toLowerCase();
  const material = String(item.nombre || item.material || "").toLowerCase();
  if (nombre.includes("organ")) return "Organicos";
  if (nombre.includes("pelig") || nombre.includes("raee")) return "Peligrosos";
  if (nombre.includes("quim")) return "Quimicos";
  if (material.includes("aceite") || material.includes("solvente") || material.includes("pintura")) return "Quimicos";
  return "Aprovechables";
}

function getRegistroReciclajeState(item) {
  const estadoGuardado = String(item.estado || "").toLowerCase();
  const idEstado = Number(item.id_estado);
  const rechazado = estadoGuardado.includes("rechaz") || idEstado === 3;
  const confirmado = estadoGuardado.includes("confirm") || idEstado === 2;
  const pendiente = !rechazado && !confirmado;
  return {
    rechazado,
    confirmado,
    pendiente,
    label: confirmado ? "Confirmado" : rechazado ? "Rechazado" : "Pendiente",
  };
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
    const { rechazado, confirmado, pendiente, label: estadoVisible } = getRegistroReciclajeState(item);

    return `
      <tr>
        <td>#RR-${item.id_registro}</td>
        <td>${escapeHtml(item.usuario || `Usuario ${item.id_usuario}`)}</td>
        <td>${escapeHtml(item.material || `Material ${item.id_tipo_material}`)}</td>
        <td>${formatKg(item.cantidad)}</td>
        <td><span class="status-pill status-${statusClass(estadoVisible)}">${estadoVisible}</span></td>
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
    button.addEventListener("click", () => confirmarRegistroRecicladora(Number(button.dataset.id)));
  });

  tbody.querySelectorAll(".registro-rechazar").forEach((button) => {
    button.addEventListener("click", () => rechazarRegistroRecicladora(Number(button.dataset.id)));
  });
}

async function confirmarRegistroRecicladora(id) {
  const confirmar = await window.greenupConfirm("¿Confirmar este reciclaje como entrega realizada?", "Confirmar entrega");
  if (!confirmar) return;
  try {
    await fetchJson(`/api/recicladoras/registros/${id}/estado`, {
      method: "PUT",
      body: JSON.stringify({ id_estado: 2 }),
    });
    await window.greenupAlert("La entrega quedó confirmada correctamente.", "Reciclaje confirmado");
    await refreshCurrentPage();
  } catch (error) {
    await window.greenupAlert(error.message, "No se pudo confirmar");
  }
}

async function rechazarRegistroRecicladora(id) {
  const motivo = await window.greenupPrompt("Escribe el motivo del rechazo:", "", "Rechazar entrega");
  if (motivo === null) return;
  try {
    await fetchJson(`/api/recicladoras/registros/${id}/estado`, {
      method: "PUT",
      body: JSON.stringify({ id_estado: 3, motivo_rechazo: motivo.trim() || "Sin motivo adicional" }),
    });
    await window.greenupAlert("La entrega fue rechazada.", "Reciclaje rechazado");
    await refreshCurrentPage();
  } catch (error) {
    await window.greenupAlert(error.message, "No se pudo rechazar");
  }
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
  setText('[data-metric-change="Alertas"]', data.alertas ? "Entregas pendientes por validar" : "Sin entregas pendientes");

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
    String(item.estado || "Pendiente").toLowerCase().includes("confirm")
      ? "Confirmado"
      : String(item.estado || "").toLowerCase().includes("rechaz")
        ? "Rechazado"
        : "Pendiente de validación",
  ]);
  rowsToTable("Operacion reciente", operaciones);
}

function updateOwnPointPage(profile, current) {
  const statusId = profile.id_estado_punto ?? profile.id_estado_recicladora;
  const status = Number(statusId) === 1 ? "Activo" : Number(statusId) === 2 ? "Inactivo" : "Por confirmar";
  const responsible = `${profile.nombres || ""} ${profile.apellidos || ""}`.trim() || profile.usuario || "Responsable por confirmar";
  const phone = profile.telefono_empresa || "Telefono por confirmar";
  const address = valorPerfilUtil(profile.direccion_punto) || valorPerfilUtil(profile.direccion_empresa);
  const addressLabel = address || "Sin direccion registrada";
  const name = profile.nombre_punto || profile.nombre_empresa || "Mi recicladora";
  const schedule = profile.horario_recicladora || profile.horario || "Horario por confirmar";
  const tableTitle = current === "recicladora_puntos_reciclaje.html" ? "Datos de mi punto" : "Datos de mi recicladora";

  setText('[data-summary-label="Mi punto"]', name);
  setText('[data-summary-label="Registro"]', name);
  setText('[data-summary-label="Estado"]', status);
  setText('[data-own-point-status="Ubicacion"]', addressLabel);
  setText('[data-own-point-status="Contacto"]', phone);
  setText('[data-own-point-status="Horario"]', schedule);
  setText('[data-own-point-status="Estado"]', status);
  if (!address) {
    rowsToTable(tableTitle, [], {
      emptyIcon: "add_location_alt",
      emptyTitle: "Sin direccion registrada",
      emptyMessage: "Agrega la direccion de tu recicladora desde el perfil para verla en el mapa.",
    });
    setExportData([], "mi_recicladora.csv");
    return;
  }

  const row = current === "recicladora_puntos_reciclaje.html"
    ? [name, address, phone, responsible, status]
    : [name, address, phone, schedule, responsible, status];
  rowsToTable(tableTitle, [row]);
  setExportData([row], "mi_recicladora.csv");
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
    let materiales;
    try {
      materiales = await fetchJson("/api/recicladoras/materiales");
    } catch (error) {
      const card = [...document.querySelectorAll(".table-card")]
        .find((item) => item.querySelector("h2")?.textContent.includes("Materiales aceptados"));
      const tbody = card?.querySelector("tbody");
      if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="empty-table-cell"><strong>No se pudieron cargar los materiales</strong><small>${escapeHtml(error.message)}</small></td></tr>`;
      throw error;
    }
    const aceptados = materiales.filter((item) => item.aceptado);
    setText('[data-summary-label="Catalogados"]', `${materiales.length} tipos`);
    setText('[data-summary-label="Activos"]', `${aceptados.length} materiales`);
    renderMaterialsTable(materiales);
    const registroMateriales = document.getElementById("registro-residuos-materiales");
    if (registroMateriales) {
      const registros = await fetchJson("/api/recicladoras/registros");
      registroMateriales.innerHTML = registros.length ? registros.slice(0, 12).map((item) => `
        <tr><td>#GR-${item.id_registro}</td><td>${escapeHtml(item.material || "Material")}</td><td>${formatKg(item.cantidad)}</td><td>${escapeHtml(getRegistroReciclajeState(item).label)}</td><td>${escapeHtml(item.punto || "Punto de origen")}</td></tr>
      `).join("") : '<tr><td colspan="5" class="empty-table-cell">No hay materiales registrados.</td></tr>';
    }
    setExportData(materiales.map((item) => [
      `#MAT-${item.id_tipo_material}`,
      item.nombre || "Material",
      item.descripcion || "",
      item.unidad || "kg",
      item.aceptado ? "Aceptado" : "Inactivo",
    ]), "materiales_recicladora.csv");
  }

  if (current === "recicladora_residuos.html" || current === "recicladora_registros_reciclaje.html") {
    const registros = await fetchJson("/api/recicladoras/registros");
    const pendientes = registros.filter((item) => getRegistroReciclajeState(item).pendiente);
    const confirmados = registros.filter((item) => getRegistroReciclajeState(item).confirmado);
    const totalKgProcesado = confirmados.reduce((total, item) => total + (Number(item.cantidad) || 0), 0);

    if (current === "recicladora_residuos.html") {
      setText('[data-summary-label="Procesados"]', formatKg(totalKgProcesado));
      setText('[data-summary-label="En transito"]', `${pendientes.length} cargas`);
      const filasResiduos = registros.map((item) => {
        const estado = getRegistroReciclajeState(item);
        return {
          id: item.id_registro,
          pendiente: estado.pendiente,
          values: [
            `#GR-${item.id_registro}`,
            clasificarResiduo(item),
            item.material || `Material ${item.id_tipo_material}`,
            formatKg(item.cantidad),
            item.punto || (item.id_punto ? `Punto ${item.id_punto}` : "Punto sin asignar"),
            estado.label,
          ],
        };
      });
      rowsToTable("Residuos registrados", filasResiduos, {
        emptyTitle: "Sin reciclajes registrados",
        emptyMessage: "Los reciclajes asociados a esta recicladora apareceran aqui sin perder su historial.",
        renderActions: (row) => row.pendiente ? `
            <button class="btn-icon" type="button" title="Confirmar entrega" aria-label="Confirmar entrega" onclick="confirmarRegistroRecicladora(${Number(row.id)})">
              <span class="material-symbols-outlined">task_alt</span>
            </button>
            <button class="btn-icon" type="button" title="Rechazar entrega" aria-label="Rechazar entrega" onclick="rechazarRegistroRecicladora(${Number(row.id)})">
              <span class="material-symbols-outlined">cancel</span>
            </button>
          ` : "",
      });
      setExportData(filasResiduos.map((row) => row.values), "residuos_recicladora.csv");
      const registroResiduos = document.getElementById("registro-residuos-materiales");
      if (registroResiduos) registroResiduos.innerHTML = registros.length ? registros.slice(0, 12).map((item) => `
        <tr><td>#GR-${item.id_registro}</td><td>${escapeHtml(clasificarResiduo(item))}</td><td>${escapeHtml(item.material || "Material")}</td><td>${formatKg(item.cantidad)}</td><td>${escapeHtml(getRegistroReciclajeState(item).label)}</td></tr>
      `).join("") : '<tr><td colspan="5" class="empty-table-cell">No hay residuos registrados.</td></tr>';
    }

    if (current === "recicladora_registros_reciclaje.html") {
      setText('[data-summary-label="Registros"]', registros.length);
      setText('[data-summary-label="Pendientes"]', pendientes.length);
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
    setText('[data-summary-label="Borradores"]', Math.max(0, contenidos.length - activos.length));
    rowsToTable(
      "Recursos educativos",
      contenidos.map((item) => ({
        id: item.id_contenido,
        idEstado: item.id_estado,
        values: [item.titulo, item.tipo, "Educacion", nombreEstadoVisibilidad(item.id_estado)],
      })),
      {
        renderActions: (row) => `
          <button class="btn-icon" type="button" title="${Number(row.idEstado) === 1 ? "Ocultar recurso" : "Publicar recurso"}" aria-label="${Number(row.idEstado) === 1 ? "Ocultar recurso" : "Publicar recurso"}" onclick="alternarContenidoEducativoRecicladora(${Number(row.id)}, ${Number(row.idEstado) || 2})">
            <span class="material-symbols-outlined">${Number(row.idEstado) === 1 ? "visibility_off" : "visibility"}</span>
          </button>
        `,
      }
    );
    setExportData(contenidos.map((item) => [item.titulo, item.tipo, item.descripcion || "", item.url_recurso || "", item.imagen || "", nombreEstadoVisibilidad(item.id_estado)]), "contenido_educativo.csv");
  }

  if (current === "recicladora_novedades.html") {
    const novedades = await fetchJson("/api/recicladoras/novedades");
    const activas = novedades.filter((item) => Number(item.id_estado) === 1);
    setText('[data-summary-label="Activas"]', activas.length);
    setText('[data-summary-label="Programadas"]', Math.max(0, novedades.length - activas.length));
    rowsToTable(
      "Comunicaciones",
      novedades.map((item) => ({
        id: item.id_novedad,
        idEstado: item.id_estado,
        values: [
          item.titulo,
          item.fecha || item.fecha_publicacion || "",
          item.usuario || "Ciudadano",
          Number(item.id_estado) === 1 ? (item.estado || "Activa") : "Oculta",
        ],
      })),
      {
        renderActions: (row) => `
          <button class="btn-icon" type="button" title="${Number(row.idEstado) === 1 ? "Ocultar novedad" : "Activar novedad"}" aria-label="${Number(row.idEstado) === 1 ? "Ocultar novedad" : "Activar novedad"}" onclick="alternarNovedadRecicladora(${Number(row.id)}, ${Number(row.idEstado) || 2})">
            <span class="material-symbols-outlined">${Number(row.idEstado) === 1 ? "visibility_off" : "visibility"}</span>
          </button>
        `,
      }
    );
    setExportData(novedades.map((item) => [item.titulo, item.fecha || item.fecha_publicacion || "", item.usuario || "", item.descripcion || "", Number(item.id_estado) === 1 ? (item.estado || "Activa") : "Oculta"]), "novedades_recicladora.csv");
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
      String(item.estado || "Pendiente").toLowerCase().includes("confirm")
        ? "Confirmado"
        : String(item.estado || "").toLowerCase().includes("rechaz")
          ? "Rechazado"
          : "Pendiente de validación",
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
  if (getCurrentFile() === "recicladora_perfil.html") return;
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

function crearMenuSuperiorRecicladora() {
  const contenedorMarca = document.querySelector(".app-topbar .mobile-brand");
  const sidebar = document.querySelector(".app-sidebar");
  if (!contenedorMarca || !sidebar || document.getElementById("recicladoraRoleMenu")) return;

  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "role-menu-toggle";
  boton.setAttribute("aria-label", "Abrir menu de recicladora");
  boton.setAttribute("aria-controls", "recicladoraRoleMenu");
  boton.setAttribute("aria-expanded", "false");
  boton.innerHTML = '<span class="material-symbols-outlined">menu</span>';

  const menu = document.createElement("nav");
  menu.id = "recicladoraRoleMenu";
  menu.className = "role-nav-menu";
  menu.setAttribute("aria-label", "Menu principal recicladora");

  sidebar.querySelectorAll(".sidebar-nav .sidebar-link").forEach((enlace) => {
    const copia = enlace.cloneNode(true);
    copia.classList.add("role-menu-link");
    menu.appendChild(copia);
  });

  const separador = document.createElement("hr");
  separador.className = "my-2";
  menu.appendChild(separador);

  const cerrar = document.createElement("button");
  cerrar.type = "button";
  cerrar.className = "logout-link role-menu-link";
  cerrar.innerHTML = '<span class="material-symbols-outlined">logout</span><span>Cerrar sesion</span>';
  cerrar.addEventListener("click", (event) => {
    if (typeof cerrarSesion === "function") cerrarSesion(event);
  });
  menu.appendChild(cerrar);

  boton.addEventListener("click", () => {
    const abierto = menu.classList.toggle("open");
    boton.setAttribute("aria-expanded", String(abierto));
  });

  menu.addEventListener("click", (event) => {
    if (event.target.closest("a, button")) {
      menu.classList.remove("open");
      boton.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest(".mobile-brand")) return;
    menu.classList.remove("open");
    boton.setAttribute("aria-expanded", "false");
  });

  contenedorMarca.appendChild(boton);
  contenedorMarca.appendChild(menu);
}

function obtenerTemaRecicladora() {
  const tema = localStorage.getItem("recicladora_tema") || "claro";
  return tema === "oscuro" ? "oscuro" : "claro";
}

function aplicarTemaRecicladora() {
  const tema = obtenerTemaRecicladora();
  document.body.classList.toggle("recicladora-theme-dark", tema === "oscuro");
  document.body.classList.toggle("recicladora-theme-light", tema !== "oscuro");
  document.querySelectorAll(".theme-toggle .material-symbols-outlined, [data-recicladora-theme-icon]").forEach((icono) => {
    icono.textContent = tema === "oscuro" ? "light_mode" : "dark_mode";
  });
}

function cambiarTemaRecicladora(modo) {
  const tema = modo === "oscuro" ? "oscuro" : "claro";
  localStorage.setItem("recicladora_tema", tema);
  aplicarTemaRecicladora();
  alert(tema === "oscuro" ? "Tema oscuro activo." : "Tema claro activo.");
}

function alternarTemaRecicladora() {
  cambiarTemaRecicladora(obtenerTemaRecicladora() === "oscuro" ? "claro" : "oscuro");
}

function quitarTemaOscuroRecicladora() {
  /*
    Nombre heredado: antes eliminaba el modo oscuro al cargar la pantalla.
    Ahora respeta la preferencia guardada para que el selector de tema funcione.
  */
  aplicarTemaRecicladora();
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

function compressProfilePhoto(file, maxSize = 320, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("El archivo seleccionado no es una imagen valida"));
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function persistProfilePhoto(photo) {
  if (!photo) throw new Error("Selecciona una foto antes de guardarla");
  await fetchJson("/api/recicladoras/perfil", {
    method: "PUT",
    body: JSON.stringify({ foto_perfil: photo }),
  });
  const user = getUser();
  localStorage.setItem("usuario", JSON.stringify({ ...user, foto_perfil: photo }));
  updateProfilePhotoUI(photo);
}

function bindProfilePhotoInput() {
  const input = document.getElementById("profilePhotoInput");
  const hidden = document.getElementById("profilePhotoValue");
  const label = document.getElementById("profilePhotoName");
  if (!input || !hidden) return;

  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Selecciona una imagen JPG, PNG o WebP");
      input.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("La imagen debe pesar maximo 2 MB");
      input.value = "";
      return;
    }

    let compressedPhoto = "";
    try {
      if (label) label.textContent = "Procesando imagen...";
      compressedPhoto = await compressProfilePhoto(file);
      hidden.value = compressedPhoto;
      updateProfilePhotoUI(compressedPhoto);
    } catch (error) {
      input.value = "";
      if (label) label.textContent = "PNG o JPG, maximo 2 MB.";
      alert(error.message || "No se pudo preparar la foto de perfil");
      return;
    }

    try {
      if (label) label.textContent = "Guardando foto...";
      await persistProfilePhoto(compressedPhoto);
      if (label) label.textContent = `${file.name} guardada`;
      alert("Foto de perfil guardada correctamente");
    } catch (error) {
      if (label) label.textContent = `${file.name} lista para reintentar`;
      alert(error.message || "No se pudo guardar la foto de perfil");
    }
  });
}

function leerArchivoPerfilComoDataUrl(archivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(archivo);
  });
}

function nombreDocumentoCamara(valor) {
  if (!valor) return "";
  try {
    const doc = JSON.parse(valor);
    return doc.nombre || "Documento cargado";
  } catch (_) {
    return /^https?:\/\//i.test(valor) || /^data:/i.test(valor) ? "Documento cargado" : valor;
  }
}

function bindCamaraComercioInput() {
  const input = document.getElementById("camaraComercioInput");
  const hidden = document.getElementById("camaraComercioValue");
  const label = document.getElementById("camaraComercioName");
  if (!input || !hidden) return;

  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;

    const tiposPermitidos = ["application/pdf", "image/jpeg", "image/png"];
    if (!tiposPermitidos.includes(file.type)) {
      alert("La Cámara de Comercio debe ser PDF, JPG o PNG.");
      input.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("La Cámara de Comercio no debe superar 5 MB.");
      input.value = "";
      return;
    }

    try {
      const contenido = await leerArchivoPerfilComoDataUrl(file);
      hidden.value = JSON.stringify({
        nombre: file.name,
        tipo: file.type,
        tamano: file.size,
        contenido,
      });
      if (label) label.textContent = `${file.name} listo para guardar.`;
    } catch (error) {
      alert(error.message || "No se pudo preparar el documento.");
      input.value = "";
    }
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
      await persistProfilePhoto(hidden.value);
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
      data[key] = input.value.trim();
    });

    if (data.administrador) {
      const partesNombre = data.administrador.split(/\s+/).filter(Boolean);
      data.nombres = partesNombre.shift() || data.administrador;
      data.apellidos = partesNombre.join(" ") || "Responsable";
    }

    if (data.usuario && data.usuario.length < 5) {
      alert("El usuario debe tener minimo 5 caracteres.");
      return;
    }

    if (!data.horario && (data.dias_trabajo || data.hora_inicio || data.hora_fin)) {
      const rangoHoras = [data.hora_inicio, data.hora_fin].filter(Boolean).join(" - ");
      data.horario = [data.dias_trabajo, rangoHoras].filter(Boolean).join(", ");
    }

    try {
      await fetchJson("/api/recicladoras/perfil", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      // La dirección y el horario deben confirmarse también en el punto
      // ecológico. Si esta segunda operación falla, no mostramos un falso
      // mensaje de éxito: el catch exterior informa el error real.
      await fetchJson("/api/recicladoras/mi-punto", {
        method: "PUT",
        body: JSON.stringify({
          nombre_empresa: data.nombre_empresa,
          direccion_empresa: data.direccion_empresa,
          telefono_empresa: data.telefono_empresa,
          horario: data.horario,
        }),
      });
      await hydrateRecicladoraProfile();
      alert("Perfil actualizado correctamente");
      const user = getUser();
      localStorage.setItem("usuario", JSON.stringify({
        ...user,
        nombres: data.nombres || user.nombres,
        apellidos: data.apellidos || user.apellidos,
        correo: data.correo || user.correo,
        usuario: data.usuario || user.usuario,
        foto_perfil: data.foto_perfil || user.foto_perfil,
      }));
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

function normalizarFooterRecicladora() {
  const enlaces = {
    "privacidad": "../public/public_sobre_nosotros.html#legal",
    "términos": "../public/public_sobre_nosotros.html#legal",
    "terminos": "../public/public_sobre_nosotros.html#legal",
    "cookies": "../public/public_sobre_nosotros.html#legal",
    "contacto": "mailto:greenup213@gmail.com?subject=Contacto%20GreenUp",
    "soporte": "mailto:greenup213@gmail.com?subject=Soporte%20GreenUp",
    "eco-blog": "../public/public_educacion.html#noticias",
    "novedades": "recicladora_novedades.html",
    "eventos": "recicladora_novedades.html",
    "misión": "../public/public_sobre_nosotros.html#mision",
    "mision": "../public/public_sobre_nosotros.html#mision",
    "impacto": "../public/public_sobre_nosotros.html#impacto",
    "equipo": "../public/public_sobre_nosotros.html#equipo",
    "carreras": "mailto:greenup213@gmail.com?subject=Quiero%20hacer%20parte%20de%20GreenUp",
  };

  document.querySelectorAll("footer a[href='#'], footer a:not([href])").forEach((enlace) => {
    const texto = (enlace.textContent || "").trim().toLowerCase();
    const icono = enlace.querySelector(".material-symbols-outlined")?.textContent?.trim().toLowerCase() || "";
    if (icono === "mail") {
      enlace.href = "mailto:greenup213@gmail.com?subject=Contacto%20GreenUp";
      return;
    }
    if (icono === "public") {
      enlace.href = "../public/public_sobre_nosotros.html";
      return;
    }
    if (icono === "share") {
      enlace.href = window.location.href;
      enlace.addEventListener("click", async (evento) => {
        evento.preventDefault();
        const url = window.location.origin + "/pages/public/public_inicio.html";
        if (navigator.share) {
          await navigator.share({
            title: "GreenUp",
            text: "Conoce GreenUp, una plataforma para reciclar mejor y ubicar puntos ecológicos.",
            url,
          });
          return;
        }
        await navigator.clipboard?.writeText(url);
        alert("Enlace de GreenUp copiado para compartir.");
      });
      return;
    }
    const destino = Object.entries(enlaces).find(([clave]) => texto.includes(clave))?.[1];
    enlace.href = destino || "mailto:greenup213@gmail.com?subject=GreenUp";
  });

  document.querySelectorAll("[data-greenup-mail]").forEach((enlace) => {
    enlace.href = "mailto:greenup213@gmail.com?subject=Soporte%20GreenUp";
  });
  document.querySelectorAll("[data-greenup-whatsapp]").forEach((enlace) => {
    enlace.href = "https://wa.me/573185810461?text=Hola%20GreenUp,%20necesito%20soporte";
    enlace.target = "_blank";
    enlace.rel = "noopener noreferrer";
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

function pintarCamposPerfilRecicladora(values = {}, options = {}) {
  const limpiarPendientes = options.limpiarPendientes === true;

  document.querySelectorAll("[data-profile-field]").forEach((input) => {
    const key = input.getAttribute("data-profile-field");
    const value = values[key];
    if (value !== undefined && value !== null && value !== "") {
      input.value = value;
    } else if (limpiarPendientes && input.value === "Cargando...") {
      input.value = "";
    }
  });
}

function precargarPerfilRecicladoraLocal() {
  const user = getUser();
  if (!user || !document.querySelector("[data-profile-field]")) return;

  pintarCamposPerfilRecicladora({
    administrador: `${user.nombres || ""} ${user.apellidos || ""}`.trim() || user.usuario || "",
    correo: user.correo || "",
    usuario: user.usuario || "",
    telefono_empresa: user.celular || "",
    foto_perfil: user.foto_perfil || "",
  });
}

function soloDigitosPerfil(value) {
  return String(value || "").replace(/\D/g, "");
}

function textoNormalizadoPerfil(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function valorPerfilUtil(value) {
  const texto = String(value || "").trim();
  if (!texto) return "";
  if (/^(direccion|dirección|nombre|nit|telefono|teléfono).*$/i.test(texto)) return "";
  if (/pendiente|por confirmar|cargando/i.test(texto)) return "";
  return texto;
}

async function buscarPuntoPerfilPorUsuario(userProfile = {}) {
  try {
    const puntos = await fetchJson("/ubicaciones");
    const lista = Array.isArray(puntos) ? puntos : [];
    const telefonoUsuario = soloDigitosPerfil(userProfile.celular || userProfile.telefono_empresa || "");
    const nombreCompleto = textoNormalizadoPerfil(`${userProfile.nombres || ""} ${userProfile.apellidos || ""}`);
    const nombreSimple = textoNormalizadoPerfil(userProfile.nombres || "");

    return lista.find((punto) => {
      const telefonoPunto = soloDigitosPerfil(punto.telefono || punto.telefono_empresa || "");
      const responsable = textoNormalizadoPerfil(punto.responsable || "");
      return (
        (telefonoUsuario && telefonoPunto && telefonoUsuario === telefonoPunto) ||
        (nombreCompleto && responsable && responsable === nombreCompleto) ||
        (nombreSimple && responsable && responsable === nombreSimple)
      );
    }) || {};
  } catch (error) {
    console.warn("Perfil cargado sin respaldo de ubicaciones:", error.message);
    return {};
  }
}

async function hydrateRecicladoraProfile() {
  try {
    const [profileResult, pointResult, userResult] = await Promise.allSettled([
      fetchJson("/api/recicladoras/perfil"),
      fetchJson("/api/recicladoras/mi-punto"),
      fetchJson("/api/usuarios/perfil"),
    ]);
    const profile = profileResult.status === "fulfilled" ? profileResult.value : {};
    const pointProfile = pointResult.status === "fulfilled" ? pointResult.value : {};
    const userProfile = userResult.status === "fulfilled" ? userResult.value : {};

    if (profileResult.status === "rejected" && pointResult.status === "rejected" && userResult.status === "rejected") {
      throw profileResult.reason || pointResult.reason || userResult.reason;
    }

    const locationProfile = await buscarPuntoPerfilPorUsuario({ ...userProfile, ...pointProfile, ...profile });
    const mergedProfile = { ...userProfile, ...locationProfile, ...pointProfile, ...profile };
    const responsableUsuario = textoNormalizadoPerfil(userProfile.nombres || profile.nombres || "");
    const empresaBackend = valorPerfilUtil(mergedProfile.nombre_empresa);
    const empresaPunto = valorPerfilUtil(mergedProfile.nombre_punto || mergedProfile.nombre);
    const empresaValida = textoNormalizadoPerfil(empresaBackend) === responsableUsuario ? "" : empresaBackend;
    const values = {
      ...mergedProfile,
      nombre_empresa: empresaValida || empresaPunto,
      nit_empresa: mergedProfile.nit_empresa || mergedProfile.numero_documento || "",
      direccion_empresa: valorPerfilUtil(mergedProfile.direccion_empresa) || valorPerfilUtil(mergedProfile.direccion_punto) || valorPerfilUtil(mergedProfile.direccion),
      telefono_empresa: valorPerfilUtil(mergedProfile.telefono_empresa) || valorPerfilUtil(mergedProfile.telefono_punto) || valorPerfilUtil(mergedProfile.telefono) || valorPerfilUtil(mergedProfile.celular),
      administrador: `${mergedProfile.nombres || ""} ${mergedProfile.apellidos || ""}`.trim(),
      correo: mergedProfile.correo || "",
      usuario: mergedProfile.usuario || "",
      horario: valorPerfilUtil(mergedProfile.horario_recicladora) || valorPerfilUtil(mergedProfile.horario) || "",
    };

    pintarCamposPerfilRecicladora(values, { limpiarPendientes: true });

    const camaraLabel = document.getElementById("camaraComercioName");
    const camaraNombre = nombreDocumentoCamara(mergedProfile.camara_comercio || "");
    if (camaraLabel && camaraNombre) {
      camaraLabel.textContent = `${camaraNombre} guardado. Puedes reemplazarlo si necesitas actualizarlo.`;
    }

    if (mergedProfile.foto_perfil) {
      const user = getUser();
      localStorage.setItem("usuario", JSON.stringify({ ...user, foto_perfil: mergedProfile.foto_perfil }));
    }
    updateProfilePhotoUI(mergedProfile.foto_perfil || "");

    const title = document.querySelector(".page-title");
    if (title && values.nombre_empresa) {
      title.innerHTML = `Perfil de <strong>${escapeHtml(values.nombre_empresa)}</strong>`;
    }

    const subtitle = document.querySelector(".page-subtitle");
    if (subtitle && values.direccion_empresa) {
      subtitle.textContent = `Datos cargados desde la base de datos para ${values.direccion_empresa}.`;
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

/**
 * Convierte los encabezados de las tablas en etiquetas utilizables por la
 * presentación responsive. El observador cubre filas que llegan luego desde
 * la API, sin duplicar esta lógica en cada pantalla de la recicladora.
 */
function prepararTablasResponsivasRecicladora(root = document) {
  root.querySelectorAll?.("table.admin-table").forEach((tabla) => {
    const etiquetas = Array.from(tabla.querySelectorAll("thead th"))
      .map((encabezado) => encabezado.textContent.trim());

    tabla.classList.add("responsive-table-ready");
    tabla.querySelectorAll("tbody tr").forEach((fila) => {
      const celdas = Array.from(fila.children).filter((celda) => celda.tagName === "TD");
      celdas.forEach((celda, indice) => {
        if (celda.hasAttribute("colspan")) {
          celda.classList.add("responsive-table-empty");
          return;
        }
        celda.dataset.label = etiquetas[indice] || "Dato";
      });
    });
  });
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
  crearMenuSuperiorRecicladora();
  quitarTemaOscuroRecicladora();
  bindModalForms();
  bindProfilePhotoInput();
  bindCamaraComercioInput();
  bindProfilePhotoSave();
  bindGenericExportButtons();
  bindProfileSave();
  bindReportExports();
  normalizarFooterRecicladora();
  prepararTablasResponsivasRecicladora();

  const observadorTablasResponsive = new MutationObserver((cambios) => {
    cambios.forEach((cambio) => {
      cambio.addedNodes.forEach((nodo) => {
        if (nodo.nodeType === Node.ELEMENT_NODE) {
          prepararTablasResponsivasRecicladora(nodo);
          if (nodo.matches?.("tr, td")) {
            prepararTablasResponsivasRecicladora(nodo.closest("table")?.parentElement || document);
          }
        }
      });
    });
  });
  observadorTablasResponsive.observe(document.body, { childList: true, subtree: true });

  const current = getCurrentFile();
  if (current === "recicladora_perfil.html") {
    precargarPerfilRecicladoraLocal();
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

(function cargarAccesibilidadRecicladora() {
  if (document.querySelector("script[data-greenup-accessibility]")) return;
  const script = document.createElement("script");
  script.dataset.greenupAccessibility = "true";
  script.src = new URL("accessibility.js", document.currentScript.src).href;
  document.head.appendChild(script);
})();
