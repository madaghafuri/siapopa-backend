import { MainLayout } from "./main-layout.js";

export const DefaultLayout = ({
  children,
  route,
}: {
  children?: any;
  route: string;
}) => (
  <MainLayout>
    <div class="grid min-h-[7vh] grid-cols-6 items-center justify-center gap-5 border-b-2 px-10 py-2">
      <button>
        <i class="fa-solid fa-bars"></i>
      </button>
      <img src="/assets/logo@2x.svg" alt="" />
      <div class="col-span-4 grid grid-cols-subgrid items-center gap-5">
        <button class="border-1 col-start-4 rounded-md">Avatar</button>
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
        <button class="rounded-md px-4 py-2 text-left">Charts</button>
        <button class="rounded-md px-4 py-2 text-left">Laporan</button>
        <a href="/app/data-lokasi">
          <button
            class={`rounded-md px-4 py-2 text-left ${route === "data-lokasi" ? "bg-primary text-white" : ""}`}
          >
            Data Lokasi
          </button>
        </a>
      </section>
      <div class="grow">{children}</div>
    </div>
  </MainLayout>
);
