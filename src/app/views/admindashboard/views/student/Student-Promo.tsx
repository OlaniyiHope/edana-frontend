import React, { useMemo, useState } from "react";
import axios from "axios";
import useFetch from "@/hooks/useFetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Lowest -> highest. Edit this to match your school (also editable on the page).
const DEFAULT_CLASS_ORDER = "JS1, JS2, JS3, SS1, SS2, SS3";

type PreviewRow = { id: string; name: string; from: string; to: string };
type SkippedRow = { id: string; name: string; classname: string };
type PreviewData = {
  willPromote: number;
  skippedCount: number;
  preview: PreviewRow[];
  skipped: SkippedRow[];
};

function StudentPromotion() {
  const { data: rawSessions } = useFetch("/sessions");
  const sessions: any[] = Array.isArray(rawSessions)
    ? rawSessions
    : (rawSessions as any)?.sessions ?? (rawSessions as any)?.data ?? [];

  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [classOrder, setClassOrder] = useState(DEFAULT_CLASS_ORDER);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const classes = useMemo(
    () => classOrder.split(",").map((c) => c.trim()).filter(Boolean),
    [classOrder]
  );

  // Default: each class -> next class; last class -> "" (graduates, not promoted)
const mapping = useMemo(() => {
  const m: Record<string, string> = {};
  classes.forEach((c, i) => {
    if (!selected[c]) return;
    const next = c in overrides ? overrides[c] : classes[i + 1] || "";
    if (next) m[c] = next;
  });
  return m;
}, [classes, overrides, selected]);
const canRun = !!fromId && !!toId && fromId !== toId && Object.keys(mapping).length > 0;

  const resetResults = () => {
    setPreview(null);
    setMessage("");
    setError("");
  };

  const run = async (dryRun: boolean) => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const { data } = await axios.post(`${apiUrl}/api/promote`, {
        fromSessionId: fromId,
        toSessionId: toId,
        classPromotions: mapping,
        dryRun,
      });
      if (dryRun) {
        setPreview(data);
      } else {
        setMessage(data.message || `${data.promoted} students promoted.`);
        setPreview(null);
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.response?.data?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const confirmPromote = () => {
    if (!preview) return;
    const from = sessions.find((s) => s._id === fromId)?.name;
    const to = sessions.find((s) => s._id === toId)?.name;
    if (
      window.confirm(
        `Promote ${preview.willPromote} students from ${from} to ${to}? This cannot be undone from the app.`
      )
    ) {
      run(false);
    }
  };

  const selectClass = "w-full rounded-md border border-black bg-white p-2 text-sm";

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="rounded-2xl border border-black bg-white p-6 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#004aaa]">Student</p>
        <h1 className="text-3xl font-bold text-black">Student Promotion</h1>
        <p className="text-sm text-black">
          Students stay in the old session with their old class, and get a new record in the new session.
        </p>
      </div>

      <Card className="border border-black bg-white shadow-sm">
        <CardHeader className="border-b border-black">
          <CardTitle className="text-base font-bold text-[#004aaa]">1. Choose sessions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-6 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-semibold text-black">Promote from</span>
            <select
              className={selectClass}
              value={fromId}
              onChange={(e) => { setFromId(e.target.value); resetResults(); }}
            >
              <option value="">Select session…</option>
              {sessions.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-semibold text-black">Promote to</span>
            <select
              className={selectClass}
              value={toId}
              onChange={(e) => { setToId(e.target.value); resetResults(); }}
            >
              <option value="">Select session…</option>
              {sessions.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </label>
          {fromId && toId && fromId === toId && (
            <p className="text-sm text-red-600 md:col-span-2">The two sessions must be different.</p>
          )}
        </CardContent>
      </Card>

      <Card className="border border-black bg-white shadow-sm">
        <CardHeader className="border-b border-black">
          <CardTitle className="text-base font-bold text-[#004aaa]">2. Class mapping</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-black">
              Class order (lowest to highest, comma separated, exactly as stored)
            </span>
            <input
              className={selectClass}
              value={classOrder}
              onChange={(e) => { setClassOrder(e.target.value); setOverrides({}); resetResults(); }}
            />
          </label>

          <div className="space-y-2">
      {classes.map((c, i) => (
  <div key={c} className="flex items-center gap-3">
    <input
      type="checkbox"
      checked={!!selected[c]}
      onChange={(e) => {
        setSelected((s) => ({ ...s, [c]: e.target.checked }));
        resetResults();
      }}
    />
    <span className="w-20 text-sm font-bold text-black">{c}</span>
    <span className="text-black">→</span>
    <select
      className="rounded-md border border-black bg-white p-2 text-sm"
      value={c in overrides ? overrides[c] : classes[i + 1] || ""}
      onChange={(e) => { setOverrides((o) => ({ ...o, [c]: e.target.value })); resetResults(); }}
    >
      <option value="">Not promoted (graduates / stays)</option>
      {classes.filter((x) => x !== c).map((x) => (
        <option key={x} value={x}>{x}</option>
      ))}
    </select>
  </div>
))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          disabled={!canRun || loading}
          onClick={() => run(true)}
          className="bg-[#004aaa] text-white hover:bg-[#003a88]"
        >
          {loading ? "Working…" : "Preview promotion"}
        </Button>
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        {message && <p className="text-sm font-semibold text-green-700">{message}</p>}
      </div>

      {preview && (
        <Card className="border border-black bg-white shadow-sm">
          <CardHeader className="border-b border-black">
            <CardTitle className="text-base font-bold text-[#004aaa]">3. Review and confirm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <p className="text-sm text-black">
              <b>{preview.willPromote}</b> students will be promoted.{" "}
              <b>{preview.skippedCount}</b> will be skipped.
            </p>

            {preview.preview.length > 0 && (
              <div className="max-h-72 overflow-auto rounded-md border border-black">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2">Student</th>
                      <th className="p-2">From</th>
                      <th className="p-2">To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.preview.map((p) => (
                      <tr key={p.id} className="border-t">
                        <td className="p-2">{p.name}</td>
                        <td className="p-2">{p.from}</td>
                        <td className="p-2">{p.to}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {preview.skipped.length > 0 && (
              <div className="rounded-md border border-yellow-500 bg-yellow-50 p-3 text-sm text-black">
                <p className="mb-1 font-semibold">Skipped (no class mapping):</p>
                {preview.skipped.map((s) => (
                  <div key={s.id}>{s.name} ({s.classname})</div>
                ))}
              </div>
            )}

            <Button
              type="button"
              disabled={loading || preview.willPromote === 0}
              onClick={confirmPromote}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Confirm and promote {preview.willPromote} students
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default StudentPromotion;