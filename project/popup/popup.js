import { lookupWord } from '../dictionary.js';

document.getElementById('searchBtn').addEventListener('click', async () => {
  const word = document.getElementById('wordInput').value.trim();
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';

  const meanings = await lookupWord(word);
  if (!meanings) {
    resultsDiv.textContent = 'No definitions found.';
    return;
  }

  for (const [pos, defs] of Object.entries(meanings)) {
    const section = document.createElement('div');
    section.innerHTML = `<h3>${pos}</h3>`;
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
});
