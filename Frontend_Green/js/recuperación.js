document.addEventListener("DOMContentLoaded", () => {
    const formSolicitar = document.getElementById("formSolicitarCodigo");

    if (formSolicitar) {
        formSolicitar.addEventListener("submit", async (e) => {
            e.preventDefault();

            const correoInput = document.getElementById("correoRecuperacion");
            const correo = correoInput.value.trim();
            const btnEnviar = document.getElementById("btnEnviar");

            if (!correo) {
                alert("Por favor, ingresa tu correo electrónico.");
                return;
            }

            // Cambiar estado visual del botón durante el envío
            btnEnviar.disabled = true;
            btnEnviar.innerHTML = `Enviando... <span class="material-symbols-outlined">sync</span>`;

            try {
                const respuesta = await fetch("http://127.0.0.1:5000/api/recuperar-contrasena/solicitar", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ correo: correo })
                });

                const data = await respuesta.json();

                if (respuesta.ok) {
                    // Guardar el correo en localStorage para validarlo en las siguientes pantallas
                    localStorage.setItem("correo_recuperacion", correo);
                    // Redirigir a la pantalla donde se ingresa el código
                    window.location.href = "public_verificar_codigo.html";
                } else {
                    alert(data.mensaje || "No se pudo enviar el correo de verificación.");
                    btnEnviar.disabled = false;
                    btnEnviar.innerHTML = `Enviar código de verificación <span class="material-symbols-outlined">send</span>`;
                }
            } catch (error) {
                console.error("Error en la petición:", error);
                alert("Error de conexión con el servidor. Verifica que Flask esté ejecutándose.");
                btnEnviar.disabled = false;
                btnEnviar.innerHTML = `Enviar código de verificación <span class="material-symbols-outlined">send</span>`;
            }
        });
    }
});