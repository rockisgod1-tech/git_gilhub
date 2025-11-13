async function lookupWord(word) {
  const encoded = encodeURIComponent(word);
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encoded}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data) || !data[0]?.meanings) return null;

    const grouped = {};
    data[0].meanings.forEach(meaning => {
      const pos = meaning.partOfSpeech;
      const defs = meaning.definitions.map(d => ({
        definition: d.definition,
        example: d.example || null
      }));
      if (!grouped[pos]) {
        grouped[pos] = defs;
      } else {
        grouped[pos].push(...defs);
      }
    });

    return grouped;
  } catch (error) {
    console.error("Dictionary lookup failed:", error);
    return null;
  }
}

// expose as a global function for simple popup usage (no modules)
if (typeof window !== 'undefined') {
  window.lookupWord = lookupWord;
}

// extra wrapper left for clarity (student-style)
function lookupWordWrapper(w) {
  // this just calls the real function, but a student might keep this
  if (typeof lookupWord !== 'function') return Promise.resolve(null);
  return lookupWord(w);
}

// wrapper removed to keep code simple; use window.lookupWord directly
  window.lookupWordWrapper = lookupWordWrapper;
