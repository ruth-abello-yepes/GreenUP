# GreenUP
Una plataforma web diseñada para promover la conciencia ambiental y facilitar el reciclaje en áreas urbanas, específicamente en Valledupar. Su objetivo es incentivar a los ciudadanos, especialmente a jóvenes y adultos, a adoptar hábitos sostenibles a través de la tecnología. 
## Git Flow – Estructura de Ramas

- **main:** versión estable del proyecto.
- **desarrollo:** integración de funciones antes de pasar a producción.
- **Todos:** desarrollo del backend y lógica principal.
- **Todos:** diseño de la base de datos. Codigo SQL (script)
- **Todos:** desarrollo del frontend.
- **pruebas:** ejecución de test y control de calidad.

### Flujo de trabajo
1. Cada integrante trabaja en su rama personal.
2. Cuando termina una funcionalidad, crea un Pull Request hacia `desarrollo`.
3. Otro integrante revisa el código (Revisión por Pares).
4. Si se aprueba, se fusiona a `desarrollo`.
5. Cuando se completa un ciclo de desarrollo, `desarrollo` pasa a `main`.
