// State
let currentMode = "timer"; // "timer" or "stopwatch"
let timerInterval = null;
let isRunning = false;
let durationSeconds = 25 * 60; // 25 minutes default
let remainingSeconds = durationSeconds;
let stopwatchSeconds = 0;

// DOM Elements
const timerTabBtn = document.getElementById("timerTabBtn");
const stopwatchTabBtn = document.getElementById("stopwatchTabBtn");
const presetsContainer = document.getElementById("presetsContainer");
const timeDisplay = document.getElementById("timeDisplay");
const timerStatus = document.getElementById("timerStatus");
const startPauseBtn = document.getElementById("startPauseBtn");
const resetBtn = document.getElementById("resetBtn");
const sessionList = document.getElementById("sessionList");

// 1. Format seconds into MM:SS
function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// 2. Render Timer Presets from data.js
function renderPresets() {
  presetsContainer.innerHTML = "";
  timerPresets.forEach((preset, index) => {
    const btn = document.createElement("button");
    btn.className = `preset-btn ${index === 0 ? "selected" : ""}`;
    btn.textContent = `${preset.name} (${preset.minutes}m)`;
    btn.addEventListener("click", () => selectPreset(preset, btn));
    presetsContainer.appendChild(btn);
  });
}

function selectPreset(preset, btnElement) {
  if (isRunning) return; // Prevent changing preset while running

  document.querySelectorAll(".preset-btn").forEach((b) => b.classList.remove("selected"));
  btnElement.classList.add("selected");

  durationSeconds = preset.minutes * 60;
  remainingSeconds = durationSeconds;
  timeDisplay.textContent = formatTime(remainingSeconds);
  timerStatus.textContent = preset.description;
}

// 3. Start/Pause Action
function handleStartPause() {
  if (isRunning) {
    // Pause
    clearInterval(timerInterval);
    isRunning = false;
    startPauseBtn.textContent = "Resume";
    timerStatus.textContent = "Paused";
  } else {
    // Start
    isRunning = true;
    startPauseBtn.textContent = "Pause";
    timerStatus.textContent = currentMode === "timer" ? "Focusing..." : "Tracking time...";

    timerInterval = setInterval(() => {
      if (currentMode === "timer") {
        if (remainingSeconds > 0) {
          remainingSeconds--;
          timeDisplay.textContent = formatTime(remainingSeconds);
        } else {
          // Timer Finished
          clearInterval(timerInterval);
          isRunning = false;
          startPauseBtn.textContent = "Start";
          timerStatus.textContent = "Session Complete! Well done.";
          logSession("Completed Timer", durationSeconds);
        }
      } else {
        // Stopwatch Mode
        stopwatchSeconds++;
        timeDisplay.textContent = formatTime(stopwatchSeconds);
      }
    }, 1000);
  }
}

// 4. Reset Action
function handleReset() {
  clearInterval(timerInterval);
  isRunning = false;
  startPauseBtn.textContent = "Start";

  if (currentMode === "timer") {
    remainingSeconds = durationSeconds;
    timeDisplay.textContent = formatTime(remainingSeconds);
    timerStatus.textContent = "Ready to focus";
  } else {
    stopwatchSeconds = 0;
    timeDisplay.textContent = "00:00";
    timerStatus.textContent = "Stopwatch ready";
  }
}

// 5. Mode Switchers
function switchMode(newMode) {
  if (currentMode === newMode) return;
  handleReset();
  currentMode = newMode;

  if (currentMode === "timer") {
    timerTabBtn.classList.add("active");
    stopwatchTabBtn.classList.remove("active");
    presetsContainer.classList.remove("hidden");
    timeDisplay.textContent = formatTime(remainingSeconds);
    timerStatus.textContent = "Ready to focus";
  } else {
    stopwatchTabBtn.classList.add("active");
    timerTabBtn.classList.remove("active");
    presetsContainer.classList.add("hidden");
    timeDisplay.textContent = "00:00";
    timerStatus.textContent = "Stopwatch ready";
  }
}

// 6. Log Session to List
function logSession(label, seconds) {
  const emptyLog = sessionList.querySelector(".empty-log");
  if (emptyLog) emptyLog.remove();

  const li = document.createElement("li");
  li.className = "session-item";
  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  li.innerHTML = `
    <span><strong>${label}</strong> (${Math.round(seconds / 60)} mins)</span>
    <span class="text-muted">${now}</span>
  `;
  sessionList.prepend(li);
}

// Event Listeners
startPauseBtn.addEventListener("click", handleStartPause);
resetBtn.addEventListener("click", handleReset);
timerTabBtn.addEventListener("click", () => switchMode("timer"));
stopwatchTabBtn.addEventListener("click", () => switchMode("stopwatch"));

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  renderPresets();
  timeDisplay.textContent = formatTime(durationSeconds);
});