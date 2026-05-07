// ── Local Storage Data Layer ──────────────────────────────────────────────────
// This file replaces Firebase Firestore with LocalStorage for instant persistence.
// It uses CustomEvents to mimic real-time listeners across components.

const STORAGE_KEY = 'dailytrack_tasks';
const EVENT_NAME  = 'task_data_updated';

const toDateObject = (value) => {
  if (!value) return null;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value?.toDate === 'function') {
    const d = value.toDate();
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
  }
  return null;
};

const serializeTask = (task) => {
  const createdDate = toDateObject(task.createdAt) || toDateObject(task.createdAtISO) || new Date();
  return {
    ...task,
    createdAtISO: createdDate.toISOString(),
  };
};

const normalizeTask = (task) => {
  const createdDate = toDateObject(task.createdAt) || toDateObject(task.createdAtISO);
  return {
    ...task,
    createdAt: createdDate ? { toDate: () => createdDate } : null,
  };
};

// Helper: Get data from storage
const getStorageData = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  const raw = data ? JSON.parse(data) : [];
  return raw.map(normalizeTask);
};

// Helper: Save data and notify listeners
const saveAndNotify = (tasks) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.map(serializeTask)));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: tasks }));
};

/**
 * Subscribe to all tasks. Mimics onSnapshot.
 */
export function subscribeTasks(callback) {
  const handler = (e) => callback(e.detail || getStorageData());
  window.addEventListener(EVENT_NAME, handler);
  
  // Initial call
  const initialData = getStorageData();
  callback(initialData);

  return () => window.removeEventListener(EVENT_NAME, handler);
}

/**
 * Subscribe to tasks for a specific user.
 */
export function subscribeTasksByUser(email, callback) {
  const filter = (data) => data.filter(t => t.assignedTo === email);
  const handler = (e) => callback(filter(e.detail || getStorageData()));
  
  window.addEventListener(EVENT_NAME, handler);
  callback(filter(getStorageData()));

  return () => window.removeEventListener(EVENT_NAME, handler);
}

/**
 * Add a new task document.
 */
export async function addTask(taskData) {
  const tasks = getStorageData();
  const now = new Date();
  const newTask = {
    ...taskData,
    id: Math.random().toString(36).substr(2, 9),
    status: taskData.status || 'todo',
    createdAt: { toDate: () => now }, // Mimic Firestore Timestamp structure
    createdAtISO: now.toISOString(),
    updatedAt: now.toISOString(),
    completedAt: taskData.status === 'done' ? now.toISOString() : null,
  };
  
  tasks.unshift(newTask); // Add to top
  saveAndNotify(tasks);
  return newTask;
}

/**
 * Update an existing task.
 */
export async function updateTask(id, updates) {
  const tasks = getStorageData();
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return;

  const previous = tasks[index];
  const nextStatus = updates.status ?? previous.status;
  const nowIso = new Date().toISOString();
  const completedAt = nextStatus === 'done'
    ? (previous.completedAt || nowIso)
    : null;

  tasks[index] = { 
    ...previous,
    ...updates, 
    completedAt,
    updatedAt: nowIso,
  };
  
  saveAndNotify(tasks);
}

/**
 * Delete a task by ID.
 */
export async function deleteTask(id) {
  const tasks = getStorageData().filter(t => t.id !== id);
  saveAndNotify(tasks);
}
