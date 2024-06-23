import { FC } from "hono/jsx";
import { DefaultLayout } from "../layouts/default-layout.js";

const DashboardPage: FC = ({ route }: { route: string }) => {
  return (
    <DefaultLayout route={route}>
      <div class="p-3">
        <h1 class="text-2xl font-bold">Dashboard</h1>
        <div
          id="map"
          class="min-h-[60vh]"
          x-init="
          const map = L.map('map').setView([51.505, -0.09], 13);
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
          }).addTo(map);
        "
        >
          Map
        </div>
        <div class="text-xl font-bold text-blue-500">Leaflet</div>
      </div>
    </DefaultLayout>
  );
};

export default DashboardPage;
