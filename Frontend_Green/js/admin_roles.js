/*
    Archivo: admin_roles.js
    Para que sirve:
    Permite al administrador registrar y listar roles.
*/

async function registrarRolAdmin(evento) {
  // Evita que la pagina se recargue.
  evento.preventDefault();

  // Tomamos los datos del formulario.
  const nombre = document.getElementById("nombre").value;
  const descripcion = document.getElementById("descripcion").value;

  // Tomamos el usuario guardado para enviar headers.
  const usuarioGuardado = localStorage.getItem("usuario");
  const usuarioActual = JSON.parse(usuarioGuardado);

  // Enviamos el rol al backend.
  const respuesta = await fetch(API_URL + "/api/roles/registrar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      id_usuario: usuarioActual.id_usuario,
      id_rol: usuarioActual.id_rol,
    },
    body: JSON.stringify({
      nombre: nombre,
      descripcion: descripcion,
    }),
  });

  const datos = await respuesta.json();

  alert(datos.mensaje);

  if (respuesta.ok) {
    listarRolesAdmin();
  }
}

async function listarRolesAdmin() {
  // Tomamos el usuario guardado para enviar headers.
  const usuarioGuardado = localStorage.getItem("usuario");

  if (!usuarioGuardado) {
    alert("Debes iniciar sesion");
    return;
  }

  const usuarioActual = JSON.parse(usuarioGuardado);

  // Pedimos los roles al backend.
  const respuesta = await fetch(API_URL + "/api/roles/listar", {
    method: "GET",
    headers: {
      id_usuario: usuarioActual.id_usuario,
      id_rol: usuarioActual.id_rol,
    },
  });

  const datos = await respuesta.json();

  const tabla = document.getElementById("tabla_roles");

  // Limpiamos la tabla antes de llenarla.
  tabla.innerHTML = "";

  if (!respuesta.ok) {
    alert(datos.mensaje);
    return;
  }

  // Agregamos cada rol a la tabla.
  datos.forEach(function (rol) {
    const fila = document.createElement("tr");

    fila.innerHTML = `
            <td>${rol.id_rol}</td>
            <td>${rol.nombre}</td>
            <td>${rol.descripcion}</td>
            <td>${rol.id_estado}</td>
        `;

    tabla.appendChild(fila);
  });
}
