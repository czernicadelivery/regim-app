export function $(id) { return document.getElementById(id); }

export function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s || "";
  return d.innerHTML;
}

export function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayKey() { return dateKey(new Date()); }

export function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

let audioCtx = null;
export function playSound(type = "done") {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.frequency.value = type === "done" ? 880 : type === "error" ? 220 : 440;
    g.gain.setValueAtTime(0.05, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    o.start(); o.stop(audioCtx.currentTime + 0.15);
  } catch (e) {}
}

export function fireConfetti() {
  const c = document.getElementById("confetti-canvas");
  if (!c) {
    const canvas = document.createElement("canvas");
    canvas.id = "confetti-canvas";
    canvas.style.cssText = "position:fixed;inset:0;z-index:1200;pointer-events:none;";
    document.body.appendChild(canvas);
    runConfetti(canvas);
  } else {
    runConfetti(c);
  }
}

function runConfetti(c) {
  const ctx = c.getContext("2d");
  c.width = innerWidth; c.height = innerHeight;
  const colors = ["#b6f05a", "#c8f56f", "#4ade80", "#fbbf24", "#f87171"];
  const parts = [];
  for (let i = 0; i < 80; i++) {
    parts.push({
      x: Math.random() * c.width, y: -20,
      vy: 2 + Math.random() * 3, vx: -1 + Math.random() * 2,
      s: 4 + Math.random() * 4,
      col: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 6.28
    });
  }
  let frames = 0;
  const tick = () => {
    ctx.clearRect(0, 0, c.width, c.height);
    parts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.rot += 0.1;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.col;
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s);
      ctx.restore();
    });
    frames++;
    if (frames < 180) requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, c.width, c.height);
  };
  tick();
}

export function formatDatePL(date) {
  return date.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function formatHHMM(date) {
  return date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}
