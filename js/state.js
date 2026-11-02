export const state = {
  tasks: [],
  customTasks: [],
  morning: {},
  evening: {},
  note: "",
  mealPlan: { breakfast: [], breakfast2: [], lunch: [], dinner: [], snacks: [] },
  activeMeal: "breakfast",
  activeCat: "pieczywo",
  lastMilestoneShown: null,
  currentView: "overview",
  activeWorkout: null,
  analysisHistory: []
};

export function resetAppState() {
  state.tasks = [];
  state.customTasks = [];
  state.morning = {};
  state.evening = {};
  state.note = "";
  state.mealPlan = { breakfast: [], breakfast2: [], lunch: [], dinner: [], snacks: [] };
  state.activeMeal = "breakfast";
  state.activeCat = "pieczywo";
  state.lastMilestoneShown = null;
  state.currentView = "overview";
  state.activeWorkout = null;
  state.analysisHistory = [];
}
