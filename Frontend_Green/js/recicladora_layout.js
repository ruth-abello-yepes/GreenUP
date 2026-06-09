const primaryNav = [
  { href: "recicladora_panel.html", label: "Panel", fullLabel: "Panel de control", icon: "dashboard" },
  { href: "recicladora_materiales.html", label: "Materiales", fullLabel: "Gestionar materiales", icon: "inventory_2" },
  { href: "recicladora_residuos.html", label: "Residuos", fullLabel: "Gestionar residuos", icon: "delete_sweep" },
  { href: "recicladora_usuarios.html", label: "Usuarios", fullLabel: "Usuarios recicladores", icon: "groups" },
  { href: "recicladora_rutas_reciclaje.html", label: "Rutas", fullLabel: "Rutas y puntos", icon: "map" },
];

const secondaryNav = [
  { href: "recicladora_registros_reciclaje.html", label: "Registros", icon: "fact_check" },
  { href: "recicladora_puntos_reciclaje.html", label: "Puntos", icon: "location_on" },
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

const pages = {
  "recicladora_panel.html": {
    title: 'Panel de <strong>control</strong>',
    subtitle: "Supervisa materiales, residuos, rutas, usuarios y reportes desde un solo tablero de la recicladora.",
    stats: [
      ["Hoy", "1,284 kg", "muted"],
      ["En ruta", "42 cargas", "blue"],
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
      ["Material recuperado", "12.4 t", "+18% este mes", "recycling", ""],
      ["Cargas activas", "42", "8 rutas en curso", "local_shipping", "blue"],
      ["Recicladores", "128", "96 disponibles", "groups", ""],
      ["Alertas", "7", "3 prioridad alta", "notifications_active", "blue"],
    ],
    table: {
      title: "Operacion reciente",
      columns: ["ID", "Operacion", "Responsable", "Zona", "Estado", "Acciones"],
      rows: [
        ["#OP-2198", "Recoleccion mixta", "Equipo Verde 1", "Norte", "En transito", "blue"],
        ["#OP-2199", "Clasificacion PET", "Planta Central", "Centro", "En proceso", "warning"],
        ["#OP-2200", "Entrega a aliado", "Logistica Circular", "Sur", "Procesado", "success"],
      ],
    },
  },
  "recicladora_materiales.html": {
    title: 'Gestion de <strong>materiales</strong>',
    subtitle: "Administra el catalogo de materiales aceptados, categorias, puntos de referencia y disponibilidad operativa.",
    stats: [["Catalogados", "18 tipos", "muted"], ["Activos", "15 materiales", "blue"]],
    filters: { search: "Buscar material...", selects: [["Categoria", "Plastico", "Vidrio", "Metal", "Papel"], ["Estado", "Activo", "Revision", "Inactivo"]], action: "Nuevo material", icon: "add" },
    table: {
      title: "Materiales aceptados",
      columns: ["Codigo", "Material", "Categoria", "Puntos", "Estado", "Acciones"],
      rows: [
        ["#MAT-001", "Botellas PET", "Plastico", "10 / kg", "Activo", "success"],
        ["#MAT-002", "Vidrio", "Vidrio", "12 / kg", "Activo", "success"],
        ["#MAT-003", "Aluminio", "Metal", "15 / kg", "Activo", "success"],
        ["#MAT-004", "Carton", "Papel y carton", "8 / kg", "Revision", "warning"],
      ],
    },
  },
  "recicladora_residuos.html": {
    title: 'Gestion de <strong>residuos</strong>',
    subtitle: "Controla el flujo de residuos, estados de procesamiento y asignacion de cargas para la economia circular.",
    stats: [["Procesados", "1,284 kg", "muted"], ["En transito", "42 cargas", "blue"]],
    filters: { search: "Buscar residuo o punto de origen...", selects: [["Tipo de residuo", "Plastico PET", "Vidrio", "Aluminio", "Carton"], ["Estado", "Recolectado", "En proceso", "Procesado"]] },
    table: {
      title: "Residuos registrados",
      columns: ["ID seguimiento", "Tipo", "Peso", "Punto de origen", "Estado", "Acciones"],
      rows: [
        ["#GR-29384", "Plastico PET", "125.5 kg", "Centro Comercial Alamedas", "Recolectado", "blue"],
        ["#GR-29385", "Vidrio", "342.0 kg", "Zona Industrial Norte", "En proceso", "warning"],
        ["#GR-29386", "Aluminio", "88.2 kg", "Conjunto Las Palmeras", "Procesado", "success"],
        ["#GR-29387", "Carton", "210.7 kg", "Ruta comercial Occidente", "Recolectado", "blue"],
      ],
    },
  },
  "recicladora_usuarios.html": {
    title: 'Usuarios <strong>recicladores</strong>',
    subtitle: "Gestiona colaboradores, conductores, clasificadores y ciudadanos asociados a la operacion de la recicladora.",
    stats: [["Registrados", "128", "muted"], ["En ruta", "32 usuarios", "blue"]],
    filters: { search: "Buscar usuario, documento o zona...", selects: [["Rol", "Conductor", "Recolector", "Clasificador"], ["Disponibilidad", "Disponible", "En ruta", "Inactivo"]], action: "Nuevo usuario", icon: "person_add" },
    table: {
      title: "Equipo asociado",
      columns: ["ID", "Usuario", "Documento", "Zona", "Estado", "Acciones"],
      rows: [
        ["#UR-104", "Daniel Morales", "CC 1012456789", "Norte", "Disponible", "success"],
        ["#UR-118", "Laura Rojas", "CC 52888911", "Centro", "En ruta", "blue"],
        ["#UR-127", "Camilo Perez", "CC 1099345577", "Sur", "Capacitacion", "warning"],
      ],
    },
  },
  "recicladora_rutas_reciclaje.html": {
    title: 'Rutas y <strong>puntos</strong>',
    subtitle: "Organiza recorridos, puntos de acopio y disponibilidad de equipos para una recoleccion eficiente.",
    stats: [["Rutas activas", "24", "muted"], ["Puntos", "156", "blue"]],
    filters: { search: "Buscar ruta, punto o zona...", selects: [["Zona", "Norte", "Centro", "Sur"], ["Estado", "Activa", "Programada", "Finalizada"]], action: "Nueva ruta", icon: "add_location_alt" },
    type: "map",
    table: {
      title: "Rutas programadas",
      columns: ["Ruta", "Conductor", "Puntos", "Horario", "Estado", "Acciones"],
      rows: [
        ["#RT-A2", "Laura Rojas", "12 puntos", "07:00 - 12:00", "Activa", "blue"],
        ["#RT-B1", "Daniel Morales", "9 puntos", "13:00 - 17:00", "Programada", "warning"],
        ["#RT-C4", "Equipo Sur", "14 puntos", "08:00 - 15:00", "Activa", "success"],
      ],
    },
  },
  "recicladora_registros_reciclaje.html": {
    title: 'Registros de <strong>reciclaje</strong>',
    subtitle: "Consulta entradas de material, entregas registradas y trazabilidad de cada carga recibida.",
    stats: [["Registros", "384", "muted"], ["Pendientes", "12", "blue"]],
    filters: { search: "Buscar por codigo, usuario o material...", selects: [["Material", "PET", "Vidrio", "Carton"], ["Periodo", "Hoy", "Semana", "Mes"]] },
    table: {
      title: "Entradas recientes",
      columns: ["Registro", "Usuario", "Material", "Cantidad", "Estado", "Acciones"],
      rows: [
        ["#RR-3910", "Sofia Diaz", "PET", "18.4 kg", "Validado", "success"],
        ["#RR-3911", "Juan Perez", "Carton", "42.0 kg", "Revision", "warning"],
        ["#RR-3912", "Marta Ruiz", "Vidrio", "26.7 kg", "Validado", "success"],
      ],
    },
  },
  "recicladora_puntos_reciclaje.html": {
    title: 'Puntos de <strong>reciclaje</strong>',
    subtitle: "Administra sedes, puntos aliados, horarios y capacidad de recepcion de materiales.",
    stats: [["Activos", "9 puntos", "muted"], ["Capacidad", "72%", "blue"]],
    filters: { search: "Buscar punto o direccion...", selects: [["Zona", "Norte", "Centro", "Sur"], ["Estado", "Activo", "Cerrado", "Mantenimiento"]], action: "Nuevo punto", icon: "add_location" },
    type: "map",
    table: {
      title: "Puntos disponibles",
      columns: ["Punto", "Direccion", "Horario", "Responsable", "Estado", "Acciones"],
      rows: [
        ["Punto principal", "Cra. 14 #22-85", "8:00 AM - 5:30 PM", "RECICLA", "Activo", "success"],
        ["COORECIPROS LA 55", "200001 Valledupar", "7:00 AM - 5:30 PM", "COORECIPROS", "Activo", "success"],
        ["Coorrenacer", "Carrera 15 #22-40", "8:00 AM - 6:00 PM", "Coorrenacer", "Revision", "warning"],
      ],
    },
  },
  "recicladora_reportes.html": {
    title: 'Reportes <strong>ambientales</strong>',
    subtitle: "Genera informes operativos y ambientales listos para administracion, aliados o entidades de control.",
    stats: [["Generados", "36", "muted"], ["Pendientes", "4", "blue"]],
    filters: { selects: [["Tipo de reporte", "Operativo", "Ambiental", "Financiero"], ["Formato", "PDF", "Excel", "CSV"]], action: "Generar", icon: "download" },
    type: "report",
    table: {
      title: "Reportes recientes",
      columns: ["Reporte", "Fecha", "Formato", "Estado", "Acciones"],
      rows: [
        ["Residuos procesados", "08/06/2026", "PDF", "Listo", "success"],
        ["Rutas activas", "07/06/2026", "Excel", "Enviado", "blue"],
        ["Impacto ambiental", "06/06/2026", "PDF", "Revision", "warning"],
      ],
    },
  },
  "recicladora_estadisticas.html": {
    title: 'Estadisticas de <strong>impacto</strong>',
    subtitle: "Analiza recuperacion de materiales, eficiencia de rutas y composicion de residuos para tomar mejores decisiones.",
    stats: [["Recuperado", "12.4 t", "muted"], ["Crecimiento", "+18%", "blue"]],
    filters: { selects: [["Periodo", "Ultimos 30 dias", "Trimestre", "Ano"], ["Material", "Todos", "PET", "Vidrio"], ["Zona", "Todas", "Norte", "Centro", "Sur"]] },
    type: "stats",
  },
  "recicladora_contenido_educativo.html": {
    title: 'Contenido <strong>educativo</strong>',
    subtitle: "Publica recursos, guias y campanas para mejorar la separacion de residuos en la comunidad.",
    stats: [["Publicados", "18", "muted"], ["Borradores", "3", "blue"]],
    filters: { search: "Buscar recurso educativo...", selects: [["Tipo", "Articulo", "Video", "Infografia"], ["Estado", "Publicado", "Borrador"]], action: "Nuevo recurso", icon: "post_add" },
    table: {
      title: "Recursos educativos",
      columns: ["Recurso", "Tipo", "Categoria", "Estado", "Acciones"],
      rows: [
        ["Como separar residuos", "Articulo", "Educacion", "Publicado", "success"],
        ["Ruta del plastico PET", "Video", "Materiales", "Publicado", "success"],
        ["Guia de puntos limpios", "Infografia", "Ubicacion", "Borrador", "warning"],
      ],
    },
  },
  "recicladora_novedades.html": {
    title: 'Novedades y <strong>avisos</strong>',
    subtitle: "Gestiona eventos, alertas operativas y comunicaciones visibles para usuarios de la recicladora.",
    stats: [["Activas", "11", "muted"], ["Programadas", "5", "blue"]],
    filters: { search: "Buscar novedad...", selects: [["Categoria", "Evento", "Aviso", "Alerta"], ["Estado", "Activa", "Programada", "Inactiva"]], action: "Nueva novedad", icon: "campaign" },
    table: {
      title: "Comunicaciones",
      columns: ["Novedad", "Fecha", "Categoria", "Estado", "Acciones"],
      rows: [
        ["Jornada de reciclaje", "10/06/2026", "Evento", "Activa", "success"],
        ["Cambio de horario", "12/06/2026", "Aviso", "Programada", "blue"],
        ["Contenedor lleno", "Hoy", "Alerta", "Revision", "warning"],
      ],
    },
  },
  "recicladora_faq.html": {
    title: 'Preguntas <strong>frecuentes</strong>',
    subtitle: "Administra respuestas rapidas sobre horarios, materiales recibidos, rutas y puntos de atencion.",
    stats: [["Preguntas", "24", "muted"], ["Visibles", "21", "blue"]],
    filters: { search: "Buscar pregunta...", selects: [["Categoria", "Cuenta", "Reciclaje", "Puntos"], ["Estado", "Visible", "Oculta"]], action: "Nueva FAQ", icon: "add" },
    table: {
      title: "FAQ visibles",
      columns: ["Pregunta", "Categoria", "Orden", "Estado", "Acciones"],
      rows: [
        ["Como registro una entrega?", "Reciclaje", "1", "Visible", "success"],
        ["Que materiales reciben?", "Materiales", "2", "Visible", "success"],
        ["Como cambio mi horario?", "Cuenta", "3", "Revision", "warning"],
      ],
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
  const actionLinks = secondaryNav
    .map((item) => `
      <a class="icon-button${isActive(current, item.href)}" href="${item.href}" aria-label="${item.label}" title="${item.label}">
        <span class="material-symbols-outlined">${item.icon}</span>
      </a>
    `)
    .join("");

  const profileLinks = profileNav
    .map((item) => `
      <a href="${item.href}">
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
        ${actionLinks}
        <button class="icon-button" type="button" aria-label="Notificaciones" title="Notificaciones">
          <span class="material-symbols-outlined">notifications</span>
        </button>
        <div class="user-menu">
          <button class="user-avatar" type="button" aria-label="Perfil y configuracion" title="Perfil">
            <span class="material-symbols-outlined filled">person</span>
          </button>
          <div class="user-dropdown" id="userDropdown">
            ${profileLinks}
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
        <span class="summary-value">${value}</span>
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
    ? `<button class="btn-greenup" type="button"><span class="material-symbols-outlined">${page.filters.icon || "add"}</span>${page.filters.action}</button>`
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

  return `
    <article class="table-card span-12">
      <div class="card-title-row" style="padding: 22px 24px 0;">
        <h2>${table.title || "Registros"}</h2>
        <button class="btn-soft" type="button"><span class="material-symbols-outlined">download</span>Exportar</button>
      </div>
      <div class="table-responsive">
        <table class="admin-table">
          <thead><tr>${head}</tr></thead>
          <tbody>${body}</tbody>
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
        <p class="metric-value">${value}</p>
        <span class="metric-change">${change}</span>
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

function renderChart() {
  const values = [["Lun", 42], ["Mar", 68], ["Mie", 55], ["Jue", 80], ["Vie", 72], ["Sab", 94], ["Dom", 48]];
  return `
    <div class="chart-bars" aria-label="Grafico semanal">
      ${values.map(([day, value]) => `<div class="chart-bar"><span style="height:${value}%"></span><span>${day}</span></div>`).join("")}
    </div>
  `;
}

function renderAlerts() {
  const alerts = [
    ["route", "Ruta Norte", "Retrasada por alto trafico.", "Hace 10 min", "green"],
    ["warning", "Contenedor 404", "Reportado lleno.", "Hace 1 hora", "yellow"],
    ["task_alt", "Reporte semanal", "Generado correctamente.", "Hace 3 horas", "blue"],
  ];

  return `
    <div class="stack-list">
      ${alerts.map(([icon, title, text, time, variant]) => `
        <div class="stack-item">
          <span class="type-icon ${variant}"><span class="material-symbols-outlined">${icon}</span></span>
          <p><strong>${title}</strong> ${text}<br><small>${time}</small></p>
        </div>
      `).join("")}
    </div>
  `;
}

function renderMapAndRoutes(page) {
  return `
    <section class="content-grid">
      <article class="admin-card span-7">
        <div class="card-title-row"><h2>Mapa operativo</h2><button class="btn-soft" type="button">Ver agenda</button></div>
        <div class="map-placeholder"><span class="material-symbols-outlined">location_on</span> Mapa de rutas y puntos de reciclaje</div>
      </article>
      <article class="admin-card span-5">
        <div class="card-title-row"><h2>Capacidad destacada</h2></div>
        ${renderProgressList()}
      </article>
      ${renderTable(page.table)}
    </section>
  `;
}

function renderProgressList() {
  const rows = [["Ruta Norte A2", 84], ["Ruta Centro B1", 62], ["Ruta Sur C4", 38]];
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
        <div class="donut"><div class="donut-center"><div><span style="display:block;font-size:2rem;">84%</span><small>reciclable</small></div></div></div>
        <div class="stack-list" style="margin-top:22px;">
          <div style="display:flex;justify-content:space-between;"><span>Plastico</span><strong>44%</strong></div>
          <div style="display:flex;justify-content:space-between;"><span>Vidrio</span><strong>24%</strong></div>
          <div style="display:flex;justify-content:space-between;"><span>Metal</span><strong>16%</strong></div>
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
          <label class="field-full"><span class="form-label">Nombre de empresa</span><input class="form-control" value="GreenUp Recicladora"></label>
          <label><span class="form-label">NIT</span><input class="form-control" value="900123456-1"></label>
          <label><span class="form-label">Telefono</span><input class="form-control" value="6051234567"></label>
          <label class="field-full"><span class="form-label">Direccion</span><input class="form-control" value="Cra. 14 #22-85, Valledupar"></label>
        </div>
      </article>
      <article class="admin-card span-6">
        <div class="card-title-row"><h2>Responsable</h2></div>
        <div class="form-grid">
          <label class="field-full"><span class="form-label">Administrador</span><input class="form-control" value="Ruth Administradora"></label>
          <label><span class="form-label">Correo</span><input class="form-control" value="admin@greenup.com"></label>
          <label><span class="form-label">Zona</span><select class="form-select"><option>Norte</option><option>Centro</option><option>Sur</option></select></label>
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
      ${primaryNav.map((item) => `
        <a class="bottom-link${isActive(current, item.href)}" href="${item.href}">
          <span class="material-symbols-outlined">${item.icon}</span>
          <span>${item.label}</span>
        </a>
      `).join("")}
    </nav>
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
  `;

  const avatar = document.querySelector(".user-avatar");
  if (avatar) avatar.title = `Perfil: ${name}`;
  bindUserMenu();
});