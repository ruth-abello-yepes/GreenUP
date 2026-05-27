// Archivo: admin_usuarios.js
// Este archivo carga las tablas del administrador:
// 1. Ciudadanos
// 2. Duenos de punto ecologico

async function cargarUsuariosAdmin() {
  // Tomamos el usuario guardado cuando el admin inicio sesion.
  const usuarioGuardado = localStorage.getItem("usuario");

  if (!usuarioGuardado) {
    alert("Debes iniciar sesion como administrador.");
    window.location.href = "../public/admin_login.html";
    return;
  }

  const admin = JSON.parse(usuarioGuardado);

  if (Number(admin.id_rol) !== 1) {
    alert("No tienes permisos de administrador.");
    window.location.href = "../public/public_login.html";
    return;
  }

  await cargarCiudadanos(admin);
  await cargarDuenosRecicladora(admin);
}

async function cargarCiudadanos(admin) {
  const respuesta = await fetch(API_URL + "/api/usuarios/ciudadanos", {
    method: "GET",
    headers: {
      "id-usuario": admin.id_usuario,
      "id-rol": admin.id_rol,
    },
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    alert(datos.mensaje);
    return;
  }

  const tabla = document.getElementById("tabla-ciudadanos");

  tabla.innerHTML = "";

  datos.forEach(function (ciudadano) {
    tabla.innerHTML += `
      <tr>
        <td>${ciudadano.id_usuario}</td>
        <td>${ciudadano.nombres} ${ciudadano.apellidos}</td>
        <td>${ciudadano.usuario}</td>
        <td>${ciudadano.correo}</td>
        <td>${ciudadano.numero_documento}</td>
        <td>${ciudadano.celular || ""}</td>
        <td>${ciudadano.fecha_registro}</td>
        <td>
  <span class="${ciudadano.id_estado === 1 ? "estado-activo" : "estado-inactivo"}">
    ${ciudadano.id_estado === 1 ? "Activo" : "Inactivo"}
  </span>
</td>
      </tr>
    `;
  });
}

async function cargarDuenosRecicladora(admin) {
  const respuesta = await fetch(API_URL + "/api/recicladoras/listar", {
    method: "GET",
    headers: {
      "id-usuario": admin.id_usuario,
      "id-rol": admin.id_rol,
    },
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    alert(datos.mensaje);
    return;
  }

  const tabla = document.getElementById("tabla-duenos");

  tabla.innerHTML = "";

  datos.forEach(function (dueno) {
    tabla.innerHTML += `
      <tr>
        <td>${dueno.id_usuario}</td>
        <td>${dueno.nombres} ${dueno.apellidos}</td>
        <td>${dueno.usuario}</td>
        <td>${dueno.correo}</td>
        <td>${dueno.nombre_empresa}</td>
        <td>${dueno.nit_empresa}</td>
        <td>${dueno.direccion_empresa}</td>
        <td>${dueno.telefono_empresa || ""}</td>
        <td>
  <span class="${dueno.id_estado === 1 ? "estado-activo" : "estado-inactivo"}">
    ${dueno.id_estado === 1 ? "Activo" : "Inactivo"}
  </span>
</td>
      </tr>
    `;
  });
}
