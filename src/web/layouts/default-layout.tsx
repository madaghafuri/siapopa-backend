import { SelectUserGroup } from '../../db/schema/user-group.js';
import { SelectUser } from '../../db/schema/user.js';
import { MainLayout } from './main-layout.js';

export const DefaultLayout = ({
  children,
  route,
  authNavigation,
}: {
  children?: any;
  route: string;
  authNavigation?: any;
  user?: SelectUser & { userGroup: SelectUserGroup };
}) => (
  <MainLayout>
    <div class="grid max-h-[10vh] grid-cols-12 items-center gap-5 border-b-2">
      <button _="on click toggle between .flex and .hidden on #side-nav then toggle between .{'w-10/12'} and .{'w-full'} on #main-content">
        <i class="fa-solid fa-bars"></i>
      </button>
      <img src="/assets/logo1x.svg" alt="" />
      <div class="col-span-2 col-start-10 items-center">
        {authNavigation || (
          <a href="/login">
            <button class="rounded border bg-primary px-2 py-1 text-white">
              Login
            </button>
          </a>
        )}
      </div>
    </div>
    <div class="flex h-full max-h-[90vh]">
      <section
        id="side-nav"
        class="opening closing flex w-2/12 flex-col gap-4 truncate border-r-2 px-5 py-10 text-sm"
      >
        <a href="/app/dashboard">
          <button
            class={`rounded-md px-4 py-2 text-left ${route === 'dashboard' ? 'bg-primary text-white' : ''}`}
          >
            Dashboard
          </button>
        </a>
        <div class="max-w-full rounded-md border">
          <button
            class={`flex w-full items-center justify-between gap-5 border-b-2 px-4 py-2 text-left ${route === 'input-data' ? 'bg-primary text-white' : ''}`}
            type="button"
            _="on click toggle between .hidden and .flex on #input-dropdown then toggle .rotate-90 on #dropdown-icon"
          >
            Master Data
            <i id="dropdown-icon" class="fa-solid fa-caret-right"></i>
          </button>
          <div id="input-dropdown" class="opening hidden flex-col gap-3 p-5">
            <a
              href="/app/master/user"
              class={`rounded-md px-4 py-2 text-left ${route === 'user' ? 'bg-primary text-white' : ''}`}
            >
              User
            </a>
            <a
              href="/app/master/usergroup"
              class={`rounded-md px-4 py-2 text-left ${route === 'usergroup' ? 'bg-primary text-white' : ''}`}
            >
              User Group
            </a>
            <a
              href="/app/master/tanaman"
              class={`rounded-md px-4 py-2 text-left ${route === 'tanaman' ? 'bg-primary text-white' : ''}`}
            >
              Tanaman
            </a>
            <a
              href="/app/master/opt"
              class={`rounded-md px-4 py-2 text-left ${route === 'opt' ? 'bg-primary text-white' : ''}`}
            >
              OPT
            </a>
            <a
              href="/app/master/lokasi"
              class={`rounded-md px-4 py-2 text-left ${route === 'lokasi' ? 'bg-primary text-white' : ''}`}
            >
              Lokasi
            </a>
            <a
              href="/app/master/kabkot"
              class={`rounded-md px-4 py-2 text-left ${route === 'kabupaten-kota' ? 'bg-primary text-white' : ''}`}
            >
              Kabupaten Kota
            </a>
          </div>
        </div>
        <div class="max-w-full rounded-md border">
          <button
            class="flex w-full items-center justify-between gap-5 truncate border-b-2 px-4 py-2 text-left"
            type="button"
            _="on click toggle between .hidden and .flex on #laporan-stock-dropdown then toggle .rotate-90 on #laporan-stock-icon"
          >
            Laporan Stock
            <i id="laporan-stock-icon" class="fa-solid fa-caret-right"></i>
          </button>
          <div id="laporan-stock-dropdown" class="opening hidden flex-col gap-3 p-5">
            <a
              href="/app/stock/golongan-pestisida"
              class={`rounded-md px-4 py-2 text-left ${route === 'golongan-pestisida' ? 'bg-primary text-white' : ''}`}
            >
              Golongan Pestisida
            </a>
            <a
              href="/app/stock/bahan-aktif"
              class={`rounded-md px-4 py-2 text-left ${route === 'bahan-aktif' ? 'bg-primary text-white' : ''}`}
            >
              Bahan Aktif
            </a>
            <a
              href="/app/stock/stock-pestisida"
              class={`rounded-md px-4 py-2 text-left ${route === 'stock-pestisida' ? 'bg-primary text-white' : ''}`}
            >
              Stock Pestisida
            </a>
            <a
              href="/app/master/peramalan"
              class={`rounded-md px-4 py-2 text-left ${route === 'peramalan' ? 'bg-primary text-white' : ''}`}
            >
              Peramalan
            </a>
          </div>
        </div>
        <div class="max-w-full rounded-md border">
          <button
            class="flex w-full items-center justify-between gap-5 truncate border-b-2 px-4 py-2 text-left"
            type="button"
            _="on click toggle between .hidden and .flex on #laporan-dropdown then toggle .rotate-90 on #laporan-icon"
          >
            Laporan
            <i id="laporan-icon" class="fa-solid fa-caret-right"></i>
          </button>
          <div id="laporan-dropdown" class="opening hidden flex-col gap-3 p-5">
            <a
              href="/app/laporan/pengamatan"
              class={`truncate rounded-md px-4 py-2 text-left ${route === 'pengamatan' ? 'bg-primary text-white' : ''}`}
            >
              Pengamatan
            </a>
            <a
              href="/app/laporan/harian"
              class={`truncate rounded-md px-4 py-2 text-left ${route === 'laporan-harian' ? 'bg-primary text-white' : ''}`}
            >
              Laporan Harian
            </a>
            <a
              href="/app/laporan/sb"
              class={`truncate rounded-md px-4 py-2 text-left ${route === 'laporan-sb' ? 'bg-primary text-white' : ''}`}
            >
              Laporan Setengah Bulan
            </a>
            <a
              href="/app/laporan/bulanan"
              class={`truncate rounded-md px-4 py-2 text-left ${route === 'laporan-bulanan' ? 'bg-primary text-white' : ''}`}
            >
              Laporan Bulanan
            </a>
            <a
              href="/app/laporan/musiman"
              class={`truncate rounded-md px-4 py-2 text-left ${route === 'laporan-musiman' ? 'bg-primary text-white' : ''}`}
            >
              Laporan Musiman
            </a>
          </div>
        </div>
      </section>
      <div id="main-content" class="w-10/12 bg-background">
        {children}
      </div>
    </div>
  </MainLayout>
);
