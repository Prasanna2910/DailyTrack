import { updateTask, deleteTask } from '../services/firebase';

const STATUS_CONFIG = {
  'todo':        { label: 'To Do',       glow: 'shadow-slate-500/5',  text: 'text-slate-400',  bg: 'bg-slate-500/10' },
  'in-progress': { label: 'In Progress', glow: 'shadow-amber-500/10', text: 'text-amber-400',  bg: 'bg-amber-500/10' },
  'done':        { label: 'Done',        glow: 'shadow-green-500/20', text: 'text-green-400',  bg: 'bg-green-500/10' },
};

const PRIORITY_CONFIG = {
  high:   { text: 'text-rose-400',   bg: 'bg-rose-500/10', dot: 'bg-rose-400' },
  medium: { text: 'text-amber-400',  bg: 'bg-amber-500/10', dot: 'bg-amber-400' },
  low:    { text: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' },
};

export default function TaskCard({ task, onEdit }) {
  const status   = STATUS_CONFIG[task.status]   || STATUS_CONFIG.todo;
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.low;

  const cycleStatus = (e) => {
    e.stopPropagation();
    const order = ['todo', 'in-progress', 'done'];
    const next  = order[(order.indexOf(task.status) + 1) % order.length];
    updateTask(task.id, { status: next });
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Delete this task?')) deleteTask(task.id);
  };

  const date = task.createdAt?.toDate
    ? task.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';

  return (
    <div 
      onClick={() => onEdit(task)}
      className={`glass-card group cursor-pointer hover:border-white/20 hover:shadow-2xl transition-all duration-300 ${status.glow} ${task.status === 'done' ? 'opacity-70' : ''}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Side: Info */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <h3 className={`font-bold text-lg tracking-tight ${task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-100'}`}>
              {task.title}
            </h3>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${priority.bg} ${priority.text} border border-current/10 flex items-center gap-1.5`}>
              <span className={`w-1 h-1 rounded-full ${priority.dot} animate-pulse`} />
              {task.priority || 'low'}
            </span>
          </div>
          
          {task.description && (
            <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed font-medium">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-4 pt-1">
            {task.assignedTo && (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white/5 px-2.5 py-1 rounded-lg">
                <span className="opacity-70">👤</span>
                {task.assignedTo}
              </div>
            )}
            {date && <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{date}</span>}
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <button
            onClick={cycleStatus}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 border ${status.bg} ${status.text} border-current/20 hover:bg-current hover:text-slate-900`}
          >
            {status.label}
          </button>
          
          <button
            onClick={handleDelete}
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-300"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
