// ── Local Storage Data Layer ──────────────────────────────────────────────────
// This file replaces Firebase Firestore with LocalStorage for instant persistence.
// It uses CustomEvents to mimic real-time listeners across components.

const STORAGE_KEY = 'dailytrack_tasks';
const EVENT_NAME  = 'task_data_updated';

// Helper: Get data from storage
const getStorageData = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

// Helper: Save data and notify listeners
const saveAndNotify = (tasks) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
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
  const newTask = {
    ...taskData,
    id: Math.random().toString(36).substr(2, 9),
    status: taskData.status || 'todo',
    createdAt: { toDate: () => new Date() }, // Mimic Firestore Timestamp structure
    updatedAt: new Date().toISOString()
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

  tasks[index] = { 
    ...tasks[index], 
    ...updates, 
    updatedAt: new Date().toISOString() 
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
