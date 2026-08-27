const RECUPERACION_API = "https://greenup-hoxj.onrender.com/api/recuperar-contrasena";
const RECUPERACION_TIMEOUT_MS = 15000;

async function enviarRecuperacion(endpoint, datos) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), RECUPERACION_TIMEOUT_MS);

  try {
    const respuesta = await fetch(`${RECUPERACION_API}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
      signal: controller.signal,
    });

    const texto = await respuesta.text();
    const data = texto ? JSON.parse(texto) : {};
    return { ok: respuesta.ok, data };
  } finally {
    window.clearTimeout(timeout);
  }
}

function getCorreoRecuperacion() {
  return localStorage.getItem("correo_recuperacion") || "";
}

function getCorreoPrellenado() {
  return localStorage.getItem("correo_recuperacion_prellenado") || "";
}

function getCodigoRecuperacion() {
  return localStorage.getItem("codigo_recuperacion") || "";
}

function guardarExpiracionCodigo(segundos = 30) {
  const expiraEn = Date.now() + Number(segundos || 30) * 1000;
  localStorage.setItem("codigo_recuperacion_expira", String(expiraEn));
}

function getExpiracionCodigo() {
  return Number(localStorage.getItem("codigo_recuperacion_expira") || 0);
}

function limpiarExpiracionCodigo() {
  localStorage.removeItem("codigo_recuperacion_expira");
}

function evaluarContrasena(contrasena) {
  return {
    length: contrasena.length >= 8,
    uppercase: /[A-Z]/.test(contrasena),
    lowercase: /[a-z]/.test(contrasena),
    number: /\d/.test(contrasena),
    special: /[^A-Za-z0-9\s]/.test(contrasena),
    space: !/\s/.test(contrasena),
  };
}

function getReglasFaltantes(reglas) {
  const mensajes = {
    length: "mínimo 8 caracteres",
    uppercase: "una letra mayúscula",
    lowercase: "una letra minúscula",
    number: "un número",
    special: "un carácter especial",
    space: "sin espacios",
  };

  return Object.entries(reglas)
    .filter(([, cumple]) => !cumple)
    .map(([regla]) => mensajes[regla]);
}

function actualizarSeguridadContrasena() {
  const input = document.getElementById("nuevaContrasena");
  const strength = document.getElementById("passwordStrength");
  const label = document.getElementById("strengthLabel");
  const bar = document.getElementById("strengthBar");
  const rulesList = document.getElementById("passwordRules");
  if (!input || !strength || !label || !bar || !rulesList) return false;

  const reglas = evaluarContrasena(input.value);
  const cumplidas = Object.values(reglas).filter(Boolean).length;
  const porcentaje = Math.round((cumplidas / Object.keys(reglas).length) * 100);

  rulesList.querySelectorAll("[data-rule]").forEach((item) => {
    const rule = item.getAttribute("data-rule");
    item.classList.toggle("ok", Boolean(reglas[rule]));
  });

  strength.classList.remove("medium", "strong");
  if (cumplidas >= 6) {
    label.textContent = "Segura";
    strength.classList.add("strong");
  } else if (cumplidas >= 4) {
    label.textContent = "Media";
    strength.classList.add("medium");
  } else {
    label.textContent = input.value ? "Muy insegura" : "Muy insegura";
  }

  bar.style.width = `${porcentaje}%`;
  return cumplidas === Object.keys(reglas).length;
}

function configurarBotonesVerContrasena() {
  document.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.togglePassword);
      const icon = button.querySelector(".material-symbols-outlined");
      if (!input) return;

      const mostrar = input.type === "password";
      input.type = mostrar ? "text" : "password";
      button.setAttribute("aria-label", mostrar ? "Ocultar contraseña" : "Mostrar contraseña");
      if (icon) icon.textContent = mostrar ? "visibility_off" : "visibility";
    });
  });
}

function configurarSolicitudCodigo() {
  const formSolicitar = document.getElementById("formSolicitarCodigo");
  if (!formSolicitar) return;

  const correoInput = document.getElementById("correoRecuperacion");
  const correoPrellenado = getCorreoPrellenado();
  if (correoInput && correoPrellenado) {
    correoInput.value = correoPrellenado;
  }

  formSolicitar.addEventListener("submit", async (e) => {
    e.preventDefault();

    const btnEnviar = document.getElementById("btnEnviar");
    const correo = correoInput.value.trim();

    if (!correo) {
      alert("Por favor, ingresa tu correo electronico.");
      return;
    }

    btnEnviar.disabled = true;
    btnEnviar.textContent = "Enviando...";

    try {
      const respuesta = await enviarRecuperacion("solicitar", { correo });

      if (respuesta.ok && respuesta.data.enviado) {
        localStorage.setItem("correo_recuperacion", correo);
        guardarExpiracionCodigo(respuesta.data.expira_en_segundos || 30);
        localStorage.removeItem("correo_recuperacion_prellenado");
        localStorage.removeItem("codigo_recuperacion");
        window.location.href = "public_verificar_codigo.html";
        return;
      }

      alert(respuesta.data.mensaje || "No se pudo enviar el correo de verificacion.");
    } catch (error) {
      console.error("Error solicitando codigo:", error);
      const mensaje = error.name === "AbortError"
        ? "El servidor tardo demasiado en responder. Intenta nuevamente en unos segundos."
        : "Error de conexion con el servidor. Verifica que el backend este activo.";
      alert(mensaje);
    } finally {
      btnEnviar.disabled = false;
      btnEnviar.textContent = "Enviar codigo de verificacion";
    }
  });
}

function configurarOtp() {
  const inputs = [...document.querySelectorAll(".otp-input")];
  if (!inputs.length) return;

  inputs[0].focus();

  inputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(0, 1);
      if (input.value && inputs[index + 1]) inputs[index + 1].focus();
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Backspace" && !input.value && inputs[index - 1]) {
        inputs[index - 1].focus();
      }
    });

    input.addEventListener("paste", (event) => {
      event.preventDefault();
      const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, inputs.length);
      pasted.split("").forEach((digit, pastedIndex) => {
        inputs[pastedIndex].value = digit;
      });
      inputs[Math.min(pasted.length, inputs.length) - 1]?.focus();
    });
  });
}

function iniciarContadorCodigo() {
  const contador = document.getElementById("contadorCodigo");
  if (!contador) return;

  const texto = contador.querySelector("span:last-child") || contador;
  let intervalo = null;

  const actualizar = () => {
    const restante = Math.max(0, Math.ceil((getExpiracionCodigo() - Date.now()) / 1000));
    texto.textContent = restante > 0 ? `Vence en ${restante} s` : "Código vencido";
    contador.classList.toggle("expired", restante <= 0);

    document.querySelectorAll(".otp-input").forEach((input) => {
      input.disabled = restante <= 0;
    });

    const boton = document.querySelector("#formVerificarCodigo button[type='submit']");
    if (boton && restante <= 0) {
      boton.disabled = true;
      boton.innerHTML = 'Solicita un código nuevo <span class="material-symbols-outlined">refresh</span>';
    }

    if (restante <= 0 && intervalo) {
      clearInterval(intervalo);
    }
  };

  actualizar();
  intervalo = window.setInterval(actualizar, 1000);
}

function configurarVerificacionCodigo() {
  const formVerificar = document.getElementById("formVerificarCodigo");
  if (!formVerificar) return;

  const correo = getCorreoRecuperacion();
  if (!correo) {
    alert("Primero debes solicitar un codigo de recuperacion.");
    window.location.href = "public_recuperar_contrasena.html";
    return;
  }

  const textoAyuda = formVerificar.previousElementSibling?.querySelector("p");
  if (textoAyuda) {
    textoAyuda.textContent = `Escribe el codigo de 6 digitos que enviamos a ${correo}.`;
  }

  iniciarContadorCodigo();

  formVerificar.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (getExpiracionCodigo() && Date.now() > getExpiracionCodigo()) {
      alert("El codigo vencio. Solicita uno nuevo.");
      window.location.href = "public_recuperar_contrasena.html";
      return;
    }

    const codigo = [...document.querySelectorAll(".otp-input")]
      .map((input) => input.value.trim())
      .join("");

    if (codigo.length !== 6) {
      alert("Ingresa los 6 digitos del codigo.");
      return;
    }

    try {
      const respuesta = await enviarRecuperacion("verificar", { correo, codigo });

      if (respuesta.ok) {
        localStorage.setItem("codigo_recuperacion", codigo);
        limpiarExpiracionCodigo();
        window.location.href = "public_nueva_contrasena.html";
        return;
      }

      alert(respuesta.data.mensaje || "Codigo invalido o expirado.");
    } catch (error) {
      console.error("Error verificando codigo:", error);
      alert("Error de conexion con el servidor.");
    }
  });
}

function configurarNuevaContrasena() {
  const formNueva = document.getElementById("formNuevaContrasena");
  if (!formNueva) return;

  const correo = getCorreoRecuperacion();
  const codigo = getCodigoRecuperacion();
  if (!correo || !codigo) {
    alert("Primero debes validar tu codigo de recuperacion.");
    window.location.href = "public_recuperar_contrasena.html";
    return;
  }

  configurarBotonesVerContrasena();
  actualizarSeguridadContrasena();
  document.getElementById("nuevaContrasena").addEventListener("input", actualizarSeguridadContrasena);

  formNueva.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nuevaContrasena = document.getElementById("nuevaContrasena").value;
    const confirmarContrasena = document.getElementById("confirmarContrasena").value;
    const btnRestablecer = document.getElementById("btnRestablecer");

    if (nuevaContrasena !== confirmarContrasena) {
      alert("Las contrasenas no coinciden.");
      return;
    }

    const reglas = evaluarContrasena(nuevaContrasena);
    const faltantes = getReglasFaltantes(reglas);
    if (faltantes.length) {
      alert(`La contraseña todavía no es segura. Te falta: ${faltantes.join(", ")}.`);
      actualizarSeguridadContrasena();
      return;
    }

    btnRestablecer.disabled = true;
    btnRestablecer.textContent = "Actualizando...";

    try {
      const respuesta = await enviarRecuperacion("restablecer", {
        correo,
        codigo,
        nueva_contrasena: nuevaContrasena,
      });

      if (respuesta.ok) {
        localStorage.removeItem("correo_recuperacion");
        localStorage.removeItem("codigo_recuperacion");
        limpiarExpiracionCodigo();
        localStorage.removeItem("usuario");
        localStorage.removeItem("token");
        alert("Contrasena actualizada. Ya puedes iniciar sesion.");
        window.location.href = "public_login.html";
        return;
      }

      alert(respuesta.data.mensaje || "No se pudo actualizar la contrasena.");
    } catch (error) {
      console.error("Error restableciendo contrasena:", error);
      alert("Error de conexion con el servidor.");
    } finally {
      btnRestablecer.disabled = false;
      btnRestablecer.textContent = "Restablecer contraseña";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  configurarSolicitudCodigo();
  configurarOtp();
  configurarVerificacionCodigo();
  configurarNuevaContrasena();
});
