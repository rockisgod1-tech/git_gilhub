import { lookupWord } from "../dictionary.js";

// Theme handling: read saved theme from chrome.storage and apply it.
const themeToggle = document.getElementById("themeToggle");
function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    if (themeToggle) themeToggle.checked = true;
  } else {
    document.documentElement.removeAttribute("data-theme");
    if (themeToggle) themeToggle.checked = false;
  }
}

chrome.storage.local.get({ theme: "dark" }, (res) => {
  applyTheme(res.theme || "dark");
});

if (themeToggle) {
  themeToggle.addEventListener("change", (e) => {
    const newTheme = e.target.checked ? "dark" : "light";
    chrome.storage.local.set({ theme: newTheme });
    applyTheme(newTheme);
  });
}

// Lookup with simple error handling so failures are shown in the popup instead of failing silently.
document.getElementById("lookupBtn").addEventListener("click", async () => {
  const word = document.getElementById("wordInput").value.trim();
  if (!word) return;

  try {
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
  } catch (err) {
    console.error("Lookup error:", err);
    document.getElementById("definition").innerText = "Error looking up word.";
    document.getElementById("saveBtn").style.display = "none";
  }
});
