const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const toDateKey = (value) => {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const normalizeEntities = (entities = []) => (
  entities
    .map((e) => ({
      person: e?.person?.trim() || '',
      task: e?.task?.trim() || '',
      hours: Number(e?.hours) || 0,
      status: e?.status === 'pending' ? 'pending' : 'completed',
    }))
    .filter((e) => e.person && e.task && e.hours > 0)
);

export function subscribeWorkLogs(callback) {
  let isSubscribed = true;

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/worklogs`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      if (isSubscribed) callback(data);
    } catch (err) {
      console.error('Worklog fetch error:', err);
    }
  };

  fetchLogs();
  const interval = setInterval(fetchLogs, 5000); // Poll every 5s

  return () => {
    isSubscribed = false;
    clearInterval(interval);
  };
}

export async function getWorkLogByDate(dateKey) {
  try {
    const res = await fetch(`${API_URL}/worklogs/${dateKey}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch (err) {
    console.error('Get worklog error:', err);
    return null;
  }
}

export function getTodayWorkLog() {
  return getWorkLogByDate(toDateKey(new Date()));
}

export async function upsertDailyWorkLog(logData) {
  const dateKey = logData.dateKey || toDateKey(new Date());
  const entities = normalizeEntities(logData.entities || []);

  const payload = {
    dateKey,
    entities,
  };

  const res = await fetch(`${API_URL}/worklogs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to save log');
  }

  return await res.json();
}

export { toDateKey };
