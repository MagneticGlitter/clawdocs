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

const COLORS = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#3b82f6"];

export default function ClawChart({ config }: { config: ClawChartBlock }) {
  const data = config.data || SAMPLE_DATA[config.source] || [];

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border border-gray-200 text-gray-400 text-sm">
        No data for source: {config.source}
      </div>
    );
  }

  const dataKeys = Object.keys(data[0]).filter((k) => k !== config.x);

  const commonProps = {
    data,
    margin: { top: 8, right: 24, left: 0, bottom: 0 },
  };

  const tooltipStyle = { backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" };

  const renderChart = () => {
    switch (config.type) {
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey={config.x} stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            {dataKeys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        );
      case "area":
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey={config.x} stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            {dataKeys.map((key, i) => (
              <Area key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.1} />
            ))}
          </AreaChart>
        );
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey={config.x} stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            {dataKeys.map((key, i) => (
              <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            ))}
          </LineChart>
        );
    }
  };

  return (
    <div className="my-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
      {config.title && (
        <h4 className="text-sm font-medium text-gray-700 mb-3">{config.title}</h4>
      )}
      <ResponsiveContainer width="100%" height={260}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
