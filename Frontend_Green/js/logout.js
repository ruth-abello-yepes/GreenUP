// Esta funcion cierra la sesion del usuario.

function cerrarSesion() {
  localStorage.removeItem("usuario");
  window.location.href = "../public/public_login.html";
}
