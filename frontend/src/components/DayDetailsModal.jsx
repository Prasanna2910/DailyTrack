import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

const formatDate = (dateKey) => {
  const d = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateKey;
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

const BubbleTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs">
      <p className="text-white font-bold">{p.task}</p>
      <p className="text-slate-300 mt-1">{p.person}</p>
      <p className="text-slate-400 mt-1">{p.hours} hrs • {p.status}</p>
    </div>
  );
};

export default function DayDetailsModal({ dateKey, entities = [], onClose }) {
  const totalHours = entities.reduce((sum, e) => sum + (Number(e.hours) || 0), 0);
  const collaborators = Array.from(new Set(entities.map((e) => e.person?.trim()).filter(Boolean)));
  const completed = entities.filter((e) => e.status !== 'pending').length;
  const pending = entities.filter((e) => e.status === 'pending').length;

  const bubbles = entities.map((e, idx) => ({
    id: idx + 1,
    x: idx + 1,
    y: Number(e.hours) || 0,
    z: Math.max(120, (Number(e.hours) || 0) * 140),
    person: e.person,
    task: e.task,
    status: e.status === 'pending' ? 'Pending' : 'Completed',
    fill: e.status === 'pending' ? '#f59e0b' : '#34d399',
    hours: Number(e.hours) || 0,
  }));

  const totalHoursLabel = Number.isInteger(totalHours) ? totalHours : totalHours.toFixed(1);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-slate-500 text-xs uppercase font-black tracking-[0.16em]">Day Details</p>
            <h2 className="text-2xl font-black text-white mt-1">{formatDate(dateKey)}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 text-slate-300 hover:text-white"
          >
            X
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl bg-white/5 border border-white/10 p-3">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.12em]">Entities</p>
            <p className="text-white text-2xl font-black mt-1">{entities.length}</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-3">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.12em]">Hours</p>
            <p className="text-white text-2xl font-black mt-1">{totalHoursLabel}</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-3">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.12em]">Completed</p>
            <p className="text-emerald-300 text-2xl font-black mt-1">{completed}</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-3">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.12em]">Pending</p>
            <p className="text-amber-300 text-2xl font-black mt-1">{pending}</p>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          <h3 className="text-white text-lg font-black">Text Summary</h3>
          {entities.length === 0 ? (
            <p className="text-slate-400 text-sm">No logs were submitted for this day.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-slate-300 text-sm">
                Worked with: <span className="text-white font-semibold">{collaborators.join(', ') || 'N/A'}</span>
              </p>
              {entities.map((e, idx) => (
                <p key={`${e.person}-${e.task}-${idx}`} className="text-slate-300 text-sm">
                  {idx + 1}. {e.person} • {e.task} • {e.hours} hrs • {e.status === 'pending' ? 'Pending' : 'Completed'}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-white text-lg font-black">Bubble Graph</h3>
          {bubbles.length === 0 ? (
            <p className="text-slate-400 text-sm">No data available for visualization.</p>
          ) : (
            <div className="h-[320px] rounded-2xl border border-white/10 bg-white/5 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 12, right: 24, left: 0, bottom: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis type="number" dataKey="x" name="Entity" tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                  <YAxis type="number" dataKey="y" name="Hours" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <ZAxis type="number" dataKey="z" range={[120, 1200]} />
                  <Tooltip content={<BubbleTooltip />} cursor={{ strokeDasharray: '4 4' }} />
                  <Scatter data={bubbles}>
                    {bubbles.map((b) => (
                      <Cell key={b.id} fill={b.fill} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
