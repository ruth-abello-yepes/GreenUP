from flasgger import Swagger


def configurar_swagger(app):
    swagger_config = {
        "title": "API GreenUp",
        "description": "Documentacion del backend de GreenUp",
        "version": "1.0"
    }

    Swagger(app, template={
        "info": swagger_config
    })
