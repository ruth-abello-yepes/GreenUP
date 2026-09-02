// Solicita confirmacion antes de eliminar la sesion del usuario.
async function cerrarSesion(evento) {
  evento?.preventDefault();
  const confirmar = typeof window.greenupConfirm === "function"
    ? await window.greenupConfirm("¿Seguro que deseas cerrar la sesión?", "Cerrar sesión")
    : window.confirm("¿Seguro que deseas cerrar la sesión?");
  if (!confirmar) return false;

  localStorage.removeItem("usuario");
  localStorage.removeItem("token");
  window.location.href = "../public/public_login.html";
  return true;
}
