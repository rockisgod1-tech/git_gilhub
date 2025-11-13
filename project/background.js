function showReminderIfAllowed() {
  // get settings and saved words
  chrome.storage.local.get(["wordList", "reminderEnabled", "reminderStart", "reminderEnd"], function(res) {
    var list = res.wordList || [];
    if (!res.reminderEnabled) return; // reminders turned off
    if (list.length === 0) return; // nothing to remind

    var now = new Date();
    var hour = now.getHours(); // 0-23
    var start = (typeof res.reminderStart === 'number') ? res.reminderStart : 0;
    var end = (typeof res.reminderEnd === 'number') ? res.reminderEnd : 24;

    // check if current hour is inside the allowed window
    var inWindow;
    if (start <= end) {
      inWindow = (hour >= start && hour < end);
    } else {
      // window wraps midnight
      inWindow = (hour >= start || hour < end);
    }

    if (!inWindow) return;

    // choose one random saved item and show only the word text
    var idx = Math.floor(Math.random() * list.length);
    var item = list[idx];
    if (!item) return;
    var wordText = '';
    if (typeof item === 'string') {
      wordText = item;
    } else if (item && item.word) {
      wordText = item.word;
    } else {
      wordText = JSON.stringify(item);
    }

    chrome.notifications.create('', {
      type: 'basic',
      iconUrl: 'icons/icon128x128.png',
      title: 'Word reminder',
      message: wordText || 'Remember a word!'
    }, function(notificationId) {
      // callback after notification created
      console.log('Notification shown', notificationId, wordText);
    });
  });
}
  // No extra experiment code here; keep background simple for submission.

function setupAlarmFromSettings() {
  chrome.storage.local.get({ reminderEnabled: true, reminderInterval: 30 }, function(res) {
    chrome.alarms.clear('reminderAlarm', function() {
      if (!res.reminderEnabled) return;
      var interval = parseInt(res.reminderInterval, 10) || 30;
      if (interval < 1) interval = 1;
      chrome.alarms.create('reminderAlarm', { periodInMinutes: interval });
    });
  });
}

// initial setup
setupAlarmFromSettings();
// Also run once on startup so the user sees a test notification quickly (if enabled)
showReminderIfAllowed();

// react to storage changes (when user updates settings)
chrome.storage.onChanged.addListener(function(changes, area) {
  if (area !== 'local') return;
  // if user changes reminder settings, recreate the alarm
  if (changes.reminderEnabled || changes.reminderInterval || changes.reminderStart || changes.reminderEnd) {
    setupAlarmFromSettings();
  }
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm && alarm.name === 'reminderAlarm') {
    showReminderIfAllowed();
  }
});

// respond to test requests from popup (show a reminder immediately)
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message && message.action === 'testReminder') {
    showReminderIfAllowed();
    // reply immediately (no need to keep port open)
    sendResponse({ ok: true });
  }
});
