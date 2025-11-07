import { lookupWord } from '../dictionary.js';

const lookupBtn = document.getElementById('lookupBtn');
const wordInput = document.getElementById('wordInput');
const resultsDiv = document.getElementById('results');
const saveBtn = document.getElementById('saveBtn');
const themeToggle = document.getElementById('themeToggle');

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (themeToggle) themeToggle.checked = true;
  } else {
    document.documentElement.removeAttribute('data-theme');
    if (themeToggle) themeToggle.checked = false;
  }
}

// Load saved theme (default to dark for this extension)
if (typeof chrome?.storage?.local !== 'undefined') {
  chrome.storage.local.get({ theme: 'dark' }, (res) => {
    applyTheme(res.theme || 'dark');
  });
} else {
  // fallback if chrome.storage isn't available (e.g., unit tests)
  applyTheme('dark');
}

if (themeToggle) {
  themeToggle.addEventListener('change', (e) => {
    const newTheme = e.target.checked ? 'dark' : 'light';
    if (typeof chrome?.storage?.local !== 'undefined') chrome.storage.local.set({ theme: newTheme });
    applyTheme(newTheme);
  });
}

async function renderMeanings(meanings, word) {
  resultsDiv.innerHTML = '';
  if (!meanings || Object.keys(meanings).length === 0) {
    resultsDiv.textContent = 'No definitions found.';
    saveBtn.style.display = 'none';
    return;
  }

  for (const [pos, defs] of Object.entries(meanings)) {
    const section = document.createElement('div');
    const h = document.createElement('h3');
    h.textContent = pos || 'Definition';
    section.appendChild(h);

    defs.forEach(def => {
      const defItem = document.createElement('p');
      defItem.textContent = `• ${def.definition}`;
      section.appendChild(defItem);

      if (def.example) {
        const example = document.createElement('blockquote');
        example.textContent = `Example: ${def.example}`;
        section.appendChild(example);
      }
    });

    resultsDiv.appendChild(section);
  }

  // show save button
  if (saveBtn) {
    saveBtn.style.display = 'block';
    saveBtn.onclick = () => {
      if (typeof chrome?.storage?.local === 'undefined') {
        alert('Save not supported in this environment.');
        return;
      }
      chrome.storage.local.get({ wordList: [] }, (result) => {
        const updatedList = [...result.wordList, { word, meanings }];
        chrome.storage.local.set({ wordList: updatedList }, () => alert('Saved!'));
      });
    };
  }
}

if (lookupBtn) {
  lookupBtn.addEventListener('click', async () => {
    const word = wordInput.value.trim();
    if (!word) {
      resultsDiv.textContent = 'Please enter a word to look up.';
      return;
    }

    resultsDiv.textContent = 'Looking up...';

    try {
      const meanings = await lookupWord(word);
      await renderMeanings(meanings, word);
    } catch (err) {
      console.error('Lookup error:', err);
      resultsDiv.textContent = 'Error looking up word.';
      if (saveBtn) saveBtn.style.display = 'none';
    }
  });
} else {
  console.warn('Lookup button (#lookupBtn) not found in DOM');
}

// --- Manage list UI ---
var manageBtn = document.getElementById('manageBtn');
var manageView = document.getElementById('manageView');
var wordListDiv = document.getElementById('wordList');
var clearListBtn = document.getElementById('clearListBtn');
var backBtn = document.getElementById('backBtn');

function loadWordList() {
  wordListDiv.innerHTML = 'Loading...';
  if (typeof chrome?.storage?.local === 'undefined') {
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
      (function(item, idx) {
        var row = document.createElement('div');
        row.style.borderBottom = '1px solid rgba(0,0,0,0.08)';
        row.style.padding = '6px 0';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.justifyContent = 'space-between';

        // left column: word and meaning
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

        // right: remove button
        var removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.style.marginLeft = '8px';
        removeBtn.onclick = function() {
          // remove this item
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

        wordListDiv.appendChild(row);
      })(list[i], i);
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
    saveBtn.style.display = 'none';
    loadWordList();
  });
}

if (backBtn) {
  backBtn.addEventListener('click', function() {
    if (manageView) manageView.style.display = 'none';
    lookupBtn.style.display = '';
    wordInput.style.display = '';
    resultsDiv.style.display = '';
    // hide save until lookup
    saveBtn.style.display = 'none';
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
  if (typeof chrome?.storage?.local === 'undefined') return;
  chrome.storage.local.get({ reminderEnabled: true, reminderInterval: 30, reminderStart: 0, reminderEnd: 24 }, function(res) {
    reminderEnabled.checked = !!res.reminderEnabled;
    reminderInterval.value = res.reminderInterval || 30;
    reminderStart.value = (typeof res.reminderStart === 'number') ? res.reminderStart : 0;
    reminderEnd.value = (typeof res.reminderEnd === 'number') ? res.reminderEnd : 24;
  });
}

if (saveSettingsBtn) {
  saveSettingsBtn.addEventListener('click', function() {
    var enabled = !!reminderEnabled.checked;
    var interval = parseInt(reminderInterval.value, 10) || 30;
    if (interval < 1) interval = 1;
    var start = parseInt(reminderStart.value, 10);
    var end = parseInt(reminderEnd.value, 10);
    if (isNaN(start) || start < 0) start = 0;
    if (isNaN(end) || end < 1) end = 24;
    // save
    chrome.storage.local.set({ reminderEnabled: enabled, reminderInterval: interval, reminderStart: start, reminderEnd: end }, function() {
      alert('Settings saved.');
    });
  });
}

// load saved settings on popup open
loadSettings();

