/*
    Archivo: usuarios.js
    Para que sirve:
    Aqui colocamos las funciones relacionadas con usuarios.

    En este caso, la funcion registrarUsuario()
    toma los datos del formulario de registro
    y los envia al backend.
*/


async function registrarUsuario(evento) {
    /*
        preventDefault evita que el formulario recargue la pagina.
        Si no ponemos esto, la pagina se actualiza y se pierde el proceso.
    */
    evento.preventDefault();

    /*
        Aqui tomamos los valores que la persona escribio
        en el formulario HTML.

        document.getElementById("nombres")
        busca el input que tiene id="nombres".

        .value obtiene lo que el usuario escribio.
    */
    const nombres = document.getElementById("nombres").value;
    const apellidos = document.getElementById("apellidos").value;
    const correo = document.getElementById("correo").value;
    const usuario = document.getElementById("usuario").value;
    const contrasena = document.getElementById("contrasena").value;
    const numero_documento = document.getElementById("numero_documento").value;
    const celular = document.getElementById("celular").value;
    const id_tipo_documento = document.getElementById("id_tipo_documento").value;
    const id_rol = document.getElementById("id_rol").value;

    /*
        fetch sirve para conectarnos con el backend.

        API_URL esta en el archivo api.js.
        API_URL vale: http://127.0.0.1:5000

        Entonces esta ruta completa queda:
        http://127.0.0.1:5000/api/usuarios/registrar
    */
    const respuesta = await fetch(API_URL + "/api/usuarios/registrar", {
        method: "POST",

        /*
            headers le dice al backend que estamos enviando datos JSON.
        */
        headers: {
            "Content-Type": "application/json"
        },

        /*
            body contiene los datos que vamos a enviar.

            JSON.stringify convierte un objeto de JavaScript
            en texto JSON para que Flask lo pueda recibir.
        */
        body: JSON.stringify({
            nombres: nombres,
            apellidos: apellidos,
            correo: correo,
            usuario: usuario,
            contrasena: contrasena,
            numero_documento: numero_documento,
            celular: celular,
            foto_perfil: "",

            /*
                Number convierte el