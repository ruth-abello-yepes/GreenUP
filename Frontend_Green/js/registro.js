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
const MENSAJE_USUARIO_CORTO = "El usuario debe tener mínimo 5 caracteres y usar letras, números, espacios, punto, guion o guion bajo.";
const MENSAJE_DOCUMENTO_INVALIDO = "La cédula o documento debe tener mínimo 5 números.";
const registroEstado = {
  materiales: [],
};

function leerArchivoComoDataUrl(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = () => reject(new Error("No se pudo leer el archivo"));
    lector.readAsDataURL(archivo);
  });
}

async function prepararDocumentoCamaraComercio(archivo) {
  if (!archivo) return "";

  const tiposPermitidos = ["application/pdf", "image/jpeg", "image/png"];
  if (!tiposPermitidos.includes(archivo.type)) {
    throw new Error("La Cámara de Comercio debe ser PDF, JPG o PNG.");
  }

  const limiteMb = 5;
  if (archivo.size > limiteMb * 1024 * 1024) {
    throw new Error(`La Cámara de Comercio no debe superar ${limiteMb} MB.`);
  }

  const contenido = await leerArchivoComoDataUrl(archivo);
  return JSON.stringify({
    nombre: archivo.name,
    tipo: archivo.type,
    tamano: archivo.size,
    contenido,
  });
}

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
  const destinoEmpresa = tipoRegistro === "recicladora"
    ? document.querySelector("#seccion-1 .row")
    : document.querySelector("#seccion-2 .row");
  const esRecicladora = tipoRegistro === "recicladora";
  const campoNombres = document.getElementById("nombres");
  const campoApellidos = document.getElementById("apellidos");
  const campoCorreo = document.getElementById("correo");
  const campoCelular = document.getElementById("celular");
  const campoGenero = document.getElementById("genero");
  const campoDocumento = document.getElementById("numero_documento");
  const campoTipoDocumento = document.getElementById("id_tipo_documento");
  const campoUsuario = document.getElementById("usuario");
  const camposEmpresaObligatorios = [
    "nit_empresa",
    "nombre_empresa",
    "telefono_empresa",
    "direccion_empresa",
    "dias_trabajo",
    "hora_inicio",
    "hora_fin",
    "camara_comercio",
  ];

  if (camposEmpresa && destinoEmpresa && camposEmpresa.parentElement !== destinoEmpresa) {
    destinoEmpresa.appendChild(camposEmpresa);
  }

  [
    campoNombres?.closest(".col-md-6"),
    campoApellidos?.closest(".col-md-6"),
    campoCelular?.closest(".col-md-6"),
    campoGenero?.closest(".col-md-6"),
    campoDocumento?.closest(".col-md-6"),
    campoTipoDocumento?.closest(".col-md-6"),
    campoUsuario?.closest(".col-12"),
  ].forEach((elemento) => elemento?.classList.toggle("d-none", esRecicladora));

  [campoNombres, campoApellidos, campoCelular, campoGenero, campoDocumento, campoTipoDocumento, campoUsuario]
    .forEach((campo) => {
      if (!campo) return;
      if (esRecicladora) {
        campo.removeAttribute("required");
      } else {
        campo.setAttribute("required", "required");
      }
    });

  camposEmpresaObligatorios.forEach((idCampo) => {
    const campo = document.getElementById(idCampo);
    if (!campo) return;
    if (esRecicladora) {
      campo.setAttribute("required", "required");
    } else {
      campo.removeAttribute("required");
    }
  });

  if (campoCorreo) {
    campoCorreo.placeholder = esRecicladora ? "empresa@ejemplo.com" : "contacto@ejemplo.com";
  }

  if (esRecicladora && camposEmpresa) {
    camposEmpresa.classList.remove("d-none");
    cargarMaterialesRegistroRecicladora();
  } else if (camposEmpresa) {
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
  return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9._ -]{5,}$/.test(String(usuario || "").trim());
}

/**
 * Limpia los mensajes rojos del paso de documento y usuario.
 * Se ejecuta antes de volver a validar para no dejar mensajes antiguos.
 */
function limpiarMensajesRegistro() {
  const campos = ["correo", "numero_documento", "usuario", "nit_empresa", "nombre_empresa"];
  const mensajes = ["mensaje-correo", "mensaje-documento", "mensaje-usuario", "mensaje-nit", "mensaje-nombre-empresa"];

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

  const tipoRegistro = document.getElementById("tipo_registro")?.value || "ciudadano";
  const correo = document.getElementById("correo")?.value.trim() || "";
  const nombreEmpresa = document.getElementById("nombre_empresa")?.value.trim() || "";
  const nitEmpresa = document.getElementById("nit_empresa")?.value.trim() || "";
  const numeroDocumento = tipoRegistro === "recicladora"
    ? limpiarDocumentoRegistro(nitEmpresa)
    : limpiarDocumentoRegistro(document.getElementById("numero_documento")?.value);
  const usuario = tipoRegistro === "recicladora"
    ? nombreEmpresa
    : (document.getElementById("usuario")?.value.trim() || "");
  let puedeContinuar = true;

  if (tipoRegistro === "recicladora" && !nombreEmpresa) {
    mostrarErrorRegistro("nombre_empresa", "mensaje-nombre-empresa", "El nombre de la empresa es obligatorio.");
    puedeContinuar = false;
  }

  if (numeroDocumento.length < 5) {
    mostrarErrorRegistro(
      tipoRegistro === "recicladora" ? "nit_empresa" : "numero_documento",
      tipoRegistro === "recicladora" ? "mensaje-nit" : "mensaje-documento",
      tipoRegistro === "recicladora" ? "El NIT debe tener mínimo 5 números." : MENSAJE_DOCUMENTO_INVALIDO,
    );
    puedeContinuar = false;
  }

  if (!validarUsuarioRegistro(usuario)) {
    mostrarErrorRegistro(
      tipoRegistro === "recicladora" ? "nombre_empresa" : "usuario",
      tipoRegistro === "recicladora" ? "mensaje-nombre-empresa" : "mensaje-usuario",
      MENSAJE_USUARIO_CORTO,
    );
    puedeContinuar = false;
  }

  if (!puedeContinuar) {
    return false;
  }

  try {
    const respuesta = await peticionSegura("/api/usuarios/validar-registro", "POST", {
      correo,
      numero_documento: numeroDocumento,
      usuario,
    });

    const datos = respuesta.datos || {};

    if (!datos.correo_valido) {
      mostrarErrorRegistro("correo", "mensaje-correo", "Ingresa un correo válido.");
      alert("Revisa el correo electrónico antes de continuar.");
      document.getElementById("seccion-" + pasoActual)?.classList.add("d-none");
      pasoActual = 1;
      document.getElementById("seccion-" + pasoActual)?.classList.remove("d-none");
      actualizarVistaPasos();
      puedeContinuar = false;
    }

    if (datos.correo_registrado) {
      mostrarErrorRegistro("correo", "mensaje-correo", "El correo ya se encuentra registrado.");
      alert("Ese correo ya tiene una cuenta registrada. Puedes iniciar sesión o usar otro correo.");
      document.getElementById("seccion-" + pasoActual)?.classList.add("d-none");
      pasoActual = 1;
      document.getElementById("seccion-" + pasoActual)?.classList.remove("d-none");
      actualizarVistaPasos();
      puedeContinuar = false;
    }

    if (datos.documento_registrado) {
      mostrarErrorRegistro(
        tipoRegistro === "recicladora" ? "nit_empresa" : "numero_documento",
        tipoRegistro === "recicladora" ? "mensaje-nit" : "mensaje-documento",
        tipoRegistro === "recicladora" ? "NIT ya registrado." : "Cédula ya registrada.",
      );
      puedeContinuar = false;
    }

    if (datos.usuario_registrado) {
      mostrarErrorRegistro(
        tipoRegistro === "recicladora" ? "nombre_empresa" : "usuario",
        tipoRegistro === "recicladora" ? "mensaje-nombre-empresa" : "mensaje-usuario",
        "El usuario ya se encuentra registrado.",
      );
      puedeContinuar = false;
    }

    if (!datos.usuario_valido) {
      mostrarErrorRegistro(
        tipoRegistro === "recicladora" ? "nombre_empresa" : "usuario",
        tipoRegistro === "recicladora" ? "mensaje-nombre-empresa" : "mensaje-usuario",
        MENSAJE_USUARIO_CORTO,
      );
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
 * Valida solo los campos visibles del paso actual antes de avanzar.
 * Evita que el usuario pase a otra pantalla con datos obligatorios vacíos.
 * @returns {boolean} true si el paso actual está completo.
 */
function validarCamposVisiblesDelPaso() {
  const seccion = document.getElementById("seccion-" + pasoActual);
  if (!seccion) return true;

  const campos = [...seccion.querySelectorAll("input, select, textarea")]
    .filter((campo) => {
      const estaOculto = campo.closest(".d-none") || campo.type === "hidden";
      return !estaOculto && !campo.disabled;
    });

  for (const campo of campos) {
    if (!campo.checkValidity()) {
      campo.reportValidity();
      campo.focus();
      return false;
    }
  }

  return true;
}

/**
 * Avanza al siguiente paso en el formulario multistep.
 * Si se encuentra en el último paso, inicia el proceso de registro.
 * @function siguientePaso
 */
async function siguientePaso() {
  if (!validarCamposVisiblesDelPaso()) {
    return;
  }

  if (document.getElementById("tipo_registro")?.value === "recicladora" && pasoActual === 1) {
    const pasoValido = await validarPasoDocumentoUsuario();
    if (!pasoValido) return;

    document.getElementById("seccion-1").classList.add("d-none");
    pasoActual = 3;
    document.getElementById("seccion-3").classList.remove("d-none");
    actualizarVistaPasos();
    return;
  }

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
  if (document.getElementById("tipo_registro")?.value === "recicladora" && pasoActual === 3) {
    document.getElementById("seccion-3").classList.add("d-none");
    pasoActual = 1;
    document.getElementById("seccion-1").classList.remove("d-none");
    actualizarVistaPasos();
    return;
  }

  if (pasoActual > 1) {
    document.getElementById("seccion-" + pasoActual).classList.add("d-none");
    pasoActual = pasoActual - 1;
    document.getElementById("seccion-" + pasoActual).classList.remove("d-none");

    actualizarVistaPasos();
  }
}

/**
 * Intercepta el clic en el enlace superior de "Volver".
 * Si estamos en un paso avanzado (>1), retrocede un paso y cancela la navegación.
 * Si estamos en el paso 1, permite que el enlace actúe normalmente (ir a inicio).
 * @function manejarVolver
 * @param {Event} event - El evento click del enlace
 */
window.manejarVolver = function(event) {
  if (pasoActual > 1) {
    event.preventDefault();
    pasoAnterior();
  }
};

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

  const nombreEmpresa = document.getElementById("nombre_empresa")?.value.trim() || "";
  const nombres = tipoRegistro === "recicladora" ? nombreEmpresa : document.getElementById("nombres").value;
  const apellidos = tipoRegistro === "recicladora" ? "Empresa" : document.getElementById("apellidos").value;
  const correo = document.getElementById("correo").value;
  const celular = document.getElementById("celular").value;
  const genero = document.getElementById("genero").value;
  const idTipoDocumento = tipoRegistro === "recicladora" ? 1 : document.getElementById("id_tipo_documento").value;
  const numeroDocumento = tipoRegistro === "recicladora"
    ? limpiarDocumentoRegistro(document.getElementById("nit_empresa").value)
    : limpiarDocumentoRegistro(document.getElementById("numero_documento").value);
  const usuario = tipoRegistro === "recicladora" ? nombreEmpresa : document.getElementById("usuario").value.trim();
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
      try {
        camaraComercio = await prepararDocumentoCamaraComercio(archivoCamara);
      } catch (error) {
        alert(error.message || "No se pudo cargar la Cámara de Comercio.");
        return;
      }
    }

    if (!idsMateriales.length) {
      alert("Debes seleccionar al menos un material que recibe la recicladora.");
      return;
    }

    datosEnviar = {
      ...datosBase,
      nit_empresa: document.getElementById("nit_empresa").value,
      nombre_empresa: nombreEmpresa,
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
      // Las cuentas nuevas deben demostrar que pueden recibir correo.
      alert(respuesta.datos.mensaje || "Registro exitoso");
      if (respuesta.datos.verificacion_requerida) {
        localStorage.setItem("correo_verificacion", respuesta.datos.correo || correo.trim().toLowerCase());
        if (respuesta.datos.codigo_enviado) {
          localStorage.setItem("codigo_recuperacion_expira", String(Date.now() + 5 * 60 * 1000));
        } else {
          localStorage.removeItem("codigo_recuperacion_expira");
        }
        window.location.href = "public_verificar_codigo.html?modo=registro";
      } else {
        window.location.href = "public_login.html";
      }
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

  if (tipoRegistro && parametros.get("tipo") === "recicladora") {
    tipoRegistro.value = "recicladora";
  }

  if (tipoRegistro) {
    mostrarCamposEmpresa();
  }
});
