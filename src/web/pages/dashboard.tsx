import { html } from 'hono/html';

const DashboardPage = () => {
  return (
    <div class="p-5 shadow-inner">
      <div class="grid grid-cols-4 rounded border-t-2 border-t-secondary bg-white p-5 shadow-lg">
        <div class=""></div>
      </div>
      <div id="map" class="min-h-[60vh]">
        {html`
          <script>
            $(document).ready(async function () {
              const map = L.map('map').setView([-6.8673915, 106.9443265], 11);
              L.tileLayer(
                'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                {
                  attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                }
              ).addTo(map);

              const bar = fetch('/assets/3201.geojson')
                .then((res) => res.json())
                .then((data) => {
                  console.log(data);
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
