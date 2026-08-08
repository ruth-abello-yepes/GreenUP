/**
 * Mapa Eco reutilizable.
 * En ciudadano/publico carga puntos desde /ubicaciones.
 * En dueno de recicladora muestra solo la recicladora autenticada.
 */

(function () {
  const API_BASE = typeof API_URL !== "undefined" ? API_URL : "http://127.0.0.1:5000";
  const DEFAULT_CENTER = [10.4631, -73.2532];

  let map = null;
  let controlRutaActual = null;
  let userLocation = null;
  let userMarker = null;
  let initialized = false;
  let ownerMode = false;
  let ownerPoint = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizePoint(point, index) {
    const lat = Number.parseFloat(point.latitud);
    const lng = Number.parseFloat(point.longitud);
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

    return {
      id: point.id_punto || point.id || index + 1,
      pos: hasCoords ? [lat, lng] : [DEFAULT_CENTER[0] + index * 0.006, DEFAULT_CENTER[1] - index * 0.004],
      title: point.nombre || point.title || "Punto de reciclaje",
      address: point.direccion || point.address || "Direccion por confirmar",
      type: point.tipo || point.type || "Materiales reciclables",
      schedule: point.horario || "Horario por confirmar",
      owner: point.responsable || "Responsable por confirmar",
      phone: point.telefono || "Telefono por confirmar",
      color: point.id_estado === 2 ? "#6b7280" : index % 2 ? "#296c1f" : "#003d6c",
      icon: point.id_estado === 2 ? "location_off" : "recycling",
    };
  }

  async function loadPoints() {
    if (ownerMode) {
      return loadOwnRecyclingCenter();
    }

    try {
      const response = await fetch(`${API_BASE}/ubicaciones`);
      if (!response.ok) throw new Error("No se pudieron cargar los puntos");
      const data = await response.json();
      return (Array.isArray(data) ? data : []).map(normalizePoint);
    } catch (error) {
      console.warn("No se pudieron cargar puntos reales:", error);
      return [];
    }
  }

  function getSessionHeaders() {
    try {
      const user = JSON.parse(localStorage.getItem("usuario") || "{}");
      return {
        "Content-Type": "application/json",
        ...(user.id_usuario ? { id_usuario: user.id_usuario, "id-usuario": user.id_usuario } : {}),
        ...(user.id_rol ? { id_rol: user.id_rol, "id-rol": user.id_rol } : {}),
      };
    } catch {
      return { "Content-Type": "application/json" };
    }
  }

  async function loadOwnRecyclingCenter() {
    try {
      const response = await fetch(`${API_BASE}/api/recicladoras/perfil`, {
        headers: getSessionHeaders(),
      });
      if (!response.ok) throw new Error("No se pudo cargar la recicladora autenticada");

      const profile = await response.json();
      const point = normalizePoint({
        id: profile.id_recicladora,
        nombre: profile.nombre_empresa,
        direccion: profile.direccion_empresa,
        telefono: profile.telefono_empresa,
        responsable: `${profile.nombres || ""} ${profile.apellidos || ""}`.trim(),
        latitud: profile.latitud,
        longitud: profile.longitud,
        id_estado: profile.id_estado_recicladora,
        tipo: "Mi punto ecologico",
      }, 0);
      ownerPoint = point;
      return [point];
    } catch (error) {
      console.warn("No se pudo cargar el punto de esta recicladora:", error);
      return [];
    }
  }

  function initGeolocation() {
    if (!("geolocation" in navigator)) {
      userLocation = DEFAULT_CENTER;
      map.setView(DEFAULT_CENTER, 14);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation = [position.coords.latitude, position.coords.longitude];
        map.setView(userLocation, 15, { animate: true });

        const userIcon = L.divIcon({
          className: "custom-user-icon",
          html: '<div style="background-color:#007bff;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(0,0,0,0.35);"></div>',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

        userMarker = L.marker(userLocation, { icon: userIcon })
          .addTo(map)
          .bindPopup("<strong>Tu estas aqui</strong>");
      },
      () => {
        userLocation = DEFAULT_CENTER;
        map.setView(DEFAULT_CENTER, 14, { animate: true });
      },
      { enableHighAccuracy: true }
    );
  }

  function renderPoint(point, sidebarList) {
    const marker = L.circleMarker(point.pos, {
      radius: 10,
      fillColor: point.color,
      color: "#fff",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9,
    }).addTo(map);

    marker.bindPopup(`
      <div class="greenup-map-popup">
        <h6 style="color:${point.color};">${escapeHtml(point.title)}</h6>
        <p>${escapeHtml(point.address)}</p>
        <p><strong>Horario:</strong> ${escapeHtml(point.schedule)}</p>
        <p><strong>Responsable:</strong> ${escapeHtml(point.owner)}</p>
        ${ownerMode ? "" : `
          <button onclick="trazarRuta(${point.pos[0]}, ${point.pos[1]})" style="background:${point.color};">
            Como llegar
          </button>
        `}
      </div>
    `);

    if (!sidebarList) return;

    const item = document.createElement("button");
    item.type = "button";
    item.className = "gu-sidebar-item";
    item.innerHTML = `
      <span class="type-icon" style="color:${point.color};background-color:${point.color}15">
        <span class="material-symbols-outlined">${point.icon}</span>
      </span>
      <span>
        <strong>${escapeHtml(point.title)}</strong>
        <small>${escapeHtml(point.address)}</small>
      </span>
    `;

    item.addEventListener("click", () => {
      map.setView(point.pos, 16, { animate: true });
      setTimeout(() => marker.openPopup(), 350);
      if (window.innerWidth < 768) window.toggleSidebar();
    });

    sidebarList.appendChild(item);
  }

  window.centerMap = function () {
    if (ownerMode && ownerPoint && map) {
      map.setView(ownerPoint.pos, 16, { animate: true });
      return;
    }

    if (userLocation && map) {
      map.setView(userLocation, 15, { animate: true });
      if (userMarker) userMarker.openPopup();
    }
  };

  window.greenupMapZoomIn = function () {
    if (map) map.zoomIn();
  };

  window.greenupMapZoomOut = function () {
    if (map) map.zoomOut();
  };

  window.trazarRuta = function (destinoLat, destinoLng) {
    if (!userLocation) {
      alert("Estamos obteniendo tu ubicacion, intenta de nuevo en unos segundos.");
      return;
    }

    if (!L.Routing) {
      map.setView([destinoLat, destinoLng], 16, { animate: true });
      return;
    }

    if (controlRutaActual !== null) {
      map.removeControl(controlRutaActual);
    }

    controlRutaActual = L.Routing.control({
      waypoints: [
        L.latLng(userLocation[0], userLocation[1]),
        L.latLng(destinoLat, destinoLng),
      ],
      show: false,
      addWaypoints: false,
      routeWhileDragging: false,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [{ color: "#296c1f", opacity: 0.82, weight: 6 }],
      },
    }).addTo(map);

    if (window.innerWidth < 768) {
      document.getElementById("sidebar-panel")?.classList.add("collapsed");
    }
  };

  window.toggleSidebar = function () {
    const sidebar = document.getElementById("sidebar-panel");
    if (!sidebar) return;
    sidebar.classList.toggle("collapsed");
    setTimeout(() => map?.invalidateSize(), 300);
  };

  window.initGreenupMap = async function (options = {}) {
    const mapElement = document.getElementById("eco-map");
    if (!mapElement || typeof L === "undefined" || initialized) return;

    initialized = true;
    ownerMode = options.scope === "recicladora" || options.onlyOwnRecyclingCenter === true;
    map = L.map(mapElement, { zoomControl: false, attributionControl: false });
    window.greenupMap = map;
    window.map = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    map.setView(DEFAULT_CENTER, 14);
    if (!ownerMode) {
      initGeolocation();
    }

    const sidebarList = document.getElementById("recycling-list");
    if (sidebarList) sidebarList.innerHTML = "";

    const points = await loadPoints();
    points.forEach((point) => renderPoint(point, sidebarList));

    if (points.length) {
      const bounds = L.latLngBounds(points.map((point) => point.pos));
      if (ownerMode && points.length === 1) {
        map.setView(points[0].pos, 16, { animate: true });
      } else {
        map.fitBounds(bounds.pad(0.2));
      }
    } else if (sidebarList) {
      sidebarList.innerHTML = `
        <div class="map-empty-state">
          <span class="material-symbols-outlined">location_off</span>
          <strong>${ownerMode ? "Sin recicladora asociada" : "Sin puntos registrados"}</strong>
          <small>${ownerMode ? "No encontramos datos de la recicladora autenticada." : "Cuando existan puntos en la base de datos apareceran aqui."}</small>
        </div>
      `;
    }

    if (window.innerWidth < 768) {
      document.getElementById("sidebar-panel")?.classList.add("collapsed");
    }

    window.addEventListener("resize", () => map.invalidateSize());
  };

  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("eco-map") && typeof L !== "undefined") {
      window.initGreenupMap();
    }
  });
})();
