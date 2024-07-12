import 'typed-htmx';

declare module 'hono/jsx' {
  namespace JSX {
    interface HTMLAttributes extends HtmxAttributes { }
    interface SelectElement extends Partial<HTMLSelectElement> {
      form?: string;
      translate?: 'yes' | 'no';
    }
    interface TableElement extends Partial<HTMLTableElement> { }
  }
}

declare global {
  namespace Hono {
    interface HTMLAttributes extends HtmxAttributes { }
    interface IntrinsicElements {
      div: HTMLDivElement & HtmxAttributes;
      table: Partial<HTMLTableElement> & Partial<HtmxAttributes>;
    }
  }
}
