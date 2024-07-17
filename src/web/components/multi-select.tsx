import { html } from 'hono/html';

export const MultiSelect = () => {
  return (
    <div x-data="{ open: false }">
      <div x-show="open">Content...</div>
      {html`
        <script>
          $('');
        </script>
      `}
    </div>
  );
};
