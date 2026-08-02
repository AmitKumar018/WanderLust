(function () {
  var mapElement = document.getElementById("map");

  if (!mapElement || typeof mapboxgl === "undefined") {
    return;
  }

  var token = mapElement.dataset.mapToken;
  var lng = Number(mapElement.dataset.lng);
  var lat = Number(mapElement.dataset.lat);
  var location = mapElement.dataset.location || "Listing location";

  if (!token || !Number.isFinite(lng) || !Number.isFinite(lat)) {
    mapElement.classList.add("map-empty");
    mapElement.textContent = "Map is unavailable for this listing.";
    return;
  }

  mapboxgl.accessToken = token;

  var map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v12",
    center: [lng, lat],
    zoom: 9,
  });

  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

  new mapboxgl.Marker({ color: "#fe424d" })
    .setLngLat([lng, lat])
    .setPopup(
      new mapboxgl.Popup({ offset: 25 }).setHTML(
        "<strong>" + location + "</strong><p>Exact location is shared after booking.</p>"
      )
    )
    .addTo(map);
})();
