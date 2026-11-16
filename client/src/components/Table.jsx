// Simple data table. Pass `empty` (a message) instead of rows to show an empty state.
export default function Table({ headers, empty, children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className="bg-surface-2 px-4 py-3.5 text-left text-xs font-semibold tracking-wider whitespace-nowrap text-muted uppercase">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr]:border-t [&>tr]:border-line [&>tr:hover]:bg-surface-2/60 [&_td]:px-4 [&_td]:py-3.5 [&_td]:align-top">
          {empty ? (
            <tr><td colSpan={headers.length} className="py-12! text-center text-muted">{empty}</td></tr>
          ) : children}
        </tbody>
      </table>
    </div>
  );
}

export function Tab({ active, onClick, label, count }) {
  return (
    <button
      role="tab" aria-selected={active} onClick={onClick}
      className={`-mb-px flex cursor-pointer items-center gap-2 border-b-2 px-3 py-4 font-semibold whitespace-nowrap ${
        active ? "border-primary text-ink" : "border-transparent text-muted hover:text-ink"
      }`}
    >
      {label}
      <span className={`rounded-full px-2 text-xs ${active ? "bg-primary-soft text-primary" : "bg-surface-2"}`}>{count}</span>
    </button>
  );
}
