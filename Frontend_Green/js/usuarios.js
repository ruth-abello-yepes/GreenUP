/*
    Archivo: usuarios.js

    Para que sirve:
    Este archivo contiene la funcion para registrar un ciudadano.

    Importante:
    Este registro es solo para ciudadanos.

    El ciudadano NO escoge el rol desde el frontend.
    El backend le asigna automaticamente:

    id_rol = 3
    id_estado = 1

    Ruta que usa este archivo:
    POST https://greenup-hoxj.onrender.com/api/usuarios/registro
*/

const MENSAJE_CONTRASENA_SEGURA =
  "La contrasena debe tener minimo 8 caracteres, una mayuscula, una minuscula, un numero y un caracter especial.";
const MENSAJE_USUARIO_CORTO =
  "El usuario debe tener minimo 5 caracteres.";
const MENSAJE_DOCUMENTO_INVALIDO =
  "La cedula o documento debe tener minimo 5 numeros.";

function validarContrasenaSegura(contrasena) {
  return (
    contrasena.length >= 8 &&
    /[A-Z]/.test(contrasena) &&
    /[a-z]/.test(contrasena) &&
    /\d/.test(contrasena) &&
    /[^A-Za-z0-9\s]/.test(contrasena) &&
    !/\s/.test(contrasena)
  );
}

function limpiarDocumentoUsuario(documento) {
  /*
        Dejamos el documento solamente con numeros.
        Asi 1.234.567 y 1234567 se validan como el mismo documento.
    */
  return String(documento || "").replace(/\D/g, "");
}

async function registrarUsuario(evento) {
  /*
        preventDefault evita que el formulario recargue la pagina.

        Si no usamos esto, el navegador actualiza la pagina
        y no deja terminar el envio de datos al backend.
    */
  evento.preventDefault();

  /*
        Aqui tomamos los valores escritos en el formulario.

        document.getElementById("nombres")
        busca en el HTML el elemento que tiene id="nombres".

        .value toma el valor que el usuario escribio.
    */
  const nombres = document.getElementById("nombres").value;
  const apellidos = document.getElementById("apellidos").value;
  const correo = document.getElementById("correo").value;
  const usuario = document.getElementById("usuario").value.trim();
  const contrasena = document.getElementById("contrasena").value;
  const numero_documento = limpiarDocumentoUsuario(document.getElementById("numero_documento").value);
  const celular = document.getElementById("celular").value;
  const id_tipo_documento = document.getElementById("id_tipo_documento").value;

  if (!validarContrasenaSegura(contrasena)) {
    alert(MENSAJE_CONTRASENA_SEGURA);
    return;
  }

  if (usuario.length < 5) {
    alert(MENSAJE_USUARIO_CORTO);
    return;
  }

  if (numero_documento.length < 5) {
    alert(MENSAJE_DOCUMENTO_INVALIDO);
    return;
  }

  /*
        fetch sirve para conectarnos con el backend.

        API_URL esta guardado en el archivo api.js.
        Normalmente API_URL vale:

        https://greenup-hoxj.onrender.com

        Entonces la ruta completa queda:

        https://greenup-hoxj.onrender.com/api/usuarios/registro
    */
  const respuesta = await fetch(API_URL + "/api/usuarios/registro", {
    method: "POST",

    /*
            headers le dice al backend que los datos van en formato JSON.
        */
    headers: {
      "Content-Type": "application/json",
    },

    /*
            body contiene los datos que se enviaran al backend.

            JSON.stringify convierte el objeto de JavaScript
            en texto JSON para que Flask lo pueda recibir.

            Number(id_tipo_documento) convierte el valor a numero,
            porque desde el HTML llega como texto.
        */
    body: JSON.stringify({
      nombres: nombres,
      apellidos: apellidos,
      correo: correo,
      usuario: usuario,
      contrasena: contrasena,
      numero_documento: numero_documento,
      celular: celular,
      foto_perfil: "",
      id_tipo_documento: Number(id_tipo_documento),
    }),
  });

  /*
        Convertimos la respuesta del backend a un objeto de JavaScript.

        Por ejemplo, si el backend responde:
        {"mensaje": "Ciudadano registrado correctamente"}

        aqui queda guardado en la variable datos.
    */
  const datos = await respuesta.json();

  /*
        respuesta.ok significa que el backend respondio bien.

        Ejemplo:
        200 correcto
        201 creado correctamente
    */
  if (respuesta.ok) {
    alert("Ciudadano registrado correctamente");

    /*
            Despues de registrarse, mandamos al usuario
            al login normal.
        */
    window.location.href = "public_login.html";
  } else {
    /*
            Si algo sale mal, mostramos el mensaje que envia el backend.
        */
    alert(datos.mensaje);
  }
}
