// Archivo: admin_auth.js
// Este archivo maneja el inicio de sesion del administrador.

function alternarPasswordAdmin(idCampo, boton) {
  const campo = document.getElementById(idCampo);

  if (!campo) {
    return;
  }

  const mostrar = campo.type === "password";
  campo.type = mostrar ? "text" : "password";

  if (boton) {
    const icono = boton.querySelector(".material-symbols-outlined");
    boton.setAttribute("aria-pressed", String(mostrar));
    boton.setAttribute(
      "aria-label",
      mostrar ? "Ocultar contrasena" : "Mostrar contrasena",
    );

    if (icono) {
      icono.textContent = mostrar ? "visibility_off" : "visibility";
    }
  }
}

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
    if (datos.token) {
      localStorage.setItem("token", datos.token);
    }

    window.location.href = "../admin_sistema/admin_panel.html";
  } else {
    alert(datos.mensaje);
  }
}
