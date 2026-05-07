export default function ProgressBar({ value = 0, max = 100, label, color = 'indigo' }) {
  const pct = Math.min(100, Math.round((value / max) * 100));

  const colorMap = {
    indigo: 'bg-indigo-500',
    green:  'bg-green-500',
    amber:  'bg-amber-500',
    red:    'bg-red-500',
  };

  const bar = colorMap[color] || colorMap.indigo;

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm text-slate-400">{label}</span>
          <span className="text-sm font-semibold text-slate-200">{pct}%</span>
        </div>
      )}
      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${bar} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
