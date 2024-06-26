import { MainLayout } from "./main-layout.js";

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
    <div class="grid min-h-[7vh] grid-cols-12 items-center justify-center gap-5 border-b-2 px-10 py-2">
      <button>
        <i class="fa-solid fa-bars"></i>
      </button>
      <img class="col-span-2" src="/assets/logo@2x.svg" alt="" />
      <div class="col-start-12 grid grid-cols-subgrid items-center gap-5">
        {authNavigation || null}
      </div>
    </div>
    <div class="flex min-h-[93vh]">
      <section class="flex w-2/12 flex-col gap-4 border-r-2 px-5 py-10">
        <a href="/app/dashboard">
          <button
            class={`rounded-md px-4 py-2 text-left ${route === "dashboard" ? "bg-primary text-white" : ""}`}
          >
            Dashboard
          </button>
        </a>
        <div class="rounded-md border">
          <button
            class={`flex w-full items-center justify-between gap-5 border-b-2 px-4 py-2 text-left ${route === "input-data" ? "bg-primary text-white" : ""}`}
            type="button"
            _="on click toggle between .hidden and .flex on #input-dropdown then toggle between .rotate-90 and .-rotate-90 on #dropdown-icon"
          >
            Input Data
            <i id="dropdown-icon" class="fa-solid fa-caret-right"></i>
          </button>
          <div
            id="input-dropdown"
            class="opening expanding hidden flex-col gap-3 p-5"
          >
            <a
              href="/app/input/tanaman"
              class={`rounded-md px-4 py-2 text-left ${route === "input-tanaman" ? "bg-primary text-white" : ""}`}
            >
              Tanaman
            </a>
            <a href="">Tanaman</a>
            <a href="">Tanaman</a>
          </div>
        </div>
        <a>
          <button
            class={`rounded-md px-4 py-2 text-left ${route === "data-lokasi" ? "bg-primary text-white" : ""}`}
          >
            Laporan
          </button>
        </a>
      </section>
      <div class="grow">{children}</div>
    </div>
  </MainLayout>
);
