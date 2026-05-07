import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 shadow-xl text-sm">
        <p className="text-slate-300">{payload[0].name}: <span className="text-white font-bold">{payload[0].value}</span></p>
      </div>
    );
  }
  return null;
};

export default function WeeklyChart({ tasks }) {
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
    // Fallback to current date if createdAt is null (e.g. pending server sync)
    const created = t.createdAt?.toDate 
      ? t.createdAt.toDate().toDateString() 
      : new Date().toDateString();
    
    const day = days.find((d) => d.date === created);
    if (day) day.count++;
  });

  const data = days.map((d) => ({ name: d.label, Tasks: d.count }));

  return (
    <div className="card">
      <h2 className="text-slate-100 font-semibold text-base mb-5">Tasks Created — Last 7 Days</h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={28} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
          <Bar dataKey="Tasks" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
