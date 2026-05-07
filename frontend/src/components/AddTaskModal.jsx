import { useState, useEffect } from 'react';
import { addTask, updateTask } from '../services/firebase';

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES   = ['todo', 'in-progress', 'done'];

const EMPTY = {
  title: '', description: '', priority: 'medium',
  status: 'todo', assignedTo: '', dueDate: '',
};

export default function AddTaskModal({ onClose, editTask = null }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (editTask) {
      setForm({
        title:       editTask.title       || '',
        description: editTask.description || '',
        priority:    editTask.priority    || 'medium',
        status:      editTask.status      || 'todo',
        assignedTo:  editTask.assignedTo  || '',
        dueDate:     editTask.dueDate     || '',
      });
    }
  }, [editTask]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    try {
      if (editTask) {
        await updateTask(editTask.id, form);
      } else {
        await addTask(form);
      }
      // Success: Close immediately after the promise is acknowledged locally
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-card w-full max-w-lg shadow-[0_0_50px_-12px_rgba(99,102,241,0.25)] border-white/20 animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-white tracking-tight">
            {editTask ? 'Edit Task' : 'Create Task'}
          </h2>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-rose-400 text-sm font-bold bg-rose-500/10 rounded-xl px-5 py-3 border border-rose-500/20">{error}</p>}

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Title</label>
            <input className="input" placeholder="Enter task title..." value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Description</label>
            <textarea className="input resize-none h-24" placeholder="Describe the work..." value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Status</label>
              <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Assignee</label>
              <input className="input" placeholder="User email..." value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Deadline</label>
              <input type="date" className="input" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary min-w-[140px]" disabled={saving}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Saving
                </span>
              ) : editTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
