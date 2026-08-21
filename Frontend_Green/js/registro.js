/**
 * Archivo: registro.js
 * Maneja el formulario de registro por pasos de GreenUp.
 * * Este archivo registra dos tipos de usuarios:
 * 1. Ciudadano (POST /api/usuarios/registro)
 * 2. Dueño de punto ecológico (POST /api/recicladoras/registro)
 * * Nota: La cámara de comercio queda registrada como referencia
 * y su validación queda pendiente para revisión administrativa.
 */

let pasoActual = 1;
const totalPasos = 3;
const MENSAJE_CONTRASENA_SEGURA =
  "La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.";
const MENSAJE_USUARIO_CORTO = "El usuario debe tener mínimo 5 caracteres.";
const MENSAJE_DOCUMENTO_INVALIDO = "La cédula o documento debe tener mínimo 5 números.";
const registroEstado = {
  materiales: [],
};

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
    cargarMaterialesRegistroRecicladora();
  } else {
    camposEmpresa.classList.add("d-none");
  }
}

/**
 * Limpia el documento para validar siempre el mismo formato.
 * Si el usuario escribe puntos, guiones o espacios, solo quedan los numeros.
 * @param {string} documento - Cedula o documento escrito en el formulario.
 * @returns {string} Documento listo para enviar al backend.
 */
function limpiarDocumentoRegistro(documento) {
  return String(documento || "").replace(/\D/g, "");
}

/**
 * Revisa que el usuario tenga el largo minimo pedido por GreenUp.
 * @param {string} usuario - Nombre de usuario escrito en el formulario.
 * @returns {boolean} true cuando el usuario tiene 5 o mas caracteres.
 */
function validarUsuarioRegistro(usuario) {
  return String(usuario || "").trim().length >= 5;
}

/**
 * Limpia los mensajes rojos del paso de documento y usuario.
 * Se ejecuta antes de volver a validar para no dejar mensajes antiguos.
 */
function limpiarMensajesRegistro() {
  const campos = ["numero_documento", "usuario"];
  const mensajes = ["mensaje-documento", "mensaje-usuario"];

  campos.forEach((idCampo) => {
    document.getElementById(idCampo)?.classList.remove("is-invalid");
  });

  mensajes.forEach((idMensaje) => {
    const mensaje = document.getElementById(idMensaje);
    if (mensaje) mensaje.textContent = "";
  });
}

/**
 * Muestra un error debajo de un input del formulario.
 * @param {string} idCampo - ID del input que debe marcarse en rojo.
 * @param {string} idMensaje - ID del texto que aparece debajo del input.
 * @param {string} texto - Mensaje que vera el usuario.
 */
function mostrarErrorRegistro(idCampo, idMensaje, texto) {
  const campo = document.getElementById(idCampo);
  const mensaje = document.getElementById(idMensaje);

  if (campo) campo.classList.add("is-invalid");
  if (mensaje) mensaje.textContent = texto;
}

/**
 * Valida el paso donde se escribe documento y usuario.
 * Primero revisa longitud en el navegador y despues pregunta al backend si ya
 * existe una cuenta con ese documento o usuario.
 * @async
 * @returns {Promise<boolean>} true si puede pasar al siguiente paso.
 */
async function validarPasoDocumentoUsuario() {
  limpiarMensajesRegistro();

  const numeroDocumento = limpiarDocumentoRegistro(document.getElementById("numero_documento")?.value);
  const usuario = document.getElementById("usuario")?.value.trim() || "";
  let puedeContinuar = true;

  if (numeroDocumento.length < 5) {
    mostrarErrorRegistro("numero_documento", "mensaje-documento", MENSAJE_DOCUMENTO_INVALIDO);
    puedeContinuar = false;
  }

  if (!validarUsuarioRegistro(usuario)) {
    mostrarErrorRegistro("usuario", "mensaje-usuario", MENSAJE_USUARIO_CORTO);
    puedeContinuar = false;
  }

  if (!puedeContinuar) {
    return false;
  }

  try {
    const respuesta = await peticionSegura("/api/usuarios/validar-registro", "POST", {
      numero_documento: numeroDocumento,
      usuario,
    });

    const datos = respuesta.datos || {};

    if (datos.documento_registrado) {
      mostrarErrorRegistro("numero_documento", "mensaje-documento", "Cédula ya registrada.");
      puedeContinuar = false;
    }

    if (datos.usuario_registrado) {
      mostrarErrorRegistro("usuario", "mensaje-usuario", "El usuario ya se encuentra registrado.");
      puedeContinuar = false;
    }

    if (!datos.usuario_valido) {
      mostrarErrorRegistro("usuario", "mensaje-usuario", MENSAJE_USUARIO_CORTO);
      puedeContinuar = false;
    }

    return puedeContinuar && datos.puede_continuar;
  } catch (error) {
    mostrarErrorRegistro(
      "numero_documento",
      "mensaje-documento",
      "No se pudo validar el documento. Verifica que el backend esté activo.",
    );
    return false;
  }
}

function escaparRegistro(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Consulta los materiales activos que el sistema tiene guardados.
 * Estos materiales se muestran como casillas para que la recicladora
 * marque solo los materiales que realmente recibe.
 * @async
 * @function cargarMaterialesRegistroRecicladora
 */
async function cargarMaterialesRegistroRecicladora() {
  const contenedor = document.getElementById("materiales-recicladora");
  if (!contenedor || registroEstado.materiales.length) return;

  try {
    const respuesta = await peticionSegura("/materiales", "GET");
    if (!respuesta.ok) throw new Error(respuesta.datos?.mensaje || "No se pudieron cargar materiales");
    registroEstado.materiales = (respuesta.datos || []).filter((material) => Number(material.id_estado) === 1);

    if (!registroEstado.materiales.length) {
      contenedor.innerHTML = '<div class="col-12"><div class="alert alert-warning mb-0">No hay materiales activos.</div></div>';
      return;
    }

    contenedor.innerHTML = registroEstado.materiales.map((material) => `
      <div class="col-md-6">
        <label class="border rounded-3 p-3 d-flex gap-2 h-100">
          <input class="form-check-input mt-1" type="checkbox" name="ids_materiales" value="${material.id_tipo_material}">
          <span>
            <strong class="d-block">${escaparRegistro(material.nombre)}</strong>
            <small class="text-muted">${escaparRegistro(material.descripcion || "Material del catálogo GreenUp")}</small>
          </span>
        </label>
      </div>
    `).join("");
  } catch (error) {
    contenedor.innerHTML = `<div class="col-12"><div class="alert alert-danger mb-0">${escaparRegistro(error.message)}</div></div>`;
  }
}

/**
 * Lee los materiales marcados por la recicladora en el formulario.
 * @function leerMaterialesSeleccionados
 * @returns {number[]} Lista de IDs de materiales seleccionados.
 */
function leerMaterialesSeleccionados() {
  return [...document.querySelectorAll('input[name="ids_materiales"]:checked')]
    .map((input) => Number(input.value))
    .filter((id) => id > 0);
}

/**
 * Avanza al siguiente paso en el formulario multistep.
 * Si se encuentra en el último paso, inicia el proceso de registro.
 * @function siguientePaso
 */
async function siguientePaso() {
  if (pasoActual === 2) {
    const pasoValido = await validarPasoDocumentoUsuario();
    if (!pasoValido) return;
  }

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
  const genero = document.getElementById("genero").value;
  const idTipoDocumento = document.getElementById("id_tipo_documento").value;
  const numeroDocumento = limpiarDocumentoRegistro(document.getElementById("numero_documento").value);
  const usuario = document.getElementById("usuario").value.trim();
  const contrasena = document.getElementById("contrasena").value;
  const confirmarContrasena = document.getElementById("confirmar_contrasena").value;
  const terminos = document.getElementById("terminos").checked;

  // Validaciones
  if (!validarContrasenaSegura(contrasena)) {
    alert(MENSAJE_CONTRASENA_SEGURA);
    return;
  }

  if (!validarUsuarioRegistro(usuario)) {
    alert(MENSAJE_USUARIO_CORTO);
    return;
  }

  if (numeroDocumento.length < 5) {
    alert(MENSAJE_DOCUMENTO_INVALIDO);
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

  if (tipoRegistro === "ciudadano" && !genero) {
    alert("Debes seleccionar tu género.");
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
    genero: genero || "Otro",
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
    const idsMateriales = leerMaterialesSeleccionados();

    if (archivoCamara) {
      camaraComercio = archivoCamara.name;
    }

    if (!idsMateriales.length) {
      alert("Debes seleccionar al menos un material que recibe la recicladora.");
      return;
    }

    datosEnviar = {
      ...datosBase,
      nit_empresa: document.getElementById("nit_empresa").value,
      nombre_empresa: document.getElementById("nombre_empresa").value,
      direccion_empresa: document.getElementById("direccion_empresa").value,
      telefono_empresa: document.getElementById("telefono_empresa").value,
      camara_comercio: camaraComercio,
      dias_trabajo: document.getElementById("dias_trabajo").value,
      hora_inicio: document.getElementById("hora_inicio").value,
      hora_fin: document.getElementById("hora_fin").value,
      dias_no_trabaja: document.getElementById("dias_no_trabaja").value,
      horario: `${document.getElementById("hora_inicio").value || ""} - ${document.getElementById("hora_fin").value || ""}`.trim(),
      ids_materiales: idsMateriales,
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
