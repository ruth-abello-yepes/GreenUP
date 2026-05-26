// Este archivo protege paginas privadas.
// Si no hay usuario guardado, manda al login.

const usuarioGuardado = localStorage.getItem("usuario");

if (!usuarioGuardado) {
  alert("Debes iniciar sesion primero");
  window.location.href = "../public/public_login.html";
}
