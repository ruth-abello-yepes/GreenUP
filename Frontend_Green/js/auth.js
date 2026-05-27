// Archivo: auth.js
// Este archivo maneja el login normal.
// Aqui entran solamente:
// rol 2 = Dueno de punto ecologico
// rol 3 = Ciudadano

async function iniciarSesion(evento) {
  // Evita que el formulario recargue la pagina.
  evento.preventDefault();

  // Tomamos los datos escritos en el formulario.
  const usuario = document.getElementById("usuario").value;
  const contrasena = document.getElementById("contrasena").value;

  // Enviamos los datos al backend.
  const respuesta = await fetch(API_URL + "/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      usuario: usuario,
      contrasena: contrasena,
    }),
  });

  // Convertimos la respuesta del backend a JavaScript.
  const datos = await respuesta.json();

  if (respuesta.ok) {
    // Guardamos los datos del usuario en el navegador.
    localStorage.setItem("usuario", JSON.stringify(datos.usuario));

    // Convertimos el rol a numero por seguridad.
    const rol = Number(datos.usuario.id_rol);

    // Rol 2: dueno de punto ecologico.
    if (rol === 2) {
      window.location.href = "../dueno_recicladora/recicladora_panel.html";
      return;
    }

    // Rol 3: ciudadano.
    if (rol === 3) {
      window.location.href = "../ciudadano/ciudadano_panel.html";
      return;
    }

    // Si intenta entrar un admin por aqui, no lo dejamos avanzar.
    alert("Este login es solo para ciudadanos y duenos de recicladora.");
    localStorage.removeItem("usuario");
  } else {
    alert(datos.mensaje);
  }
}
