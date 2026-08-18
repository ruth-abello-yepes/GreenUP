/**
 * Archivo: auth.js
 * Maneja la autenticación para Dueños de Recicladora (Rol 2) y Ciudadanos (Rol 3).
 */

/**
 * Captura el evento del formulario de login, envía las credenciales al backend 
 * y redirige al usuario a su panel correspondiente según su rol.
 * * @async
 * @function iniciarSesion
 * @param {Event} evento - El evento de envío (submit) del formulario HTML.
 * @returns {Promise<void>} No retorna ningún valor, redirige la ventana del navegador.
 */
async function iniciarSesion(evento) {
  // Evita que la página se recargue al presionar "Ingresar"
  evento.preventDefault();

  // 1. Capturamos los campos (soporta id "usuario" o "email")
  const campoUsuario = document.getElementById("usuario") || document.getElementById("email");
  const campoContrasena = document.getElementById("contrasena") || document.getElementById("password");

  const credenciales = {
    usuario: campoUsuario.value.trim(),
    contrasena: campoContrasena.value
  };

  // 2. Usamos nuestra función unificada (asumiendo que api.js está vinculado en el HTML antes que auth.js)
  try {
    const respuesta = await peticionSegura("/api/login", "POST", credenciales);

    if (respuesta.ok) {
      // 3. Guardamos la información en el navegador
      // Se asume que Flask ahora nos devuelve: { "token": "ey...", "usuario": {...} }
      localStorage.setItem("usuario", JSON.stringify(respuesta.datos.usuario));

      // Guardar el Token es vital para proteger futuras rutas
      if (respuesta.datos.token) {
        localStorage.setItem("token", respuesta.datos.token);
      }

      // 4. Redirección basada en roles
      const rol = Number(respuesta.datos.usuario.id_rol);

      if (rol === 2) {
        window.location.href = "../dueno_recicladora/recicladora_panel.html";
        return;
      }

      if (rol === 3) {
        // Redirige a la pantalla de inicio del ciudadano
        window.location.href = "../ciudadano/ciudadano_inicio.html";
        return;
      }

      // 5. Bloqueo de seguridad para Administradores
      alert("Acceso denegado: Este portal es exclusivo para Ciudadanos y Centros de Reciclaje.");
      localStorage.removeItem("usuario");
      localStorage.removeItem("token");

    } else {
      // El backend rechazó las credenciales (Contraseña incorrecta, etc.)
      alert(`Error de acceso: ${respuesta.datos.mensaje || "Credenciales inválidas"}`);
    }
  } catch (error) {
    alert("Ocurrió un error al intentar comunicarse con el servidor. Intente más tarde.");
  }
}

// Vinculamos la función al formulario de login (Asegúrate de que tu form tenga id="form-login")
document.addEventListener("DOMContentLoaded", () => {
  const formLogin = document.getElementById("form-login") || document.getElementById("loginForm");
  if (formLogin && !formLogin.getAttribute("onsubmit")) {
    formLogin.addEventListener("submit", iniciarSesion);
  }
});

/**
 * Cierra la sesion del usuario activo, limpia credenciales y redirige al login.
 *
 * Esta funcion NO pregunta confirmacion. Es la accion final que se ejecuta
 * despues de que el usuario confirme que realmente quiere salir.
 *
 * @returns {void} No retorna datos porque cambia la pagina actual.
 */
function cerrarSesion() {
  // Quitamos el token JWT para que la sesion deje de estar autorizada.
  localStorage.removeItem("token");

  // Quitamos los datos del usuario guardados en el navegador.
  localStorage.removeItem("usuario");

  // Redirigimos al login publico desde las paginas ubicadas dentro de pages.
  window.location.href = "../public/public_login.html";
}

/**
 * Crea una ventana modal Bootstrap para confirmar el cierre de sesion.
 *
 * La creamos desde JavaScript para no repetir el mismo HTML en todas las
 * paginas de ciudadano. Asi todos los botones trabajan de la mano con auth.js.
 *
 * @returns {HTMLElement} Elemento HTML del modal de confirmacion.
 */
function crearModalCerrarSesion() {
  // Si el modal ya existe, lo reutilizamos.
  const modalExistente = document.getElementById("modal-confirmar-cerrar-sesion");

  if (modalExistente) {
    return modalExistente;
  }

  // Creamos el contenedor principal del modal.
  const modal = document.createElement("div");

  // Asignamos clases Bootstrap para que se vea como una ventana real.
  modal.className = "modal fade";

  // Este id permite encontrar el modal despues.
  modal.id = "modal-confirmar-cerrar-sesion";

  // Evita cerrar la ventana tocando el fondo por accidente.
  modal.setAttribute("data-bs-backdrop", "static");

  // Evita cerrar la ventana con la tecla ESC por accidente.
  modal.setAttribute("data-bs-keyboard", "false");

  // Atributos de accesibilidad para lectores de pantalla.
  modal.setAttribute("tabindex", "-1");
  modal.setAttribute("aria-labelledby", "modalConfirmarCerrarSesionTitulo");
  modal.setAttribute("aria-hidden", "true");

  // HTML visible del modal: titulo, mensaje y botones.
  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 rounded-4 shadow">
        <div class="modal-header border-0 pb-0">
          <h5 class="modal-title fw-bold text-danger" id="modalConfirmarCerrarSesionTitulo">
            ¿Estas seguro que quieres salir?
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>

        <div class="modal-body text-secondary">
          Se cerrara tu sesion actual y tendras que iniciar sesion nuevamente para entrar a GreenUp.
        </div>

        <div class="modal-footer border-0 pt-0">
          <button type="button" class="btn btn-light rounded-pill px-4" data-bs-dismiss="modal">
            Cancelar
          </button>
          <button type="button" class="btn btn-danger rounded-pill px-4" id="btn-confirmar-cierre-sesion">
            Si, cerrar sesion
          </button>
        </div>
      </div>
    </div>
  `;

  // Agregamos el modal al final del body para que Bootstrap lo pueda mostrar.
  document.body.appendChild(modal);

  // El boton rojo ejecuta el cierre real cuando el usuario confirma.
  document.getElementById("btn-confirmar-cierre-sesion").addEventListener("click", cerrarSesion);

  return modal;
}

/**
 * Muestra la confirmacion antes de cerrar sesion.
 *
 * Esta es la funcion que deben llamar los botones de "Cerrar Sesion" en HTML.
 *
 * @param {Event} evento - Evento click recibido desde el boton o enlace.
 * @returns {boolean} Siempre retorna false para evitar navegacion del enlace.
 */
function confirmarCerrarSesion(evento) {
  // Evitamos que el enlace con href="#" mueva la pagina hacia arriba.
  if (evento) {
    evento.preventDefault();
  }

  // Si Bootstrap esta disponible, mostramos un modal bonito.
  if (window.bootstrap && window.bootstrap.Modal) {
    const modal = crearModalCerrarSesion();
    const instanciaModal = window.bootstrap.Modal.getOrCreateInstance(modal);
    instanciaModal.show();
    return false;
  }

  // Respaldo simple por si alguna pagina no cargo Bootstrap.
  if (confirm("¿Estas seguro que quieres salir?")) {
    cerrarSesion();
  }

  return false;
}

// Dejamos las funciones disponibles para usarlas desde onclick en el HTML.
window.cerrarSesion = cerrarSesion;
window.confirmarCerrarSesion = confirmarCerrarSesion;

// Alias para pantallas antiguas que aun llamen ejecutarCierreSesion().
window.ejecutarCierreSesion = confirmarCerrarSesion;

document.addEventListener("DOMContentLoaded", () => {
  const botonesSalir = document.querySelectorAll(".btn-logout-global");

  botonesSalir.forEach(boton => {
    boton.addEventListener("click", confirmarCerrarSesion);
  });
});