// ============================================================================
// LOCK IN 2027 — js/components/chart.js
// Wrapper na globalny Chart.js (CDN w index.html).
// ============================================================================

const _instances = {};

export const COLORS = {
  accent: "#b6f05a",
  accentSoft: "rgba(182, 240, 90, 0.15)",
  success: "#4ade80",
  successSoft: "rgba(74, 222, 128, 0.15)",
  warning: "#fbbf24",
  warningSoft: "rgba(251, 191, 36, 0.15)",
  danger: "#f87171",
  dangerSoft: "rgba(248, 113, 113, 0.15)",
  info: "#60a5fa",
  infoSoft: "rgba(96, 165, 250, 0.15)",
  text: "#a8adb4",
  grid: "rgba(255, 255, 255, 0.06)"
};

export function baseChartOpts(extra = {}) {
  return Object.assign({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0e1014",
        borderColor: "rgba(255,255,255,0.12)",
        borderWidth: 1,
        titleColor: "#f4f5f6",
        bodyColor: "#a8adb4",
        padding: 10,
        cornerRadius: 8,
        displayColors: false
      }
    },
    scales: {
      x: {
        ticks: { color: COLORS.text, font: { size: 10, weight: "600" } },
        grid: { color: COLORS.grid, drawBorder: false }
      },
      y: {
        ticks: { color: COLORS.text, font: { size: 10, weight: "600" } },
        grid: { color: COLORS.grid, drawBorder: false },
        beginAtZero: false
      }
    },
    interaction: { intersect: false, mode: "index" }
  }, extra);
}

export function makeChart(canvasId, config) {
  const el = document.getElementById(canvasId);
  if (!el || typeof Chart === "undefined") return null;

  // Zniszcz poprzednią instancję jeśli istnieje
  const existing = Chart.getChart(el);
  if (existing) existing.destroy();
  if (_instances[canvasId]) {
    try { _instances[canvasId].destroy(); } catch (e) {}
    delete _instances[canvasId];
  }

  const chart = new Chart(el.getContext("2d"), config);
  _instances[canvasId] = chart;
  return chart;
}

export function destroyChart(canvasId) {
  if (_instances[canvasId]) {
    try { _instances[canvasId].destroy(); } catch (e) {}
    delete _instances[canvasId];
  }
}

export function makeLine(canvasId, labels, data, color = COLORS.accent, label = "") {
  return makeChart(canvasId, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label,
        data,
        borderColor: color,
        backgroundColor: color.replace(")", ", 0.15)").replace("rgb", "rgba"),
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: color,
        spanGaps: true
      }]
    },
    options: baseChartOpts()
  });
}

export function makeBar(canvasId, labels, data, color = COLORS.accent, label = "") {
  return makeChart(canvasId, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label,
        data,
        backgroundColor: color.replace(")", ", 0.6)").replace("rgb", "rgba"),
        borderColor: color,
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: baseChartOpts()
  });
}
