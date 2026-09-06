/*
  Modales globales GreenUp.
  Reemplazan las ventanas nativas del navegador por dialogos centrados,
  consistentes en todas las pantallas y roles.
*/

(function () {
  "use strict";

  if (window.greenupAlert && window.greenupConfirm && window.greenupPrompt) return;

  function asegurarEstilos() {
    if (document.getElementById("greenup-modal-alerts-style")) return;
    const style = document.createElement("style");
    style.id = "greenup-modal-alerts-style";
    style.textContent = `
      .greenup-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: grid;
        place-items: center;
        padding: 20px;
        background: rgba(5, 15, 28, .62);
        backdrop-filter: blur(4px);
      }
      .greenup-modal-card {
        width: min(520px, 100%);
        max-height: min(82vh, 680px);
        overflow: auto;
        border: 1px solid #cfe7d8;
        border-radius: 22px;
        background: #ffffff !important;
        box-shadow: 0 28px 80px rgba(0, 0, 0, .28);
        color: #102033 !important;
      }
      .greenup-modal-header {
        display: flex;
        gap: 14px;
        align-items: flex-start;
        padding: 26px 26px 18px;
        background: #f4fbf7;
        border-bottom: 1px solid #dbeee4;
      }
      .greenup-modal-icon {
        flex: 0 0 auto;
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border-radius: 16px;
        background: #0b7d3b;
        color: #ffffff;
        font-weight: 900;
        box-shadow: 0 8px 18px rgba(11, 125, 59, .24);
      }
      .greenup-modal-title {
        margin: 0;
        font: 800 1.25rem/1.25 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: #003b6f !important;
      }
      .greenup-modal-message {
        margin: 8px 0 0;
        white-space: pre-line;
        color: #26384d !important;
        line-height: 1.55;
        font-weight: 500;
      }
      .greenup-modal-body {
        padding: 8px 26px 0;
      }
      .greenup-modal-input {
        width: 100%;
        min-height: 48px;
        border: 1px solid #d7e1dc;
        border-radius: 14px;
        padding: 12px 14px;
        outline: none;
        font: inherit;
      }
      .greenup-modal-input:focus {
        border-color: #128246;
        box-shadow: 0 0 0 4px rgba(18, 130, 70, .12);
      }
      .greenup-modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 22px 26px 26px;
        background: #ffffff;
      }
      .greenup-modal-button {
        min-height: 44px;
        border: 1px solid #d7e1dc;
        border-radius: 999px;
        padding: 0 22px;
        background: #fff;
        color: #003b6f !important;
        font-weight: 800;
        cursor: pointer;
      }
      .greenup-modal-button.primary {
        border-color: #075c2e;
        background: #0b7d3b !important;
        color: #ffffff !important;
        box-shadow: 0 10px 22px rgba(11, 125, 59, .22);
      }
      .greenup-modal-button.danger {
        border-color: #b42318;
        background: #b42318 !important;
        color: #fff !important;
      }
      .greenup-modal-button:hover {
        filter: brightness(.96);
        transform: translateY(-1px);
      }
      .greenup-modal-button:focus-visible {
        outline: 3px solid rgba(0, 91, 172, .28);
        outline-offset: 3px;
      }
      @media (max-width: 520px) {
        .greenup-modal-backdrop { padding: 14px; }
        .greenup-modal-card { border-radius: 20px; }
        .greenup-modal-actions { flex-direction: column-reverse; }
        .greenup-modal-button { width: 100%; }
      }
    `;
    document.head.appendChild(style);
  }

  function crearModal({ titulo = "GreenUp", mensaje = "", tipo = "info", input = false, valor = "", textoAceptar = "Aceptar", textoCancelar = "Cancelar" }) {
    asegurarEstilos();
    return new Promise((resolve) => {
      const focoAnterior = document.activeElement;
      const backdrop = document.createElement("div");
      const icono = tipo === "danger" ? "!" : tipo === "confirm" ? "?" : "✓";
      backdrop.className = "greenup-modal-backdrop";
      backdrop.innerHTML = `
        <section class="greenup-modal-card" role="dialog" aria-modal="true" aria-labelledby="greenup-modal-title">
          <header class="greenup-modal-header">
            <span class="greenup-modal-icon">${icono}</span>
            <div>
              <h2 id="greenup-modal-title" class="greenup-modal-title">${escapar(titulo)}</h2>
              <p class="greenup-modal-message">${escapar(mensaje)}</p>
            </div>
          </header>
          ${input ? `<div class="greenup-modal-body"><input class="greenup-modal-input" aria-label="${escapar(mensaje || titulo)}" value="${escapar(valor)}"></div>` : ""}
          <footer class="greenup-modal-actions">
            ${tipo === "confirm" || input ? `<button class="greenup-modal-button" type="button" data-modal-cancel>${escapar(textoCancelar)}</button>` : ""}
            <button class="greenup-modal-button ${tipo === "danger" ? "danger" : "primary"}" type="button" data-modal-ok>${escapar(textoAceptar)}</button>
          </footer>
        </section>
      `;
      document.body.appendChild(backdrop);
      const fondo = Array.from(document.body.children).filter(n => n !== backdrop && !n.inert);
      fondo.forEach(n => { n.inert = true; });
      const campo = backdrop.querySelector(".greenup-modal-input");
      const cerrar = (resultado) => {
        document.removeEventListener("keydown", manejarTeclado);
        backdrop.remove();
        fondo.forEach(n => { n.inert = false; });
        if (focoAnterior?.isConnected) focoAnterior.focus();
        resolve(resultado);
      };
      backdrop.querySelector("[data-modal-ok]").addEventListener("click", () => cerrar(input ? campo.value : true));
      backdrop.querySelector("[data-modal-cancel]")?.addEventListener("click", () => cerrar(input ? null : false));
      backdrop.addEventListener("click", (evento) => {
        if (evento.target === backdrop) cerrar(input ? null : false);
      });
      function manejarTeclado(evento) {
        if (evento.key === "Escape") {
          evento.preventDefault();
          cerrar(input ? null : false);
        } else if (evento.key === "Tab") {
          const controles = [...backdrop.querySelectorAll("input, button")];
          const primero = controles[0], ultimo = controles.at(-1);
          if (evento.shiftKey && document.activeElement === primero) {
            evento.preventDefault(); ultimo.focus();
          } else if (!evento.shiftKey && document.activeElement === ultimo) {
            evento.preventDefault(); primero.focus();
          }
        }
      }
      document.addEventListener("keydown", manejarTeclado);
      setTimeout(() => (campo || backdrop.querySelector("[data-modal-ok]"))?.focus(), 30);
    });
  }

  function escapar(valor) {
    return String(valor ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  window.greenupAlert = (mensaje, titulo = "GreenUp") => crearModal({ titulo, mensaje, tipo: "info" });
  window.greenupConfirm = (mensaje, titulo = "Confirmar") => crearModal({ titulo, mensaje, tipo: "confirm" });
  window.greenupPrompt = (mensaje, valor = "", titulo = "Completar información") => crearModal({ titulo, mensaje, tipo: "confirm", input: true, valor });

  window.alert = function (mensaje) {
    window.greenupAlert(mensaje);
  };
})();
