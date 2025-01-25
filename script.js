const GEMINI_API_KEY = "AIzaSyAhRpckHInrN1ff2Inqe5OSEyk-ltdMnYc";
const SHEETBEST_URL = "https://api.sheetbest.com/sheets/02dba3c7-be88-437d-99ab-afe0d6bdb427";

let score = 0;
let lives = 3;
let highScore = 0;
let highScorePlayer = "Player";
let selectedWords = [];
let correctGroups = [];
let allWords = [];
let foundGroups = [];
let difficultyLevel = 0;

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

async function fetchHighScore() {
  try {
    const response = await fetch(SHEETBEST_URL);
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      const maxScoreRow = data.reduce((max, row) => {
        const rowScore = parseInt(row.highScore) || 0;
        return rowScore > max.highScore ? { highScore: rowScore, playerName: row.playerName } : max;
      }, { highScore: 0, playerName: "Player" });
      
      highScore = maxScoreRow.highScore;
      highScorePlayer = maxScoreRow.playerName;
      highScoreDisplay.textContent = `High Score: ${highScore} by ${highScorePlayer}`;
    }
  } catch (error) {
    console.error("Error fetching high score:", error);
  }
}

async function saveScore(playerName) {
  if (score > highScore) {
    highScore = score;
    highScorePlayer = playerName;
    highScoreDisplay.textContent = `High Score: ${highScore} by ${highScorePlayer}`;

    try {
      await fetch(SHEETBEST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ playerName, highScore }]),
      });
    } catch (error) {
      console.error("Error saving score:", error);
    }
  }
}

async function startNewGame() {
  updateDifficultyLevel();
  allWords = await generateWords();
  correctGroups = await generateCorrectGroups(allWords);
  shuffleWords();
  foundGroups = [];
  renderWordGrid(allWords);
  selectedWords = [];
  submitButton.disabled = false;
  resultMessage.textContent = "";
  lives = 3;
  livesDisplay.textContent = `Lives: ${lives}`;
}

function updateDifficultyLevel() {
  if (score < 500) difficultyLevel = getRandomNumber(5, 10);
  else if (score < 1500) difficultyLevel = getRandomNumber(20, 50);
  else if (score < 2500) difficultyLevel = getRandomNumber(35, 70);
  else difficultyLevel = getRandomNumber(70, 100);
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleWords() {
  for (let i = allWords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allWords[i], allWords[j]] = [allWords[j], allWords[i]];
  }
}

async function generateWords() {
  let prompt = "Generate 16 random words for categorization. Return as comma-separated list.";
  if (difficultyLevel >= 70) prompt = "Generate 16 complex words for categorization. Return as comma-separated list.";
  else if (difficultyLevel >= 35) prompt = "Generate 16 moderately complex words for categorization. Return as comma-separated list.";

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    const data = await response.json();
    return data.candidates[0].content.parts[0].text.split(",").map(w => w.trim());
  } catch (error) {
    console.error("Error generating words:", error);
    return Array.from({length: 16}, (_, i) => `word${i+1}`);
  }
}

async function generateCorrectGroups(words) {
  const prompt = `Categorize these words into 4 groups with specific themes. Return valid JSON in this format:
  {
    "categories": [
      {"name": "Theme1", "words": ["word1","word2","word3","word4"]},
      {"name": "Theme2", "words": ["word5","word6","word7","word8"]},
      {"name": "Theme3", "words": ["word9","word10","word11","word12"]},
      {"name": "Theme4", "words": ["word13","word14","word15","word16"]}
    ]
  }
  Words: ${words.join(', ')}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    const data = await response.json();
    const jsonString = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '');
    return JSON.parse(jsonString).categories;
  } catch (error) {
    console.error("Error generating groups:", error);
    return words.reduce((groups, word, i) => {
      if(i % 4 === 0) groups.push({
        name: `${word} Category`,
        words: words.slice(i, i+4)
      });
      return groups;
    }, []);
  }
}

function renderWordGrid(words) {
  wordGrid.innerHTML = words.map(word => {
    const isFound = foundGroups.some(g => g.words.includes(word));
    return `<div class="word ${isFound ? 'found' : ''} ${selectedWords.includes(word) ? 'selected' : ''}" 
             style="${isFound ? 'pointer-events: none;' : ''}" 
             onclick="toggleSelection('${word}')">${word}</div>`;
  }).join('');
}

function toggleSelection(word) {
  if (foundGroups.some(g => g.words.includes(word))) return;
  selectedWords = selectedWords.includes(word) 
    ? selectedWords.filter(w => w !== word) 
    : selectedWords.length < 4 ? [...selectedWords, word] : selectedWords;
  renderWordGrid(allWords);
}

submitButton.addEventListener("click", () => {
  if (selectedWords.length !== 4) {
    resultMessage.textContent = "Please select exactly 4 words.";
    return;
  }

  const isCorrect = correctGroups.some(group => 
    selectedWords.every(word => group.words.includes(word))
  );

  if (isCorrect) {
    handleCorrectAnswer();
  } else {
    handleIncorrectAnswer();
  }
});

function handleCorrectAnswer() {
  score += 100;
  const foundGroup = correctGroups.find(g => 
    selectedWords.every(word => g.words.includes(word))
  );
  foundGroups.push(foundGroup);
  selectedWords = [];
  resultMessage.textContent = "Correct!";
  scoreDisplay.textContent = `Score: ${score}`;

  if (foundGroups.length === correctGroups.length) {
    resultMessage.textContent = "All groups found! Starting new game...";
    setTimeout(startNewGame, 2000);
  } else {
    renderWordGrid(allWords);
  }
}

function handleIncorrectAnswer() {
  lives--;
  score = Math.max(0, score - 10);
  selectedWords = [];
  resultMessage.textContent = "Incorrect! Try again.";
  scoreDisplay.textContent = `Score: ${score}`;
  livesDisplay.textContent = `Lives: ${lives}`;
  renderWordGrid(allWords);
  
  if (lives <= 0) endGame();
}

function endGame() {
  submitButton.disabled = true;
  resultMessage.textContent = `Game Over! Final Score: ${score}`;
  if (score > highScore) {
    nameInputContainer.style.display = "block";
  } else {
    saveScore(highScorePlayer);
    showCorrectGroups();
  }
}

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

function showCorrectGroups() {
  wordGrid.innerHTML = correctGroups.map((group, i) => `
    <div class="group-container" style="background-color: ${getGroupColor(i)}">
      <div class="category-name">${group.name}</div>
      ${group.words.map(word => `<div class="word">${word}</div>`).join('')}
    </div>
  `).join('');
}

function getGroupColor(index) {
  const colors = ["#ffcccc", "#ccffcc", "#ccccff", "#ffccff"];
  return colors[index % colors.length];
}
