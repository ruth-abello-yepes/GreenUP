/**
 * @fileoverview Lógica del Mapa Eco para GreenUp
 * Funciones: Geolocalización del usuario, Enrutamiento (OSRM) y Control del Sidebar.
 */

document.addEventListener("DOMContentLoaded", function () {

    // 1. Configuración de Leaflet
    const map = L.map('eco-map', { zoomControl: false, attributionControl: false });

    // Capa estándar de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Variables Globales del Mapa
    let controlRutaActual = null;
    let userLocation = null;
    let userMarker = null;

    // 2. Geolocalización en Tiempo Real (GPS)
    function initGeolocation() {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // Si el usuario da permiso, guardamos su ubicación exacta
                    userLocation = [position.coords.latitude, position.coords.longitude];
                    map.setView(userLocation, 15, { animate: true });

                    // Creamos un punto azul estilizado para indicar "Tú estás aquí"
                    const userIcon = L.divIcon({
                        className: 'custom-user-icon',
                        html: `<div style="background-color: #007bff; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
                        iconSize: [18, 18],
                        iconAnchor: [9, 9]
                    });

                    userMarker = L.marker(userLocation, { icon: userIcon }).addTo(map)
                        .bindPopup("<span class='fw-bold text-primary'>📍 Tú estás aquí</span>")
                        .openPopup();
                },
                (error) => {
                    console.error("Error obteniendo ubicación:", error);
                    // Si deniega el permiso, lo enviamos al centro de Valledupar por defecto
                    userLocation = [10.4631, -73.2532];
                    map.setView(userLocation, 14, { animate: true });
                    alert("No pudimos acceder a tu GPS. Mostraremos las distancias desde el centro de la ciudad.");
                },
                { enableHighAccuracy: true } // Pedir máxima precisión al celular
            );
        } else {
            alert("Tu navegador no soporta geolocalización.");
            map.setView([10.4631, -73.2532], 14);
        }
    }

    // Iniciamos la búsqueda del GPS apenas carga la página
    initGeolocation();

    // 3. Botón Flotante "Centrar Mapa"
    window.centerMap = function () {
        if (userLocation) {
            map.setView(userLocation, 15, { animate: true });
            if (userMarker) userMarker.openPopup();
        }
    };

    // 4. Datos de Puntos de Reciclaje (Simulando consulta a la BD)
    const markersData = [
        { id: 1, pos: [10.4650, -73.2550], title: "EcoPunto Valledupar Norte", address: "Calle 12 #4-56", type: "Plástico, Papel, Vidrio", color: "#003d6c", icon: "location_on" },
        { id: 2, pos: [10.4610, -73.2510], title: "Centro GreenUp El Guatapurí", address: "Av. Militar, Local 204", type: "Metales, Electrónicos", color: "#296c1f", icon: "eco" },
        { id: 3, pos: [10.4720, -73.2450], title: "Punto Verde Comuna 5", address: "Carrera 23 #18-90", type: "Aceites, Pilas", color: "#fb923c", icon: "battery_charging_full" }
    ];

    const sidebarList = document.getElementById('recycling-list');

    // 5. Renderizado de Puntos y Botones "Cómo Llegar"
    markersData.forEach(point => {
        const marker = L.circleMarker(point.pos, {
            radius: 10, fillColor: point.color, color: "#fff", weight: 2, opacity: 1, fillOpacity: 0.9
        }).addTo(map);

        // Agregamos la función trazarRuta() al botón del Popup
        marker.bindPopup(`
            <div class="p-1 min-w-[150px]">
                <h6 class="fw-bold text-dark mb-1" style="color: ${point.color};">${point.title}</h6>
                <p class="text-muted small mb-2" style="font-size: 11px;">${point.address}</p>
                <div class="mb-3">
                    <span class="small fw-bold text-secondary">Acepta:</span><br>
                    <span class="small fw-medium">${point.type}</span>
                </div>
                <button onclick="trazarRuta(${point.pos[0]}, ${point.pos[1]})" class="btn btn-sm w-100 fw-bold text-white rounded-pill shadow-sm" style="background-color: ${point.color}; font-size: 11px;">
                    📍 Cómo llegar
                </button>
            </div>
        `);

        // Tarjeta en el menú lateral
        const item = document.createElement('div');
        item.className = "p-3 bg-white border rounded-4 mb-3 cursor-pointer gu-sidebar-item";
        item.innerHTML = `
            <div class="d-flex gap-3 align-items-center">
                <div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 45px; height: 45px; background-color: ${point.color}15">
                    <span class="material-symbols-outlined" style="color: ${point.color}">${point.icon}</span>
                </div>
                <div class="flex-grow-1 overflow-hidden">
                    <h6 class="fw-bold text-dark mb-0 text-truncate" style="font-size: 0.9rem;">${point.title}</h6>
                    <p class="text-muted mb-1 text-truncate" style="font-size: 0.75rem;">${point.address}</p>
                    <span class="badge bg-light text-secondary border">Reciclaje</span>
                </div>
            </div>
        `;

        item.onclick = () => {
            map.setView(point.pos, 16, { animate: true });
            setTimeout(() => marker.openPopup(), 400);
            if (window.innerWidth < 768) toggleSidebar();
        };
        sidebarList.appendChild(item);
    });

    // 6. Motor de Enrutamiento (Cómo llegar)
    window.trazarRuta = function (destinoLat, destinoLng) {
        if (!userLocation) {
            alert("Estamos obteniendo tu ubicación, inténtalo de nuevo en unos segundos...");
            return;
        }

        // Si ya hay una ruta dibujada, la eliminamos
        if (controlRutaActual !== null) {
            map.removeControl(controlRutaActual);
        }

        // Trazamos la ruta usando OSRM
        controlRutaActual = L.Routing.control({
            waypoints: [
                L.latLng(userLocation[0], userLocation[1]), // Desde el GPS del usuario
                L.latLng(destinoLat, destinoLng)            // Hasta el punto de reciclaje
            ],
            show: false, // Ocultar panel de texto de direcciones
            addWaypoints: false,
            routeWhileDragging: false,
            fitSelectedRoutes: true,
            lineOptions: {
                styles: [{ color: '#296c1f', opacity: 0.8, weight: 6 }] // Línea Verde GreenUp
            }
        }).addTo(map);

        // Cerramos el panel lateral en celulares para que se vea el mapa
        if (window.innerWidth < 768) {
            document.getElementById('sidebar-panel').classList.add('collapsed');
        }
    };

    // 7. Funcionalidad de Paneles y Modales
    window.toggleSidebar = function () {
        const sidebar = document.getElementById('sidebar-panel');
        sidebar.classList.toggle('collapsed');
        setTimeout(() => map.invalidateSize(), 300);
    };

    if (window.innerWidth < 768) {
        document.getElementById('sidebar-panel').classList.add('collapsed');
    }
    window.addEventListener('resize', () => map.invalidateSize());

    // 8. Lógica del Botón "Sugerir Punto"
    const btnSugerir = document.getElementById('btn-abrir-sugerencia');
    if (btnSugerir) {
        btnSugerir.addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('modalSugerirPunto'));
            modal.show();
        });
    }

    const btnEnviarSugerencia = document.getElementById('btn-enviar-sugerencia');
    if (btnEnviarSugerencia) {
        btnEnviarSugerencia.addEventListener('click', () => {
            // Cerramos el modal
            const modalElement = document.getElementById('modalSugerirPunto');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            modalInstance.hide();

            // Mostramos la notificación verde (Toast)
            const toastEl = document.getElementById('successToast');
            const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
            toast.show();

            // Limpiamos el formulario
            document.getElementById('form-sugerir-punto').reset();
        });
    }

});