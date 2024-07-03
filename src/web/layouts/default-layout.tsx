import { MainLayout } from './main-layout.js';

export const DefaultLayout = ({
  children,
  route,
  authNavigation,
}: {
  children?: any;
  route: string;
  authNavigation?: any;
}) => (
  <MainLayout>
    <div class="grid max-h-[10vh] grid-cols-12 items-center gap-5 border-b-2 py-3 pr-6">
      <button>
        <i class="fa-solid fa-bars"></i>
      </button>
      <img class="col-span-2" src="/assets/logo@2x.svg" alt="" />
      <div class="col-span-3 col-start-12 grid items-center gap-5">
        {authNavigation || null}
      </div>
    </div>
    <div class="flex h-full max-h-[90vh]">
      <section class="flex w-2/12 flex-col gap-4 border-r-2 px-5 py-10">
        <a href="/app/dashboard">
          <button
            class={`rounded-md px-4 py-2 text-left ${route === 'dashboard' ? 'bg-primary text-white' : ''}`}
          >
            Dashboard
          </button>
        </a>
        <div class="rounded-md border">
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
          </div>
        </div>
        <a href="/app/lokasi">
          <button
            class={`rounded-md px-4 py-2 text-left ${route === 'data-lokasi' ? 'bg-primary text-white' : ''}`}
          >
            Laporan
          </button>
        </a>
      </section>
      <div class="grow">{children}</div>
    </div>
  </MainLayout>
);
