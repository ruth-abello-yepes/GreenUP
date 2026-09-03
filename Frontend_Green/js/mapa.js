/**
 * Mapa Eco reutilizable.
 * En ciudadano/publico carga puntos desde /ubicaciones.
 * En dueno de recicladora muestra solo la recicladora autenticada.
 */

(function () {
  const API_BASE = typeof API_URL !== "undefined"
    ? API_URL
    : window.GREENUP_API_URL || (
      ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)
        ? `http://${window.location.hostname === "localhost" ? "localhost" : "127.0.0.1"}:5000`
        : "https://greenup-hoxj.onrender.com"
    );
  const DEFAULT_CENTER = [10.4631, -73.2532];
  const DEFAULT_CITY = "Valledupar, Cesar, Colombia";
  const EMPTY_ADDRESS_LABEL = "Direccion por confirmar";
  const ROUTE_MODES = [
    {
      id: "car",
      label: "En automovil",
      icon: "directions_car",
      color: "#2563eb",
      serviceUrl: "https://routing.openstreetmap.de/routed-car/route/v1",
    },
    {
      id: "bike",
      label: "En bicicleta",
      icon: "directions_bike",
      color: "#d97706",
      serviceUrl: "https://routing.openstreetmap.de/routed-bike/route/v1",
    },
    {
      id: "foot",
      label: "Caminando",
      icon: "directions_walk",
      color: "#7c3aed",
      serviceUrl: "https://routing.openstreetmap.de/routed-foot/route/v1",
    },
  ];
  const WALKING_REROUTE_DISTANCE_KM = 0.02;
  const WALKING_REROUTE_INTERVAL_MS = 12000;

  let map = null;
  let capasRutasActuales = [];
  let rutasAlternativasActuales = [];
  let indiceRutaSeleccionada = 0;
  let panelRutas = null;
  let destinoRutaActual = null;
  let seguimientoUbicacionId = null;
  let ultimaUbicacionRutaAPie = null;
  let ultimaActualizacionRutaAPie = 0;
  let actualizandoRutaAPie = false;
  let solicitudRutasId = 0;
  let indicePasoAPie = 0;
  let modoRutaActivo = null;
  let userLocation = null;
  let hasRealUserLocation = false;
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

  function normalizeRegisteredAddress(value) {
    const address = String(value || "").trim();
    if (!address) return "";
    if (/^(direccion|dirección)\s*(pendiente|por confirmar)?$/i.test(address)) return "";
    if (/pendiente|por confirmar|sin dirección|no registrada/i.test(address)) return "";
    return address;
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
    const registeredAddress = normalizeRegisteredAddress(point.direccion || point.address);
    const statusId = point.id_estado ?? point.id_estado_punto ?? point.id_estado_recicladora;
    const inactive = Number(statusId) === 2;
    const materials = normalizeMaterials(
      point.materiales_aceptados || point.materiales || point.tipos_material || point.tipo
    );

    return {
      id: point.id_punto || point.id || index + 1,
      pos: hasCoords ? [lat, lng] : [DEFAULT_CENTER[0] + index * 0.006, DEFAULT_CENTER[1] - index * 0.004],
      title: point.nombre || point.title || "Punto de reciclaje",
      address: registeredAddress || EMPTY_ADDRESS_LABEL,
      type: materials,
      materialsPreview: summarizeMaterials(materials),
      schedule: point.horario || point.horario_recicladora || point.horario_punto || "Horario por confirmar",
      owner: point.responsable || "Responsable por confirmar",
      phone: point.telefono || "Telefono por confirmar",
      email: point.correo || point.email || point.correo_empresa || "Correo no registrado",
      homePickup: point.ofrece_recoleccion_domicilio === true || point.ofrece_recoleccion_domicilio === "true",
      hasCoords,
      hasRegisteredAddress: Boolean(registeredAddress),
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
    const registeredAddress = normalizeRegisteredAddress(address);
    if (!registeredAddress) return null;

    const cacheKey = `greenup_geocode_arcgis_${registeredAddress.toLowerCase()}`;
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

    let coords = await fetchCoords(registeredAddress);
    
    // Fallback 1: Limpiar caracteres conflictivos (#, -)
    if (!coords) {
        let cleanAddress = registeredAddress.replace(/#/g, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleanAddress !== registeredAddress) {
            coords = await fetchCoords(cleanAddress);
        }
    }

    // Fallback 2: Buscar solo por la calle principal
    if (!coords) {
        let streetOnly = registeredAddress.split(/#|No|Nro|\d+-/i)[0].trim();
        if (streetOnly && streetOnly !== registeredAddress) {
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
        direccion: normalizeRegisteredAddress(profile.direccion_punto)
          || normalizeRegisteredAddress(profile.direccion_empresa),
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
        resolve(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          userLocation = [position.coords.latitude, position.coords.longitude];
          hasRealUserLocation = true;
          updateUserMarker(centerOnUser);
          resolve(true);
        },
        () => {
          hasRealUserLocation = false;
          resolve(false);
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
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
      ["delete", ownerMode ? point.type : point.materialsPreview],
      ["call", point.phone],
      ["local_shipping", point.homePickup ? "Ofrece recolección a domicilio" : "Recibe materiales únicamente en el punto"],
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
    const locationAvailable = !ownerMode || (point.hasRegisteredAddress && point.hasCoords);
    let marker = null;

    if (locationAvailable) {
      marker = L.marker(point.pos, {
        icon: createRecyclingMarkerIcon(point),
        title: point.title,
        alt: `Punto ecologico ${point.title}`,
      });

      if (markersLayer) {
          marker.addTo(markersLayer);
      } else {
          marker.addTo(map);
      }
    }

    if (marker && publicPreview) {
      marker.bindPopup(`
        <div class="greenup-map-popup greenup-public-point-name">
          <h6 style="color:${point.color};">${escapeHtml(point.title)}</h6>
        </div>
      `, {
        maxWidth: 240,
        minWidth: 150,
        className: "greenup-public-popup",
      });
    } else if (marker) {
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

    const materialsText = ownerMode ? point.type : point.materialsPreview;
    const item = document.createElement("button");
    item.type = "button";
    item.className = "gu-sidebar-item";
    item.setAttribute("aria-label", `${point.title}. ${point.address}. ${point.schedule}. ${materialsText}`);
    if (!locationAvailable) {
      item.classList.add("location-unavailable");
      item.setAttribute("aria-disabled", "true");
    }
    item.innerHTML = `
      <span class="type-icon map-point-icon ${point.inactive ? "gray" : ""}">
        <span class="material-symbols-outlined">${point.icon}</span>
      </span>
      <span class="point-card-copy">
        <strong>${escapeHtml(point.title)}</strong>
        <small>${escapeHtml(point.address)}</small>
        <span class="gu-sidebar-meta">
          <span><span class="material-symbols-outlined">schedule</span>${escapeHtml(point.schedule)}</span>
          <span><span class="material-symbols-outlined">delete</span>${escapeHtml(materialsText)}</span>
          <span><span class="material-symbols-outlined">call</span>${escapeHtml(point.phone)}</span>
          <span><span class="material-symbols-outlined">local_shipping</span>${point.homePickup ? "Recolección a domicilio disponible" : "Entrega directamente en el punto"}</span>
        </span>
      </span>
    `;

    if (marker) {
      item.addEventListener("click", () => {
        map.setView(point.pos, 16, { animate: true });
        setTimeout(() => marker.openPopup(), 350);
        if (window.innerWidth < 768) window.toggleSidebar();
      });
    }

    sidebarList.appendChild(item);
  }
  window.centerMap = async function () {
    if (hasRealUserLocation && userLocation && map) {
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
    if (ownerMode && ownerPoint?.hasRegisteredAddress && ownerPoint.hasCoords && map) {
      map.setView(ownerPoint.pos, 16, { animate: true });
      return;
    }

    alert(ownerPoint?.hasRegisteredAddress
      ? "No pudimos ubicar la direccion registrada. Revisa que este completa en tu perfil."
      : "Tu recicladora aun no tiene una direccion registrada.");
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
    rutasAlternativasActuales = [];
    indiceRutaSeleccionada = 0;
  }

  function formatRouteDuration(seconds) {
    const totalMinutes = Math.max(1, Math.round(Number(seconds || 0) / 60));
    if (totalMinutes < 60) return `${totalMinutes} min`;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
  }

  function formatRouteDistance(meters) {
    const value = Number(meters || 0);
    if (value < 1000) return `${Math.max(1, Math.round(value))} m`;
    return `${(value / 1000).toLocaleString("es-CO", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} km`;
  }

  function ensureRoutesPanel() {
    if (panelRutas?.isConnected) return panelRutas;

    panelRutas = document.createElement("section");
    panelRutas.id = "greenup-routes-panel";
    panelRutas.className = "greenup-routes-panel";
    panelRutas.setAttribute("aria-live", "polite");
    panelRutas.innerHTML = `
      <div class="greenup-routes-header">
        <div>
          <strong>Calculando rutas...</strong>
          <small>Desde tu ubicacion hasta la recicladora</small>
        </div>
        <button type="button" class="greenup-routes-close" aria-label="Cerrar rutas">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="greenup-routes-list"></div>
    `;
    panelRutas.querySelector(".greenup-routes-close")?.addEventListener("click", () => {
      window.cerrarRutas();
    });
    document.querySelector("body.ciudadano-pagina-mapa main")?.appendChild(panelRutas);
    return panelRutas;
  }

  function setRoutesPanelStatus(title, message) {
    const panel = ensureRoutesPanel();
    const headerTitle = panel?.querySelector(".greenup-routes-header strong");
    const headerMessage = panel?.querySelector(".greenup-routes-header small");
    const list = panel?.querySelector(".greenup-routes-list");
    if (headerTitle) headerTitle.textContent = title;
    if (headerMessage) headerMessage.textContent = message;
    if (list) list.replaceChildren();
  }

  function routeColor(index, selected) {
    if (selected) return "#16752b";
    return rutasAlternativasActuales[index]?.mode?.color || "#64748b";
  }

  function buildStepInstruction(step) {
    const road = String(step.name || "").trim();
    const roadText = road ? ` por ${road}` : "";
    const type = step.maneuver?.type;
    const modifier = step.maneuver?.modifier;
    const turns = {
      left: "Gira a la izquierda",
      right: "Gira a la derecha",
      "slight left": "Gira levemente a la izquierda",
      "slight right": "Gira levemente a la derecha",
      "sharp left": "Gira pronunciadamente a la izquierda",
      "sharp right": "Gira pronunciadamente a la derecha",
      straight: "Continua recto",
      uturn: "Haz un giro en U",
    };

    if (type === "depart") return `Inicia${roadText}`;
    if (type === "arrive") return "Llegaste a la recicladora";
    if (type === "roundabout" || type === "rotary") {
      const exit = step.maneuver?.exit;
      return `${exit ? `Toma la salida ${exit}` : "Continua en la glorieta"}${roadText}`;
    }
    if (type === "merge") return `Incorporate${roadText}`;
    if (type === "fork") return `${modifier?.includes("left") ? "Toma el desvio izquierdo" : "Toma el desvio derecho"}${roadText}`;
    if (type === "new name" || type === "continue") return `Continua${roadText}`;
    return `${turns[modifier] || "Continua"}${roadText}`;
  }

  function renderWalkingInstruction(position) {
    const status = panelRutas?.querySelector(".greenup-navigation-status");
    const footRoute = rutasAlternativasActuales.find((route) => route.mode.id === "foot");
    if (!status || modoRutaActivo !== "foot" || !footRoute?.steps?.length || !position) {
      if (status) status.hidden = true;
      return;
    }

    while (indicePasoAPie < footRoute.steps.length - 1) {
      const currentStep = footRoute.steps[indicePasoAPie];
      const distanceToStep = calculateDistance(
        position[0],
        position[1],
        currentStep.location[0],
        currentStep.location[1]
      );
      if (distanceToStep > 0.025) break;
      indicePasoAPie += 1;
    }

    const step = footRoute.steps[indicePasoAPie];
    const distanceMeters = calculateDistance(
      position[0],
      position[1],
      step.location[0],
      step.location[1]
    ) * 1000;
    const instruction = status.querySelector("strong");
    const distance = status.querySelector("div > span");
    if (instruction) instruction.textContent = step.instruction;
    if (distance) {
      distance.textContent = step.maneuverType === "arrive"
        ? "Destino"
        : `En ${formatRouteDistance(distanceMeters)}`;
    }
    status.hidden = false;
  }

  function detenerSeguimientoAPie() {
    if (seguimientoUbicacionId !== null && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(seguimientoUbicacionId);
    }
    seguimientoUbicacionId = null;
    ultimaUbicacionRutaAPie = null;
    ultimaActualizacionRutaAPie = 0;
    actualizandoRutaAPie = false;
  }

  async function fetchRouteForMode(mode, origin, destination) {
    const coordinates = [
      `${origin[1]},${origin[0]}`,
      `${destination[1]},${destination[0]}`,
    ].join(";");
    const url = `${mode.serviceUrl}/driving/${coordinates}`
      + "?alternatives=false&overview=full&geometries=geojson&steps=true";
    const response = await fetch(url);
    if (!response.ok) throw new Error(`No se pudo calcular la ruta ${mode.id}`);

    const data = await response.json();
    const result = data.routes?.[0];
    if (data.code !== "Ok" || !result?.geometry?.coordinates?.length) {
      throw new Error(`No se encontro la ruta ${mode.id}`);
    }

    return {
      mode,
      coordinates: result.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      summary: {
        totalDistance: result.distance,
        totalTime: result.duration,
      },
      steps: (result.legs || []).flatMap((leg) => (leg.steps || []).map((step) => ({
        instruction: buildStepInstruction(step),
        maneuverType: step.maneuver?.type,
        location: [step.maneuver.location[1], step.maneuver.location[0]],
      }))),
    };
  }

  async function actualizarRutaAPie(position) {
    const footIndex = rutasAlternativasActuales.findIndex((route) => route.mode.id === "foot");
    if (footIndex < 0 || !destinoRutaActual || actualizandoRutaAPie) return;

    const destinationAtRequest = [...destinoRutaActual];
    actualizandoRutaAPie = true;
    try {
      const updatedRoute = await fetchRouteForMode(
        ROUTE_MODES.find((mode) => mode.id === "foot"),
        position,
        destinationAtRequest
      );
      if (!destinoRutaActual
        || destinoRutaActual[0] !== destinationAtRequest[0]
        || destinoRutaActual[1] !== destinationAtRequest[1]
        || rutasAlternativasActuales[indiceRutaSeleccionada]?.mode.id !== "foot") return;

      const routes = [...rutasAlternativasActuales];
      routes[footIndex] = updatedRoute;
      indicePasoAPie = 0;
      pintarRutasPorTransporte(routes, { selectedIndex: footIndex, fitAll: false });
    } catch (error) {
      console.warn("No se pudo actualizar la ruta a pie:", error);
    } finally {
      actualizandoRutaAPie = false;
    }
  }

  function iniciarSeguimientoAPie() {
    if (seguimientoUbicacionId !== null || !("geolocation" in navigator)) return;

    ultimaUbicacionRutaAPie = userLocation ? [...userLocation] : null;
    ultimaActualizacionRutaAPie = Date.now();
    seguimientoUbicacionId = navigator.geolocation.watchPosition(
      (position) => {
        const nextLocation = [position.coords.latitude, position.coords.longitude];
        userLocation = nextLocation;
        hasRealUserLocation = true;
        updateUserMarker(false);

        const movedEnough = !ultimaUbicacionRutaAPie
          || calculateDistance(
            ultimaUbicacionRutaAPie[0],
            ultimaUbicacionRutaAPie[1],
            nextLocation[0],
            nextLocation[1]
          ) >= WALKING_REROUTE_DISTANCE_KM;
        const waitedEnough = Date.now() - ultimaActualizacionRutaAPie >= WALKING_REROUTE_INTERVAL_MS;
        if (!movedEnough || !waitedEnough || actualizandoRutaAPie) return;

        ultimaUbicacionRutaAPie = [...nextLocation];
        ultimaActualizacionRutaAPie = Date.now();
        actualizarRutaAPie(nextLocation);
      },
      (error) => console.warn("Seguimiento de ubicacion no disponible:", error.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }

  function updateRouteSelection(index, fitRoute = true) {
    if (!rutasAlternativasActuales[index]) return;
    indiceRutaSeleccionada = index;
    const selectedRoute = rutasAlternativasActuales[index];
    const modeChanged = modoRutaActivo !== selectedRoute.mode.id;
    modoRutaActivo = selectedRoute.mode.id;

    capasRutasActuales.forEach((layer, layerIndex) => {
      const selected = layerIndex === index;
      layer.setStyle({
        color: routeColor(layerIndex, selected),
        weight: selected ? 8 : 5,
        opacity: selected ? 0.95 : 0.58,
        dashArray: selected ? null : "10 8",
      });
      if (selected) layer.bringToFront();
    });

    panelRutas?.querySelectorAll(".greenup-route-option").forEach((button, buttonIndex) => {
      const selected = buttonIndex === index;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
      const swatch = button.querySelector(".greenup-route-swatch");
      if (swatch) swatch.style.backgroundColor = routeColor(buttonIndex, selected);
    });

    const panelMessage = panelRutas?.querySelector(".greenup-routes-header small");
    if (selectedRoute.mode.id === "foot") {
      if (modeChanged) indicePasoAPie = 0;
      iniciarSeguimientoAPie();
      if (panelMessage) panelMessage.textContent = "Seguimiento activo: la ruta se actualiza mientras caminas";
    } else {
      detenerSeguimientoAPie();
      if (panelMessage) panelMessage.textContent = "Una ruta por cada medio de transporte";
    }

    if (fitRoute) {
      const bounds = L.latLngBounds(selectedRoute.coordinates);
      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          paddingTopLeft: [window.innerWidth >= 768 ? 350 : 24, 24],
          paddingBottomRight: [24, 190],
          maxZoom: 17,
        });
      }
    }
  }

  function renderRoutesPanel(routes) {
    const panel = ensureRoutesPanel();
    if (!panel) return;

    const title = panel.querySelector(".greenup-routes-header strong");
    const message = panel.querySelector(".greenup-routes-header small");
    const list = panel.querySelector(".greenup-routes-list");
    if (title) title.textContent = routes.length === ROUTE_MODES.length
      ? "Rutas por transporte"
      : `${routes.length} de ${ROUTE_MODES.length} rutas disponibles`;
    if (message) {
      message.textContent = "Una ruta por cada medio de transporte";
    }
    if (!list) return;

    list.replaceChildren();
    routes.forEach((route, index) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "greenup-route-option";
      option.setAttribute("aria-pressed", String(index === 0));
      option.setAttribute(
        "aria-label",
        `${route.mode.label}: ${formatRouteDuration(route.summary?.totalTime)}, ${formatRouteDistance(route.summary?.totalDistance)}`
      );
      option.innerHTML = `
        <span class="greenup-route-swatch" aria-hidden="true"></span>
        <span>
          <strong><span class="material-symbols-outlined">${route.mode.icon}</span>${route.mode.label}</strong>
          <small>${formatRouteDuration(route.summary?.totalTime)} · ${formatRouteDistance(route.summary?.totalDistance)}</small>
        </span>
      `;
      option.addEventListener("click", () => updateRouteSelection(index));
      list.appendChild(option);
    });
  }

  function pintarRutasPorTransporte(routes, options = {}) {
    const selectedIndex = Math.min(options.selectedIndex || 0, Math.max(0, routes.length - 1));
    limpiarCapasRutas();
    rutasAlternativasActuales = routes;

    routes.forEach((route, index) => {
      const coordinates = route.coordinates || [];
      if (!coordinates.length) return;

      const layer = L.polyline(coordinates, {
        color: routeColor(index, index === selectedIndex),
        weight: index === selectedIndex ? 8 : 5,
        opacity: index === selectedIndex ? 0.95 : 0.58,
        dashArray: index === selectedIndex ? null : "10 8",
      })
        .addTo(map)
        .on("click", () => updateRouteSelection(index));
      capasRutasActuales.push(layer);
    });

    if (!routes.length) {
      setRoutesPanelStatus("No encontramos una ruta", "Prueba con otra recicladora o ubicacion");
      return;
    }

    renderRoutesPanel(routes);
    updateRouteSelection(selectedIndex, false);

    if (options.fitAll !== false) {
      const allBounds = L.latLngBounds([]);
      routes.forEach((route) => allBounds.extend(route.coordinates || []));
      if (allBounds.isValid()) {
        map.fitBounds(allBounds, {
          paddingTopLeft: [window.innerWidth >= 768 ? 350 : 24, 24],
          paddingBottomRight: [24, 190],
          maxZoom: 17,
        });
      }
    }
  }

  window.cerrarRutas = function () {
    solicitudRutasId += 1;
    detenerSeguimientoAPie();
    destinoRutaActual = null;
    modoRutaActivo = null;
    indicePasoAPie = 0;
    limpiarCapasRutas();
    panelRutas?.remove();
    panelRutas = null;
  };

  window.trazarRuta = async function (destinoLat, destinoLng) {
    if (!hasRealUserLocation || !userLocation) {
      const located = await requestCurrentLocation(false);
      if (!located) {
        alert("No pudimos obtener tu ubicacion actual. Activa los permisos de ubicacion para calcular la ruta.");
        return;
      }
    }

    detenerSeguimientoAPie();
    limpiarCapasRutas();
    modoRutaActivo = null;
    indicePasoAPie = 0;
    destinoRutaActual = [Number(destinoLat), Number(destinoLng)];
    const currentRequestId = ++solicitudRutasId;
    setRoutesPanelStatus("Calculando rutas...", "Automovil, bicicleta y caminando");

    const results = await Promise.allSettled(
      ROUTE_MODES.map((mode) => fetchRouteForMode(mode, userLocation, destinoRutaActual))
    );
    if (currentRequestId !== solicitudRutasId) return;

    const routes = results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);
    if (!routes.length) {
      setRoutesPanelStatus("No pudimos calcular las rutas", "Revisa tu conexion o intenta nuevamente");
      return;
    }

    pintarRutasPorTransporte(routes);

    if (window.innerWidth < 768) {
      document.getElementById("sidebar-panel")?.classList.add("collapsed");
    }
  };

  window.mostrarRutaMiRecicladora = async function () {
    if (!ownerPoint?.hasRegisteredAddress || !ownerPoint.hasCoords) {
      alert(ownerPoint?.hasRegisteredAddress
        ? "No pudimos ubicar la direccion registrada para calcular la ruta."
        : "Registra la direccion de tu recicladora antes de calcular una ruta.");
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
          if (ownerMode && ownerPoint?.hasRegisteredAddress && ownerPoint.hasCoords) {
              map.setView(ownerPoint.pos, 16);
          } else if (userLocation) map.setView(userLocation, 14);
          else map.setView(DEFAULT_CENTER, 14);
          return;
      }

      const btn = document.getElementById("btn-search-address");
      if (btn) {
          btn.dataset.idleHtml ||= btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span class="visually-hidden">Buscando</span>';
      }
      
      const coords = await geocodeAddress(query);
      
      if (btn) {
          btn.disabled = false;
          btn.innerHTML = btn.dataset.idleHtml;
      }

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
        const materialsText = `${point.type || ""} ${point.materialsPreview || ""}`.toLowerCase();
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

  function renderOwnerMapState() {
    if (!ownerMode) return;
    const shell = document.getElementById("eco-map")?.parentElement;
    if (!shell) return;

    shell.querySelector(".owner-map-empty-state")?.remove();
    const hasAddress = ownerPoint?.hasRegisteredAddress;
    const hasLocation = hasAddress && ownerPoint?.hasCoords;
    if (hasLocation) return;

    const state = document.createElement("div");
    state.className = "owner-map-empty-state";
    state.setAttribute("role", "status");
    state.innerHTML = hasAddress
      ? `
        <span class="material-symbols-outlined">wrong_location</span>
        <div><strong>No pudimos ubicar esta direccion</strong><small>Revisa que la direccion de tu recicladora este completa y vuelve a cargar la pagina.</small></div>
      `
      : `
        <span class="material-symbols-outlined">add_location_alt</span>
        <div><strong>Aun no tienes una direccion registrada</strong><small>Agregala desde tu perfil para mostrar la ubicacion real de tu recicladora.</small></div>
      `;
    shell.appendChild(state);
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
    renderOwnerMapState();
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
