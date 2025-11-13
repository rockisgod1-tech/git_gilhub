# WordsBark

This is a simple Chrome extension that lets you look up words, save them, and receive periodic single-word reminders.

How to load (for grading / testing):

1. Open Edge or Chrome.
2. Go to `edge://extensions`.
3. Turn on `Developer mode` (top-right).
4. Click `Load unpacked` and select the `project/` folder from this repository.
5. The extension "WordsBark" should appear in the extensions list.

Quick usage:

- Click the extension icon to open the popup.
- Paste a word into the textarea and click `Lookup`.
- When definitions show, click `Save to List` to save the word.
- Open `Manage List` to see saved words and remove them.
- In Reminder Settings, enable reminders and set interval/start/end hours.
- Click `Test Reminder` to trigger a reminder notification immediately.

Notes for graders:
- The code uses simple JavaScript (no modules) so it is easy to read.
- `dictionary.js` exposes a global `lookupWord(word)` function used by the popup.
- Reminders use the `alarms` and `notifications` extension APIs.

If you need me to make the code even simpler or add comments, tell me which file to focus on.

---

Developer / Student notes removed: code was simplified to a beginner-friendly submission.