import { DefaultLayout } from "../layouts/default-layout.js";

export default function DataLokasiPage({ route }: { route: string }) {
  return (
    <DefaultLayout route={route}>
      <div class="grid grid-cols-3 gap-5 p-3">
        <section class="">
          <h1 class="text-xl font-bold">Daftar Lokasi</h1>
          <form action="" class="rounded-md border"></form>
        </section>
        <section class="col-start-3">
          <h1 class="text-xl font-bold">Import from CSV or Excel</h1>
          <input type="file" accept=".csv, .xls, .xlsx" />
        </section>
      </div>
      <div class="p-3">Table Here</div>
    </DefaultLayout>
  );
}
