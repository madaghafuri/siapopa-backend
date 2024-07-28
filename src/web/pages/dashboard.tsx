import { html } from 'hono/html';
import { KabupatenKota } from '../../db/schema/kabupaten-kota';
import { SelectOPT } from '../../db/schema/opt';

const DashboardPage = ({
  kabkotOptions,
  optOptions,
}: {
  kabkotData: Partial<Omit<KabupatenKota, 'area_kabkot'>>;
  kabkotOptions: Partial<KabupatenKota>[];
  optOptions: SelectOPT[];
}) => {
  return (
    <div class="p-5 shadow-inner">
      <div class="grid grid-cols-4 gap-5 rounded border-t-2 border-t-secondary bg-white p-5 shadow-lg">
        <select
          name="kabkot_id"
          id="dropdown-kabupaten"
          class="max-h-full rounded border border-gray-200 px-2 py-1"
          multiple
        >
          {kabkotOptions.map((val) => {
            return <option value={val.id}>{val.nama_kabkot}</option>;
          })}
        </select>
        <select
          name="kode_opt"
          id="dropdown-opt"
          class="max-h-full rounded border border-gray-200 px-2 py-1"
          multiple
        >
          {optOptions.map((val) => {
            return <option value={val.kode_opt}>{val.nama_opt}</option>;
          })}
        </select>
        <button
          class="rounded bg-primary px-2 py-1 text-white"
          id="filter-prakiraan"
        >
          Lihat Peta
        </button>
      </div>
      <div id="map" class="min-h-[60vh]">
        {html`
          <script>
            $(document).ready(async function () {
              const map = L.map('map').setView([-6.8673915, 106.9443265], 11);
              const info = L.control({
                position: 'bottomright',
              });
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

              $('#dropdown-opt').select2();
              $('#dropdown-kabupaten').select2();
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
                    res.data.forEach((data) => {
                      const poly = L.geoJSON(data.area_kabkot).addTo(map);
                      map.fitBounds(poly.getBounds());
                    });
                  },
                  error: () => {
                    console.log('error');
                  },
                });
              });

              $('#filter-prakiraan').click(function () {
                const kodeOptList = $('#dropdown-opt').val();

                function getColor(d) {
                  return d > 10
                    ? '#e3180e'
                    : d > 5
                      ? '#db8c0d'
                      : d > 3
                        ? '#42cf1b'
                        : '#166301';
                }

                if (!kodeOptList || kodeOptList.length === 0) return;
                $.ajax({
                  url: '/app/dashboard/map',
                  method: 'GET',
                  data: {
                    kode_opt: kodeOptList,
                  },
                  success: (res) => {
                    map.eachLayer(function (layer) {
                      if (layer instanceof L.GeoJSON) {
                        map.removeLayer(layer);
                      }
                    });
                    res.data.forEach((data) => {
                      const poly = L.geoJSON(data.area_kabkot, {
                        style: {
                          fillColor: getColor(data.rasio),
                          weight: 2,
                          fillOpacity: 0.7,
                          color: 'white',
                        },
                      });
                      poly.addTo(map);
                    });
                    map.fitBounds(map.getBounds());
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
