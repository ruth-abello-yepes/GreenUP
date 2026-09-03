// La pagina institucional es publica, pero conserva la navegacion del usuario.
(() => {
  const baseScripts = new URL(".", document.currentScript.src);

  function cargarScript(nombre) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = new URL(nombre, baseScripts).href;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`No se pudo cargar ${nombre}`));
      document.head.appendChild(script);
    });
  }

  async function conservarNavbarCiudadano() {
    // Reutiliza el HTML del inicio y sus funciones; no mantiene otra copia del menu.
    const inicio = new URL("../ciudadano/ciudadano_inicio.html", window.location.href);
    const respuesta = await fetch(inicio);
    if (!respuesta.ok) throw new Error("No se pudo cargar la navegacion ciudadana");
    const pagina = new DOMParser().parseFromString(await respuesta.text(), "text/html");
    const navbar = pagina.querySelector("nav.navbar");
    const movil = pagina.getElementById("mobileMenuSidebar");
    if (!navbar || !movil) throw new Error("Navegacion ciudadana incompleta");

    // Estos scripts se cargan despues de DOMContentLoaded. Se inicializa solo
    // la navegacion, sin cargar el dashboard ni modificar el contenido institucional.
    await Promise.all([
      "api.js", "auth.js", "cargar_usuario.js", "ciudadano_ui_fix.js",
      "notificaciones_panel.js?v=20260903-navbar",
    ].map(cargarScript));

    const estilos = document.createElement("link");
    estilos.rel = "stylesheet";
    estilos.href = new URL("../css/ciudadano.css?v=20260902-ayuda-flotante", baseScripts).href;
    document.head.insertBefore(estilos, document.querySelector('link[href*="public-pages/"]'));
    document.body.classList.add("ciudadano-pagina-inicio", "sobre-nosotros-ciudadano");
    document.querySelector("nav.navbar").replaceWith(navbar);
    document.getElementById("mobileOffcanvas")?.replaceWith(movil);

    navbar.querySelectorAll("img[src]").forEach((imagen) => {
      imagen.src = new URL("../../img/logo-greenup.png", inicio).href;
    });
    movil.querySelectorAll("img[src]").forEach((imagen) => {
      imagen.src = new URL("../../img/logo-greenup.png", inicio).href;
    });
    movil.querySelectorAll(".active-custom, .border-success").forEach((enlace) => {
      enlace.classList.remove("active-custom", "border-success", "border-end", "border-4", "ciudadano-inicio-estilo-5");
    });

    completarNavegacionCiudadano();
    crearMenuHamburguesaCiudadano();
    normalizarNavegacionAprendeCiudadano();
    cerrarOffcanvasViejoCiudadano();
    estilizarBotonesCerrarSesionCiudadano();
    mostrarDatosUsuario();
    iniciarPanelNotificacionesCiudadano();

    // Los enlaces del componente se resuelven desde la carpeta ciudadana.
    [navbar, movil, document.getElementById("ciudadano-hamburger-panel")].forEach((menu) => {
      menu?.querySelectorAll("a[href]").forEach((enlace) => {
        const href = enlace.getAttribute("href");
        if (href && !href.startsWith("#")) enlace.href = new URL(href, inicio).href;
      });
      if (menu) mejorarAccesibilidadCiudadano(menu);
    });
  }

  const paneles = {
    1: {
      inicio: "../admin_sistema/admin_panel.html",
      perfil: "../admin_sistema/admin_perfil.html",
      mapa: "../admin_sistema/admin_mapa.html",
      historial: "../admin_sistema/admin_registros_reciclaje.html",
      estadisticas: "../admin_sistema/admin_estadisticas.html",
      educacion: "../admin_sistema/admin_contenido_educativo.html",
    },
    2: {
      inicio: "../dueno_recicladora/recicladora_panel.html",
      perfil: "../dueno_recicladora/recicladora_perfil.html",
      mapa: "../dueno_recicladora/recicladora_puntos_reciclaje.html",
      historial: "../dueno_recicladora/recicladora_registros_reciclaje.html",
      estadisticas: "../dueno_recicladora/recicladora_estadisticas.html",
      educacion: "../dueno_recicladora/recicladora_contenido_educativo.html",
    },
    3: {
      inicio: "../ciudadano/ciudadano_inicio.html",
      perfil: "../ciudadano/ciudadano_ajustes.html",
      mapa: "../ciudadano/ciudadano_mapa.html",
      historial: "../ciudadano/ciudadano_historial_reciclaje.html",
      estadisticas: "../ciudadano/ciudadano_estadisticas.html",
      educacion: "../ciudadano/ciudadano_educacion.html",
    },
  };
  const paginasPublicas = {
    "public_inicio.html": "inicio",
    "public_mapa.html": "mapa",
    "public_historial.html": "historial",
    "public_estadisticas.html": "estadisticas",
    "public_educacion.html": "educacion",
    "public_login.html": "perfil",
    "public_registro.html": "inicio",
  };

  document.addEventListener("DOMContentLoaded", () => {
    let usuario;
    try {
      if (!localStorage.getItem("token")) return;
      usuario = JSON.parse(localStorage.getItem("usuario"));
    } catch {
      return;
    }
    const panel = paneles[Number(usuario?.id_rol)];
    if (!panel) return;

    // Solo adapta enlaces: las paginas privadas y la API mantienen sus controles.
    document.querySelectorAll("a[href]").forEach((enlace) => {
      const destino = new URL(enlace.getAttribute("href"), window.location.href);
      if (destino.origin !== window.location.origin) return;
      const pagina = destino.pathname.split("/").pop();
      const seccion = paginasPublicas[pagina];
      if (!seccion) return;

      enlace.href = panel[seccion] + destino.search + destino.hash;
      if (pagina === "public_login.html") {
        enlace.textContent = usuario.usuario || usuario.nombres || "Mi perfil";
        enlace.setAttribute("aria-label", "Ir a mi perfil");
        enlace.title = "Mi perfil";
      } else if (pagina === "public_registro.html") {
        enlace.textContent = "Volver a mi panel";
      }
    });
    if (Number(usuario.id_rol) === 3) {
      conservarNavbarCiudadano().catch((error) => console.error(error.message));
    }
  });
})();
