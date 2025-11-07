export async function lookupWord(word) {
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
