"""Registro persistente y no bloqueante de eventos de seguridad."""
import logging
from app.common.database import obtener_conexion

logger = logging.getLogger("greenup.security")


def registrar_evento(evento, request=None, id_usuario=None, detalle=None):
    ip = getattr(request, "remote_addr", None) if request else None
    agente = (getattr(request, "user_agent", None) or "")[:500] if request else None
    try:
        conexion = obtener_conexion()
        try:
            with conexion.cursor() as cursor:
                cursor.execute(
                    """INSERT INTO auditoria_seguridad (evento, id_usuario, ip, user_agent, detalle)
                       VALUES (%s, %s, %s, %s, %s)""",
                    (evento, id_usuario, ip, agente, detalle),
                )
            conexion.commit()
        finally:
            conexion.close()
    except Exception:
        # La auditoría nunca debe tumbar un login o una operación válida.
        logger.exception("security_audit_persist_failed evento=%s", evento)
