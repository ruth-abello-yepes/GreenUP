(function () {
  const root = document.querySelector('[data-registro-carousel]');
  if (!root) return;

  const slides = Array.from(root.querySelectorAll('[data-registro-slide]'));
  const dots = Array.from(root.querySelectorAll('[data-registro-dot]'));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = 0;
  let timer;

  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === current));
    dots.forEach((dot, i) => {
      const active = i === current;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', String(active));
    });
  }

  function start() {
    if (reduceMotion) return;
    clearInterval(timer);
    timer = setInterval(() => show(current + 1), 6500);
  }

  root.querySelector('[data-registro-prev]').addEventListener('click', () => { show(current - 1); start(); });
  root.querySelector('[data-registro-next]').addEventListener('click', () => { show(current + 1); start(); });
  dots.forEach((dot) => dot.addEventListener('click', () => { show(Number(dot.dataset.registroDot)); start(); }));
  root.addEventListener('mouseenter', () => clearInterval(timer));
  root.addEventListener('mouseleave', start);
  root.addEventListener('focusin', () => clearInterval(timer));
  root.addEventListener('focusout', start);
  show(0);
  start();
})();
