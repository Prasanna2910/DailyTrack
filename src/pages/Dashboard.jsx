import { useState, useEffect } from 'react';
import { subscribeTasks } from '../services/firebase';
import { generateTaskReport } from '../utils/pdfGenerator';
import SummaryCard from '../components/SummaryCard';
import TaskCard from '../components/TaskCard';
import WeeklyChart from '../components/WeeklyChart';
import ProgressBar from '../components/ProgressBar';
import AddTaskModal from '../components/AddTaskModal';

const FILTERS = ['all', 'todo', 'in-progress', 'done'];

export default function Dashboard() {
  const [tasks,       setTasks]       = useState([]);
  const [filter,      setFilter]      = useState('all');
  const [search,      setSearch]      = useState('');
  const [showModal,   setShowModal]   = useState(false);
  const [editTask,    setEditTask]    = useState(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const unsub = subscribeTasks((data) => {
      setTasks(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Derived counts
  const total      = tasks.length;
  const done       = tasks.filter(t => t.status === 'done').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const todo       = tasks.filter(t => t.status === 'todo').length;
  
  // FIX: Only count HIGH priority tasks that are NOT DONE
  const high       = tasks.filter(t => t.priority === 'high' && t.status !== 'done').length;
  
  const pct        = total ? Math.round((done / total) * 100) : 0;

  // Filtered + searched tasks
  const visible = tasks.filter(t => {
    const matchFilter = filter === 'all' || t.status === filter;
    const matchSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase())
      || t.assignedTo?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const openAdd  = ()     => { setEditTask(null); setShowModal(true); };
  const openEdit = (task) => { setEditTask(task);  setShowModal(true); };
  const closeModal = ()   => { setShowModal(false); setEditTask(null); };

  return (
    <div className="min-h-screen p-6 lg:p-10 space-y-10 max-w-7xl mx-auto" id="dashboard-export">
      {/* Top bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-white tracking-tighter sm:text-5xl">
            My <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">Workspace</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => generateTaskReport(tasks)}
            className="btn-secondary group"
          >
            <span className="group-hover:scale-110 transition-transform">📄</span>
            Export PDF
          </button>
          <button onClick={openAdd} className="btn-primary group">
            <span className="group-hover:rotate-90 transition-transform text-lg">+</span>
            New Task
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard title="Total Tasks"  value={total}      icon="📋" color="sky" />
        <SummaryCard title="Completed"    value={done}       icon="✅" color="green"  subtitle={`${pct}% SUCCESS`} />
        <SummaryCard title="In Progress"  value={inProgress} icon="⚡" color="amber"  />
        <SummaryCard title="High Priority" value={high}      icon="🔥" color="red"    subtitle="Active" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Stats & Chart */}
        <div className="lg:col-span-1 space-y-8">
          <div className="glass-card bg-indigo-600/5 border-indigo-500/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white">Progress</h2>
              <span className="text-indigo-400 font-bold text-sm bg-indigo-500/10 px-3 py-1 rounded-full">{pct}%</span>
            </div>
            <ProgressBar value={done} max={total || 1} color="indigo" />
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Active Velocity</span>
                <span className="text-white font-bold">{inProgress + todo} tasks left</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden flex">
                <div style={{ width: `${(todo/total)*100}%` }} className="bg-slate-700 h-full" />
                <div style={{ width: `${(inProgress/total)*100}%` }} className="bg-amber-500 h-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                <div style={{ width: `${(done/total)*100}%` }} className="bg-green-500 h-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              </div>
            </div>
          </div>
          <WeeklyChart tasks={tasks} />
        </div>

        {/* Right: Task list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
              <input
                className="input pl-12"
                placeholder="Search tasks or assignees..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl overflow-x-auto no-scrollbar">
              {FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    filter === f
                      ? 'bg-brand-600 text-white shadow-lg'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {f === 'all' ? 'All' : f.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="glass-card text-center py-20 flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Secure Connection...</p>
              </div>
            ) : visible.length === 0 ? (
              <div className="glass-card text-center py-20 border-dashed">
                <p className="text-5xl mb-6 grayscale opacity-50">🗃️</p>
                <p className="text-white font-black text-xl tracking-tight">Everything is clear</p>
                <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">
                  {filter !== 'all' ? `No tasks found for your "${filter}" filter settings.` : 'Your workspace is empty. Start by creating a new task.'}
                </p>
                <button onClick={openAdd} className="mt-8 text-brand-400 font-bold text-sm uppercase tracking-widest hover:text-brand-300 transition-colors">
                  + Create New Entry
                </button>
              </div>
            ) : (
              <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-5 duration-700">
                {visible.map(task => (
                  <TaskCard key={task.id} task={task} onEdit={openEdit} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && <AddTaskModal onClose={closeModal} editTask={editTask} />}
    </div>
  );
}
