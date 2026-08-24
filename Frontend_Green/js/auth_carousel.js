/**
 * Carrusel automático para pantallas de inicio de sesión, registro y recuperación.
 * No crea flechas, botones ni tarjetas de texto: solo fotos ambientales y puntos indicadores.
 */

(function iniciarCarruselesAuthGreenUp() {
  const slides = [
    {
      image: "https://images.unsplash.com/photo-1604187351574-c75ca79f5807?auto=format&fit=crop&w=1400&q=80",
    },
    {
      image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1400&q=80",
    },
    {
      image: "https://images.unsplash.com/photo-1590507621108-433608c97823?auto=format&fit=crop&w=1400&q=80",
    },
    {
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1400&q=80",
    },
    {
      image: "https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=1400&q=80",
    },
  ];

  function prepararCarrusel(contenedor) {
    if (!contenedor || contenedor.dataset.greenupCarouselReady === "true") return;
    contenedor.dataset.greenupCarouselReady = "true";
    contenedor.classList.add("greenup-auth-carousel");
    slides.forEach((slide, index) => {
      const capa = document.createElement("div");
      capa.className = `greenup-auth-slide${index === 0 ? " is-active" : ""}`;
      capa.style.backgroundImage = `url("${slide.image}")`;
      contenedor.appendChild(capa);
    });

    const dots = document.createElement("div");
    dots.className = "greenup-auth-dots";
    dots.setAttribute("aria-hidden", "true");
    dots.innerHTML = slides.map((_, index) => `<span class="${index === 0 ? "is-active" : ""}"></span>`).join("");
    contenedor.appendChild(dots);

    let activo = 0;
    window.setInterval(() => {
      const capas = contenedor.querySelectorAll(".greenup-auth-slide");
      const puntos = contenedor.querySelectorAll(".greenup-auth-dots span");

      capas[activo]?.classList.remove("is-active");
      puntos[activo]?.classList.remove("is-active");
      activo = (activo + 1) % slides.length;
      capas[activo]?.classList.add("is-active");
      puntos[activo]?.classList.add("is-active");
    }, 4200);
  }

  function agregarCarruselSimple() {
    document.querySelectorAll(".auth-split-simple").forEach((contenedor) => {
      if (contenedor.querySelector(".auth-simple-carousel")) return;
      const aside = document.createElement("aside");
      aside.className = "auth-simple-carousel d-none d-lg-block";
      aside.setAttribute("aria-label", "Consejos ambientales GreenUp");
      contenedor.appendChild(aside);
      prepararCarrusel(aside);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    agregarCarruselSimple();
    document.querySelectorAll("[data-auth-carousel], .hero-col, .panel-lateral, .login-visual").forEach(prepararCarrusel);
  });
})();
