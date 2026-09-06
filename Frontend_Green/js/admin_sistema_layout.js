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

const ADMIN_API_BASE = typeof API_URL !== "undefined" ? API_URL : "https://greenup-hoxj.onrender.com";
const ADMIN_REFRESH_MS = 8000;
const ADMIN_HOME = "admin_panel.html";

let adminTableData = [];
let adminTableColumns = [];
let adminLastUserCount = null;
let adminLastPointCount = null;
let adminLastNewsCount = null;
let adminMonitor = null;
let adminHeroTimer = null;
let adminMap = null;
let adminMarkers = new Map();
let adminUserMarker = null;
let adminUserLocation = null;
let adminRouteControl = null;
let adminRouteLines = [];
let adminWatchId = null;
let adminRouteDestination = null;
let adminRouteMode = "car";
let adminLastWalkingRoute = null;
let adminWalkingUpdateAt = 0;
const ADMIN_ROUTE_MODES = [
  { id: "car", label: "En automóvil", icon: "directions_car", color: "#1f8a3b", url: "https://routing.openstreetmap.de/routed-car/route/v1" },
  { id: "bike", label: "En bicicleta", icon: "directions_bike", color: "#e57c00", url: "https://routing.openstreetmap.de/routed-bike/route/v1" },
  { id: "foot", label: "Caminando", icon: "directions_walk", color: "#7c3aed", url: "https://routing.openstreetmap.de/routed-foot/route/v1" },
];

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
    subtitle: "Gestiona el catalogo de materiales reciclables y sus unidades de medicion.",
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

const adminHeroImageBank = [
  "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1523978591478-c753949ff840?auto=format&fit=crop&w=1200&q=80"
];

function imagenesHeroModulo(modulo) {
  /*
    Carrusel automatico del administrador.
    Usa URLs fijas de imagen para evitar fallas de carga por busquedas dinamicas.
    Cada apartado arranca desde una posicion diferente, por eso el orden de las
    15 fotos cambia entre paginas y no se siente repetido.
  */
  const modulos = Object.keys(adminHeroImageGroups);
  const inicio = Math.max(0, modulos.indexOf(modulo));
  return Array.from({ length: 15 }, (_, index) => ({
    url: adminHeroImageBank[(inicio + index) % adminHeroImageBank.length],
    label: `Imagen ${index + 1} de 15`,
  }));
}

function iniciarCarruselHero() {
  /*
    Activa el paso automatico de imagenes del hero.
    Si el usuario cambia de pagina, el temporizador anterior se limpia primero.
  */
  if (adminHeroTimer) clearInterval(adminHeroTimer);

  const slides = Array.from(document.querySelectorAll(".hero-slide"));
  const dots = Array.from(document.querySelectorAll(".carousel-dots i"));
  if (slides.length <= 1) return;

  let activo = 0;
  adminHeroTimer = setInterval(() => {
    slides[activo].classList.remove("active");
    dots[activo]?.classList.remove("active");
    activo = (activo + 1) % slides.length;
    slides[activo].classList.add("active");
    dots[activo]?.classList.add("active");
  }, 3500);
}

document.addEventListener("DOMContentLoaded", iniciarAdminSistema);

function crearBotonAyudaAdmin() {
  if (document.getElementById("greenup-ayuda-float")) return;
  const enlace = document.createElement("a");
  enlace.id = "greenup-ayuda-float";
  enlace.className = "greenup-ayuda-float";
  enlace.href = "admin_faq.html";
  enlace.title = "Ayuda";
  enlace.setAttribute("aria-label", "Ayuda sobre el uso de GreenUp");
  enlace.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">question_mark</span>';
  document.body.appendChild(enlace);
}

async function iniciarAdminSistema() {
  if (!protegerAdminSistema()) return;
  quitarModoOscuroAdminSistema();
  normalizarEnlacesBaseAdminSistema();
  pintarEstructuraBase();
  crearBotonAyudaAdmin();
  await cargarModuloAdmin();
  iniciarMonitoreoAdmin();
}

function normalizarEnlacesBaseAdminSistema() {
  /*
    Algunas plantillas HTML antiguas conservan enlaces "#".
    El layout dinamico dibuja la interfaz real, pero esta normalizacion evita
    que un clic temprano deje botones como Perfil o Configuracion sin destino.
  */
  const rutas = {
    "perfil": "admin_perfil.html",
    "configuracion": "admin_configuracion.html",
    "configuración": "admin_configuracion.html",
  };

  document.querySelectorAll('a[href="#"], a:not([href])').forEach((enlace) => {
    const texto = (enlace.textContent || "").trim().toLowerCase();
    const destino = Object.entries(rutas).find(([clave]) => texto.includes(clave))?.[1];
    if (destino) enlace.href = destino;
  });
}

function moduloActual() {
  /*
    DETECCION DEL APARTADO ACTUAL:
    Algunas paginas antiguas no declaran window.ADMIN_MODULE dentro del HTML.
    Para que el navbar funcione siempre, tambien detectamos el modulo usando
    el nombre real del archivo abierto en el navegador.
  */
  if (window.ADMIN_MODULE) return window.ADMIN_MODULE;

  const archivo = (window.location.pathname.split("/").pop() || ADMIN_HOME).toLowerCase();
  const modulosPorArchivo = {
    "admin_panel.html": "panel",
    "admin_usuarios.html": "usuarios",
    "admin_mapa.html": "mapa",
    "admin_puntos_reciclaje.html": "puntos",
    "admin_reportes.html": "reportes",
    "admin_roles.html": "roles",
    "admin_tipo_documento.html": "documentos",
    "admin_materiales.html": "materiales",
    "admin_residuos.html": "residuos",
    "admin_registros_reciclaje.html": "reciclaje",
    "admin_novedades.html": "novedades",
    "admin_contenido_educativo.html": "contenido",
    "admin_faq.html": "faq",
    "admin_estadisticas.html": "estadisticas",
    "admin_perfil.html": "perfil",
    "admin_configuracion.html": "configuracion",
  };

  return modulosPorArchivo[archivo] || "panel";
}

function obtenerAdminActual() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "{}");
  } catch {
    return {};
  }
}

function obtenerTemaAdminSistema() {
  /*
    TEMA GLOBAL DEL ADMIN:
    Lee la preferencia guardada para que el modo oscuro funcione en todas
    las pantallas del administrador, no solo en el perfil.
  */
  const tema = localStorage.getItem("greenup_admin_tema")
    || localStorage.getItem("greenup_admin_perfil_modo")
    || "claro";
  return tema === "oscuro" ? "oscuro" : "claro";
}

function aplicarTemaAdminSistema() {
  /*
    APLICA EL TEMA A TODA LA PAGINA:
    Estas clases cambian navbar, fondo, tarjetas, tablas, formularios y mapa.
  */
  const tema = obtenerTemaAdminSistema();
  document.body.classList.remove("admin-theme-dark", "admin-theme-light");
  document.body.classList.add(tema === "oscuro" ? "admin-theme-dark" : "admin-theme-light");
}

function quitarModoOscuroAdminSistema() {
  /*
    Nombre heredado: antes forzaba el modo claro. Ahora solo sincroniza
    la clase del body con la preferencia real del usuario.
  */
  aplicarTemaAdminSistema();
}

function cambiarTemaAdminSistema(modo) {
  /*
    CAMBIO MANUAL DE TEMA:
    Guarda y aplica la preferencia seleccionada.
  */
  const tema = modo === "oscuro" ? "oscuro" : "claro";
  localStorage.setItem("greenup_admin_tema", tema);
  localStorage.setItem("greenup_admin_perfil_modo", tema);
  aplicarTemaAdminSistema();
  actualizarBotonTemaAdminSistema();
  if (moduloActual() === "perfil") cargarPerfil();
  mostrarToast(
    tema === "oscuro" ? "Tema oscuro activo" : "Tema claro activo",
    tema === "oscuro"
      ? "El panel administrador cambió a una apariencia oscura."
      : "El panel administrador cambió a una apariencia clara."
  );
}

function alternarTemaAdminSistema() {
  const siguienteTema = obtenerTemaAdminSistema() === "oscuro" ? "claro" : "oscuro";
  cambiarTemaAdminSistema(siguienteTema);
}

function actualizarBotonTemaAdminSistema() {
  /*
    BOTON DEL TOPBAR:
    Cambia el icono para indicar el siguiente modo disponible.
  */
  const botonTema = document.querySelector(".theme-toggle-button .material-symbols-outlined");
  if (!botonTema) return;
  botonTema.textContent = obtenerTemaAdminSistema() === "oscuro" ? "light_mode" : "dark_mode";
}

function protegerAdminSistema() {
  /*
    PROTECCION DE ADMIN:
    Si no existe una sesion con rol 1, no se pinta ninguna pantalla.
    replace() evita que el usuario vuelva con "atras" al panel protegido.
  */
  const admin = obtenerAdminActual();
  const sesionActiva = sessionStorage.getItem("greenup_admin_sesion_activa") === "1";
  if (!sesionActiva || !admin.id_usuario || Number(admin.id_rol) !== 1) {
    document.documentElement.classList.add("admin-auth-blocked");
    window.location.replace("../public/admin_login.html");
    return false;
  }
  document.documentElement.classList.add("admin-auth-ok");
  return true;
}

function headersAdmin() {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
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

function listaSegura(resultado) {
  return resultado?.status === "fulfilled" && Array.isArray(resultado.value)
    ? resultado.value
    : [];
}

function objetoSeguro(resultado) {
  return resultado?.status === "fulfilled" && resultado.value && typeof resultado.value === "object"
    ? resultado.value
    : {};
}

function mensajeAmableModulo(error) {
  const texto = (error?.message || "").trim();
  if (!texto || /error interno|failed to fetch|load failed|network|servidor/i.test(texto)) {
    return "No pudimos cargar esta informacion ahora. Puedes actualizar en unos segundos.";
  }
  return texto;
}

function pintarEstructuraBase() {
  const actual = moduloActual();
  const admin = obtenerAdminActual();
  document.body.classList.add("admin-app");
  quitarModoOscuroAdminSistema();
  document.body.innerHTML = `
    <aside class="app-sidebar d-flex flex-column">
      ${renderBrand()}
      ${renderNavGroup("Principal", adminPrimaryNav, actual)}
      ${renderNavGroup("Sistema", adminSystemNav, actual)}
      ${renderNavGroup("Contenido", adminContentNav, actual)}
      <div class="sidebar-actions">
        <button class="logout-link btn" type="button" onclick="cerrarSesionAdminSistema()">
          <span class="material-symbols-outlined">logout</span>
          Cerrar sesion
        </button>
      </div>
    </aside>

    <header class="app-topbar">
      <div class="mobile-brand">
        ${renderBrand()}
        <button class="role-menu-toggle" type="button" aria-label="Abrir menu administrador" aria-controls="adminRoleMenu" aria-expanded="false">
          <span class="material-symbols-outlined">menu</span>
        </button>
        <section class="role-nav-menu" id="adminRoleMenu" aria-label="Menu principal administrador">
          ${renderNavGroup("Principal", adminPrimaryNav, actual)}
          ${renderNavGroup("Sistema", adminSystemNav, actual)}
          ${renderNavGroup("Contenido", adminContentNav, actual)}
          <div class="sidebar-actions">
            <button class="logout-link btn" type="button" onclick="cerrarSesionAdminSistema()">
              <span class="material-symbols-outlined">logout</span>
              Cerrar sesion
            </button>
          </div>
        </section>
      </div>
      <div class="topbar-actions">
        <button class="icon-button btn btn-light" type="button" title="Notificaciones" onclick="mostrarPanelNotificacionesAdmin()">
          <span class="material-symbols-outlined">notifications</span>
        </button>
        <section class="notifications-menu" id="adminNotificationsMenu" aria-hidden="true" aria-label="Panel de notificaciones del administrador">
          <div class="notifications-head">
            <div>
              <h2>Notificaciones</h2>
              <p>Actividad reciente del administrador</p>
            </div>
            <span class="notifications-badge">0</span>
          </div>
          <div class="inline-empty-state">
            <span class="material-symbols-outlined">inbox</span>
            <strong>Sin notificaciones</strong>
            <small>Cuando haya alertas, solicitudes o cambios importantes aparecerán aquí.</small>
          </div>
        </section>
        <div class="dropdown admin-user-dropdown">
          <button class="user-menu btn d-flex align-items-center dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
            <span class="user-avatar">${iniciales(admin.nombres || admin.usuario || "A")}</span>
            <span class="user-meta">
              <strong>${limpiar(admin.usuario || "admin")}</strong>
              <span>Administrador</span>
            </span>
            <span class="material-symbols-outlined menu-indicator">menu</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end admin-user-menu">
            <li class="dropdown-header">Cuenta administrador</li>
            <li>
              <a class="dropdown-item" href="admin_perfil.html">
                <span class="material-symbols-outlined">person</span> Perfil
              </a>
            </li>
            <li>
              <a class="dropdown-item" href="admin_configuracion.html">
                <span class="material-symbols-outlined">settings</span> Configuracion
              </a>
            </li>
            <li>
              <button class="dropdown-item" type="button" onclick="mostrarPanelNotificacionesAdmin()">
                <span class="material-symbols-outlined">notifications</span> Notificaciones
              </button>
            </li>
            <li><hr class="dropdown-divider"></li>
            <li>
              <button class="dropdown-item text-danger" type="button" onclick="cerrarSesionAdminSistema()">
                <span class="material-symbols-outlined">logout</span> Cerrar sesion
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>

    <main class="admin-main container-fluid">
      <section id="admin-hero"></section>
      <section id="admin-content"></section>
    </main>

    <footer class="role-about-footer admin-about-footer" aria-label="Información de GreenUp">
      <span>© 2026 GreenUp</span>
      <a href="../public/public_sobre_nosotros.html">
        <span class="material-symbols-outlined" aria-hidden="true">info</span>
        Sobre GreenUp
      </a>
    </footer>

    <nav class="mobile-bottom-nav nav">
      ${adminPrimaryNav.map((item) => `
        <a class="${item.module === actual ? "active" : ""}" href="${item.href}" title="${item.label}">
          <span class="material-symbols-outlined">${item.icon}</span>
        </a>
      `).join("")}
    </nav>
    <div id="toast-stack" class="toast-stack"></div>
  `;

  const buscadorAdmin = document.getElementById("admin-search");
  if (buscadorAdmin) buscadorAdmin.addEventListener("input", filtrarTablaActual);
  prepararNavbarAdmin();
  prepararMenuSuperiorAdmin();
}

function prepararNavbarAdmin() {
  /*
    NAVBAR ESTABLE:
    Cuando el administrador entra a un apartado de abajo, el sidebar se vuelve
    a construir. Guardamos su scroll y centramos el enlace activo para que el
    menu no se suba de golpe ni pierda la opcion seleccionada.
  */
  const sidebar = document.querySelector(".app-sidebar");
  if (!sidebar) return;

  const guardado = Number(sessionStorage.getItem("greenup_admin_sidebar_scroll") || 0);
  if (Number.isFinite(guardado) && guardado > 0) {
    sidebar.scrollTop = guardado;
  }

  const activo = sidebar.querySelector(".sidebar-link.active");
  if (activo) {
    const margen = 90;
    const arribaActivo = activo.offsetTop;
    const abajoActivo = arribaActivo + activo.offsetHeight;
    const arribaVisible = sidebar.scrollTop;
    const abajoVisible = arribaVisible + sidebar.clientHeight;

    if (arribaActivo < arribaVisible + margen || abajoActivo > abajoVisible - margen) {
      sidebar.scrollTop = Math.max(0, arribaActivo - (sidebar.clientHeight / 2) + (activo.offsetHeight / 2));
    }
  }

  sidebar.addEventListener("scroll", () => {
    sessionStorage.setItem("greenup_admin_sidebar_scroll", String(sidebar.scrollTop));
  }, { passive: true });

  sidebar.querySelectorAll("a").forEach((enlace) => {
    enlace.addEventListener("click", () => {
      sessionStorage.setItem("greenup_admin_sidebar_scroll", String(sidebar.scrollTop));
    });
  });
}

function prepararMenuSuperiorAdmin() {
  const boton = document.querySelector(".role-menu-toggle");
  const menu = document.getElementById("adminRoleMenu");
  if (!boton || !menu) return;

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
}

function renderBrand() {
  return `
    <a class="brand-lockup navbar-brand d-inline-flex" href="${ADMIN_HOME}" aria-label="Ir al panel GreenUp">
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
        <a class="sidebar-link nav-link ${item.module === actual ? "active" : ""}" href="${item.href}">
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
  const imagenes = imagenesHeroModulo(moduloActual());

  document.getElementById("admin-hero").innerHTML = `
    <!-- TITULO DEL MODULO: identifica el apartado actual del administrador. -->
    <article class="page-hero card">
      <div class="hero-copy">
        <span class="hero-eyebrow"><span class="material-symbols-outlined">verified_user</span>${pagina.eyebrow}</span>
        <h1>${pagina.title}</h1>
        <p>${pagina.subtitle}</p>
        ${stats.length ? `<!-- CARTAS RESUMEN: muestran indicadores rapidos del modulo actual. --><div class="hero-stats">${stats.map((s, index) => `
          <div class="summary-card card ${index === 1 ? "blue" : ""}">
            <span class="summary-label">${s[0]}</span>
            <span class="summary-value">${s[1]}</span>
          </div>
        `).join("")}</div>` : ""}
      </div>
      <!-- CARRUSEL AUTOMATICO: contiene 15 imagenes distintas por apartado. -->
      <div class="hero-visual" aria-label="Carrusel visual del administrador">
        <div class="hero-carousel">
          ${imagenes.map((imagen, index) => `
            <div class="hero-slide ${index === 0 ? "active" : ""}" style="background-image: url('${imagen.url}')"></div>
          `).join("")}
        </div>
        <div class="hero-carousel-card">
          <div>
            <strong>GreenUp Admin</strong><br>
            <span>${pagina.eyebrow}</span>
          </div>
          <div class="carousel-dots">
            ${imagenes.map((_, index) => `<i class="${index === 0 ? "active" : ""}"></i>`).join("")}
          </div>
        </div>
      </div>
    </article>
  `;

  iniciarCarruselHero();
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
      mensajeAmableModulo(error),
    );
    console.warn("Modulo admin no cargado:", error);
  }
}

async function cargarPanel() {
  const resultados = await Promise.allSettled([
    apiAdmin("/api/usuarios/listar"),
    apiAdmin("/api/usuarios/ciudadanos"),
    apiAdmin("/api/recicladoras/listar"),
    apiAdmin("/ubicaciones"),
    apiAdmin("/reciclaje"),
    apiAdmin("/novedades"),
    apiAdmin("/estadisticas"),
  ]);
  const obtenerLista = (indice) => resultados[indice].status === "fulfilled" && Array.isArray(resultados[indice].value)
    ? resultados[indice].value
    : [];
  const usuarios = obtenerLista(0);
  const ciudadanos = obtenerLista(1);
  let recicladoras = obtenerLista(2);
  const puntos = obtenerLista(3);
  const reciclajes = obtenerLista(4);
  const novedades = obtenerLista(5);
  const estadisticas = resultados[6].status === "fulfilled" && resultados[6].value
    ? resultados[6].value
    : {};
  if (!recicladoras.length && usuarios.length) {
    recicladoras = usuarios.filter((usuario) => Number(usuario.id_rol) === 2);
  }
  const erroresPanel = resultados
    .filter((resultado) => resultado.status === "rejected")
    .map((resultado) => resultado.reason?.message || "No se pudo cargar una seccion");
  if (erroresPanel.length) {
    console.warn("Secciones del panel no cargadas:", erroresPanel);
  }

  pintarHero([
    ["Usuarios", String(usuarios.length)],
    ["Puntos", String(puntos.length)],
  ]);

  document.getElementById("admin-content").innerHTML = `
    <section class="metrics-grid row g-3">
      ${metric("groups", usuarios.length, "Usuarios registrados", "Ciudadanos y recicladoras")}
      ${metric("person", ciudadanos.length, "Ciudadanos", "Cuentas creadas desde ciudadano", "blue")}
      ${metric("storefront", recicladoras.length, "Recicladoras", "Administradores de recicladora")}
      ${metric("recycling", estadisticas.total_reciclajes || 0, "Registros reciclaje", `${estadisticas.total_cantidad || 0} kg reportados`, "blue")}
    </section>
    <section class="content-grid row g-3">
      <article class="data-card card col-12 col-xl-8">
        <div class="card-title-row">
          <div>
            <h2>Ultimos usuarios registrados</h2>
            <p>Datos reales cargados desde Supabase.</p>
          </div>
          <a class="ghost-button btn btn-outline-secondary" href="admin_usuarios.html">Ver usuarios</a>
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
      <article class="module-card card col-12 col-xl-4">
        <div class="card-title-row">
          <div>
            <h2>Noticias recientes</h2>
            <p>Comunicaciones publicadas por administracion.</p>
          </div>
          <a class="ghost-button btn btn-outline-secondary" href="admin_novedades.html">Gestionar</a>
        </div>
        ${renderNewsList(novedades.slice(0, 3))}
      </article>
    </section>
  `;
}

async function cargarUsuarios() {
  const resultados = await Promise.allSettled([
    apiAdmin("/api/usuarios/ciudadanos"),
    apiAdmin("/api/recicladoras/listar"),
    apiAdmin("/api/usuarios/listar"),
  ]);
  const [ciudadanosResultado, recicladorasResultado, todosResultado] = resultados;
  const ciudadanos = ciudadanosResultado.status === "fulfilled" && Array.isArray(ciudadanosResultado.value)
    ? ciudadanosResultado.value
    : [];
  let recicladoras = recicladorasResultado.status === "fulfilled" && Array.isArray(recicladorasResultado.value)
    ? recicladorasResultado.value
    : [];
  const todos = todosResultado.status === "fulfilled" && Array.isArray(todosResultado.value)
    ? todosResultado.value
    : [...ciudadanos, ...recicladoras];
  if (!recicladoras.length && todos.length) {
    recicladoras = todos
      .filter((usuario) => Number(usuario.id_rol) === 2)
      .map((usuario) => ({ ...usuario, registro_incompleto: true }));
  }
  const erroresCarga = resultados
    .filter((resultado) => resultado.status === "rejected")
    .map((resultado) => resultado.reason?.message || "No se pudo cargar una lista");
  if (erroresCarga.length) {
    console.warn("Listas de usuarios no cargadas:", erroresCarga);
  }

  pintarHero([
    ["Ciudadanos", String(ciudadanos.length)],
    ["Recicladoras", String(recicladoras.length)],
  ]);

  const filas = [
    ...ciudadanos.map((u) => ({ ...u, tipo_admin: "Ciudadano" })),
    ...recicladoras.map((u) => ({ ...u, tipo_admin: "Recicladora" })),
  ];

  adminTableColumns = ["Tipo", "Nombre / Empresa", "Usuario", "Correo", "Documento / NIT", "Cámara Comercio", "Validación", "Estado"];
  adminTableData = filas.map((u) => ({
    raw: u,
    values: [
      `<span class="type-pill ${u.tipo_admin === "Recicladora" ? "blue" : "green"}">${u.tipo_admin}</span>`,
      limpiar(u.tipo_admin === "Recicladora" ? (u.nombre_empresa || `${u.nombres || ""} ${u.apellidos || ""}`) : `${u.nombres || ""} ${u.apellidos || ""}`),
      limpiar(u.usuario),
      limpiar(u.correo),
      limpiar(u.tipo_admin === "Recicladora" ? `${u.numero_documento || ""} / NIT ${u.nit_empresa || "sin NIT"}` : u.numero_documento),
      renderDocumentoCamaraResumen(u),
      renderEstadoValidacionCamara(u),
      estadoHtml(u.id_estado),
    ],
    actions: renderEstadoUsuario(u),
  }));

  document.getElementById("admin-content").innerHTML = `
    ${toolbarUsuarios(todos.length)}
    <article class="data-card card">
      <div class="card-title-row">
        <div>
          <h2>Tabla de usuarios registrados</h2>
          <p>El administrador gestiona estados y valida la Cámara de Comercio de las recicladoras.</p>
        </div>
        <button class="ghost-button btn btn-outline-secondary" type="button" onclick="exportarTablaCSV('usuarios_greenup.csv')">
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
    <div class="toolbar d-flex flex-wrap align-items-center">
      <span class="type-pill blue">${total} cuentas en total</span>
      <select id="filtro-tipo-usuario" class="form-select" onchange="filtrarTablaActual()">
        <option value="">Todos los tipos</option>
        <option value="Ciudadano">Ciudadanos</option>
        <option value="Recicladora">Recicladoras</option>
      </select>
      <select id="filtro-estado" class="form-select" onchange="filtrarTablaActual()">
        <option value="">Todos los estados</option>
        <option value="Activo">Activos</option>
        <option value="Inactivo">Inactivos</option>
      </select>
      <button class="ghost-button btn btn-outline-secondary" type="button" onclick="cargarUsuarios()">
        <span class="material-symbols-outlined">sync</span> Actualizar tabla
      </button>
    </div>
  `;
}

function renderEstadoUsuario(usuario) {
  const activo = Number(usuario.id_estado) === 1;
  const siguiente = activo ? 2 : 1;
  const texto = activo ? "Inactivar" : "Activar";
  const clase = activo ? "danger-button btn-outline-danger" : "btn-outline-secondary";
  const estadoCamara = String(usuario.estado_camara_comercio || "pendiente").trim().toLowerCase();
  const camaraValidada = estadoCamara === "validado";
  const camaraRechazada = estadoCamara === "rechazado";
  const documentoCamara = obtenerDocumentoCamara(usuario);
  const registroIncompleto = Boolean(usuario.registro_incompleto || usuario.registro_empresarial_incompleto || !usuario.id_recicladora);
  const puedeAprobar = usuario.tipo_admin === "Recicladora" && !camaraValidada && documentoCamara.disponible && !registroIncompleto;
  const puedeRechazar = usuario.tipo_admin === "Recicladora" && !camaraValidada && !camaraRechazada;
  const accionesDocumento = usuario.tipo_admin === "Recicladora" ? `
    <button class="small-button btn btn-sm btn-outline-primary" type="button" onclick="abrirCamaraComercio(${usuario.id_usuario})">
      Ver documento
    </button>
    <button class="small-button btn btn-sm btn-outline-secondary" type="button" onclick="consultarRecicladoraEnRues(${usuario.id_usuario})">
      Consultar RUES
    </button>
    ${registroIncompleto ? '<span class="status-pill inactive">Registro incompleto</span>' : ""}
    ${camaraValidada ? '<span class="status-pill active">Validación completa</span>' : ""}
    ${camaraRechazada ? '<span class="status-pill inactive">Documento rechazado</span>' : ""}
    ${puedeAprobar ? `
      <button class="small-button btn btn-sm btn-success" type="button" onclick="validarCamaraComercio(${usuario.id_usuario}, 'validado')">
        Aprobar
      </button>
    ` : ""}
    ${puedeRechazar ? `
      <button class="small-button btn btn-sm btn-outline-danger" type="button" onclick="validarCamaraComercio(${usuario.id_usuario}, 'rechazado')">
        Rechazar
      </button>
    ` : ""}
  ` : "";
  return `
    ${accionesDocumento}
    <button class="small-button btn btn-sm btn-outline-primary user-details-button" type="button" onclick="verDetallesUsuario(${usuario.id_usuario})">
      Ver detalles
    </button>
    <button class="small-button btn btn-sm ${clase}" type="button" onclick="cambiarEstadoUsuario(${usuario.id_usuario}, ${siguiente})">
      ${texto}
    </button>
  `;
}

function verDetallesUsuario(idUsuario) {
  const fila = adminTableData.find((row) => Number(row.raw?.id_usuario) === Number(idUsuario));
  const usuario = fila?.raw;
  if (!usuario) return;

  document.getElementById("modal-detalle-usuario")?.remove();
  const modal = document.createElement("dialog");
  modal.id = "modal-detalle-usuario";
  modal.className = "admin-user-details";
  const datos = [
    ["Tipo", usuario.tipo_admin || "Ciudadano"],
    ["Nombre / Empresa", `${usuario.nombres || ""} ${usuario.apellidos || ""}`.trim() || usuario.nombre_empresa || "Sin registrar"],
    ["Usuario", usuario.usuario],
    ["Correo", usuario.correo],
    ["Documento / NIT", usuario.numero_documento || usuario.nit_empresa],
    ["Cámara de Comercio", usuario.tipo_admin === "Recicladora" ? (usuario.estado_camara_comercio || "Pendiente") : "No aplica"],
    ["Estado", Number(usuario.id_estado) === 1 ? "Activo" : "Inactivo"],
  ];
  modal.innerHTML = `
    <div class="user-details-header"><div><span class="eyebrow">Cuenta GreenUp</span><h2>Detalle del usuario</h2></div>
      <button type="button" class="icon-button" aria-label="Cerrar detalles">×</button></div>
    <div class="user-details-list">${datos.map(([etiqueta, valor]) => `<div><strong>${limpiar(etiqueta)}</strong><span>${limpiar(valor || "No registrado")}</span></div>`).join("")}</div>
  `;
  document.body.appendChild(modal);
  modal.querySelector("button")?.addEventListener("click", () => modal.close());
  modal.addEventListener("click", (evento) => { if (evento.target === modal) modal.close(); });
  modal.showModal();
}

function consultarRecicladoraEnRues(idUsuario) {
  const fila = adminTableData.find((row) => Number(row.raw?.id_usuario) === Number(idUsuario));
  const recicladora = fila?.raw || {};
  const nit = recicladora.nit_empresa || "NIT no registrado";
  alert(`Consulta en RUES el NIT de la recicladora: ${nit}. Verifica que el nombre, NIT y estado coincidan antes de aprobar.`);
  window.open("https://www.rues.org.co/", "_blank", "noopener,noreferrer");
}

function obtenerDocumentoCamara(usuario) {
  const valor = usuario?.camara_comercio || "";
  if (!valor) return { disponible: false, nombre: "Sin documento", contenido: "" };
  try {
    const doc = JSON.parse(valor);
    return {
      disponible: Boolean(doc.contenido),
      nombre: doc.nombre || "Cámara de Comercio",
      contenido: doc.contenido || "",
      tipo: doc.tipo || "",
    };
  } catch (_) {
    const esUrl = /^https?:\/\//i.test(valor) || /^data:/i.test(valor);
    return {
      disponible: esUrl,
      nombre: esUrl ? "Documento cargado" : valor,
      contenido: esUrl ? valor : "",
      soloNombre: !esUrl,
    };
  }
}

function renderDocumentoCamaraResumen(usuario) {
  if (usuario.tipo_admin !== "Recicladora") return '<span class="text-muted">No aplica</span>';
  if (usuario.registro_incompleto || usuario.registro_empresarial_incompleto || !usuario.id_recicladora) {
    return '<span class="status-pill inactive">Falta detalle empresarial</span>';
  }
  const doc = obtenerDocumentoCamara(usuario);
  if (!doc.disponible && doc.soloNombre) {
    return `<span class="status-pill inactive">Solo nombre: ${limpiar(doc.nombre)}</span>`;
  }
  if (!doc.disponible) {
    return '<span class="status-pill inactive">Sin documento</span>';
  }
  return `<span class="status-pill active">${limpiar(doc.nombre)}</span>`;
}

function renderEstadoValidacionCamara(usuario) {
  if (usuario.tipo_admin !== "Recicladora") return '<span class="text-muted">No aplica</span>';
  if (usuario.registro_incompleto) return '<span class="status-pill inactive">Pendiente por completar</span>';
  const estado = String(usuario.estado_camara_comercio || "pendiente").toLowerCase();
  const activo = estado === "validado";
  const rechazado = estado === "rechazado";
  const clase = activo ? "active" : "inactive";
  const texto = activo ? "Validado" : (rechazado ? "Rechazado" : "Pendiente");
  return `<span class="status-pill ${clase}">${texto}</span>`;
}

function abrirCamaraComercio(idUsuario) {
  const fila = adminTableData.find((row) => Number(row.raw?.id_usuario) === Number(idUsuario));
  const doc = obtenerDocumentoCamara(fila?.raw);
  if (!doc.disponible) {
    alert(doc.soloNombre
      ? `Este registro antiguo solo guardó el nombre del archivo: ${doc.nombre}. Deben volver a cargar el documento real.`
      : "Esta recicladora no tiene documento de Cámara de Comercio cargado.");
    return;
  }
  window.open(doc.contenido, "_blank", "noopener,noreferrer");
}

async function validarCamaraComercio(idUsuario, estadoCamara) {
  const fila = adminTableData.find((row) => Number(row.raw?.id_usuario) === Number(idUsuario));
  if (fila?.raw?.registro_incompleto) {
    alert("Esta cuenta de recicladora aparece en usuarios, pero le faltan los datos empresariales. Debe completar el registro antes de aprobarla.");
    return;
  }
  const accion = estadoCamara === "validado" ? "aprobar" : "rechazar";
  const mensaje = estadoCamara === "validado"
    ? "Antes de aprobar confirma:\n\n1. Abriste el documento.\n2. El NIT coincide con el registrado.\n3. El nombre o razón social coincide.\n4. El documento parece una Cámara de Comercio válida.\n5. Si tienes duda, consultaste el NIT en RUES.\n\n¿Deseas aprobar esta recicladora?"
    : `¿Deseas ${accion} la Cámara de Comercio de esta recicladora? La cuenta quedará inactiva.`;
  if (!(await window.greenupConfirm(mensaje, "Validar recicladora"))) return;
  await apiAdmin(`/api/recicladoras/${idUsuario}/validacion`, {
    method: "PUT",
    body: JSON.stringify({ estado_camara_comercio: estadoCamara }),
  });
  mostrarToast("Validación actualizada", estadoCamara === "validado" ? "La recicladora quedó activa." : "La recicladora quedó inactiva.");
  await cargarUsuarios();
}

async function cambiarEstadoUsuario(idUsuario, idEstado) {
  const activar = Number(idEstado) === 1;
  const accion = activar ? "activar" : "inactivar";
  if (!(await window.greenupConfirm(`¿Deseas ${accion} esta cuenta?`, `${activar ? "Activar" : "Inactivar"} usuario`))) return;

  try {
    await apiAdmin(`/api/usuarios/estado/${idUsuario}`, {
      method: "PUT",
      body: JSON.stringify({ id_estado: idEstado }),
    });
    mostrarToast("Usuario actualizado", `La cuenta quedó ${activar ? "activa" : "inactiva"}.`);
    await cargarUsuarios();
  } catch (error) {
    await window.greenupAlert(error.message || "No fue posible cambiar el estado del usuario.", "No se pudo actualizar");
  }
}

const documentosPosiblesAdmin = [
  /*
    LISTA DE DOCUMENTOS POSIBLES:
    Este arreglo alimenta el desplegable del modal de tipos de documento.
    No reemplaza la tabla de Supabase; solo ayuda a escoger nombres comunes.
  */
  ["", "Selecciona un tipo de documento"],
  ["Cedula de ciudadania", "Cedula de ciudadania"],
  ["Tarjeta de identidad", "Tarjeta de identidad"],
  ["Registro civil", "Registro civil"],
  ["Cedula de extranjeria", "Cedula de extranjeria"],
  ["Pasaporte", "Pasaporte"],
  ["NIT", "NIT"],
  ["Permiso por Proteccion Temporal", "Permiso por Proteccion Temporal"],
  ["Permiso Especial de Permanencia", "Permiso Especial de Permanencia"],
  ["Documento Nacional de Identidad", "Documento Nacional de Identidad"],
  ["Carnet diplomatico", "Carnet diplomatico"],
  ["Licencia de conduccion", "Licencia de conduccion"],
  ["Libreta militar", "Libreta militar"],
  ["Certificado nacido vivo", "Certificado nacido vivo"],
  ["Otro documento", "Otro documento"],
];

const crudConfig = {
  roles: {
    titulo: "Roles del sistema",
    textoNuevo: "Nuevo rol",
    tituloModal: "Crear nuevo rol",
    subtituloModal: "Formulario administrativo para guardar un rol del sistema.",
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
    textoNuevo: "Nuevo tipo de documento",
    tituloModal: "Crear nuevo tipo de documento",
    subtituloModal: "Selecciona un documento sugerido y revisa la descripcion antes de guardar.",
    listar: "/api/tipo-documento/listar",
    crear: "/api/tipo-documento/registrar",
    buscar: "/api/tipo-documento/buscar/",
    actualizar: "/api/tipo-documento/actualizar/",
    inhabilitar: "/api/tipo-documento/inhabilitar/",
    id: "id_tipo_documento",
    columnas: ["ID", "Descripcion", "Estado"],
    campos: [
      {
        id: "tipo_documento_sugerido",
        label: "Tipo de documento",
        type: "select",
        options: documentosPosiblesAdmin,
        omitPayload: true,
        onChange: "completarTipoDocumentoAdmin(this.value)",
        full: true,
      },
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
    columnas: ["ID", "Nombre", "Unidad", "Residuo", "Estado"],
    campos: [
      { id: "nombre", label: "Nombre" },
      { id: "unidad", label: "Unidad", value: "kg" },
      { id: "puntos_por_kg", label: "Valor interno por kg", type: "hidden", value: "0" },
      { id: "id_tipo_residuo", label: "ID tipo residuo", type: "number" },
      { id: "descripcion", label: "Descripcion", type: "textarea", full: true },
    ],
    map: (r) => [r.id_tipo_material, r.nombre, r.unidad, r.id_tipo_residuo, estadoHtml(r.id_estado)],
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
  const datosVisibles = filtrarCatalogoVisible(nombre, datos);
  pintarHero([
    ["Registros", String(datosVisibles.length)],
    ["Activos", String(datosVisibles.filter((x) => Number(x.id_estado) === 1).length)],
  ]);

  adminTableColumns = config.columnas;
  adminTableData = datosVisibles.map((item) => ({
    raw: item,
    values: config.map(item).map((v) => limpiarHtmlPermitido(v)),
    actions: `
      <button class="small-button btn btn-sm btn-outline-secondary" type="button" onclick="editarCrud('${nombre}', ${item[config.id]})">Editar</button>
      ${renderEstadoCrud(nombre, item)}
    `,
  }));

  document.getElementById("admin-content").innerHTML = `
    <section class="content-grid catalog-layout row g-3">
      <article class="data-card card col-12">
        <div class="card-title-row">
          <div>
            <h2>${config.titulo}</h2>
            <p>Registros guardados en Supabase.</p>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <button class="primary-button btn btn-success" type="button" data-bs-toggle="modal" data-bs-target="#modal-${nombre}">
              <span class="material-symbols-outlined">add</span> ${config.textoNuevo || "Nuevo registro"}
            </button>
            <button class="ghost-button btn btn-outline-secondary" type="button" onclick="exportarTablaCSV('${nombre}_greenup.csv')">
              <span class="material-symbols-outlined">download</span> Exportar
            </button>
          </div>
        </div>
        <div id="tabla-admin"></div>
      </article>
    </section>
    ${renderFormModal(`modal-${nombre}`, config.tituloModal || `Crear ${config.titulo}`, config.subtituloModal || "Formulario administrativo para guardar un nuevo registro.", `form-${nombre}`, config.campos, `guardarCrud('${nombre}', event)`, "Guardar")}
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
  const rolProtegido = esRolAdministradorProtegido(nombre, actual);
  for (const campo of config.campos) {
    if (campo.omitPayload) continue;
    if (rolProtegido && campo.id === "id_estado") {
      payload[campo.id] = 1;
      continue;
    }
    const nuevo = await window.greenupPrompt(campo.label, actual[campo.id] ?? "", "Editar registro");
    if (nuevo === null) return;
    payload[campo.id] = normalizarValor(campo, nuevo);
  }
  await apiAdmin(config.actualizar + id, { method: "PUT", body: JSON.stringify(payload) });
  mostrarToast("Registro actualizado", "Los cambios quedaron guardados.");
  await cargarCrud(nombre);
}

function renderEstadoCrud(nombre, item) {
  /*
    BOTON DE ESTADO PARA CATALOGOS:
    Si el registro esta activo mostramos Inactivar.
    Si el registro esta inactivo mostramos Activar.
    Asi no aparecen botones contrarios al estado real de la fila.
  */
  const config = crudConfig[nombre];
  if (esRolAdministradorProtegido(nombre, item)) {
    return `<span class="status-pill active">Siempre activo</span>`;
  }
  const activo = Number(item.id_estado) === 1;
  const siguienteEstado = activo ? 2 : 1;
  const texto = activo ? "Inactivar" : "Activar";
  const clase = activo ? "danger-button btn-outline-danger" : "btn-outline-secondary";
  return `
    <button class="small-button btn btn-sm ${clase}" type="button" onclick="cambiarEstadoCrud('${nombre}', ${item[config.id]}, ${siguienteEstado})">
      ${texto}
    </button>
  `;
}

async function cambiarEstadoCrud(nombre, id, idEstado) {
  const config = crudConfig[nombre];
  if (nombre === "roles") {
    const actual = await apiAdmin(config.buscar + id);
    if (esRolAdministradorProtegido(nombre, actual)) {
      mostrarToast("Rol protegido", "El rol Administrador debe permanecer siempre activo.");
      return;
    }
  }
  const accion = Number(idEstado) === 1 ? "activar" : "inactivar";
  if (!(await window.greenupConfirm(`¿Deseas ${accion} este registro?`, "Actualizar estado"))) return;

  if (config.estado) {
    await apiAdmin(config.estado.replace(":id", id), {
      method: "PUT",
      body: JSON.stringify({ id_estado: idEstado }),
    });
  } else {
    /*
      ROLES Y DOCUMENTOS:
      Esos modulos no tienen ruta /estado. Para activar o inactivar
      usamos la ruta de actualizar conservando los datos actuales.
    */
    const actual = await apiAdmin(config.buscar + id);
    const payload = {};
    for (const campo of config.campos) {
      if (campo.omitPayload) continue;
      payload[campo.id] = campo.id === "id_estado" ? idEstado : actual[campo.id];
    }
    await apiAdmin(config.actualizar + id, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  mostrarToast("Estado actualizado", `El registro fue ${Number(idEstado) === 1 ? "activado" : "inactivado"} correctamente.`);
  await cargarCrud(nombre);
}

function esRolAdministradorProtegido(nombreModulo, item) {
  /*
    ROL ADMINISTRADOR PROTEGIDO:
    El rol principal del sistema no se debe inactivar porque controla
    el acceso al panel administrativo.
  */
  if (nombreModulo !== "roles") return false;
  const nombreRol = String(item.nombre || "").trim().toLowerCase();
  return Number(item.id_rol) === 1 || nombreRol === "administrador";
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
    <div class="toolbar d-flex flex-wrap align-items-center">
      <a class="primary-button btn btn-success" href="admin_mapa.html">
        <span class="material-symbols-outlined">map</span> Ver mapa
      </a>
      <button class="ghost-button btn btn-outline-secondary" type="button" onclick="cargarPuntos()">
        <span class="material-symbols-outlined">sync</span> Actualizar puntos
      </button>
    </div>
    <article class="data-card card">
      <div class="card-title-row">
        <div>
          <h2>Puntos ecologicos registrados</h2>
          <p>El administrador controla el estado de los puntos existentes.</p>
        </div>
        <button class="ghost-button btn btn-outline-secondary" type="button" onclick="exportarTablaCSV('puntos_greenup.csv')">
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
    <button class="small-button btn btn-sm ${activo ? "danger-button btn-outline-danger" : "btn-outline-secondary"}" type="button" onclick="cambiarEstadoPunto(${punto.id_punto}, ${siguiente})">
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
    <!-- MAPA ADMIN: usa Leaflet como el mapa ciudadano, pero con panel fijo para administracion. -->
    <section class="map-shell">
      <!-- PANEL FIJO DE PUNTOS: no flota sobre el mapa; permite revisar puntos reales de Supabase. -->
      <aside id="sidebar-panel">
        <div class="sidebar-map-header">
          <h3><span class="material-symbols-outlined">recycling</span>Puntos ecologicos</h3>
        </div>
        <div id="recycling-list"></div>
        <div class="sidebar-map-footer">
          <button class="primary-button btn btn-success" type="button" onclick="actualizarPuntosMapa(true)">
            <span class="material-symbols-outlined">sync</span> Actualizar puntos
          </button>
        </div>
      </aside>

      <!-- AREA DEL MAPA: mantiene el mapa independiente del panel y evita que la lista se mueva encima. -->
      <div class="map-canvas-wrap">
        <!-- CONTENEDOR DEL MAPA: se llama eco-map para mantener el mismo patron de ciudadano. -->
        <div id="eco-map"></div>

        <!-- BOTONES FLOTANTES: todos ejecutan acciones reales sobre el mapa. -->
        <div class="map-floating-controls">
          <button class="icon-button" type="button" onclick="centerMap()" title="Centrar mi ubicacion">
            <span class="material-symbols-outlined">my_location</span>
          </button>
          <button class="icon-button" type="button" onclick="adminMap.zoomIn()" title="Acercar mapa">
            <span class="material-symbols-outlined">add</span>
          </button>
          <button class="icon-button" type="button" onclick="adminMap.zoomOut()" title="Alejar mapa">
            <span class="material-symbols-outlined">remove</span>
          </button>
          <a class="icon-button" href="admin_puntos_reciclaje.html" title="Ver tabla de puntos">
            <span class="material-symbols-outlined">table</span>
          </a>
        </div>
      </div>
    </section>
  `;

  await asegurarLeaflet();
  iniciarMapaLeaflet();
  await pintarPuntosMapa(puntos, true);
  iniciarGeolocalizacionAdmin();
}

function iniciarMapaLeaflet() {
  /*
    Mapa igual al de ciudadano: Leaflet, OpenStreetMap, sin zoom nativo
    porque usamos botones flotantes propios del panel.
  */
  if (adminMap) {
    adminMap.remove();
    adminMarkers.clear();
  }
  adminRouteControl = null;
  adminRouteLines = [];
  adminMap = L.map("eco-map", { zoomControl: false, attributionControl: false }).setView([10.4631, -73.2532], 13);
  window.adminMap = adminMap;
  window.map = adminMap;

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "OpenStreetMap contributors",
  }).addTo(adminMap);
}

async function actualizarPuntosMapa(manual = false) {
  const puntos = await apiAdmin("/ubicaciones");
  await pintarPuntosMapa(puntos, false);
  if (manual) mostrarToast("Mapa actualizado", "Los puntos fueron consultados nuevamente.");
}

function crearIconoPuntoAdmin(color, activo = true) {
  return L.divIcon({
    className: "greenup-recycling-marker",
    html: `
      <span class="admin-map-pin ${activo ? "is-active" : "is-inactive"}" style="--pin-color:${color}">
        <span class="material-symbols-outlined filled">recycling</span>
      </span>
    `,
    iconSize: [36, 44],
    iconAnchor: [18, 42],
    popupAnchor: [0, -40],
  });
}

async function pintarPuntosMapa(puntos, ajustarVista = false) {
  if (!adminMap) return;
  const bounds = [];
  const lista = document.getElementById("recycling-list");
  if (lista) lista.innerHTML = "";

  if (adminLastPointCount !== null && puntos.length > adminLastPointCount) {
    notificarAdmin("Nuevo punto ecologico", "El mapa del administrador ya fue actualizado.");
  }
  adminLastPointCount = puntos.length;

  for (const punto of puntos) {
    const coords = await coordenadasPunto(punto);
    if (!coords) continue;

    bounds.push([coords.lat, coords.lng]);
    const color = Number(punto.id_estado) === 1 ? "#296c1f" : "#68717b";
    const popupHtml = `
      <!-- POPUP DEL PUNTO: muestra informacion real de Supabase. -->
      <div style="min-width:180px">
        <strong style="color:${color}">${limpiar(punto.nombre)}</strong><br>
        <span>${limpiar(punto.direccion)}</span><br>
        <span>${limpiar(punto.horario || "Horario por confirmar")}</span><br>
        ${estadoHtml(punto.id_estado)}
        <button class="route-button" onclick="trazarRutaAdmin(${coords.lat}, ${coords.lng})">Como llegar</button>
      </div>
    `;

    let marker = adminMarkers.get(punto.id_punto);
    const iconoPunto = crearIconoPuntoAdmin(color, Number(punto.id_estado) === 1);
    if (marker) {
      marker.setLatLng([coords.lat, coords.lng]).setIcon(iconoPunto).setPopupContent(popupHtml);
    } else {
      marker = L.marker([coords.lat, coords.lng], { icon: iconoPunto }).addTo(adminMap).bindPopup(popupHtml);
      adminMarkers.set(punto.id_punto, marker);
    }

    if (lista) lista.appendChild(renderPuntoSidebar(punto, coords, marker));
  }

  if (lista && !lista.children.length) {
    lista.innerHTML = `<div class="empty-state"><div><span class="material-symbols-outlined">location_off</span><strong>No hay puntos con ubicacion</strong><p>Cuando existan puntos en Supabase apareceran aqui.</p></div></div>`;
  }

  if (ajustarVista && bounds.length) adminMap.fitBounds(bounds, { padding: [40, 40] });
}


function renderPuntoSidebar(punto, coords, marker) {
  /* CARTA DEL MAPA: boton funcional para centrar el punto y abrir su popup. */
  const item = document.createElement("button");
  item.type = "button";
  item.className = "gu-sidebar-item";
  item.innerHTML = `
    <span class="point-icon"><span class="material-symbols-outlined">location_on</span></span>
    <span class="point-info">
      <strong>${limpiar(punto.nombre)}</strong>
      <span>${limpiar(punto.direccion)}</span>
      <span>${Number(punto.id_estado) === 1 ? "Activo" : "Inactivo"}</span>
    </span>
  `;
  item.addEventListener("click", () => {
    adminMap.setView([coords.lat, coords.lng], 16, { animate: true });
    setTimeout(() => marker.openPopup(), 250);
    if (window.innerWidth < 900) document.getElementById("eco-map")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  return item;
}

function toggleSidebarAdmin() {
  const sidebar = document.getElementById("sidebar-panel");
  if (!sidebar) return;
  sidebar.classList.toggle("collapsed");
  setTimeout(() => adminMap?.invalidateSize(), 300);
}
async function coordenadasPunto(punto) {
  /*
    Ubicacion de puntos para el mapa admin.
    1. Si Supabase trae latitud/longitud validas dentro de Valledupar, se usan.
    2. Si no, se geocodifica la direccion limitando la busqueda a Valledupar.
    3. Si el servicio no encuentra nada, se ubica cerca del centro para no mandar
       el mapa a otro pais o al mar.
  */
  const lat = Number(punto.latitud);
  const lng = Number(punto.longitud);
  if (coordenadaEnValledupar(lat, lng)) return { lat, lng };

  const clave = "greenup_geo_admin_v2_" + punto.id_punto;
  const guardado = localStorage.getItem(clave);
  if (guardado) {
    const coordsGuardadas = JSON.parse(guardado);
    if (coordenadaEnValledupar(coordsGuardadas.lat, coordsGuardadas.lng)) return coordsGuardadas;
  }

  if (punto.direccion) {
    const consulta = encodeURIComponent(`${punto.direccion}, Valledupar, Cesar, Colombia`);
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&bounded=1&viewbox=-73.36,10.57,-73.16,10.36&q=${consulta}`;
    const respuesta = await fetch(url);
    const datos = await respuesta.json();
    if (datos.length) {
      const coords = { lat: Number(datos[0].lat), lng: Number(datos[0].lon) };
      if (coordenadaEnValledupar(coords.lat, coords.lng)) {
        localStorage.setItem(clave, JSON.stringify(coords));
        return coords;
      }
    }
  }

  const fallback = coordenadaFallbackValledupar(punto.id_punto || 1);
  localStorage.setItem(clave, JSON.stringify(fallback));
  return fallback;
}

function coordenadaEnValledupar(lat, lng) {
  /* Rango aproximado de Valledupar para evitar que el mapa se vaya al mar. */
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= 10.35 && lat <= 10.58 && lng >= -73.36 && lng <= -73.12;
}

function coordenadaFallbackValledupar(id) {
  /* Coordenada segura cuando no hay lat/lng ni geocodificacion confiable. */
  const centro = { lat: 10.4631, lng: -73.2532 };
  const paso = Number(id) || 1;
  return {
    lat: centro.lat + ((paso % 7) - 3) * 0.006,
    lng: centro.lng + ((paso % 5) - 2) * 0.006,
  };
}

function iniciarGeolocalizacionAdmin() {
  /* GEOLOCALIZACION EN TIEMPO REAL: actualiza la ubicacion del administrador. */
  if (!navigator.geolocation || !adminMap) return;
  if (adminWatchId) navigator.geolocation.clearWatch(adminWatchId);

  adminWatchId = navigator.geolocation.watchPosition(
    (posicion) => {
      adminUserLocation = [posicion.coords.latitude, posicion.coords.longitude];
      if (!adminUserMarker) {
        const userIcon = L.divIcon({
          className: "custom-user-icon",
          html: `<div style="background-color:#007bff;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(0,0,0,.45);"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        adminUserMarker = L.marker(adminUserLocation, { icon: userIcon }).addTo(adminMap).bindPopup("Tu estas aqui");
      } else {
        adminUserMarker.setLatLng(adminUserLocation);
      }
      if (adminRouteMode === "foot" && adminRouteDestination) {
        const movio = !adminLastWalkingRoute || distanciaAdminKm(adminLastWalkingRoute, adminUserLocation) >= 0.02;
        const espero = Date.now() - adminWalkingUpdateAt >= 12000;
        if (movio && espero) {
          adminLastWalkingRoute = [...adminUserLocation];
          adminWalkingUpdateAt = Date.now();
          actualizarRutaSeleccionadaAdmin(false);
        }
      }
    },
    () => mostrarToast("Ubicacion", "No fue posible obtener tu ubicacion actual."),
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 },
  );
}

function centerMap() {
  if (adminUserLocation && adminMap) {
    adminMap.setView(adminUserLocation, 15, { animate: true });
    adminUserMarker?.openPopup();
  } else {
    iniciarGeolocalizacionAdmin();
    mostrarToast("Ubicacion", "Solicitando ubicacion del navegador.");
  }
}

function centrarUbicacionAdmin() {
  centerMap();
}

function limpiarRutasAdmin() {
  adminRouteLines.forEach((linea) => {
    if (adminMap && linea) adminMap.removeLayer(linea);
  });
  adminRouteLines = [];

}

function distanciaAdminKm(origen, destino) {
  const rad = (valor) => valor * Math.PI / 180;
  const dLat = rad(destino[0] - origen[0]);
  const dLng = rad(destino[1] - origen[1]);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(origen[0])) * Math.cos(rad(destino[0])) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function obtenerRutaAdmin(modo) {
  const puntos = `${adminUserLocation[1]},${adminUserLocation[0]};${adminRouteDestination[1]},${adminRouteDestination[0]}`;
  const respuesta = await fetch(`${modo.url}/driving/${puntos}?alternatives=false&overview=full&geometries=geojson`);
  const datos = await respuesta.json();
  const ruta = datos.routes?.[0];
  if (!respuesta.ok || !ruta) throw new Error(`No se pudo calcular ${modo.label.toLowerCase()}`);
  return { modo, distancia: ruta.distance, duracion: ruta.duration, coordenadas: ruta.geometry.coordinates.map(([lng, lat]) => [lat, lng]) };
}

async function actualizarRutaSeleccionadaAdmin(ajustar = true) {
  const modo = ADMIN_ROUTE_MODES.find((item) => item.id === adminRouteMode);
  if (!modo || !adminRouteDestination || !adminUserLocation) return;
  try {
    const ruta = await obtenerRutaAdmin(modo);
    limpiarRutasAdmin();
    const linea = L.polyline(ruta.coordenadas, { color: modo.color, weight: 7, opacity: 0.92 }).addTo(adminMap);
    adminRouteLines.push(linea);
    if (ajustar) adminMap.fitBounds(linea.getBounds(), { padding: [45, 45], maxZoom: 17 });
    const tarjeta = document.querySelector(`[data-admin-route-mode="${modo.id}"]`);
    if (tarjeta) tarjeta.querySelector("small").textContent = `${Math.max(1, Math.round(ruta.duracion / 60))} min · ${(ruta.distancia / 1000).toFixed(1)} km`;
  } catch (error) {
    mostrarToast("Ruta", error.message);
  }
}

async function trazarRutaAdmin(destinoLat, destinoLng) {
  if (!adminUserLocation) {
    mostrarToast("Ruta", "Primero permite la ubicacion para calcular la ruta.");
    return;
  }
  adminRouteDestination = [Number(destinoLat), Number(destinoLng)];
  let panel = document.getElementById("admin-routes-panel");
  if (!panel) {
    panel = document.createElement("section");
    panel.id = "admin-routes-panel";
    panel.className = "admin-routes-panel";
    document.body.appendChild(panel);
  }
  panel.innerHTML = `<div class="admin-routes-head"><div><strong>Rutas por transporte</strong><small>Selecciona cómo vas a llegar</small></div><button type="button" aria-label="Cerrar rutas">×</button></div><div class="admin-routes-options">${ADMIN_ROUTE_MODES.map((modo) => `<button type="button" data-admin-route-mode="${modo.id}" class="${modo.id === adminRouteMode ? "is-selected" : ""}"><span class="material-symbols-outlined">${modo.icon}</span><strong>${modo.label}</strong><small>Calculando…</small></button>`).join("")}</div>`;
  panel.querySelector(".admin-routes-head button").addEventListener("click", () => {
    limpiarRutasAdmin(); adminRouteDestination = null; panel.remove();
  });
  panel.querySelectorAll("[data-admin-route-mode]").forEach((boton) => boton.addEventListener("click", async () => {
    adminRouteMode = boton.dataset.adminRouteMode;
    panel.querySelectorAll("[data-admin-route-mode]").forEach((item) => item.classList.toggle("is-selected", item === boton));
    adminLastWalkingRoute = adminRouteMode === "foot" ? [...adminUserLocation] : null;
    adminWalkingUpdateAt = Date.now();
    await actualizarRutaSeleccionadaAdmin();
  }));
  const resultados = await Promise.allSettled(ADMIN_ROUTE_MODES.map(obtenerRutaAdmin));
  resultados.forEach((resultado) => {
    if (resultado.status !== "fulfilled") return;
    const ruta = resultado.value;
    const tarjeta = panel.querySelector(`[data-admin-route-mode="${ruta.modo.id}"] small`);
    if (tarjeta) tarjeta.textContent = `${Math.max(1, Math.round(ruta.duracion / 60))} min · ${(ruta.distancia / 1000).toFixed(1)} km`;
  });
  await actualizarRutaSeleccionadaAdmin();
}

function cargarRecursoCss(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = href;
  document.head.appendChild(css);
}

function cargarScript(src) {
  return new Promise((resolve, reject) => {
    const existente = document.querySelector(`script[src="${src}"]`);
    if (existente) return resolve();
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error("No se pudo cargar " + src));
    document.head.appendChild(script);
  });
}

async function asegurarLeaflet() {
  /* Carga Leaflet y Leaflet Routing Machine, igual que el mapa ciudadano. */
  cargarRecursoCss("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
  cargarRecursoCss("https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css");
  if (!window.L) await cargarScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
  if (!L.Routing) await cargarScript("https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.js");
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
    values: [r.id_registro, r.cantidad, r.id_usuario, r.id_tipo_material, r.id_punto, limpiar(r.fecha_hora), estadoReciclajeHtml(r)],
    actions: '<span class="text-muted">La recicladora valida la entrega</span>',
  }));
  document.getElementById("admin-content").innerHTML = renderTableCard("Registros de reciclaje", "Datos reportados en el sistema.", "reciclaje_greenup.csv");
  pintarTablaActual();
}

function filtrarCatalogoVisible(nombre, datos) {
  /*
    FILTRO VISUAL DE CATALOGOS:
    En la tabla de roles no mostramos el rol Administrador porque es
    interno del sistema y debe permanecer activo sin modificarse desde aqui.
  */
  if (nombre !== "roles") return datos;
  return datos.filter((item) => !esRolAdministradorProtegido(nombre, item));
}

function renderEstadoReciclaje(registro) {
  /*
    BOTON DE ESTADO PARA REGISTROS:
    El administrador ve una sola accion: Inactivar si esta activo,
    o Activar si ya estaba inactivo.
  */
  const activo = Number(registro.id_estado) === 1;
  const siguienteEstado = activo ? 2 : 1;
  const texto = activo ? "Inactivar" : "Activar";
  const clase = activo ? "danger-button btn-outline-danger" : "btn-outline-secondary";
  return `
    <button class="small-button btn btn-sm ${clase}" type="button" onclick="cambiarEstadoReciclaje(${registro.id_registro}, ${siguienteEstado})">
      ${texto}
    </button>
  `;
}

async function cambiarEstadoReciclaje(idRegistro, idEstado) {
  await apiAdmin(`/reciclaje/${idRegistro}/estado`, {
    method: "PUT",
    body: JSON.stringify({ id_estado: idEstado }),
  });
  mostrarToast("Registro actualizado", "El estado de reciclaje fue actualizado.");
  await cargarReciclaje();
}

async function cargarReportes(filtros = {}) {
  /*
    REPORTES DEL ADMINISTRADOR:
    Carga informacion real de reciclaje y aplica filtros desde el backend.
  */
  const query = construirQueryReporte(filtros);
  const resultados = await Promise.allSettled([
    apiAdmin(`/reportes/reciclaje${query}`),
    apiAdmin("/api/usuarios/listar"),
    apiAdmin("/materiales"),
    apiAdmin("/ubicaciones"),
  ]);
  const datos = listaSegura(resultados[0]);
  const usuarios = listaSegura(resultados[1]);
  const materiales = listaSegura(resultados[2]);
  const puntos = listaSegura(resultados[3]);
  pintarHero([
    ["Filas", String(datos.length)],
    ["Formato", "CSV/Excel/PDF"],
  ]);
  adminTableColumns = ["ID", "Fecha", "Usuario", "Material", "Residuo", "Punto", "Cantidad", "Estado"];
  adminTableData = datos.map((fila) => ({
    raw: fila,
    values: [
      fila.id_registro,
      limpiar(formatearFechaAdmin(fila.fecha_hora)),
      limpiar(fila.usuario_nombre || fila.usuario || "Sin usuario"),
      limpiar(fila.material || "Sin material"),
      limpiar(fila.residuo || "Sin residuo"),
      limpiar(fila.punto || "Sin punto"),
      limpiar(fila.cantidad),
      estadoReciclajeHtml(fila),
    ],
    actions: "",
  }));
  document.getElementById("admin-content").innerHTML = `
    <!-- FILTROS DEL REPORTE: reducen la informacion antes de exportarla. -->
    <form class="toolbar admin-report-filters" onsubmit="aplicarFiltrosReporteAdmin(event)">
      <!-- Campo fecha inicial: permite buscar reportes desde una fecha concreta. -->
      <label class="report-filter-field">
        <span class="form-label">Fecha inicial</span>
        <input id="reporte-fecha-inicio" class="form-control" type="date" value="${limpiar(filtros.fecha_inicio || "")}">
      </label>
      <!-- Campo fecha final: cierra el rango de fechas del reporte. -->
      <label class="report-filter-field">
        <span class="form-label">Fecha final</span>
        <input id="reporte-fecha-fin" class="form-control" type="date" value="${limpiar(filtros.fecha_fin || "")}">
      </label>
      <!-- Campo usuario: filtra los reportes por ciudadano registrado. -->
      <label class="report-filter-field">
        <span class="form-label">Usuario</span>
        <select id="reporte-usuario" class="form-select">
          ${opcionesSelectReporte(usuarios, "id_usuario", (u) => `${u.nombres || ""} ${u.apellidos || ""}`.trim() || u.usuario, filtros.id_usuario)}
        </select>
      </label>
      <!-- Campo material: muestra solo los reportes de un material reciclable. -->
      <label class="report-filter-field">
        <span class="form-label">Material</span>
        <select id="reporte-material" class="form-select">
          ${opcionesSelectReporte(materiales, "id_tipo_material", (m) => m.nombre, filtros.id_tipo_material)}
        </select>
      </label>
      <!-- Campo punto: permite revisar reportes de un punto ecologico especifico. -->
      <label class="report-filter-field">
        <span class="form-label">Punto</span>
        <select id="reporte-punto" class="form-select">
          ${opcionesSelectReporte(puntos, "id_punto", (p) => p.nombre, filtros.id_punto)}
        </select>
      </label>
      <!-- Campo estado: separa reportes activos e inactivos. -->
      <label class="report-filter-field">
        <span class="form-label">Estado</span>
        <select id="reporte-estado" class="form-select">
          <option value="">Todos</option>
          <option value="1" ${String(filtros.id_estado || "") === "1" ? "selected" : ""}>Activo</option>
          <option value="2" ${String(filtros.id_estado || "") === "2" ? "selected" : ""}>Inactivo</option>
        </select>
      </label>
      <!-- Botones del filtro: aplican o limpian los datos seleccionados. -->
      <div class="report-filter-actions">
        <button class="primary-button btn btn-success" type="submit">
          <span class="material-symbols-outlined">filter_alt</span> Aplicar filtros
        </button>
        <button class="ghost-button btn btn-outline-secondary" type="button" onclick="limpiarFiltrosReporteAdmin()">
          <span class="material-symbols-outlined">mop</span> Limpiar filtros
        </button>
      </div>
    </form>

    <!-- EXPORTACIONES: usan la tabla filtrada que esta viendo el administrador. -->
    <div class="toolbar d-flex flex-wrap align-items-center">
      <button class="primary-button btn btn-success" type="button" onclick="descargarReporteAdmin('csv')">
        <span class="material-symbols-outlined">download</span> Exportar CSV
      </button>
      <button class="ghost-button btn btn-outline-secondary" type="button" onclick="descargarReporteAdmin('excel')">
        <span class="material-symbols-outlined">grid_on</span> Exportar Excel
      </button>
      <button class="ghost-button btn btn-outline-secondary" type="button" onclick="descargarReporteAdmin('pdf')">
        <span class="material-symbols-outlined">picture_as_pdf</span> Descargar PDF
      </button>
      <button class="ghost-button btn btn-outline-secondary" type="button" onclick="cargarReportes()">
        <span class="material-symbols-outlined">sync</span> Actualizar
      </button>
    </div>
    ${renderTableCard("Reporte de reciclaje", "Informacion real almacenada en Supabase.", "reporte_reciclaje_greenup.csv")}
  `;
  pintarTablaActual(adminTableData, {
    icon: "summarize",
    title: "No hay reportes para mostrar.",
    text: "Aun no existen reportes de reciclaje con los filtros seleccionados.",
  });
}

function construirQueryReporte(filtros) {
  /*
    QUERY STRING:
    Convierte los filtros del formulario en parametros para el backend.
  */
  const params = new URLSearchParams();
  Object.entries(filtros || {}).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && String(valor).trim() !== "") {
      params.set(clave, String(valor).trim());
    }
  });
  const texto = params.toString();
  return texto ? `?${texto}` : "";
}

function opcionesSelectReporte(datos, idCampo, textoCampo, seleccionado) {
  /*
    OPCIONES DE FILTRO:
    Crea los option de usuarios, materiales y puntos para el reporte.
  */
  const actual = String(seleccionado || "");
  const opciones = datos.map((item) => {
    const valor = String(item[idCampo] || "");
    const texto = limpiar(textoCampo(item) || valor);
    const selected = valor === actual ? "selected" : "";
    return `<option value="${limpiar(valor)}" ${selected}>${texto}</option>`;
  }).join("");
  return `<option value="">Todos</option>${opciones}`;
}

function leerFiltrosReporteAdmin() {
  /*
    LECTURA DE FILTROS:
    Toma los valores escritos por el administrador en el formulario.
  */
  return {
    fecha_inicio: document.getElementById("reporte-fecha-inicio")?.value || "",
    fecha_fin: document.getElementById("reporte-fecha-fin")?.value || "",
    id_usuario: document.getElementById("reporte-usuario")?.value || "",
    id_tipo_material: document.getElementById("reporte-material")?.value || "",
    id_punto: document.getElementById("reporte-punto")?.value || "",
    id_estado: document.getElementById("reporte-estado")?.value || "",
  };
}

async function aplicarFiltrosReporteAdmin(evento) {
  evento.preventDefault();
  await cargarReportes(leerFiltrosReporteAdmin());
}

async function limpiarFiltrosReporteAdmin() {
  await cargarReportes({});
}

async function descargarReporteAdmin(formato) {
  /*
    DESCARGA REAL DEL REPORTE:
    Pide el archivo al backend para que PDF y Excel salgan desde Supabase,
    no desde datos escritos manualmente en el HTML.
  */
  const filtros = leerFiltrosReporteAdmin();
  const query = construirQueryReporte({ ...filtros, formato });
  const extension = formato === "excel" ? "xlsx" : formato;

  try {
    const respuesta = await fetch(`${ADMIN_API_BASE}/reportes/reciclaje${query}`, {
      headers: headersAdmin(),
    });

    if (!respuesta.ok) {
      const error = await respuesta.json().catch(() => ({}));
      throw new Error(error.mensaje || "No fue posible descargar el reporte.");
    }

    const archivo = await respuesta.blob();
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(archivo);
    enlace.download = `reporte_reciclaje_greenup.${extension}`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
  } catch (error) {
    mostrarToast("Reporte", error.message || "No fue posible generar el archivo.");
  }
}

async function cargarNovedades() {
  const resultados = await Promise.allSettled([
    apiAdmin("/novedades"),
    apiAdmin("/api/noticias/ambientales?pagina=1&por_pagina=4"),
  ]);
  const datos = listaSegura(resultados[0]);
  const noticiasAmbientales = objetoSeguro(resultados[1]);
  pintarHero([
    ["Noticias", String(datos.length)],
    ["Activas", String(datos.filter((n) => Number(n.id_estado) === 1).length)],
  ]);
  document.getElementById("admin-content").innerHTML = `
    <section class="content-grid content-layout row g-3">
      <article class="data-card card col-12 col-xl-7">
        <div class="card-title-row">
          <div>
            <h2>Noticias publicadas</h2>
            <p>Se muestran solo registros existentes.</p>
          </div>
          <div class="d-flex gap-2 flex-wrap">
            <button class="primary-button btn btn-success" type="button" data-bs-toggle="modal" data-bs-target="#modal-novedad">
              <span class="material-symbols-outlined">add</span> Nueva noticia
            </button>
          </div>
        </div>
        ${renderNewsGrid(datos)}
      </article>
      <article class="data-card card col-12">
        <div class="card-title-row">
          <div>
            <h2>Noticias ambientales externas</h2>
            <p>Feed de noticias disponible para admin, recicladora y ciudadano.</p>
          </div>
        </div>
        ${renderNoticiasAmbientalesAdmin(noticiasAmbientales.noticias || [])}
      </article>
      <article class="data-card card col-12">
        <div class="card-title-row">
          <div>
            <h2>Lecturas y juegos de noticias</h2>
            <p>Seguimiento educativo sin recompensas ni puntos activos.</p>
          </div>
        </div>
        <div id="tabla-puntajes-juego-admin">${renderEmpty("leaderboard", "Cargando puntajes...", "Espera un momento.")}</div>
      </article>
    </section>
    ${renderFormModal("modal-novedad", "Publicar noticia", "Contenido visible para la comunidad.", "form-novedad", [
    { id: "titulo", label: "Titulo" },
    { id: "imagen", label: "URL de imagen" },
    { id: "descripcion", label: "Descripcion", type: "textarea", full: true },
  ], "guardarNovedad(event)", "Publicar")}
  `;
  await cargarPuntajesJuegoAdmin();
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

function renderForoGridAdmin(temas) {
  if (!temas.length) return renderEmpty("forum", "No hay temas publicados.", "Cuando la comunidad publique aparecerá aquí.");
  return `
    <div class="news-grid">
      ${temas.slice(0, 4).map((tema) => `
        <article class="news-card card">
          <div class="news-body">
            <h3>${limpiar(tema.titulo)}</h3>
            <p>${limpiar(tema.contenido)}</p>
            <p>${limpiar(tema.autor || "Comunidad")} · ${limpiar(tema.tipo_publicacion || "tema")}</p>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderNoticiasAmbientalesAdmin(noticias) {
  if (!noticias.length) return renderEmpty("newspaper", "No hay noticias ambientales.", "Cuando la API responda verás noticias aquí.");
  return `
    <div class="news-grid">
      ${noticias.map((noticia) => `
        <article class="news-card card">
          <div class="news-image">
            ${noticia.imagen ? `<img src="${limpiar(noticia.imagen)}" alt="${limpiar(noticia.titulo)}">` : ""}
          </div>
          <div class="news-body">
            <h3>${limpiar(noticia.titulo)}</h3>
            <p>${limpiar(noticia.descripcion || "")}</p>
            <p>${limpiar(noticia.fuente || "GreenUp")} · ${limpiar(noticia.categoria || "Ambiental")}</p>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

async function guardarTemaForoAdmin(evento) {
  evento.preventDefault();
  const payload = {
    tipo_publicacion: document.getElementById("foro_tipo_publicacion")?.value || "tema",
    titulo: document.getElementById("foro_titulo")?.value || "",
    imagen: document.getElementById("foro_imagen")?.value || "",
    contenido: document.getElementById("foro_contenido")?.value || "",
  };
  await apiAdmin("/api/comunidad/foro", { method: "POST", body: JSON.stringify(payload) });
  mostrarToast("Foro actualizado", "El tema fue publicado correctamente.");
  await cargarNovedades();
}

async function cargarPuntajesJuegoAdmin() {
  const contenedor = document.getElementById("tabla-puntajes-juego-admin");
  if (!contenedor) return;
  try {
    const datos = await apiAdmin("/api/comunidad/juego/puntajes");
    if (!datos.length) {
      contenedor.innerHTML = renderEmpty("leaderboard", "No hay puntajes registrados.", "Cuando un ciudadano responda noticias, aparecerá aquí.");
      return;
    }
    contenedor.innerHTML = tablaDatos(
      ["Ciudadano", "Usuario", "Noticias completadas", "Ultima actualizacion"],
      datos.map((item) => [
        item.ciudadano,
        item.usuario,
        item.noticias_completadas,
        formatearFechaAdmin(item.ultima_actualizacion),
      ]),
    );
  } catch (error) {
    contenedor.innerHTML = renderEmpty("leaderboard", "No fue posible cargar puntajes.", "Revisa la conexión del backend.");
  }
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
    <section class="content-grid content-layout row g-3">
      <article class="data-card card col-12">
        <div class="card-title-row">
          <div><h2>Preguntas registradas</h2><p>Datos reales desde Supabase.</p></div>
          <button class="primary-button btn btn-success" type="button" data-bs-toggle="modal" data-bs-target="#modal-faq">
            <span class="material-symbols-outlined">add</span> Nueva pregunta
          </button>
        </div>
        <div id="tabla-admin"></div>
      </article>
    </section>
    ${renderFormModal("modal-faq", "Nueva pregunta", "Respuesta visible para usuarios.", "form-faq", [
    { id: "pregunta", label: "Pregunta", full: true },
    { id: "categoria", label: "Categoria" },
    { id: "orden", label: "Orden", type: "number" },
    { id: "respuesta", label: "Respuesta", type: "textarea", full: true },
  ], "guardarFaq(event)", "Guardar")}
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
    <section class="content-grid content-layout row g-3">
      <article class="data-card card col-12">
        <div class="card-title-row">
          <div><h2>Contenido registrado</h2><p>Material publicado o en gestion.</p></div>
          <button class="primary-button btn btn-success" type="button" data-bs-toggle="modal" data-bs-target="#modal-contenido">
            <span class="material-symbols-outlined">add</span> Nuevo contenido
          </button>
        </div>
        <div id="tabla-admin"></div>
      </article>
    </section>
    ${renderFormModal("modal-contenido", "Nuevo contenido", "Recurso educativo para GreenUp.", "form-contenido", [
    { id: "titulo", label: "Titulo" },
    { id: "tipo", label: "Tipo", type: "select", options: [["articulo", "Articulo"], ["video", "Video"], ["infografia", "Infografia"]] },
    { id: "url_recurso", label: "URL recurso" },
    { id: "imagen", label: "URL imagen" },
    { id: "descripcion", label: "Descripcion", type: "textarea", full: true },
  ], "guardarContenido(event)", "Guardar")}
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
  const resultados = await Promise.allSettled([
    apiAdmin("/estadisticas"),
    apiAdmin("/api/usuarios/listar"),
    apiAdmin("/ubicaciones"),
    apiAdmin("/api/recicladoras/listar"),
  ]);
  const estadisticas = resultados[0].status === "fulfilled" && resultados[0].value
    ? resultados[0].value
    : {};
  const usuarios = resultados[1].status === "fulfilled" && Array.isArray(resultados[1].value)
    ? resultados[1].value
    : [];
  const puntos = resultados[2].status === "fulfilled" && Array.isArray(resultados[2].value)
    ? resultados[2].value
    : [];
  let recicladoras = resultados[3].status === "fulfilled" && Array.isArray(resultados[3].value)
    ? resultados[3].value
    : [];
  if (!recicladoras.length && usuarios.length) {
    recicladoras = usuarios.filter((usuario) => Number(usuario.id_rol) === 2);
  }
  const erroresEstadisticas = resultados
    .filter((resultado) => resultado.status === "rejected")
    .map((resultado) => resultado.reason?.message || "No se pudo cargar una seccion");
  if (erroresEstadisticas.length) {
    console.warn("Secciones de estadisticas no cargadas:", erroresEstadisticas);
  }
  pintarHero([
    ["Reciclajes", String(estadisticas.total_reciclajes || 0)],
    ["Kg", String(estadisticas.total_cantidad || 0)],
  ]);
  document.getElementById("admin-content").innerHTML = `
    <section class="metrics-grid stats-metrics-grid row g-3">
      ${metric("recycling", estadisticas.total_reciclajes || 0, "Registros reciclaje", "Total de movimientos")}
      ${metric("scale", estadisticas.total_cantidad || 0, "Cantidad reciclada", "Suma total reportada", "blue")}
      ${metric("groups", estadisticas.total_usuarios || usuarios.length, "Usuarios", "Cuentas en el sistema")}
      ${metric("location_on", estadisticas.total_puntos || puntos.length, "Puntos", `${recicladoras.length} recicladoras`, "blue")}
    </section>

    <!-- ESTADISTICAS POR RESIDUO: ayuda a cumplir el requisito RF012. -->
    <section class="content-grid row g-3">
      <article class="data-card card col-12 col-xl-6">
        <div class="card-title-row">
          <div>
            <h2>Reciclaje por residuo</h2>
            <p>Total agrupado por tipo de residuo.</p>
          </div>
        </div>
        ${tablaIndicadoresAdmin(["Residuo", "Cantidad"], estadisticas.reciclaje_por_residuo)}
      </article>

      <!-- ESTADISTICAS POR MATERIAL: muestra que materiales se reciclan mas. -->
      <article class="data-card card col-12 col-xl-6">
        <div class="card-title-row">
          <div>
            <h2>Reciclaje por material</h2>
            <p>Materiales con mayor cantidad registrada.</p>
          </div>
        </div>
        ${tablaIndicadoresAdmin(["Material", "Cantidad"], estadisticas.reciclaje_por_material)}
      </article>

      <!-- RANKING DE USUARIOS: identifica usuarios mas activos. -->
      <article class="data-card card col-12 col-xl-6">
        <div class="card-title-row">
          <div>
            <h2>Ranking de usuarios</h2>
            <p>Usuarios con mas reciclaje acumulado.</p>
          </div>
        </div>
        ${tablaIndicadoresAdmin(["Usuario", "Cantidad"], estadisticas.ranking_usuarios, "nombre")}
      </article>

      <!-- EVOLUCION MENSUAL: permite analizar cambios por mes. -->
      <article class="data-card card col-12 col-xl-6">
        <div class="card-title-row">
          <div>
            <h2>Evolucion mensual</h2>
            <p>Cantidad reciclada por mes.</p>
          </div>
        </div>
        ${tablaIndicadoresAdmin(["Mes", "Cantidad"], estadisticas.evolucion_mensual, "mes")}
      </article>
    </section>
  `;
}

function tablaIndicadoresAdmin(columnas, datos, campoNombre = "nombre") {
  /*
    TABLA DE INDICADORES:
    Reutiliza los arreglos enviados por /estadisticas para mostrar RF012.
  */
  const filas = (datos || []).map((item) => [
    limpiar(item[campoNombre] || "Sin dato"),
    limpiar(item.total || 0),
  ]);
  return tablaDatos(columnas, filas);
}

async function cargarPerfil() {
  const admin = obtenerAdminActual();
  let adminCompleto = { ...admin };
  try {
    /*
      PERFIL COMPLETO:
      El login solo guarda datos basicos. Aqui pedimos el registro completo
      para editar nombre, apellido, correo, celular y documento sin borrar datos.
    */
    adminCompleto = await apiAdmin(`/api/usuarios/buscar/${admin.id_usuario}`);
  } catch (error) {
    console.warn("No se pudo cargar el perfil completo del administrador", error);
  }
  const modoPerfil = obtenerTemaAdminSistema();
  const clasePerfil = modoPerfil === "claro" ? "admin-profile-light" : "admin-profile-dark";
  pintarHero([["Rol", "Admin"], ["ID", String(adminCompleto.id_usuario || "")]]);
  document.getElementById("admin-content").innerHTML = `
    <!-- PERFIL ADMIN: tarjeta principal del administrador con modo oscuro o blanco. -->
    <section class="${clasePerfil}">
      <!-- IDENTIDAD DEL ADMIN: muestra usuario, rol y estado de acceso. -->
      <article class="profile-identity">
        <div>
          <div class="profile-avatar-dark">${iniciales(adminCompleto.nombres || adminCompleto.usuario || "A")}</div>
          <h2>${limpiar(adminCompleto.nombres || "Administrador")} ${limpiar(adminCompleto.apellidos || "Sistema")}</h2>
          <p>Cuenta encargada de supervisar usuarios, puntos ecologicos, reportes, noticias y configuracion general de GreenUp.</p>
        </div>
        <span class="profile-security-badge">
          <span class="material-symbols-outlined">verified_user</span>
          Acceso administrativo activo
        </span>
      </article>

      <!-- DETALLES DE SESION: datos guardados despues del login. -->
      <article class="profile-detail-panel">
        <div class="card-title-row">
          <div class="profile-panel-heading">
            <h2>Sesion administrativa</h2>
            <p>Informacion local de la cuenta autenticada en este navegador.</p>
          </div>
          <!-- CAMBIO DE TEMA: guarda la preferencia del administrador en este navegador. -->
          <div class="profile-mode-toggle" aria-label="Cambiar tema del perfil">
            <button type="button" class="${modoPerfil === "oscuro" ? "active" : ""}" onclick="cambiarTemaPerfilAdmin('oscuro')">Oscuro</button>
            <button type="button" class="${modoPerfil === "claro" ? "active" : ""}" onclick="cambiarTemaPerfilAdmin('claro')">Blanco</button>
          </div>
        </div>

        <!-- CARTAS DE PERFIL: cada carta resume un dato importante del administrador. -->
        <div class="profile-detail-grid">
          <div class="profile-dark-card">
            <span>ID de usuario</span>
            <strong>${limpiar(adminCompleto.id_usuario)}</strong>
          </div>
          <div class="profile-dark-card">
            <span>Usuario</span>
            <strong>${limpiar(adminCompleto.usuario || "admin")}</strong>
          </div>
          <div class="profile-dark-card">
            <span>Rol</span>
            <strong>Administrador del sistema</strong>
          </div>
          <div class="profile-dark-card">
            <span>Permisos</span>
            <strong>Gestion, monitoreo, reportes y notificaciones</strong>
          </div>
        </div>

        <!-- BOTONES DEL PERFIL: acciones reales del administrador. -->
        <div class="profile-actions-dark">
          <button class="primary-button btn btn-primary" type="button" data-bs-toggle="modal" data-bs-target="#modal-editar-perfil-admin">
            <span class="material-symbols-outlined">edit</span> Editar perfil
          </button>
          <button class="primary-button btn btn-success" type="button" onclick="cargarModuloAdmin()">
            <span class="material-symbols-outlined">refresh</span> Actualizar perfil
          </button>
          <button class="ghost-button btn btn-outline-secondary" type="button" onclick="pedirPermisoNotificaciones()">
            <span class="material-symbols-outlined">notifications</span> Activar notificaciones
          </button>
          <button class="ghost-button danger-button btn btn-outline-danger" type="button" onclick="cerrarSesionAdminSistema()">
            <span class="material-symbols-outlined">logout</span> Cerrar sesion
          </button>
        </div>
      </article>
    </section>
    ${renderModalEditarPerfilAdmin(adminCompleto)}
  `;
}

function renderModalEditarPerfilAdmin(admin) {
  /*
    MODAL EDITAR PERFIL:
    Este formulario permite cambiar los datos visibles del administrador.
    No crea usuarios nuevos; solo actualiza la cuenta administrativa actual.
  */
  return `
    <div class="modal fade admin-modal" id="modal-editar-perfil-admin" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <div>
              <h2 class="modal-title fs-5">Editar perfil administrador</h2>
              <p class="modal-subtitle">Estos datos se guardan en Supabase y actualizan la sesion local.</p>
            </div>
            <button class="btn-close" type="button" data-bs-dismiss="modal" aria-label="Cerrar"></button>
          </div>
          <div class="modal-body">
            <form id="form-editar-perfil-admin" class="admin-form needs-validation" onsubmit="guardarPerfilAdminSistema(event)">
              <!-- Nombres: nombre visible del administrador en el perfil. -->
              <label class="form-label">Nombres
                <input id="perfil-nombres" class="form-control" type="text" value="${limpiar(admin.nombres || "")}" required>
              </label>

              <!-- Apellidos: complemento del nombre visible. -->
              <label class="form-label">Apellidos
                <input id="perfil-apellidos" class="form-control" type="text" value="${limpiar(admin.apellidos || "")}" required>
              </label>

              <!-- Usuario: nombre usado para iniciar sesion como administrador. -->
              <label class="form-label">Usuario
                <input id="perfil-usuario" class="form-control" type="text" value="${limpiar(admin.usuario || "admin")}" required>
              </label>

              <!-- Correo: contacto principal guardado en la tabla usuarios. -->
              <label class="form-label">Correo
                <input id="perfil-correo" class="form-control" type="email" value="${limpiar(admin.correo || "admin@greenup.com")}" required>
              </label>

              <!-- Celular: telefono administrativo opcional. -->
              <label class="form-label">Celular
                <input id="perfil-celular" class="form-control" type="text" value="${limpiar(admin.celular || "")}">
              </label>

              <!-- Documento: se mantiene porque la ruta de usuarios lo guarda junto al perfil. -->
              <label class="form-label">Numero de documento
                <input id="perfil-documento" class="form-control" type="text" value="${limpiar(admin.numero_documento || "")}">
              </label>

              <!-- Boton guardar: ejecuta la actualizacion en Supabase. -->
              <button id="btn-guardar-perfil-admin" class="primary-button full btn btn-success" type="submit">
                <span class="material-symbols-outlined">save</span>Guardar cambios
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function guardarPerfilAdminSistema(event) {
  /*
    GUARDAR PERFIL:
    1. Evita que el formulario recargue la pagina.
    2. Busca el usuario completo en Supabase.
    3. Mezcla los campos existentes con lo escrito en el modal.
    4. Actualiza Supabase y tambien actualiza localStorage.
  */
  event.preventDefault();

  const admin = obtenerAdminActual();
  const boton = document.getElementById("btn-guardar-perfil-admin");
  if (!admin.id_usuario) {
    mostrarToast("Perfil", "No se encontro la sesion del administrador.");
    return;
  }

  const nombres = document.getElementById("perfil-nombres").value.trim();
  const apellidos = document.getElementById("perfil-apellidos").value.trim();
  const usuario = document.getElementById("perfil-usuario").value.trim();
  const correo = document.getElementById("perfil-correo").value.trim();
  const celular = document.getElementById("perfil-celular").value.trim();
  const numeroDocumento = document.getElementById("perfil-documento").value.trim();

  if (!nombres || !apellidos || !usuario || !correo) {
    mostrarToast("Faltan datos", "Nombres, apellidos, usuario y correo son obligatorios.");
    return;
  }

  try {
    if (boton) {
      boton.disabled = true;
      boton.innerHTML = '<span class="material-symbols-outlined">sync</span>Guardando...';
    }

    const perfilActual = await apiAdmin(`/api/usuarios/buscar/${admin.id_usuario}`);
    const payload = {
      nombres,
      apellidos,
      correo,
      usuario,
      numero_documento: numeroDocumento || perfilActual.numero_documento || "",
      celular: celular || perfilActual.celular || "",
      foto_perfil: perfilActual.foto_perfil || "",
      id_tipo_documento: perfilActual.id_tipo_documento || 1,
      id_rol: 1,
      id_estado: perfilActual.id_estado || 1,
    };

    await apiAdmin(`/api/usuarios/actualizar/${admin.id_usuario}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    const sesionActualizada = {
      ...admin,
      id_usuario: admin.id_usuario,
      nombres: payload.nombres,
      apellidos: payload.apellidos,
      usuario: payload.usuario,
      correo: payload.correo,
      id_rol: 1,
    };

    localStorage.setItem("usuario", JSON.stringify(sesionActualizada));

    const modal = document.getElementById("modal-editar-perfil-admin");
    const instancia = modal && window.bootstrap ? bootstrap.Modal.getInstance(modal) : null;
    if (instancia) instancia.hide();

    mostrarToast("Perfil actualizado", "Los datos del administrador fueron guardados correctamente.");
    pintarEstructuraBase();
    await cargarModuloAdmin();
  } catch (error) {
    mostrarToast("No se pudo guardar", error.message || "Revisa que el backend este encendido.");
  } finally {
    if (boton) {
      boton.disabled = false;
      boton.innerHTML = '<span class="material-symbols-outlined">save</span>Guardar cambios';
    }
  }
}

function cambiarTemaPerfilAdmin(modo) {
  /*
    TEMA DEL PERFIL:
    Usa la misma funcion global para que cambie toda la interfaz,
    no solamente la tarjeta del perfil.
  */
  cambiarTemaAdminSistema(modo);
}

function cargarConfiguracion() {
  pintarHero([["Notificaciones", Notification.permission || "n/a"], ["Sesion", "Activa"]]);
  document.getElementById("admin-content").innerHTML = `
    <section class="metrics-grid row g-3">
      ${settingCard("notifications", "Notificaciones", "Activa permisos para recibir avisos cuando lleguen usuarios o puntos nuevos.", "pedirPermisoNotificaciones()", "Activar")}
      ${settingCard("sync", "Actualizacion", "Las tablas principales y el mapa consultan Supabase cada 8 segundos.", "cargarModuloAdmin()", "Actualizar")}
      ${settingCard("download", "Exportacion", "Los reportes se exportan a CSV, Excel o impresion PDF desde el navegador.", "exportarTablaCSV('greenup_admin.csv')", "Exportar")}
      ${settingCard("logout", "Sesion", "Cierra la sesion del administrador en este navegador.", "cerrarSesionAdminSistema()", "Cerrar")}
    </section>
  `;
}

function settingCard(icon, title, text, action, button) {
  return `
    <article class="metric-card card col-12 col-sm-6 col-xl-3">
      <span class="metric-icon"><span class="material-symbols-outlined">${icon}</span></span>
      <span>${title}</span>
      <p>${text}</p>
      <button class="small-button btn btn-sm btn-outline-secondary" type="button" onclick="${action}">${button}</button>
    </article>
  `;
}

function renderTableCard(title, subtitle, filename) {
  return `
    <article class="data-card card">
      <div class="card-title-row">
        <div>
          <h2>${title}</h2>
          <p>${subtitle}</p>
        </div>
        <button class="ghost-button btn btn-outline-secondary" type="button" onclick="exportarTablaCSV('${filename}')">
          <span class="material-symbols-outlined">download</span> Exportar
        </button>
      </div>
      <div id="tabla-admin"></div>
    </article>
  `;
}

function pintarTablaActual(data = adminTableData, estadoVacio = {}) {
  const contenedor = document.getElementById("tabla-admin");
  if (!contenedor) return;
  if (!data.length) {
    const icono = estadoVacio.icon || "database";
    const titulo = estadoVacio.title || "No hay registros para mostrar.";
    const texto = estadoVacio.text || "Cuando existan datos en Supabase apareceran aqui.";
    contenedor.innerHTML = renderEmpty(icono, titulo, texto);
    return;
  }

  const tieneAcciones = data.some((row) => row.actions);
  const claseModuloTabla = moduloActual() === "usuarios" ? "users-table" : "";
  contenedor.innerHTML = `
    <div class="table-wrap">
      <table class="admin-table responsive-table-ready table table-hover align-middle ${claseModuloTabla} ${tieneAcciones ? "has-actions" : ""}">
        <thead>
          <tr>
            ${adminTableColumns.map((col) => `<th>${limpiar(col)}</th>`).join("")}
            ${tieneAcciones ? "<th>Acciones</th>" : ""}
          </tr>
        </thead>
        <tbody>
          ${data.map((row) => `
            <tr>
              ${row.values.map((value, index) => `<td data-label="${limpiar(adminTableColumns[index] || "Dato")}">${value}</td>`).join("")}
              ${tieneAcciones ? `<td data-label="Acciones"><div class="row-actions">${row.actions || ""}</div></td>` : ""}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function filtrarTablaActual() {
  const search = normalizarBusqueda(document.getElementById("admin-search")?.value || "");
  const tipo = document.getElementById("filtro-tipo-usuario")?.value || "";
  const estado = document.getElementById("filtro-estado")?.value || "";

  const filtrada = adminTableData.filter((row) => {
    const texto = normalizarBusqueda(row.values.map((v) => String(v).replace(/<[^>]+>/g, "")).join(" "));
    const cumpleBusqueda = !search || texto.includes(search);
    const cumpleTipo = !tipo || texto.includes(normalizarBusqueda(tipo));
    const cumpleEstado = !estado || texto.includes(normalizarBusqueda(estado));
    return cumpleBusqueda && cumpleTipo && cumpleEstado;
  });

  pintarTablaActual(filtrada);
}

function tablaDatos(columnas, filas) {
  if (!filas.length) return renderEmpty("database", "No hay registros.", "Los datos apareceran cuando existan en Supabase.");
  return `
    <div class="table-wrap">
      <table class="admin-table responsive-table-ready table table-hover align-middle">
        <thead><tr>${columnas.map((c) => `<th>${limpiar(c)}</th>`).join("")}</tr></thead>
        <tbody>
          ${filas.map((fila) => `<tr>${fila.map((v, index) => `<td data-label="${limpiar(columnas[index] || "Dato")}">${limpiarHtmlPermitido(v)}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderForm(id, campos, accion, textoBoton) {
  return `
    <form id="${id}" class="admin-form needs-validation" onsubmit="${accion}">
      ${campos.map((campo) => renderField(campo)).join("")}
      <button class="primary-button full btn btn-success" type="submit">
        <span class="material-symbols-outlined">save</span>${textoBoton}
      </button>
    </form>
  `;
}

function renderFormModal(modalId, titulo, subtitulo, formId, campos, accion, textoBoton) {
  /*
    MODAL DE REGISTRO:
    Usa Bootstrap para mostrar formularios de creacion sin ocupar espacio fijo
    en la pagina. Se reutiliza en catalogos, noticias, FAQ y contenido.
  */
  return `
    <div class="modal fade admin-modal" id="${modalId}" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <div>
              <h2 class="modal-title fs-5">${titulo}</h2>
              <p class="modal-subtitle">${subtitulo}</p>
            </div>
            <button class="btn-close" type="button" data-bs-dismiss="modal" aria-label="Cerrar"></button>
          </div>
          <div class="modal-body">
            ${renderForm(formId, campos, accion, textoBoton)}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderField(campo) {
  const clase = campo.full ? "full form-label" : "form-label";
  const eventoCambio = campo.onChange ? ` onchange="${campo.onChange}"` : "";
  if (campo.type === "hidden") {
    return `<input id="${campo.id}" type="hidden" value="${campo.value || ""}">`;
  }
  if (campo.type === "textarea") {
    return `<label class="${clase}">${campo.label}<textarea id="${campo.id}" class="form-control"></textarea></label>`;
  }
  if (campo.type === "select") {
    return `
      <label class="${clase}">${campo.label}
        <select id="${campo.id}" class="form-select"${eventoCambio}>
          ${campo.options.map((op) => `<option value="${op[0]}">${op[1]}</option>`).join("")}
        </select>
      </label>
    `;
  }
  return `<label class="${clase}">${campo.label}<input id="${campo.id}" class="form-control" type="${campo.type || "text"}" value="${campo.value || ""}"></label>`;
}

function leerFormulario(campos) {
  const data = {};
  campos.forEach((campo) => {
    if (campo.omitPayload) return;
    const elemento = document.getElementById(campo.id);
    if (!elemento) return;
    data[campo.id] = normalizarValor(campo, elemento.value);
  });
  return data;
}

function completarTipoDocumentoAdmin(valor) {
  /*
    AUTOLLENADO DEL DOCUMENTO:
    Cuando el administrador escoge un tipo de documento del desplegable,
    copiamos ese texto en la descripcion porque esa es la columna real
    que guarda el backend de tipos de documento.
  */
  const campoDescripcion = document.getElementById("descripcion");
  if (!campoDescripcion || !valor) return;
  campoDescripcion.value = valor;
  campoDescripcion.focus();
}

function normalizarValor(campo, valor) {
  if (campo.type === "number") return valor === "" ? null : Number(valor);
  if (campo.id && campo.id.startsWith("id_")) return valor === "" ? null : Number(valor);
  return valor;
}

function metric(icon, value, label, detail, color = "") {
  return `
    <article class="metric-card card col-12 col-sm-6 col-xl-3 ${color}">
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
          <article class="news-card card">
            <div class="news-image">
              ${n.imagen ? `<img src="${limpiar(n.imagen)}" alt="${limpiar(n.titulo)}">` : ""}
            </div>
            <div class="news-body">
              <h3>${limpiar(n.titulo)}</h3>
              <p>${limpiar(n.descripcion)}</p>
              <p>${estadoHtml(n.id_estado)}</p>
              <div class="row-actions">
                <button class="small-button btn btn-sm ${activo ? "danger-button btn-outline-danger" : "btn-outline-secondary"}" type="button" onclick="cambiarEstadoNovedad(${n.id_novedad}, ${activo ? 2 : 1})">
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

function estadoReciclajeHtml(registro) {
  const textoGuardado = String(registro?.estado || "").trim().toLowerCase();
  const idEstado = Number(registro?.id_estado);
  const estado = textoGuardado.includes("confirm") || idEstado === 2
    ? { texto: "Confirmado", clase: "active" }
    : textoGuardado.includes("rechaz") || idEstado === 3
      ? { texto: "Rechazado", clase: "inactive" }
      : { texto: "Pendiente de validación", clase: "pending" };

  return `<span class="status-pill ${estado.clase}">${estado.texto}</span>`;
}

function nombreRol(idRol) {
  const roles = { 1: "Administrador", 2: "Recicladora", 3: "Ciudadano" };
  return roles[Number(idRol)] || "Sin rol";
}

function formatearFechaAdmin(valor) {
  /*
    FECHA LEGIBLE:
    Convierte la fecha de Supabase en texto corto para tablas y reportes.
  */
  if (!valor) return "";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleString("es-CO");
}

function limpiar(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizarBusqueda(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
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

function mostrarPanelNotificacionesAdmin() {
  const panel = document.getElementById("adminNotificationsMenu");
  if (!panel) return;
  const abierto = panel.classList.toggle("open");
  panel.setAttribute("aria-hidden", String(!abierto));
  if (abierto) {
    cargarNotificacionesAdmin();
  }
}

async function cargarNotificacionesAdmin() {
  const panel = document.getElementById("adminNotificationsMenu");
  if (!panel) return;

  try {
    const notificaciones = await apiAdmin("/api/notificaciones");
    const badge = panel.querySelector(".notifications-badge");
    const noLeidas = notificaciones.filter((item) => !item.leida).length;
    if (badge) badge.textContent = String(noLeidas);

    const contenedor = panel.querySelector(".inline-empty-state");
    if (!contenedor) return;

    if (!notificaciones.length) {
      contenedor.classList.remove("has-notifications");
      contenedor.innerHTML = `
        <span class="material-symbols-outlined">inbox</span>
        <strong>Sin notificaciones</strong>
        <small>Cuando haya alertas, solicitudes o cambios importantes aparecerán aquí.</small>
      `;
      return;
    }

    contenedor.classList.add("has-notifications");
    contenedor.innerHTML = notificaciones.map((item) => `
      <article class="notification-item ${item.leida ? "" : "unread"}" data-admin-notification-id="${item.id_notificacion}">
        <span class="material-symbols-outlined">${item.leida ? "notifications" : "notifications_active"}</span>
        <div>
          <strong>${limpiar(item.titulo)}</strong>
          <p>${limpiar(item.mensaje)}</p>
          <small>${limpiar(formatearFechaAdmin(item.fecha_hora))}</small>
        </div>
      </article>
    `).join("");

    contenedor.querySelectorAll("[data-admin-notification-id]").forEach((item) => {
      item.addEventListener("click", async () => {
        const id = item.getAttribute("data-admin-notification-id");
        await apiAdmin(`/api/notificaciones/${id}/leida`, { method: "PUT" });
        item.classList.remove("unread");
        cargarNotificacionesAdmin();

        const titulo = item.querySelector("strong").textContent.toLowerCase();
        let moduloDestino = "";

        if (titulo.includes("recicladora") || titulo.includes("aprobada") || titulo.includes("rechazada")) {
            moduloDestino = "roles";
        } else if (titulo.includes("punto ecológico")) {
            moduloDestino = "puntos_reciclaje";
        } else if (titulo.includes("educación") || titulo.includes("educativo") || titulo.includes("material")) {
            moduloDestino = "contenido_educativo";
        } else if (titulo.includes("usuario") || titulo.includes("inhabilitado") || titulo.includes("habilitado")) {
            moduloDestino = "usuarios";
        } else if (titulo.includes("novedad") || titulo.includes("noticia")) {
            moduloDestino = "novedades";
        } else if (titulo.includes("reciclaje") || titulo.includes("entrega")) {
            moduloDestino = "registros_reciclaje";
        } else {
            moduloDestino = "panel"; // fallback
        }

        const urlDestino = `admin_${moduloDestino}.html`;
        if (urlDestino && !window.location.pathname.endsWith(urlDestino)) {
            window.location.href = urlDestino;
        }
      });
    });
  } catch (error) {
    console.warn("No se pudieron cargar las notificaciones del administrador", error);
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

      const novedades = await apiAdmin("/novedades");
      if (adminLastNewsCount !== null && novedades.length > adminLastNewsCount) {
        notificarAdmin("Nueva novedad registrada", "El modulo de noticias y novedades se actualizara automaticamente.");
        if (moduloActual() === "novedades" || moduloActual() === "panel") await cargarModuloAdmin();
      }
      adminLastNewsCount = novedades.length;

      if (moduloActual() === "mapa") await actualizarPuntosMapa(false);
      if (["puntos", "reportes", "estadisticas"].includes(moduloActual())) await cargarModuloAdmin();
    } catch (error) {
      console.warn("No se pudo ejecutar el monitoreo admin", error);
    }
  }, ADMIN_REFRESH_MS);
}

document.addEventListener("click", (event) => {
  const panel = document.getElementById("adminNotificationsMenu");
  if (!panel || !panel.classList.contains("open")) return;
  if (event.target.closest("#adminNotificationsMenu")) return;
  if (event.target.closest('[title="Notificaciones"]')) return;
  panel.classList.remove("open");
  panel.setAttribute("aria-hidden", "true");
});

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

function exportarTablaExcel(nombreArchivo) {
  /*
    EXPORTAR EXCEL:
    Crea un archivo .xls con la misma tabla visible del administrador.
    Excel puede abrir este HTML como hoja de calculo.
  */
  const filas = adminTableData;
  if (!filas.length) {
    mostrarToast("Exportacion", "No hay datos para exportar.");
    return;
  }

  const encabezados = adminTableColumns.map((columna) => `<th>${limpiar(columna)}</th>`).join("");
  const cuerpo = filas.map((fila) => `
    <tr>
      ${fila.values.map((valor) => `<td>${String(valor).replace(/<[^>]+>/g, "")}</td>`).join("")}
    </tr>
  `).join("");

  const html = `
    <html>
      <head><meta charset="UTF-8"></head>
      <body>
        <table border="1">
          <thead><tr>${encabezados}</tr></thead>
          <tbody>${cuerpo}</tbody>
        </table>
      </body>
    </html>
  `;

  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" }));
  enlace.download = nombreArchivo;
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}

async function cerrarSesionAdminSistema() {
  const confirmarSalida = await window.greenupConfirm("¿Seguro que deseas cerrar la sesion del administrador?", "Cerrar sesión");
  if (!confirmarSalida) return;
  localStorage.removeItem("usuario");
  sessionStorage.removeItem("greenup_admin_sesion_activa");
  window.location.href = "../public/admin_login.html";
}
