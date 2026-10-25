import { useAuth } from "../App.jsx";

export function Logo({ size = "md", className = "" }) {
  const sizes = { sm: "size-[30px] text-[0.95rem]", lg: "size-13 text-2xl" };
  return (
    <span
      aria-hidden="true"
      className={`inline-grid place-items-center rounded-[30%] bg-linear-135 from-primary to-[#f08c00] font-extrabold text-white shadow-[0_4px_12px_rgb(232_89_12/0.3)] ${sizes[size]} ${className}`}
    >
      M
    </span>
  );
}

function initials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

export default function Layout({ eyebrow, title, subtitle, actions, children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line bg-surface/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5 text-[1.05rem] font-extrabold tracking-tight">
            <Logo size="sm" /> MessConnect
          </div>
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                {initials(user.name)}
              </span>
              <span className="hidden flex-col leading-tight sm:flex">
                <strong className="text-sm">{user.name}</strong>
                <small className="text-xs text-muted">{user.role}</small>
              </span>
            </div>
            <button className="btn-ghost" onClick={logout}>Log out</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-9 pb-16 sm:px-6">
        <section className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold tracking-widest text-primary uppercase">{eyebrow}</p>
            <h1 className="text-[clamp(1.6rem,3vw,2.1rem)] font-extrabold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1.5 text-muted">{subtitle}</p>}
          </div>
          {actions}
        </section>
        {children}
      </main>
    </div>
  );
}
