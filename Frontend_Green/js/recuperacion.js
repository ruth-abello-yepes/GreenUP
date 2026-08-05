const RECUPERACION_API = "http://127.0.0.1:5000/api/recuperar-contrasena";

async function enviarRecuperacion(endpoint, datos) {
  const respuesta = await fetch(`${RECUPERACION_API}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });

  const data = await respuesta.json();
  return { ok: respuesta.ok, data };
}

function getCorreoRecuperacion() {
  return localStorage.getItem("correo_recuperacion") || "";
}

function getCodigoRecuperacion() {
  return localStorage.getItem("codigo_recuperacion") || "";
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

  formSolicitar.addEventListener("submit", async (e) => {
    e.preventDefault();

    const correoInput = document.getElementById("correoRecuperacion");
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

      if (respuesta.ok) {
        localStorage.setItem("correo_recuperacion", correo);
        localStorage.removeItem("codigo_recuperacion");
        window.location.href = "public_verificar_codigo.html";
        return;
      }

      alert(respuesta.data.mensaje || "No se pudo enviar el correo de verificacion.");
    } catch (error) {
      console.error("Error solicitando codigo:", error);
      alert("Error de conexion con el servidor. Verifica que Flask este ejecutandose.");
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

  formVerificar.addEventListener("submit", async (e) => {
    e.preventDefault();

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
