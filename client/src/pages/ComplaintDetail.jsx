import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, formatDateTime } from "../api.js";
import Layout from "../components/Layout.jsx";
import Notice from "../components/Notice.jsx";
import { STATUSES, StatusPill } from "../components/Pills.jsx";
import Spinner from "../components/Spinner.jsx";
import Table from "../components/Table.jsx";

function Detail({ label, children }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:gap-4">
      <dt className="text-sm font-semibold text-muted">{label}</dt>
      <dd className="[overflow-wrap:anywhere] whitespace-pre-wrap">{children}</dd>
    </div>
  );
}

// UC-006: admin opens a complaint, picks a new status and saves it.
export default function ComplaintDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    try {
      const result = await api(`/api/admin/complaints/${id}`);
      setData(result);
      setStatus(result.complaint.status);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const result = await api(`/api/admin/complaints/${id}/status`, { method: "PATCH", body: { status } });
      setNotice({ type: "success", text: `${result.message} (${formatDateTime(result.change.changedAt)})` });
      await load();
    } catch (err) {
      setNotice({ type: "error", text: err.message });
      // Another admin changed it first: show the latest status and history.
      if (err.status === 409) await load();
    } finally {
      setSaving(false);
    }
  }

  const backLink = <Link to="/admin?tab=complaints" className="btn-ghost">← Back to complaints</Link>;

  return (
    <Layout eyebrow="Admin portal" title="Complaint details" subtitle="Review the complaint and update its status." actions={backLink}>
      {error && (
        <p role="alert" className="mb-5 rounded-xl bg-danger-soft px-3.5 py-3 text-sm font-medium text-danger">{error}</p>
      )}

      {!data && !error && <div className="grid place-items-center py-20 text-primary"><Spinner size="lg" /></div>}

      {data && (
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <section className="card">
            <h2 className="mb-4.5 text-lg font-bold tracking-tight">Complaint</h2>
            <dl className="grid gap-3.5">
              <Detail label="Student">{data.complaint.studentName}</Detail>
              <Detail label="Category">{data.complaint.category}</Detail>
              <Detail label="Submitted">{formatDateTime(data.complaint.createdAt)}</Detail>
              <Detail label="Last updated">{formatDateTime(data.complaint.updatedAt)}</Detail>
              <Detail label="Current status"><StatusPill status={data.complaint.status} /></Detail>
              <Detail label="Description">{data.complaint.description}</Detail>
            </dl>
          </section>

          <section className="card self-start">
            <h2 className="mb-4.5 text-lg font-bold tracking-tight">Update status</h2>
            <form onSubmit={handleSave}>
              <div className="mb-5 flex flex-col gap-2">
                <label htmlFor="status" className="label">New status</label>
                <select
                  id="status" className="input" value={status}
                  onChange={(e) => { setStatus(e.target.value); setNotice(null); }}
                >
                  {STATUSES.map((option) => <option key={option}>{option}</option>)}
                </select>
              </div>
              <button type="submit" className="btn-primary" disabled={saving || status === data.complaint.status}>
                {saving ? <Spinner /> : "Save status"}
              </button>
              <Notice notice={notice} />
            </form>
          </section>

          <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card lg:col-span-2">
            <h2 className="border-b border-line px-5 py-4 text-lg font-bold tracking-tight sm:px-6">Status history</h2>
            <Table
              headers={["Old status", "New status", "Changed by", "Changed at"]}
              empty={data.history.length === 0 && "No status changes yet. New complaints start as Pending."}
            >
              {data.history.map((h) => (
                <tr key={h.id}>
                  <td><StatusPill status={h.oldStatus} /></td>
                  <td><StatusPill status={h.newStatus} /></td>
                  <td className="font-semibold">{h.adminName}</td>
                  <td className="whitespace-nowrap text-muted">{formatDateTime(h.changedAt)}</td>
                </tr>
              ))}
            </Table>
          </section>
        </div>
      )}
    </Layout>
  );
}
