const GEMINI_API_KEY = "AIzaSyAhRpckHInrN1ff2Inqe5OSEyk-ltdMnYc";
const GOOGLE_SHEETS_API_KEY = "AIzaSyAhRpckHInrN1ff2Inqe5OSEyk-ltdMnYc";
const SHEET_ID = "YOUR_SHEET_ID"; // Replace with your Google Sheets ID

let score = 0;
let lives = 3;
let highScore = 0;
let selectedWords = [];
let correctGroups = [];

// DOM Elements
const wordGrid = document.getElementById("word-grid");
const submitButton = document.getElementById("submit-button");
const resultMessage = document.getElementById("result-message");
const scoreDisplay = document.getElementById("score");
const livesDisplay = document.getElementById("lives");
const highScoreDisplay = document.getElementById("high-score");

// Initialize game
document.addEventListener("DOMContentLoaded", () => {
  fetchHighScore();
  startNewGame();
});

// Fetch high score from Google Sheets
async function fetchHighScore() {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1!A1?key=${GOOGLE_SHEETS_API_KEY}`
  );
  const data = await response.json();
  highScore = data.values ? parseInt(data.values[0][0]) : 0;
  highScoreDisplay.textContent = `High Score: ${highScore}`;
}

// Save score to Google Sheets
async function saveScore() {
  if (score > highScore) {
    highScore = score;
    highScoreDisplay.textContent = `High Score: ${highScore}`;
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1!A1?valueInputOption=RAW&key=${GOOGLE_SHEETS_API_KEY}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: [[highScore]] }),
      }
    );
  }
}

// Start a new game
async function startNewGame() {
  const words = await generateWords();
  correctGroups = await generateCorrectGroups(words);
  renderWordGrid(words);
  selectedWords = [];
  submitButton.disabled = false;
  resultMessage.textContent = "";
}

// Generate words using Gemini API
async function generateWords() {
  const prompt = "Generate 16 random words that can be grouped into 4 categories of 4 words each.";
  const response = await fetch(`https://api.gemini.com/v1/generate?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const data = await response.json();
  return data.words; // Adjust based on Gemini API response structure
}

// Generate correct groups (mock function, replace with actual logic)
async function generateCorrectGroups(words) {
  // This is a placeholder. You'll need to implement logic to group words into 4 categories.
  return [
    ["word1", "word2", "word3", "word4"],
    ["word5", "word6", "word7", "word8"],
    ["word9", "word10", "word11", "word12"],
    ["word13", "word14", "word15", "word16"],
  ];
}

// Render word grid
function renderWordGrid(words) {
  wordGrid.innerHTML = "";
  words.forEach((word) => {
    const wordElement = document.createElement("div");
    wordElement.classList.add("word");
    wordElement.textContent = word;
    wordElement.addEventListener("click", () => toggleSelection(word));
    wordGrid.appendChild(wordElement);
  });
}

// Toggle word selection
function toggleSelection(word) {
  if (selectedWords.includes(word)) {
    selectedWords = selectedWords.filter((w) => w !== word);
  } else {
    selectedWords.push(word);
  }
  renderWordGrid([...wordGrid.children].map((el) => el.textContent));
}

// Submit selected words
submitButton.addEventListener("click", () => {
  if (selectedWords.length === 4) {
    const isCorrect = checkCorrectGroup(selectedWords);
    if (isCorrect) {
      resultMessage.textContent = "Correct!";
      score += 100;
      scoreDisplay.textContent = `Score: ${score}`;
      startNewGame();
    } else {
      resultMessage.textContent = "Incorrect! Try again.";
      lives--;
      score -= 10;
      scoreDisplay.textContent = `Score: ${score}`;
      livesDisplay.textContent = `Lives: ${lives}`;
      if (lives === 0) {
        endGame();
      }
    }
  } else {
    resultMessage.textContent = "Please select exactly 4 words.";
  }
});

// Check if selected words form a correct group
function checkCorrectGroup(selectedWords) {
  return correctGroups.some((group) =>
    group.every((word) => selectedWords.includes(word))
  );
}

// End the game
function endGame() {
  submitButton.disabled = true;
  resultMessage.textContent = `Game Over! Final Score: ${score}`;
  saveScore();
}
