/*
  Archivo: admin_sistema_layout.js

  Para que sirve:
  Construye todas las pantallas del Administrador del Sistema desde un solo
  lugar. Cada HTML solo indica el modulo con window.ADMIN_MODULE.

  Importante:
  - El administrador NO registra ciudadanos ni recicladoras.
  - Ciudadanos y recicladoras aparecen porque ya se registraron en sus pantallas.
  - El administrador consulta, filtra, exporta, activa o inactiva registros.
  - El mapa se actualiza automaticamente leyendo los puntos de Supabase.
*/

const ADMIN_API_BASE = typeof API_URL !== "undefined" ? API_URL : "http://127.0.0.1:5000";
const ADMIN_REFRESH_MS = 8000;
const ADMIN_HOME = "admin_panel.html";

let adminTableData = [];
let adminTableColumns = [];
let adminLastUserCount = null;
let adminLastPointCount = null;
let adminMonitor = null;
let adminHeroTimer = null;
let adminMap = null;
let adminMarkers = new Map();
let adminUserMarker = null;
let adminWatchId = null;

const adminPrimaryNav = [
  { href: "admin_panel.html", module: "panel", label: "Panel", icon: "dashboard" },
  { href: "admin_usuarios.html", module: "usuarios", label: "Usuarios", icon: "groups" },
  { href: "admin_mapa.html", module: "mapa", label: "Mapa", icon: "map" },
  { href: "admin_puntos_reciclaje.html", module: "puntos", label: "Puntos", icon: "location_on" },
  { href: "admin_reportes.html", module: "reportes", label: "Reportes", icon: "analytics" },
];

const adminSystemNav = [
  { href: "admin_roles.html", module: "roles", label: "Roles", icon: "admin_panel_settings" },
  { href: "admin_tipo_documento.html", module: "documentos", label: "Documentos", icon: "badge" },
  { href: "admin_materiales.html", module: "materiales", label: "Materiales", icon: "inventory_2" },
  { href: "admin_residuos.html", module: "residuos", label: "Residuos", icon: "delete_sweep" },
  { href: "admin_registros_reciclaje.html", module: "reciclaje", label: "Registros", icon: "fact_check" },
];

const adminContentNav = [
  { href: "admin_novedades.html", module: "novedades", label: "Noticias", icon: "newspaper" },
  { href: "admin_contenido_educativo.html", module: "contenido", label: "Contenido", icon: "menu_book" },
  { href: "admin_faq.html", module: "faq", label: "FAQ", icon: "quiz" },
  { href: "admin_estadisticas.html", module: "estadisticas", label: "Estadisticas", icon: "monitoring" },
  { href: "admin_perfil.html", module: "perfil", label: "Perfil", icon: "person" },
  { href: "admin_configuracion.html", module: "configuracion", label: "Config.", icon: "settings" },
];

const adminPages = {
  panel: {
    title: 'Centro de <strong>control</strong>',
    subtitle: "Supervisa usuarios, recicladoras, puntos ecologicos, noticias y reportes generales del sistema GreenUp.",
    eyebrow: "Administrador del sistema",
  },
  usuarios: {
    title: 'Usuarios del <strong>sistema</strong>',
    subtitle: "Consulta ciudadanos y administradores de recicladora registrados. Aqui no se crean cuentas; solo se administran estados.",
    eyebrow: "Gestion de cuentas",
  },
  roles: {
    title: 'Roles y <strong>permisos</strong>',
    subtitle: "Administra los roles base que controlan el acceso dentro del sistema.",
    eyebrow: "Configuracion",
  },
  documentos: {
    title: 'Tipos de <strong>documento</strong>',
    subtitle: "Mantiene actualizado el catalogo de documentos usados en los registros.",
    eyebrow: "Catalogos",
  },
  materiales: {
    title: 'Materiales <strong>reciclables</strong>',
    subtitle: "Gestiona el catalogo de materiales, unidades y puntos por kilogramo.",
    eyebrow: "Catalogos ambientales",
  },
  residuos: {
    title: 'Tipos de <strong>residuo</strong>',
    subtitle: "Administra la clasificacion de residuos y colores de contenedor.",
    eyebrow: "Catalogos ambientales",
  },
  puntos: {
    title: 'Puntos <strong>ecologicos</strong>',
    subtitle: "Revisa los puntos registrados y controla si estan activos o inactivos.",
    eyebrow: "Cobertura territorial",
  },
  mapa: {
    title: 'Mapa en <strong>tiempo real</strong>',
    subtitle: "Visualiza puntos ecologicos registrados y la ubicacion actual del administrador si el navegador lo permite.",
    eyebrow: "Geolocalizacion",
  },
  reciclaje: {
    title: 'Registros de <strong>reciclaje</strong>',
    subtitle: "Consulta trazabilidad de reciclaje reportada en el sistema.",
    eyebrow: "Operacion",
  },
  reportes: {
    title: 'Reportes del <strong>sistema</strong>',
    subtitle: "Exporta datos reales de reciclaje y genera soportes para analisis administrativo.",
    eyebrow: "Analitica",
  },
  novedades: {
    title: 'Noticias y <strong>novedades</strong>',
    subtitle: "Publica y administra comunicaciones visibles para la comunidad GreenUp.",
    eyebrow: "Comunicaciones",
  },
  faq: {
    title: 'Preguntas <strong>frecuentes</strong>',
    subtitle: "Administra respuestas utiles para usuarios del sistema.",
    eyebrow: "Soporte",
  },
  estadisticas: {
    title: 'Estadisticas de <strong>impacto</strong>',
    subtitle: "Observa indicadores generales de actividad y reciclaje.",
    eyebrow: "Indicadores",
  },
  contenido: {
    title: 'Contenido <strong>educativo</strong>',
    subtitle: "Crea recursos educativos que fortalecen la separacion y cultura ambiental.",
    eyebrow: "Educacion ambiental",
  },
  perfil: {
    title: 'Perfil del <strong>administrador</strong>',
    subtitle: "Consulta los datos de la sesion administrativa actual.",
    eyebrow: "Cuenta",
  },
  configuracion: {
    title: 'Configuracion del <strong>panel</strong>',
    subtitle: "Controla preferencias locales, notificaciones y herramientas de sesion.",
    eyebrow: "Preferencias",
  },
};

const adminHeroImageGroups = {
  panel: "control",
  usuarios: "usuarios",
  roles: "seguridad",
  documentos: "documentos",
  materiales: "materiales",
  residuos: "residuos",
  puntos: "puntos",
  mapa: "mapa",
  reciclaje: "reciclaje",
  reportes: "reportes",
  novedades: "noticias",
  faq: "soporte",
  estadisticas: "estadisticas",
  contenido: "educacion",
  perfil: "perfil",
  configuracion: "configuracion",
};

document.addEventListener("DOMContentLoaded", iniciarAdminSistema);

async function iniciarAdminSistema() {
  protegerAdminSistema();
  pintarEstructuraBase();
  await cargarModuloAdmin();
  iniciarMonitoreoAdmin();
}

function moduloActual() {
  return window.ADMIN_MODULE || "panel";
}

function obtenerAdminActual() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "{}");
  } catch {
    return {};
  }
}

function protegerAdminSistema() {
  const admin = obtenerAdminActual();
  if (!admin.id_usuario || Number(admin.id_rol) !== 1) {
    window.location.href = "../public/admin_login.html";
  }
}

function headersAdmin() {
  const admin = obtenerAdminActual();
  return {
    "Content-Type": "application/json",
    "id-usuario": admin.id_usuario,
    "id-rol": admin.id_rol,
  };
}

async function apiAdmin(ruta, opciones = {}) {
  const respuesta = await fetch(ADMIN_API_BASE + ruta, {
    ...opciones,
    headers: { ...headersAdmin(), ...(opciones.headers || {}) },
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(datos.mensaje || datos.error || "No se pudo conectar con " + ruta);
  }
  return datos;
}

function pintarEstructuraBase() {
  const actual = moduloActual();
  const admin = obtenerAdminActual();
  document.body.classList.add("admin-app");
  document.body.innerHTML = `
    <aside class="app-sidebar">
      ${renderBrand()}
      ${renderNavGroup("Principal", adminPrimaryNav, actual)}
      ${renderNavGroup("Sistema", adminSystemNav, actual)}
      ${renderNavGroup("Contenido", adminContentNav, actual)}
      <div class="sidebar-actions">
        <button class="logout-link" type="button" onclick="cerrarSesionAdminSistema()">
          <span class="material-symbols-outlined">logout</span>
          Cerrar sesion
        </button>
      </div>
    </aside>

    <header class="app-topbar">
      <div class="mobile-brand">${renderBrand()}</div>
      <div class="topbar-search">
        <label class="search-shell" for="admin-search">
          <span class="material-symbols-outlined">search</span>
          <input id="admin-search" type="search" placeholder="Buscar en la tabla actual..." />
        </label>
      </div>
      <div class="topbar-actions">
        <button class="icon-button" type="button" title="Actualizar" onclick="cargarModuloAdmin()">
          <span class="material-symbols-outlined">refresh</span>
        </button>
        <button class="icon-button" type="button" title="Notificaciones" onclick="pedirPermisoNotificaciones()">
          <span class="material-symbols-outlined">notifications</span>
        </button>
        <div class="user-menu">
          <span class="user-avatar">${iniciales(admin.nombres || admin.usuario || "A")}</span>
          <span class="user-meta">
            <strong>${limpiar(admin.usuario || "admin")}</strong>
            <span>Administrador</span>
          </span>
        </div>
      </div>
    </header>

    <main class="admin-main">
      <section id="admin-hero"></section>
      <section id="admin-content"></section>
    </main>

    <nav class="mobile-bottom-nav">
      ${adminPrimaryNav.map((item) => `
        <a class="${item.module === actual ? "active" : ""}" href="${item.href}" title="${item.label}">
          <span class="material-symbols-outlined">${item.icon}</span>
        </a>
      `).join("")}
    </nav>
    <div id="toast-stack" class="toast-stack"></div>
  `;

  document.getElementById("admin-search").addEventListener("input", filtrarTablaActual);
}

function renderBrand() {
  return `
    <a class="brand-lockup" href="${ADMIN_HOME}" aria-label="Ir al panel GreenUp">
      <span class="brand-logo"><span class="material-symbols-outlined filled">recycling</span></span>
      <span>
        <span class="brand-name">Green<strong>Up</strong></span>
        <span class="brand-kicker">Admin sistema</span>
      </span>
    </a>
  `;
}

function renderNavGroup(titulo, items, actual) {
  return `
    <nav class="sidebar-nav" aria-label="${titulo}">
      <p class="sidebar-section-title">${titulo}</p>
      ${items.map((item) => `
        <a class="sidebar-link ${item.module === actual ? "active" : ""}" href="${item.href}">
          <span class="material-symbols-outlined">${item.icon}</span>
          ${item.label}
        </a>
      `).join("")}
    </nav>
  `;
}

function pintarHero(extraStats = []) {
  const pagina = adminPages[moduloActual()] || adminPages.panel;
  const stats = extraStats.slice(0, 2);
  document.getElementById("admin-hero").innerHTML = `
    <article class="page-hero">
      <div class="hero-copy">
        <span class="hero-eyebrow"><span class="material-symbols-outlined">verified_user</span>${pagina.eyebrow}</span>
        <h1>${pagina.title}</h1>
        <p>${pagina.subtitle}</p>
        ${stats.length ? `<div class="hero-stats">${stats.map((s, index) => `
          <div class="summary-card ${index === 1 ? "blue" : ""}">
            <span class="summary-label">${s[0]}</span>
            <span class="summary-value">${s[1]}</span>
          </div>
        `).join("")}</div>` : ""}
      </div>
      <div class="hero-visual" aria-hidden="true"></div>
    </article>
  `;
}

async function cargarModuloAdmin() {
  const cargadores = {
    panel: cargarPanel,
    usuarios: cargarUsuarios,
    roles: () => cargarCrud("roles"),
    documentos: () => cargarCrud("documentos"),
    materiales: () => cargarCrud("materiales"),
    residuos: () => cargarCrud("residuos"),
    puntos: cargarPuntos,
    mapa: cargarMapa,
    reciclaje: cargarReciclaje,
    reportes: cargarReportes,
    novedades: cargarNovedades,
    faq: cargarFaq,
    estadisticas: cargarEstadisticas,
    contenido: cargarContenido,
    perfil: cargarPerfil,
    configuracion: cargarConfiguracion,
  };

  try {
    await (cargadores[moduloActual()] || cargadores.panel)();
  } catch (error) {
    pintarHero();
    document.getElementById("admin-content").innerHTML = renderEmpty(
      "warning",
      "No se pudo cargar este modulo.",
      error.message,
    );
    mostrarToast("Error", error.message);
  }
}

async function cargarPanel() {
  const [usuarios, ciudadanos, recicladoras, puntos, reciclajes, novedades, estadisticas] =
    await Promise.all([
      apiAdmin("/api/usuarios/listar"),
      apiAdmin("/api/usuarios/ciudadanos"),
      apiAdmin("/api/recicladoras/listar"),
      apiAdmin("/ubicaciones"),
      apiAdmin("/reciclaje"),
      apiAdmin("/novedades"),
      apiAdmin("/estadisticas"),
    ]);

  pintarHero([
    ["Usuarios", String(usuarios.length)],
    ["Puntos", String(puntos.length)],
  ]);

  document.getElementById("admin-content").innerHTML = `
    <section class="metrics-grid">
      ${metric("groups", usuarios.length, "Usuarios registrados", "Ciudadanos y recicladoras")}
      ${metric("person", ciudadanos.length, "Ciudadanos", "Cuentas creadas desde ciudadano", "blue")}
      ${metric("storefront", recicladoras.length, "Recicladoras", "Administradores de recicladora")}
      ${metric("recycling", estadisticas.total_reciclajes || 0, "Registros reciclaje", `${estadisticas.total_cantidad || 0} kg reportados`, "blue")}
    </section>
    <section class="content-grid">
      <article class="data-card">
        <div class="card-title-row">
          <div>
            <h2>Ultimos usuarios registrados</h2>
            <p>Datos reales cargados desde Supabase.</p>
          </div>
          <a class="ghost-button" href="admin_usuarios.html">Ver usuarios</a>
        </div>
        ${tablaDatos(
          ["ID", "Nombre", "Usuario", "Rol", "Estado"],
          usuarios.slice(0, 8).map((u) => [
            u.id_usuario,
            `${u.nombres || ""} ${u.apellidos || ""}`,
            u.usuario,
            nombreRol(u.id_rol),
            estadoHtml(u.id_estado),
          ]),
        )}
      </article>
      <article class="module-card">
        <div class="card-title-row">
          <div>
            <h2>Noticias recientes</h2>
            <p>Comunicaciones publicadas por administracion.</p>
          </div>
          <a class="ghost-button" href="admin_novedades.html">Gestionar</a>
        </div>
        ${renderNewsList(novedades.slice(0, 3))}
      </article>
    </section>
  `;
}

async function cargarUsuarios() {
  const [ciudadanos, recicladoras, todos] = await Promise.all([
    apiAdmin("/api/usuarios/ciudadanos"),
    apiAdmin("/api/recicladoras/listar"),
    apiAdmin("/api/usuarios/listar"),
  ]);

  pintarHero([
    ["Ciudadanos", String(ciudadanos.length)],
    ["Recicladoras", String(recicladoras.length)],
  ]);

  const filas = [
    ...ciudadanos.map((u) => ({ ...u, tipo_admin: "Ciudadano" })),
    ...recicladoras.map((u) => ({ ...u, tipo_admin: "Recicladora" })),
  ];

  adminTableColumns = ["Tipo", "Nombre", "Usuario", "Correo", "Documento", "Estado"];
  adminTableData = filas.map((u) => ({
    raw: u,
    values: [
      `<span class="type-pill ${u.tipo_admin === "Recicladora" ? "blue" : "green"}">${u.tipo_admin}</span>`,
      `${limpiar(u.nombres)} ${limpiar(u.apellidos)}`,
      limpiar(u.usuario),
      limpiar(u.correo),
      limpiar(u.numero_documento),
      estadoHtml(u.id_estado),
    ],
    actions: renderEstadoUsuario(u),
  }));

  document.getElementById("admin-content").innerHTML = `
    ${toolbarUsuarios(todos.length)}
    <article class="data-card">
      <div class="card-title-row">
        <div>
          <h2>Tabla de usuarios registrados</h2>
          <p>El administrador gestiona estados. Los registros nacen en ciudadano o recicladora.</p>
        </div>
        <button class="ghost-button" type="button" onclick="exportarTablaCSV('usuarios_greenup.csv')">
          <span class="material-symbols-outlined">download</span> Exportar
        </button>
      </div>
      <div id="tabla-admin"></div>
    </article>
  `;
  pintarTablaActual();
}

function toolbarUsuarios(total) {
  return `
    <div class="toolbar">
      <span class="type-pill blue">${total} cuentas en total</span>
      <select id="filtro-tipo-usuario" onchange="filtrarTablaActual()">
        <option value="">Todos los tipos</option>
        <option value="Ciudadano">Ciudadanos</option>
        <option value="Recicladora">Recicladoras</option>
      </select>
      <select id="filtro-estado" onchange="filtrarTablaActual()">
        <option value="">Todos los estados</option>
        <option value="Activo">Activos</option>
        <option value="Inactivo">Inactivos</option>
      </select>
      <button class="ghost-button" type="button" onclick="cargarUsuarios()">
        <span class="material-symbols-outlined">sync</span> Actualizar tabla
      </button>
    </div>
  `;
}

function renderEstadoUsuario(usuario) {
  const activo = Number(usuario.id_estado) === 1;
  const siguiente = activo ? 2 : 1;
  const texto = activo ? "Inactivar" : "Activar";
  const clase = activo ? "danger-button" : "";
  return `
    <button class="small-button ${clase}" type="button" onclick="cambiarEstadoUsuario(${usuario.id_usuario}, ${siguiente})">
      ${texto}
    </button>
  `;
}

async function cambiarEstadoUsuario(idUsuario, idEstado) {
  await apiAdmin(`/api/usuarios/estado/${idUsuario}`, {
    method: "PUT",
    body: JSON.stringify({ id_estado: idEstado }),
  });
  mostrarToast("Usuario actualizado", "El estado de la cuenta cambio correctamente.");
  await cargarUsuarios();
}

const crudConfig = {
  roles: {
    titulo: "Roles del sistema",
    listar: "/api/roles/listar",
    crear: "/api/roles/registrar",
    buscar: "/api/roles/buscar/",
    actualizar: "/api/roles/actualizar/",
    inhabilitar: "/api/roles/inhabilitar/",
    id: "id_rol",
    columnas: ["ID", "Nombre", "Descripcion", "Estado"],
    campos: [
      { id: "nombre", label: "Nombre" },
      { id: "descripcion", label: "Descripcion", full: true },
      { id: "id_estado", label: "Estado", type: "select", options: [[1, "Activo"], [2, "Inactivo"]] },
    ],
    map: (r) => [r.id_rol, r.nombre, r.descripcion, estadoHtml(r.id_estado)],
  },
  documentos: {
    titulo: "Tipos de documento",
    listar: "/api/tipo-documento/listar",
    crear: "/api/tipo-documento/registrar",
    buscar: "/api/tipo-documento/buscar/",
    actualizar: "/api/tipo-documento/actualizar/",
    inhabilitar: "/api/tipo-documento/inhabilitar/",
    id: "id_tipo_documento",
    columnas: ["ID", "Descripcion", "Estado"],
    campos: [
      { id: "descripcion", label: "Descripcion", full: true },
      { id: "id_estado", label: "Estado", type: "select", options: [[1, "Activo"], [2, "Inactivo"]] },
    ],
    map: (r) => [r.id_tipo_documento, r.descripcion, estadoHtml(r.id_estado)],
  },
  materiales: {
    titulo: "Materiales reciclables",
    listar: "/materiales",
    crear: "/materiales",
    buscar: "/materiales/",
    actualizar: "/materiales/",
    estado: "/materiales/:id/estado",
    id: "id_tipo_material",
    columnas: ["ID", "Nombre", "Unidad", "Puntos/kg", "Residuo", "Estado"],
    campos: [
      { id: "nombre", label: "Nombre" },
      { id: "unidad", label: "Unidad", value: "kg" },
      { id: "puntos_por_kg", label: "Puntos por kg", type: "number" },
      { id: "id_tipo_residuo", label: "ID tipo residuo", type: "number" },
      { id: "descripcion", label: "Descripcion", type: "textarea", full: true },
    ],
    map: (r) => [r.id_tipo_material, r.nombre, r.unidad, r.puntos_por_kg, r.id_tipo_residuo, estadoHtml(r.id_estado)],
  },
  residuos: {
    titulo: "Tipos de residuo",
    listar: "/tipos-residuo",
    crear: "/tipos-residuo",
    buscar: "/tipos-residuo/",
    actualizar: "/tipos-residuo/",
    estado: "/tipos-residuo/:id/estado",
    id: "id_tipo_residuo",
    columnas: ["ID", "Nombre", "Color", "Descripcion", "Estado"],
    campos: [
      { id: "nombre", label: "Nombre" },
      { id: "color_contenedor", label: "Color contenedor" },
      { id: "descripcion", label: "Descripcion", type: "textarea", full: true },
    ],
    map: (r) => [r.id_tipo_residuo, r.nombre, r.color_contenedor, r.descripcion, estadoHtml(r.id_estado)],
  },
};

async function cargarCrud(nombre) {
  const config = crudConfig[nombre];
  const datos = await apiAdmin(config.listar);
  pintarHero([
    ["Registros", String(datos.length)],
    ["Activos", String(datos.filter((x) => Number(x.id_estado) === 1).length)],
  ]);

  adminTableColumns = config.columnas;
  adminTableData = datos.map((item) => ({
    raw: item,
    values: config.map(item).map((v) => limpiarHtmlPermitido(v)),
    actions: `
      <button class="small-button" type="button" onclick="editarCrud('${nombre}', ${item[config.id]})">Editar</button>
      <button class="small-button danger-button" type="button" onclick="inhabilitarCrud('${nombre}', ${item[config.id]})">Inactivar</button>
    `,
  }));

  document.getElementById("admin-content").innerHTML = `
    <section class="content-grid catalog-layout">
      <article class="admin-card">
        <div class="card-title-row">
          <div>
            <h2>Crear ${config.titulo}</h2>
            <p>Catalogo administrado por el sistema.</p>
          </div>
        </div>
        ${renderForm(`form-${nombre}`, config.campos, `guardarCrud('${nombre}', event)`, "Guardar")}
      </article>
      <article class="data-card">
        <div class="card-title-row">
          <div>
            <h2>${config.titulo}</h2>
            <p>Registros guardados en Supabase.</p>
          </div>
          <button class="ghost-button" type="button" onclick="exportarTablaCSV('${nombre}_greenup.csv')">
            <span class="material-symbols-outlined">download</span> Exportar
          </button>
        </div>
        <div id="tabla-admin"></div>
      </article>
    </section>
  `;
  pintarTablaActual();
}

async function guardarCrud(nombre, evento) {
  evento.preventDefault();
  const config = crudConfig[nombre];
  const payload = leerFormulario(config.campos);
  await apiAdmin(config.crear, { method: "POST", body: JSON.stringify(payload) });
  mostrarToast("Registro guardado", "El catalogo fue actualizado correctamente.");
  await cargarCrud(nombre);
}

async function editarCrud(nombre, id) {
  const config = crudConfig[nombre];
  const actual = await apiAdmin(config.buscar + id);
  const payload = {};
  for (const campo of config.campos) {
    const nuevo = prompt(campo.label, actual[campo.id] ?? "");
    if (nuevo === null) return;
    payload[campo.id] = normalizarValor(campo, nuevo);
  }
  await apiAdmin(config.actualizar + id, { method: "PUT", body: JSON.stringify(payload) });
  mostrarToast("Registro actualizado", "Los cambios quedaron guardados.");
  await cargarCrud(nombre);
}

async function inhabilitarCrud(nombre, id) {
  const config = crudConfig[nombre];
  if (!confirm("Deseas inactivar este registro?")) return;
  if (config.inhabilitar) {
    await apiAdmin(config.inhabilitar + id, { method: "DELETE" });
  } else {
    await apiAdmin(config.estado.replace(":id", id), {
      method: "PUT",
      body: JSON.stringify({ id_estado: 2 }),
    });
  }
  mostrarToast("Registro inactivado", "El estado fue actualizado.");
  await cargarCrud(nombre);
}

async function cargarPuntos() {
  const puntos = await apiAdmin("/ubicaciones");
  pintarHero([
    ["Puntos", String(puntos.length)],
    ["Activos", String(puntos.filter((p) => Number(p.id_estado) === 1).length)],
  ]);

  adminTableColumns = ["ID", "Nombre", "Direccion", "Horario", "Telefono", "Responsable", "Estado"];
  adminTableData = puntos.map((p) => ({
    raw: p,
    values: [
      p.id_punto,
      limpiar(p.nombre),
      limpiar(p.direccion),
      limpiar(p.horario),
      limpiar(p.telefono),
      limpiar(p.responsable),
      estadoHtml(p.id_estado),
    ],
    actions: renderEstadoPunto(p),
  }));

  document.getElementById("admin-content").innerHTML = `
    <div class="toolbar">
      <a class="primary-button" href="admin_mapa.html">
        <span class="material-symbols-outlined">map</span> Ver mapa
      </a>
      <button class="ghost-button" type="button" onclick="cargarPuntos()">
        <span class="material-symbols-outlined">sync</span> Actualizar puntos
      </button>
    </div>
    <article class="data-card">
      <div class="card-title-row">
        <div>
          <h2>Puntos ecologicos registrados</h2>
          <p>El administrador controla el estado de los puntos existentes.</p>
        </div>
        <button class="ghost-button" type="button" onclick="exportarTablaCSV('puntos_greenup.csv')">
          <span class="material-symbols-outlined">download</span> Exportar
        </button>
      </div>
      <div id="tabla-admin"></div>
    </article>
  `;
  pintarTablaActual();
}

function renderEstadoPunto(punto) {
  const activo = Number(punto.id_estado) === 1;
  const siguiente = activo ? 2 : 1;
  return `
    <button class="small-button ${activo ? "danger-button" : ""}" type="button" onclick="cambiarEstadoPunto(${punto.id_punto}, ${siguiente})">
      ${activo ? "Inactivar" : "Activar"}
    </button>
  `;
}

async function cambiarEstadoPunto(idPunto, idEstado) {
  await apiAdmin(`/ubicaciones/${idPunto}/estado`, {
    method: "PUT",
    body: JSON.stringify({ id_estado: idEstado }),
  });
  mostrarToast("Punto actualizado", "El estado del punto cambio correctamente.");
  await cargarPuntos();
}

async function cargarMapa() {
  const puntos = await apiAdmin("/ubicaciones");
  pintarHero([
    ["Puntos", String(puntos.length)],
    ["Actualizacion", "8s"],
  ]);
  document.getElementById("admin-content").innerHTML = `
    <div class="toolbar">
      <button class="primary-button" type="button" onclick="actualizarPuntosMapa(true)">
        <span class="material-symbols-outlined">sync</span> Actualizar mapa
      </button>
      <button class="ghost-button" type="button" onclick="centrarUbicacionAdmin()">
        <span class="material-symbols-outlined">my_location</span> Mi ubicacion
      </button>
      <a class="ghost-button" href="admin_puntos_reciclaje.html">
        <span class="material-symbols-outlined">table</span> Ver tabla
      </a>
    </div>
    <section class="map-shell"><div id="admin-map"></div></section>
  `;
  await asegurarLeaflet();
  iniciarMapaLeaflet();
  await pintarPuntosMapa(puntos, true);
  iniciarGeolocalizacionAdmin();
}

function iniciarMapaLeaflet() {
  if (adminMap) {
    adminMap.remove();
    adminMarkers.clear();
  }
  adminMap = L.map("admin-map", { zoomControl: true }).setView([10.4631, -73.2532], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap",
  }).addTo(adminMap);
}

async function actualizarPuntosMapa(manual = false) {
  const puntos = await apiAdmin("/ubicaciones");
  await pintarPuntosMapa(puntos, false);
  if (manual) mostrarToast("Mapa actualizado", "Los puntos fueron consultados nuevamente.");
}

async function pintarPuntosMapa(puntos, ajustarVista = false) {
  if (!adminMap) return;
  const bounds = [];

  if (adminLastPointCount !== null && puntos.length > adminLastPointCount) {
    notificarAdmin("Nuevo punto ecologico", "El mapa del administrador ya fue actualizado.");
  }
  adminLastPointCount = puntos.length;

  for (const punto of puntos) {
    const coords = await coordenadasPunto(punto);
    if (!coords) continue;

    bounds.push([coords.lat, coords.lng]);
    const html = `
      <strong>${limpiar(punto.nombre)}</strong><br>
      ${limpiar(punto.direccion)}<br>
      ${estadoHtml(punto.id_estado)}
    `;

    if (adminMarkers.has(punto.id_punto)) {
      adminMarkers.get(punto.id_punto).setLatLng([coords.lat, coords.lng]).setPopupContent(html);
    } else {
      const marker = L.marker([coords.lat, coords.lng]).addTo(adminMap).bindPopup(html);
      adminMarkers.set(punto.id_punto, marker);
    }
  }

  if (ajustarVista && bounds.length) {
    adminMap.fitBounds(bounds, { padding: [40, 40] });
  }
}

async function coordenadasPunto(punto) {
  const lat = Number(punto.latitud);
  const lng = Number(punto.longitud);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };

  const clave = "greenup_geo_" + punto.id_punto;
  const guardado = localStorage.getItem(clave);
  if (guardado) return JSON.parse(guardado);

  if (!punto.direccion) return null;
  const consulta = encodeURIComponent(`${punto.direccion}, Valledupar, Colombia`);
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${consulta}`;
  const respuesta = await fetch(url);
  const datos = await respuesta.json();
  if (!datos.length) return null;

  const coords = { lat: Number(datos[0].lat), lng: Number(datos[0].lon) };
  localStorage.setItem(clave, JSON.stringify(coords));
  return coords;
}

function iniciarGeolocalizacionAdmin() {
  if (!navigator.geolocation || !adminMap) return;
  if (adminWatchId) navigator.geolocation.clearWatch(adminWatchId);

  adminWatchId = navigator.geolocation.watchPosition(
    (posicion) => {
      const coords = [posicion.coords.latitude, posicion.coords.longitude];
      if (!adminUserMarker) {
        adminUserMarker = L.circleMarker(coords, {
          radius: 9,
          color: "#065591",
          fillColor: "#0f6f2a",
          fillOpacity: 0.9,
        }).addTo(adminMap).bindPopup("Tu ubicacion actual");
      } else {
        adminUserMarker.setLatLng(coords);
      }
    },
    () => mostrarToast("Ubicacion", "No fue posible obtener tu ubicacion actual."),
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 },
  );
}

function centrarUbicacionAdmin() {
  if (adminUserMarker && adminMap) {
    adminMap.setView(adminUserMarker.getLatLng(), 16);
  } else {
    iniciarGeolocalizacionAdmin();
    mostrarToast("Ubicacion", "Solicitando ubicacion del navegador.");
  }
}

function asegurarLeaflet() {
  return new Promise((resolve, reject) => {
    if (window.L) return resolve();

    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("No se pudo cargar Leaflet."));
    document.head.appendChild(script);
  });
}

async function cargarReciclaje() {
  const datos = await apiAdmin("/reciclaje");
  pintarHero([
    ["Registros", String(datos.length)],
    ["Modulo", "Trazabilidad"],
  ]);
  adminTableColumns = ["ID", "Cantidad", "Usuario", "Material", "Punto", "Fecha", "Estado"];
  adminTableData = datos.map((r) => ({
    raw: r,
    values: [r.id_registro, r.cantidad, r.id_usuario, r.id_tipo_material, r.id_punto, limpiar(r.fecha_hora), estadoHtml(r.id_estado)],
    actions: `
      <button class="small-button danger-button" type="button" onclick="cambiarEstadoReciclaje(${r.id_registro}, 2)">Inactivar</button>
      <button class="small-button" type="button" onclick="cambiarEstadoReciclaje(${r.id_registro}, 1)">Activar</button>
    `,
  }));
  document.getElementById("admin-content").innerHTML = renderTableCard("Registros de reciclaje", "Datos reportados en el sistema.", "reciclaje_greenup.csv");
  pintarTablaActual();
}

async function cambiarEstadoReciclaje(idRegistro, idEstado) {
  await apiAdmin(`/reciclaje/${idRegistro}/estado`, {
    method: "PUT",
    body: JSON.stringify({ id_estado: idEstado }),
  });
  mostrarToast("Registro actualizado", "El estado de reciclaje fue actualizado.");
  await cargarReciclaje();
}

async function cargarReportes() {
  const datos = await apiAdmin("/reportes/reciclaje");
  pintarHero([
    ["Filas", String(datos.length)],
    ["Formato", "CSV/PDF"],
  ]);
  const columnas = Object.keys(datos[0] || {});
  adminTableColumns = columnas.length ? columnas : ["Reporte"];
  adminTableData = datos.map((fila) => ({
    raw: fila,
    values: columnas.map((col) => limpiar(fila[col])),
    actions: "",
  }));
  document.getElementById("admin-content").innerHTML = `
    <div class="toolbar">
      <button class="primary-button" type="button" onclick="exportarTablaCSV('reporte_reciclaje_greenup.csv')">
        <span class="material-symbols-outlined">download</span> Exportar CSV
      </button>
      <button class="ghost-button" type="button" onclick="window.print()">
        <span class="material-symbols-outlined">print</span> Imprimir PDF
      </button>
      <button class="ghost-button" type="button" onclick="cargarReportes()">
        <span class="material-symbols-outlined">sync</span> Actualizar
      </button>
    </div>
    ${renderTableCard("Reporte de reciclaje", "Informacion real almacenada en Supabase.", "reporte_reciclaje_greenup.csv")}
  `;
  pintarTablaActual();
}

async function cargarNovedades() {
  const datos = await apiAdmin("/novedades");
  pintarHero([
    ["Noticias", String(datos.length)],
    ["Activas", String(datos.filter((n) => Number(n.id_estado) === 1).length)],
  ]);
  document.getElementById("admin-content").innerHTML = `
    <section class="content-grid content-layout">
      <article class="admin-card">
        <div class="card-title-row">
          <div>
            <h2>Publicar noticia</h2>
            <p>Contenido visible para la comunidad.</p>
          </div>
        </div>
        ${renderForm("form-novedad", [
          { id: "titulo", label: "Titulo" },
          { id: "imagen", label: "URL de imagen" },
          { id: "descripcion", label: "Descripcion", type: "textarea", full: true },
        ], "guardarNovedad(event)", "Publicar")}
      </article>
      <article class="data-card">
        <div class="card-title-row">
          <div>
            <h2>Noticias publicadas</h2>
            <p>Se muestran solo registros existentes.</p>
          </div>
        </div>
        ${renderNewsGrid(datos)}
      </article>
    </section>
  `;
}

async function guardarNovedad(evento) {
  evento.preventDefault();
  const admin = obtenerAdminActual();
  const payload = leerFormulario([
    { id: "titulo" },
    { id: "imagen" },
    { id: "descripcion" },
  ]);
  payload.id_usuario = admin.id_usuario;
  await apiAdmin("/novedades", { method: "POST", body: JSON.stringify(payload) });
  mostrarToast("Noticia publicada", "La novedad quedo guardada correctamente.");
  await cargarNovedades();
}

async function cambiarEstadoNovedad(idNovedad, idEstado) {
  await apiAdmin(`/novedades/${idNovedad}/estado`, {
    method: "PUT",
    body: JSON.stringify({ id_estado: idEstado }),
  });
  mostrarToast("Noticia actualizada", "El estado de la noticia cambio.");
  await cargarNovedades();
}

async function cargarFaq() {
  const datos = await apiAdmin("/faq");
  pintarHero([["Preguntas", String(datos.length)], ["Modulo", "Soporte"]]);
  adminTableColumns = ["ID", "Pregunta", "Categoria", "Orden", "Respuesta"];
  adminTableData = datos.map((f) => ({
    raw: f,
    values: [f.id_pregunta, limpiar(f.pregunta), limpiar(f.categoria), limpiar(f.orden), limpiar(f.respuesta)],
    actions: "",
  }));
  document.getElementById("admin-content").innerHTML = `
    <section class="content-grid content-layout">
      <article class="admin-card">
        <div class="card-title-row"><div><h2>Nueva pregunta</h2><p>Respuesta visible para usuarios.</p></div></div>
        ${renderForm("form-faq", [
          { id: "pregunta", label: "Pregunta", full: true },
          { id: "categoria", label: "Categoria" },
          { id: "orden", label: "Orden", type: "number" },
          { id: "respuesta", label: "Respuesta", type: "textarea", full: true },
        ], "guardarFaq(event)", "Guardar")}
      </article>
      <article class="data-card">
        <div class="card-title-row"><div><h2>Preguntas registradas</h2><p>Datos reales desde Supabase.</p></div></div>
        <div id="tabla-admin"></div>
      </article>
    </section>
  `;
  pintarTablaActual();
}

async function guardarFaq(evento) {
  evento.preventDefault();
  const payload = leerFormulario([
    { id: "pregunta" },
    { id: "categoria" },
    { id: "orden", type: "number" },
    { id: "respuesta" },
  ]);
  await apiAdmin("/faq", { method: "POST", body: JSON.stringify(payload) });
  mostrarToast("FAQ guardada", "La pregunta quedo registrada.");
  await cargarFaq();
}

async function cargarContenido() {
  const datos = await apiAdmin("/contenido");
  pintarHero([["Recursos", String(datos.length)], ["Modulo", "Educacion"]]);
  adminTableColumns = ["ID", "Titulo", "Tipo", "URL", "Estado"];
  adminTableData = datos.map((c) => ({
    raw: c,
    values: [c.id_contenido, limpiar(c.titulo), limpiar(c.tipo), limpiar(c.url_recurso), estadoHtml(c.id_estado)],
    actions: "",
  }));
  document.getElementById("admin-content").innerHTML = `
    <section class="content-grid content-layout">
      <article class="admin-card">
        <div class="card-title-row"><div><h2>Nuevo contenido</h2><p>Recurso educativo para GreenUp.</p></div></div>
        ${renderForm("form-contenido", [
          { id: "titulo", label: "Titulo" },
          { id: "tipo", label: "Tipo", type: "select", options: [["articulo", "Articulo"], ["video", "Video"], ["infografia", "Infografia"]] },
          { id: "url_recurso", label: "URL recurso" },
          { id: "imagen", label: "URL imagen" },
          { id: "descripcion", label: "Descripcion", type: "textarea", full: true },
        ], "guardarContenido(event)", "Guardar")}
      </article>
      <article class="data-card">
        <div class="card-title-row"><div><h2>Contenido registrado</h2><p>Material publicado o en gestion.</p></div></div>
        <div id="tabla-admin"></div>
      </article>
    </section>
  `;
  pintarTablaActual();
}

async function guardarContenido(evento) {
  evento.preventDefault();
  const admin = obtenerAdminActual();
  const payload = leerFormulario([
    { id: "titulo" },
    { id: "tipo" },
    { id: "url_recurso" },
    { id: "imagen" },
    { id: "descripcion" },
  ]);
  payload.id_usuario = admin.id_usuario;
  await apiAdmin("/contenido", { method: "POST", body: JSON.stringify(payload) });
  mostrarToast("Contenido guardado", "El recurso quedo registrado.");
  await cargarContenido();
}

async function cargarEstadisticas() {
  const [estadisticas, usuarios, puntos, recicladoras] = await Promise.all([
    apiAdmin("/estadisticas"),
    apiAdmin("/api/usuarios/listar"),
    apiAdmin("/ubicaciones"),
    apiAdmin("/api/recicladoras/listar"),
  ]);
  pintarHero([
    ["Reciclajes", String(estadisticas.total_reciclajes || 0)],
    ["Kg", String(estadisticas.total_cantidad || 0)],
  ]);
  document.getElementById("admin-content").innerHTML = `
    <section class="metrics-grid">
      ${metric("recycling", estadisticas.total_reciclajes || 0, "Registros reciclaje", "Total de movimientos")}
      ${metric("scale", estadisticas.total_cantidad || 0, "Cantidad reciclada", "Suma total reportada", "blue")}
      ${metric("groups", usuarios.length, "Usuarios", "Cuentas en el sistema")}
      ${metric("location_on", puntos.length, "Puntos", `${recicladoras.length} recicladoras`, "blue")}
    </section>
    <article class="data-card">
      <div class="card-title-row">
        <div>
          <h2>Resumen administrativo</h2>
          <p>Indicadores calculados desde Supabase.</p>
        </div>
      </div>
      <div class="empty-state">
        <div>
          <span class="material-symbols-outlined">monitoring</span>
          Los indicadores se actualizan desde los registros reales del sistema.
        </div>
      </div>
    </article>
  `;
}

function cargarPerfil() {
  const admin = obtenerAdminActual();
  pintarHero([["Rol", "Admin"], ["ID", String(admin.id_usuario || "")]]);
  document.getElementById("admin-content").innerHTML = `
    <article class="data-card">
      <div class="card-title-row">
        <div>
          <h2>Sesion administrativa</h2>
          <p>Datos guardados luego del inicio de sesion.</p>
        </div>
      </div>
      ${tablaDatos(["Campo", "Valor"], [
        ["ID", limpiar(admin.id_usuario)],
        ["Usuario", limpiar(admin.usuario)],
        ["Nombre", `${limpiar(admin.nombres)} ${limpiar(admin.apellidos)}`],
        ["Rol", "Administrador del sistema"],
      ])}
    </article>
  `;
}

function cargarConfiguracion() {
  pintarHero([["Notificaciones", Notification.permission || "n/a"], ["Sesion", "Activa"]]);
  document.getElementById("admin-content").innerHTML = `
    <section class="metrics-grid">
      ${settingCard("notifications", "Notificaciones", "Activa permisos para recibir avisos cuando lleguen usuarios o puntos nuevos.", "pedirPermisoNotificaciones()", "Activar")}
      ${settingCard("sync", "Actualizacion", "Las tablas principales y el mapa consultan Supabase cada 8 segundos.", "cargarModuloAdmin()", "Actualizar")}
      ${settingCard("download", "Exportacion", "Los reportes y tablas se exportan a CSV desde el navegador.", "exportarTablaCSV('greenup_admin.csv')", "Exportar")}
      ${settingCard("logout", "Sesion", "Cierra la sesion del administrador en este navegador.", "cerrarSesionAdminSistema()", "Cerrar")}
    </section>
  `;
}

function settingCard(icon, title, text, action, button) {
  return `
    <article class="metric-card">
      <span class="metric-icon"><span class="material-symbols-outlined">${icon}</span></span>
      <span>${title}</span>
      <p>${text}</p>
      <button class="small-button" type="button" onclick="${action}">${button}</button>
    </article>
  `;
}

function renderTableCard(title, subtitle, filename) {
  return `
    <article class="data-card">
      <div class="card-title-row">
        <div>
          <h2>${title}</h2>
          <p>${subtitle}</p>
        </div>
        <button class="ghost-button" type="button" onclick="exportarTablaCSV('${filename}')">
          <span class="material-symbols-outlined">download</span> Exportar
        </button>
      </div>
      <div id="tabla-admin"></div>
    </article>
  `;
}

function pintarTablaActual(data = adminTableData) {
  const contenedor = document.getElementById("tabla-admin");
  if (!contenedor) return;
  if (!data.length) {
    contenedor.innerHTML = renderEmpty("database", "No hay registros para mostrar.", "Cuando existan datos en Supabase apareceran aqui.");
    return;
  }

  const tieneAcciones = data.some((row) => row.actions);
  contenedor.innerHTML = `
    <div class="table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            ${adminTableColumns.map((col) => `<th>${limpiar(col)}</th>`).join("")}
            ${tieneAcciones ? "<th>Acciones</th>" : ""}
          </tr>
        </thead>
        <tbody>
          ${data.map((row) => `
            <tr>
              ${row.values.map((value) => `<td>${value}</td>`).join("")}
              ${tieneAcciones ? `<td><div class="row-actions">${row.actions || ""}</div></td>` : ""}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function filtrarTablaActual() {
  const search = (document.getElementById("admin-search")?.value || "").toLowerCase();
  const tipo = document.getElementById("filtro-tipo-usuario")?.value || "";
  const estado = document.getElementById("filtro-estado")?.value || "";

  const filtrada = adminTableData.filter((row) => {
    const texto = row.values.map((v) => String(v).replace(/<[^>]+>/g, "")).join(" ").toLowerCase();
    const cumpleBusqueda = !search || texto.includes(search);
    const cumpleTipo = !tipo || texto.includes(tipo.toLowerCase());
    const cumpleEstado = !estado || texto.includes(estado.toLowerCase());
    return cumpleBusqueda && cumpleTipo && cumpleEstado;
  });

  pintarTablaActual(filtrada);
}

function tablaDatos(columnas, filas) {
  if (!filas.length) return renderEmpty("database", "No hay registros.", "Los datos apareceran cuando existan en Supabase.");
  return `
    <div class="table-wrap">
      <table class="admin-table">
        <thead><tr>${columnas.map((c) => `<th>${limpiar(c)}</th>`).join("")}</tr></thead>
        <tbody>
          ${filas.map((fila) => `<tr>${fila.map((v) => `<td>${limpiarHtmlPermitido(v)}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderForm(id, campos, accion, textoBoton) {
  return `
    <form id="${id}" class="admin-form" onsubmit="${accion}">
      ${campos.map((campo) => renderField(campo)).join("")}
      <button class="primary-button full" type="submit">
        <span class="material-symbols-outlined">save</span>${textoBoton}
      </button>
    </form>
  `;
}

function renderField(campo) {
  const clase = campo.full ? "full" : "";
  if (campo.type === "textarea") {
    return `<label class="${clase}">${campo.label}<textarea id="${campo.id}"></textarea></label>`;
  }
  if (campo.type === "select") {
    return `
      <label class="${clase}">${campo.label}
        <select id="${campo.id}">
          ${campo.options.map((op) => `<option value="${op[0]}">${op[1]}</option>`).join("")}
        </select>
      </label>
    `;
  }
  return `<label class="${clase}">${campo.label}<input id="${campo.id}" type="${campo.type || "text"}" value="${campo.value || ""}"></label>`;
}

function leerFormulario(campos) {
  const data = {};
  campos.forEach((campo) => {
    const elemento = document.getElementById(campo.id);
    if (!elemento) return;
    data[campo.id] = normalizarValor(campo, elemento.value);
  });
  return data;
}

function normalizarValor(campo, valor) {
  if (campo.type === "number") return valor === "" ? null : Number(valor);
  if (campo.id && campo.id.startsWith("id_")) return valor === "" ? null : Number(valor);
  return valor;
}

function metric(icon, value, label, detail, color = "") {
  return `
    <article class="metric-card ${color}">
      <span class="metric-icon"><span class="material-symbols-outlined">${icon}</span></span>
      <strong>${limpiar(value)}</strong>
      <span>${limpiar(label)}</span>
      <p>${limpiar(detail)}</p>
    </article>
  `;
}

function renderNewsList(noticias) {
  if (!noticias.length) return renderEmpty("newspaper", "No hay noticias registradas.", "Cuando publiques novedades apareceran aqui.");
  return noticias.map((n) => `
    <div class="news-body">
      <h3>${limpiar(n.titulo)}</h3>
      <p>${limpiar(n.descripcion)}</p>
    </div>
  `).join("");
}

function renderNewsGrid(noticias) {
  if (!noticias.length) return renderEmpty("newspaper", "No hay noticias registradas.", "Publica la primera novedad desde el formulario.");
  return `
    <div class="news-grid">
      ${noticias.map((n) => {
        const activo = Number(n.id_estado) === 1;
        return `
          <article class="news-card">
            <div class="news-image">
              ${n.imagen ? `<img src="${limpiar(n.imagen)}" alt="${limpiar(n.titulo)}">` : ""}
            </div>
            <div class="news-body">
              <h3>${limpiar(n.titulo)}</h3>
              <p>${limpiar(n.descripcion)}</p>
              <p>${estadoHtml(n.id_estado)}</p>
              <div class="row-actions">
                <button class="small-button ${activo ? "danger-button" : ""}" type="button" onclick="cambiarEstadoNovedad(${n.id_novedad}, ${activo ? 2 : 1})">
                  ${activo ? "Inactivar" : "Activar"}
                </button>
              </div>
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderEmpty(icon, title, text) {
  return `
    <div class="empty-state">
      <div>
        <span class="material-symbols-outlined">${icon}</span>
        <strong>${limpiar(title)}</strong>
        <p>${limpiar(text)}</p>
      </div>
    </div>
  `;
}

function estadoHtml(idEstado) {
  const activo = Number(idEstado) === 1;
  return `<span class="status-pill ${activo ? "active" : "inactive"}">${activo ? "Activo" : "Inactivo"}</span>`;
}

function nombreRol(idRol) {
  const roles = { 1: "Administrador", 2: "Recicladora", 3: "Ciudadano" };
  return roles[Number(idRol)] || "Sin rol";
}

function limpiar(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function limpiarHtmlPermitido(valor) {
  const texto = String(valor ?? "");
  if (texto.includes("status-pill") || texto.includes("type-pill")) return texto;
  return limpiar(texto);
}

function iniciales(nombre) {
  return String(nombre || "A").trim().slice(0, 1).toUpperCase();
}

function pedirPermisoNotificaciones() {
  if (!("Notification" in window)) {
    mostrarToast("Notificaciones", "Este navegador no soporta notificaciones.");
    return;
  }
  Notification.requestPermission().then((permiso) => {
    mostrarToast("Notificaciones", permiso === "granted" ? "Permiso activado." : "Permiso no activado.");
  });
}

function notificarAdmin(titulo, cuerpo) {
  mostrarToast(titulo, cuerpo);
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(titulo, { body: cuerpo });
  }
}

function mostrarToast(titulo, cuerpo) {
  const stack = document.getElementById("toast-stack");
  if (!stack) return;
  const toast = document.createElement("div");
  toast.className = "admin-toast";
  toast.innerHTML = `<strong>${limpiar(titulo)}</strong>${limpiar(cuerpo)}`;
  stack.appendChild(toast);
  setTimeout(() => toast.remove(), 4200);
}

function iniciarMonitoreoAdmin() {
  if (adminMonitor) clearInterval(adminMonitor);
  adminMonitor = setInterval(async () => {
    try {
      const usuarios = await apiAdmin("/api/usuarios/listar");
      if (adminLastUserCount !== null && usuarios.length > adminLastUserCount) {
        notificarAdmin("Nuevo usuario registrado", "La tabla del administrador se actualizara automaticamente.");
        if (moduloActual() === "usuarios" || moduloActual() === "panel") await cargarModuloAdmin();
      }
      adminLastUserCount = usuarios.length;

      if (moduloActual() === "mapa") await actualizarPuntosMapa(false);
      if (["puntos", "reportes", "estadisticas"].includes(moduloActual())) await cargarModuloAdmin();
    } catch (error) {
      console.warn("No se pudo ejecutar el monitoreo admin", error);
    }
  }, ADMIN_REFRESH_MS);
}

function exportarTablaCSV(nombreArchivo) {
  const filas = adminTableData;
  if (!filas.length) {
    mostrarToast("Exportacion", "No hay datos para exportar.");
    return;
  }
  const csv = [
    adminTableColumns.join(","),
    ...filas.map((row) => row.values.map((value) => `"${String(value).replace(/<[^>]+>/g, "").replaceAll('"', '""')}"`).join(",")),
  ].join("\n");

  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  enlace.download = nombreArchivo;
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}

function cerrarSesionAdminSistema() {
  localStorage.removeItem("usuario");
  window.location.href = "../public/admin_login.html";
}
