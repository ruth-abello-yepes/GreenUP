// Archivo: admin_auth.js
// Este archivo maneja el inicio de sesion del administrador.

async function iniciarSesionAdmin(evento) {
  evento.preventDefault();

  const usuario = document.getElementById("usuario").value;
  const contrasena = document.getElementById("contrasena").value;
  const codigoAdmin = document.getElementById("codigo_admin").value;

  const respuesta = await fetch(API_URL + "/api/admin/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      usuario: usuario,
      contrasena: contrasena,
      codigo_admin: codigoAdmin,
    }),
  });

  const datos = await respuesta.json();

  if (respuesta.ok) {
    localStorage.setItem("usuario", JSON.stringify(datos.usuario));

    window.location.href = "../admin_sistema/admin_panel.html";
  } else {
    alert(datos.mensaje);
  }
}
