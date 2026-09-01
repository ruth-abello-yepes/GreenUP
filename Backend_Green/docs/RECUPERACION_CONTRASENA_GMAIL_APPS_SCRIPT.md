# Recuperacion de contrasena con Gmail gratis

Esta opcion evita el bloqueo de SMTP en Render. Render llama por HTTPS a Google Apps Script y el correo sale desde la cuenta Gmail de GreenUP.

## 1. Crear el Apps Script

1. Entra con el correo de GreenUP a `https://script.google.com`.
2. Crea un proyecto nuevo llamado `GreenUP Mailer`.
3. Borra el codigo inicial y pega el contenido de:
   `Backend_Green/integrations/google_apps_script_mailer.gs`
4. En `Project Settings`, abre `Script properties` y agrega:
   - `GREENUP_MAIL_SECRET`: una clave larga privada.

## 2. Publicarlo

1. Pulsa `Deploy`.
2. Selecciona `New deployment`.
3. Tipo: `Web app`.
4. `Execute as`: `Me`.
5. `Who has access`: `Anyone`.
6. Autoriza permisos de Gmail.
7. Copia la URL que termina en `/exec`.

## 3. Variables en Render

En el backend de Render, entra a `Environment` y deja estas variables:

```text
APPS_SCRIPT_URL=<URL /exec del Apps Script>
APPS_SCRIPT_SECRET=<misma clave de GREENUP_MAIL_SECRET>
MAIL_TIMEOUT=8
```

No necesitas `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USE_SSL`, `MAIL_USE_TLS`, `MAIL_USERNAME` ni `MAIL_PASSWORD` para esta opcion.

## 4. Probar

Luego de `Save, rebuild and deploy`, prueba:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "https://greenup-hoxj.onrender.com/api/recuperar-contrasena/solicitar" `
  -ContentType "application/json" `
  -Body '{"correo":"correo-registrado-en-greenup@gmail.com"}'
```

Si responde `enviado: true`, el usuario debe pasar a la pantalla del codigo y recibir seis digitos en su correo.
