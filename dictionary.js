export async function lookupWord(word) {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    const data = await response.json();

    if (Array.isArray(data) && data[0]?.meanings?.length > 0) {
      const meaning = data[0].meanings[0].definitions[0].definition;
      return meaning;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Dictionary lookup failed:", error);
    return null;
  }
}
