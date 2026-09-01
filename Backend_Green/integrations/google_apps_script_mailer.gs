function doPost(e) {
  try {
    // Verificar que se recibieron datos
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No se recibieron datos.");
    }

    // Leer los datos enviados por GreenUp
    var data = JSON.parse(e.postData.contents);
    var expectedSecret = PropertiesService.getScriptProperties().getProperty("GREENUP_MAIL_SECRET");

    if (expectedSecret && data.secret !== expectedSecret) {
      throw new Error("Solicitud no autorizada.");
    }

    // Obtener los datos del correo
    var destinatario = data.to;
    var asunto = data.subject || "Código de recuperación de contraseña - GreenUp";
    var mensajeHtml = data.html || "<p>Este es un mensaje de GreenUp.</p>";
    var mensajeTexto = data.text || "Este es un mensaje de GreenUp.";

    // Verificar que exista un destinatario
    if (!destinatario) {
      throw new Error("No se recibió el correo del destinatario.");
    }

    // Enviar el correo desde Gmail
    MailApp.sendEmail({
      to: destinatario,
      subject: asunto,
      body: mensajeTexto,
      htmlBody: mensajeHtml,
      name: "GreenUP"
    });

    // Responder que el correo fue enviado
    return ContentService
      .createTextOutput(
        JSON.stringify({
          estado: "ok",
          mensaje: "Correo enviado correctamente."
        })
      )
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {

    // Responder si ocurre un error
    return ContentService
      .createTextOutput(
        JSON.stringify({
          estado: "error",
          mensaje: error.toString()
        })
      )
      .setMimeType(ContentService.MimeType.JSON);
  }
}
