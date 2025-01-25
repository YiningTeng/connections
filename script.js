const GEMINI_API_KEY = "AIzaSyAhRpckHInrN1ff2Inqe5OSEyk-ltdMnYc";
const SHEETBEST_URL = "https://api.sheetbest.com/sheets/02dba3c7-be88-437d-99ab-afe0d6bdb427";

let score = 0;
let lives = 3;
let highScore = 0;
let highScorePlayer = "Player";
let selectedWords = [];
let correctGroups = [];
let allWords = []; // Store all words for the current game
let foundGroups = []; // Track found correct groups
let difficultyLevel = 0; // Difficulty level (0 to 100)

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
    const response = await fetch(SHEETBEST_URL);
    const data = await response.json();
    console.log("Fetched data:", data); // Debugging

    // Ensure the data is in the correct format
    if (Array.isArray(data) && data.length > 0) {
      // Find the row with the highest score
      let maxScoreRow = data.reduce((max, row) => {
        const rowScore = parseInt(row.highScore) || 0;
        const maxScore = parseInt(max.highScore) || 0;
        return rowScore > maxScore ? row : max;
      }, { highScore: 0, playerName: "Player" });

      highScore = parseInt(maxScoreRow.highScore) || 0;
      highScorePlayer = maxScoreRow.playerName || "Player";
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

    const payload = [
      {
        playerName: highScorePlayer,
        highScore: highScore,
      },
    ];

    try {
      const response = await fetch(SHEETBEST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      console.log("Score saved successfully:", data); // Debugging
    } catch (error) {
      console.error("Error saving score:", error);
    }
  }
  score = 0;
  highScore = 0;
}

// Start a new game
async function startNewGame() {
  updateDifficultyLevel(); // Update difficulty level based on score
  allWords = await generateWords();
  correctGroups = await generateCorrectGroups(allWords);
  shuffleWords(); // Shuffle the words
  foundGroups = []; // Reset found groups
  renderWordGrid(allWords);
  selectedWords = [];
  submitButton.disabled = false;
  resultMessage.textContent = "";
  lives = 3; // Reset lives
  livesDisplay.textContent = `Lives: ${lives}`;
}

// Update difficulty level based on score
function updateDifficultyLevel() {
  if (score < 300) {
    difficultyLevel = getRandomNumber(5, 10);
  } else if (score >= 300 && score < 500) {
    difficultyLevel = getRandomNumber(20, 50);
  } else if (score >= 500 && score < 1600) {
    difficultyLevel = getRandomNumber(35, 80);
  } else {
    difficultyLevel = getRandomNumber(70, 100);
  }
  console.log("Difficulty Level:", difficultyLevel); // Debugging
}

// Generate a random number between min and max (inclusive)
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Shuffle the words array
function shuffleWords() {
  for (let i = allWords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allWords[i], allWords[j]] = [allWords[j], allWords[i]];
  }
  console.log("Shuffled words:", allWords); // Debugging
}

// Generate words using Gemini API
async function generateWords() {
  let prompt = "Generate 16 random words that can be grouped into 4 categories of 4 words each. Return the words as a comma-separated list.";

  // Adjust prompt based on difficulty level
  if (difficultyLevel >= 70) {
    prompt = "Generate 16 complex and uncommon words that can be grouped into 4 categories of 4 words each. Return the words as a comma-separated list.";
  } else if (difficultyLevel >= 35) {
    prompt = "Generate 16 moderately complex words that can be grouped into 4 categories of 4 words each. Return the words as a comma-separated list.";
  }

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

// Toggle word selection
function toggleSelection(word) {
  // Check if the word is part of a found group
  const isFound = foundGroups.some((group) => group.includes(word));
  if (isFound) {
    return; // Do nothing if the word is part of a found group
  }

  if (selectedWords.includes(word)) {
    selectedWords = selectedWords.filter((w) => w !== word); // Unselect the word
  } else if (selectedWords.length < 4) {
    selectedWords.push(word); // Select the word (only if less than 4 are selected)
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
      foundGroups.push(selectedWords); // Add to found groups
      selectedWords = []; // Reset selected words
      if (foundGroups.length === correctGroups.length) {
        // All groups found, start a new game
        resultMessage.textContent = "All groups found! Starting a new game...";
        setTimeout(() => startNewGame(), 2000);
      } else {
        renderWordGrid(allWords); // Re-render to mark found words
      }
    } else {
      resultMessage.textContent = "Incorrect! Try again.";
      lives--;
      score -= 10;
      scoreDisplay.textContent = `Score: ${score}`;
      livesDisplay.textContent = `Lives: ${lives}`;
      selectedWords = []; // Clear selected words after incorrect guess
      renderWordGrid(allWords); // Re-render the grid
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
    selectedWords.every((word) => group.includes(word))
  );
}

// End the game
function endGame() {
  submitButton.disabled = true;
  resultMessage.textContent = `Game Over! Final Score: ${score}`;
  
  // Check if the current score is a new high score
  if (score > highScore) {
    nameInputContainer.style.display = "block"; // Show the name input container
    showCorrectGroups();
  } else {
    saveScore(highScorePlayer); // Save the score without changing the player name
    showCorrectGroups();
  }
}

// Show correct groups when the game ends
function showCorrectGroups() {
  wordGrid.innerHTML = ""; // Clear the grid
  correctGroups.forEach((group, index) => {
    const groupContainer = document.createElement("div");
    groupContainer.classList.add("group-container");
    groupContainer.style.backgroundColor = getGroupColor(index); // Assign a unique color
    group.forEach((word) => {
      const wordElement = document.createElement("div");
      wordElement.classList.add("word");
      wordElement.textContent = word;
      groupContainer.appendChild(wordElement);
    });
    wordGrid.appendChild(groupContainer);
  });
}

// Get a unique color for each group
function getGroupColor(index) {
  const colors = ["#ffcccc", "#ccffcc", "#ccccff", "#ffccff"]; // Light red, green, blue, pink
  return colors[index % colors.length];
}
