import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PIE_DATA, BAR_DATA, getThreatColor } from "@/lib/crimeData";
import { TrendingDown, Activity } from "lucide-react";

interface AnalyticsPanelProps {
  predictedTheft: number;
  baseTheft: number;
  threatLevel: "high" | "medium" | "low";
  stateName: string;
}

export default function AnalyticsPanel({
  predictedTheft,
  baseTheft,
  threatLevel,
  stateName,
}: AnalyticsPanelProps) {
  const reduction = Math.round(((baseTheft - predictedTheft) / baseTheft) * 100);
  const color = getThreatColor(threatLevel);

  return (
    <div className="h-full flex flex-col glass-panel p-4 space-y-4 overflow-y-auto scanline">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary glow-pulse" />
        <h2 className="text-lg font-bold font-display tracking-wider uppercase neon-text">
          State Intelligence Analytics
        </h2>
      </div>

      {/* KPI Card */}
      <div className="glass-panel p-4 text-center space-y-1">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Predicted State-Wide Theft Cases
        </p>
        <p className="text-[10px] text-muted-foreground/60 font-mono">{stateName}</p>
        <p
          className="text-5xl font-bold font-mono tracking-tight"
          style={{ color }}
        >
          {predictedTheft.toLocaleString("en-IN")}
        </p>
        {reduction > 0 && (
          <div className="flex items-center justify-center gap-1 text-sm" style={{ color: "hsl(142, 71%, 45%)" }}>
            <TrendingDown className="h-4 w-4" />
            <span className="font-mono">⬇ {reduction}% from baseline</span>
          </div>
        )}
        {reduction <= 0 && (
          <p className="text-xs text-muted-foreground font-mono">Baseline level</p>
        )}
      </div>

      {/* Pie Chart */}
      <div className="glass-panel p-3 space-y-2">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground">
          State Property Crime Breakdown
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={PIE_DATA}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {PIE_DATA.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "hsl(220, 40%, 8%)",
                border: "1px solid hsl(220, 30%, 20%)",
                borderRadius: "6px",
                fontFamily: "Share Tech Mono",
                fontSize: "12px",
                color: "hsl(210, 40%, 92%)",
              }}
              formatter={(value: number) => [`${value}%`, ""]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-1">
          {PIE_DATA.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.fill }} />
              {d.name} ({d.value}%)
            </div>
          ))}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="glass-panel p-3 space-y-2">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground">
          Recidivism by Age Group (State Level)
        </h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={BAR_DATA}>
            <XAxis
              dataKey="ageGroup"
              tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10, fontFamily: "Share Tech Mono" }}
              axisLine={{ stroke: "hsl(220, 30%, 20%)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10, fontFamily: "Share Tech Mono" }}
              axisLine={{ stroke: "hsl(220, 30%, 20%)" }}
              tickLine={false}
              width={35}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(220, 40%, 8%)",
                border: "1px solid hsl(220, 30%, 20%)",
                borderRadius: "6px",
                fontFamily: "Share Tech Mono",
                fontSize: "12px",
                color: "hsl(210, 40%, 92%)",
              }}
            />
            <Bar dataKey="arrests" fill="hsl(199, 89%, 48%)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="text-[10px] text-muted-foreground/40 text-center uppercase tracking-widest pt-2 border-t border-border/20">
        National Crime Records Bureau • Analytics Division
      </div>
    </div>
  );
}
