// Esta funcion se ejecuta cuando el usuario envia el formulario de login.
async function iniciarSesion(evento) {
  // Evita que la pagina se recargue al enviar el formulario.
  evento.preventDefault();

  // Tomamos lo que el usuario escribio en los inputs.
  const usuario = document.getElementById("usuario").value;
  const contrasena = document.getElementById("contrasena").value;

  // Enviamos los datos al backend usando fetch.
  const respuesta = await fetch(API_URL + "/api/auth/login", {
    method: "POST",

    // Le decimos al backend que estamos enviando JSON.
    headers: {
      "Content-Type": "application/json",
    },

    // Convertimos los datos de JavaScript a JSON.
    body: JSON.stringify({
      usuario: usuario,
      contrasena: contrasena,
    }),
  });

  // Convertimos la respuesta del backend a un objeto de JavaScript.
  const datos = await respuesta.json();

  // Si la respuesta fue correcta, guardamos el usuario.
  if (respuesta.ok) {
    localStorage.setItem("usuario", JSON.stringify(datos.usuario));

    // Dependiendo del rol, mandamos al usuario a su panel.
    if (datos.usuario.id_rol === 1) {
      window.location.href = "../admin_sistema/admin_panel.html";
    }

    if (datos.usuario.id_rol === 2) {
      window.location.href = "../dueno_recicladora/recicladora_panel.html";
    }

    if (datos.usuario.id_rol === 3) {
      window.location.href = "../ciudadano/ciudadano_panel.html";
    }
  } else {
    // Si hubo error, mostramos el mensaje que manda el backend.
    alert(datos.mensaje);
  }
}
