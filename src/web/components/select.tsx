import { JSX } from "hono/jsx";

const Select = ({
  children,
  ...props
}: JSX.SelectElement) => {
  return <select {...props}>{children}</select>;
};
export { Select };
