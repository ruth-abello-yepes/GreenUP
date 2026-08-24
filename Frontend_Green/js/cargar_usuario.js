/**
 * Archivo: cargar_usuario.js
 * Propósito: Leer los datos del usuario autenticado y mostrar su nombre.
 * (Versión de Diagnóstico)
 */

function mostrarDatosUsuario() {
    console.log("PASO 1: Ejecutando el script cargar_usuario.js...");

    // 1. Buscamos en el LocalStorage
    const usuarioGuardado = localStorage.getItem("usuario");
    console.log("PASO 2: ¿Qué hay guardado en localStorage?", usuarioGuardado);

    if (!usuarioGuardado) {
        console.warn("PASO 3: Error - No se encontró la llave 'usuario' en el LocalStorage.");
        return;
    }

    // 2. Convertimos el JSON a objeto
    const usuario = JSON.parse(usuarioGuardado);
    console.log("PASO 4: Datos del usuario extraídos:", usuario);

    // 3. Extraemos y formateamos el nombre corto (Primer Nombre + Primer Apellido)
    const nombresExtraidos = usuario.nombres || usuario.nombre || "Eco-Ciudadano";
    const apellidosExtraidos = usuario.apellidos || usuario.apellido || "";

    // Cortamos los textos por los espacios y tomamos la posición [0] (la primera palabra)
    const primerNombre = nombresExtraidos.split(" ")[0];
    const primerApellido = apellidosExtraidos.split(" ")[0];

    // Unimos el primer nombre y el primer apellido
    const nombreMostrar = `${primerNombre} ${primerApellido}`.trim();
    console.log("PASO 5: Nombre corto que se va a imprimir:", nombreMostrar);

    // 4. Buscamos las etiquetas HTML con la clase
    const contenedoresNombre = document.querySelectorAll(".nombre-usuario-display");
    console.log(`PASO 6: Se encontraron ${contenedoresNombre.length} etiquetas HTML para reemplazar.`);

    // 5. Inyectamos el texto
    contenedoresNombre.forEach(elemento => {
        elemento.textContent = nombreMostrar;
    });
    console.log("PASO 7: ¡Nombre inyectado con éxito!");

    // 6. Inyectar el Avatar en el Navbar (si existe guardado en localStorage)
    const avatarBase64 = localStorage.getItem("greenup_avatar_ciudadano");
    if (avatarBase64) {
        contenedoresNombre.forEach(elemento => {
            const btnDropdown = elemento.closest("button") || elemento.parentElement;
            if (btnDropdown) {
                // Buscamos si todavia esta el icono original "account_circle"
                const iconSpan = btnDropdown.querySelector(".material-symbols-outlined");
                // Buscamos si ya existe una etiqueta img previa que nosotros mismos creamos
                const imgExistente = btnDropdown.querySelector("img.avatar-navbar-mini");

                if (imgExistente) {
                    // Si ya existe la imagen, solo actualizamos el src
                    imgExistente.src = avatarBase64;
                } else if (iconSpan && iconSpan.textContent.includes("account_circle")) {
                    // Si no existe la imagen pero si el span, lo reemplazamos
                    const img = document.createElement("img");
                    img.src = avatarBase64;
                    img.className = "rounded-circle object-fit-cover shadow-sm avatar-navbar-mini";
                    img.style.width = "32px";
                    img.style.height = "32px";
                    img.style.border = "2px solid var(--gu-primary)";
                    
                    iconSpan.replaceWith(img);
                }
            }
        });
        console.log("PASO 8: Avatar inyectado en la barra superior.");
    }
}

// Escuchar un evento personalizado por si ajustes.js actualiza la foto en tiempo real
window.addEventListener("avatarActualizado", mostrarDatosUsuario);

document.addEventListener("DOMContentLoaded", mostrarDatosUsuario);