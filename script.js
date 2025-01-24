const GEMINI_API_KEY = "AIzaSyAhRpckHInrN1ff2Inqe5OSEyk-ltdMnYc";
const GOOGLE_SHEETS_API_KEY = "AIzaSyAhRpckHInrN1ff2Inqe5OSEyk-ltdMnYc";
const SHEET_ID = "1MEslIMhdD9VQm9OspPjVYLi1tUdQVLhlCZY0aur0qQM";

let score = 0;
let lives = 3;
let highScore = 0;
let highScorePlayer = "Player";
let selectedWords = [];
let correctGroups = [];
let allWords = []; // Store all words for the current game

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

// Fetch high score from Google Sheets
async function fetchHighScore() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1!A1:B1?key=${GOOGLE_SHEETS_API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.values) {
      highScore = parseInt(data.values[0][0]);
      highScorePlayer = data.values[0][1];
      highScoreDisplay.textContent = `High Score: ${highScore} by ${highScorePlayer}`;
    }
  } catch (error) {
    console.error("Error fetching high score:", error);
  }
}

// Save score to Google Sheets
async function saveScore(playerName) {
  if (score > highScore) {
    highScore = score;
    highScorePlayer = playerName;
    highScoreDisplay.textContent = `High Score: ${highScore} by ${highScorePlayer}`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1!A1:B1?valueInputOption=RAW&key=${GOOGLE_SHEETS_API_KEY}`;
    try {
      await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: [[highScore, highScorePlayer]] }),
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
  renderWordGrid(allWords);
  selectedWords = [];
  submitButton.disabled = false;
  resultMessage.textContent = "";
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
  // This is a placeholder. You'll need to implement logic to group words into 4 categories.
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
    wordElement.textContent = word;
    if (selectedWords.includes(word)) {
      wordElement.classList.add("selected"); // Highlight selected words
    }
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
  renderWordGrid(allWords); // Re-render the grid with updated selections
}

// Submit selected words
submitButton.addEventListener("click", () => {
  if (selectedWords.length === 4) {
    const isCorrect = checkCorrectGroup(selectedWords);
    if (isCorrect) {
      resultMessage.textContent = "Correct!";
      score += 100;
      scoreDisplay.textContent = `Score: ${score}`;
      if (score > highScore) {
        nameInputContainer.style.display = "block";
      } else {
        startNewGame();
      }
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

// Save player name and update high score
saveNameButton.addEventListener("click", () => {
  const playerName = playerNameInput.value.trim();
  if (playerName) {
    saveScore(playerName);
    nameInputContainer.style.display = "none";
    startNewGame();
  } else {
    alert("Please enter your name.");
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
  saveScore(highScorePlayer);
}
