import { useState, useEffect } from 'react';
import { subscribeTasks } from '../services/firebase';
import { generateTaskReport } from '../utils/pdfGenerator';
import ProgressBar from '../components/ProgressBar';

export default function ManagerView() {
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeTasks((data) => { setTasks(data); setLoading(false); });
    return unsub;
  }, []);

  // Group tasks by assignedTo
  const grouped = tasks.reduce((acc, t) => {
    const key = t.assignedTo || 'Unassigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const statusColor = {
    done:         'text-emerald-400 bg-emerald-500/10',
    'in-progress':'text-amber-400 bg-amber-500/10',
    todo:         'text-slate-400 bg-white/5',
  };

  return (
    <div className="min-h-screen p-6 lg:p-10 space-y-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-[0.2em]">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Restricted Admin Access
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter sm:text-5xl">Team <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">Overview</span></h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">{Object.keys(grouped).length} Operations Centers · {tasks.length} Active Records</p>
        </div>
        <button
          onClick={() => generateTaskReport(tasks, 'System Administrator')}
          className="btn-primary"
        >
          📄 Export Master Report
        </button>
      </div>

      {loading ? (
        <div className="glass-card text-center py-24 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Authenticating Records...</p>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="glass-card text-center py-20">
          <p className="text-5xl mb-6 grayscale opacity-50">👥</p>
          <p className="text-white font-black text-xl tracking-tight">No active personnel data</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {Object.entries(grouped).map(([user, userTasks]) => {
            const total      = userTasks.length;
            const done       = userTasks.filter(t => t.status === 'done').length;
            const inProgress = userTasks.filter(t => t.status === 'in-progress').length;
            const pct        = total ? Math.round((done / total) * 100) : 0;

            return (
              <div key={user} className="glass-card shadow-indigo-500/5 group">
                {/* User header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-brand-500/20 group-hover:rotate-3 transition-transform">
                      {user.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xl font-black text-white tracking-tight">{user}</p>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                        {total} Records · {pct}% Performance Index
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => generateTaskReport(userTasks, user)}
                      className="btn-secondary text-xs px-4 py-2"
                    >
                      📄 Export Log
                    </button>
                    <div className="text-right">
                      <p className="text-white font-black text-lg">{pct}%</p>
                      <p className="text-slate-600 text-[10px] font-bold uppercase tracking-tighter">Completion</p>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-8">
                  <ProgressBar value={done} max={total || 1} color="indigo" />
                </div>

                {/* Task rows */}
                <div className="grid gap-2">
                  {userTasks.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors gap-4">
                      <p className="text-slate-200 text-sm font-semibold truncate flex-1">{t.title}</p>
                      <div className="flex items-center gap-3 shrink-0">
                        {t.priority && (
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                            t.priority === 'high' ? 'bg-rose-500/10 text-rose-400' :
                            t.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {t.priority}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${statusColor[t.status] || statusColor.todo}`}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
