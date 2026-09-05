// Archivo: admin_auth.js
// Este archivo maneja el inicio de sesion del administrador.

function alternarPasswordAdmin(idCampo, boton) {
  const campo = document.getElementById(idCampo);

  if (!campo) {
    return;
  }

  const mostrar = campo.type === "password";
  campo.type = mostrar ? "text" : "password";

  if (boton) {
    const icono = boton.querySelector(".material-symbols-outlined");
    boton.setAttribute("aria-pressed", String(mostrar));
    boton.setAttribute(
      "aria-label",
      mostrar ? "Ocultar contrasena" : "Mostrar contrasena",
    );

    if (icono) {
      icono.textContent = mostrar ? "visibility_off" : "visibility";
    }
  }
}

async function iniciarSesionAdmin(evento) {
  evento.preventDefault();

  const usuario = document.getElementById("usuario").value;
  const contrasena = document.getElementById("contrasena").value;
  const codigoAdmin = document.getElementById("codigo_admin").value;
  const captcha = (window.grecaptcha?.getResponse?.() || document.querySelector('[name="g-recaptcha-response"]')?.value || document.getElementById("captcha_token")?.value || "").trim();
  if (!captcha) {
    alert("Confirma primero la casilla 'No soy un robot'.");
    return;
  }

  try {
    const respuesta = await fetch(API_URL + "/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usuario: usuario,
        contrasena: contrasena,
        codigo_admin: codigoAdmin,
        captcha_token: captcha,
      }),
    });

    const datos = await respuesta.json();

    if (respuesta.ok) {
      localStorage.setItem("usuario", JSON.stringify(datos.usuario));
      if (datos.token) {
        localStorage.setItem("token", datos.token);
      }
      sessionStorage.setItem("greenup_admin_sesion_activa", "1");

      window.location.href = "../admin_sistema/admin_panel.html";
    } else {
      alert(datos.mensaje || "No se pudo iniciar la sesión administrativa.");
      if (window.grecaptcha && window.grecaptcha.reset) {
        window.grecaptcha.reset();
      }
    }
  } catch (error) {
    console.error("Error en login administrativo:", error);
    alert("No se pudo conectar con el servidor. Intenta nuevamente.");
    if (window.grecaptcha && window.grecaptcha.reset) {
      window.grecaptcha.reset();
    }
  }
}

// El panel administrativo se cierra tras 20 minutos sin actividad.
(function configurarInactividadAdmin() {
  const LIMITE = 20 * 60 * 1000; // 20 minutos
  const TIEMPO_AVISO = 18 * 60 * 1000; // 18 minutos
  let temporizadorAviso;
  let temporizadorCierre;

  // Creamos el modal de inactividad
  function crearModalInactividadAdmin() {
    const modalExistente = document.getElementById("modal-inactividad-admin");
    if (modalExistente) return modalExistente;

    const modal = document.createElement("div");
    modal.className = "modal fade";
    modal.id = "modal-inactividad-admin";
    modal.setAttribute("data-bs-backdrop", "static");
    modal.setAttribute("data-bs-keyboard", "false");
    modal.setAttribute("tabindex", "-1");

    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 rounded-4 shadow">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold text-warning">
              ⚠️ Inactividad detectada
            </h5>
          </div>
          <div class="modal-body text-secondary">
            Tu sesión administrativa se cerrará en 2 minutos por inactividad. ¿Sigues ahí?
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-primary rounded-pill px-4" id="btn-continuar-sesion-admin">
              Sí, seguir conectado
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("btn-continuar-sesion-admin").addEventListener("click", () => {
      if (window.bootstrap && window.bootstrap.Modal) {
        const instanciaModal = window.bootstrap.Modal.getInstance(modal);
        if (instanciaModal) instanciaModal.hide();
      } else {
        modal.style.display = "none";
      }
      reiniciar(); // El usuario hizo clic en continuar, reiniciamos temporizadores
    });

    return modal;
  }

  const mostrarAviso = () => {
    if (window.bootstrap && window.bootstrap.Modal) {
      const modal = crearModalInactividadAdmin();
      const instanciaModal = window.bootstrap.Modal.getOrCreateInstance(modal);
      instanciaModal.show();
    } else {
      // Respaldo por si no hay Bootstrap
      if (window.confirm("Tu sesión administrativa se cerrará en 2 minutos por inactividad. ¿Sigues ahí?")) {
        reiniciar();
      }
    }
  };

  const reiniciar = () => {
    if (!localStorage.getItem("token")) return;
    clearTimeout(temporizadorAviso);
    clearTimeout(temporizadorCierre);

    temporizadorAviso = setTimeout(mostrarAviso, TIEMPO_AVISO);
    temporizadorCierre = setTimeout(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      sessionStorage.removeItem("greenup_admin_sesion_activa");
      
      // Ocultar modal si esta abierto
      const modal = document.getElementById("modal-inactividad-admin");
      if (modal && window.bootstrap && window.bootstrap.Modal) {
        const instanciaModal = window.bootstrap.Modal.getInstance(modal);
        if (instanciaModal) instanciaModal.hide();
      }
      
      window.location.href = "admin_login.html?sesion=expirada";
    }, LIMITE);
  };

  ["click", "keydown", "mousemove", "scroll", "touchstart"].forEach((evento) => window.addEventListener(evento, reiniciar, { passive: true }));
  reiniciar();
})();
