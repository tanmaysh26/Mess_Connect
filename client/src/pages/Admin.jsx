import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, formatDate, formatDateTime } from "../api.js";
import Layout from "../components/Layout.jsx";
import { MEALS, MealPill, STATUSES, StatusPill } from "../components/Pills.jsx";
import Spinner from "../components/Spinner.jsx";
import { Stars } from "../components/StarRating.jsx";
import Table, { Tab } from "../components/Table.jsx";

const CATEGORIES = ["Food Quality", "Cleanliness", "Staff Behaviour", "Other"];

const STATUS_BARS = {
  Pending: "bg-warn",
  "In Progress": "bg-accent",
  Resolved: "bg-success"
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

// Average rating per meal type, as calculated by the server summary (FR-013).
function MealBreakdown({ averageByMeal }) {
  const items = MEALS.map((meal) => {
    const { average: avg, count } = averageByMeal[meal];
    return {
      label: meal,
      detail: avg ? `${avg.toFixed(1)} · ${count} rating${count === 1 ? "" : "s"}` : "No ratings",
      percent: ((avg || 0) / 5) * 100,
      barClass: "bg-linear-to-r from-star to-primary"
    };
  });
  return <BarList title="Average by meal" items={items} />;
}

// Complaint counts per status, as calculated by the server summary (FR-014).
function StatusBreakdown({ complaintCounts }) {
  const max = Math.max(1, ...STATUSES.map((status) => complaintCounts[status]));
  const items = STATUSES.map((status) => ({
    label: status,
    detail: complaintCounts[status],
    percent: (complaintCounts[status] / max) * 100,
    barClass: STATUS_BARS[status]
  }));
  return <BarList title="Complaints by status" items={items} />;
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

function FilterSelect({ value, onChange, options, label, allLabel }) {
  return (
    <select className="input w-auto min-w-35" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      <option value="">{allLabel}</option>
      {options.map((option) => <option key={option}>{option}</option>)}
    </select>
  );
}

function Toolbar({ search, onSearch, placeholder, children }) {
  return (
    <div className="flex flex-wrap gap-2.5 border-b border-line p-4">
      <input
        type="search" className="input max-w-90 flex-[1_1_220px]" placeholder={placeholder}
        value={search} onChange={(e) => onSearch(e.target.value)}
      />
      {children}
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
      <Toolbar search={search} onSearch={setSearch} placeholder="Search by student">
        <FilterSelect value={meal} onChange={setMeal} options={MEALS} label="Filter by meal" allLabel="All meals" />
      </Toolbar>
      <Table
        headers={["Student", "Meal", "Meal date", "Rating", "Submitted"]}
        empty={rows.length === 0 && (ratings.length ? "No ratings match your filters." : "No ratings yet.")}
      >
        {rows.map((r) => (
          <tr key={r.id}>
            <td className="font-semibold">{r.studentName}</td>
            <td><MealPill meal={r.mealType} /></td>
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
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const query = search.toLowerCase();
  const rows = complaints.filter((c) =>
    (!category || c.category === category) &&
    (!status || c.status === status) &&
    (c.studentName.toLowerCase().includes(query) || c.description.toLowerCase().includes(query))
  );

  return (
    <>
      <Toolbar search={search} onSearch={setSearch} placeholder="Search student or description">
        <FilterSelect value={status} onChange={setStatus} options={STATUSES} label="Filter by status" allLabel="All statuses" />
        <FilterSelect value={category} onChange={setCategory} options={CATEGORIES} label="Filter by category" allLabel="All categories" />
      </Toolbar>
      <Table
        headers={["Student", "Category", "Description", "Status", "Submitted", ""]}
        empty={rows.length === 0 && (complaints.length ? "No complaints match your filters." : "No complaints yet.")}
      >
        {rows.map((c) => (
          <tr key={c.id}>
            <td className="font-semibold">{c.studentName}</td>
            <td>{c.category}</td>
            <td className="min-w-65 max-w-105 whitespace-pre-wrap [overflow-wrap:anywhere]">{c.description}</td>
            <td><StatusPill status={c.status} /></td>
            <td className="whitespace-nowrap text-muted">{formatDateTime(c.createdAt)}</td>
            <td>
              <Link to={`/admin/complaints/${c.id}`} className="btn-ghost min-h-9 px-3.5 text-sm">Open</Link>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}

export default function Admin() {
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  // The open tab lives in the URL so "Back to complaints" from the detail page lands on it.
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "complaints" ? "complaints" : "ratings";
  const setTab = (name) => setParams(name === "ratings" ? {} : { tab: name }, { replace: true });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [submissions, summaryData] = await Promise.all([
        api("/api/admin/submissions"),
        api("/api/admin/summary")
      ]);
      setData(submissions);
      setSummary(summaryData);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    if (!data || !summary) return null;
    const avg = average(data.ratings);
    return {
      avg: avg ? avg.toFixed(1) : "—",
      ratings: data.ratings.length,
      complaints: summary.complaintCounts.total,
      pending: summary.complaintCounts.Pending
    };
  }, [data, summary]);

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

      {data && summary && (
        <>
          <section className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Average rating" value={stats.avg} hint="out of 5" valueClass="text-primary" />
            <StatCard label="Meal ratings" value={stats.ratings} hint="total submitted" />
            <StatCard label="Complaints" value={stats.complaints} hint="total submitted" />
            <StatCard label="Pending" value={stats.pending} hint="awaiting action" valueClass={stats.pending ? "text-warn" : ""} />
          </section>

          <section className="mb-5 grid gap-5 lg:grid-cols-3">
            <MealBreakdown averageByMeal={summary.averageByMeal} />
            <StatusBreakdown complaintCounts={summary.complaintCounts} />
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
