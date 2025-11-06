// dictionary.js
// Uses OwlBot when `chrome.storage.local.owlbotKey` is set.
// Falls back to Wordnik if `chrome.storage.local.wordnikKey` is set.
// Finally falls back to dictionaryapi.dev (no auth).

async function getStoredKeys() {
  return new Promise((resolve) => {
    if (typeof chrome?.storage?.local === 'undefined') return resolve({ owlbotKey: null, wordnikKey: null });
    chrome.storage.local.get({ owlbotKey: null, wordnikKey: null }, (res) => resolve(res));
  });
}

export async function lookupWord(word) {
  const encoded = encodeURIComponent(word);
  try {
    const { owlbotKey, wordnikKey } = await getStoredKeys();

    // Try OwlBot first if key provided
    if (owlbotKey) {
      try {
        const res = await fetch(`https://owlbot.info/api/v4/dictionary/${encoded}`, {
          headers: { Authorization: `Token ${owlbotKey}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.definitions) && data.definitions.length > 0) {
            const d = data.definitions[0];
            return d.definition + (d.example ? ` — ${d.example}` : "");
          }
        } else {
          console.warn('OwlBot returned', res.status);
        }
      } catch (e) {
        console.warn('OwlBot request failed:', e);
      }
    }

    // Next: Wordnik if key present
    if (wordnikKey) {
      try {
        const url = `https://api.wordnik.com/v4/word.json/${encoded}/definitions?limit=5&includeRelated=false&useCanonical=true&includeTags=false&api_key=${wordnikKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const defs = await res.json();
          if (Array.isArray(defs) && defs.length > 0) {
            const brief = defs.slice(0, 2).map(d => {
              const pos = d.partOfSpeech ? ` (${d.partOfSpeech})` : "";
              return `${d.text}${pos}`;
            }).join("\n\n");
            return brief;
          }
        } else {
          console.warn('Wordnik returned', res.status);
        }
      } catch (e) {
        console.warn('Wordnik request failed:', e);
      }
    }

    // Fallback: dictionaryapi.dev
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encoded}`);
      const data = await response.json();
      if (Array.isArray(data) && data[0]?.meanings?.length > 0) {
        const meaning = data[0].meanings[0].definitions[0].definition;
        return meaning;
      }
    } catch (e) {
      console.warn('dictionaryapi.dev request failed:', e);
    }

    return null;
  } catch (err) {
    console.error('Lookup failed:', err);
    return null;
  }
}