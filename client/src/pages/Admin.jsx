import { useCallback, useEffect, useMemo, useState } from "react";
import { api, formatDate, formatDateTime } from "../api.js";
import Layout from "../components/Layout.jsx";
import Spinner from "../components/Spinner.jsx";
import { Stars } from "../components/StarRating.jsx";

const MEALS = ["Breakfast", "Lunch", "Dinner"];
const CATEGORIES = ["Food Quality", "Cleanliness", "Staff Behaviour", "Other"];

const MEAL_PILLS = {
  Breakfast: "bg-warn-soft text-warn",
  Lunch: "bg-primary-soft text-primary",
  Dinner: "bg-accent-soft text-accent"
};
const STATUS_PILLS = {
  Pending: "bg-warn-soft text-warn",
  "In Progress": "bg-accent-soft text-accent",
  Resolved: "bg-success-soft text-success"
};

function average(list) {
  if (list.length === 0) return null;
  return list.reduce((sum, item) => sum + item.rating, 0) / list.length;
}

function StatCard({ label, value, hint, valueClass = "" }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl border border-line bg-surface p-5 shadow-card">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <strong className={`text-[1.6rem] font-extrabold tracking-tight tabular-nums sm:text-[2rem] ${valueClass}`}>{value}</strong>
      <span className="text-xs text-muted">{hint}</span>
    </div>
  );
}

function BarList({ title, items }) {
  return (
    <div className="card">
      <h2 className="mb-4.5 text-lg font-bold tracking-tight">{title}</h2>
      <ul className="grid gap-4">
        {items.map((item) => (
          <li key={item.label}>
            <div className="mb-1.5 flex justify-between text-sm font-medium">
              <span>{item.label}</span>
              <span className="text-muted">{item.detail}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-2">
              <div className={`h-full rounded-full transition-[width] duration-500 ${item.barClass}`} style={{ width: `${item.percent}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MealBreakdown({ ratings }) {
  const items = MEALS.map((meal) => {
    const forMeal = ratings.filter((r) => r.mealType === meal);
    const avg = average(forMeal);
    return {
      label: meal,
      detail: avg ? `${avg.toFixed(1)} · ${forMeal.length} rating${forMeal.length === 1 ? "" : "s"}` : "No ratings",
      percent: ((avg || 0) / 5) * 100,
      barClass: "bg-linear-to-r from-star to-primary"
    };
  });
  return <BarList title="Average by meal" items={items} />;
}

function CategoryBreakdown({ complaints }) {
  const counts = CATEGORIES.map((category) => complaints.filter((c) => c.category === category).length);
  const max = Math.max(1, ...counts);
  const items = CATEGORIES.map((category, i) => ({
    label: category,
    detail: counts[i],
    percent: (counts[i] / max) * 100,
    barClass: "bg-accent"
  }));
  return <BarList title="Complaints by category" items={items} />;
}

function Toolbar({ search, onSearch, placeholder, filter, onFilter, options, filterLabel, allLabel }) {
  return (
    <div className="flex flex-wrap gap-2.5 border-b border-line p-4">
      <input
        type="search" className="input max-w-90 flex-[1_1_220px]" placeholder={placeholder}
        value={search} onChange={(e) => onSearch(e.target.value)}
      />
      <select className="input w-auto min-w-35" value={filter} onChange={(e) => onFilter(e.target.value)} aria-label={filterLabel}>
        <option value="">{allLabel}</option>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </div>
  );
}

function Table({ headers, empty, children }) {
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

function RatingsTable({ ratings }) {
  const [meal, setMeal] = useState("");
  const [search, setSearch] = useState("");
  const rows = ratings.filter((r) =>
    (!meal || r.mealType === meal) && r.studentName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Toolbar
        search={search} onSearch={setSearch} placeholder="Search by student"
        filter={meal} onFilter={setMeal} options={MEALS} filterLabel="Filter by meal" allLabel="All meals"
      />
      <Table
        headers={["Student", "Meal", "Meal date", "Rating", "Submitted"]}
        empty={rows.length === 0 && (ratings.length ? "No ratings match your filters." : "No ratings yet.")}
      >
        {rows.map((r) => (
          <tr key={r.id}>
            <td className="font-semibold">{r.studentName}</td>
            <td><span className={`pill ${MEAL_PILLS[r.mealType]}`}>{r.mealType}</span></td>
            <td className="whitespace-nowrap">{formatDate(r.mealDate)}</td>
            <td><Stars value={r.rating} /></td>
            <td className="whitespace-nowrap text-muted">{formatDateTime(r.createdAt)}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}

function ComplaintsTable({ complaints }) {
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const query = search.toLowerCase();
  const rows = complaints.filter((c) =>
    (!category || c.category === category) &&
    (c.studentName.toLowerCase().includes(query) || c.description.toLowerCase().includes(query))
  );

  return (
    <>
      <Toolbar
        search={search} onSearch={setSearch} placeholder="Search student or description"
        filter={category} onFilter={setCategory} options={CATEGORIES} filterLabel="Filter by category" allLabel="All categories"
      />
      <Table
        headers={["Student", "Category", "Description", "Status", "Submitted"]}
        empty={rows.length === 0 && (complaints.length ? "No complaints match your filters." : "No complaints yet.")}
      >
        {rows.map((c) => (
          <tr key={c.id}>
            <td className="font-semibold">{c.studentName}</td>
            <td>{c.category}</td>
            <td className="min-w-65 max-w-105 whitespace-pre-wrap [overflow-wrap:anywhere]">{c.description}</td>
            <td>
              <span className={`pill inline-flex items-center gap-1.5 before:size-1.5 before:rounded-full before:bg-current ${STATUS_PILLS[c.status]}`}>
                {c.status}
              </span>
            </td>
            <td className="whitespace-nowrap text-muted">{formatDateTime(c.createdAt)}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}

function Tab({ active, onClick, label, count }) {
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

export default function Admin() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("ratings");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api("/api/admin/submissions"));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    if (!data) return null;
    const avg = average(data.ratings);
    return {
      avg: avg ? avg.toFixed(1) : "—",
      ratings: data.ratings.length,
      complaints: data.complaints.length,
      pending: data.complaints.filter((c) => c.status === "Pending").length
    };
  }, [data]);

  const refreshButton = (
    <button className="btn-ghost" onClick={load} disabled={loading}>
      {loading ? <Spinner className="text-primary" /> : "↻ Refresh"}
    </button>
  );

  return (
    <Layout
      eyebrow="Admin portal" title="Feedback dashboard"
      subtitle="An overview of every meal rating and complaint from students."
      actions={refreshButton}
    >
      {error && (
        <p role="alert" className="mb-5 rounded-xl bg-danger-soft px-3.5 py-3 text-sm font-medium text-danger">{error}</p>
      )}

      {!data && loading && <div className="grid place-items-center py-20 text-primary"><Spinner size="lg" /></div>}

      {data && (
        <>
          <section className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Average rating" value={stats.avg} hint="out of 5" valueClass="text-primary" />
            <StatCard label="Meal ratings" value={stats.ratings} hint="total submitted" />
            <StatCard label="Complaints" value={stats.complaints} hint="total submitted" />
            <StatCard label="Pending" value={stats.pending} hint="awaiting action" valueClass={stats.pending ? "text-warn" : ""} />
          </section>

          <section className="mb-5 grid gap-5 lg:grid-cols-2">
            <MealBreakdown ratings={data.ratings} />
            <CategoryBreakdown complaints={data.complaints} />
          </section>

          <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
            <div role="tablist" className="flex gap-1 border-b border-line px-4">
              <Tab active={tab === "ratings"} onClick={() => setTab("ratings")} label="Meal ratings" count={data.ratings.length} />
              <Tab active={tab === "complaints"} onClick={() => setTab("complaints")} label="Complaints" count={data.complaints.length} />
            </div>
            {tab === "ratings" ? <RatingsTable ratings={data.ratings} /> : <ComplaintsTable complaints={data.complaints} />}
          </section>
        </>
      )}
    </Layout>
  );
}
