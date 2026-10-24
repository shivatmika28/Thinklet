// [PERSONAL] Generates self-contained interactive offline HTML and JSON study packs
export interface OfflinePackData {
  studentName?: string;
  generatedDate: string;
  dailyGoalMinutes: number;
  completedMinutes: number;
  streakDays: number;
  quests: Array<{
    title: string;
    topicName: string;
    completed: boolean;
  }>;
  notes: Array<{
    title: string;
    topic: string;
    summary: string;
    keyPoints: string[];
  }>;
  flashcards: Array<{
    id: string;
    topic: string;
    question: string;
    answer: string;
  }>;
}

export function generateOfflineHtml(data: OfflinePackData): string {
  const jsonStr = JSON.stringify(data, null, 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thinklet Offline Study Pack — ${data.generatedDate}</title>
  <style>
    :root {
      --bg: #FDFBF7;
      --surface: #FFFFFF;
      --surface-raised: #F7EFE5;
      --text: #30251F;
      --text-muted: #7A6961;
      --terracotta: #98473E;
      --copper: #A37C40;
      --sage: #52796F;
      --border: #E8DDD2;
      --border-soft: #F0E8DF;
      --shadow: 0 4px 18px rgba(48, 37, 31, 0.08);
      --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #1B1512;
        --surface: #241D19;
        --surface-raised: #30251F;
        --text: #F7EFE5;
        --text-muted: #B49082;
        --border: #3E3129;
        --border-soft: #2D231E;
        --shadow: 0 4px 18px rgba(0, 0, 0, 0.35);
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font-family);
      line-height: 1.6;
      padding: 24px;
      max-width: 900px;
      margin: 0 auto;
    }
    header {
      padding-bottom: 20px;
      border-bottom: 2px solid var(--border);
      margin-bottom: 28px;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 4px 10px;
      border-radius: 9999px;
      background: var(--terracotta);
      color: white;
      margin-bottom: 8px;
    }
    h1 { font-size: 26px; font-weight: 800; margin-bottom: 6px; }
    .subtitle { font-size: 13px; color: var(--text-muted); }
    .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      margin: 20px 0 28px;
    }
    .metric-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 14px;
      box-shadow: var(--shadow);
    }
    .metric-label { font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }
    .metric-val { font-size: 22px; font-weight: 800; color: var(--terracotta); margin-top: 4px; }
    section { margin-bottom: 36px; }
    h2 { font-size: 18px; font-weight: 800; margin-bottom: 14px; color: var(--text); border-left: 4px solid var(--terracotta); padding-left: 10px; }
    .quest-item {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--surface);
      border: 1px solid var(--border);
      padding: 12px 16px;
      border-radius: 12px;
      margin-bottom: 8px;
    }
    .quest-item input[type="checkbox"] { width: 18px; height: 18px; accent-color: var(--terracotta); cursor: pointer; }
    .quest-title { font-size: 14px; font-weight: 700; }
    .quest-topic { font-size: 11px; color: var(--text-muted); }
    .note-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 18px;
      margin-bottom: 14px;
      box-shadow: var(--shadow);
    }
    .note-title { font-size: 16px; font-weight: 800; margin-bottom: 4px; }
    .note-summary { font-size: 13px; color: var(--text-muted); margin-bottom: 12px; }
    .note-points { list-style: disc inside; font-size: 13px; padding-left: 4px; }
    .note-points li { margin-bottom: 6px; }
    .flashcard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 14px;
    }
    .flashcard {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 18px;
      min-height: 160px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      cursor: pointer;
      transition: transform 0.15s, border-color 0.15s;
      box-shadow: var(--shadow);
    }
    .flashcard:hover { transform: translateY(-2px); border-color: var(--terracotta); }
    .card-topic { font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--copper); margin-bottom: 8px; }
    .card-q { font-size: 14px; font-weight: 700; margin-bottom: 12px; }
    .card-a {
      font-size: 13px;
      color: var(--sage);
      background: var(--surface-raised);
      padding: 10px 12px;
      border-radius: 10px;
      display: none;
      border-left: 3px solid var(--sage);
    }
    .flashcard.flipped .card-a { display: block; }
    .card-hint { font-size: 11px; color: var(--text-muted); font-weight: 600; text-align: right; }
    footer {
      text-align: center;
      padding-top: 24px;
      border-top: 1px solid var(--border);
      font-size: 12px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <header>
    <div class="badge">Offline Study Pack</div>
    <h1>Thinklet Self-Contained Study Session</h1>
    <div class="subtitle">Generated on ${data.generatedDate} • Zero network connection required</div>
  </header>

  <div class="metrics">
    <div class="metric-card">
      <div class="metric-label">Daily Goal</div>
      <div class="metric-val">${data.completedMinutes}/${data.dailyGoalMinutes}m</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Active Streak</div>
      <div class="metric-val">${data.streakDays} Days 🔥</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Revision Quests</div>
      <div class="metric-val">${data.quests.length} Total</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Offline Cards</div>
      <div class="metric-val">${data.flashcards.length} Cards</div>
    </div>
  </div>

  <section>
    <h2>Today's Revision Quests</h2>
    ${
      data.quests.length === 0
        ? '<p style="color:var(--text-muted);font-size:13px;">All revision quests currently completed!</p>'
        : data.quests
            .map(
              (q) => `
      <div class="quest-item">
        <input type="checkbox" id="q-${encodeURIComponent(q.title)}" ${q.completed ? 'checked' : ''} onchange="this.parentElement.style.opacity = this.checked ? '0.5' : '1'">
        <div>
          <div class="quest-title">${escapeHtml(q.title)}</div>
          <div class="quest-topic">${escapeHtml(q.topicName)}</div>
        </div>
      </div>`
            )
            .join('')
    }
  </section>

  <section>
    <h2>Key Notes & Foundations</h2>
    ${
      data.notes.length === 0
        ? '<p style="color:var(--text-muted);font-size:13px;">No study notes found in this pack.</p>'
        : data.notes
            .map(
              (n) => `
      <div class="note-card">
        <div class="card-topic">${escapeHtml(n.topic)}</div>
        <div class="note-title">${escapeHtml(n.title)}</div>
        <div class="note-summary">${escapeHtml(n.summary)}</div>
        <ul class="note-points">
          ${n.keyPoints.map((kp) => `<li>${escapeHtml(kp)}</li>`).join('')}
        </ul>
      </div>`
            )
            .join('')
    }
  </section>

  <section>
    <h2>Interactive Flashcards (Click Card to Flip)</h2>
    <div class="flashcard-grid">
      ${
        data.flashcards.length === 0
          ? '<p style="color:var(--text-muted);font-size:13px;">No flashcards available in this pack.</p>'
          : data.flashcards
              .map(
                (f) => `
        <div class="flashcard" onclick="this.classList.toggle('flipped')">
          <div>
            <div class="card-topic">${escapeHtml(f.topic)}</div>
            <div class="card-q">${escapeHtml(f.question)}</div>
            <div class="card-a">${escapeHtml(f.answer)}</div>
          </div>
          <div class="card-hint">Tap to flip ↺</div>
        </div>`
              )
              .join('')
      }
    </div>
  </section>

  <footer>
    <p>Thinklet Self-Contained Offline Study Pack • Pure HTML/CSS without cloud dependencies</p>
  </footer>

  <script>
    // Embedded JSON copy for program export
    window.__THINKLET_OFFLINE_DATA__ = ${jsonStr};
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function downloadBlob(content: string, filename: string, mimeType: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
