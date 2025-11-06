import { lookupWord } from "./dictionary.js";

document.getElementById("lookupBtn").addEventListener("click", async () => {
  const word = document.getElementById("wordInput").value.trim();
  if (!word) return;

  const meaning = await lookupWord(word);

  if (meaning) {
    document.getElementById("definition").innerText = meaning;
    document.getElementById("saveBtn").style.display = "block";

    document.getElementById("saveBtn").onclick = () => {
      chrome.storage.local.get({ wordList: [] }, (result) => {
        const updatedList = [...result.wordList, { word, meaning }];
        chrome.storage.local.set({ wordList: updatedList });
        alert("Saved!");
      });
    };
  } else {
    document.getElementById("definition").innerText = "No definition found.";
    document.getElementById("saveBtn").style.display = "none";
  }
});
