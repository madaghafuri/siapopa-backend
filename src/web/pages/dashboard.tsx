import { html } from 'hono/html';
import { KabupatenKota } from '../../db/schema/kabupaten-kota';

const DashboardPage = ({
  kabkotOptions,
}: {
  kabkotData: Partial<Omit<KabupatenKota, 'area_kabkot'>>;
  kabkotOptions: Partial<KabupatenKota>[];
}) => {
  return (
    <div class="p-5 shadow-inner">
      <div class="grid grid-cols-4 rounded border-t-2 border-t-secondary bg-white p-5 shadow-lg">
        <div class="">
          <select
            name="kabkot_id"
            id="dropdown-kabupaten"
            class="rounded border border-gray-200 px-2 py-1"
          >
            <option value="">Pilih Kabupaten Kota</option>
            {kabkotOptions.map((val) => {
              return <option value={val.id}>{val.nama_kabkot}</option>;
            })}
          </select>
        </div>
      </div>
      <div id="map" class="min-h-[60vh]">
        {html`
          <script>
            $(document).ready(async function () {
              const map = L.map('map').setView([-6.8673915, 106.9443265], 11);
              const streetMap = L.tileLayer(
                'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                {
                  attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                }
              );

              const baseMap = L.tileLayer(
                'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                {
                  attribution: '©OpenStreetMap, ©CartoDB',
                }
              );
              baseMap.addTo(map);

              const baseLayers = {
                'Base Map': baseMap,
                'Street Map': streetMap,
              };

              L.control.layers(baseLayers).addTo(map);

              $('#dropdown-kabupaten').change(async function () {
                const selectedVal = $(this).val();

                if (!selectedVal) return;
                $.ajax({
                  url: '/app/dashboard/map',
                  method: 'GET',
                  data: {
                    kabkot_id: selectedVal,
                  },
                  success: (res) => {
                    map.eachLayer(function (layer) {
                      if (layer instanceof L.GeoJSON) {
                        map.removeLayer(layer);
                      }
                    });
                    const poly = L.geoJSON(res.data[0].area_kabkot).addTo(map);
                    map.fitBounds(poly.getBounds());
                    poly.bindPopup('I am a polygon');
                  },
                  error: () => {
                    console.log('error');
                  },
                });
              });
            });
          </script>
        `}
      </div>
    </div>
  );
};

export default DashboardPage;
