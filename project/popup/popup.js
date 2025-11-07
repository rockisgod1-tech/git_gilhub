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

