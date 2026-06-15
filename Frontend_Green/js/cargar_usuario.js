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
        // Usamos nuestra nueva variable con el nombre corto
        elemento.textContent = nombreMostrar;
        console.log("PASO 7: ¡Nombre inyectado con éxito!");
    });
}

document.addEventListener("DOMContentLoaded", mostrarDatosUsuario);