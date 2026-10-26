const input = document.getElementById("binaryInput");
const runBtn = document.getElementById("runBtn");
const clearBtn = document.getElementById("clearBtn");
const stepBtn = document.getElementById("stepBtn");
const resetBtn = document.getElementById("resetBtn");
const resultCard = document.getElementById("resultCard");
const resultIcon = document.getElementById("resultIcon");
const resultTitle = document.getElementById("resultTitle");
const resultMessage = document.getElementById("resultMessage");
const lengthMetric = document.getElementById("lengthMetric");
const readMetric = document.getElementById("readMetric");
const stateMetric = document.getElementById("stateMetric");
const traceEmpty = document.getElementById("traceEmpty");
const traceArea = document.getElementById("traceArea");
const stepCounter = document.getElementById("stepCounter");
const toast = document.getElementById("toast");

const transitions = {
  q0: { "0": "q1", "1": "q0" },
  q1: { "0": "q1", "1": "q2" },
  q2: { "0": "q1", "1": "q0" }
};

let simulation = null;
let visibleSteps = 0;
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}

function clearHighlights() {
  document.querySelectorAll(".state").forEach(el => el.classList.remove("current"));
  document.querySelectorAll(".edge").forEach(el => el.classList.remove("active"));
}

function edgeFor(from, symbol, to) {
  if (from === "q0" && symbol === "1") return "q0-0";
  if (from === "q0" && symbol === "0") return "q0-1";
  if (from === "q1" && symbol === "0") return "q1-0";
  if (from === "q1" && symbol === "1") return "q1-1";
  if (from === "q2" && symbol === "0") return "q2-0";
  if (from === "q2" && symbol === "1") return "q2-1";
  return null;
}

function makeTrace(value) {
  const steps = [{ index: 0, symbol: "START", from: "—", to: "q0", state: "q0", edge: null }];
  let state = "q0";
  for (let i = 0; i < value.length; i++) {
    const next = transitions[state][value[i]];
    steps.push({
      index: i + 1,
      symbol: value[i],
      from: state,
      to: next,
      state: next,
      edge: edgeFor(state, value[i], next)
    });
    state = next;
  }
  return { value, steps, finalState: state, accepted: state === "q2" };
}

function renderTrace() {
  traceArea.innerHTML = "";
  simulation.steps.forEach((step, idx) => {
    const card = document.createElement("div");
    card.className = "trace-step" + (idx === 0 ? " start-step" : "") +
      (idx < visibleSteps ? " done" : "") + (idx === visibleSteps - 1 ? " current" : "");
    const bit = document.createElement("span");
    bit.className = "bit";
    bit.textContent = idx === 0 ? "▶" : step.symbol;
    const arrow = document.createElement("span");
    arrow.className = "arrow-small";
    arrow.textContent = idx === 0 ? "INITIAL" : `${step.from} →`;
    const state = document.createElement("span");
    state.className = "state-label";
    state.textContent = step.to;
    card.append(bit, arrow, state);
    traceArea.appendChild(card);
  });
  traceEmpty.classList.add("hidden");
  traceArea.classList.remove("hidden");
  stepCounter.textContent = visibleSteps >= simulation.steps.length
    ? `Complete · ${simulation.value.length} symbol(s) read`
    : `Step ${Math.max(0, visibleSteps - 1)} of ${simulation.value.length}`;
  stepBtn.disabled = visibleSteps >= simulation.steps.length;
  stepBtn.textContent = visibleSteps >= simulation.steps.length ? "Simulation complete" : "Next step →";
  resetBtn.disabled = false;
  updateDiagram();
  updateMetrics();
}

function updateDiagram() {
  clearHighlights();
  if (!simulation) return;
  const currentStep = simulation.steps[Math.max(0, visibleSteps - 1)];
  const stateEl = document.querySelector(`[data-state="${currentStep.state}"]`);
  if (stateEl) stateEl.classList.add("current");
  if (currentStep.edge) {
    const edgeEl = document.querySelector(`[data-edge="${currentStep.edge}"]`);
    if (edgeEl) edgeEl.classList.add("active");
  }
}

function updateMetrics() {
  lengthMetric.textContent = simulation.value.length;
  readMetric.textContent = Math.max(0, visibleSteps - 1);
  const current = simulation.steps[Math.max(0, visibleSteps - 1)].state;
  stateMetric.textContent = current;
}

function setDecision(type, title, message, icon) {
  resultCard.className = `result-card ${type}`;
  resultTitle.textContent = title;
  resultMessage.textContent = message;
  resultIcon.textContent = icon;
}

function runSimulation() {
  const value = input.value.trim();
  clearHighlights();

  if (!value) {
    setDecision("invalid", "Input required", "Enter a binary string before running the DFA.", "!");
    lengthMetric.textContent = "—";
    readMetric.textContent = "—";
    stateMetric.textContent = "—";
    traceArea.classList.add("hidden");
    traceEmpty.classList.remove("hidden");
    stepBtn.disabled = true;
    resetBtn.disabled = true;
    simulation = null;
    showToast("Please enter a binary string.");
    input.focus();
    return;
  }

  if (!/^[01]+$/.test(value)) {
    setDecision("invalid", "Invalid input", "Only the symbols 0 and 1 belong to this DFA's alphabet.", "!");
    lengthMetric.textContent = value.length;
    readMetric.textContent = "0";
    stateMetric.textContent = "—";
    traceArea.classList.add("hidden");
    traceEmpty.classList.remove("hidden");
    stepBtn.disabled = true;
    resetBtn.disabled = true;
    simulation = null;
    showToast("Invalid symbol detected. Use only 0 and 1.");
    return;
  }

  simulation = makeTrace(value);
  visibleSteps = 1;
  setDecision("idle", "Simulation in progress", "Step through the input to see each state transition.", "↻");
  renderTrace();
  showToast("DFA simulation started.");
}

function finishDecision() {
  if (!simulation || visibleSteps < simulation.steps.length) return;
  if (simulation.accepted) {
    setDecision("accepted", "String accepted", `The string ends with 01 and belongs to the language.`, "✓");
  } else {
    setDecision("rejected", "String rejected", `The string does not end with 01. Final state: ${simulation.finalState}.`, "×");
  }
  updateMetrics();
}

function resetSimulation() {
  if (!simulation) return;
  visibleSteps = 1;
  setDecision("idle", "Simulation reset", "Press Next step to run through the input again.", "↻");
  renderTrace();
}

runBtn.addEventListener("click", runSimulation);
input.addEventListener("keydown", event => {
  if (event.key === "Enter") runSimulation();
});
clearBtn.addEventListener("click", () => {
  input.value = "";
  simulation = null;
  visibleSteps = 0;
  clearHighlights();
  setDecision("idle", "Awaiting input", "Run a string to see whether it belongs to the language.", "◎");
  lengthMetric.textContent = readMetric.textContent = stateMetric.textContent = "—";
  traceArea.innerHTML = "";
  traceArea.classList.add("hidden");
  traceEmpty.classList.remove("hidden");
  stepBtn.disabled = resetBtn.disabled = true;
  stepCounter.textContent = "No simulation yet";
  input.focus();
});
document.querySelectorAll(".example-chip").forEach(btn => {
  btn.addEventListener("click", () => {
    input.value = btn.dataset.value;
    runSimulation();
  });
});
stepBtn.addEventListener("click", () => {
  if (!simulation || visibleSteps >= simulation.steps.length) return;
  visibleSteps++;
  renderTrace();
  if (visibleSteps >= simulation.steps.length) finishDecision();
});
resetBtn.addEventListener("click", resetSimulation);

// Initial state highlight
document.querySelector('[data-state="q0"]').classList.add("current");
