import { html } from 'hono/html';
import { ColumnHeader } from './table';

export const TableHeader = ({ column }: { column: ColumnHeader[] }) => {
  return (
    <thead>
      <tr>
        {column.map((col) => (
          <th
            style="white-space: nowrap;"
            class="border border-gray-300 p-2 text-sm font-semibold capitalize text-blue-700"
          >
            {col.headerName}
          </th>
        ))}
      </tr>
    </thead>
  );
};

export const TableBody = ({
  rowData,
  column,
  ...props
}: {
  rowData: any[];
  column: ColumnHeader[];
} & Partial<Hono.HTMLAttributes>) => {
  return (
    <tbody {...props}>
      {rowData.length > 0 ? (
        rowData.map((row, index) => {
          return (
            <tr class="border-y border-gray-200 hover:bg-zinc-100">
              {column.map((col) => {
                return (
                  <td class="p-2" style="white-space: nowrap;">
                    {col.valueGetter?.(row, index) || row[col.field]}
                  </td>
                );
              })}
            </tr>
          );
        })
      ) : (
        <tr>
          <td colspan={100} class="p-2 text-center">
            No data available
          </td>
        </tr>
      )}
    </tbody>
  );
};

export const TablePagination = ({
  requestUrl,
  target,
}: {
  requestUrl: string;
  target: string;
}) => {
  return (
    <div class="flex items-center justify-center gap-5 px-3">
      <button id="prev-btn" class="rounded-md border border-gray-500 px-4 py-2">
        <i class="fa-solid fa-chevron-left"></i>
      </button>
      <span id="page-num"></span>
      <button id="next-btn" class="rounded-md border border-gray-500 px-4 py-2">
        <i class="fa-solid fa-chevron-right"></i>
      </button>
      {html`
        <script>
          $(document).ready(function () {
            const url = new URL($(location).attr('href'));
            let currentPage = parseInt(url.searchParams.get('page')) || 1;

            function updatePagination() {
              $('#page-num').text(currentPage.toString());
            }

            $('#prev-btn').on('click', function (event) {
              if (currentPage === 1) return;
              htmx.ajax(
                'GET',
                '${requestUrl}' + '?page=' + (currentPage - 1),
                '${target}'
              );
            });

            $('#next-btn').on('click', function (event) {
              htmx.ajax(
                'GET',
                '${requestUrl}' + '?page=' + (currentPage + 1),
                '${target}'
              );
            });

            htmx.on('htmx:afterSettle', function (event) {
              const url = new URL(
                event.detail.pathInfo.requestPath,
                window.location.origin
              );
              const pageParam = url.searchParams.get('page');
              if (pageParam) {
                currentPage = parseInt(pageParam);
                $('#page-num').html(pageParam);
                updatePagination();
              } else {
                currentPage = 1;
                updatePagination();
              }
            });

            updatePagination();
          });
        </script>
      `}
    </div>
  );
};

export const CustomTable = ({
  children,
  pagination,
  searchElement,
  ...props
}: {
  children: any;
  pagination?: any;
  searchElement?: any;
} & Partial<Hono.HTMLAttributes>) => {
  return (
    <div class="flex flex-col gap-3 rounded-md bg-soft py-5 shadow-lg">
      {searchElement || null}
      <div class="overflow-scroll">
        <table class="w-full max-w-full table-auto border-collapse" {...props}>
          {children}
        </table>
      </div>
      {pagination || null}
    </div>
  );
};
