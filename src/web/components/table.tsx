import { JSX } from "hono/jsx";

export type ColumnHeader<T extends Object = any> = {
  field?: keyof T;
  headerName: string;
  span?:
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12';
  valueGetter?: (row: T) => T[keyof T] | any;
};

const Table = ({
  rowsData,
  columns,
  ...props
}: {
  children?: any;
  rowsData: any[];
  columns: ColumnHeader[];
} & JSX.TableElement) => {
  return (
    //@ts-ignore
    <table class="grid grid-cols-12" {...props}>
      <tr class="grid auto-cols-fr grid-flow-col grid-cols-12">
        {columns.map((col) => {
          return (
            <th
              class={`border-b border-gray-200 px-4 py-2 text-sm font-semibold capitalize text-blue-500 ${colSpan[col.span]}`}
            >
              {col.headerName}
            </th>
          );
        })}
      </tr>
      <tbody id="#table-body">
        {rowsData.map((row) => {
          return (
            <tr
              key={row.id}
              class="grid auto-cols-fr grid-flow-col grid-cols-12"
            >
              {columns.map((column) => {
                return (
                  <td
                    class={`border-b border-r border-gray-200 px-4 py-2 text-left text-sm font-normal ${colSpan[column.span]}`}
                  >
                    {row[column.field]}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export const colSpan = {
  '1': 'col-span-1',
  '2': 'col-span-2',
  '3': 'col-span-3',
  '4': 'col-span-4',
  '5': 'col-span-5',
  '6': 'col-span-6',
  '7': 'col-span-7',
  '8': 'col-span-8',
  '9': 'col-span-9',
  '10': 'col-span-10',
  '11': 'col-span-11',
  '12': 'col-span-12',
};

export { Table };
