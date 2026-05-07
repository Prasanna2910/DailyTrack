import { useEffect, useMemo, useState } from 'react';
import { subscribeWorkLogs, toDateKey, upsertDailyWorkLog } from '../services/worklog';

const getTodayLabel = (dateKey) => {
  const d = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateKey;
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

export default function DailyLogPage() {
  const [logs, setLogs] = useState([]);
  const [dateKey, setDateKey] = useState(toDateKey(new Date()));
  const [entities, setEntities] = useState([]);
  const [draft, setDraft] = useState({ person: '', task: '', hours: '', status: 'completed' });
  const [editingIndex, setEditingIndex] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeWorkLogs((data) => setLogs(data));
    return unsub;
  }, []);

  // No longer auto-updating to avoid overwriting user selection

  const todayLog = useMemo(
    () => logs.find((l) => l.dateKey === dateKey) || null,
    [logs, dateKey]
  );

  const readEntities = (log) => {
    if (!log) return [];
    if (Array.isArray(log.entities) && log.entities.length > 0) {
      return log.entities
        .map((e) => ({
          person: e?.person?.trim() || '',
          task: e?.task?.trim() || '',
          hours: e?.hours?.toString() || '',
          status: e?.status === 'pending' ? 'pending' : 'completed',
        }))
        .filter((e) => e.person && e.task && Number(e.hours) > 0);
    }

    // Backward compatibility with old data model
    const fallbackPerson = Array.isArray(log.collaborators) && log.collaborators.length > 0
      ? log.collaborators[0]
      : (log.collaboratedWith || '');

    if (fallbackPerson && log.task && Number(log.hours) > 0) {
      return [{
        person: fallbackPerson,
        task: log.task,
        hours: Number(log.hours).toString(),
        status: log.status === 'pending' ? 'pending' : 'completed',
      }];
    }
    return [];
  };

  const [lastLoadedDateKey, setLastLoadedDateKey] = useState(null);

  useEffect(() => {
    // Only sync from DB if we haven't loaded for this dateKey yet,
    // or if the dateKey has changed.
    if (todayLog && lastLoadedDateKey !== dateKey) {
      setEntities(readEntities(todayLog));
      setLastLoadedDateKey(dateKey);
      setDraft({ person: '', task: '', hours: '', status: 'completed' });
      setEditingIndex(null);
      return;
    }
    
    if (!todayLog && lastLoadedDateKey !== dateKey) {
      setEntities([]);
      setLastLoadedDateKey(dateKey);
      setDraft({ person: '', task: '', hours: '', status: 'completed' });
      setEditingIndex(null);
    }
  }, [todayLog, dateKey, lastLoadedDateKey]);

  const setDraftField = (k, v) => setDraft((prev) => ({ ...prev, [k]: v }));

  const resetDraft = () => {
    setDraft({ person: '', task: '', hours: '', status: 'completed' });
    setEditingIndex(null);
  };

  const handleAddOrUpdateEntity = () => {
    const person = draft.person.trim();
    const task = draft.task.trim();
    const hours = Number(draft.hours);

    if (!person || !task || !Number.isFinite(hours) || hours <= 0) {
      setError('Each entity needs Person, Task, and valid Hours.');
      setSuccess('');
      return;
    }

    setError('');
    const next = {
      person,
      task,
      hours: hours.toString(),
      status: draft.status === 'pending' ? 'pending' : 'completed',
    };

    if (editingIndex !== null) {
      setEntities((prev) => prev.map((item, idx) => (idx === editingIndex ? next : item)));
      resetDraft();
      return;
    }

    setEntities((prev) => [...prev, next]);
    resetDraft();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (entities.length === 0) {
      setError('Add at least one entity before saving.');
      setSuccess('');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updatedLog = await upsertDailyWorkLog({
        dateKey: dateKey,
        entities: entities.map((e) => ({
          person: e.person,
          task: e.task,
          hours: Number(e.hours),
          status: e.status,
        })),
      });
      
      // Update local logs state immediately so other components (Dashboard) reflect it
      setLogs((prev) => {
        const filtered = prev.filter(l => l.dateKey !== dateKey);
        return [updatedLog, ...filtered];
      });
      
      setSuccess(todayLog ? 'Entry updated successfully.' : 'Entry saved successfully.');
    } catch (err) {
      setError(err.message || 'Could not save today’s update.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Daily Work Update</p>
        <h1 className="text-4xl font-black text-white tracking-tight">Log Work Progress</h1>
        <p className="text-slate-400 text-sm">
          One daily entry with multiple separate entities. Add each person-task-hours-status row and save once.
        </p>
      </div>

      <div className="glass-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-slate-500 text-xs font-black uppercase tracking-[0.14em]">Select Date</label>
            <div className="flex items-center gap-4">
              <input
                type="date"
                className="input max-w-[200px]"
                value={dateKey}
                onChange={(e) => setDateKey(e.target.value)}
              />
              <p className="text-white font-bold text-lg">{getTodayLabel(dateKey)}</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-[0.12em] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 self-start sm:self-center">
            {todayLog ? 'Edit mode' : 'New entry'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-rose-300 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-emerald-300 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2">
              {success}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="space-y-2 md:col-span-3">
              <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Person</label>
              <input
                className="input"
                value={draft.person}
                onChange={(e) => setDraftField('person', e.target.value)}
                placeholder="Person name"
              />
            </div>
            <div className="space-y-2 md:col-span-4">
              <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Task</label>
              <input
                className="input"
                value={draft.task}
                onChange={(e) => setDraftField('task', e.target.value)}
                placeholder="Task name"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Hours</label>
              <input
                type="number"
                min="0.25"
                step="0.25"
                className="input"
                value={draft.hours}
                onChange={(e) => setDraftField('hours', e.target.value)}
                placeholder="2.5"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Status</label>
              <select
                className="input"
                value={draft.status}
                onChange={(e) => setDraftField('status', e.target.value)}
              >
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleAddOrUpdateEntity}
              className="btn-secondary md:col-span-1 h-[52px] px-4"
            >
              {editingIndex !== null ? 'Update' : 'Add'}
            </button>
          </div>

          {entities.length > 0 && (
            <div className="space-y-2">
              {entities.map((item, idx) => (
                <div key={`${item.person}-${item.task}-${idx}`} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{item.person} • {item.task}</p>
                    <p className="text-slate-400 text-xs">{item.hours} hrs • {item.status === 'pending' ? 'Pending' : 'Completed'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setDraft({
                          person: item.person,
                          task: item.task,
                          hours: item.hours,
                          status: item.status,
                        });
                        setEditingIndex(idx);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-200 text-xs font-bold"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEntities((prev) => prev.filter((_, i) => i !== idx));
                        if (editingIndex === idx) resetDraft();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 text-xs font-bold"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button type="submit" className="btn-primary min-w-[210px]" disabled={saving}>
            {saving ? 'Saving...' : (todayLog ? 'Update Entry' : 'Save Entry')}
          </button>
        </form>
      </div>
    </div>
  );
}
