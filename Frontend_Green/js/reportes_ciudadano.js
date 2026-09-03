// La vista y el archivo se preparan juntos; compartir usa el archivo ya listo.
(() => {
  document.addEventListener("DOMContentLoaded", () => {
    const $ = (id) => document.getElementById(id);
    const elemento = $("modal-reporte");
    if (!elemento) return;
    const modal = bootstrap.Modal.getOrCreateInstance(elemento);
    const numero = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });
    let solicitud, archivo, datos, pagina = 0, tokenReporte;
    const tamanoPagina = 20;

    function mensaje(texto, error = false) {
      $("reporte-mensaje").textContent = texto;
      $("reporte-mensaje").className = error ? "alert alert-danger" : "text-secondary";
    }

    function limpiar() {
      solicitud?.abort();
      solicitud = null;
      archivo = datos = tokenReporte = null;
      $("reporte-descargar").disabled = $("reporte-compartir").disabled = true;
      $("reporte-vista").hidden = true;
      $("reporte-filas").replaceChildren();
    }

    function pintarFilas() {
      const filas = datos.registros.slice(pagina * tamanoPagina, (pagina + 1) * tamanoPagina);
      const fragmento = document.createDocumentFragment();
      filas.forEach((fila) => {
        const tr = document.createElement("tr");
        [fila.fecha, fila.material, numero.format(fila.cantidad), fila.punto, fila.estado].forEach((valor) => {
          const td = document.createElement("td");
          td.textContent = valor;
          tr.appendChild(td);
        });
        fragmento.appendChild(tr);
      });
      if (!filas.length) {
        const tr = document.createElement("tr"), td = document.createElement("td");
        td.colSpan = 5;
        td.textContent = "No hay registros en este período.";
        tr.appendChild(td);
        fragmento.appendChild(tr);
      }
      $("reporte-filas").replaceChildren(fragmento);
      const paginas = Math.max(1, Math.ceil(datos.registros.length / tamanoPagina));
      $("reporte-pagina").textContent = `Página ${pagina + 1} de ${paginas}`;
      $("reporte-anterior").disabled = pagina === 0;
      $("reporte-siguiente").disabled = pagina + 1 >= paginas;
    }

    function pintarBarras(id, items, campo, unidad) {
      const contenedor = $(id);
      contenedor.replaceChildren();
      const maximo = Math.max(1, ...items.map((item) => item.cantidad));
      if (!items.length) contenedor.textContent = "Sin entregas confirmadas en este período.";
      items.forEach((item) => {
        const fila = document.createElement("div"), etiqueta = document.createElement("div");
        fila.className = "reporte-barra";
        const nombre = document.createElement("span"), valor = document.createElement("strong");
        nombre.textContent = item[campo];
        valor.textContent = `${numero.format(item.cantidad)}${unidad}`;
        etiqueta.append(nombre, valor);
        const barra = document.createElement("progress");
        barra.max = maximo;
        barra.value = item.cantidad;
        barra.setAttribute("aria-label", `${item[campo]}: ${valor.textContent}`);
        fila.append(etiqueta, barra);
        contenedor.appendChild(fila);
      });
    }

    $("filtros-reporte").addEventListener("submit", async (evento) => {
      evento.preventDefault();
      limpiar();
      const tipo = evento.submitter?.dataset.reporteFormato || "pdf";
      $("reporte-titulo").textContent = `Exportar reporte a ${tipo === "pdf" ? "PDF" : "Excel"}`;
      $("reporte-descargar").textContent = `Descargar ${tipo === "pdf" ? "PDF" : "Excel"}`;
      $("reporte-compartir").textContent = `Compartir ${tipo === "pdf" ? "PDF" : "Excel"}`;
      modal.show();
      const desde = $("reporte-desde").value, hasta = $("reporte-hasta").value;
      if (desde && hasta && desde > hasta) {
        mensaje("La fecha inicial no puede ser mayor que la fecha final.", true);
        return;
      }
      tokenReporte = localStorage.getItem("token");
      if (!tokenReporte) {
        mensaje("Inicia sesión nuevamente para preparar tu reporte.", true);
        return;
      }
      const control = new AbortController();
      solicitud = control;
      const limite = setTimeout(() => control.abort(), 60000);
      mensaje("Preparando tu vista previa y el archivo…");
      const parametros = new URLSearchParams({ formato: "vista", tipo });
      if (desde) parametros.set("fecha_inicio", desde);
      if (hasta) parametros.set("fecha_fin", hasta);
      try {
        const respuesta = await fetch(`${API_URL}/api/reportes/ciudadano?${parametros}`, {
          headers: { Authorization: `Bearer ${tokenReporte}` }, cache: "no-store", signal: control.signal,
        });
        if (respuesta.status === 401) throw new Error("Tu sesión expiró. Inicia sesión nuevamente para exportar.");
        if (!respuesta.ok) {
          const error = await respuesta.json().catch(() => ({}));
          throw new Error(error.mensaje || "No se pudo preparar el reporte. Intenta nuevamente.");
        }
        const reporte = await respuesta.json();
        if (solicitud !== control) return;
        if (localStorage.getItem("token") !== tokenReporte) throw new Error("La sesión cambió. Vuelve a abrir el reporte.");
        const bytes = Uint8Array.from(atob(reporte.archivo.base64), (letra) => letra.charCodeAt(0));
        archivo = new File([bytes], reporte.archivo.nombre, { type: reporte.archivo.tipo });
        delete reporte.archivo;
        datos = reporte;
        pagina = 0;
        $("reporte-periodo").textContent = reporte.periodo;
        $("reporte-registros").textContent = numero.format(reporte.total_registros);
        $("reporte-kilos").textContent = `${numero.format(reporte.kg_confirmados)} kg`;
        pintarBarras("reporte-materiales", reporte.materiales, "material", " kg");
        pintarBarras("reporte-estados", reporte.estados, "estado", "");
        pintarFilas();
        $("reporte-vista").hidden = false;
        $("reporte-descargar").disabled = $("reporte-compartir").disabled = false;
        mensaje("Reporte listo. Revisa los datos antes de descargar o compartir.");
      } catch (error) {
        if (solicitud !== control) return;
        archivo = null;
        mensaje(error.name === "AbortError" ? "La preparación tardó demasiado. Cierra esta ventana e intenta nuevamente." : error.message, true);
      } finally {
        clearTimeout(limite);
      }
    });

    function sesionVigente() {
      if (archivo && localStorage.getItem("token") === tokenReporte) return true;
      limpiar();
      mensaje("La sesión cambió. Vuelve a abrir el reporte.", true);
      return false;
    }

    function descargar() {
      if (!sesionVigente()) return;
      const url = URL.createObjectURL(archivo), enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = archivo.name;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    }
    $("reporte-descargar").addEventListener("click", descargar);
    $("reporte-compartir").addEventListener("click", async () => {
      if (!sesionVigente()) return;
      if (!navigator.share || !navigator.canShare?.({ files: [archivo] })) {
        descargar();
        mensaje("Este navegador no permite compartir este archivo directamente. Se descargó para que puedas adjuntarlo desde tu aplicación de correo o mensajería.");
        return;
      }
      try {
        await navigator.share({ files: [archivo], title: "Mi reporte GreenUp" });
      } catch (error) {
        if (error.name !== "AbortError") mensaje("No se pudo abrir el menú para compartir. Usa Descargar y adjunta el archivo desde tu aplicación.", true);
      }
    });
    $("reporte-anterior").addEventListener("click", () => { if (datos && pagina > 0) { pagina--; pintarFilas(); } });
    $("reporte-siguiente").addEventListener("click", () => { if (datos && (pagina + 1) * tamanoPagina < datos.registros.length) { pagina++; pintarFilas(); } });
    elemento.addEventListener("show.bs.modal", () => document.body.classList.add("reporte-abierto"));
    elemento.addEventListener("hidden.bs.modal", () => {
      document.body.classList.remove("reporte-abierto");
      limpiar();
    });
    window.addEventListener("storage", (evento) => { if (evento.key === "token" || evento.key === "usuario" || evento.key === null) limpiar(); });
  });
})();
