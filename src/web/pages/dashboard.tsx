import { html } from 'hono/html';
import { KabupatenKota } from '../../db/schema/kabupaten-kota';
import { SelectOPT } from '../../db/schema/opt';
import { ToolTip } from '../components/leaflet/tooltip';

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
        <div class="flex flex-col gap-1">
          <label class="text-sm font-bold text-blue-500" htmlFor="">
            OPT
          </label>
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
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-bold text-blue-500">Musim Tanam</label>
          <select
            id="dropdown-mt"
            name=""
            class="rounded border border-gray-200 px-2 py-1"
            multiple
          >
            <option value={2023}>2023</option>
            <option value="2023/2024">2023/2024</option>
            <option value={2024}>2024</option>
          </select>
        </div>
        <button
          class="rounded bg-primary px-2 py-1 text-white"
          id="filter-prakiraan"
        >
          Lihat Peta
        </button>
      </div>
      <div id="map" class="min-h-[60vh]"></div>
      <canvas id="peramalan-chart" class="min-w-full bg-white"></canvas>
      {html`
        <script>
          $(document).ready(async function () {
            function getColor(d) {
              return d > 10
                ? '#e3180e'
                : d > 5
                  ? '#db8c0d'
                  : d > 3
                    ? '#42cf1b'
                    : '#166301';
            }
            const map = L.map('map').setView([-6.8673915, 106.9443265], 11);
            const info = L.control({
              position: 'bottomright',
            });
            info.onAdd = function (map) {
              const div = L.DomUtil.create('div', 'info legend'),
                grades = [0, 3, 5, 10],
                labels = [];

              for (let i = 0; i < grades.length; i++) {
                div.innerHTML +=
                  '<i style="background:' +
                  getColor(grades[i] + 1) +
                  '"></i>' +
                  grades[i] +
                  (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
              }
              return div;
            };
            info.addTo(map);
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
            $('#dropdown-mt').select2();
            const ctx = document.getElementById('peramalan-chart');
            let chart = null;

            $('#filter-prakiraan').click(function () {
              const kodeOptList = $('#dropdown-opt').val();

              if (!kodeOptList || kodeOptList.length === 0) return;
              $.ajax({
                url: '/app/dashboard/map',
                method: 'GET',
                data: {
                  kode_opt: kodeOptList,
                },
                success: (res) => {
                  const layerGroup = [];
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
                    })
                      .on('mouseover', function ({ layer }) {
                        layer.bindTooltip(data.nama_kabkot).openTooltip();
                      })
                      .on('click', function ({ layer }) {
                        map.fitBounds(layer.getBounds());
                      });
                    layerGroup.push(poly);
                  });
                  if (!!chart) chart.destroy();
                  chart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                      labels: res.data.map((value) => value.nama_kabkot),
                      datasets: [
                        {
                          label: 'Rasio KLTS terhadap Prakiraan Serangan',
                          data: res.data.map((value) => value.rasio),
                        },
                      ],
                    },
                  });
                  const regencies = L.featureGroup(layerGroup).addTo(map);
                  map.fitBounds(regencies.getBounds());
                },
              });
            });
          });
        </script>
      `}
    </div>
  );
};

export default DashboardPage;
