import { useCallback, useEffect, useState } from "react";
import { api, formatDate, formatDateTime } from "../api.js";
import { useAuth } from "../App.jsx";
import Layout from "../components/Layout.jsx";
import Notice from "../components/Notice.jsx";
import { MealPill, StatusPill } from "../components/Pills.jsx";
import Spinner from "../components/Spinner.jsx";
import StarRating, { Stars } from "../components/StarRating.jsx";
import Table, { Tab } from "../components/Table.jsx";

const MEALS = [
  { name: "Breakfast", icon: "☕" },
  { name: "Lunch", icon: "🍛" },
  { name: "Dinner", icon: "🍲" }
];
const CATEGORIES = ["Food Quality", "Cleanliness", "Staff Behaviour", "Other"];
const MAX_DESCRIPTION = 1000;

const today = () => new Date().toLocaleDateString("en-CA");

// Guess which meal the student most likely wants to rate from the current time.
function currentMeal() {
  const hour = new Date().getHours();
  if (hour < 11) return "Breakfast";
  if (hour < 17) return "Lunch";
  return "Dinner";
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function CardHeader({ icon, iconClass, title, subtitle }) {
  return (
    <div className="mb-6 flex items-center gap-3.5">
      <span className={`grid size-11 flex-none place-items-center rounded-xl text-xl ${iconClass}`}>{icon}</span>
      <div>
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>
    </div>
  );
}

function RatingForm({ onSaved }) {
  const [mealType, setMealType] = useState(currentMeal);
  const [mealDate, setMealDate] = useState(today);
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!rating) return setNotice({ type: "error", text: "Pick a rating from 1 to 5 stars." });
    setLoading(true);
    try {
      const data = await api("/api/ratings", { method: "POST", body: { mealType, mealDate, rating } });
      setNotice({ type: "success", text: data.message });
      setRating(0);
      onSaved();
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <CardHeader icon="★" iconClass="bg-primary-soft text-primary" title="Rate a meal" subtitle="How was your food today?" />

      <form onSubmit={handleSubmit}>
        <div className="mb-5 flex flex-col gap-2">
          <span className="label">Meal</span>
          <div role="radiogroup" aria-label="Meal" className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {MEALS.map((meal) => (
              <label
                key={meal.name}
                className={`relative flex cursor-pointer flex-col items-center gap-1 rounded-xl border-[1.5px] px-2 py-3.5 text-center transition has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary ${
                  mealType === meal.name ? "border-primary bg-primary-soft" : "border-line bg-surface hover:border-primary/45"
                }`}
              >
                <input
                  type="radio" name="mealType" value={meal.name} className="sr-only"
                  checked={mealType === meal.name} onChange={() => setMealType(meal.name)}
                />
                <span aria-hidden="true" className="text-2xl leading-none">{meal.icon}</span>
                <strong className="text-sm">{meal.name}</strong>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-2">
          <label htmlFor="mealDate" className="label">Date</label>
          <input id="mealDate" type="date" max={today()} className="input" value={mealDate} onChange={(e) => setMealDate(e.target.value)} required />
        </div>

        <div className="mb-5 flex flex-col gap-2">
          <span className="label">Your rating</span>
          <StarRating value={rating} onChange={(n) => { setRating(n); setNotice(null); }} />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <Spinner /> : "Submit rating"}
        </button>
        <Notice notice={notice} />
      </form>
    </section>
  );
}

function ComplaintForm({ onSaved }) {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!category) return setNotice({ type: "error", text: "Choose a category for your complaint." });
    setLoading(true);
    try {
      const data = await api("/api/complaints", { method: "POST", body: { category, description } });
      setNotice({ type: "success", text: `${data.message} It is now marked as Pending.` });
      setCategory("");
      setDescription("");
      onSaved();
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  const remaining = MAX_DESCRIPTION - description.length;

  return (
    <section className="card">
      <CardHeader icon="✎" iconClass="bg-accent-soft text-accent" title="Submit a complaint" subtitle="Tell the mess team about an issue." />

      <form onSubmit={handleSubmit}>
        <div className="mb-5 flex flex-col gap-2">
          <span className="label">Category</span>
          <div role="radiogroup" aria-label="Category" className="flex flex-wrap gap-2">
            {CATEGORIES.map((name) => (
              <label
                key={name}
                className={`relative cursor-pointer rounded-full border-[1.5px] px-3.5 py-2 text-sm font-medium transition has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${
                  category === name ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface hover:border-accent/45"
                }`}
              >
                <input
                  type="radio" name="category" value={name} className="sr-only"
                  checked={category === name} onChange={() => { setCategory(name); setNotice(null); }}
                />
                {name}
              </label>
            ))}
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-2">
          <label htmlFor="description" className="label">Description</label>
          <textarea
            id="description" rows={6} maxLength={MAX_DESCRIPTION} required
            placeholder="What happened? Include the meal and time if you can."
            className="input min-h-30 resize-y"
            value={description} onChange={(e) => setDescription(e.target.value)}
          />
          <span className={`self-end text-xs ${remaining < 100 ? "text-warn" : "text-muted"}`}>{remaining} characters left</span>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <Spinner /> : "Submit complaint"}
        </button>
        <Notice notice={notice} />
      </form>
    </section>
  );
}

// UC-004: the student's own complaints (with current status) and ratings.
function MyHistory({ history, error }) {
  const [tab, setTab] = useState("complaints");

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-x-4 border-b border-line px-4">
        <h2 className="py-4 text-lg font-bold tracking-tight">My history</h2>
        {history && (
          <div role="tablist" className="flex gap-1">
            <Tab active={tab === "complaints"} onClick={() => setTab("complaints")} label="Complaints" count={history.complaints.length} />
            <Tab active={tab === "ratings"} onClick={() => setTab("ratings")} label="Ratings" count={history.ratings.length} />
          </div>
        )}
      </div>

      {error && <p role="alert" className="m-4 rounded-xl bg-danger-soft px-3.5 py-3 text-sm font-medium text-danger">{error}</p>}
      {!history && !error && <div className="grid place-items-center py-12 text-primary"><Spinner size="lg" /></div>}

      {history && tab === "complaints" && (
        <Table
          headers={["Category", "Description", "Status", "Submitted", "Last updated"]}
          empty={history.complaints.length === 0 && "You have not submitted any complaints yet."}
        >
          {history.complaints.map((c) => (
            <tr key={c.id}>
              <td className="font-semibold whitespace-nowrap">{c.category}</td>
              <td className="min-w-65 max-w-105 whitespace-pre-wrap [overflow-wrap:anywhere]">{c.description}</td>
              <td><StatusPill status={c.status} /></td>
              <td className="whitespace-nowrap text-muted">{formatDateTime(c.createdAt)}</td>
              <td className="whitespace-nowrap text-muted">{formatDateTime(c.updatedAt)}</td>
            </tr>
          ))}
        </Table>
      )}

      {history && tab === "ratings" && (
        <Table
          headers={["Meal", "Meal date", "Rating", "Submitted"]}
          empty={history.ratings.length === 0 && "You have not rated any meals yet."}
        >
          {history.ratings.map((r) => (
            <tr key={r.id}>
              <td><MealPill meal={r.mealType} /></td>
              <td className="whitespace-nowrap">{formatDate(r.mealDate)}</td>
              <td><Stars value={r.rating} /></td>
              <td className="whitespace-nowrap text-muted">{formatDateTime(r.createdAt)}</td>
            </tr>
          ))}
        </Table>
      )}
    </section>
  );
}

export default function Student() {
  const { user } = useAuth();
  const [history, setHistory] = useState(null);
  const [historyError, setHistoryError] = useState("");

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await api("/api/my/history"));
      setHistoryError("");
    } catch (error) {
      setHistoryError(error.message);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  return (
    <Layout
      eyebrow="Student portal"
      title={`${greeting()}, ${user.name.split(" ")[0]}!`}
      subtitle="Your feedback goes straight to the mess team and helps improve every meal."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <RatingForm onSaved={loadHistory} />
        <ComplaintForm onSaved={loadHistory} />
      </div>
      <MyHistory history={history} error={historyError} />
    </Layout>
  );
}
