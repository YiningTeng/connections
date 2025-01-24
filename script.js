const GEMINI_API_KEY = "AIzaSyAhRpckHInrN1ff2Inqe5OSEyk-ltdMnYc";
const GOOGLE_SHEETS_API_KEY = "AIzaSyAhRpckHInrN1ff2Inqe5OSEyk-ltdMnYc";
const SHEET_ID = "1MEslIMhdD9VQm9OspPjVYLi1tUdQVLhlCZY0aur0qQM";

let score = 0;
let lives = 3;
let highScore = 0;
let highScorePlayer = "Player";
let selectedWords = [];
let correctGroups = [];

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
    
    if (!response.ok) {
      throw new Error(`Google Sheets error: ${response.status}`);
    }

    const data = await response.json();
    if (data.values && data.values.length > 0) {
      highScore = parseInt(data.values[0][0]) || 0;
      highScorePlayer = data.values[0][1] || "Player";
      highScoreDisplay.textContent = `High Score: ${highScore} by ${highScorePlayer}`;
    }
  } catch (error) {
    console.error("Error fetching high score:", error);
  }
}

// Save score to Google Sheets
async function saveScore(playerName) {
  if (score > highScore) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1!A1:B1?valueInputOption=USER_ENTERED&key=${GOOGLE_SHEETS_API_KEY}`;
    
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          values: [[score.toString(), playerName]]
        }),
      });

      if (!response.ok) {
        throw new Error(`Sheets update failed: ${response.status}`);
      }

      highScore = score;
      highScorePlayer = playerName;
      highScoreDisplay.textContent = `High Score: ${highScore} by ${highScorePlayer}`;
    } catch (error) {
      console.error("Error saving score:", error);
    }
  }
}

// Start a new game
async function startNewGame() {
  try {
    const words = await generateWords();
    correctGroups = await generateCorrectGroups(words);
    renderWordGrid(words);
    selectedWords = [];
    submitButton.disabled = false;
    resultMessage.textContent = "";
    lives = 3;
    livesDisplay.textContent = `Lives: ${lives}`;
  } catch (error) {
    console.error("Error starting new game:", error);
    resultMessage.textContent = "Failed to start new game. Please try again.";
  }
}

// Generate words using Gemini API
async function generateWords() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Generate 16 unique, single-word terms related to technology trends, separated by commas. Avoid phrases and special characters."
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;
    const words = generatedText.split(/,\s*/)
                      .map(word => word.trim().replace(/\.$/, ''))
                      .filter(word => word.length > 0)
                      .slice(0, 16);

    if (words.length !== 16) {
      throw new Error("Didn't receive exactly 16 words");
    }

    return words;
  } catch (error) {
    console.error("Error generating words:", error);
    return Array(16).fill("technology").map((w, i) => `${w}-${i+1}`);
  }
}

// Generate correct groups (placeholder implementation)
async function generateCorrectGroups(words) {
  // This should be replaced with actual grouping logic
  return [
    words.slice(0, 4),
    words.slice(4, 8),
    words.slice(8, 12),
    words.slice(12, 16)
  ];
}

// Render word grid with selection handling
function renderWordGrid(words) {
  wordGrid.innerHTML = "";
  words.forEach((word) => {
    const wordElement = document.createElement("div");
    wordElement.className = `word${selectedWords.includes(word) ? " selected" : ""}`;
    wordElement.textContent = word;
    wordElement.addEventListener("click", () => toggleSelection(word));
    wordGrid.appendChild(wordElement);
  });
}

// Toggle word selection with visual feedback
function toggleSelection(word) {
  const index = selectedWords.indexOf(word);
  if (index > -1) {
    selectedWords.splice(index, 1);
  } else {
    if (selectedWords.length < 4) {
      selectedWords.push(word);
    }
  }
  renderWordGrid([...wordGrid.children].map(el => el.textContent));
}

// Submit selected words
submitButton.addEventListener("click", async () => {
  try {
    if (selectedWords.length !== 4) {
      resultMessage.textContent = "Please select exactly 4 words.";
      return;
    }

    const isCorrect = correctGroups.some(group => 
      group.every(word => selectedWords.includes(word))
    );

    if (isCorrect) {
      resultMessage.textContent = "Correct! +100 points";
      score += 100;
      scoreDisplay.textContent = `Score: ${score}`;
      
      if (score > highScore) {
        nameInputContainer.style.display = "block";
      } else {
        await startNewGame();
      }
    } else {
      resultMessage.textContent = "Incorrect! -10 points, -1 life";
      lives--;
      score = Math.max(0, score - 10);
      scoreDisplay.textContent = `Score: ${score}`;
      livesDisplay.textContent = `Lives: ${lives}`;

      if (lives <= 0) {
        endGame();
      }
    }
  } catch (error) {
    console.error("Error handling submission:", error);
    resultMessage.textContent = "An error occurred. Please try again.";
  }
});

// Save player name and update high score
saveNameButton.addEventListener("click", async () => {
  const playerName = playerNameInput.value.trim();
  if (!playerName) {
    alert("Please enter your name.");
    return;
  }

  try {
    await saveScore(playerName);
    nameInputContainer.style.display = "none";
    await startNewGame();
  } catch (error) {
    console.error("Error saving name:", error);
    resultMessage.textContent = "Failed to save score. Please try again.";
  }
});

// End the game
function endGame() {
  submitButton.disabled = true;
  resultMessage.textContent = `Game Over! Final Score: ${score}`;
  saveScore(highScorePlayer);
  setTimeout(() => {
    if (confirm(`Game Over! Score: ${score}. Play again?`)) {
      score = 0;
      startNewGame();
    }
  }, 100);
}
