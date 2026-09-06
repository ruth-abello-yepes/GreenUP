/**
 * Consulta y presenta el historial de reciclaje del ciudadano autenticado.
 */
(() => {
  "use strict";

  const estadoPagina = {
    registros: [],
    registrosFiltrados: [],
  };

  const $ = (selector) => document.querySelector(selector);

  function escapar(texto) {
    return String(texto ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizar(texto) {
    return String(texto ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }

  function mostrarMensaje(mensaje, tipo = "info") {
    const alerta = $("#estado-historial");
    if (!alerta) return;
    alerta.className = `alert alert-${tipo} mb-4`;
    alerta.textContent = mensaje;
    alerta.hidden = false;
  }

  function ocultarMensaje() {
    const alerta = $("#estado-historial");
    if (!alerta) return;
    alerta.hidden = true;
    alerta.textContent = "";
  }

  function formatearCantidad(valor) {
    return Number(valor || 0).toLocaleString("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  function formatearFecha(valor, soloFecha = false) {
    if (!valor) return "Sin fecha";
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return "Sin fecha";
    const opciones = soloFecha
      ? { year: "numeric", month: "short", day: "numeric" }
      : { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };
    return fecha.toLocaleString("es-CO", opciones);
  }

  function obtenerEstado(registro) {
    const texto = normalizar(registro?.estado);
    if (texto.includes("confirm")) return "confirmado";
    if (texto.includes("rechaz")) return "rechazado";
    return "pendiente";
  }

  function badgeEstado(registro) {
    const estado = obtenerEstado(registro);
    const configuracion = {
      confirmado: ["text-bg-success", "check_circle", "Confirmado"],
      rechazado: ["text-bg-danger", "cancel", "Rechazado"],
      pendiente: ["text-bg-warning", "schedule", "Pendiente"],
    }[estado];
    return `<span class="badge rounded-pill ${configuracion[0]} historial-estado-badge"><span class="material-symbols-outlined">${configuracion[1]}</span>${configuracion[2]}</span>`;
  }

  function renderResumen() {
    const registros = estadoPagina.registros;
    const totalKilos = registros.reduce((suma, registro) => {
      return obtenerEstado(registro) === "confirmado" ? suma + Number(registro.cantidad || 0) : suma;
    }, 0);
    const conteos = registros.reduce((resultado, registro) => {
      resultado[obtenerEstado(registro)] += 1;
      return resultado;
    }, { confirmado: 0, pendiente: 0, rechazado: 0 });

    $("#resumen-kilos").textContent = `${formatearCantidad(totalKilos)} kg`;
    $("#resumen-total").textContent = String(registros.length);
    $("#resumen-confirmados").textContent = String(conteos.confirmado);
    $("#resumen-pendientes").textContent = String(conteos.pendiente);
    $("#resumen-rechazados").textContent = String(conteos.rechazado);
  }

  function llenarFiltroMateriales() {
    const select = $("#filtro-material");
    if (!select) return;
    const seleccion = select.value;
    const materiales = [...new Set(estadoPagina.registros
      .map((registro) => String(registro.material || "").trim())
      .filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "es"));

    select.innerHTML = `<option value="">Todos</option>${materiales.map((material) => `<option value="${escapar(material)}">${escapar(material)}</option>`).join("")}`;
    if (materiales.includes(seleccion)) select.value = seleccion;
  }

  function contenidoDetalle(registro) {
    const observaciones = String(registro.observaciones || "").trim();
    const motivo = String(registro.motivo_rechazo || "").trim();
    if (!observaciones && !motivo) return '<span class="text-secondary">Sin observaciones</span>';
    return `
      ${observaciones ? `<div>${escapar(observaciones)}</div>` : ""}
      ${motivo ? `<div class="text-danger small mt-1"><strong>Motivo:</strong> ${escapar(motivo)}</div>` : ""}
    `;
  }

  function renderTabla() {
    const cuerpo = $("#tabla-historial");
    const resumen = $("#resumen-resultados");
    if (!cuerpo || !resumen) return;
    const registros = estadoPagina.registrosFiltrados;
    const total = estadoPagina.registros.length;

    resumen.textContent = registros.length === total
      ? `${total} ${total === 1 ? "registro encontrado" : "registros encontrados"}`
      : `${registros.length} de ${total} registros`;

    if (!registros.length) {
      const tieneRegistros = total > 0;
      cuerpo.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-5">
            <div class="historial-vacio">
              <span class="material-symbols-outlined">${tieneRegistros ? "search_off" : "inventory_2"}</span>
              <strong>${tieneRegistros ? "No encontramos coincidencias" : "Aún no tienes entregas registradas"}</strong>
              <p>${tieneRegistros ? "Prueba con otros filtros o limpia la búsqueda." : "Cuando registres tu primera entrega aparecerá en esta tabla."}</p>
              ${tieneRegistros ? "" : '<a class="btn btn-success rounded-pill px-4" href="ciudadano_registrar_reciclaje.html">Registrar mi primera entrega</a>'}
            </div>
          </td>
        </tr>
      `;
      return;
    }

    cuerpo.innerHTML = registros.map((registro) => `
      <tr>
        <td><strong class="text-gu-primary">#RC-${escapar(registro.id_registro)}</strong></td>
        <td>
          <strong>${escapar(registro.material || "Material")}</strong>
          <div class="small text-secondary">${escapar(registro.punto || "Punto ecológico")}</div>
          ${registro.direccion_punto ? `<div class="small text-secondary">${escapar(registro.direccion_punto)}</div>` : ""}
        </td>
        <td class="text-nowrap"><strong>${formatearCantidad(registro.cantidad)} kg</strong></td>
        <td>${badgeEstado(registro)}</td>
        <td>${formatearFecha(registro.fecha_hora)}</td>
        <td>${registro.fecha_confirmacion ? formatearFecha(registro.fecha_confirmacion) : '<span class="text-secondary">No aplica</span>'}</td>
        <td class="historial-detalle">${contenidoDetalle(registro)}</td>
      </tr>
    `).join("");
  }

  function fechaEnRango(registro, desde, hasta) {
    if (!desde && !hasta) return true;
    const fecha = new Date(registro.fecha_hora);
    if (Number.isNaN(fecha.getTime())) return false;
    const inicio = desde ? new Date(`${desde}T00:00:00`) : null;
    const fin = hasta ? new Date(`${hasta}T23:59:59.999`) : null;
    return (!inicio || fecha >= inicio) && (!fin || fecha <= fin);
  }

  function aplicarFiltros() {
    const busqueda = normalizar($("#filtro-busqueda")?.value);
    const estado = normalizar($("#filtro-estado")?.value);
    const material = normalizar($("#filtro-material")?.value);
    const desde = $("#filtro-desde")?.value || "";
    const hasta = $("#filtro-hasta")?.value || "";

    estadoPagina.registrosFiltrados = estadoPagina.registros.filter((registro) => {
      const textoRegistro = normalizar([
        registro.id_registro,
        registro.material,
        registro.punto,
        registro.direccion_punto,
        registro.observaciones,
        registro.motivo_rechazo,
        registro.estado,
      ].join(" "));
      return (!busqueda || textoRegistro.includes(busqueda))
        && (!estado || obtenerEstado(registro) === estado)
        && (!material || normalizar(registro.material) === material)
        && fechaEnRango(registro, desde, hasta);
    });
    renderTabla();
  }

  function limpiarFiltros() {
    $("#form-filtros-historial")?.reset();
    estadoPagina.registrosFiltrados = [...estadoPagina.registros];
    renderTabla();
  }

  function valorCsv(valor) {
    const texto = String(valor ?? "").replaceAll('"', '""');
    return `"${texto}"`;
  }

  function descargarCsv() {
    const registros = estadoPagina.registrosFiltrados;
    if (!registros.length) {
      window.greenupAlert("No hay registros disponibles con los filtros actuales.", "Atención");
      return;
    }

    const encabezados = ["Registro", "Material", "Punto ecológico", "Dirección", "Cantidad kg", "Estado", "Fecha de registro", "Fecha de confirmación", "Observaciones", "Motivo de rechazo"];
    const filas = registros.map((registro) => [
      `RC-${registro.id_registro}`,
      registro.material,
      registro.punto,
      registro.direccion_punto,
      registro.cantidad,
      obtenerEstado(registro),
      formatearFecha(registro.fecha_hora),
      registro.fecha_confirmacion ? formatearFecha(registro.fecha_confirmacion) : "",
      registro.observaciones,
      registro.motivo_rechazo,
    ]);
    const contenido = [encabezados, ...filas].map((fila) => fila.map(valorCsv).join(";")).join("\r\n");
    const archivo = new Blob(["\uFEFF", contenido], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `historial_reciclaje_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
    mostrarMensaje("El historial visible se descargó correctamente.", "success");
  }

  async function cargarHistorial() {
    const boton = $("#btn-actualizar-historial");
    try {
      if (boton) boton.disabled = true;
      mostrarMensaje("Actualizando tu historial de reciclaje...", "info");
      const respuesta = await peticionSegura("/reciclaje/mis-registros", "GET");
      if (!respuesta.ok) {
        throw new Error(respuesta.datos?.mensaje || "No fue posible consultar el historial");
      }
      estadoPagina.registros = Array.isArray(respuesta.datos) ? respuesta.datos : [];
      estadoPagina.registrosFiltrados = [...estadoPagina.registros];
      renderResumen();
      llenarFiltroMateriales();
      aplicarFiltros();
      ocultarMensaje();
    } catch (error) {
      estadoPagina.registros = [];
      estadoPagina.registrosFiltrados = [];
      renderResumen();
      renderTabla();
      mostrarMensaje(error.message || "No se pudo cargar el historial.", "danger");
    } finally {
      if (boton) boton.disabled = false;
    }
  }

  function iniciarEventos() {
    $("#filtro-busqueda")?.addEventListener("input", aplicarFiltros);
    $("#filtro-estado")?.addEventListener("change", aplicarFiltros);
    $("#filtro-material")?.addEventListener("change", aplicarFiltros);
    $("#filtro-desde")?.addEventListener("change", aplicarFiltros);
    $("#filtro-hasta")?.addEventListener("change", aplicarFiltros);
    $("#btn-limpiar-filtros")?.addEventListener("click", limpiarFiltros);
    $("#btn-actualizar-historial")?.addEventListener("click", cargarHistorial);
    $("#btn-descargar-historial")?.addEventListener("click", descargarCsv);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const usuario = localStorage.getItem("usuario");
    if (!token || !usuario) {
      window.location.href = "../public/public_login.html";
      return;
    }
    iniciarEventos();
    cargarHistorial();
  });
})();
