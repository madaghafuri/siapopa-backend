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
  valueGetter?: (row: T, index?: number) => T[keyof T] | any;
};

const Table = ({
  rowsData,
  columns,
  reloadBody,
  ...props
}: {
  children?: any;
  rowsData: any[];
  columns: ColumnHeader[];
  reloadBody?: string;
} & JSX.TableElement) => {
  return (
    //@ts-ignore
    <table class="bg-white border-t-2 border-t-secondary" style="width:100%" {...props}>
      <thead>
        <tr class="">
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
      </thead>

      <tbody hx-get={reloadBody} id="#table-body">
        {rowsData.map((row, index) => {
          return (
            <tr
              key={row.id}
              class=""
            >
              {columns.map((column) => {
                return (
                  <td
                    class={`border-b border-r border-gray-200 px-4 py-2 text-left text-sm font-normal ${colSpan[column.span]}`}
                  >
                    {column?.valueGetter?.(row, index) || row[column.field]}
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
