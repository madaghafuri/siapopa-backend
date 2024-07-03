import { Hono } from 'hono';
import 'typed-htmx';
import { Alpine } from 'alpinejs';
import { Session } from 'hono-sessions';

declare global {
  namespace Hono {
    interface HTMLAttributes extends HtmxAttributes { }
  }
  interface Window {
    Alpine: Alpine;
  }
}
