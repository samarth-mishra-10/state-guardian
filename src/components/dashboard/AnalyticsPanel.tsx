import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp, AlertCircle, BookOpen } from 'lucide-react';
import { SimulationResults } from '../../App';

interface AnalyticsPanelProps {
  state: string;
  results: SimulationResults | null;
  loading: boolean;
}

export default function AnalyticsPanel({ state, results, loading }: AnalyticsPanelProps) {
  
  if (!results && !loading) return <div className="p-6 text-slate-400">Run a simulation to see impact.</div>;
  if (loading) return <div className="p-6 text-slate-400 animate-pulse">Calculating causal impacts...</div>;

  const { base_predicted_crimes, predicted_crimes } = results!;

  const formatNumber = (num: number) => Math.round(num).toLocaleString();

  const getDelta = (base: number, sim: number) => {
    const diff = sim - base;
    const pct = base > 0 ? (diff / base) * 100 : 0;
    const isIncrease = diff > 0;
    return { diff, pct, isIncrease };
  };

  const chartData = [
    {
      name: 'Total IPC',
      Baseline: base_predicted_crimes['Total_IPC_Crimes'],
      Simulated: predicted_crimes['Total_IPC_Crimes'],
    },
    {
      name: 'Women',
      Baseline: base_predicted_crimes['Crimes_Against_Women'],
      Simulated: predicted_crimes['Crimes_Against_Women'],
    },
    {
      name: 'Property',
      Baseline: base_predicted_crimes['Property_Stolen'],
      Simulated: predicted_crimes['Property_Stolen'],
    }
  ];

  const MetricCard = ({ title, keyName }: { title: string, keyName: string }) => {
    const base = base_predicted_crimes[keyName];
    const sim = predicted_crimes[keyName];
    const { diff, pct, isIncrease } = getDelta(base, sim);

    return (
      <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
        <h4 className="text-sm text-slate-400 mb-1">{title}</h4>
        <div className="text-2xl font-bold font-mono text-slate-100">{formatNumber(sim)}</div>
        <div className={`flex items-center gap-1 text-sm mt-2 ${isIncrease ? 'text-red-400' : 'text-emerald-400'}`}>
          {isIncrease ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          <span>{isIncrease ? '+' : ''}{formatNumber(diff)} ({pct > 0 ? '+' : ''}{pct.toFixed(1)}%)</span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-xl font-bold">Impact Analytics</h2>
          <p className="text-sm text-slate-400">Region: <span className="text-blue-400 font-semibold">{state}</span></p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <MetricCard title="Total IPC Crimes" keyName="Total_IPC_Crimes" />
        <MetricCard title="Crimes Against Women" keyName="Crimes_Against_Women" />
        <MetricCard title="Property Stolen" keyName="Property_Stolen" />
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[300px] mb-8">
        <h3 className="text-sm font-medium text-slate-400 mb-4">Baseline vs. Policy Simulation</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `${val/1000}k`} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
              itemStyle={{ color: '#e2e8f0' }}
            />
            <Legend />
            <Bar dataKey="Baseline" fill="#475569" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Simulated" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Methodology Section (For Capstone Defense) */}
      <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg mt-auto">
        <div className="flex items-center gap-2 mb-2 text-blue-400">
          <BookOpen className="h-4 w-4" />
          <h4 className="font-semibold text-sm">Causal Methodology</h4>
        </div>
        <ul className="text-xs text-slate-400 space-y-2 list-disc pl-4">
          <li><strong>Algorithm:</strong> Multi-Output XGBoost Regressor (Time-Series Split). R² = 0.6520.</li>
          <li><strong>Logic Constraints:</strong> Monotonic constraints applied to prevent endogeneity (Reverse Causality). The model strictly enforces that increasing enforcement decreases/holds crime steady.</li>
        </ul>
      </div>
    </div>
  );
}