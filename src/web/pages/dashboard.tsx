import { html } from "hono/html";

const DashboardPage = () => {
  return (
    <div class="p-3">
      <h1 class="text-2xl font-bold">Dashboard</h1>
      <div
        id="map"
        class="min-h-[60vh]"
        x-init="
          const bandung = 'MULTIPOLYGON((
              (
                  107.569580 -6.897080,
                  107.569580 -6.941060,
                  107.595670 -6.970490,
                  107.644380 -6.970490,
                  107.715450 -6.941060,
                  107.715450 -6.897080,
                  107.644380 -6.867650,
                  107.595670 -6.867650,
                  107.569580 -6.897080
              ),
              (
                  107.609930 -6.914220,
                  107.613620 -6.917910,
                  107.617310 -6.914220,
                  107.613620 -6.910530,
                  107.609930 -6.914220
              )
          ))'

          const wicket = new Wkt.Wkt()
          wicket.read(bandung)
          const bandungGeoJSON = wicket.toJson()
          const map = L.map('map').setView([-6.917, 107.619], 11)
        
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          L.geoJSON(bandungGeoJSON, {
              style: {
                  color: '#ff7800',
                  weight: 2,
                  opacity: 0.65
              }
          }).addTo(map);
        "
      >
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
