import os
import sys
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services import auth_service


class AppsScriptEmailTests(unittest.TestCase):
    def test_codigo_expira_en_cinco_minutos(self):
        self.assertEqual(auth_service.SEGUNDOS_EXPIRACION_RECUPERACION, 300)

    @patch.dict(
        os.environ,
        {
            "APPS_SCRIPT_URL": "https://script.google.com/macros/s/prueba/exec",
            "APPS_SCRIPT_SECRET": "secreto-de-prueba",
        },
        clear=False,
    )
    @patch("app.services.auth_service.requests.post")
    def test_apps_script_recibe_correo_y_secreto_desde_backend(self, post_mock):
        respuesta = Mock(status_code=200)
        respuesta.json.return_value = {"estado": "ok"}
        post_mock.return_value = respuesta

        auth_service._enviar_codigo_por_apps_script(
            "usuario@ejemplo.com",
            "Codigo GreenUP",
            "Codigo 123456",
            "<strong>123456</strong>",
        )

        llamada = post_mock.call_args
        self.assertEqual(llamada.args[0], os.environ["APPS_SCRIPT_URL"])
        self.assertEqual(llamada.kwargs["json"]["secret"], "secreto-de-prueba")
        self.assertEqual(llamada.kwargs["json"]["to"], "usuario@ejemplo.com")
        self.assertEqual(llamada.kwargs["timeout"], 15)

    @patch.dict(
        os.environ,
        {
            "APPS_SCRIPT_URL": "https://script.google.com/macros/s/prueba/exec",
            "APPS_SCRIPT_SECRET": "secreto-de-prueba",
        },
        clear=False,
    )
    @patch("app.services.auth_service.requests.post")
    def test_apps_script_reporta_fallo_sin_marcar_correo_como_enviado(self, post_mock):
        respuesta = Mock(status_code=200)
        respuesta.json.return_value = {"estado": "error", "mensaje": "Cuota diaria agotada"}
        post_mock.return_value = respuesta

        with self.assertRaisesRegex(RuntimeError, "Cuota diaria agotada"):
            auth_service._enviar_codigo_por_apps_script(
                "usuario@ejemplo.com",
                "Codigo GreenUP",
                "Codigo 123456",
                "<strong>123456</strong>",
            )


if __name__ == "__main__":
    unittest.main()
