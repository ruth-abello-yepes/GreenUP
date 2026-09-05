/**
 * Archivo: ciudadano_reciclaje.js
 * Pantalla de registro de reciclaje del ciudadano.
 *
 * Flujo real:
 * 1. El ciudadano registra una entrega.
 * 2. El sistema la guarda como pendiente.
 * 3. La recicladora recibe una notificacion.
 * 4. Cuando la recicladora confirma o rechaza, este historial se actualiza.
 */

(() => {
  "use strict";

  const estado = {
    materiales: [],
    puntos: [],
    registros: [],
  };

  function $(selector) {
    return document.querySelector(selector);
  }

  function escapar(texto) {
    return String(texto ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function mostrarMensaje(mensaje, tipo = "info") {
    const alerta = $("#estado-reciclaje");
    if (!alerta) return;
    alerta.className = `alert alert-${tipo} mb-4`;
    alerta.textContent = mensaje;
    alerta.hidden = false;
  }

  function ocultarMensaje() {
    const alerta = $("#estado-reciclaje");
    if (!alerta) return;
    alerta.hidden = true;
    alerta.textContent = "";
  }

  function badgeEstado(estadoTexto) {
    const texto = String(estadoTexto || "").toLowerCase();
    if (texto === "confirmado") return '<span class="badge rounded-pill text-bg-success">Confirmado</span>';
    if (texto === "rechazado") return '<span class="badge rounded-pill text-bg-danger">Rechazado</span>';
    return '<span class="badge rounded-pill text-bg-warning">Pendiente</span>';
  }

  function llenarMateriales() {
    const select = $("#id_tipo_material");
    if (!select) return;
    const idPunto = Number($("#id_punto")?.value || 0);
    const punto = estado.puntos.find((item) => Number(item.id_punto) === idPunto);
    const idsAceptados = Array.isArray(punto?.materiales_ids)
      ? punto.materiales_ids.map((id) => Number(id))
      : [];
    const materialesDisponibles = idPunto && idsAceptados.length
      ? estado.materiales.filter((material) => idsAceptados.includes(Number(material.id_tipo_material)))
      : estado.materiales;

    select.innerHTML = `
      <option value="">${idPunto ? "Selecciona un material aceptado" : "Selecciona primero un punto o material"}</option>
      ${materialesDisponibles.map((material) => `
        <option value="${material.id_tipo_material}">
          ${escapar(material.nombre)}${material.unidad ? ` (${escapar(material.unidad)})` : ""}
        </option>
      `).join("")}
    `;

    if (idPunto && !materialesDisponibles.length) {
      select.innerHTML = '<option value="">Este punto todavía no tiene materiales aceptados</option>';
    }
  }

  function llenarPuntos() {
    const select = $("#id_punto");
    const resumen = $("#puntos-disponibles");
    if (select) {
      select.innerHTML = `
        <option value="">Selecciona un punto ecológico</option>
        ${estado.puntos.map((punto) => `
          <option value="${punto.id_punto}">
            ${escapar(punto.nombre)} - ${escapar(punto.direccion)}
          </option>
        `).join("")}
      `;
    }
    if (resumen) {
      resumen.textContent = estado.puntos.length === 1
        ? "1 punto ecológico disponible"
        : `${estado.puntos.length} puntos ecológicos disponibles`;
    }
  }

  function renderHistorial() {
    const cuerpo = $("#tabla-reciclaje");
    const resumenPendientes = $("#resumen-pendientes");
    const resumenConfirmados = $("#resumen-confirmados");
    if (!cuerpo) return;

    const pendientes = estado.registros.filter((item) => String(item.estado || "").toLowerCase() === "pendiente").length;
    const confirmados = estado.registros.filter((item) => String(item.estado || "").toLowerCase() === "confirmado").length;

    if (resumenPendientes) resumenPendientes.textContent = String(pendientes);
    if (resumenConfirmados) resumenConfirmados.textContent = String(confirmados);

    if (!estado.registros.length) {
      cuerpo.innerHTML = `
        <tr>
          <td colspan="6" class="historial-empty text-center py-5 text-secondary">
            <div class="d-flex flex-column align-items-center gap-2">
              <span class="material-symbols-outlined text-gu-primary fs-1">inventory_2</span>
              <strong class="text-gu-primary">Aún no tienes registros</strong>
              <span>Cuando envíes tu primera entrega aparecerá aquí.</span>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    cuerpo.innerHTML = estado.registros.map((item) => `
      <tr>
        <td>#RC-${item.id_registro}</td>
        <td>
          <strong>${escapar(item.material)}</strong>
          <div class="small text-secondary">${escapar(item.punto)}</div>
        </td>
        <td>${Number(item.cantidad || 0).toLocaleString("es-CO", { maximumFractionDigits: 2 })} kg</td>
        <td>${badgeEstado(item.estado)}</td>
        <td>${item.fecha_hora ? new Date(item.fecha_hora).toLocaleString("es-CO") : "Sin fecha"}</td>
        <td>
          <div class="small text-secondary">${escapar(item.observaciones || "Sin observaciones")}</div>
          ${item.motivo_rechazo ? `<div class="small text-danger mt-1">Motivo: ${escapar(item.motivo_rechazo)}</div>` : ""}
        </td>
      </tr>
    `).join("");
  }

  async function cargarCatalogo() {
    const respuesta = await peticionSegura("/reciclaje/catalogo", "GET");
    if (!respuesta.ok) {
      throw new Error(respuesta.datos?.mensaje || "No fue posible cargar materiales y puntos");
    }
    estado.materiales = respuesta.datos.materiales || [];
    estado.puntos = respuesta.datos.puntos || [];
    llenarMateriales();
    llenarPuntos();
  }

  async function cargarHistorial() {
    const respuesta = await peticionSegura("/reciclaje/mis-registros", "GET");
    if (!respuesta.ok) {
      throw new Error(respuesta.datos?.mensaje || "No fue posible cargar tu historial");
    }
    estado.registros = respuesta.datos || [];
    renderHistorial();
  }

  async function enviarRegistro(evento) {
    evento.preventDefault();
    ocultarMensaje();

    const boton = $("#btn-enviar-reciclaje");
    const datos = {
      id_tipo_material: Number($("#id_tipo_material")?.value || 0),
      id_punto: Number($("#id_punto")?.value || 0),
      cantidad: Number($("#cantidad")?.value || 0),
      observaciones: ($("#observaciones")?.value || "").trim(),
    };

    if (!datos.id_tipo_material || !datos.id_punto || !datos.cantidad) {
      window.greenupAlert("Debes completar material, punto ecológico y cantidad.", "Atención");
      return;
    }

    try {
      if (boton) {
        boton.disabled = true;
        boton.innerHTML = '<span class="material-symbols-outlined">sync</span> Enviando...';
      }

      const respuesta = await peticionSegura("/reciclaje", "POST", datos);
      if (!respuesta.ok) {
        throw new Error(respuesta.datos?.mensaje || "No se pudo guardar el registro");
      }

      document.getElementById("form-reciclaje")?.reset();
      ocultarMensaje();
      window.greenupAlert("Tu reciclaje quedó registrado como pendiente de confirmación.", "Registro exitoso");
      await cargarHistorial();
    } catch (error) {
      ocultarMensaje();
      window.greenupAlert(error.message || "No se pudo registrar el reciclaje.", "Error");
    } finally {
      if (boton) {
        boton.disabled = false;
        boton.innerHTML = '<span class="material-symbols-outlined">save</span> Enviar reciclaje';
      }
    }
  }

  async function iniciarPantalla() {
    const token = localStorage.getItem("token");
    const usuario = localStorage.getItem("usuario");
    if (!token || !usuario) {
      window.location.href = "../public/public_login.html";
      return;
    }

    try {
      mostrarMensaje("Cargando materiales, puntos y tu historial...", "info");
      await cargarCatalogo();
      await cargarHistorial();
      ocultarMensaje();
    } catch (error) {
      mostrarMensaje(error.message || "No se pudo cargar la pantalla de reciclaje.", "danger");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("#form-reciclaje")?.addEventListener("submit", enviarRegistro);
    $("#id_punto")?.addEventListener("change", llenarMateriales);
    iniciarPantalla();
  });
})();
