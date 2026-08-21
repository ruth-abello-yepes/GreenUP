/**
 * Enlaces funcionales para páginas públicas de GreenUp.
 * Evita botones y footer con href="#" cuando no hay una página específica.
 */

function normalizarEnlacePublico(enlace) {
  const texto = (enlace.textContent || "").trim().toLowerCase();
  const clases = enlace.className || "";

  if (texto.startsWith("leer más") || texto.startsWith("leer mas") || texto.startsWith("saber más") || texto.startsWith("saber mas")) {
    enlace.href = "public_registro.html";
    return;
  }

  const rutas = [
    { claves: ["crear cuenta", "registrarse", "empieza", "empezar ahora"], href: "public_registro.html" },
    { claves: ["iniciar sesión", "iniciar sesion", "login"], href: "public_login.html" },
    { claves: ["hablar con un experto", "contáctanos", "contactanos", "contacto", "soporte"], href: "mailto:greenup213@gmail.com?subject=Contacto%20GreenUp" },
    { claves: ["misión", "mision", "visión", "vision", "nuestro equipo", "equipo"], href: "public_sobre_nosotros.html" },
    { claves: ["impacto", "estadísticas", "estadisticas"], href: "public_estadisticas.html" },
    { claves: ["eventos", "eco-blog", "novedades", "boletín", "boletin"], href: "public_noticias.html" },
    { claves: ["educación", "educacion", "aprende"], href: "public_educacion.html" },
    { claves: ["mapa", "puntos"], href: "public_mapa.html" },
    { claves: ["privacidad"], href: "public_sobre_nosotros.html#privacidad" },
    { claves: ["términos", "terminos", "uso"], href: "public_sobre_nosotros.html#terminos" },
    { claves: ["cookies"], href: "public_sobre_nosotros.html#cookies" },
    { claves: ["carreras", "vacantes"], href: "mailto:greenup213@gmail.com?subject=Quiero%20hacer%20parte%20de%20GreenUp" },
  ];

  const destino = rutas.find((ruta) => ruta.claves.some((clave) => texto.includes(clave)))?.href;
  if (destino) {
    enlace.href = destino;
    return;
  }

  if (clases.includes("rounded-circle") || texto.length === 0) {
    enlace.href = "https://wa.me/573001234567?text=Hola%20GreenUp,%20quiero%20conocer%20m%C3%A1s";
    enlace.target = "_blank";
    enlace.rel = "noopener noreferrer";
    return;
  }

  if (enlace.closest("footer")) {
    enlace.href = "mailto:greenup213@gmail.com?subject=GreenUp";
  }
}

function conectarBotonesPublicos() {
  document.querySelectorAll("button").forEach((boton) => {
    const texto = (boton.textContent || "").trim().toLowerCase();
    if (texto.includes("leer más") || texto.includes("leer mas") || texto.includes("saber más") || texto.includes("saber mas")) {
      boton.type = "button";
      boton.addEventListener("click", () => {
        window.location.href = "public_registro.html";
      });
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("a[href='#']").forEach(normalizarEnlacePublico);
  conectarBotonesPublicos();
});
