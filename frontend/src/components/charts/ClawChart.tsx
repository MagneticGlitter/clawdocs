"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ClawChartBlock } from "@/types";

const SAMPLE_DATA: Record<string, Record<string, unknown>[]> = {
  retention_by_week: [
    { week: "W10", US: 44, Canada: 41, UK: 39, Germany: 38 },
    { week: "W11", US: 43, Canada: 40, UK: 40, Germany: 38 },
    { week: "W12", US: 44, Canada: 34, UK: 41, Germany: 39 },
    { week: "W13", US: 43, Canada: 33, UK: 40, Germany: 38 },
  ],
};

const COLORS = ["#818cf8", "#f472b6", "#34d399", "#fbbf24", "#60a5fa"];

export default function ClawChart({ config }: { config: ClawChartBlock }) {
  const data = config.data || SAMPLE_DATA[config.source] || [];

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-slate-800/50 rounded-lg border border-slate-700 text-slate-400 text-sm">
        No data for source: {config.source}
      </div>
    );
  }

  const dataKeys = Object.keys(data[0]).filter((k) => k !== config.x);

  const commonProps = {
    data,
    margin: { top: 8, right: 24, left: 0, bottom: 0 },
  };

  const renderChart = () => {
    switch (config.type) {
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey={config.x} stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: "12px" }} />
            <Legend />
            {dataKeys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        );
      case "area":
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey={config.x} stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: "12px" }} />
            <Legend />
            {dataKeys.map((key, i) => (
              <Area key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.15} />
            ))}
          </AreaChart>
        );
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey={config.x} stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: "12px" }} />
            <Legend />
            {dataKeys.map((key, i) => (
              <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            ))}
          </LineChart>
        );
    }
  };

  return (
    <div className="my-4 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
      {config.title && (
        <h4 className="text-sm font-medium text-slate-300 mb-3">{config.title}</h4>
      )}
      <ResponsiveContainer width="100%" height={260}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
