// Simple variable names for DOM elements (beginner-friendly)
var lookupBtn = document.getElementById('lookupBtn');
var wordInput = document.getElementById('wordInput');
var resultsDiv = document.getElementById('results');
var saveBtn = document.getElementById('saveBtn');
var themeToggle = document.getElementById('themeToggle');

// Apply theme: dark or light
function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (themeToggle) themeToggle.checked = true;
  } else {
    document.documentElement.removeAttribute('data-theme');
    if (themeToggle) themeToggle.checked = false;
  }
}

// Load saved theme (if storage is available)
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
  chrome.storage.local.get({ theme: 'dark' }, function(res) {
    applyTheme(res.theme || 'dark');
  });
} else {
  applyTheme('dark');
}

if (themeToggle) {
  themeToggle.addEventListener('change', function(e) {
    var newTheme = e.target.checked ? 'dark' : 'light';
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ theme: newTheme });
    }
    applyTheme(newTheme);
  });
}

// Render meanings in a simple way
function renderMeanings(meanings, word) {
  resultsDiv.innerHTML = '';
  if (!meanings || Object.keys(meanings).length === 0) {
    resultsDiv.textContent = 'No definitions found.';
    if (saveBtn) saveBtn.style.display = 'none';
    return;
  }

  // For each part-of-speech, show a heading and a few definitions
  for (var pos in meanings) {
    if (!meanings.hasOwnProperty(pos)) continue;
    var defs = meanings[pos];
    var section = document.createElement('div');
    var h = document.createElement('h3');
    h.textContent = pos || 'Definition';
    section.appendChild(h);

    for (var i = 0; i < defs.length; i++) {
      var def = defs[i];
      var p = document.createElement('p');
      p.textContent = '• ' + (def.definition || '');
      section.appendChild(p);
      if (def.example) {
        var ex = document.createElement('blockquote');
        ex.textContent = 'Example: ' + def.example;
        section.appendChild(ex);
      }
    }

    resultsDiv.appendChild(section);
  }

  // show save button
  if (saveBtn) {
    saveBtn.style.display = 'block';
    saveBtn.onclick = function() {
      if (!(typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local)) {
        alert('Save not supported in this environment.');
        return;
      }
      chrome.storage.local.get({ wordList: [] }, function(result) {
        var list = result.wordList || [];
        list.push({ word: word, meanings: meanings });
        chrome.storage.local.set({ wordList: list }, function() {
          alert('Saved!');
        });
      });
    };
  }
}

// Lookup button handling
if (lookupBtn) {
  lookupBtn.addEventListener('click', function() {
    var w = wordInput.value.trim();
    if (!w) {
      resultsDiv.textContent = 'Please enter a word to look up.';
      return;
    }
    resultsDiv.textContent = 'Looking up...';
    // lookupWord returns a Promise from dictionary.js
    lookupWord(w).then(function(meanings) {
      renderMeanings(meanings, w);
    }).catch(function(err) {
      console.error('Lookup error:', err);
      resultsDiv.textContent = 'Error looking up word.';
      if (saveBtn) saveBtn.style.display = 'none';
    });
  });
} else {
  console.warn('Lookup button (#lookupBtn) not found in DOM');
}
// (kept intentionally simple and readable for a beginner)

// --- Manage list UI ---
var manageBtn = document.getElementById('manageBtn');
var manageView = document.getElementById('manageView');
var wordListDiv = document.getElementById('wordList');
var clearListBtn = document.getElementById('clearListBtn');
var backBtn = document.getElementById('backBtn');

function createRow(item, idx) {
  var row = document.createElement('div');
  row.style.borderBottom = '1px solid rgba(0,0,0,0.08)';
  row.style.padding = '6px 0';
  row.style.display = 'flex';
  row.style.alignItems = 'center';
  row.style.justifyContent = 'space-between';

  var left = document.createElement('div');
  left.style.flex = '1';
  var w = document.createElement('div');
  w.textContent = item.word || '(no word)';
  w.style.fontWeight = 'bold';
  left.appendChild(w);
  var m = document.createElement('div');
  m.textContent = (item.meanings && typeof item.meanings === 'string') ? item.meanings : '';
  m.style.fontStyle = 'italic';
  m.style.marginTop = '4px';
  left.appendChild(m);

  var removeBtn = document.createElement('button');
  removeBtn.textContent = 'Remove';
  removeBtn.className = 'small-btn';
  removeBtn.style.marginLeft = '8px';
  removeBtn.onclick = function() {
    chrome.storage.local.get({ wordList: [] }, function(res2) {
      var newList = res2.wordList || [];
      newList.splice(idx, 1);
      chrome.storage.local.set({ wordList: newList }, function() {
        loadWordList();
      });
    });
  };

  row.appendChild(left);
  row.appendChild(removeBtn);
  return row;
}

function loadWordList() {
  if (!wordListDiv) return;
  wordListDiv.innerHTML = 'Loading...';
  if (!(typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local)) {
    wordListDiv.textContent = 'No storage available.';
    return;
  }
  chrome.storage.local.get({ wordList: [] }, function(result) {
    var list = result.wordList || [];
    if (list.length === 0) {
      wordListDiv.innerHTML = '<p>No words saved.</p>';
      return;
    }
    wordListDiv.innerHTML = '';
    for (var i = 0; i < list.length; i++) {
      var row = createRow(list[i], i);
      wordListDiv.appendChild(row);
    }
  });
}

if (manageBtn) {
  manageBtn.addEventListener('click', function() {
    if (manageView) manageView.style.display = 'block';
    // hide main controls to keep simple
    lookupBtn.style.display = 'none';
    wordInput.style.display = 'none';
    resultsDiv.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'none';
    loadWordList();
  });
}

// Test reminder button: ask background to show one now
var testReminderBtn = document.getElementById('testReminderBtn');
if (testReminderBtn) {
  testReminderBtn.addEventListener('click', function() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'testReminder' }, function(response) {
        // optional callback
        if (response && response.ok) {
          alert('Test reminder sent.');
        } else {
          alert('Test reminder requested.');
        }
      });
    } else {
      alert('Cannot send test reminder in this environment.');
    }
  });
}

if (backBtn) {
  backBtn.addEventListener('click', function() {
    if (manageView) manageView.style.display = 'none';
    if (lookupBtn) lookupBtn.style.display = '';
    if (wordInput) wordInput.style.display = '';
    if (resultsDiv) resultsDiv.style.display = '';
    if (saveBtn) saveBtn.style.display = 'none';
  });
}

if (clearListBtn) {
  clearListBtn.addEventListener('click', function() {
    if (!confirm('Clear all saved words?')) return;
    chrome.storage.local.set({ wordList: [] }, function() {
      loadWordList();
    });
  });
}

// --- Reminder settings ---
var reminderEnabled = document.getElementById('reminderEnabled');
var reminderInterval = document.getElementById('reminderInterval');
var reminderStart = document.getElementById('reminderStart');
var reminderEnd = document.getElementById('reminderEnd');
var saveSettingsBtn = document.getElementById('saveSettingsBtn');

function loadSettings() {
  if (!(typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local)) return;
  chrome.storage.local.get({ reminderEnabled: true, reminderInterval: 30, reminderStart: 0, reminderEnd: 24 }, function(res) {
    if (reminderEnabled) reminderEnabled.checked = !!res.reminderEnabled;
    if (reminderInterval) reminderInterval.value = res.reminderInterval || 30;
    if (reminderStart) reminderStart.value = (typeof res.reminderStart === 'number') ? res.reminderStart : 0;
    if (reminderEnd) reminderEnd.value = (typeof res.reminderEnd === 'number') ? res.reminderEnd : 24;
  });
}

if (saveSettingsBtn) {
  saveSettingsBtn.addEventListener('click', function() {
    var enabled = !!(reminderEnabled && reminderEnabled.checked);
    var interval = parseInt((reminderInterval && reminderInterval.value) || 30, 10) || 30;
    if (interval < 1) interval = 1;
    var start = parseInt((reminderStart && reminderStart.value) || 0, 10);
    var end = parseInt((reminderEnd && reminderEnd.value) || 24, 10);
    if (isNaN(start) || start < 0) start = 0;
    if (isNaN(end) || end < 1) end = 24;
    chrome.storage.local.set({ reminderEnabled: enabled, reminderInterval: interval, reminderStart: start, reminderEnd: end }, function() {
      alert('Settings saved.');
    });
  });
}

// load saved settings on popup open
loadSettings();

