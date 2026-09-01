/**
 * Enlaces funcionales para páginas públicas de GreenUp.
 * Evita botones y footer con href="#" cuando no hay una página específica.
 */

function normalizarEnlacePublico(enlace) {
  const texto = (enlace.textContent || "").trim().toLowerCase();
  const clases = enlace.className || "";
  const icono = (enlace.querySelector(".material-symbols-outlined")?.textContent || "").trim().toLowerCase();

  if (texto.startsWith("leer más") || texto.startsWith("leer mas") || texto.startsWith("saber más") || texto.startsWith("saber mas")) {
    enlace.href = "public_registro.html";
    return;
  }

  const rutas = [
    { claves: ["crear cuenta", "registrarse", "empieza", "empezar ahora"], href: "public_registro.html" },
    { claves: ["iniciar sesión", "iniciar sesion", "login"], href: "public_login.html" },
    { claves: ["hablar con un experto", "contáctanos", "contactanos", "contacto", "soporte"], href: "mailto:greenup213@gmail.com?subject=Contacto%20GreenUp" },
    { claves: ["misión", "mision", "visión", "vision"], href: "public_sobre_nosotros.html#mision" },
    { claves: ["nuestro equipo", "equipo"], href: "public_sobre_nosotros.html#equipo" },
    { claves: ["impacto"], href: "public_sobre_nosotros.html#impacto" },
    { claves: ["estadísticas", "estadisticas"], href: "public_estadisticas.html" },
    { claves: ["eventos", "eco-blog", "novedades", "boletín", "boletin"], href: "public_educacion.html#noticias" },
    { claves: ["educación", "educacion", "aprende"], href: "public_educacion.html" },
    { claves: ["mapa", "puntos"], href: "public_mapa.html" },
    { claves: ["privacidad"], href: "public_sobre_nosotros.html#legal" },
    { claves: ["términos", "terminos", "uso"], href: "public_sobre_nosotros.html#legal" },
    { claves: ["cookies"], href: "public_sobre_nosotros.html#legal" },
    { claves: ["carreras", "vacantes"], href: "mailto:greenup213@gmail.com?subject=Quiero%20hacer%20parte%20de%20GreenUp" },
  ];

  const destino = rutas.find((ruta) => ruta.claves.some((clave) => texto.includes(clave)))?.href;
  if (destino) {
    enlace.href = destino;
    return;
  }

  if (clases.includes("rounded-circle") || texto.length === 0) {
    if (icono === "mail") {
      enlace.href = "mailto:greenup213@gmail.com?subject=Contacto%20GreenUp";
      return;
    }

    if (icono === "public") {
      enlace.href = "public_sobre_nosotros.html";
      return;
    }

    if (icono === "share") {
      enlace.href = window.location.href;
      enlace.addEventListener("click", async (evento) => {
        evento.preventDefault();
        const datosCompartir = {
          title: "GreenUp",
          text: "Conoce GreenUp, una plataforma para mejorar el reciclaje y el cuidado ambiental en Valledupar.",
          url: window.location.origin + "/pages/public/public_inicio.html",
        };

        if (navigator.share) {
          await navigator.share(datosCompartir);
          return;
        }

        await navigator.clipboard?.writeText(datosCompartir.url);
        alert("Enlace de GreenUp copiado para compartir.");
      });
      return;
    }

    enlace.href = "mailto:greenup213@gmail.com?subject=Contacto%20GreenUp";
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

(function cargarAccesibilidadPublica() {
  if (document.querySelector("script[data-greenup-accessibility]")) return;
  const script = document.createElement("script");
  script.dataset.greenupAccessibility = "true";
  script.src = `${new URL("accessibility.js", document.currentScript.src).href}?v=20260901-a11y3`;
  document.head.appendChild(script);
})();
