# Manual de usuario de GreenUp

## 1. Presentación

GreenUp es una aplicación web para promover y gestionar el reciclaje en Valledupar. Permite consultar puntos ecológicos, registrar entregas, hacer seguimiento del historial, administrar materiales y residuos, y consultar información ambiental.

Este manual explica el uso de la aplicación según el tipo de usuario. Las opciones visibles pueden variar de acuerdo con el rol y los permisos de la cuenta.

## 2. Requisitos de uso

- Navegador actualizado: Chrome, Edge, Firefox o Safari.
- Conexión a Internet para consultar la aplicación y guardar información.
- JavaScript y cookies habilitados.
- Para usar módulos privados se necesita una cuenta activa.
- En dispositivos móviles se recomienda usar la orientación vertical para formularios y horizontal cuando se consulten tablas amplias.

## 3. Acceso a la aplicación

### 3.1 Página pública

Desde la página inicial se puede:

- Conocer el propósito de GreenUp.
- Consultar el mapa ecológico público.
- Leer noticias y contenido educativo.
- Consultar estadísticas públicas.
- Ver preguntas frecuentes y la información de GreenUp.
- Entrar a la cuenta o registrarse.

Los visitantes pueden consultar la información pública sin iniciar sesión. Las acciones que modifican datos requieren autenticación.

### 3.2 Crear una cuenta

1. Seleccione **Registrarse**.
2. Complete nombres, apellidos, correo, celular, género y contraseña.
3. Seleccione el tipo de registro: ciudadano o recicladora.
4. Complete los datos adicionales solicitados para el rol seleccionado.
5. Revise los datos y envíe el formulario.
6. Si se solicita un código de verificación, ingréselo desde la pantalla correspondiente.

Use un correo válido y una contraseña segura. Si el registro de recicladora requiere validación administrativa, algunas funciones permanecerán pendientes hasta su aprobación.

### 3.3 Iniciar sesión

1. Seleccione **Entrar**.
2. Escriba el correo o nombre de usuario.
3. Escriba la contraseña.
4. Complete el mecanismo de verificación que aparezca.
5. Seleccione **Ingresar a mi cuenta**.

La aplicación dirige automáticamente al panel correspondiente al rol. No comparta la contraseña ni deje la sesión abierta en equipos públicos.

### 3.4 Recuperar la contraseña

1. En la pantalla de acceso seleccione **¿Olvidaste tu contraseña?**.
2. Escriba el correo asociado a la cuenta.
3. Revise el correo y copie el código o abra el enlace recibido.
4. Verifique el código dentro del tiempo indicado.
5. Cree una nueva contraseña y confirme el cambio.

Si el código está vencido o ya fue utilizado, solicite uno nuevo. Por seguridad, el sistema no confirma si un correo existe cuando la solicitud no puede procesarse.

### 3.5 Cerrar sesión

Use **Cerrar sesión** desde el menú del perfil o desde el menú lateral. La aplicación eliminará la sesión local y regresará a la pantalla pública de acceso.

## 4. Navegación general

La barra superior permite acceder a búsqueda, notificaciones, perfil y configuración. El menú lateral muestra los módulos disponibles para el rol actual. En móvil se utiliza el menú compacto y la navegación inferior.

El enlace **Sobre nosotros** conserva la sesión: al abrirlo no se cierra la cuenta. La navegación y los enlaces se adaptan al rol activo al regresar a la aplicación.

## 5. Rol ciudadano

### 5.1 Inicio

El panel muestra un resumen de la actividad del ciudadano, accesos a las acciones principales y el estado de sus reciclajes. Use las tarjetas o el menú para registrar una entrega, consultar el historial, abrir el mapa o revisar estadísticas.

### 5.2 Registrar un reciclaje

1. Abra **Registrar reciclaje**.
2. Seleccione el punto ecológico o recicladora de destino.
3. Seleccione el material correspondiente.
4. Escriba la cantidad y revise la unidad de medida.
5. Añada observaciones si son necesarias.
6. Envíe el registro una sola vez y espere el mensaje de confirmación.

El registro queda inicialmente como **Pendiente**. La recicladora debe revisarlo antes de confirmarlo o rechazarlo.

### 5.3 Historial

En **Mi historial** se muestran únicamente los registros del ciudadano autenticado. Se pueden revisar fecha, material, cantidad, punto de destino y estado:

- **Pendiente:** todavía no ha sido validado.
- **Confirmado:** la recicladora aceptó la entrega.
- **Rechazado:** la recicladora no aceptó la entrega; puede aparecer el motivo.

Use los filtros de fecha, estado o material cuando estén disponibles. Si no hay datos, la pantalla muestra un estado vacío y no debe interpretarse como un error.

### 5.4 Mapa ecológico

El mapa muestra los puntos disponibles y su información pública. Puede buscar por dirección o barrio, seleccionar un marcador y consultar nombre, dirección, horario, materiales aceptados y datos de contacto.

Si el mapa no está disponible, revise la conexión y consulte nuevamente. Las ubicaciones sin coordenadas válidas no se muestran como marcadores.

### 5.5 Estadísticas

Consulte kilos recuperados, cantidad de entregas, materiales y posición en el ranking cuando exista información. Las gráficas sin datos muestran un estado vacío; no representan valores cero inventados ni resultados de otro usuario.

### 5.6 Educación, noticias y FAQ

Use **Educación**, **Noticias** y **Preguntas frecuentes** para consultar guías, novedades ambientales, recomendaciones y respuestas a dudas comunes. Los enlaces externos deben abrirse con precaución y conducir a fuentes reconocibles.

### 5.7 Ajustes

En **Ajustes** puede revisar o actualizar la información permitida de su perfil, cambiar la foto y gestionar la contraseña. Guarde los cambios y espere el mensaje de resultado.

## 6. Rol recicladora

### 6.1 Panel de control

El panel resume la operación del punto: materiales activos, entregas, kilos procesados, usuarios y alertas. Las cifras se actualizan desde la base de datos y pueden cambiar cuando se confirma o rechaza una entrega.

### 6.2 Materiales aceptados

En **Gestionar materiales** se administran los materiales que recibe el punto. La pantalla separa:

- **Materiales aceptados:** catálogo de materiales disponibles para el punto.
- **Registro de materiales:** entregas registradas con material, peso, estado y origen.

Un material es un elemento específico como cartón y papel, vidrio, plástico, aluminio o aceite usado. No debe confundirse con la clasificación de residuos.

### 6.3 Residuos recibidos

En **Gestionar residuos** se informa qué recibe la recicladora y qué incluye cada clasificación:

- **Aprovechables o reciclables:** plástico, cartón, papel, vidrio y metal.
- **Orgánicos:** restos de comida, frutas, verduras y material vegetal.
- **Peligrosos:** pilas, baterías, residuos electrónicos y materiales contaminados.
- **Químicos:** aceites usados, pinturas, solventes y otros productos químicos.

Esta guía ayuda al ciudadano a seleccionar correctamente el material y evitar confusiones entre material y residuo.

### 6.4 Registro pendiente

Abra **Registro pendiente** desde el menú lateral. Esta pantalla muestra las entregas asociadas al punto y permite revisar las que todavía están pendientes.

Para validar una entrega:

1. Revise usuario, material, cantidad y punto de origen.
2. Seleccione **Confirmar** si la entrega fue recibida y cumple las condiciones.
3. Seleccione **Rechazar** si no puede aceptarse.
4. Escriba el motivo cuando se solicite.
5. Espere la confirmación de la operación.

Una entrega confirmada o rechazada no debe procesarse nuevamente. El ciudadano verá el nuevo estado en su historial y las estadísticas se actualizarán según corresponda.

### 6.5 Usuarios recicladores

Este módulo permite consultar los usuarios relacionados con la operación del punto. Use búsqueda y filtros cuando estén disponibles y revise que cualquier acción corresponda al usuario correcto.

### 6.6 Mi punto ecológico

Muestra la información del punto administrado: nombre, dirección, contacto, horario y estado. La ubicación se utiliza para sincronizar el mapa. Si faltan coordenadas o dirección, complete la información desde el perfil o configuración disponible.

### 6.7 Estadísticas y ranking

Las estadísticas de la recicladora incluyen kilos confirmados, entregas y materiales. El ranking de usuarios muestra quién ha reciclado más en ese punto, calculado a partir de entregas confirmadas. Los registros pendientes o rechazados no deben contarse como kilos recuperados.

### 6.8 Contenido, novedades y FAQ

La recicladora puede consultar o gestionar el contenido habilitado para su módulo, publicar novedades permitidas y revisar preguntas frecuentes. Verifique título, descripción, estado y fecha antes de guardar o publicar.

### 6.9 Perfil y configuración

Desde el menú de perfil puede actualizar datos permitidos, cambiar la foto, cambiar la contraseña, consultar registros pendientes y cerrar sesión. Las acciones sensibles deben confirmarse antes de ejecutarse.

## 7. Rol administrador del sistema

El administrador tiene módulos de mayor alcance y debe operar con especial cuidado.

### 7.1 Panel y usuarios

Desde **Panel**, **Usuarios** y **Roles** se consultan cuentas, estados y permisos. Puede buscar, filtrar, activar o inactivar según las políticas del sistema. Nunca asigne privilegios superiores sin autorización.

### 7.2 Recicladoras y puntos

En los módulos de recicladoras, mapa y puntos ecológicos se revisan solicitudes, datos de contacto, ubicación y estado de aprobación. Antes de activar un punto, compruebe que la información sea completa y coherente.

### 7.3 Catálogos y contenido

El administrador puede gestionar materiales, residuos, documentos, noticias, contenido educativo y FAQ. Mantenga separadas las categorías de residuos y los materiales aceptados para que la información mostrada al ciudadano sea clara.

### 7.4 Registros, reportes y estadísticas

Consulte registros de reciclaje, reportes y estadísticas globales. Use filtros antes de exportar y revise el rango de fechas. Las exportaciones deben tratarse como información de operación y no compartirse públicamente sin autorización.

### 7.5 Configuración

Revise parámetros generales, estados y opciones administrativas. Los cambios que afectan permisos, catálogos o datos deben documentarse y validarse antes de publicarse.

## 8. Mensajes y estados frecuentes

- **Cargando:** la aplicación está consultando el servidor; espere antes de repetir una acción.
- **Sin registros:** no existen datos para la cuenta o filtros actuales.
- **Pendiente:** la operación requiere revisión.
- **Confirmado:** la operación fue aceptada.
- **Rechazado:** la operación no fue aceptada; revise el motivo.
- **No se pudo cargar:** revise conexión, sesión y disponibilidad del backend.
- **Sesión vencida:** vuelva a iniciar sesión; no comparta el token ni la contraseña.

## 9. Recomendaciones de seguridad

- Use una contraseña de al menos ocho caracteres con mayúsculas, minúsculas y números.
- No reutilice la contraseña en otros servicios.
- Cierre sesión en equipos compartidos.
- Verifique el destinatario, material y cantidad antes de registrar o confirmar una entrega.
- No intente modificar el rol desde el navegador.
- No comparta capturas que expongan correos, teléfonos, tokens o datos personales.
- Informe accesos extraños, cambios no reconocidos o errores repetidos al responsable del sistema.

## 10. Accesibilidad y uso móvil

- Navegue con teclado usando `Tab`, `Shift + Tab` y `Enter`.
- Use el foco visible para identificar el control seleccionado.
- Todos los campos importantes deben tener etiqueta y los botones deben indicar su acción.
- En móvil, abra el menú compacto para cambiar de módulo.
- Para tablas anchas, desplácese horizontalmente o use la presentación por tarjetas.
- Reduzca el movimiento desde las preferencias del sistema si las animaciones resultan incómodas.

## 11. Solución de problemas

### La página no carga

Compruebe Internet, recargue con `Ctrl + F5` y revise que la dirección sea correcta. Si otras páginas funcionan y una sola falla, cierre sesión, vuelva a entrar y repita la operación.

### No aparecen registros

Quite filtros, confirme que está en el rol correcto y espere a que termine la carga. Un ciudadano solo ve sus registros y una recicladora solo ve los registros asociados a su punto.

### No puedo confirmar una entrega

Verifique que esté autenticado como recicladora, que la entrega siga pendiente y que no haya sido procesada por otra sesión. Si el problema continúa, conserve el código del registro y reporte el error.

### No llega el correo de recuperación

Revise spam y correo no deseado, confirme la dirección escrita y solicite un código nuevo. No comparta códigos de recuperación.

### El mapa no muestra un punto

Compruebe que el punto esté activo, aprobado y tenga coordenadas válidas. Los puntos sin ubicación completa pueden aparecer en la lista, pero no necesariamente como marcador.

## 12. Soporte

Al reportar un problema indique el rol utilizado, la pantalla, la hora aproximada, el código del registro si aplica y una captura sin datos sensibles. No incluya contraseñas, tokens ni claves de configuración.

---

**Documento:** Manual de usuario GreenUp  
**Versión:** 1.0  
**Fecha:** 2026
