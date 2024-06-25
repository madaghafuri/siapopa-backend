const DashboardPage = () => {
  return (
    <div class="p-3">
      <h1 class="text-2xl font-bold">Dashboard</h1>
      <div
        id="map"
        class="min-h-[60vh]"
        x-init="
          const map = L.map('map').setView([-6.765742, 107.0514767], 13);
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 9,
          }).addTo(map);
        "
      >
        Map
      </div>
      <div class="text-xl font-bold text-blue-500">Leaflet</div>
    </div>
  );
};

export default DashboardPage;
