function showReminder() {
  chrome.storage.local.get("wordList", (result) => {
    const list = result.wordList || [];
    if (list.length === 0) return;

    const randomWord = list[Math.floor(Math.random() * list.length)];
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon128.png",
      title: `Reminder: ${randomWord.word}`,
      message: randomWord.meaning
    });
  });
}

// Trigger every 30 minutes
chrome.alarms.create("reminderAlarm", { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "reminderAlarm") {
    showReminder();
  }
});
