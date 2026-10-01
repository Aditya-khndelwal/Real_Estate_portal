export function DataTable({ columns, data, emptyMessage = 'No records found.' }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-semibold text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead className="bg-mist text-[10px] uppercase tracking-wider text-slate-400">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-5 py-3 font-bold sm:px-6">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {data.map((row, index) => (
            <tr key={row.id || index} className="group hover:bg-mist/60">
              {columns.map((col) => (
                <td key={col.key} className="px-5 py-4 sm:px-6">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
