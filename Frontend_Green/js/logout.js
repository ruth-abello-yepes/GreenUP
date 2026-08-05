// Esta funcion cierra la sesion del usuario.

function cerrarSesion() {
  localStorage.removeItem("usuario");
  localStorage.removeItem("token");
  window.location.href = "../public/public_login.html";
}
