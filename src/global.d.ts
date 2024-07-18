import 'typed-htmx';

declare module 'hono/jsx' {
  namespace JSX {
    interface HTMLAttributes extends HtmxAttributes {}
  }
}

declare global {
  namespace Hono {
    interface HTMLAttributes extends HtmxAttributes {}
  }
}
