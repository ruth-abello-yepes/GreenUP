function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function safeEquals(left, right) {
  left = String(left || "");
  right = String(right || "");

  if (!left || left.length !== right.length) {
    return false;
  }

  var difference = 0;

  for (var index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return difference === 0;
}

// Permite comprobar que la aplicación web está funcionando.
function doGet() {
  return jsonResponse({
    estado: "ok",
    servicio: "GreenUP Mailer"
  });
}

// Recibe desde el backend el correo y envía el código.
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({
        estado: "error",
        mensaje: "No se recibieron datos"
      });
    }

    var data = JSON.parse(e.postData.contents);

    var expectedSecret = PropertiesService
      .getScriptProperties()
      .getProperty("GREENUP_MAIL_SECRET");

    if (!expectedSecret || !safeEquals(data.secret, expectedSecret)) {
      return jsonResponse({
        estado: "error",
        mensaje: "Solicitud no autorizada"
      });
    }

    var recipient = String(data.to || "").trim().toLowerCase();
    var subject = String(
      data.subject || "Código de recuperación - GreenUP"
    ).trim().slice(0, 150);

    var textBody = String(
      data.text || "Tu código de recuperación está en este mensaje."
    );

    var htmlBody = String(data.html || "");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      return jsonResponse({
        estado: "error",
        mensaje: "Destinatario inválido"
      });
    }

    if (MailApp.getRemainingDailyQuota() < 1) {
      return jsonResponse({
        estado: "error",
        mensaje: "Cuota diaria de correo agotada"
      });
    }

    MailApp.sendEmail({
      to: recipient,
      subject: subject,
      body: textBody,
      htmlBody: htmlBody,
      name: "GreenUP"
    });

    return jsonResponse({
      estado: "ok",
      mensaje: "Correo enviado correctamente"
    });

  } catch (error) {
    console.error("GreenUP Mailer:", error);

    return jsonResponse({
      estado: "error",
      mensaje: "No fue posible enviar el correo"
    });
  }
}
