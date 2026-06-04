/*
    Archivo: registro.js

    Para que sirve:
    Maneja el formulario de registro de GreenUp.

    Este archivo registra dos tipos de usuarios:

    1. Ciudadano
       Ruta:
       POST http://127.0.0.1:5000/api/usuarios/registro

    2. Dueno de punto ecologico
       Ruta:
       POST http://127.0.0.1:5000/api/recicladoras/registro

    Nota:
    La camara de comercio por ahora guarda el nombre del archivo.
    No guarda el archivo real en el servidor todavia.
*/

let pasoActual = 1;
const totalPasos = 3;
const MENSAJE_CONTRASENA_SEGURA =
  "La contrasena debe tener minimo 8 caracteres, una mayuscula, una minuscula, un numero y un caracter especial.";

function validarContrasenaSegura(contrasena) {
  const tieneMinimo = contrasena.length >= 8;
  const tieneMayuscula = /[A-Z]/.test(contrasena);
  const tieneMinuscula = /[a-z]/.test(contrasena);
  const tieneNumero = /\d/.test(contrasena);
  const tieneEspecial = /[^A-Za-z0-9\s]/.test(contrasena);
  const sinEspacios = !/\s/.test(contrasena);

  return (
    tieneMinimo &&
    tieneMayuscula &&
    tieneMinuscula &&
    tieneNumero &&
    tieneEspecial &&
    sinEspacios
  );
}

function actualizarAyudaContrasena() {
  const campoContrasena = document.getElementById("contrasena");
  const ayudaContrasena = document.getElementById("ayuda-contrasena");

  if (!campoContrasena || !ayudaContrasena) {
    return;
  }

  if (!campoContrasena.value) {
    ayudaContrasena.classList.remove("text-success", "text-danger");
    ayudaContrasena.classList.add("text-muted");
    ayudaContrasena.textContent = MENSAJE_CONTRASENA_SEGURA;
    return;
  }

  if (validarContrasenaSegura(campoContrasena.value)) {
    ayudaContrasena.classList.remove("text-muted", "text-danger");
    ayudaContrasena.classList.add("text-success");
    ayudaContrasena.textContent = "La contrasena cumple los requisitos.";
    return;
  }

  ayudaContrasena.classList.remove("text-muted", "text-success");
  ayudaContrasena.classList.add("text-danger");
  ayudaContrasena.textContent = MENSAJE_CONTRASENA_SEGURA;
}

function alternarVisibilidadContrasena(idCampo, boton) {
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

function mostrarCamposEmpresa() {
  /*
        Muestra los campos de empresa cuando la persona
        escoge "Dueno de punto ecologico".
    */

  const tipoRegistro = document.getElementById("tipo_registro").value;
  const camposEmpresa = document.getElementById("campos-empresa");

  if (tipoRegistro === "recicladora") {
    camposEmpresa.classList.remove("d-none");
  } else {
    camposEmpresa.classList.add("d-none");
  }
}

function siguientePaso() {
  /*
        Avanza de un paso al siguiente.

        Si ya estamos en el ultimo paso,
        llama a registrarCuenta().
    */

  if (pasoActual < totalPasos) {
    document.getElementById("seccion-" + pasoActual).classList.add("d-none");

    pasoActual = pasoActual + 1;

    document.getElementById("seccion-" + pasoActual).classList.remove("d-none");

    actualizarVistaPasos();
    return;
  }

  registrarCuenta();
}

function pasoAnterior() {
  /*
        Regresa al paso anterior.
    */

  if (pasoActual > 1) {
    document.getElementById("seccion-" + pasoActual).classList.add("d-none");

    pasoActual = pasoActual - 1;

    document.getElementById("seccion-" + pasoActual).classList.remove("d-none");

    actualizarVistaPasos();
  }
}

function actualizarVistaPasos() {
  /*
        Actualiza:
        - Barras superiores
        - Boton de volver
        - Texto del boton principal
    */

  for (let numero = 1; numero <= totalPasos; numero++) {
    const barra = document.getElementById("barra-" + numero);

    if (numero <= pasoActual) {
      barra.classList.add("paso-activo");
    } else {
      barra.classList.remove("paso-activo");
    }
  }

  const botonAtras = document.getElementById("btn-atras");
  const botonSiguiente = document.getElementById("btn-siguiente");

  if (pasoActual === 1) {
    botonAtras.classList.add("d-none");
  } else {
    botonAtras.classList.remove("d-none");
  }

  if (pasoActual === totalPasos) {
    botonSiguiente.textContent = "Crear cuenta";
    botonSiguiente.classList.remove("boton-principal");
    botonSiguiente.classList.add("boton-secundario");
  } else {
    botonSiguiente.textContent = "Continuar";
    botonSiguiente.classList.remove("boton-secundario");
    botonSiguiente.classList.add("boton-principal");
  }
}

async function registrarCuenta() {
  /*
        Toma los datos del formulario y los envia al backend.
    */

  const tipoRegistro = document.getElementById("tipo_registro").value;

  const nombres = document.getElementById("nombres").value;
  const apellidos = document.getElementById("apellidos").value;
  const correo = document.getElementById("correo").value;
  const celular = document.getElementById("celular").value;
  const idTipoDocumento = document.getElementById("id_tipo_documento").value;
  const numeroDocumento = document.getElementById("numero_documento").value;
  const usuario = document.getElementById("usuario").value;
  const contrasena = document.getElementById("contrasena").value;
  const confirmarContrasena = document.getElementById(
    "confirmar_contrasena",
  ).value;
  const terminos = document.getElementById("terminos").checked;

  if (!validarContrasenaSegura(contrasena)) {
    alert(MENSAJE_CONTRASENA_SEGURA);
    return;
  }

  if (contrasena !== confirmarContrasena) {
    alert("Las contrasenas no coinciden");
    return;
  }

  if (!terminos) {
    alert("Debes aceptar los terminos y condiciones");
    return;
  }

  const datosBase = {
    nombres: nombres,
    apellidos: apellidos,
    correo: correo,
    usuario: usuario,
    contrasena: contrasena,
    numero_documento: numeroDocumento,
    celular: celular,
    foto_perfil: "",
    id_tipo_documento: Number(idTipoDocumento),
  };

  let ruta = "";
  let datosEnviar = {};

  if (tipoRegistro === "ciudadano") {
    ruta = "/api/usuarios/registro";
    datosEnviar = datosBase;
  }

  if (tipoRegistro === "recicladora") {
    ruta = "/api/recicladoras/registro";

    const archivoCamara = document.getElementById("camara_comercio").files[0];

    let camaraComercio = "";

    if (archivoCamara) {
      camaraComercio = archivoCamara.name;
    }

    datosEnviar = {
      ...datosBase,
      nit_empresa: document.getElementById("nit_empresa").value,
      nombre_empresa: document.getElementById("nombre_empresa").value,
      direccion_empresa: document.getElementById("direccion_empresa").value,
      telefono_empresa: document.getElementById("telefono_empresa").value,
      camara_comercio: camaraComercio,
    };
  }

  const respuesta = await fetch(API_URL + ruta, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datosEnviar),
  });

  const datos = await respuesta.json();

  if (respuesta.ok) {
    alert(datos.mensaje);
    window.location.href = "public_login.html";
  } else {
    alert(datos.mensaje);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const campoContrasena = document.getElementById("contrasena");
  const tipoRegistro = document.getElementById("tipo_registro");
  const parametros = new URLSearchParams(window.location.search);

  if (campoContrasena) {
    campoContrasena.addEventListener("input", actualizarAyudaContrasena);
  }

  if (tipoRegistro && parametros.get("tipo") === "recicladora") {
    tipoRegistro.value = "recicladora";
    mostrarCamposEmpresa();
  }
});
