import { JSX } from 'hono/jsx';

const Select = ({
  children,
  ...props
}: JSX.SelectElement & { children: any }) => {
  return <select {...props}>{children}</select>;
};
export { Select };
