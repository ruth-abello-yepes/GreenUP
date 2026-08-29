// En desarrollo usa Flask local; en los dominios publicados usa Render.
/**
 * URL base donde se encuentra corriendo la API de Flask.
 * @constant {string}
 */
const GREENUP_PRODUCTION_API_URL = "https://greenup-hoxj.onrender.com";
const GREENUP_LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const API_URL = window.GREENUP_API_URL || (
    GREENUP_LOCAL_HOSTS.has(window.location.hostname)
        ? `http://${window.location.hostname === "localhost" ? "localhost" : "127.0.0.1"}:5000`
        : GREENUP_PRODUCTION_API_URL
);

// Compatibilidad para modulos que consultan la configuracion desde window.
window.GREENUP_API_URL = API_URL;
window.API_URL = API_URL;

/**
 * Realiza una petición HTTP estandarizada al backend de GreenUp, inyectando 
 * automáticamente el Token JWT de seguridad si el usuario está autenticado.
 * * @async
 * @function peticionSegura
 * @param {string} endpoint - La ruta específica del backend (ej. "/api/usuarios/perfil").
 * @param {string} [metodo="GET"] - El método HTTP a utilizar ("GET", "POST", "PUT", "DELETE").
 * @param {Object} [datos=null] - El objeto con los datos a enviar en el cuerpo (body) de la petición.
 * @returns {Promise<Object>} Promesa que resuelve en un objeto JSON con la respuesta del servidor.
 * @throws {Error} Lanza un error si hay un problema de red o de conexión.
 */
async function peticionSegura(endpoint, metodo = "GET", datos = null) {
    // 1. Configuramos las cabeceras por defecto (JSON)
    const opciones = {
        method: metodo,
        headers: {
            "Content-Type": "application/json",
        }
    };

    // 2. Buscamos si existe un Token JWT guardado de un login previo
    const token = localStorage.getItem("token");
    if (token) {
        // Si hay token, lo enviamos como pasaporte de autorización
        opciones.headers["Authorization"] = `Bearer ${token}`;
    }

    // 3. Si hay datos para enviar (ej. un formulario), los agregamos al cuerpo
    if (datos && (metodo === "POST" || metodo === "PUT")) {
        opciones.body = JSON.stringify(datos);
    }

    try {
        // 4. Realizamos el viaje al backend
        const respuesta = await fetch(API_URL + endpoint, opciones);
        const respuestaJSON = await respuesta.json();

        // 5. Devolvemos un objeto con el estado y los datos
        return {
            ok: respuesta.ok,       // true si el status es 200-299, false de lo contrario
            status: respuesta.status,
            datos: respuestaJSON
        };
    } catch (error) {
        console.error(`Error en peticionSegura hacia ${endpoint}:`, error);
        throw error;
    }
}
