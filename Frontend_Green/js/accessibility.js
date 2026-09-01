/** Mejoras transversales WCAG y responsive para todos los roles. */
(function () {
  "use strict";

  const STYLE_ID = "greenup-accessibility-styles";

  function instalarEstilos() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      :root { --greenup-accessible-green: #176b2c; --greenup-focus: #075985; }
      .greenup-skip-link { position: fixed; left: 12px; top: 8px; z-index: 20000; padding: 12px 16px; border-radius: 8px; background: #fff; color: #003d6c; font-weight: 800; transform: translateY(-150%); }
      .greenup-skip-link:focus { transform: translateY(0); }
      :where(a, button, input, select, textarea, [tabindex]):focus-visible { outline: 3px solid var(--greenup-focus) !important; outline-offset: 3px !important; }
      :where(p, td, th, a, button, label, input, select, textarea) { overflow-wrap: anywhere; }
      .text-success:not(.brand-name), footer h1, footer h2, footer h3, footer h4 { color: var(--greenup-accessible-green) !important; }
      .greenup-table-scroll { max-width: 100%; overflow-x: auto !important; overscroll-behavior-inline: contain; -webkit-overflow-scrolling: touch; }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
      }
      @media (max-width: 767.98px) {
        button, .btn, [role="button"], nav a { min-height: 44px; }
        table.greenup-responsive-table { width: 100% !important; min-width: 0 !important; display: block; border: 0; }
        table.greenup-responsive-table thead { position: absolute !important; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
        table.greenup-responsive-table tbody { width: 100%; display: grid; gap: 14px; }
        table.greenup-responsive-table tbody tr { min-width: 0; display: grid; overflow: hidden; border: 1px solid #d9e5df; border-radius: 16px; background: #fff; }
        table.greenup-responsive-table tbody td { min-width: 0 !important; width: auto !important; display: grid; grid-template-columns: minmax(96px, .4fr) minmax(0, 1fr); gap: 10px; padding: 11px 12px !important; border: 0; border-bottom: 1px solid #e5ece8; white-space: normal !important; }
        table.greenup-responsive-table tbody td::before { content: attr(data-label); color: #475569; font-size: .72rem; font-weight: 800; text-transform: uppercase; }
        table.greenup-responsive-table tbody td:last-child { border-bottom: 0; }
        table.greenup-responsive-table tbody td[colspan] { display: block; text-align: center; }
        table.greenup-responsive-table tbody td[colspan]::before { display: none; }
      }
      @media (min-width: 768px) and (max-width: 1024px) {
        table.greenup-responsive-table { min-width: 720px; }
      }
    `;
    document.head.appendChild(style);
  }

  function asegurarContenidoPrincipal() {
    let main = document.querySelector("main, [role='main']");
    if (!main) main = document.querySelector(".main-content, .dashboard-main, .page-content, .container");
    if (!main) return;
    main.id ||= "contenido-principal";
    main.setAttribute("role", "main");
    if (!document.querySelector(".greenup-skip-link")) {
      const link = document.createElement("a");
      link.className = "greenup-skip-link";
      link.href = `#${main.id}`;
      link.textContent = "Saltar al contenido principal";
      document.body.prepend(link);
    }
  }

  function etiquetarControles(root = document) {
    root.querySelectorAll?.("input:not([type='hidden']), select, textarea").forEach((control, index) => {
      if (control.closest("label") || control.getAttribute("aria-label") || control.getAttribute("aria-labelledby")) return;
      control.id ||= `greenup-control-${index}-${Math.random().toString(36).slice(2, 7)}`;
      let label = document.querySelector(`label[for='${CSS.escape(control.id)}']`);
      if (!label) label = control.closest(".form-group, .field, .mb-3, .input-group")?.querySelector("label");
      if (label) {
        label.htmlFor = control.id;
      } else {
        const nombre = control.getAttribute("placeholder") || control.getAttribute("name") || "Campo del formulario";
        control.setAttribute("aria-label", nombre.replace(/[_-]+/g, " "));
      }
    });
  }

  function prepararTablas(root = document) {
    const tablas = root.matches?.("table") ? [root] : Array.from(root.querySelectorAll?.("table") || []);
    tablas.forEach((tabla) => {
      const headers = Array.from(tabla.querySelectorAll("thead th")).map((th) => th.textContent.trim());
      if (!headers.length || !tabla.querySelector("tbody")) return;
      tabla.classList.add("greenup-responsive-table");
      tabla.parentElement?.classList.add("greenup-table-scroll");
      tabla.querySelectorAll("tbody tr").forEach((row) => {
        Array.from(row.children).forEach((cell, index) => {
          if (cell.tagName === "TD" && !cell.hasAttribute("colspan")) cell.dataset.label ||= headers[index] || "Dato";
        });
      });
    });
  }

  function mejorarMensajes(root = document) {
    root.querySelectorAll?.(".alert, .error-message, [data-error]").forEach((item) => {
      item.setAttribute("role", item.classList.contains("alert-danger") ? "alert" : "status");
      item.setAttribute("aria-live", "polite");
    });
  }

  function aplicar(root = document) {
    etiquetarControles(root);
    prepararTablas(root);
    mejorarMensajes(root);
  }

  function iniciar() {
    instalarEstilos();
    asegurarContenidoPrincipal();
    aplicar();
    new MutationObserver((changes) => changes.forEach((change) => change.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) aplicar(node);
    }))).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar, { once: true });
  else iniciar();
})();
