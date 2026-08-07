"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { WeeklyHoursPoint } from "@/lib/reports";

export function WeeklyHoursChart({ data }: { data: WeeklyHoursPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fill: "#8a7a68", fontSize: 12 }}
          axisLine={{ stroke: "#d9cfc2" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#8a7a68", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <Tooltip
          formatter={(value) => `${value} שעות`}
          contentStyle={{
            background: "#f2e9dd",
            border: "1px solid #d9cfc2",
            borderRadius: 12,
            fontSize: 13,
          }}
        />
        <Line
          type="monotone"
          dataKey="hours"
          name="שעות עבודה"
          stroke="#b08968"
          strokeWidth={2.5}
          dot={{ fill: "#b08968", r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
