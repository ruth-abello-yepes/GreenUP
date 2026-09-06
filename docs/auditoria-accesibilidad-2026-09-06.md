# Auditoría de accesibilidad de los tres roles

Fecha: 6 de septiembre de 2026
Alcance: ciudadano, dueño de recicladora y administrador del sistema.

## Cobertura

Se revisaron las 41 vistas HTML de los tres roles con datos simulados y sesión local. La matriz automatizada ejecutó 219 escenarios:

- Escritorio: 1440 px.
- Móvil: 390 px y 320 px.
- Tema claro para ciudadano.
- Temas claro y oscuro para recicladora y administrador.
- Reglas automáticas WCAG 2.0 A/AA, WCAG 2.1 AA y WCAG 2.2 AA con axe-core.

También se abrieron y probaron por teclado los menús principales, los paneles de notificaciones y los cuadros de confirmación de los tres roles. Se revisaron 14 variantes de formularios administrativos abiertos, en tema claro y oscuro, y se inspeccionaron capturas de las pantallas principales en escritorio y móvil.

`recicladora_foro.html` es una redirección inmediata a `recicladora_novedades.html`; la vista de destino sí está incluida en la matriz.

## Correcciones realizadas

- Contraste de textos, campos, iconos, estados y botones en superficies claras y oscuras.
- Colores separados por tema para evitar texto oscuro sobre fondos oscuros y texto claro sobre fondos claros.
- Bordes visibles de campos y un indicador de foco consistente.
- Nombre accesible del progreso de reciclaje, botones de perfil y marcadores del mapa.
- Tablas desplazables accesibles por teclado, con nombre de región.
- Destino de “Saltar al contenido principal” enfocable.
- Apertura, cierre con Escape, retorno del foco y estado `aria-expanded` en menús y notificaciones.
- Contención del foco y retorno al control de origen en los cuadros de confirmación.
- Nombre accesible para los formularios modales del administrador.
- Objetivos táctiles de al menos 44 px en móvil y compatibilidad con reducción de movimiento.

## Resultado

La pasada completa detectó un nombre faltante en los marcadores del mapa administrativo. Se corrigió agregando título y texto alternativo y la repetición dirigida no presentó hallazgos. Los escenarios de interacción y los formularios abiertos tampoco dejaron hallazgos automáticos pendientes. No se detectó desbordamiento horizontal en los anchos evaluados.

## Límites de la verificación

La prueba automatizada no equivale a una certificación WCAG. Se usaron datos simulados para no modificar registros reales y se bloquearon imágenes remotas durante parte de la prueba. Conviene completar una validación manual con usuarios y con lectores de pantalla reales (NVDA, VoiceOver o TalkBack), especialmente para flujos largos, contenido editorial nuevo, mapas y archivos que se carguen en el futuro.

Referencias de los criterios aplicados:

- [WCAG 2.2: contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [WCAG 2.2: contraste no textual](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- [WCAG 2.2: tamaño mínimo del objetivo](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
