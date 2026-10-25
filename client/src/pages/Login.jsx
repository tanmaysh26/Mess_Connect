import { useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../App.jsx";
import { Logo } from "../components/Layout.jsx";
import Notice from "../components/Notice.jsx";
import Spinner from "../components/Spinner.jsx";

const DEMO_ACCOUNTS = [
  { role: "Student", email: "24ucs023@lnmiit.ac.in", pill: "bg-accent-soft text-accent" },
  { role: "Admin", email: "tanmaysharma@lnmiit.ac.in", pill: "bg-primary-soft text-primary" }
];

const HERO_POINTS = [
  { icon: "★", text: "Rate meals from 1 to 5" },
  { icon: "✎", text: "Report issues to the mess team" },
  { icon: "▤", text: "Admins see every submission" }
];

export default function Login() {
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setNotice(null);
    try {
      const data = await api("/api/login", { method: "POST", body: { email, password } });
      setUser(data.user);
    } catch (error) {
      setNotice({ type: "error", text: error.message });
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="flex flex-col justify-between gap-5 bg-[radial-gradient(circle_at_20%_110%,rgb(255_212_59/0.35),transparent_50%),radial-gradient(circle_at_90%_0%,rgb(255_255_255/0.15),transparent_40%),linear-gradient(150deg,#e8590c,#c2410c_60%,#9a3412)] px-6 py-7 text-white lg:gap-10 lg:p-12">
        <div className="flex items-center gap-2.5 text-[1.05rem] font-extrabold tracking-tight">
          <Logo size="sm" className="bg-none! bg-white/20! shadow-none!" /> MessConnect
        </div>
        <div>
          <h2 className="mb-4 max-w-[14ch] text-[clamp(1.8rem,3.4vw,2.75rem)] leading-[1.15] font-extrabold tracking-tight">
            Better meals start with honest feedback.
          </h2>
          <p className="max-w-[42ch] text-[1.05rem] opacity-90">
            Rate every breakfast, lunch and dinner, raise issues in seconds, and help the mess team see what students actually think.
          </p>
        </div>
        <ul className="hidden gap-3 lg:grid">
          {HERO_POINTS.map((point) => (
            <li key={point.text} className="flex items-center gap-3 font-medium">
              <span className="grid size-8 place-items-center rounded-[10px] bg-white/20">{point.icon}</span>
              {point.text}
            </li>
          ))}
        </ul>
      </aside>

      <main className="grid place-items-center px-6 py-10">
        <form className="w-full max-w-100" onSubmit={handleSubmit}>
          <Logo size="lg" className="mb-4.5" />
          <h1 className="mb-1.5 text-[clamp(1.6rem,3vw,2.1rem)] font-extrabold tracking-tight">Welcome back</h1>
          <p className="mb-7 text-muted">Log in to your MessConnect account.</p>

          <div className="mb-5 flex flex-col gap-2">
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email" type="email" autoComplete="username" placeholder="you@lnmiit.ac.in" className="input"
              value={email} onChange={(e) => setEmail(e.target.value)} required
            />
          </div>

          <div className="mb-5 flex flex-col gap-2">
            <label htmlFor="password" className="label">Password</label>
            <div className="relative">
              <input
                id="password" type={showPassword ? "text" : "password"} autoComplete="current-password"
                placeholder="Enter your password" className="input pr-18"
                value={password} onChange={(e) => setPassword(e.target.value)} required
              />
              <button
                type="button" onClick={() => setShowPassword((s) => !s)}
                className="absolute top-1/2 right-1.5 -translate-y-1/2 cursor-pointer rounded-md px-2.5 py-1.5 text-sm font-semibold text-primary"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? <Spinner /> : "Log in"}
          </button>
          <Notice notice={notice} />

          <div className="mt-7 grid gap-2 rounded-xl border border-dashed border-line bg-surface-2 p-4 text-sm">
            <strong>Demo accounts</strong>
            {DEMO_ACCOUNTS.map((account) => (
              <button
                type="button" key={account.email}
                onClick={() => { setEmail(account.email); setNotice(null); }}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-surface px-2.5 py-2 text-left text-[0.85rem] [overflow-wrap:anywhere] hover:border-primary"
              >
                <span className={`pill ${account.pill}`}>{account.role}</span>
                {account.email}
              </button>
            ))}
            <p className="text-xs text-muted">Click an account to fill in the email. Passwords are in the README.</p>
          </div>
        </form>
      </main>
    </div>
  );
}
