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
  const formLogin = document.getElementById("form-login");
  if (formLogin) {
    formLogin.addEventListener("submit", iniciarSesion);
  }
});

/**
 * Ejecuta el cierre de sesión, limpia el almacenamiento y redirige al login.
 */
function ejecutarCierreSesion() {
  localStorage.removeItem("usuario");
  localStorage.removeItem("token");
  // Verifica que esta ruta funcione correctamente según el nivel de carpetas en el que estés
  window.location.href = "../../pages/public/public_login.html";
}