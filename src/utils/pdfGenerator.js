import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Captures a DOM element and exports it as a PDF.
 * @param {string} elementId - The id of the DOM element to capture
 * @param {string} filename  - Output PDF filename (without extension)
 */
export async function exportElementToPDF(elementId, filename = 'report') {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found`);
    return;
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#0f172a',
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [canvas.width / 2, canvas.height / 2],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
  pdf.save(`${filename}.pdf`);
}

/**
 * Generate a structured task report PDF from task data.
 * @param {Array}  tasks    - Array of task objects
 * @param {string} userName - Name to appear in report header
 */
export function generateTaskReport(tasks, userName = 'All Users') {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  // Header
  pdf.setFillColor(79, 70, 229);
  pdf.rect(0, 0, pageW, 28, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Daily Work Tracker — Task Report', margin, 18);
  y = 36;

  // Meta
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 120);
  pdf.setFont('helvetica', 'normal');
  const now = new Date().toLocaleString();
  pdf.text(`Generated: ${now}   |   User: ${userName}   |   Total Tasks: ${tasks.length}`, margin, y);
  y += 8;

  // Divider
  pdf.setDrawColor(210, 210, 230);
  pdf.line(margin, y, pageW - margin, y);
  y += 6;

  // Status summary
  const done = tasks.filter(t => t.status === 'done').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const todo = tasks.filter(t => t.status === 'todo').length;

  pdf.setFontSize(10);
  pdf.setTextColor(50, 50, 80);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Done: ${done}   In Progress: ${inProgress}   To Do: ${todo}`, margin, y);
  y += 10;

  // Table header
  const cols = { title: margin, status: 90, priority: 125, assigned: 155, date: 185 };
  pdf.setFillColor(240, 240, 255);
  pdf.rect(margin, y - 4, pageW - margin * 2, 8, 'F');
  pdf.setFontSize(9);
  pdf.setTextColor(60, 60, 120);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Title', cols.title, y);
  pdf.text('Status', cols.status, y);
  pdf.text('Priority', cols.priority, y);
  pdf.text('Assigned To', cols.assigned, y);
  pdf.text('Created', cols.date, y);
  y += 7;

  // Sort rows: todo/in-progress first, then done
  const sortedTasks = [...tasks].sort((a, b) => {
    const order = { 'todo': 0, 'in-progress': 1, 'done': 2 };
    return order[a.status] - order[b.status];
  });

  // Rows
  pdf.setFont('helvetica', 'normal');
  sortedTasks.forEach((task, i) => {
    if (y > 270) {
      pdf.addPage();
      y = margin;
    }

    const rowBg = i % 2 === 0 ? [255, 255, 255] : [248, 248, 255];
    pdf.setFillColor(...rowBg);
    pdf.rect(margin, y - 4, pageW - margin * 2, 7, 'F');

    pdf.setTextColor(30, 30, 60);
    pdf.setFontSize(8.5);

    const title = task.title?.length > 35 ? task.title.slice(0, 32) + '…' : (task.title || '—');
    pdf.text(title, cols.title, y);
    pdf.text(task.status || '—', cols.status, y);
    pdf.text(task.priority || '—', cols.priority, y);
    pdf.text((task.assignedTo || '—').slice(0, 22), cols.assigned, y);

    const date = task.createdAt?.toDate
      ? task.createdAt.toDate().toLocaleDateString()
      : 'Just now'; // Fallback for pending server sync
    pdf.text(date, cols.date, y);
    y += 7;
  });

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(160, 160, 180);
  pdf.text('Daily Work Tracker • Confidential', pageW / 2, 290, { align: 'center' });

  pdf.save(`task-report-${Date.now()}.pdf`);
}
