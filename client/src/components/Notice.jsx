const STYLES = {
  success: { box: "bg-success-soft text-success", icon: "bg-success", symbol: "✓" },
  error: { box: "bg-danger-soft text-danger", icon: "bg-danger", symbol: "!" }
};

// Inline success / error message shown under a form.
export default function Notice({ notice, className = "mt-4" }) {
  if (!notice) return null;
  const style = STYLES[notice.type];
  return (
    <p role="status" className={`flex animate-fade-in items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm font-medium ${style.box} ${className}`}>
      <span aria-hidden="true" className={`grid size-5 flex-none place-items-center rounded-full text-xs font-extrabold text-surface ${style.icon}`}>
        {style.symbol}
      </span>
      {notice.text}
    </p>
  );
}
