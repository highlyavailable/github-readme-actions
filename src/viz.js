const UNICODE_BLOCKS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
const HEATMAP_LEVELS = ['·', '░', '▒', '▓', '█'];

const KNOWN_VIZ_STYLES = ['mermaid', 'unicode', 'both'];

function pickStyle(style) {
  return KNOWN_VIZ_STYLES.includes(style) ? style : 'mermaid';
}

function unicodeSparkline(values) {
  if (!values.length) return '';
  const max = Math.max(...values, 1);
  return values
    .map((v) => {
      const idx = Math.min(
        UNICODE_BLOCKS.length - 1,
        Math.round((v / max) * (UNICODE_BLOCKS.length - 1))
      );
      return UNICODE_BLOCKS[idx];
    })
    .join('');
}

function mermaidLineChart({ title, labels, values, yAxisLabel = 'Count' }) {
  if (!values.length) return '';
  const max = Math.max(...values, 1);
  const yMax = Math.ceil(max * 1.1);
  const labelList = labels.map((l) => `"${String(l).replace(/"/g, '')}"`).join(', ');
  const valueList = values.join(', ');
  return [
    '```mermaid',
    'xychart-beta',
    `    title "${title}"`,
    `    x-axis [${labelList}]`,
    `    y-axis "${yAxisLabel}" 0 --> ${yMax}`,
    `    line [${valueList}]`,
    '```'
  ].join('\n');
}

function mermaidBarChart({ title, labels, values, yAxisLabel = 'Count' }) {
  if (!values.length) return '';
  const max = Math.max(...values, 1);
  const yMax = Math.ceil(max * 1.1);
  const labelList = labels.map((l) => `"${String(l).replace(/"/g, '')}"`).join(', ');
  const valueList = values.join(', ');
  return [
    '```mermaid',
    'xychart-beta',
    `    title "${title}"`,
    `    x-axis [${labelList}]`,
    `    y-axis "${yAxisLabel}" 0 --> ${yMax}`,
    `    bar [${valueList}]`,
    '```'
  ].join('\n');
}

function renderSparkline({ style, title, labels, values, yAxisLabel }) {
  const picked = pickStyle(style);
  const unicode = unicodeSparkline(values);
  const mermaid = mermaidLineChart({ title, labels, values, yAxisLabel });
  if (picked === 'unicode') return unicode;
  if (picked === 'both') return `${mermaid}\n\n_Fallback:_ \`${unicode}\``;
  return mermaid;
}

function renderBarChart({ style, title, labels, values, yAxisLabel }) {
  const picked = pickStyle(style);
  const mermaid = mermaidBarChart({ title, labels, values, yAxisLabel });
  if (picked === 'unicode' || picked === 'both') {
    const max = Math.max(...values, 1);
    const lines = labels.map((label, i) => {
      const width = Math.round((values[i] / max) * 20);
      const bar = '█'.repeat(width).padEnd(20, ' ');
      return `\`${label.padEnd(24)}\` \`${bar}\` ${values[i]}`;
    });
    const unicode = lines.join('\n');
    if (picked === 'unicode') return unicode;
    return `${mermaid}\n\n<details><summary>Plain-text fallback</summary>\n\n${unicode}\n\n</details>`;
  }
  return mermaid;
}

function levelFor(count, levels = HEATMAP_LEVELS) {
  if (count === 0) return levels[0];
  if (count <= 2) return levels[1];
  if (count <= 5) return levels[2];
  if (count <= 10) return levels[3];
  return levels[4];
}

function unicodeHeatmap(weeks) {
  // weeks: array of arrays of { date, count }. Each inner array is up to 7 days (Sun-Sat).
  if (!weeks.length) return '';
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const lines = [];
  for (let day = 0; day < 7; day += 1) {
    const cells = weeks.map((week) => {
      const cell = week.find((d) => d.weekday === day);
      return cell ? levelFor(cell.count) : ' ';
    });
    lines.push(`${dayLabels[day]} ${cells.join('')}`);
  }
  return ['```text', ...lines, '```', '', '_Legend: `·` 0 · `░` 1–2 · `▒` 3–5 · `▓` 6–10 · `█` 11+_'].join('\n');
}

function bucketByWeek(timestamps, weeks, nowMs = Date.now()) {
  const buckets = new Array(weeks).fill(0);
  const weekMs = 7 * 86400 * 1000;
  const startMs = nowMs - weeks * weekMs;
  for (const ts of timestamps) {
    const t = new Date(ts).getTime();
    if (!Number.isFinite(t) || t < startMs || t > nowMs) continue;
    const idx = Math.min(weeks - 1, Math.floor((t - startMs) / weekMs));
    buckets[idx] += 1;
  }
  return buckets;
}

function weekLabels(weeks, nowMs = Date.now()) {
  // Oldest first. Each label is the ISO date of the week's Monday.
  const out = [];
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const d = new Date(nowMs - i * 7 * 86400 * 1000);
    out.push(d.toISOString().slice(5, 10)); // MM-DD
  }
  return out;
}

module.exports = {
  KNOWN_VIZ_STYLES,
  UNICODE_BLOCKS,
  HEATMAP_LEVELS,
  pickStyle,
  unicodeSparkline,
  mermaidLineChart,
  mermaidBarChart,
  renderSparkline,
  renderBarChart,
  unicodeHeatmap,
  bucketByWeek,
  weekLabels,
  levelFor
};
