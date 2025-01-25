const GEMINI_API_KEY = "AIzaSyAhRpckHInrN1ff2Inqe5OSEyk-ltdMnYc";
const SHEETBEST_API_URL = "https://api.sheetbest.com/sheets/02dba3c7-be88-437d-99ab-afe0d6bdb427";

let score = 0;
let lives = 3;
let highScore = 0;
let highScorePlayer = "Player";
let selectedWords = [];
let correctGroups = [];
let allWords = []; // Store all words for the current game
let foundGroups = []; // Track found correct groups

// DOM Elements
const wordGrid = document.getElementById("word-grid");
const submitButton = document.getElementById("submit-button");
const resultMessage = document.getElementById("result-message");
const scoreDisplay = document.getElementById("score");
const livesDisplay = document.getElementById("lives");
const highScoreDisplay = document.getElementById("high-score");
const nameInputContainer = document.getElementById("name-input-container");
const playerNameInput = document.getElementById("player-name");
const saveNameButton = document.getElementById("save-name-button");

// Initialize game
document.addEventListener("DOMContentLoaded", () => {
  fetchHighScore();
  startNewGame();
});

// Fetch high score from SheetBest
async function fetchHighScore() {
  try {
    const response = await fetch(SHEETBEST_API_URL);
    const data = await response.json();
    if (data.length > 0) {
      highScore = parseInt(data[0].Score);
      highScorePlayer = data[0].Player;
      highScoreDisplay.textContent = `High Score: ${highScore} by ${highScorePlayer}`;
    }
  } catch (error) {
    console.error("Error fetching high score:", error);
  }
}

// Save score to SheetBest
async function saveScore(playerName) {
  if (score > highScore) {
    highScore = score;
    highScorePlayer = playerName;
    highScoreDisplay.textContent = `High Score: ${highScore} by ${highScorePlayer}`;
    try {
      await fetch(SHEETBEST_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Score: highScore, Player: highScorePlayer }),
      });
    } catch (error) {
      console.error("Error saving score:", error);
    }
  }
}

// Start a new game
async function startNewGame() {
  allWords = await generateWords();
  correctGroups = await generateCorrectGroups(allWords);
  foundGroups = []; // Reset found groups
  renderWordGrid(allWords);
  selectedWords = [];
  submitButton.disabled = false;
  resultMessage.textContent = "";
  lives = 3; // Reset lives
  livesDisplay.textContent = `Lives: ${lives}`;
}

// Generate words using Gemini API
async function generateWords() {
  const prompt = "Generate 16 random words that can be grouped into 4 categories of 4 words each. Return the words as a comma-separated list.";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });
    const data = await response.json();
    const words = data.candidates[0].content.parts[0].text.split(",").map((word) => word.trim());
    console.log("Generated words:", words); // Debugging
    return words;
  } catch (error) {
    console.error("Error generating words:", error);
    return ["word1", "word2", "word3", "word4", "word5", "word6", "word7", "word8", "word9", "word10", "word11", "word12", "word13", "word14", "word15", "word16"]; // Fallback words
  }
}

// Generate correct groups (mock function, replace with actual logic)
async function generateCorrectGroups(words) {
  return [
    [words[0], words[1], words[2], words[3]],
    [words[4], words[5], words[6], words[7]],
    [words[8], words[9], words[10], words[11]],
    [words[12], words[13], words[14], words[15]],
  ];
}

// Render word grid
function renderWordGrid(words) {
  wordGrid.innerHTML = ""; // Clear the grid
  words.forEach((word) => {
    const wordElement = document.createElement("div");
    wordElement.classList.add("word");

    // Check if the word is part of a found group
    const isFound = foundGroups.some((group) => group.includes(word));
    if (isFound) {
      wordElement.classList.add("found"); // Mark found words
      wordElement.style.pointerEvents = "none"; // Disable further clicks
    }

    wordElement.textContent = word;
    if (selectedWords.includes(word)) {
      wordElement.classList.add("selected"); // Highlight selected words
    }
    wordElement.addEventListener("click", () => toggleSelection(word));
    wordGrid.appendChild(wordElement);
  });
}

// Other functions remain the same (toggleSelection, submit button handling, etc.)
