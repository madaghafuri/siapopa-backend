import 'typed-htmx';

declare module 'hono/jsx' {
  namespace JSX {
    interface HTMLAttributes extends HtmxAttributes {}
    interface SelectElement extends Partial<HTMLSelectElement> {
      form?: string;
      translate?: 'yes' | 'no';
    }
    interface TableElement extends Partial<HTMLTableElement> {}
    interface IntrinsicElements {
      div: HTMLDivElement & HtmxAttributes;
    }
  }
}

declare global {
  namespace Hono {
    interface HTMLAttributes extends HtmxAttributes {}
    interface IntrinsicElements {
      div: HTMLAttributes & HtmxAttributes;
      table: Partial<HTMLTableElement> & Partial<HtmxAttributes>;
    }
  }
}
