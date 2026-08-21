// Este archivo protege paginas privadas.
// Si no hay usuario y token guardados, manda al login.

const usuarioGuardado = localStorage.getItem("usuario");
const tokenGuardado = localStorage.getItem("token");

if (!usuarioGuardado || !tokenGuardado) {
  localStorage.removeItem("usuario");
  localStorage.removeItem("token");
  alert("Debes iniciar sesion primero");
  window.location.href = "../public/public_login.html";
}
