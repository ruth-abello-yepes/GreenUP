const enlacesRecicladora = [
  ["recicladora_panel.html", "Inicio"],
  ["recicladora_usuarios.html", "Usuarios"],
  ["recicladora_puntos_reciclaje.html", "Puntos"],
  ["recicladora_rutas_reciclaje.html", "Rutas"],
  ["recicladora_registros_reciclaje.html", "Registros"],
  ["recicladora_materiales.html", "Materiales"],
  ["recicladora_residuos.html", "Residuos"],
  ["recicladora_novedades.html", "Novedades"],
  ["recicladora_reportes.html", "Reportes"],
  ["recicladora_estadisticas.html", "Estadisticas"],
  ["recicladora_contenido_educativo.html", "Contenido"],
  ["recicladora_faq.html", "FAQ"],
  ["recicladora_perfil.html", "Perfil"],
  ["recicladora_configuracion.html", "Configuracion"],
];

const paginasRecicladora = {
  "recicladora_panel.html": {
    titulo: "Panel de recicladora",
    descripcion: "Resumen operativo del punto ecologico y sus actividades.",
    tipo: "panel",
  },
  "recicladora_usuarios.html": {
    titulo: "Usuarios vinculados",
    descripcion: "Ciudadanos y colaboradores asociados al punto ecologico.",
    columnas: ["Nombre", "Rol", "Estado"],
    filas: [["Equipo GreenUp", "Operador", "Activo"]],
  },
  "recicladora_puntos_reciclaje.html": {
    titulo: "Puntos de reciclaje",
    descripcion: "Sedes, zonas y contenedores disponibles para recepcion.",
    columnas: ["Punto", "Direccion", "Estado"],
    filas: [["Punto principal", "Direccion registrada", "Activo"]],
  },
  "recicladora_rutas_reciclaje.html": {
    titulo: "Rutas de reciclaje",
    descripcion: "Planeacion de recorridos y jornadas de recoleccion.",
    columnas: ["Ruta", "Frecuencia", "Estado"],
    filas: [["Ruta urbana", "Semanal", "Activa"]],
  },
  "recicladora_registros_reciclaje.html": {
    titulo: "Registros de reciclaje",
    descripcion: "Entradas de material y entregas registradas.",
    columnas: ["Fecha", "Material", "Estado"],
    filas: [["Hoy", "Material reciclable", "Registrado"]],
  },
  "recicladora_materiales.html": {
    titulo: "Materiales",
    descripcion: "Materiales aceptados por el punto ecologico.",
    columnas: ["Material", "Categoria", "Estado"],
    filas: [["Plastico", "Reciclable", "Activo"]],
  },
  "recicladora_residuos.html": {
    titulo: "Tipos de residuo",
    descripcion: "Clasificacion de residuos manejados por la recicladora.",
    columnas: ["Residuo", "Manejo", "Estado"],
    filas: [["Aprovechable", "Separacion", "Activo"]],
  },
  "recicladora_novedades.html": {
    titulo: "Novedades",
    descripcion: "Eventos, avisos y actualizaciones del punto ecologico.",
    columnas: ["Novedad", "Fecha", "Estado"],
    filas: [["Jornada comunitaria", "Programada", "Activa"]],
  },
  "recicladora_reportes.html": {
    titulo: "Reportes",
    descripcion: "Reportes operativos y ambientales de la recicladora.",
    columnas: ["Reporte", "Periodo", "Estado"],
    filas: [["Impacto mensual", "Mes actual", "Disponible"]],
  },
  "recicladora_estadisticas.html": {
    titulo: "Estadisticas",
    descripcion: "Indicadores de material recuperado e impacto ambiental.",
    columnas: ["Indicador", "Valor", "Estado"],
    filas: [["CO2 evitado", "-2.4t", "Estimado"]],
  },
  "recicladora_contenido_educativo.html": {
    titulo: "Contenido educativo",
    descripcion: "Publicaciones y recursos para la comunidad.",
    columnas: ["Recurso", "Categoria", "Estado"],
    filas: [["Guia de separacion", "Educacion", "Publicado"]],
  },
  "recicladora_faq.html": {
    titulo: "Preguntas frecuentes",
    descripcion: "Preguntas y respuestas asociadas al punto ecologico.",
    columnas: ["Pregunta", "Categoria", "Estado"],
    filas: [["Horarios de atencion", "Servicio", "Visible"]],
  },
  "recicladora_perfil.html": {
    titulo: "Perfil de recicladora",
    descripcion: "Datos principales de la cuenta y del punto ecologico.",
    columnas: ["Dato", "Valor", "Estado"],
    filas: [["Empresa", "Punto ecologico", "Activo"]],
  },
  "recicladora_configuracion.html": {
    titulo: "Configuracion",
    descripcion: "Preferencias generales del modulo de recicladora.",
    columnas: ["Ajuste", "Valor", "Estado"],
    filas: [["Notificaciones", "Activas", "Configurado"]],
  },
};

function obtenerUsuarioRecicladora() {
  try {
    return JSON.parse(localStorage.getItem("usuario")) || {};
  } catch {
    return {};
  }
}

function renderizarNavRecicladora(actual) {
  return enlacesRecicladora
    .map(([href, texto]) => {
      const activo = href === actual ? "activo" : "";
      return `<a class="${activo}" href="${href}">${texto}</a>`;
    })
    .join("");
}

function renderizarTarjetasRecicladora() {
  return enlacesRecicladora
    .filter(([href]) => href !== "recicladora_panel.html")
    .map(([href, texto]) => {
      const pagina = paginasRecicladora[href];
      return `
        <article class="tarjeta-recicladora">
          <h3>${texto}</h3>
          <p>${pagina.descripcion}</p>
          <a class="boton-recicladora" href="${href}">Abrir</a>
        </article>
      `;
    })
    .join("");
}

function renderizarTablaRecicladora(pagina) {
  const columnas = pagina.columnas || ["Modulo", "Resumen", "Estado"];
  const filas = pagina.filas || [[pagina.titulo, pagina.descripcion, "Activo"]];

  return `
    <table class="tabla-recicladora">
      <thead>
        <tr>${columnas.map((columna) => `<th>${columna}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${filas
          .map(
            (fila) => `
              <tr>
                ${fila
                  .map((valor, indice) =>
                    indice === fila.length - 1
                      ? `<td><span class="estado-recicladora">${valor}</span></td>`
                      : `<td>${valor}</td>`,
                  )
                  .join("")}
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderizarContenidoRecicladora(actual, pagina) {
  if (pagina.tipo === "panel") {
    return `<section class="grid-recicladora">${renderizarTarjetasRecicladora()}</section>`;
  }

  return `
    <section class="seccion-recicladora">
      <h3>${pagina.titulo}</h3>
      <p>${pagina.descripcion}</p>
      ${renderizarTablaRecicladora(pagina)}
      <div class="acciones-recicladora">
        <a class="boton-recicladora" href="recicladora_panel.html">Volver al panel</a>
        <a class="boton-recicladora" href="recicladora_perfil.html">Ver perfil</a>
      </div>
    </section>
  `;
}

document.addEventListener("DOMContentLoaded", function () {
  if (typeof protegerRol === "function") {
    protegerRol(2);
  }

  const actual = window.location.pathname.split("/").pop() || "recicladora_panel.html";
  const pagina = paginasRecicladora[actual] || paginasRecicladora["recicladora_panel.html"];
  const usuario = obtenerUsuarioRecicladora();
  const nombre = usuario.nombres || usuario.usuario || "Recicladora";

  document.body.classList.add("recicladora-fondo");
  document.body.innerHTML = `
    <header class="barra-recicladora">
      <div class="barra-recicladora__fila">
        <h1>GreenUp Recicladora</h1>
        <button onclick="cerrarSesion()" class="boton-salir-recicladora">
          Cerrar sesion
        </button>
      </div>
      <nav class="nav-recicladora">
        ${renderizarNavRecicladora(actual)}
      </nav>
    </header>

    <main class="recicladora-contenido">
      <section class="recicladora-hero">
        <div>
          <span class="etiqueta-recicladora">Administrador de recicladora</span>
          <h2>${pagina.titulo}</h2>
          <p>${pagina.descripcion}</p>
        </div>
        <div class="usuario-recicladora">${nombre}</div>
      </section>

      ${renderizarContenidoRecicladora(actual, pagina)}
    </main>
  `;
});
