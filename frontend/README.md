# 📊 DailyTrack — Daily Work Tracker

A clean, professional task management and daily work tracking app built with **React**, **Firebase Firestore**, **Tailwind CSS**, **Recharts**, and **jsPDF**.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Real-time sync** | Tasks sync instantly via Firestore `onSnapshot` |
| **Dashboard** | Summary cards, progress bars, bar chart (last 7 days), filter/search |
| **Task CRUD** | Add, edit, delete tasks; cycle status with one click |
| **Manager View** | Tasks grouped by assignee with per-user progress |
| **PDF Export** | Generate structured PDF reports (full or per-user) |
| **Dark design** | Slate-950 dark theme with Inter font and brand-indigo accents |

---

## 🚀 Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Firebase
Edit `src/services/firebase.js` and replace the placeholder values with your Firebase project config:
```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  ...
};
```
> Get this from: [Firebase Console](https://console.firebase.google.com/) → Project Settings → Your apps

### 3. Set up Firestore
- Enable **Cloud Firestore** in your Firebase project (Start in **test mode** for development)
- The app writes to a `tasks` collection automatically

### 4. Run locally
```bash
npm run dev
```
Then open [http://localhost:5173](http://localhost:5173)

---

## 🗂️ Project Structure

```
src/
├── components/
│   ├── AddTaskModal.jsx    # Add / edit task modal
│   ├── ProgressBar.jsx     # Animated progress bar
│   ├── SummaryCard.jsx     # Stat card with gradient
│   ├── TaskCard.jsx        # Task row with status cycling
│   └── WeeklyChart.jsx     # Recharts bar chart
├── pages/
│   ├── Dashboard.jsx       # Main task dashboard
│   └── ManagerView.jsx     # Manager team overview
├── services/
│   └── firebase.js         # Firestore config + helpers
├── utils/
│   └── pdfGenerator.js     # jsPDF report generator
├── App.jsx                 # Router + layout
├── main.jsx                # Entry point
└── index.css               # Tailwind + global styles
```

---

## 🛠️ Tech Stack

- **React 18** + Vite
- **Firebase Firestore** (real-time data)
- **Tailwind CSS v3**
- **Recharts** (bar chart)
- **jsPDF** + **html2canvas** (PDF export)
- **React Router v6**

---

## 📄 License
MIT
