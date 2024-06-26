import { Hono } from "hono";
import "typed-htmx";

declare global {
  namespace Hono {
    interface HTMLAttributes extends HtmxAttributes {}
  }
}
