// Esta funcion revisa si el usuario tiene el rol permitido.

function protegerRol(rolPermitido) {
  const usuarioGuardado = localStorage.getItem("usuario");

  if (!usuarioGuardado) {
    alert("Debes iniciar sesion primero");
    window.location.href = "../public/public_login.html";
    return;
  }

  const usuario = JSON.parse(usuarioGuardado);

  if (usuario.id_rol !== rolPermitido) {
    alert("No tienes permiso para entrar a esta pagina");
    window.location.href = "../public/public_login.html";
  }
}
