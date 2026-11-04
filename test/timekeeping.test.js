// Run with: node test/timekeeping.test.js
// Loads js/app.js into a sandbox with a fake clock and fake interval timer,
// then simulates a throttled tab where the interval callback fires far less
// often than once per second.
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const source = fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8");

const clock = { now: 1000000 };
const elements = {};
const logged = [];
function makeElement() {
  return {
    textContent: "",
    innerHTML: "",
    className: "",
    classList: { add() {}, remove() {} },
    appendChild() {},
    prepend(item) { logged.push(item); },
    addEventListener() {},
    querySelector() { return null; },
  };
}
const document = {
  getElementById(id) {
    if (!elements[id]) elements[id] = makeElement();
    return elements[id];
  },
  querySelectorAll() { return []; },
  createElement() { return makeElement(); },
  addEventListener() {},
};

let timers = new Map();
let nextTimerId = 1;

class FakeDate extends Date {
  static now() { return clock.now; }
}

const sandbox = {
  document,
  Date: FakeDate,
  setInterval(fn) {
    const id = nextTimerId++;
    timers.set(id, fn);
    return id;
  },
  clearInterval(id) { timers.delete(id); },
};
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: "app.js" });

function run(code) {
  return vm.runInContext(code, sandbox);
}

function advance(ms) {
  clock.now += ms;
}

// Run the interval callbacks once, as a throttled tab would.
function fireCallbacks() {
  [...timers.values()].forEach((fn) => fn());
}

// Advance the clock by ms, but only run the interval callbacks once.
function throttledCallbackAfter(ms) {
  advance(ms);
  fireCallbacks();
}

// Countdown keeps the right time when callbacks are throttled.
run("durationSeconds = 60; remainingSeconds = 60; handleStartPause();");

for (let i = 0; i < 5; i++) {
  throttledCallbackAfter(7000);
}

const remaining = run("remainingSeconds");
assert.strictEqual(
  remaining,
  25,
  `countdown shows ${remaining}s left after 35s, expected 25s`
);

// Pause keeps the sub-second part, and paused time is not counted.
run("handleReset(); handleStartPause();");
advance(1500);
run("handleStartPause();"); // Pause after 1.5s: one second counted
assert.strictEqual(run("remainingSeconds"), 59, "pause should count 1s of 1.5s");
advance(60000);
run("handleStartPause();"); // Resume
advance(500);
fireCallbacks();
assert.strictEqual(
  run("remainingSeconds"),
  58,
  "resume should keep the 0.5s from before the pause"
);

// Reset clears the sub-second part, so the next run starts clean.
run("handleReset(); handleStartPause();");
advance(1500);
run("handleStartPause();"); // Pause: one second counted, 0.5s kept
run("handleReset(); handleStartPause();");
advance(500);
fireCallbacks();
assert.strictEqual(
  run("remainingSeconds"),
  60,
  "reset should drop the sub-second part kept from the paused run"
);
run("handleReset();");

// Stopwatch keeps the right time when callbacks are throttled and paused.
run("switchMode('stopwatch'); handleStartPause();");
throttledCallbackAfter(45000);
assert.strictEqual(run("stopwatchSeconds"), 45, "stopwatch should show 45s after a 45s gap");
throttledCallbackAfter(20500);
assert.strictEqual(run("stopwatchSeconds"), 65, "stopwatch should show 65s after 65.5s");
run("handleStartPause();"); // Pause with 0.5s kept
advance(300000);
run("handleStartPause();"); // Resume
advance(1000);
fireCallbacks();
assert.strictEqual(
  elements.timeDisplay.textContent,
  "01:06",
  "stopwatch display should resume from 65s with the kept 0.5s"
);
run("handleReset();");

// Timer completion runs once, even when a late callback passes zero.
run("switchMode('timer'); durationSeconds = 60; remainingSeconds = 60;");
logged.length = 0;
run("handleStartPause();");
throttledCallbackAfter(61000);
assert.strictEqual(run("remainingSeconds"), 0, "timer should stop at 0");
assert.strictEqual(logged.length, 1, "completion should be logged once");
assert.strictEqual(run("isRunning"), false, "timer should stop running on completion");
assert.strictEqual(
  elements.timerStatus.textContent,
  "Session Complete! Well done.",
  "completion status should be shown"
);
assert.strictEqual(timers.size, 0, "completion should clear the interval");
throttledCallbackAfter(5000);
fireCallbacks();
assert.strictEqual(logged.length, 1, "later callbacks should not log completion again");

console.log("timekeeping tests passed");
