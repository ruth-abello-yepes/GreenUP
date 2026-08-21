// Esta funcion revisa si el usuario tiene el rol permitido.

function protegerRol(rolPermitido) {
  const usuarioGuardado = localStorage.getItem("usuario");
  const tokenGuardado = localStorage.getItem("token");

  if (!usuarioGuardado || !tokenGuardado) {
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    alert("Debes iniciar sesion primero");
    window.location.href = "../public/public_login.html";
    return;
  }

  let usuario = {};

  try {
    usuario = JSON.parse(usuarioGuardado);
  } catch (error) {
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    alert("La sesion guardada no es valida. Inicia sesion nuevamente");
    window.location.href = "../public/public_login.html";
    return;
  }

  if (Number(usuario.id_rol) !== Number(rolPermitido)) {
    alert("No tienes permiso para entrar a esta pagina");
    window.location.href = "../public/public_login.html";
  }
}
