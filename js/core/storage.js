// ============================================================================
// LOCK IN 2027 — js/core/storage.js
// localStorage: klucze per-user, ustawienia, tryby (toggle), BMI.
// ============================================================================

const USER_NAME_DEFAULT = "Karol";

export function localKey(key, uid) {
  return `regim:${uid || (window.__currentUser && window.__currentUser.uid) || "local"}:${key}`;
}

export function getToggle(name) {
  const v = localStorage.getItem("regim:toggle-" + name);
  if (v === null) return true;
  return v === "1";
}

export function setToggle(name, val) {
  localStorage.setItem("regim:toggle-" + name, val ? "1" : "0");
}

export function isBoosterActive() {
  return !getToggle("skincare") || !getToggle("supplements");
}

export function getSettings() {
  return {
    name: localStorage.getItem("regim:name") || USER_NAME_DEFAULT,
    age: parseInt(localStorage.getItem("regim:age")) || 14,
    height: parseFloat(localStorage.getItem("regim:height")) || 166,
    heightDad: parseFloat(localStorage.getItem("regim:height-dad")) || null,
    heightMom: parseFloat(localStorage.getItem("regim:height-mom")) || null,
    goalWeight: parseFloat(localStorage.getItem("regim:goal-weight")) || 50.0,
    startWeight: parseFloat(localStorage.getItem("regim:start-weight")) || 45.0,
    d3Iu: parseInt(localStorage.getItem("regim:d3-iu")) || 2000,
    d3Tablets: parseInt(localStorage.getItem("regim:d3-tablets")) || 2
  };
}

export function saveSettings(s) {
  if (s.name != null) localStorage.setItem("regim:name", s.name);
  if (s.age != null) localStorage.setItem("regim:age", String(s.age));
  if (s.height != null) localStorage.setItem("regim:height", String(s.height));
  if (s.heightDad != null) localStorage.setItem("regim:height-dad", String(s.heightDad));
  if (s.heightMom != null) localStorage.setItem("regim:height-mom", String(s.heightMom));
  if (s.goalWeight != null) localStorage.setItem("regim:goal-weight", String(s.goalWeight));
  if (s.startWeight != null) localStorage.setItem("regim:start-weight", String(s.startWeight));
  if (s.d3Iu != null) localStorage.setItem("regim:d3-iu", String(s.d3Iu));
  if (s.d3Tablets != null) localStorage.setItem("regim:d3-tablets", String(s.d3Tablets));
}

export function calcBMI(w, h) {
  if (!w || !h) return null;
  return w / ((h / 100) ** 2);
}

export function bmiLabel(b) {
  if (b == null) return "";
  if (b < 18.5) return "Niedowaga";
  if (b < 25) return "Norma";
  if (b < 30) return "Nadwaga";
  return "Otyłość";
}
