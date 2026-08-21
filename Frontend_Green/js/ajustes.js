/**
 * Archivo: ajustes.js
 * Pantallas:
 * - Frontend_Green/pages/ciudadano/ciudadano_ajustes.html
 * - Frontend_Green/pages/ciudadano/ciudadano_config_seguridad.html
 *
 * Este archivo maneja los ajustes reales de cuenta del ciudadano.
 * Carga el perfil desde el backend, permite actualizar datos personales
 * y permite cambiar la contrasena cumpliendo el requisito RF003.
 */

// Guardamos las rutas de la API en constantes para no repetir texto.
const ENDPOINT_PERFIL = "/api/usuarios/perfil";
const ENDPOINT_CAMBIAR_PASSWORD = "/api/usuarios/cambiar-password";
const ENDPOINT_ELIMINAR_CUENTA = "/api/usuarios/perfil";

/**
 * Obtiene el token JWT guardado despues del inicio de sesion.
 *
 * @returns {string|null} Token guardado o null si no existe.
 */
function obtenerTokenAjustes() {
  return localStorage.getItem("token");
}

/**
 * Redirige al login cuando el ciudadano no tiene sesion activa.
 *
 * @returns {void}
 */
function redirigirALogin() {
  window.location.href = "../public/public_login.html";
}

/**
 * Muestra una alerta Bootstrap dentro de la pantalla de ajustes.
 *
 * @param {string} tipo - Tipo de alerta Bootstrap: success, danger, warning o info.
 * @param {string} mensaje - Texto que vera el usuario.
 * @returns {void}
 */
function mostrarAlertaAjustes(tipo, mensaje) {
  let contenedor = document.getElementById("alertas-ajustes");

  if (!contenedor) {
    contenedor = document.createElement("div");
    contenedor.id = "alertas-ajustes";

    const tarjetaPrincipal = document.querySelector("main .gu-card") || document.querySelector("main") || document.body;
    tarjetaPrincipal.prepend(contenedor);
  }

  contenedor.innerHTML = `
    <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
      ${mensaje}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
    </div>
  `;
}

/**
 * Cambia temporalmente el texto de un boton mientras se guarda informacion.
 *
 * @param {HTMLButtonElement} boton - Boton que se esta usando.
 * @param {string} texto - Texto que se mostrara mientras carga.
 * @returns {string} HTML original del boton para restaurarlo luego.
 */
function activarEstadoGuardando(boton, texto = "Guardando...") {
  const htmlOriginal = boton.innerHTML;

  boton.innerHTML = `<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> ${texto}`;
  boton.classList.add("opacity-75");
  boton.disabled = true;

  return htmlOriginal;
}

/**
 * Restaura el texto y estado normal de un boton.
 *
 * @param {HTMLButtonElement} boton - Boton que se va a restaurar.
 * @param {string} htmlOriginal - HTML que tenia antes de guardar.
 * @returns {void}
 */
function restaurarBoton(boton, htmlOriginal) {
  boton.innerHTML = htmlOriginal;
  boton.classList.remove("opacity-75");
  boton.disabled = false;
}

/**
 * Devuelve los encabezados necesarios para enviar JSON y token JWT.
 *
 * @returns {Object} Encabezados HTTP para fetch.
 */
function crearHeadersAjustes() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${obtenerTokenAjustes()}`
  };
}

/**
 * Lee una respuesta JSON de forma segura.
 *
 * @param {Response} respuesta - Respuesta original de fetch.
 * @returns {Promise<Object>} JSON del backend o un objeto vacio.
 */
async function leerJsonSeguro(respuesta) {
  try {
    return await respuesta.json();
  } catch (error) {
    return {};
  }
}

/**
 * Copia el nombre del usuario actualizado en todos los textos del navbar.
 *
 * @param {Object} usuario - Datos actualizados del usuario.
 * @returns {void}
 */
function actualizarNombreNavbar(usuario) {
  const nombreVisible = usuario.usuario || usuario.nombres || "Ciudadano";
  const elementos = document.querySelectorAll(".nombre-usuario-display");

  elementos.forEach((elemento) => {
    elemento.textContent = nombreVisible;
  });
}

/**
 * Guarda el usuario actualizado en localStorage sin perder datos previos.
 *
 * @param {Object} usuarioActualizado - Usuario devuelto por el backend.
 * @returns {void}
 */
function actualizarUsuarioLocal(usuarioActualizado) {
  const usuarioAnterior = JSON.parse(localStorage.getItem("usuario") || "{}");
  const usuarioFinal = {
    ...usuarioAnterior,
    ...usuarioActualizado
  };

  localStorage.setItem("usuario", JSON.stringify(usuarioFinal));
  actualizarNombreNavbar(usuarioFinal);
}

/**
 * Coloca los datos del usuario dentro del formulario de perfil.
 *
 * @param {Object} usuario - Datos reales del usuario autenticado.
 * @returns {void}
 */
function llenarFormularioPerfil(usuario) {
  document.getElementById("nombres").value = usuario.nombres || "";
  document.getElementById("apellidos").value = usuario.apellidos || "";
  document.getElementById("correo").value = usuario.correo || "";
  document.getElementById("celular").value = usuario.celular || "";
  document.getElementById("usuario").value = usuario.usuario || "";

  actualizarNombreNavbar(usuario);
}

/**
 * Consulta el perfil real del usuario autenticado en el backend.
 *
 * @returns {Promise<void>} No retorna datos porque actualiza el DOM.
 */
async function cargarPerfilUsuario() {
  try {
    const respuesta = await fetch(`${API_URL}${ENDPOINT_PERFIL}`, {
      method: "GET",
      headers: crearHeadersAjustes()
    });

    const datos = await leerJsonSeguro(respuesta);

    if (respuesta.status === 401) {
      redirigirALogin();
      return;
    }

    if (!respuesta.ok) {
      mostrarAlertaAjustes("danger", datos.mensaje || "No fue posible cargar el perfil.");
      return;
    }

    llenarFormularioPerfil(datos);
    actualizarUsuarioLocal(datos);

  } catch (error) {
    mostrarAlertaAjustes("danger", "No se pudo conectar con el backend para cargar tu perfil.");
  }
}

/**
 * Obtiene los datos escritos en el formulario de perfil.
 *
 * @returns {Object} Datos listos para enviar al backend.
 */
function obtenerDatosPerfil() {
  return {
    nombres: document.getElementById("nombres").value.trim(),
    apellidos: document.getElementById("apellidos").value.trim(),
    correo: document.getElementById("correo").value.trim(),
    celular: document.getElementById("celular").value.trim(),
    usuario: document.getElementById("usuario").value.trim()
  };
}

/**
 * Envia al backend los datos nuevos del perfil.
 *
 * @param {SubmitEvent} evento - Evento submit del formulario.
 * @returns {Promise<void>} No retorna datos porque muestra alertas.
 */
async function guardarDatosPerfil(evento) {
  evento.preventDefault();

  const datosPerfil = obtenerDatosPerfil();

  try {
    const respuesta = await fetch(`${API_URL}${ENDPOINT_PERFIL}`, {
      method: "PUT",
      headers: crearHeadersAjustes(),
      body: JSON.stringify(datosPerfil)
    });

    const datos = await leerJsonSeguro(respuesta);

    if (respuesta.status === 401) {
      redirigirALogin();
      return;
    }

    if (!respuesta.ok) {
      mostrarAlertaAjustes("danger", datos.mensaje || "No fue posible guardar el perfil.");
      return;
    }

    actualizarUsuarioLocal(datos.usuario || datosPerfil);
    mostrarAlertaAjustes("success", datos.mensaje || "Datos de perfil actualizados correctamente.");

  } catch (error) {
    mostrarAlertaAjustes("danger", "No se pudo conectar con el backend para guardar el perfil.");
  }
}

/**
 * Valida que una contrasena cumpla la seguridad pedida por RF003.
 *
 * @param {string} contrasena - Nueva contrasena escrita por el usuario.
 * @returns {boolean} true si cumple todas las reglas.
 */
function validarPasswordSegura(contrasena) {
  const tieneMinimo = contrasena.length >= 8;
  const tieneMayuscula = /[A-Z]/.test(contrasena);
  const tieneMinuscula = /[a-z]/.test(contrasena);
  const tieneNumero = /\d/.test(contrasena);
  const tieneSimbolo = /[^A-Za-z0-9\s]/.test(contrasena);

  return tieneMinimo && tieneMayuscula && tieneMinuscula && tieneNumero && tieneSimbolo;
}

/**
 * Limpia los campos del formulario de contrasena.
 *
 * @returns {void}
 */
function limpiarFormularioPassword() {
  document.getElementById("password_actual").value = "";
  document.getElementById("nueva_password").value = "";
  document.getElementById("confirmar_password").value = "";
}

/**
 * Valida y envia el cambio de contrasena al backend.
 *
 * @param {SubmitEvent} evento - Evento submit del formulario.
 * @returns {Promise<void>} No retorna datos porque muestra alertas.
 */
async function actualizarPassword(evento) {
  evento.preventDefault();

  const passwordActual = document.getElementById("password_actual").value;
  const nuevaPassword = document.getElementById("nueva_password").value;
  const confirmarPassword = document.getElementById("confirmar_password").value;

  if (nuevaPassword !== confirmarPassword) {
    mostrarAlertaAjustes("warning", "La nueva contrasena y la confirmacion no coinciden.");
    return;
  }

  if (!validarPasswordSegura(nuevaPassword)) {
    mostrarAlertaAjustes(
      "warning",
      "La nueva contrasena debe tener minimo 8 caracteres, mayuscula, minuscula, numero y simbolo."
    );
    return;
  }

  try {
    const respuesta = await fetch(`${API_URL}${ENDPOINT_CAMBIAR_PASSWORD}`, {
      method: "PUT",
      headers: crearHeadersAjustes(),
      body: JSON.stringify({
        password_actual: passwordActual,
        nueva_password: nuevaPassword
      })
    });

    const datos = await leerJsonSeguro(respuesta);

    if (respuesta.status === 401) {
      redirigirALogin();
      return;
    }

    if (!respuesta.ok) {
      mostrarAlertaAjustes("danger", datos.mensaje || "No fue posible actualizar la contrasena.");
      return;
    }

    limpiarFormularioPassword();
    mostrarAlertaAjustes("success", datos.mensaje || "Contrasena actualizada correctamente.");

  } catch (error) {
    mostrarAlertaAjustes("danger", "No se pudo conectar con el backend para cambiar la contrasena.");
  }
}

/**
 * Lee un checkbox de forma segura.
 *
 * @param {string} idElemento - Id del checkbox.
 * @returns {boolean} true si existe y esta marcado.
 */
function leerCheckbox(idElemento) {
  const elemento = document.getElementById(idElemento);
  return Boolean(elemento && elemento.checked);
}

/**
 * Marca o desmarca un checkbox si existe en la pagina.
 *
 * @param {string} idElemento - Id del checkbox.
 * @param {boolean} valor - Estado que se quiere aplicar.
 * @returns {void}
 */
function escribirCheckbox(idElemento, valor) {
  const elemento = document.getElementById(idElemento);

  if (elemento) {
    elemento.checked = Boolean(valor);
  }
}

/**
 * Carga las notificaciones guardadas en el navegador.
 *
 * @returns {void}
 */
function cargarNotificacionesGuardadas() {
  const datos = JSON.parse(localStorage.getItem("greenup_notificaciones") || "{}");

  escribirCheckbox("pushSwitch", datos.push ?? true);
  escribirCheckbox("emailSwitch", datos.email ?? true);
  escribirCheckbox("smsSwitch", datos.sms ?? false);
  escribirCheckbox("checkLogros", datos.logros ?? true);
  escribirCheckbox("checkPuntos", datos.puntos ?? true);
  escribirCheckbox("checkComunidad", datos.comunidad ?? false);
  escribirCheckbox("newsletterSwitch", datos.newsletter ?? true);
}

/**
 * Guarda las opciones elegidas en el formulario de notificaciones.
 *
 * @param {SubmitEvent} evento - Evento submit del formulario.
 * @returns {void}
 */
function guardarNotificaciones(evento) {
  evento.preventDefault();

  const boton = evento.submitter || document.querySelector("#notificationsForm button[type='submit']");
  const htmlOriginal = activarEstadoGuardando(boton);

  const datos = {
    push: leerCheckbox("pushSwitch"),
    email: leerCheckbox("emailSwitch"),
    sms: leerCheckbox("smsSwitch"),
    logros: leerCheckbox("checkLogros"),
    puntos: leerCheckbox("checkPuntos"),
    comunidad: leerCheckbox("checkComunidad"),
    newsletter: leerCheckbox("newsletterSwitch")
  };

  localStorage.setItem("greenup_notificaciones", JSON.stringify(datos));

  if (datos.push && "Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }

  setTimeout(() => {
    restaurarBoton(boton, htmlOriginal);
    mostrarAlertaAjustes("success", "Preferencias de notificaciones guardadas correctamente.");
  }, 500);
}

/**
 * Carga las preferencias ecologicas guardadas en el navegador.
 *
 * @returns {void}
 */
function cargarPreferenciasGuardadas() {
  const datos = JSON.parse(localStorage.getItem("greenup_preferencias") || "{}");

  escribirCheckbox("chkReciclaje", datos.intereses?.reciclaje ?? true);
  escribirCheckbox("chkSolar", datos.intereses?.solar ?? true);
  escribirCheckbox("chkHuertos", datos.intereses?.huertos ?? false);
  escribirCheckbox("chkModa", datos.intereses?.moda ?? false);
  escribirCheckbox("chkAgua", datos.intereses?.agua ?? false);
  escribirCheckbox("chkAuto", datos.intereses?.auto ?? false);
  escribirCheckbox("switchImpactoPublico", datos.impactoPublico ?? true);

  const meta = document.querySelector(`input[name="goalRadio"][value="${datos.meta}"]`);
  const frecuencia = document.getElementById("selectFrecuenciaReciclaje");

  if (meta) {
    meta.checked = true;
  }

  if (frecuencia && datos.frecuencia) {
    frecuencia.value = datos.frecuencia;
  }
}

/**
 * Guarda las preferencias ecologicas elegidas por el ciudadano.
 *
 * @param {SubmitEvent} evento - Evento submit del formulario.
 * @returns {void}
 */
function guardarPreferencias(evento) {
  evento.preventDefault();

  const boton = evento.submitter || document.querySelector("#preferencesForm button[type='submit']");
  const htmlOriginal = activarEstadoGuardando(boton);
  const metaSeleccionada = document.querySelector('input[name="goalRadio"]:checked');
  const frecuencia = document.getElementById("selectFrecuenciaReciclaje");

  const datos = {
    intereses: {
      reciclaje: leerCheckbox("chkReciclaje"),
      solar: leerCheckbox("chkSolar"),
      huertos: leerCheckbox("chkHuertos"),
      moda: leerCheckbox("chkModa"),
      agua: leerCheckbox("chkAgua"),
      auto: leerCheckbox("chkAuto")
    },
    meta: metaSeleccionada ? metaSeleccionada.value : "reducir-plastico",
    frecuencia: frecuencia ? frecuencia.value : "semanal",
    impactoPublico: leerCheckbox("switchImpactoPublico")
  };

  localStorage.setItem("greenup_preferencias", JSON.stringify(datos));

  setTimeout(() => {
    restaurarBoton(boton, htmlOriginal);
    mostrarAlertaAjustes("success", "Preferencias eco guardadas correctamente.");
  }, 500);
}

/**
 * Permite seleccionar una imagen local y guardarla como avatar temporal.
 *
 * @returns {void}
 */
function prepararBotonAvatar() {
  const botonAvatar = document.getElementById("btnCambiarAvatar");
  const inputAvatar = document.getElementById("inputAvatar");

  if (!botonAvatar || !inputAvatar) {
    return;
  }

  const bloqueAvatar = botonAvatar.closest(".d-flex") || document;
  const vistaAvatar = bloqueAvatar.querySelector(".rounded-circle");
  const avatarGuardado = localStorage.getItem("greenup_avatar_ciudadano");

  if (vistaAvatar && avatarGuardado) {
    vistaAvatar.style.backgroundImage = `url("${avatarGuardado}")`;
    vistaAvatar.style.backgroundSize = "cover";
    vistaAvatar.style.backgroundPosition = "center";
    vistaAvatar.innerHTML = "";
  }

  botonAvatar.addEventListener("click", () => inputAvatar.click());

  inputAvatar.addEventListener("change", () => {
    const archivo = inputAvatar.files[0];

    if (!archivo) {
      return;
    }

    if (!archivo.type.startsWith("image/")) {
      mostrarAlertaAjustes("warning", "Selecciona una imagen valida para el avatar.");
      return;
    }

    const lector = new FileReader();

    lector.addEventListener("load", () => {
      localStorage.setItem("greenup_avatar_ciudadano", lector.result);

      if (vistaAvatar) {
        vistaAvatar.style.backgroundImage = `url("${lector.result}")`;
        vistaAvatar.style.backgroundSize = "cover";
        vistaAvatar.style.backgroundPosition = "center";
        vistaAvatar.innerHTML = "";
      }

      mostrarAlertaAjustes("success", "Avatar actualizado en este navegador.");
    });

    lector.readAsDataURL(archivo);
  });
}

/**
 * Conecta los formularios de suscripcion del footer.
 *
 * @returns {void}
 */
function prepararSuscripcionFooter() {
  const botones = document.querySelectorAll("footer .input-group button");

  botones.forEach((boton) => {
    boton.addEventListener("click", () => {
      const input = boton.closest(".input-group")?.querySelector("input[type='email']");
      const correo = input ? input.value.trim() : "";

      if (!correo || !correo.includes("@") || !correo.includes(".")) {
        mostrarAlertaAjustes("warning", "Escribe un correo valido para suscribirte.");
        return;
      }

      localStorage.setItem("greenup_correo_suscripcion", correo);
      input.value = "";
      mostrarAlertaAjustes("success", "Suscripcion guardada correctamente.");
    });
  });
}

/**
 * Conecta botones pequenos que ya existen en navbar y footer.
 *
 * @returns {void}
 */
function prepararBotonesGeneralesConfiguracion() {
  const botones = document.querySelectorAll("button, a.btn");

  botones.forEach((boton) => {
    const icono = boton.querySelector(".material-symbols-outlined");
    const nombreIcono = icono ? icono.textContent.trim() : "";

    if (nombreIcono === "notifications") {
      boton.addEventListener("click", () => {
        window.location.href = "ciudadano_config_noti.html";
      });
    }

    if (nombreIcono === "language") {
      boton.addEventListener("click", (evento) => {
        evento.preventDefault();
        const idiomaActual = localStorage.getItem("greenup_idioma") || "ES";
        const nuevoIdioma = idiomaActual === "ES" ? "EN" : "ES";
        localStorage.setItem("greenup_idioma", nuevoIdioma);
        mostrarAlertaAjustes("info", `Idioma preferido guardado: ${nuevoIdioma}.`);
      });
    }

    if (nombreIcono === "hub") {
      boton.addEventListener("click", (evento) => {
        evento.preventDefault();
        mostrarAlertaAjustes("info", "Centro de comunidad guardado para una proxima version.");
      });
    }

    if (nombreIcono === "settings") {
      boton.addEventListener("click", (evento) => {
        evento.preventDefault();
        window.location.href = "ciudadano_ajustes.html";
      });
    }
  });
}

/**
 * Cierra la sesion del dispositivo mostrado en la tarjeta de seguridad.
 *
 * @returns {void}
 */
function prepararCerrarSesionDispositivo() {
  const boton = document.getElementById("btnCerrarSesionDispositivo");

  if (boton) {
    boton.addEventListener("click", (evento) => confirmarCerrarSesion(evento));
  }
}

/**
 * Inactiva la cuenta propia del ciudadano despues de pedir confirmacion.
 *
 * @returns {Promise<void>} No retorna datos porque redirige o muestra alerta.
 */
async function eliminarCuentaCiudadano() {
  const confirmacion = confirm("Esta accion inactivara tu cuenta. ¿Deseas continuar?");

  if (!confirmacion) {
    return;
  }

  try {
    const respuesta = await fetch(`${API_URL}${ENDPOINT_ELIMINAR_CUENTA}`, {
      method: "DELETE",
      headers: crearHeadersAjustes()
    });

    const datos = await leerJsonSeguro(respuesta);

    if (!respuesta.ok) {
      mostrarAlertaAjustes("danger", datos.mensaje || "No fue posible eliminar la cuenta.");
      return;
    }

    mostrarAlertaAjustes("success", "Cuenta inactivada correctamente. Cerrando sesion...");

    setTimeout(() => {
      cerrarSesion();
    }, 1200);

  } catch (error) {
    mostrarAlertaAjustes("danger", "No se pudo conectar con el backend para eliminar la cuenta.");
  }
}

/**
 * Conecta el boton de zona de peligro.
 *
 * @returns {void}
 */
function prepararEliminarCuenta() {
  const botonEliminar = document.getElementById("btnEliminarCuenta");

  if (botonEliminar) {
    botonEliminar.addEventListener("click", eliminarCuentaCiudadano);
  }
}

/**
 * Prepara la pantalla cuando el navegador termina de cargar el HTML.
 *
 * @returns {void}
 */
document.addEventListener("DOMContentLoaded", () => {
  if (!obtenerTokenAjustes()) {
    redirigirALogin();
    return;
  }

  const formularioPerfil = document.getElementById("form-perfil");
  const formularioPassword = document.getElementById("form-password");
  const formularioNotificaciones = document.getElementById("notificationsForm");
  const formularioPreferencias = document.getElementById("preferencesForm");

  if (formularioPerfil) {
    formularioPerfil.addEventListener("submit", guardarDatosPerfil);
    cargarPerfilUsuario();
  }

  if (formularioPassword) {
    formularioPassword.addEventListener("submit", actualizarPassword);
  }

  if (formularioNotificaciones) {
    cargarNotificacionesGuardadas();
    formularioNotificaciones.addEventListener("submit", guardarNotificaciones);
  }

  if (formularioPreferencias) {
    cargarPreferenciasGuardadas();
    formularioPreferencias.addEventListener("submit", guardarPreferencias);
  }

  prepararBotonAvatar();
  prepararSuscripcionFooter();
  prepararBotonesGeneralesConfiguracion();
  prepararCerrarSesionDispositivo();
  prepararEliminarCuenta();
});
