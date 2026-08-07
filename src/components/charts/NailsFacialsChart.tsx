"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { NailsFacialsTrendPoint } from "@/lib/reports";
import { formatCurrency } from "@/lib/utils";

export function NailsFacialsChart({ data }: { data: NailsFacialsTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
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
          width={48}
        />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
          contentStyle={{
            background: "#f2e9dd",
            border: "1px solid #d9cfc2",
            borderRadius: 12,
            fontSize: 13,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="nailsAmount" name="ציפורניים" fill="#cbb6a2" radius={[6, 6, 0, 0]} />
        <Bar dataKey="facialsAmount" name="טיפולי פנים" fill="#96694a" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
