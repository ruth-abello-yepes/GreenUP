const primaryNav = [
  { href: "recicladora_panel.html", label: "Panel", fullLabel: "Panel de control", icon: "dashboard" },
  { href: "recicladora_materiales.html", label: "Materiales", fullLabel: "Gestionar materiales", icon: "inventory_2" },
  { href: "recicladora_residuos.html", label: "Residuos", fullLabel: "Gestionar residuos", icon: "delete_sweep" },
  { href: "recicladora_usuarios.html", label: "Usuarios", fullLabel: "Usuarios recicladores", icon: "groups" },
  { href: "recicladora_rutas_reciclaje.html", label: "Rutas", fullLabel: "Rutas y puntos", icon: "map" },
];

const secondaryNav = [
  { href: "recicladora_registros_reciclaje.html", label: "Registros", icon: "fact_check" },
  { href: "recicladora_reportes.html", label: "Reportes", icon: "analytics" },
  { href: "recicladora_estadisticas.html", label: "Estadisticas", icon: "monitoring" },
  { href: "recicladora_contenido_educativo.html", label: "Contenido", icon: "menu_book" },
  { href: "recicladora_novedades.html", label: "Novedades", icon: "campaign" },
  { href: "recicladora_faq.html", label: "FAQ", icon: "quiz" },
];

const profileNav = [
  { href: "recicladora_perfil.html", label: "Perfil", icon: "person" },
  { href: "recicladora_configuracion.html", label: "Configuracion", icon: "settings" },
];

const mobileBottomNav = primaryNav;

const pages = {
  "recicladora_panel.html": {
    title: 'Panel de <strong>control</strong>',
    subtitle: "Supervisa materiales, residuos, rutas, usuarios y reportes desde un solo tablero de la recicladora.",
    stats: [
      ["Hoy", "0 kg", "muted"],
      ["En ruta", "0 cargas", "blue"],
    ],
    filters: {
      search: "Buscar por material, codigo o ubicacion...",
      selects: [
        ["Tipo de registro", "Materiales", "Residuos", "Rutas"],
        ["Estado", "Activo", "Pendiente", "Finalizado"],
      ],
    },
    type: "panel",
    metrics: [
      ["Material recuperado", "0 kg", "Sin registros", "recycling", ""],
      ["Cargas activas", "0", "Sin rutas", "local_shipping", "blue"],
      ["Recicladores", "0", "Sin actividad", "groups", ""],
      ["Alertas", "0", "Sin alertas", "notifications_active", "blue"],
    ],
    table: {
      title: "Operacion reciente",
      columns: ["ID", "Operacion", "Responsable", "Zona", "Estado", "Acciones"],
      rows: [],
    },
  },
  "recicladora_materiales.html": {
    title: 'Gestion de <strong>materiales</strong>',
    subtitle: "Administra el catalogo de materiales aceptados, categorias, puntos de referencia y disponibilidad operativa.",
    stats: [["Catalogados", "0 tipos", "muted"], ["Activos", "0 materiales", "blue"]],
    filters: { search: "Buscar material...", selects: [["Categoria", "Plastico", "Vidrio", "Metal", "Papel"], ["Estado", "Activo", "Revision", "Inactivo"]], action: "Nuevo material", icon: "add" },
    table: {
      title: "Materiales aceptados",
      columns: ["Codigo", "Material", "Categoria", "Puntos", "Estado", "Acciones"],
      rows: [],
    },
  },
  "recicladora_residuos.html": {
    title: 'Gestion de <strong>residuos</strong>',
    subtitle: "Controla el flujo de residuos, estados de procesamiento y asignacion de cargas para la economia circular.",
    stats: [["Procesados", "0 kg", "muted"], ["En transito", "0 cargas", "blue"]],
    filters: { search: "Buscar residuo o punto de origen...", selects: [["Tipo de residuo", "Plastico PET", "Vidrio", "Aluminio", "Carton"], ["Estado", "Recolectado", "En proceso", "Procesado"]] },
    table: {
      title: "Residuos registrados",
      columns: ["ID seguimiento", "Tipo", "Peso", "Punto de origen", "Estado", "Acciones"],
      rows: [],
    },
  },
  "recicladora_usuarios.html": {
    title: 'Usuarios <strong>recicladores</strong>',
    subtitle: "Gestiona colaboradores, conductores, clasificadores y ciudadanos asociados a la operacion de la recicladora.",
    stats: [["Registrados", "0", "muted"], ["En ruta", "0 usuarios", "blue"]],
    filters: { search: "Buscar usuario, documento o zona...", selects: [["Rol", "Conductor", "Recolector", "Clasificador"], ["Disponibilidad", "Disponible", "En ruta", "Inactivo"]], action: "Nuevo usuario", icon: "person_add" },
    table: {
      title: "Equipo asociado",
      columns: ["ID", "Usuario", "Documento", "Zona", "Estado", "Acciones"],
      rows: [],
    },
  },
  "recicladora_rutas_reciclaje.html": {
    title: 'Rutas y <strong>puntos</strong>',
    subtitle: "Organiza recorridos, puntos de acopio y disponibilidad de equipos para una recoleccion eficiente.",
    stats: [["Rutas activas", "0", "muted"], ["Puntos", "0", "blue"]],
    filters: { search: "Buscar ruta, punto o zona...", selects: [["Zona", "Norte", "Centro", "Sur"], ["Estado", "Activa", "Programada", "Finalizada"]], action: "Nueva ruta", icon: "add_location_alt" },
    type: "map",
    table: {
      title: "Rutas programadas",
      columns: ["Ruta", "Conductor", "Puntos", "Horario", "Estado", "Acciones"],
      rows: [],
    },
  },
  "recicladora_registros_reciclaje.html": {
    title: 'Registros de <strong>reciclaje</strong>',
    subtitle: "Consulta entradas de material, entregas registradas y trazabilidad de cada carga recibida.",
    stats: [["Registros", "0", "muted"], ["Pendientes", "0", "blue"]],
    filters: { search: "Buscar por codigo, usuario o material...", selects: [["Material", "PET", "Vidrio", "Carton"], ["Periodo", "Hoy", "Semana", "Mes"]] },
    table: {
      title: "Entradas recientes",
      columns: ["Registro", "Usuario", "Material", "Cantidad", "Estado", "Acciones"],
      rows: [],
    },
  },
  "recicladora_puntos_reciclaje.html": {
    title: 'Puntos de <strong>reciclaje</strong>',
    subtitle: "Administra sedes, puntos aliados, horarios y capacidad de recepcion de materiales.",
    stats: [["Activos", "0 puntos", "muted"], ["Capacidad", "0%", "blue"]],
    filters: { search: "Buscar punto o direccion...", selects: [["Zona", "Norte", "Centro", "Sur"], ["Estado", "Activo", "Cerrado", "Mantenimiento"]], action: "Nuevo punto", icon: "add_location" },
    type: "map",
    table: {
      title: "Puntos disponibles",
      columns: ["Punto", "Direccion", "Horario", "Responsable", "Estado", "Acciones"],
      rows: [],
    },
  },
  "recicladora_reportes.html": {
    title: 'Reportes <strong>ambientales</strong>',
    subtitle: "Genera informes operativos y ambientales listos para administracion, aliados o entidades de control.",
    stats: [["Generados", "0", "muted"], ["Pendientes", "0", "blue"]],
    filters: { selects: [["Tipo de reporte", "Operativo", "Ambiental", "Financiero"], ["Formato", "PDF", "Excel", "CSV"]], action: "Generar", icon: "download" },
    type: "report",
    table: {
      title: "Reportes recientes",
      columns: ["Reporte", "Fecha", "Formato", "Estado", "Acciones"],
      rows: [],
    },
  },
  "recicladora_estadisticas.html": {
    title: 'Estadisticas de <strong>impacto</strong>',
    subtitle: "Analiza recuperacion de materiales, eficiencia de rutas y composicion de residuos para tomar mejores decisiones.",
    stats: [["Recuperado", "0 kg", "muted"], ["Crecimiento", "0%", "blue"]],
    filters: { selects: [["Periodo", "Ultimos 30 dias", "Trimestre", "Ano"], ["Material", "Todos", "PET", "Vidrio"], ["Zona", "Todas", "Norte", "Centro", "Sur"]] },
    type: "stats",
  },
  "recicladora_contenido_educativo.html": {
    title: 'Contenido <strong>educativo</strong>',
    subtitle: "Publica recursos, guias y campanas para mejorar la separacion de residuos en la comunidad.",
    stats: [["Publicados", "0", "muted"], ["Borradores", "0", "blue"]],
    filters: { search: "Buscar recurso educativo...", selects: [["Tipo", "Articulo", "Video", "Infografia"], ["Estado", "Publicado", "Borrador"]], action: "Nuevo recurso", icon: "post_add" },
    table: {
      title: "Recursos educativos",
      columns: ["Recurso", "Tipo", "Categoria", "Estado", "Acciones"],
      rows: [],
    },
  },
  "recicladora_novedades.html": {
    title: 'Novedades y <strong>avisos</strong>',
    subtitle: "Gestiona eventos, alertas operativas y comunicaciones visibles para usuarios de la recicladora.",
    stats: [["Activas", "0", "muted"], ["Programadas", "0", "blue"]],
    filters: { search: "Buscar novedad...", selects: [["Categoria", "Evento", "Aviso", "Alerta"], ["Estado", "Activa", "Programada", "Inactiva"]], action: "Nueva novedad", icon: "campaign" },
    table: {
      title: "Comunicaciones",
      columns: ["Novedad", "Fecha", "Categoria", "Estado", "Acciones"],
      rows: [],
    },
  },
  "recicladora_faq.html": {
    title: 'Preguntas <strong>frecuentes</strong>',
    subtitle: "Administra respuestas rapidas sobre horarios, materiales recibidos, rutas y puntos de atencion.",
    stats: [["Preguntas", "0", "muted"], ["Visibles", "0", "blue"]],
    filters: { search: "Buscar pregunta...", selects: [["Categoria", "Cuenta", "Reciclaje", "Puntos"], ["Estado", "Visible", "Oculta"]], action: "Nueva FAQ", icon: "add", modal: "abrirModalFaq()" },
    table: {
      title: "FAQ visibles",
      columns: ["Pregunta", "Categoria", "Orden", "Estado", "Acciones"],
      rows: [],
    },
  },
  "recicladora_perfil.html": {
    title: 'Perfil de <strong>recicladora</strong>',
    subtitle: "Consulta y actualiza datos principales de la empresa, responsable, contacto y documentos.",
    stats: [["Perfil", "Activo", "muted"], ["Verificacion", "Alta", "blue"]],
    type: "profile",
  },
  "recicladora_configuracion.html": {
    title: 'Configuracion <strong>admin</strong>',
    subtitle: "Ajusta seguridad, notificaciones, preferencias de operacion y datos administrativos.",
    stats: [["Notificaciones", "Activas", "muted"], ["Seguridad", "Alta", "blue"]],
    type: "settings",
  },
};

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
  return typeof API_URL !== "undefined" ? API_URL : "http://127.0.0.1:5000";
}

function getSessionHeaders() {
  const user = getUser();
  return {
    "Content-Type": "application/json",
    ...(user.id_usuario ? { id_usuario: user.id_usuario } : {}),
    ...(user.id_rol ? { id_rol: user.id_rol } : {}),
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isActive(current, href) {
  return current === href ? " active" : "";
}

function renderBrand(target = "recicladora_panel.html") {
  return `
    <a class="brand-lockup" href="${target}" aria-label="Ir al panel GreenUp">
      <span class="brand-logo"><span class="material-symbols-outlined filled">recycling</span></span>
      <span>
        <span class="brand-name">Green<strong>Up</strong></span>
        <span class="brand-kicker">Admin recicladora</span>
      </span>
    </a>
  `;
}

function renderSidebar(current) {
  const links = primaryNav
    .map((item) => `
      <a class="sidebar-link${isActive(current, item.href)}" href="${item.href}">
        <span class="material-symbols-outlined">${item.icon}</span>
        <span>${item.fullLabel}</span>
      </a>
    `)
    .join("");

  return `
    <aside class="app-sidebar" aria-label="Navegacion principal">
      ${renderBrand()}
      <nav class="sidebar-nav">${links}</nav>
      <div class="sidebar-actions">
        <button class="logout-link" type="button" onclick="cerrarSesion()">
          <span class="material-symbols-outlined">logout</span>
          <span>Cerrar sesion</span>
        </button>
      </div>
    </aside>
  `;
}

function renderTopbar(current) {
  const menuLinks = [
    ...secondaryNav,
    ...profileNav,
  ]
    .map((item) => `
      <a href="${item.href}" class="${item.className || ""}">
        <span class="material-symbols-outlined">${item.icon}</span>
        <span>${item.label}</span>
      </a>
    `)
    .join("");

  return `
    <header class="app-topbar">
      <div class="mobile-brand">${renderBrand()}</div>
      <form class="topbar-search" role="search">
        <div class="search-shell">
          <span class="material-symbols-outlined">search</span>
          <input class="form-control" type="search" placeholder="Buscar registros..." aria-label="Buscar registros">
        </div>
      </form>
      <div class="topbar-actions">
        <button class="icon-button" type="button" aria-label="Notificaciones" title="Notificaciones" onclick="mostrarNotificacionesRecicladora()">
          <span class="material-symbols-outlined">notifications</span>
        </button>
        <div class="user-menu">
          <button class="user-avatar" type="button" aria-label="Perfil y configuracion" title="Perfil">
            <span class="material-symbols-outlined filled">person</span>
            <span class="user-avatar-label">Perfil</span>
          </button>
          <div class="user-dropdown" id="userDropdown">
            ${menuLinks}
            <button type="button" onclick="cerrarSesion()">
              <span class="material-symbols-outlined">logout</span>
              <span>Cerrar sesion</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  `;
}

function renderHero(page) {
  const stats = (page.stats || [])
    .map(([label, value, variant]) => `
      <article class="summary-card ${variant || ""}">
        <span class="summary-label">${label}</span>
        <span class="summary-value" data-summary-label="${escapeHtml(label)}">${value}</span>
      </article>
    `)
    .join("");

  return `
    <section class="page-hero">
      <div>
        <h1 class="page-title">${page.title}</h1>
        <p class="page-subtitle">${page.subtitle}</p>
      </div>
      <div class="hero-stats">${stats}</div>
    </section>
  `;
}

function renderFilters(page) {
  if (!page.filters) return "";

  const search = page.filters.search
    ? `
      <div class="search-shell search-field">
        <span class="material-symbols-outlined">search</span>
        <input class="form-control" type="search" placeholder="${page.filters.search}" aria-label="Buscar">
      </div>
    `
    : "";

  const selects = (page.filters.selects || [])
    .map((options) => `
      <select class="form-select" aria-label="${options[0]}">
        ${options.map((option, index) => `<option ${index === 0 ? "selected" : ""}>${option}</option>`).join("")}
      </select>
    `)
    .join("");

  const action = page.filters.action
    ? `<button class="btn-greenup" type="button" ${page.filters.modal ? `onclick="${page.filters.modal}"` : ""}><span class="material-symbols-outlined">${page.filters.icon || "add"}</span>${page.filters.action}</button>`
    : `<button class="filter-action" type="button" aria-label="Aplicar filtros"><span class="material-symbols-outlined">filter_list</span></button>`;

  return `<section class="filter-bar" aria-label="Filtros">${search}${selects}${action}</section>`;
}

function statusClass(status) {
  const text = String(status).toLowerCase();
  if (text.includes("revision") || text.includes("programada") || text.includes("proceso") || text.includes("capacitacion")) return "warning";
  if (text.includes("transito") || text.includes("en ruta") || text.includes("enviado") || text.includes("recolectado")) return "blue";
  if (text.includes("inactivo") || text.includes("cerrado")) return "danger";
  return "success";
}

function renderEmptyState(title, text) {
  return `
    <div class="inline-empty-state">
      <span class="material-symbols-outlined">inbox</span>
      <strong>${title}</strong>
      <small>${text}</small>
    </div>
  `;
}

function renderTable(table) {
  if (!table) return "";

  const head = table.columns.map((column) => `<th>${column}</th>`).join("");
  const body = table.rows
    .map((row) => {
      const status = row[row.length - 2];
      const explicitStatus = row[row.length - 1];
      const cells = row.slice(0, -1).map((cell, index) => {
        if (index === 0 && String(cell).startsWith("#")) return `<td><span class="id-chip">${cell}</span></td>`;
        if (index === row.length - 2) return `<td><span class="status-pill status-${explicitStatus || statusClass(status)}">${cell}</span></td>`;
        if (index === 1) {
          return `
            <td>
              <span class="type-cell">
                <span class="type-icon ${index % 2 ? "" : "blue"}"><span class="material-symbols-outlined">eco</span></span>
                ${cell}
              </span>
            </td>
          `;
        }
        return `<td>${cell}</td>`;
      }).join("");

      return `
        <tr>
          ${cells}
          <td>
            <span class="action-group">
              <button class="btn-icon" type="button" aria-label="Ver"><span class="material-symbols-outlined">visibility</span></button>
              <button class="btn-icon" type="button" aria-label="Editar"><span class="material-symbols-outlined">edit_note</span></button>
            </span>
          </td>
        </tr>
      `;
    })
    .join("");

  const emptyBody = `
    <tr class="empty-row">
      <td colspan="${table.columns.length}" class="empty-table-cell">
        <span class="material-symbols-outlined">inbox</span>
        <strong>Sin registros</strong>
        <small>Cuando haya informacion en la base de datos aparecera aqui automaticamente.</small>
      </td>
    </tr>
  `;

  return `
    <article class="table-card span-12">
      <div class="card-title-row" style="padding: 22px 24px 0;">
        <h2>${table.title || "Registros"}</h2>
        <button class="btn-soft" type="button"><span class="material-symbols-outlined">download</span>Exportar</button>
      </div>
      <div class="table-responsive">
        <table class="admin-table">
          <thead><tr>${head}</tr></thead>
          <tbody>${body || emptyBody}</tbody>
        </table>
      </div>
    </article>
  `;
}

function renderMetricCards(metrics) {
  return (metrics || []).map(([label, value, change, icon, variant]) => `
    <article class="admin-card metric-card span-3">
      <div class="metric-top">
        <span class="metric-label">${label}</span>
        <span class="metric-icon ${variant || ""}"><span class="material-symbols-outlined">${icon}</span></span>
      </div>
      <div>
        <p class="metric-value" data-metric-label="${escapeHtml(label)}">${value}</p>
        <span class="metric-change" data-metric-change="${escapeHtml(label)}">${change}</span>
      </div>
    </article>
  `).join("");
}

function renderPanel(page) {
  const cards = [...primaryNav, ...secondaryNav, ...profileNav]
    .filter((item) => item.href !== "recicladora_panel.html")
    .map((item) => {
      const cardPage = pages[item.href];
      return `
        <article class="module-card">
          <div>
            <span class="type-icon"><span class="material-symbols-outlined">${item.icon}</span></span>
            <h3>${item.label}</h3>
            <p>${cardPage ? cardPage.subtitle : "Modulo disponible para la recicladora."}</p>
          </div>
          <a class="btn-soft" href="${item.href}">Abrir</a>
        </article>
      `;
    })
    .join("");

  return `
    <section class="content-grid">
      ${renderMetricCards(page.metrics)}
      <article class="admin-card span-8">
        <div class="card-title-row">
          <h2>Actividad semanal</h2>
          <button class="btn-icon" type="button" aria-label="Mas opciones"><span class="material-symbols-outlined">more_horiz</span></button>
        </div>
        ${renderChart()}
      </article>
      <article class="admin-card span-4">
        <div class="card-title-row"><h2>Alertas recientes</h2><a class="btn-soft" href="recicladora_novedades.html">Ver</a></div>
        ${renderAlerts()}
      </article>
      ${renderTable(page.table)}
      <article class="admin-card span-12">
        <div class="card-title-row"><h2>Todos los modulos</h2></div>
        <div class="module-grid">${cards}</div>
      </article>
    </section>
  `;
}

function renderChart(values = [["Lun", 0], ["Mar", 0], ["Mie", 0], ["Jue", 0], ["Vie", 0], ["Sab", 0], ["Dom", 0]]) {
  return `
    <div class="chart-bars" aria-label="Grafico semanal">
      ${values.map(([day, value]) => `<div class="chart-bar"><span data-chart-value="${day}" style="height:${value}%"></span><span>${day}</span></div>`).join("")}
    </div>
  `;
}

function renderAlerts() {
  const alerts = [];

  return `
    <div class="stack-list" id="alertas-recientes">
      ${alerts.length ? alerts.map(([icon, title, text, time, variant]) => `
        <div class="stack-item">
          <span class="type-icon ${variant}"><span class="material-symbols-outlined">${icon}</span></span>
          <p><strong>${title}</strong> ${text}<br><small>${time}</small></p>
        </div>
      `).join("") : renderEmptyState("Sin alertas", "Cuando exista una alerta operativa aparecera aqui.")}
    </div>
  `;
}

function renderMapAndRoutes(page) {
  return `
    <section class="content-grid">
      <article class="admin-card span-8 recycling-map-card">
        <div class="card-title-row">
          <h2>Mapa operativo</h2>
          <button class="btn-soft" type="button" onclick="centerMap()"><span class="material-symbols-outlined">my_location</span>Centrar</button>
        </div>
        <div class="dueno-map-shell">
          <div id="eco-map"></div>
          <div class="map-floating-controls">
            <button class="btn-icon" type="button" onclick="centerMap()" aria-label="Centrar mapa"><span class="material-symbols-outlined">my_location</span></button>
            <button class="btn-icon" type="button" onclick="greenupMapZoomIn()" aria-label="Acercar"><span class="material-symbols-outlined">add</span></button>
            <button class="btn-icon" type="button" onclick="greenupMapZoomOut()" aria-label="Alejar"><span class="material-symbols-outlined">remove</span></button>
          </div>
        </div>
      </article>
      <div class="span-4 map-side-stack">
        <article class="admin-card">
          <div class="card-title-row">
            <h2 class="side-title"><span class="material-symbols-outlined">recycling</span>Puntos Eco</h2>
          </div>
          <div id="recycling-list" class="dueno-map-list"></div>
          <button id="btn-abrir-sugerencia" class="btn-greenup map-side-action" type="button">
            <span class="material-symbols-outlined">add_location_alt</span>Sugerir punto
          </button>
        </article>
        <article class="admin-card">
          <div class="card-title-row"><h2>Capacidad destacada</h2></div>
          ${renderProgressList()}
        </article>
      </div>
      ${renderTable(page.table)}
    </section>
  `;
}

function renderProgressList() {
  const rows = [["Rutas registradas", 0], ["Puntos con capacidad", 0], ["Capacidad reportada", 0]];
  return `
    <div class="stack-list">
      ${rows.map(([name, value]) => `
        <div>
          <div style="display:flex; justify-content:space-between; gap:12px; font-weight:900;"><span>${name}</span><span>${value}%</span></div>
          <div class="progress" style="margin-top:10px;"><div class="progress-bar" style="width:${value}%"></div></div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderStatsPage() {
  return `
    <section class="content-grid">
      <article class="admin-card span-8">
        <div class="card-title-row"><h2>Toneladas recuperadas</h2><button class="btn-soft" type="button">Exportar</button></div>
        ${renderChart()}
      </article>
      <article class="admin-card span-4">
        <div class="card-title-row"><h2>Composicion</h2></div>
        <div class="donut empty"><div class="donut-center"><div><span style="display:block;font-size:2rem;">0%</span><small>reciclable</small></div></div></div>
        <div class="stack-list" style="margin-top:22px;">
          <div style="display:flex;justify-content:space-between;"><span>Plastico</span><strong>0%</strong></div>
          <div style="display:flex;justify-content:space-between;"><span>Vidrio</span><strong>0%</strong></div>
          <div style="display:flex;justify-content:space-between;"><span>Metal</span><strong>0%</strong></div>
        </div>
      </article>
    </section>
  `;
}

function renderReportPage(page) {
  return `
    <section class="content-grid">
      <article class="admin-card span-5">
        <div class="card-title-row"><h2>Parametros del reporte</h2></div>
        <div class="form-grid">
          <label><span class="form-label">Nombre</span><input class="form-control" value="Reporte mensual de residuos"></label>
          <label><span class="form-label">Formato</span><select class="form-select"><option>PDF</option><option>Excel</option><option>CSV</option></select></label>
          <label class="field-full"><span class="form-label">Notas</span><textarea class="form-textarea" placeholder="Observaciones internas..."></textarea></label>
          <button class="btn-greenup field-full" type="button"><span class="material-symbols-outlined">save</span>Guardar configuracion</button>
        </div>
      </article>
      ${renderTable(page.table).replace("span-12", "span-7")}
    </section>
  `;
}

function renderProfilePage() {
  return `
    <section class="content-grid">
      <article class="admin-card span-6">
        <div class="card-title-row"><h2>Datos de la recicladora</h2></div>
        <div class="form-grid">
          <label class="field-full"><span class="form-label">Nombre de empresa</span><input class="form-control" data-profile-field="nombre_empresa" value="Cargando..."></label>
          <label><span class="form-label">NIT</span><input class="form-control" data-profile-field="nit_empresa" value="Cargando..."></label>
          <label><span class="form-label">Telefono</span><input class="form-control" data-profile-field="telefono_empresa" value="Cargando..."></label>
          <label class="field-full"><span class="form-label">Direccion</span><input class="form-control" data-profile-field="direccion_empresa" value="Cargando..."></label>
        </div>
      </article>
      <article class="admin-card span-6">
        <div class="card-title-row"><h2>Responsable</h2></div>
        <div class="form-grid">
          <label class="field-full"><span class="form-label">Administrador</span><input class="form-control" data-profile-field="administrador" value="Cargando..."></label>
          <label><span class="form-label">Correo</span><input class="form-control" data-profile-field="correo" value="Cargando..."></label>
          <label><span class="form-label">Usuario</span><input class="form-control" data-profile-field="usuario" value="Cargando..."></label>
          <button class="btn-greenup field-full" type="button"><span class="material-symbols-outlined">save</span>Guardar perfil</button>
        </div>
      </article>
    </section>
  `;
}

function renderSettingsPage() {
  return `
    <section class="content-grid">
      <article class="admin-card span-6">
        <div class="card-title-row"><h2>Seguridad</h2></div>
        <div class="form-grid">
          <label class="field-full"><span class="form-label">Nueva contrasena</span><input class="form-control" type="password" placeholder="Minimo 8 caracteres"></label>
          <label class="field-full"><span class="form-label">Confirmar contrasena</span><input class="form-control" type="password" placeholder="Repite la contrasena"></label>
          <button class="btn-greenup field-full" type="button"><span class="material-symbols-outlined">lock_reset</span>Actualizar seguridad</button>
        </div>
      </article>
      <article class="admin-card span-6">
        <div class="card-title-row"><h2>Preferencias</h2></div>
        <div class="stack-list">
          <label class="switch-row"><input type="checkbox" checked> Alertas de rutas y contenedores</label>
          <label class="switch-row"><input type="checkbox" checked> Envio automatico de reportes</label>
          <label class="switch-row"><input type="checkbox"> Modo revision para registros nuevos</label>
          <button class="btn-greenup" type="button"><span class="material-symbols-outlined">save</span>Guardar configuracion</button>
        </div>
      </article>
    </section>
  `;
}

function renderContent(page) {
  if (page.type === "panel") return renderPanel(page);
  if (page.type === "map") return renderMapAndRoutes(page);
  if (page.type === "stats") return renderStatsPage();
  if (page.type === "report") return renderReportPage(page);
  if (page.type === "profile") return renderProfilePage();
  if (page.type === "settings") return renderSettingsPage();

  return `<section class="content-grid">${renderTable(page.table)}</section>`;
}

function renderBottomNav(current) {
  return `
    <nav class="mobile-bottom-nav" aria-label="Botones principales">
      ${mobileBottomNav.map((item) => `
        <a class="bottom-link${isActive(current, item.href)}" href="${item.href}">
          <span class="material-symbols-outlined">${item.icon}</span>
          <span>${item.label}</span>
        </a>
      `).join("")}
    </nav>
  `;
}

function renderModals() {
  return `
    <div class="gu-modal-backdrop" id="modalNotificaciones" aria-hidden="true">
      <section class="gu-modal" role="dialog" aria-modal="true" aria-labelledby="notificacionesTitulo">
        <div class="card-title-row">
          <h2 id="notificacionesTitulo">Notificaciones</h2>
          <button class="btn-icon" type="button" onclick="cerrarModal('modalNotificaciones')" aria-label="Cerrar">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        ${renderEmptyState("Sin notificaciones", "No tienes notificaciones nuevas por ahora.")}
      </section>
    </div>

    <div class="gu-modal-backdrop" id="modalFaq" aria-hidden="true">
      <section class="gu-modal" role="dialog" aria-modal="true" aria-labelledby="faqTitulo">
        <div class="card-title-row">
          <h2 id="faqTitulo">Nueva pregunta</h2>
          <button class="btn-icon" type="button" onclick="cerrarModal('modalFaq')" aria-label="Cerrar">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <form class="form-grid" id="formFaq">
          <label class="field-full"><span class="form-label">Pregunta</span><input class="form-control" name="pregunta" required></label>
          <label class="field-full"><span class="form-label">Respuesta</span><textarea class="form-textarea" name="respuesta" required></textarea></label>
          <label><span class="form-label">Categoria</span><input class="form-control" name="categoria" placeholder="Reciclaje"></label>
          <label><span class="form-label">Orden</span><input class="form-control" name="orden" type="number" min="0" value="0"></label>
          <button class="btn-greenup field-full" type="submit"><span class="material-symbols-outlined">save</span>Guardar pregunta</button>
        </form>
      </section>
    </div>
  `;
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
  abrirModal("modalNotificaciones");
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

async function fetchJson(endpoint, options = {}) {
  const response = await fetch(`${getApiBase()}${endpoint}`, {
    headers: getSessionHeaders(),
    ...options,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.mensaje || "No se pudo cargar la informacion");
  return data;
}

function formatKg(value) {
  const number = Number(value) || 0;
  return `${number.toLocaleString("es-CO", { maximumFractionDigits: 2 })} kg`;
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
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

function updateDashboard(data) {
  setText('[data-summary-label="Hoy"]', formatKg(data.material_recuperado_kg));
  setText('[data-summary-label="En ruta"]', `${Number(data.cargas_activas) || 0} cargas`);
  setText('[data-metric-label="Material recuperado"]', formatKg(data.material_recuperado_kg));
  setText('[data-metric-label="Cargas activas"]', Number(data.cargas_activas) || 0);
  setText('[data-metric-label="Recicladores"]', Number(data.recicladores) || 0);
  setText('[data-metric-label="Alertas"]', Number(data.alertas) || 0);
  setText('[data-metric-change="Material recuperado"]', data.material_recuperado_kg ? "Actualizado desde la base de datos" : "Sin registros");
  setText('[data-metric-change="Cargas activas"]', data.cargas_activas ? "Con actividad registrada" : "Sin rutas");
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
    const materiales = await fetchJson("/materiales");
    const activos = materiales.filter((item) => Number(item.id_estado) === 1);
    setText('[data-summary-label="Catalogados"]', `${materiales.length} tipos`);
    setText('[data-summary-label="Activos"]', `${activos.length} materiales`);
    rowsToTable("Materiales aceptados", materiales.map((item) => [
      `#MAT-${item.id_tipo_material}`,
      item.nombre || "Material",
      item.descripcion || "",
      `${item.puntos_por_kg || 0} / ${item.unidad || "kg"}`,
      Number(item.id_estado) === 1 ? "Activo" : "Inactivo",
    ]));
  }

  if (current === "recicladora_residuos.html" || current === "recicladora_registros_reciclaje.html") {
    const registros = await fetchJson("/reciclaje");
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
      setText('[data-summary-label="Pendientes"]', 0);
      rowsToTable("Entradas recientes", registros.map((item) => [
        `#RR-${item.id_registro}`,
        `Usuario ${item.id_usuario}`,
        `Material ${item.id_tipo_material}`,
        formatKg(item.cantidad),
        Number(item.id_estado) === 1 ? "Activo" : "Inactivo",
      ]));
    }
  }

  if (current === "recicladora_rutas_reciclaje.html" || current === "recicladora_puntos_reciclaje.html") {
    const dashboard = await fetchJson("/api/recicladoras/dashboard");

    if (current === "recicladora_rutas_reciclaje.html") {
      setText('[data-summary-label="Rutas activas"]', 0);
      setText('[data-summary-label="Puntos"]', Number(dashboard.puntos) || 0);
      rowsToTable("Rutas programadas", []);
    }

    if (current === "recicladora_puntos_reciclaje.html") {
      setText('[data-summary-label="Activos"]', `${Number(dashboard.puntos) || 0} puntos`);
      setText('[data-summary-label="Capacidad"]', "0%");
      rowsToTable("Puntos disponibles", []);
    }
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
  }

  if (current === "recicladora_novedades.html") {
    const novedades = await fetchJson("/novedades");
    const activas = novedades.filter((item) => Number(item.id_estado) === 1);
    setText('[data-summary-label="Activas"]', activas.length);
    setText('[data-summary-label="Programadas"]', 0);
    rowsToTable("Comunicaciones", activas.map((item) => [item.titulo, item.fecha_publicacion || "", "Aviso", "Activa"]));
  }
}

function startAutoRefresh() {
  refreshCurrentPage().catch((error) => console.warn(error.message));
  window.setInterval(() => {
    refreshCurrentPage().catch((error) => console.warn(error.message));
  }, 5000);
}

function bindModalForms() {
  document.querySelectorAll(".gu-modal-backdrop").forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) cerrarModal(modal.id);
    });
  });

  const formFaq = document.getElementById("formFaq");
  if (!formFaq) return;

  formFaq.addEventListener("submit", async (event) => {
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
}

async function hydrateRecicladoraProfile() {
  try {
    const response = await fetch(`${getApiBase()}/api/recicladoras/perfil`, {
      headers: getSessionHeaders(),
    });
    const profile = await response.json();

    if (!response.ok) {
      console.warn(profile.mensaje || "No se pudo cargar el perfil de recicladora.");
      return;
    }

    const values = {
      ...profile,
      administrador: `${profile.nombres || ""} ${profile.apellidos || ""}`.trim(),
    };

    document.querySelectorAll("[data-profile-field]").forEach((input) => {
      const key = input.getAttribute("data-profile-field");
      input.value = values[key] || "";
    });

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
    window.initGreenupMap();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  if (typeof protegerRol === "function") {
    protegerRol(2);
  }

  const current = getCurrentFile();
  const page = pages[current] || pages["recicladora_panel.html"];
  const user = getUser();
  const name = user.nombres || user.usuario || "Recicladora";

  document.body.className = "recicladora-app";
  document.body.innerHTML = `
    ${renderSidebar(current)}
    ${renderTopbar(current)}
    <main class="main-content">
      ${renderHero(page)}
      ${renderFilters(page)}
      ${renderContent(page)}
    </main>
    ${renderBottomNav(current)}
    ${renderModals()}
  `;

  const avatar = document.querySelector(".user-avatar");
  if (avatar) avatar.title = `Perfil: ${name}`;
  bindUserMenu();
  bindModalForms();

  if (page.type === "profile") {
    hydrateRecicladoraProfile();
  }

  if (page.type === "map") {
    initRecicladoraMap();
  }

  startAutoRefresh();
});
