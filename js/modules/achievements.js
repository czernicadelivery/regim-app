// ============================================================================
// LOCK IN 2027 — js/modules/achievements.js
// Ekran Osiągnięć, Poziomu i XP.
// ============================================================================

import { $, escapeHtml } from "../core/utils.js";
import { loadGamification } from "../core/data.js";
import { xpProgress, calcLevel } from "../core/gamification-engine.js";
import { state } from "../state.js";

const BADGES = [
  { id: "first_xp", icon: "🥉", name: "Pierwsze kroki", desc: "Zdobądź pierwsze XP", req: (xp) => xp > 0 },
  { id: "lvl_5", icon: "🥈", name: "Rozpęd", desc: "Osiągnij Poziom 5", req: (xp) => calcLevel(xp) >= 5 },
  { id: "lvl_10", icon: "🥇", name: "Lock In", desc: "Osiągnij Poziom 10", req: (xp) => calcLevel(xp) >= 10 },
  { id: "streak_7", icon: "🔥", name: "Tydzień dyscypliny", desc: "Streak 7 dni", req: (xp, s) => s >= 7 },
  { id: "streak_30", icon: "👑", name: "Miesiąc mocy", desc: "Streak 30 dni", req: (xp, s) => s >= 30 },
];

export async function render(container) {
  const gamData = await loadGamification() || { xp: 0, level: 1 };
  const xp = gamData.xp || 0;
  const streak = state._streak || 0;
  
  const progress = xpProgress(xp);
  const currentLevel = progress.currentLevel;

  container.innerHTML = `
    <div class="stack-lg">
      
      <!-- KARTA POZIOMU -->
      <div class="card card-accent text-center" style="padding: 30px 20px;">
        <div class="text-xs text-tertiary uppercase tracking-widest mb-2">Twój Poziom</div>
        <div style="font-size:72px; font-weight:900; line-height:1; color:var(--accent); margin-bottom:10px;">
          ${currentLevel}
        </div>
        
        <div class="progress progress-lg" style="max-width:300px; margin:0 auto;">
          <div class="progress-fill" style="width:${progress.pct}%"></div>
        </div>
        
        <div class="text-xs text-secondary mt-2">
          ${progress.gained} / ${progress.needed} XP do poziomu ${currentLevel + 1}
        </div>
      </div>

      <!-- STATYSTYKI -->
      <div class="grid-2">
        <div class="stat">
          <div class="stat-label">Całkowite XP</div>
          <div class="stat-value accent">${xp}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Streak</div>
          <div class="stat-value">${streak}<span class="stat-unit">dni</span></div>
        </div>
      </div>

      <!-- ODZNAKI -->
      <div>
        <div class="section-header"><span class="section-header-title">Odznaki</span></div>
        <div class="grid-3">
          ${BADGES.map(b => {
            const unlocked = b.req(xp, streak);
            return `
              <div class="card card-padded-sm text-center" style="${unlocked ? "" : "opacity:0.3; filter:grayscale(1);"}">
                <div style="font-size:32px; margin-bottom:8px;">${b.icon}</div>
                <div class="text-xs font-bold">${b.name}</div>
                <div class="text-[10px] text-tertiary mt-1">${b.desc}</div>
              </div>
            `;
          }).join("")}
        </div>
      </div>

    </div>
  `;
}
