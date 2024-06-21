import { FC } from "hono/jsx";
import { DefaultLayout } from "../layouts/default-layout.js";

const DashboardPage: FC = ({ route }: { route: string }) => {
  return (
    <DefaultLayout route={route}>
      <div class="p-3">
        <h1 class="text-2xl font-bold">Dashboard</h1>
        <div id="map">Map</div>
        <div class="text-xl font-bold text-blue-500">Leaflet</div>
      </div>
    </DefaultLayout>
  );
};

export default DashboardPage;
