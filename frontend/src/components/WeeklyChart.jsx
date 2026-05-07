import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const readDate = (task, mode) => {
  if (task.dateKey) {
    return new Date(`${task.dateKey}T00:00:00`);
  }
  if (mode === 'hours') {
    return task.loggedAt ? new Date(task.loggedAt) : null;
  }

  if (mode === 'completed') {
    if (task.completedAt) return new Date(task.completedAt);
    if (task.status === 'done' && task.updatedAt) return new Date(task.updatedAt);
    return null;
  }

  if (task.createdAt?.toDate) return task.createdAt.toDate();
  if (task.createdAtISO) return new Date(task.createdAtISO);
  return null;
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const value = Number(payload[0].value);
    const display = Number.isInteger(value) ? value : value.toFixed(1);
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 shadow-xl text-sm">
        <p className="text-slate-300">{payload[0].name}: <span className="text-white font-bold">{display}</span></p>
      </div>
    );
  }
  return null;
};

export default function WeeklyChart({ tasks = [], mode = 'created', title = 'Weekly Throughput', subtitle = 'Tasks created in the last 7 days', onDayClick }) {
  // Build last-7-days data
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.toDateString(),
      count: 0,
    };
  });

  tasks.forEach((t) => {
    const when = readDate(t, mode);
    if (!when || Number.isNaN(when.getTime())) return;

    const day = days.find((d) => d.date === when.toDateString());
    if (!day) return;

    if (mode === 'hours') {
      const hours = Number(t.hours);
      day.count += Number.isFinite(hours) ? hours : 0;
      return;
    }

    day.count++;
  });

  const data = days.map((d) => ({
    name: d.label,
    dateKey: (() => {
      const dt = new Date(d.date);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    })(),
    metric: Number(d.count.toFixed(2)),
  }));
  const weeklyTotal = data.reduce((sum, d) => sum + d.metric, 0);
  const peak = Math.max(...data.map(d => d.metric), 0);
  const totalLabel = Number.isInteger(weeklyTotal) ? weeklyTotal : weeklyTotal.toFixed(1);
  const peakLabel = Number.isInteger(peak) ? peak : peak.toFixed(1);
  const valueUnit = mode === 'hours' ? 'hrs' : 'items';

  return (
    <div className="glass-card">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-white font-black text-lg tracking-tight">{title}</h2>
          <p className="text-slate-400 text-xs uppercase font-black tracking-[0.16em] mt-1">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-white text-2xl font-black">{totalLabel}</p>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.12em]">Peak: {peakLabel} {valueUnit}/day</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barSize={28} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={mode === 'hours'} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
          <Bar dataKey="metric" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={COLORS[i % COLORS.length]}
                cursor={onDayClick ? 'pointer' : 'default'}
                onClick={onDayClick ? () => onDayClick(entry.dateKey) : undefined}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
