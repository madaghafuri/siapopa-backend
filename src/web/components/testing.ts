import { html } from 'hono/html';

export const Foo = async () =>
  await html`
    <div>
      <script>
        const ctx = new document.getElementById('laporan-harian-chart');
      </script>
    </div>
  `;
