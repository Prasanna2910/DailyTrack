import { useState, useEffect } from 'react';
import { subscribeTasks } from '../services/firebase';
import { subscribeWorkLogs, toDateKey } from '../services/worklog';
import { generateTaskReport } from '../utils/pdfGenerator';
import WeeklyChart from '../components/WeeklyChart';
import DayDetailsModal from '../components/DayDetailsModal';
import { Link } from 'react-router-dom';

const toDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const getCompletionDate = (task) => {
  if (task.completedAt) return toDate(task.completedAt);
  if (task.status === 'done' && task.updatedAt) return toDate(task.updatedAt);
  return null;
};

const startOfToday = (baseDate = new Date()) => {
  const d = new Date(baseDate);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const totalHours = (logs) => logs.reduce((sum, l) => sum + (Number(l.hours) || 0), 0);
const readCollaborators = (log) => {
  if (Array.isArray(log.collaborators)) return log.collaborators.map((v) => v?.trim()).filter(Boolean);
  if (typeof log.collaboratedWith === 'string') return log.collaboratedWith.split(',').map((v) => v.trim()).filter(Boolean);
  return [];
};
const readEntities = (log) => {
  if (Array.isArray(log.entities) && log.entities.length > 0) {
    return log.entities
      .map((e) => ({
        person: e?.person?.trim() || '',
        task: e?.task?.trim() || '',
        hours: Number(e?.hours) || 0,
        status: e?.status === 'pending' ? 'pending' : 'completed',
        dateKey: log.dateKey,
      }))
      .filter((e) => e.person && e.task && e.hours > 0);
  }
  if (log.task && Number(log.hours) > 0) {
    const person = readCollaborators(log)[0] || 'N/A';
    return [{
      person,
      task: log.task,
      hours: Number(log.hours),
      status: log.status === 'pending' ? 'pending' : 'completed',
      dateKey: log.dateKey,
    }];
  }
  return [];
};

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [workLogs, setWorkLogs] = useState([]);
  const [nowTs, setNowTs] = useState(Date.now());
  const [selectedDateKey, setSelectedDateKey] = useState(null);

  useEffect(() => {
    const unsubTasks = subscribeTasks((data) => {
      setTasks(data);
    });
    const unsubLogs = subscribeWorkLogs((data) => {
      setWorkLogs(data);
    });

    return () => {
      unsubTasks();
      unsubLogs();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNowTs(Date.now()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const total = tasks.length;
  const now = new Date(nowTs);
  const todayStart = startOfToday(now);

  const todayKey = toDateKey(now);
  const logsToday = workLogs.filter((log) => log.dateKey === todayKey);

  const entitiesToday = logsToday.flatMap((l) => readEntities(l));
  const completedTodayFromLogs = entitiesToday.filter((e) => e.status === 'completed');

  const hoursToday = totalHours(logsToday);
  const hoursTodayLabel = Number.isInteger(hoursToday) ? hoursToday : hoursToday.toFixed(1);

  const selectedLog = selectedDateKey
    ? workLogs.find((log) => log.dateKey === selectedDateKey) || null
    : null;
  const selectedEntities = selectedLog ? readEntities(selectedLog) : [];

  return (
    <div className="min-h-screen p-6 lg:p-10 space-y-10 max-w-7xl mx-auto" id="dashboard-export">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-4xl font-black text-white tracking-tighter sm:text-5xl">
            Sahanashre <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-cyan-300">Execution Dashboard</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Daily output summary with weekly performance trends.
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => generateTaskReport(tasks)}
            className="btn-secondary"
          >
            Export PDF
          </button>
          <Link to="/daily-log" className="btn-primary">
            Update Today
          </Link>
        </div>
      </div>

      <div className="glass-card border-indigo-500/30 bg-indigo-500/5">
        <div className="flex flex-col lg:flex-row gap-8 lg:items-end justify-between">
          <div>
            <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">Manager Snapshot</p>
            <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mt-3">
              {completedTodayFromLogs.length} items logged today
            </h2>
            <p className="text-slate-300 mt-3 max-w-2xl">
              Fresh output for <span className="text-white font-bold">{now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>. Yesterday&apos;s data is preserved in the weekly trend below.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.14em]">Today Done</p>
              <p className="text-3xl font-black text-green-300 mt-2">{completedTodayFromLogs.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.14em]">Hours Today</p>
              <p className="text-3xl font-black text-cyan-300 mt-2">{hoursTodayLabel}</p>
            </div>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <WeeklyChart
            tasks={workLogs}
            mode="hours"
            title="Weekly Hours Trend"
            subtitle="Hours logged from work updates in the last 7 days"
            onDayClick={setSelectedDateKey}
          />

          <div className="glass-card space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-xl font-black tracking-tight">Completed Today</h3>
              <span className="text-green-300 font-bold text-sm">{completedTodayFromLogs.length} items</span>
            </div>
            {completedTodayFromLogs.length === 0 ? (
              <p className="text-slate-400 text-sm">No completions logged today yet.</p>
            ) : (
              <div className="space-y-3">
                {completedTodayFromLogs.slice(0, 6).map((entity, idx) => (
                  <div key={`${entity.person}-${entity.task}-${idx}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-white font-semibold">{entity.task}</p>
                    <p className="text-slate-400 text-xs mt-1">
                      {entity.person} • Completed
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white text-xl font-black tracking-tight">Today&apos;s Work Logs</h3>
                <p className="text-slate-400 text-sm mt-1">
                  Entities submitted for the current day.
                </p>
              </div>
              <Link to="/daily-log" className="btn-secondary text-xs px-4 py-2">
                Edit Today
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-slate-300 text-sm font-semibold">Today&apos;s Entities</p>
                <p className="text-slate-500 text-xs font-black uppercase tracking-[0.14em]">{entitiesToday.length} rows</p>
              </div>
              {entitiesToday.length === 0 ? (
                <p className="text-slate-400 text-sm">No work logs submitted for today yet.</p>
              ) : (
                <div className="grid gap-3">
                  {entitiesToday.map((entry, idx) => (
                    <div key={`${entry.dateKey}-${entry.person}-${entry.task}-${idx}`} className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-white font-semibold">{entry.task}</p>
                        <p className="text-slate-400 text-xs mt-1">
                          {entry.person}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.14em] ${
                          entry.status === 'pending'
                            ? 'text-amber-300 bg-amber-500/10'
                            : 'text-emerald-300 bg-emerald-500/10'
                        }`}>
                          {entry.status === 'pending' ? 'Pending' : 'Completed'}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.14em] text-cyan-300 bg-cyan-500/10">
                          {entry.hours} hrs
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedDateKey && (
        <DayDetailsModal
          dateKey={selectedDateKey}
          entities={selectedEntities}
          onClose={() => setSelectedDateKey(null)}
        />
      )}
    </div>
  );
}
