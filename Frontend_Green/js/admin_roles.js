/*
    Archivo: admin_roles.js

    Para que sirve:
    Carga los roles registrados en la base de datos
    y los muestra en la tabla del panel administrador.
*/

async function cargarRoles() {
  /*
        Nos conectamos al backend para pedir la lista de roles.

        Ruta:
        GET http://127.0.0.1:5000/api/roles/listar
    */
  const respuesta = await fetch(API_URL + "/api/roles/listar");

  /*
        Convertimos la respuesta del backend a JavaScript.
    */
  const datos = await respuesta.json();

  /*
        Si hay error, mostramos el mensaje del backend.
    */
  if (!respuesta.ok) {
    alert(datos.mensaje);
    return;
  }

  /*
        Buscamos el cuerpo de la tabla en el HTML.
    */
  const tabla = document.getElementById("tabla-roles");

  /*
        Limpiamos la tabla antes de llenarla.
    */
  tabla.innerHTML = "";

  /*
        Recorremos todos los roles que llegaron del backend.
    */
  datos.forEach(function (rol) {
    tabla.innerHTML += `
            <tr>
                <td>${rol.id_rol}</td>
                <td>${rol.nombre}</td>
                <td>${rol.descripcion || ""}</td>
                <td>
                    <span class="${rol.id_estado === 1 ? "estado-activo" : "estado-inactivo"}">
                        ${rol.id_estado === 1 ? "Activo" : "Inactivo"}
                    </span>
                </td>
            </tr>
        `;
  });
}
