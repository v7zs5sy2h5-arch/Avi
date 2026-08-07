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
          tick={{ fill: "#6b5847", fontSize: 12, fontWeight: 600 }}
          axisLine={{ stroke: "#eeddc7" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#6b5847", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <Tooltip
          formatter={(value) => `${value} שעות`}
          contentStyle={{
            background: "#ffffff",
            border: "1px solid #eeddc7",
            borderRadius: 12,
            fontSize: 13,
          }}
        />
        <Line
          type="monotone"
          dataKey="hours"
          name="⏱️ שעות עבודה"
          stroke="#a34f2b"
          strokeWidth={3}
          dot={{ fill: "#a34f2b", r: 3.5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
