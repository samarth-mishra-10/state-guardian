import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Lightbulb, TrendingDown, TrendingUp } from 'lucide-react';
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
  const totalBase = base_predicted_crimes.Total_IPC_Crimes;
  const totalSim = predicted_crimes.Total_IPC_Crimes;

  const formatNumber = (num: number) => Math.round(num).toLocaleString();

  const getDelta = (base: number, sim: number) => {
    const diff = sim - base;
    const pct = base > 0 ? (diff / base) * 100 : 0;
    const isIncrease = diff > 0;
    return { diff, pct, isIncrease };
  };

  const stateLabel = state
    .toLowerCase()
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  const topLevers = Object.entries(results!.simulated_features)
    .filter(([key]) => key !== 'Year')
    .map(([key, value]) => {
      const baseValue = results!.baseline_features[key];
      const delta = baseValue ? ((value - baseValue) / baseValue) * 100 : 0;
      return { key, delta };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 2);

  const insights = [
    `${stateLabel} projects ${Math.abs(getDelta(totalBase, totalSim).pct).toFixed(1)}% ${
      getDelta(totalBase, totalSim).isIncrease ? 'higher' : 'lower'
    } total IPC crime under this scenario.`,
    topLevers.length
      ? `Largest policy shift: ${topLevers
          .map(({ key, delta }) => `${key.replaceAll('_', ' ')} (${delta >= 0 ? '+' : ''}${delta.toFixed(0)}%)`)
          .join(', ')}.`
      : 'No major lever changes detected. Adjust a slider to generate targeted recommendations.',
    'Compare women and property trends together before finalizing decisions to avoid one-metric optimization.',
  ];

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
      <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
        <h4 className="mb-1 text-xs text-slate-400 md:text-sm">{title}</h4>
        <div className="font-mono text-xl font-bold text-slate-100 md:text-2xl">{formatNumber(sim)}</div>
        <div className={`mt-2 flex items-center gap-1 text-xs md:text-sm ${isIncrease ? 'text-red-400' : 'text-emerald-400'}`}>
          {isIncrease ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          <span>{isIncrease ? '+' : ''}{formatNumber(diff)} ({pct > 0 ? '+' : ''}{pct.toFixed(1)}%)</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex justify-between">
        <div>
          <h2 className="text-lg font-bold md:text-xl">Impact Analytics</h2>
          <p className="text-xs text-slate-400 md:text-sm">
            Region: <span className="font-semibold text-blue-400">{stateLabel}</span>
          </p>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard title="Total IPC Crimes" keyName="Total_IPC_Crimes" />
        <MetricCard title="Crimes Against Women" keyName="Crimes_Against_Women" />
        <MetricCard title="Property Stolen" keyName="Property_Stolen" />
      </div>

      <div className="mb-3 h-[220px] md:h-[240px]">
        <h3 className="mb-2 text-xs font-medium text-slate-400 md:text-sm">Baseline vs. Policy Simulation</h3>
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

      <div className="mt-auto rounded-lg border border-slate-700 bg-slate-900 p-3">
        <div className="mb-2 flex items-center gap-2 text-blue-300">
          <Lightbulb className="h-4 w-4" />
          <h4 className="text-sm font-semibold">Scenario Insights</h4>
        </div>
        <ul className="list-disc space-y-1.5 pl-4 text-[11px] text-slate-300 md:text-xs">
          {insights.map((insight) => (
            <li key={insight}>{insight}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}