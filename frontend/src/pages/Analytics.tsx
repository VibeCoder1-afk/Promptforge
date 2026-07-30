import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { api, Evaluation } from "../lib/api";

type DashboardStats = {
  totalPrompts: number;
  successRate: number;
  avgLatencyMs: number;
  tokensUsed: number;
  totalCostUsd: number;
  avgRating: number | null;
};

type HistoryBucket = { today: Evaluation[]; yesterday: Evaluation[]; lastWeek: Evaluation[] };

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-ink-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}

export default function Analytics() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get<DashboardStats>("/analytics/dashboard")).data,
  });

  const { data: latency } = useQuery({
    queryKey: ["latency"],
    queryFn: async () => (await api.get<{ points: { timestamp: string; latencyMs: number }[] }>("/analytics/latency")).data.points,
  });

  const { data: cost } = useQuery({
    queryKey: ["cost"],
    queryFn: async () => (await api.get<{ today: number; thisMonth: number }>("/analytics/cost")).data,
  });

  const { data: history } = useQuery({
    queryKey: ["history"],
    queryFn: async () => (await api.get<HistoryBucket>("/analytics/history")).data,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total prompts" value={stats?.totalPrompts ?? "-"} />
        <StatCard label="Success rate" value={stats ? `${stats.successRate}%` : "-"} />
        <StatCard label="Avg latency" value={stats ? `${stats.avgLatencyMs}ms` : "-"} />
        <StatCard label="Tokens used" value={stats?.tokensUsed?.toLocaleString() ?? "-"} />
        <StatCard label="Cost" value={stats ? `$${stats.totalCostUsd.toFixed(2)}` : "-"} />
        <StatCard label="Avg rating" value={stats?.avgRating ?? "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-4 lg:col-span-2">
          <p className="text-sm text-ink-500 mb-3">Latency Graph — average response time</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={latency || []}>
              <XAxis dataKey="timestamp" hide />
              <YAxis stroke="#8B92A5" fontSize={12} />
              <Tooltip contentStyle={{ background: "#14171F", border: "1px solid #232733", fontSize: 12 }} />
              <Line type="monotone" dataKey="latencyMs" stroke="#7C5CFF" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <p className="text-sm text-ink-500 mb-3">Token Cost Tracker</p>
          <div className="flex justify-between items-baseline mb-4">
            <span className="text-xs text-ink-500">Today</span>
            <span className="text-lg font-semibold">${cost?.today.toFixed(2) ?? "0.00"}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-ink-500">This month</span>
            <span className="text-lg font-semibold">${cost?.thisMonth.toFixed(2) ?? "0.00"}</span>
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm text-ink-500 mb-3">Prompt History</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["today", "yesterday", "lastWeek"] as const).map((bucket) => (
            <div key={bucket} className="card p-4">
              <p className="text-xs uppercase tracking-wider text-ink-500 mb-2">
                {bucket === "lastWeek" ? "Last Week" : bucket[0].toUpperCase() + bucket.slice(1)}
              </p>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {(history?.[bucket] || []).length === 0 && <p className="text-xs text-ink-500">No activity.</p>}
                {(history?.[bucket] || []).map((e: any) => (
                  <div key={e._id} className="flex justify-between text-xs">
                    <span className="text-ink-300 truncate">{e.prompt?.title || "Untitled"}</span>
                    <span className="text-ink-500 font-mono">{e.provider}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
