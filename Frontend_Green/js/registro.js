/**
 * Archivo: registro.js
 * Maneja el formulario de registro por pasos de GreenUp.
 * * Este archivo registra dos tipos de usuarios:
 * 1. Ciudadano (POST /api/usuarios/registro)
 * 2. Dueño de punto ecológico (POST /api/recicladoras/registro)
 * * Nota: La cámara de comercio por ahora guarda el nombre del archivo, 
 * no el archivo real en el servidor.
 */

let pasoActual = 1;
const totalPasos = 3;
const MENSAJE_CONTRASENA_SEGURA =
  "La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.";

/**
 * Valida que una contraseña cumpla con los criterios de seguridad establecidos.
 * @function validarContrasenaSegura
 * @param {string} contrasena - La contraseña ingresada por el usuario.
 * @returns {boolean} Retorna true si cumple todos los requisitos, false en caso contrario.
 */
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

/**
 * Actualiza los mensajes de ayuda visual en la interfaz en tiempo real
 * mientras el usuario escribe su contraseña.
 * @function actualizarAyudaContrasena
 */
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
    ayudaContrasena.textContent = "La contraseña cumple los requisitos.";
    return;
  }

  ayudaContrasena.classList.remove("text-muted", "text-success");
  ayudaContrasena.classList.add("text-danger");
  ayudaContrasena.textContent = MENSAJE_CONTRASENA_SEGURA;
}

/**
 * Alterna el tipo de input entre 'password' y 'text' para ocultar/mostrar la contraseña.
 * @function alternarVisibilidadContrasena
 * @param {string} idCampo - El ID del input de contraseña.
 * @param {HTMLElement} boton - El botón que disparó el evento para cambiar su ícono.
 */
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
      mostrar ? "Ocultar contraseña" : "Mostrar contraseña",
    );

    if (icono) {
      icono.textContent = mostrar ? "visibility_off" : "visibility";
    }
  }
}

/**
 * Muestra u oculta los campos exclusivos para empresas cuando la persona 
 * escoge "Dueño de punto ecológico".
 * @function mostrarCamposEmpresa
 */
function mostrarCamposEmpresa() {
  const tipoRegistro = document.getElementById("tipo_registro").value;
  const camposEmpresa = document.getElementById("campos-empresa");

  if (tipoRegistro === "recicladora") {
    camposEmpresa.classList.remove("d-none");
  } else {
    camposEmpresa.classList.add("d-none");
  }
}

/**
 * Avanza al siguiente paso en el formulario multistep.
 * Si se encuentra en el último paso, inicia el proceso de registro.
 * @function siguientePaso
 */
function siguientePaso() {
  if (pasoActual < totalPasos) {
    document.getElementById("seccion-" + pasoActual).classList.add("d-none");
    pasoActual = pasoActual + 1;
    document.getElementById("seccion-" + pasoActual).classList.remove("d-none");

    actualizarVistaPasos();
    return;
  }

  registrarCuenta();
}

/**
 * Retrocede al paso anterior en el formulario multistep.
 * @function pasoAnterior
 */
function pasoAnterior() {
  if (pasoActual > 1) {
    document.getElementById("seccion-" + pasoActual).classList.add("d-none");
    pasoActual = pasoActual - 1;
    document.getElementById("seccion-" + pasoActual).classList.remove("d-none");

    actualizarVistaPasos();
  }
}

/**
 * Actualiza el estado visual del progreso del formulario (barras superiores,
 * visibilidad del botón de retroceso y texto del botón de continuación).
 * @function actualizarVistaPasos
 */
function actualizarVistaPasos() {
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

/**
 * Recopila todos los datos del formulario, realiza validaciones finales y 
 * utiliza peticionSegura para enviar los datos al backend según el tipo de usuario.
 * @async
 * @function registrarCuenta
 */
async function registrarCuenta() {
  const tipoRegistro = document.getElementById("tipo_registro").value;

  const nombres = document.getElementById("nombres").value;
  const apellidos = document.getElementById("apellidos").value;
  const correo = document.getElementById("correo").value;
  const celular = document.getElementById("celular").value;
  const idTipoDocumento = document.getElementById("id_tipo_documento").value;
  const numeroDocumento = document.getElementById("numero_documento").value;
  const usuario = document.getElementById("usuario").value;
  const contrasena = document.getElementById("contrasena").value;
  const confirmarContrasena = document.getElementById("confirmar_contrasena").value;
  const terminos = document.getElementById("terminos").checked;

  // Validaciones
  if (!validarContrasenaSegura(contrasena)) {
    alert(MENSAJE_CONTRASENA_SEGURA);
    return;
  }

  if (contrasena !== confirmarContrasena) {
    alert("Las contraseñas no coinciden");
    return;
  }

  if (!terminos) {
    alert("Debes aceptar los términos y condiciones");
    return;
  }

  // Base de datos compartida entre roles
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

  // AQUÍ ES DONDE SE CONECTA NUESTRA NUEVA LÓGICA DE API.JS
  try {
    const respuesta = await peticionSegura(ruta, "POST", datosEnviar);

    if (respuesta.ok) {
      // Si todo sale bien, muestra el mensaje de Flask y redirige al login
      alert(respuesta.datos.mensaje || "Registro exitoso");
      window.location.href = "public_login.html";
    } else {
      // Si el servidor envía un error (Ej. el correo ya existe)
      alert(respuesta.datos.mensaje || "Ocurrió un error en el registro");
    }
  } catch (error) {
    console.error("Fallo la conexión al registrar:", error);
    alert("Ocurrió un error al intentar comunicarse con el servidor. Verifica tu conexión.");
  }
}

/**
 * Inicializa los eventos del DOM al cargar la página.
 */
document.addEventListener("DOMContentLoaded", function () {
  const campoContrasena = document.getElementById("contrasena");
  const tipoRegistro = document.getElementById("tipo_registro");
  const parametros = new URLSearchParams(window.location.search);

  if (campoContrasena) {
    campoContrasena.addEventListener("input", actualizarAyudaContrasena);
  }

  // Pre-selecciona recicladora si viene desde un enlace específico
  if (tipoRegistro && parametros.get("tipo") === "recicladora") {
    tipoRegistro.value = "recicladora";
    mostrarCamposEmpresa();
  }
});