# Contributing to Focus Timer

Thank you for helping improve Codebreakers projects!

---

## Contribution Rules

1. **Claim First:** Comment on an open issue and wait to be assigned before starting your work.
2. **One Feature, One Branch:** Create a branch (e.g., `git switch -c add-sound-alert`). Never commit directly to `main`.
3. **Keep It Vanilla:** Do not install third-party libraries or npm modules.
4. **Automated/bot submissions will be closed without review.**

---

## How to Add a New Timer Preset

If you want to contribute a new study preset:
1. Open `js/data.js`.
2. Add a new preset object to `timerPresets`:
   ```javascript
   {
     id: 5,
     name: "Sprint",
     minutes: 15,
     description: "Quick rapid-coding interval"
   }

    Test by refreshing index.html in your browser.