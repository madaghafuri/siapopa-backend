import { html } from 'hono/html';

const DashboardPage = () => {
  return (
    <div class="p-3">
      <h1 class="text-2xl font-bold">Dashboard</h1>
      <div id="map" class="min-h-[60vh]">
        {html`
          <script>
            $(document).ready(function () {
              const map = L.map('map').setView([-6.917, 107.619], 11);
              L.tileLayer(
                'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                {
                  attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                }
              ).addTo(map);

              const foo = fetch('/assets/Jabar_By_Kab.geojson')
                .then((res) => res.json())
                .then((data) => {
                  L.geoJson(data).addTo(map);
                });
            });
          </script>
        `}
        Map
      </div>
      <div
        class="text-xl font-bold text-blue-500"
        onclick="alert('Hello World')"
      >
        Leaflet
      </div>
    </div>
  );
};

export default DashboardPage;
