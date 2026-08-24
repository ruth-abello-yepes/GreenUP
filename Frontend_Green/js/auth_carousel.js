/**
 * Carrusel automático para pantallas de inicio de sesión, registro y recuperación.
 * No crea flechas ni botones de navegación: solo slides, textos y puntos indicadores.
 */

(function iniciarCarruselesAuthGreenUp() {
  const slides = [
    {
      tag: "Intro 1",
      title: "Separa tus residuos correctamente",
      text: "Aprende a identificar qué va en cada contenedor y evita contaminar materiales reciclables.",
      image: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=1400&q=80",
    },
    {
      tag: "Intro 2",
      title: "Aprovecha los residuos orgánicos",
      text: "Transforma restos de cocina en compost y dale una segunda vida a lo que parecía basura.",
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1400&q=80",
    },
    {
      tag: "Intro 3",
      title: "Reduce, reutiliza y recicla",
      text: "Cada entrega registrada ayuda a organizar mejor la cultura ambiental de Valledupar.",
      image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1400&q=80",
    },
    {
      tag: "Intro 4",
      title: "Consume de manera responsable",
      text: "Elige productos duraderos, separa en la fuente y apoya la economía circular local.",
      image: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1400&q=80",
    },
    {
      tag: "Intro 5",
      title: "Cuida el agua y tu entorno",
      text: "Pequeñas acciones diarias pueden proteger los ríos, barrios y espacios verdes de la ciudad.",
      image: "https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=1400&q=80",
    },
  ];

  function prepararCarrusel(contenedor) {
    if (!contenedor || contenedor.dataset.greenupCarouselReady === "true") return;
    contenedor.dataset.greenupCarouselReady = "true";
    contenedor.classList.add("greenup-auth-carousel");
    const tieneContenidoPropio = Boolean(
      contenedor.querySelector(".hero-content, .visual-copy, .marca, .brand-lockup")
    );

    slides.forEach((slide, index) => {
      const capa = document.createElement("div");
      capa.className = `greenup-auth-slide${index === 0 ? " is-active" : ""}`;
      capa.style.backgroundImage = `url("${slide.image}")`;
      contenedor.appendChild(capa);
    });

    if (!tieneContenidoPropio && !contenedor.querySelector(".greenup-auth-mini-strip")) {
      const strip = document.createElement("div");
      strip.className = "greenup-auth-mini-strip";
      strip.innerHTML = slides.slice(0, 3).map((slide) => `
        <article>
          <strong>${slide.tag}</strong>
          <span>${slide.title}</span>
        </article>
      `).join("");
      contenedor.appendChild(strip);
    }

    if (!tieneContenidoPropio && !contenedor.querySelector(".greenup-auth-caption")) {
      const caption = document.createElement("div");
      caption.className = "greenup-auth-caption";
      caption.innerHTML = `
        <span class="intro-label">${slides[0].tag}</span>
        <h2>${slides[0].title}</h2>
        <p>${slides[0].text}</p>
      `;
      contenedor.appendChild(caption);
    }

    const dots = document.createElement("div");
    dots.className = "greenup-auth-dots";
    dots.setAttribute("aria-hidden", "true");
    dots.innerHTML = slides.map((_, index) => `<span class="${index === 0 ? "is-active" : ""}"></span>`).join("");
    contenedor.appendChild(dots);

    let activo = 0;
    window.setInterval(() => {
      const capas = contenedor.querySelectorAll(".greenup-auth-slide");
      const puntos = contenedor.querySelectorAll(".greenup-auth-dots span");
      const caption = contenedor.querySelector(".greenup-auth-caption");

      capas[activo]?.classList.remove("is-active");
      puntos[activo]?.classList.remove("is-active");
      activo = (activo + 1) % slides.length;
      capas[activo]?.classList.add("is-active");
      puntos[activo]?.classList.add("is-active");

      if (caption) {
        caption.innerHTML = `
          <span class="intro-label">${slides[activo].tag}</span>
          <h2>${slides[activo].title}</h2>
          <p>${slides[activo].text}</p>
        `;
      }
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
