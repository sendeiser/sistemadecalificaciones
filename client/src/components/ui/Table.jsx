import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Table = ({ columns, data, onRowClick, className }) => (
  <div className={twMerge('w-full overflow-hidden border border-tech-surface rounded-xl shadow-xl', className)}>
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-tech-primary">
            {columns.map(col => (
              <th
                key={col.key}
                className={twMerge(
                  clsx(
                    'px-4 py-4 text-left text-[0.625rem] font-black tracking-[0.2em] uppercase text-tech-muted border-b border-tech-surface',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                  ),
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-tech-surface">
          {data.map((row, i) => (
            <tr
              key={row.id ?? i}
              onClick={() => onRowClick?.(row)}
              className={twMerge(
                clsx(
                  'transition-colors duration-150',
                  onRowClick && 'cursor-pointer',
                  'hover:bg-tech-primary/50',
                ),
              )}
            >
              {columns.map(col => (
                <td
                  key={col.key}
                  className={twMerge(
                    clsx(
                      'px-4 py-4 text-sm text-tech-text',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      col.mono && 'font-mono text-xs',
                    ),
                  )}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default Table;
