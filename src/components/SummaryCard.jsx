export default function SummaryCard({ title, value, icon, color, subtitle }) {
  const colorMap = {
    indigo: 'shadow-indigo-500/10 border-indigo-500/20 text-indigo-400',
    green:  'shadow-green-500/10 border-green-500/20 text-green-400',
    amber:  'shadow-amber-500/10 border-amber-500/20 text-amber-400',
    red:    'shadow-red-500/10 border-red-500/20 text-red-400',
    sky:    'shadow-sky-500/10 border-sky-500/20 text-sky-400',
  };

  const cls = colorMap[color] || colorMap.indigo;

  return (
    <div className={`glass-card relative overflow-hidden group hover:-translate-y-1 ${cls}`}>
      {/* Decorative background glow */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-20 bg-current`} />
      
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          <span className="text-3xl font-black tracking-tight text-white">
            {value}
          </span>
        </div>
        
        <div>
          <h3 className="text-slate-100 font-bold text-base tracking-wide">{title}</h3>
          {subtitle && <p className="text-slate-400 text-xs font-medium mt-1 uppercase tracking-widest">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
