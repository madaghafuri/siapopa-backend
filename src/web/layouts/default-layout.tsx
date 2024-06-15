import { MainLayout } from "./main-layout";

export const DefaultLayout = ({ children }: { children?: any }) => (
  <MainLayout>
    <div class="grid min-h-[7vh] grid-cols-6 items-center justify-center gap-5 border-b-2 px-10 py-2">
      <button>
        <i class="fa-solid fa-bars"></i>
      </button>
      <img src="/assets/logo@2x.svg" alt="" />
      <div class="col-span-4 grid grid-cols-subgrid items-center gap-5">
        <h1 class="col-start-4">Hello World</h1>
      </div>
    </div>
    <div class="flex min-h-[93vh]">
      <section class="flex min-w-[20%] flex-col border-r-2 px-5 py-10">
        <button class="ubuntu-regular rounded-md bg-primary px-4 py-2 text-left text-white">
          Dashboard
        </button>
      </section>
      {children}
    </div>
  </MainLayout>
);
