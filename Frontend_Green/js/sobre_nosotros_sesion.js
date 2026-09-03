// La pagina institucional es publica, pero conserva la navegacion del usuario.
(() => {
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
  });
})();
