export default function SummaryCard({ title, value, icon, color, subtitle }) {
  const colorMap = {
    indigo: 'shadow-indigo-500/10 border-indigo-500/30',
    green: 'shadow-green-500/10 border-green-500/30',
    amber: 'shadow-amber-500/10 border-amber-500/30',
    red: 'shadow-red-500/10 border-red-500/30',
    sky: 'shadow-sky-500/10 border-sky-500/30',
  };

  const cls = colorMap[color] || colorMap.indigo;

  return (
    <div className={`glass-card relative overflow-hidden ${cls}`}>
      <div className="relative z-10 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em]">
            {title}
          </p>
          <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-xl">
            {icon}
          </div>
        </div>
        <p className="text-4xl sm:text-5xl leading-none font-black tracking-tight text-white">
          {value}
        </p>
        {subtitle && (
          <p className="text-slate-300 text-sm font-semibold tracking-wide">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
