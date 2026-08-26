/**
 * Mapa Eco reutilizable.
 * En ciudadano/publico carga puntos desde /ubicaciones.
 * En dueno de recicladora muestra solo la recicladora autenticada.
 */

(function () {
  const API_BASE = typeof API_URL !== "undefined" ? API_URL : "https://greenup-hoxj.onrender.com";
  const DEFAULT_CENTER = [10.4631, -73.2532];
  const DEFAULT_CITY = "Valledupar, Cesar, Colombia";

  let map = null;
  let controlRutaActual = null;
  let capasRutasActuales = [];
  let userLocation = null;
  let userMarker = null;
  let initialized = false;
  let ownerMode = false;
  let publicPreview = false;
  let ownerPoint = null;
  let allPoints = [];
  let markersLayer = null;
  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizeMaterials(value) {
    if (Array.isArray(value)) {
      const names = value
        .map((material) => material?.nombre || material?.name || material)
        .filter(Boolean);
      return names.length ? names.join(", ") : "Materiales por confirmar";
    }

    return value || "Materiales por confirmar";
  }

  function summarizeMaterials(value, limit = 3) {
    const materials = normalizeMaterials(value);
    if (materials === "Materiales por confirmar") return materials;

    const names = materials
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);

    if (names.length <= limit) return names.join(", ");
    return `${names.slice(0, limit).join(", ")} y otros`;
  }

  function normalizePoint(point, index) {
    const lat = Number.parseFloat(point.latitud);
    const lng = Number.parseFloat(point.longitud);
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
    const statusId = point.id_estado ?? point.id_estado_punto ?? point.id_estado_recicladora;
    const inactive = Number(statusId) === 2;
    const materials = normalizeMaterials(
      point.materiales_aceptados || point.materiales || point.tipos_material || point.tipo
    );

    return {
      id: point.id_punto || point.id || index + 1,
      pos: hasCoords ? [lat, lng] : [DEFAULT_CENTER[0] + index * 0.006, DEFAULT_CENTER[1] - index * 0.004],
      title: point.nombre || point.title || "Punto de reciclaje",
      address: point.direccion || point.address || "Direccion por confirmar",
      type: materials,
      materialsPreview: summarizeMaterials(materials),
      schedule: point.horario || point.horario_recicladora || point.horario_punto || "Horario por confirmar",
      owner: point.responsable || "Responsable por confirmar",
      phone: point.telefono || "Telefono por confirmar",
      email: point.correo || point.email || point.correo_empresa || "Correo no registrado",
      hasCoords,
      inactive,
      color: inactive ? "#6b7280" : "#296c1f",
      icon: inactive ? "location_off" : "recycling",
    };
  }
  function buildGeocodeQuery(address) {
    if (/valledupar|cesar|colombia/i.test(address)) return address;
    return `${address}, ${DEFAULT_CITY}`;
  }

  async function geocodeAddress(address) {
    if (!address || address === "Direccion por confirmar") return null;

    const cacheKey = `greenup_geocode_arcgis_${address.toLowerCase().trim()}`;
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
      if (Array.isArray(cached) && cached.length === 2) return cached;
    } catch {
      // ignore cache read errors
    }

    const fetchCoords = async (queryStr) => {
        try {
            const query = encodeURIComponent(buildGeocodeQuery(queryStr));
            const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&maxLocations=1&singleLine=${query}`;
            const response = await fetch(url);
            
            if (!response.ok) return null;
            const data = await response.json();
            
            if (data.candidates && data.candidates.length > 0) {
                const best = data.candidates[0];
                // Permitir puntajes medios ya que las direcciones colombianas pueden ser ambiguas
                if (best.score > 60) {
                    const lat = best.location.y;
                    const lng = best.location.x;
                    if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
                }
            }
        } catch (error) {
            console.warn("Error geocoding con ArcGIS:", error);
        }
        return null;
    };

    let coords = await fetchCoords(address);
    
    // Fallback 1: Limpiar caracteres conflictivos (#, -)
    if (!coords) {
        let cleanAddress = address.replace(/#/g, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleanAddress !== address) {
            coords = await fetchCoords(cleanAddress);
        }
    }

    // Fallback 2: Buscar solo por la calle principal
    if (!coords) {
        let streetOnly = address.split(/#|No|Nro|\d+-/i)[0].trim();
        if (streetOnly && streetOnly !== address) {
            coords = await fetchCoords(streetOnly);
        }
    }

    if (coords) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(coords));
      } catch {
        // cache no obligatorio
      }
      return coords;
    }

    return null;
  }

  async function resolveRegisteredLocations(points) {
    return Promise.all(points.map(async (point) => {
      if (point.hasCoords) return point;

      const coords = await geocodeAddress(point.address);
      if (!coords) return point;

      return {
        ...point,
        pos: coords,
        hasCoords: true,
      };
    }));
  }
  async function loadPoints() {
    if (ownerMode) {
      return loadOwnRecyclingCenter();
    }

    try {
      const response = await fetch(`${API_BASE}/ubicaciones`);
      let data = [];
      if (response.ok) {
          data = await response.json();
          if (!Array.isArray(data)) data = [];
      }
      
      // Injecting the points from the user's screenshots
      const mockPoints = [
        {
          id: 'mock-vendicion',
          nombre: 'Recicladora la vendicion',
          direccion: 'Cl. 5 #44-56, Valledupar, Cesar',
          telefono: 'Teléfono no registrado',
          materiales_aceptados: ['Cartón', 'Plástico', 'Vidrio'],
          horario: 'Lunes a Sábado - 8:00 AM a 5:00 PM',
          // Approximate coordinates in Valledupar
          latitud: 10.4685, 
          longitud: -73.2450,
          id_estado: 1
        },
        {
          id: 'mock-servicios',
          nombre: 'Reciclar todo servicios s.a.s',
          direccion: 'Cra. 23 #41a- 03, la loma cesar, Valledupar, Cesar',
          telefono: '317 4360912',
          materiales_aceptados: ['Metal', 'Electrónicos', 'Papel', 'Cartón'],
          horario: 'Lunes a Viernes - 7:00 AM a 6:00 PM',
          latitud: 10.4550,
          longitud: -73.2510,
          id_estado: 1
        },
        {
          id: 'mock-coorrenacer',
          nombre: 'Coorrenacer',
          direccion: 'Carrera 15 #22-40, 12 de Octubre, Valledupar, Cesar',
          telefono: '55700564',
          materiales_aceptados: ['Plástico', 'Papel', 'Cartón', 'Vidrio'],
          horario: 'Lunes a Sábado - 8:00 AM a 6:00 PM',
          latitud: 10.4701,
          longitud: -73.2505,
          id_estado: 1
        },
        {
          id: 'mock-soldadura',
          nombre: 'Recicladora y Soldadura',
          direccion: 'Cl. 17 #463, Valledupar, Cesar',
          telefono: '317 8283283',
          materiales_aceptados: ['Metal', 'Chatarra', 'Aluminio'],
          horario: 'Lunes a Viernes - 7:00 AM a 5:30 PM',
          latitud: 10.4655,
          longitud: -73.2600,
          id_estado: 1
        }
      ];
      
      // Combine API data with mock points
      data = [...mockPoints, ...data];

      const points = data.map(normalizePoint);
      return resolveRegisteredLocations(points);
    } catch (error) {
      console.warn("No se pudieron cargar puntos reales:", error);
      return [];
    }
  }

  function getSessionHeaders() {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async function loadOwnRecyclingCenter() {
    try {
      const headers = getSessionHeaders();
      const [response, materialsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/recicladoras/perfil`, { headers }),
        fetch(`${API_BASE}/api/recicladoras/materiales`, { headers }).catch(() => null),
      ]);
      if (!response.ok) throw new Error("No se pudo cargar la recicladora autenticada");

      const profile = await response.json();
      let acceptedMaterials = [];
      if (materialsResponse?.ok) {
        const materialsData = await materialsResponse.json();
        acceptedMaterials = (Array.isArray(materialsData) ? materialsData : [])
          .filter((material) => material.aceptado)
          .map((material) => material.nombre);
      }

      const point = normalizePoint({
        id: profile.id_punto || profile.id_recicladora,
        nombre: profile.nombre_punto || profile.nombre_empresa,
        direccion: profile.direccion_punto || profile.direccion_empresa,
        telefono: profile.telefono_punto || profile.telefono_empresa,
        correo: profile.correo,
        horario: profile.horario_recicladora || profile.horario,
        responsable: `${profile.nombres || ""} ${profile.apellidos || ""}`.trim(),
        latitud: profile.latitud,
        longitud: profile.longitud,
        id_estado: profile.id_estado_punto || profile.id_estado_recicladora,
        materiales: acceptedMaterials,
      }, 0);
      const [resolvedPoint] = await resolveRegisteredLocations([point]);
      ownerPoint = resolvedPoint;
      return [resolvedPoint];
    } catch (error) {
      console.warn("No se pudo cargar el punto de esta recicladora:", error);
      return [];
    }
  }
  function updateUserMarker(centerOnUser = true) {
    if (!map || !userLocation) return;

    if (centerOnUser) {
      map.setView(userLocation, 15, { animate: true });
    }

    if (userMarker) {
      userMarker.setLatLng(userLocation);
    } else {
      const userIcon = L.divIcon({
        className: "custom-user-icon",
        html: '<div style="background-color:#007bff;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(0,0,0,0.35);"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      userMarker = L.marker(userLocation, { icon: userIcon })
        .addTo(map)
        .bindPopup("<strong>Tu estas aqui</strong>");
    }
  }

  function requestCurrentLocation(centerOnUser = true) {
    return new Promise((resolve) => {
      if (!("geolocation" in navigator)) {
        if (!ownerMode) {
          userLocation = DEFAULT_CENTER;
          updateUserMarker(centerOnUser);
        }
        resolve(Boolean(userLocation));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          userLocation = [position.coords.latitude, position.coords.longitude];
          updateUserMarker(centerOnUser);
          resolve(true);
        },
        () => {
          if (!ownerMode) {
            userLocation = DEFAULT_CENTER;
            updateUserMarker(centerOnUser);
          }
          resolve(Boolean(userLocation));
        },
        { enableHighAccuracy: true }
      );
    });
  }

  function initGeolocation(centerOnUser = true) {
    requestCurrentLocation(centerOnUser);
  }
  function renderInfoRows(point) {
    const rows = [
      ["location_on", point.address],
      ["schedule", point.schedule],
      ["delete", point.materialsPreview],
      ["call", point.phone],
    ];

    return rows.map(([icon, value]) => `
      <div class="point-info-row">
        <span class="material-symbols-outlined">${icon}</span>
        <p><small>${escapeHtml(value)}</small></p>
      </div>
    `).join("");
  }

  function createRecyclingMarkerIcon(point) {
    const borderColor = point.inactive ? "#68717b" : "#2e8b3c";
    const iconColor = point.inactive ? "#68717b" : "#2e8b3c";
    const bgColor = point.inactive ? "#f1f3f5" : "#f4fff4";

    return L.divIcon({
      className: "greenup-recycling-marker",
      html: `
        <div style="
          width:34px;height:34px;display:grid;place-items:center;
          border:2px solid ${borderColor};border-radius:999px;
          background:${bgColor};color:${iconColor};
          box-shadow:0 8px 18px rgba(15,23,42,.18);
        ">
          <span class="material-symbols-outlined" style="font-size:20px;line-height:1;">${point.icon}</span>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -17],
    });
  }

  function renderPoint(point, sidebarList) {
    const marker = L.marker(point.pos, {
      icon: createRecyclingMarkerIcon(point),
      title: point.title,
    });
    
    if (markersLayer) {
        marker.addTo(markersLayer);
    } else {
        marker.addTo(map);
    }

    if (publicPreview) {
      marker.bindPopup(`
        <div class="greenup-map-popup greenup-public-point-name">
          <h6 style="color:${point.color};">${escapeHtml(point.title)}</h6>
        </div>
      `, {
        maxWidth: 240,
        minWidth: 150,
        className: "greenup-public-popup",
      });
    } else {
      marker.bindPopup(`
        <div class="greenup-map-popup">
          <h6 style="color:${point.color};">${escapeHtml(point.title)}</h6>
          <div class="point-info-list">${renderInfoRows(point)}</div>
          <button onclick="${ownerMode ? "mostrarRutaMiRecicladora()" : `trazarRuta(${point.pos[0]}, ${point.pos[1]})`}" style="background:${point.color};">Como llegar</button>
        </div>
      `, {
        maxWidth: 320,
        minWidth: 250,
      });
    }

    if (!sidebarList) return;

    const item = document.createElement("button");
    item.type = "button";
    item.className = "gu-sidebar-item";
    item.innerHTML = `
      <span class="type-icon map-point-icon ${point.inactive ? "gray" : ""}">
        <span class="material-symbols-outlined">${point.icon}</span>
      </span>
      <span class="point-card-copy">
        <strong>${escapeHtml(point.title)}</strong>
        <small>${escapeHtml(point.address)}</small>
        <span class="gu-sidebar-meta">
          <span><span class="material-symbols-outlined">schedule</span>${escapeHtml(point.schedule)}</span>
          <span><span class="material-symbols-outlined">delete</span>${escapeHtml(point.materialsPreview)}</span>
          <span><span class="material-symbols-outlined">call</span>${escapeHtml(point.phone)}</span>
        </span>
      </span>
    `;

    item.addEventListener("click", () => {
      map.setView(point.pos, 16, { animate: true });
      setTimeout(() => marker.openPopup(), 350);
      if (window.innerWidth < 768) window.toggleSidebar();
    });

    sidebarList.appendChild(item);
  }
  window.centerMap = async function () {
    if (userLocation && map) {
      map.setView(userLocation, 15, { animate: true });
      if (userMarker) userMarker.openPopup();
      return;
    }

    const located = await requestCurrentLocation(true);
    if (located && userMarker) {
      userMarker.openPopup();
      return;
    }

    alert("No pudimos obtener tu ubicacion actual. Revisa los permisos de ubicacion del navegador.");
  };

  window.centerOwnRecyclingPoint = function () {
    if (ownerMode && ownerPoint && map) {
      map.setView(ownerPoint.pos, 16, { animate: true });
      return;
    }

    window.centerMap();
  };

  window.greenupMapZoomIn = function () {
    if (map) map.zoomIn();
  };

  window.greenupMapZoomOut = function () {
    if (map) map.zoomOut();
  };
  function limpiarCapasRutas() {
    capasRutasActuales.forEach((layer) => map?.removeLayer(layer));
    capasRutasActuales = [];
  }

  function pintarRutasAlternativas(event) {
    limpiarCapasRutas();
    const colors = ["#296c1f", "#065591", "#d18b00", "#7c3aed"];
    const routes = (event.routes || []).slice(0, 4);

    routes.forEach((route, index) => {
      const coordinates = route.coordinates || [];
      if (!coordinates.length) return;

      const layer = L.polyline(coordinates, {
        color: colors[index % colors.length],
        weight: index === 0 ? 7 : 5,
        opacity: index === 0 ? 0.9 : 0.7,
        dashArray: index === 0 ? null : "10 8",
      }).addTo(map);
      capasRutasActuales.push(layer);
    });
  }

  window.trazarRuta = async function (destinoLat, destinoLng, options = {}) {
    if (!userLocation) {
      const located = await requestCurrentLocation(false);
      if (!located) {
        alert("No pudimos obtener tu ubicacion actual. Activa los permisos de ubicacion para calcular la ruta.");
        return;
      }
    }

    if (!L.Routing) {
      map.setView([destinoLat, destinoLng], 16, { animate: true });
      return;
    }

    if (controlRutaActual !== null) {
      map.removeControl(controlRutaActual);
    }
    limpiarCapasRutas();

    controlRutaActual = L.Routing.control({
      waypoints: [
        L.latLng(userLocation[0], userLocation[1]),
        L.latLng(destinoLat, destinoLng),
      ],
      show: false,
      addWaypoints: false,
      routeWhileDragging: false,
      fitSelectedRoutes: true,
      showAlternatives: true,
      lineOptions: {
        styles: [{ color: "transparent", opacity: 0, weight: 0 }],
      },
      altLineOptions: {
        styles: [{ color: "transparent", opacity: 0, weight: 0 }],
      },
    }).addTo(map);
    controlRutaActual.on("routesfound", pintarRutasAlternativas);

    if (window.innerWidth < 768) {
      document.getElementById("sidebar-panel")?.classList.add("collapsed");
    }
  };

  window.mostrarRutaMiRecicladora = async function () {
    if (!ownerPoint) {
      alert("No encontramos el punto de tu recicladora para calcular la ruta.");
      return;
    }

    await window.trazarRuta(ownerPoint.pos[0], ownerPoint.pos[1]);
  };
  let searchMarker = null;

  function calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
  }

  async function performSearch() {
      const searchInput = document.getElementById("search-input");
      const query = (searchInput ? searchInput.value : "").trim();
      
      if (!query) {
          if (searchMarker) {
              map.removeLayer(searchMarker);
              searchMarker = null;
          }
          allPoints.forEach(p => p.distanceToSearch = 0);
          renderPointsList();
          if (userLocation) map.setView(userLocation, 14);
          else map.setView(DEFAULT_CENTER, 14);
          return;
      }

      const btn = document.getElementById("btn-search-address");
      if (btn) btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
      
      const coords = await geocodeAddress(query);
      
      if (btn) btn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px; vertical-align: middle;">search</span>';

      if (coords) {
          if (searchMarker) map.removeLayer(searchMarker);
          searchMarker = L.marker(coords, {
              icon: L.divIcon({
                  className: 'custom-search-marker',
                  html: '<div style="background-color:#e11d48;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(0,0,0,0.35);"></div>',
                  iconSize: [18, 18],
                  iconAnchor: [9, 9]
              })
          }).addTo(map).bindPopup(`<strong>Búsqueda:</strong> ${escapeHtml(query)}`).openPopup();
          
          map.setView(coords, 15, { animate: true });
          
          // Sort allPoints by distance
          allPoints.forEach(p => {
              p.distanceToSearch = calculateDistance(coords[0], coords[1], p.pos[0], p.pos[1]);
          });
          
          allPoints.sort((a, b) => a.distanceToSearch - b.distanceToSearch);
          renderPointsList(true); // pass true to avoid refitting bounds
      } else {
          alert("No se encontró la dirección o barrio ingresado. Intenta ser más específico.");
      }
  }

  function renderPointsList(skipFitBounds = false) {
    if (markersLayer) markersLayer.clearLayers();
    const sidebarList = document.getElementById("recycling-list");
    if (sidebarList) sidebarList.innerHTML = "";

    const filterSelect = document.getElementById("filter-select");
    const filterTerm = (filterSelect ? filterSelect.value : "").toLowerCase();

    const filteredPoints = allPoints.filter(point => {
        const materialsText = (point.materialsPreview || "").toLowerCase();
        return filterTerm === "" || materialsText.includes(filterTerm);
    });

    filteredPoints.forEach((point) => renderPoint(point, sidebarList));

    if (filteredPoints.length) {
      if (markersLayer && !skipFitBounds) {
          const bounds = markersLayer.getBounds();
          if (Object.keys(bounds).length > 0 && bounds.isValid()) {
              if (ownerMode && filteredPoints.length === 1) {
                  map.setView(filteredPoints[0].pos, 16, { animate: true });
              } else {
                  map.fitBounds(bounds.pad(0.2));
              }
          }
      }
    } else if (sidebarList) {
      sidebarList.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #64748b;">
          <span class="material-symbols-outlined" style="font-size: 32px; margin-bottom: 8px;">filter_alt_off</span>
          <br><strong>Sin resultados</strong>
          <br><small>No hay puntos que coincidan con el filtro de residuos.</small>
        </div>
      `;
    }
  }

  function setupFilters() {
      const searchInput = document.getElementById("search-input");
      const btnSearch = document.getElementById("btn-search-address");
      const filterSelect = document.getElementById("filter-select");
      
      if (searchInput) {
          searchInput.addEventListener("keypress", (e) => {
              if (e.key === "Enter") {
                  e.preventDefault();
                  performSearch();
              }
          });
      }
      if (btnSearch) {
          btnSearch.addEventListener("click", performSearch);
      }
      if (filterSelect) {
          filterSelect.addEventListener("change", () => renderPointsList(searchMarker !== null));
      }
  }

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
    publicPreview = options.publicPreview === true;
    map = L.map(mapElement, { zoomControl: false, attributionControl: false });
    window.greenupMap = map;
    window.map = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    map.setView(DEFAULT_CENTER, 14);
    if (!publicPreview) {
      initGeolocation(!ownerMode);
    }

    markersLayer = L.featureGroup().addTo(map);

    const points = await loadPoints();
    allPoints = points;
    window.greenupMapPoints = points;
    window.dispatchEvent(new CustomEvent("greenup:map-points-loaded", { detail: { points } }));

    renderPointsList();
    setupFilters();

    if (window.innerWidth < 768) {
      document.getElementById("sidebar-panel")?.classList.add("collapsed");
    }

    window.addEventListener("resize", () => map.invalidateSize());
  };

  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("eco-map") && typeof L !== "undefined") {
      if (window.GREENUP_MAP_AUTO_INIT !== false) {
        window.initGreenupMap(window.GREENUP_MAP_OPTIONS || {});
      }
    }
  });
})();
