"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatCurrency } from "@/utils/format";

interface TwinProjectionsChartProps {
  projections: {
    oneYear: number;
    threeYear: number;
    fiveYear: number;
    tenYear: number;
  };
  currentNetWorth: number;
}

const COLORS = ["#14b8a6", "#0d9488", "#0f766e", "#115e59"];

export function TwinProjectionsChart({ projections, currentNetWorth }: TwinProjectionsChartProps) {
  const data = [
    { label: "Now", value: currentNetWorth },
    { label: "1Y", value: projections.oneYear },
    { label: "3Y", value: projections.threeYear },
    { label: "5Y", value: projections.fiveYear },
    { label: "10Y", value: projections.tenYear },
  ];

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6">
      <h3 className="mb-4 text-base font-semibold text-zinc-50">Wealth Projections</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#71717a", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#71717a", fontSize: 11 }}
              tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
            />
            <Tooltip
              contentStyle={{
                background: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value) => [formatCurrency(Number(value)), "Net Worth"]}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[Math.min(i, COLORS.length - 1)]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
