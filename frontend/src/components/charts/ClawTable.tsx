"use client";

import type { ClawTableBlock } from "@/types";

const SAMPLE_DATA: Record<string, Record<string, unknown>[]> = {
  retention_breakdown: [
    { region: "US", platform: "iOS", users: "1.2M", retention_rate: "46%", trend: "stable" },
    { region: "US", platform: "Android", users: "890K", retention_rate: "41%", trend: "stable" },
    { region: "Canada", platform: "iOS", users: "180K", retention_rate: "37%", trend: "down" },
    { region: "Canada", platform: "Android", users: "120K", retention_rate: "28%", trend: "down" },
    { region: "UK", platform: "iOS", users: "320K", retention_rate: "42%", trend: "up" },
    { region: "UK", platform: "Android", users: "210K", retention_rate: "38%", trend: "stable" },
    { region: "Germany", platform: "iOS", users: "240K", retention_rate: "40%", trend: "stable" },
    { region: "Germany", platform: "Android", users: "190K", retention_rate: "36%", trend: "stable" },
  ],
};

function TrendBadge({ trend }: { trend: string }) {
  const colors: Record<string, string> = {
    up: "text-emerald-600 bg-emerald-50",
    down: "text-rose-600 bg-rose-50",
    stable: "text-gray-500 bg-gray-100",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colors[trend] ?? colors.stable}`}>
      {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trend}
    </span>
  );
}

export default function ClawTable({ config }: { config: ClawTableBlock }) {
  const data = config.data || SAMPLE_DATA[config.source] || [];
  const columns = config.columns.length > 0 ? config.columns : (data.length > 0 ? Object.keys(data[0]) : []);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 bg-gray-50 rounded-lg border border-gray-200 text-gray-400 text-sm">
        No data for source: {config.source}
      </div>
    );
  }

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            {columns.map((col) => (
              <th key={col} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {col.replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              {columns.map((col) => (
                <td key={col} className="px-4 py-2.5 text-gray-600">
                  {col === "trend" ? (
                    <TrendBadge trend={String(row[col] ?? "")} />
                  ) : (
                    String(row[col] ?? "")
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
