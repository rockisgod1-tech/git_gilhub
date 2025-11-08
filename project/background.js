function showReminderIfAllowed() {
  chrome.storage.local.get(["wordList", "reminderEnabled", "reminderStart", "reminderEnd"], function(res) {
    var list = res.wordList || [];
    if (!res.reminderEnabled) return;
    if (list.length === 0) return;

    var now = new Date();
    var hour = now.getHours(); // 0-23
    var start = (typeof res.reminderStart === 'number') ? res.reminderStart : 0;
    var end = (typeof res.reminderEnd === 'number') ? res.reminderEnd : 24;

    var inWindow = false;
    if (start <= end) {
      inWindow = (hour >= start && hour < end);
    } else {
      inWindow = (hour >= start || hour < end);
    }

    if (!inWindow) return;

    var randomWord = list[Math.floor(Math.random() * list.length)];
    var title = 'Reminder: ' + (randomWord.word || 'word');
    var message = '';
    if (randomWord.meanings) {
      if (typeof randomWord.meanings === 'string') {
        message = randomWord.meanings;
      } else if (typeof randomWord.meanings === 'object') {
        // try to pick one short definition
        for (var p in randomWord.meanings) {
          if (Array.isArray(randomWord.meanings[p]) && randomWord.meanings[p].length > 0) {
            message = randomWord.meanings[p][0].definition || '';
            break;
          }
        }
      }
    }

    try {
      chrome.notifications.create('', {
        type: 'basic',
        iconUrl: 'icons/icon128x128.png',
        title: title,
        message: message || 'Remember this word!'
      }, function(notificationId) {
        // optional callback
        console.log('Notification shown', notificationId);
      });
    } catch (e) {
      console.error('Failed to create notification:', e);
    }
  });
}

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
  if (changes.reminderEnabled || changes.reminderInterval) {
    setupAlarmFromSettings();
  }
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm && alarm.name === 'reminderAlarm') {
    showReminderIfAllowed();
  }
});
