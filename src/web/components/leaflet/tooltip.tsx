import { html } from 'hono/html';

export const ToolTip = ({
  title = 'Title',
}: {
  title?: string;
  content?: {};
}) => html` <div>${title}</div> `;
