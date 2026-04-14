import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingDown, Activity, Info, BarChart3, AlertCircle } from "lucide-react";
import { SimulatorStateData } from "@/pages/Index";

interface AnalyticsPanelProps {
  baseline: SimulatorStateData | undefined;
  simulation: any | undefined;
  stateName: string;
  featureImportances: Record<string, number>;
}

export default function AnalyticsPanel({
  baseline,
  simulation,
  stateName,
  featureImportances,
}: AnalyticsPanelProps) {
  if (!baseline) return <div className="h-full flex items-center justify-center p-4 text-muted-foreground bg-card/10 rounded-xl border border-border/50">Select a state to view analytics.</div>;

  const predictedCrimes = simulation?.predicted_crimes || {};
  const basePredictedCrimes = simulation?.base_predicted_crimes || {};
  
  const currentTotal = predictedCrimes.Total_IPC_Crimes || baseline.Total_IPC_Crimes;
  const baseTotal = basePredictedCrimes.Total_IPC_Crimes || baseline.Total_IPC_Crimes;

  const reduction = baseTotal > 0 ? ((baseTotal - currentTotal) / baseTotal) * 100 : 0;
  const isPositiveImpact = reduction > 0;
  const isNegativeImpact = reduction < 0;
  
  const statusColor = isPositiveImpact ? "text-green-500" : isNegativeImpact ? "text-red-500" : "text-amber-500";
  const bgStatusColor = isPositiveImpact ? "bg-green-500/10 border-green-500/20" : isNegativeImpact ? "bg-red-500/10 border-red-500/20" : "bg-amber-500/10 border-amber-500/20";

  // Prepare data for bar chart
  const categories = [
    { name: "Total IPC", base: baseTotal, sim: currentTotal },
    { name: "Vs Women", base: baseline.Crimes_Against_Women, sim: predictedCrimes.Crimes_Against_Women || baseline.Crimes_Against_Women },
    { name: "Property", base: baseline.Property_Stolen, sim: predictedCrimes.Property_Stolen || baseline.Property_Stolen },
  ];

  const sortedImportances = Object.entries(featureImportances)
    .sort((a, b) => b[1] - a[1]);
  const globalHighest = sortedImportances[0] || ["Unknown", 0];

  const stateSpecificScores = Object.entries(featureImportances).map(([k, v]) => {
     const val = Number(baseline[k as keyof typeof baseline]) || 0;
     return { feature: k, score: (v as number) * val };
  }).sort((a, b) => b.score - a.score);

  const topStateFeature = stateSpecificScores.length > 0 ? stateSpecificScores[0].feature : globalHighest[0];
    
  return (
    <div className="h-full flex flex-col bg-card/40 backdrop-blur-md border border-border/50 rounded-xl p-5 space-y-5 overflow-y-auto shadow-lg">
      <div className="flex items-center gap-3 border-b border-border/30 pb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Actionable Analytics
          </h2>
          <p className="text-xs text-muted-foreground/80 mt-0.5">Real-time predictive outcomes</p>
        </div>
      </div>

      {/* KPI Card */}
      <div className={`rounded-xl p-5 border flex flex-col items-center justify-center text-center transition-colors duration-500 ${bgStatusColor}`}>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80 mb-1">
          Predicted State Crimes
        </p>
        <p className="text-xs text-muted-foreground font-medium mb-3 bg-background/50 px-3 py-1 rounded-full">{stateName}</p>
        
        <div className="relative">
          <p className={`text-5xl font-bold tracking-tighter ${statusColor}`}>
            {Math.round(currentTotal).toLocaleString("en-IN")}
          </p>
        </div>
        
        <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium">
          {Math.abs(reduction) > 0.01 ? (
            <>
              <div className={`p-1 rounded-full ${isPositiveImpact ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <TrendingDown className={`h-4 w-4 ${isNegativeImpact ? "rotate-180 text-red-500" : "text-green-500"}`} />
              </div>
              <span className={statusColor}>
                {Math.abs(reduction).toFixed(1)}% {isPositiveImpact ? 'Drop' : 'Increase'} vs Base
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">Baseline Level (0% Change)</span>
          )}
        </div>
      </div>

      {/* Compare Mode Bar Chart */}
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Metric Breakdown
          </h3>
        </div>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categories} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => val > 1000 ? `${(val/1000).toFixed(0)}k` : val}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(var(--foreground))",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Bar dataKey="base" fill="hsl(var(--muted-foreground)/0.4)" name="Baseline" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sim" fill="hsl(var(--primary))" name="Simulated" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Causal Insights */}
      <div className="flex-1 min-h-0 bg-background/40 rounded-lg p-4 border border-border/40 mt-2 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Info className="w-4 h-4" /> AI Model Insights
          </div>
        </div>
        
        <p className="text-xs leading-relaxed text-muted-foreground">
          Based on the <strong className="text-foreground">{stateName}</strong> baseline profile, the Ridge Causal Engine identifies <strong className="text-foreground">{topStateFeature.replace(/_/g, ' ')}</strong> as the highest localized risk driver. Strategic adjustments here yield the greatest predictive elasticity for regional safety.
        </p>

        {Math.abs(reduction) > 0.01 && (
          <div className={`mt-3 p-3 rounded-md text-xs border ${isPositiveImpact ? 'bg-green-500/5 border-green-500/20 text-green-400' : 'bg-red-500/5 border-red-500/20 text-red-400'} flex gap-3 items-start`}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              {isPositiveImpact ? 
                "The simulated resource allocation successfully mitigates risk profiles identified in historical patterns." : 
                "Warning: Simulated reductions in protective factors correlate with severe increases in projected crime rates."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
