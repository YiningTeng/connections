const GEMINI_API_KEY = "AIzaSyAhRpckHInrN1ff2Inqe5OSEyk-ltdMnYc";
const GOOGLE_SHEETS_API_KEY = "AIzaSyAhRpckHInrN1ff2Inqe5OSEyk-ltdMnYc";
const SHEET_ID = "1MEslIMhdD9VQm9OspPjVYLi1tUdQVLhlCZY0aur0qQM";

let score = 0;
let lives = 3;
let highScore = 0;
let highScorePlayer = "Player";
let selectedWords = [];
let correctGroups = [];
let foundGroups = [];

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
const groupsContainer = document.getElementById("groups-container");

document.addEventListener("DOMContentLoaded", () => {
  fetchHighScore();
  startNewGame();
});

// [Keep existing fetchHighScore() and saveScore() functions same]

async function startNewGame() {
  try {
    const result = await generatePuzzle();
    correctGroups = result.groups;
    foundGroups = [];
    renderWordGrid(result.words);
    selectedWords = [];
    submitButton.disabled = false;
    resultMessage.textContent = "";
    lives = 3;
    livesDisplay.textContent = `Lives: ${lives}`;
    score = 0;
    scoreDisplay.textContent = `Score: ${score}`;
    groupsContainer.innerHTML = "";
  } catch (error) {
    console.error("Error starting new game:", error);
    resultMessage.textContent = "Failed to start new game. Please try again.";
  }
}

async function generatePuzzle() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Create a connections puzzle with 4 groups of 4 words each. 
            Each group should have a clear theme. Format exactly like:
            
            Group 1: [Theme] - word1, word2, word3, word4
            Group 2: [Theme] - word1, word2, word3, word4
            Group 3: [Theme] - word1, word2, word3, word4
            Group 4: [Theme] - word1, word2, word3, word4
            
            Themes should be specific categories, not obvious. Mix related technical terms from different domains.`
          }]
        }],
        generationConfig: { temperature: 0.7 }
      }),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    return this.parsePuzzleResponse(text);
  } catch (error) {
    console.error("Error generating puzzle:", error);
    return this.getFallbackPuzzle();
  }
}

function parsePuzzleResponse(text) {
  const groups = [];
  const allWords = [];
  
  text.split('\n').forEach(line => {
    const match = line.match(/Group \d+: \[(.*?)\] - (.*)/);
    if (match) {
      const theme = match[1];
      const words = match[2].split(/,\s*/).map(w => w.trim());
      groups.push({ theme, words });
      allWords.push(...words);
    }
  });

  if (groups.length !== 4 || allWords.length !== 16) {
    throw new Error("Invalid puzzle format");
  }

  return {
    words: this.shuffleArray(allWords),
    groups: groups.map(g => ({
      theme: g.theme,
      words: g.words.map(w => w.toLowerCase())
    }))
  };
}

function getFallbackPuzzle() {
  return {
    words: this.shuffleArray([
      "Python", "Java", "CSS", "HTML",
      "Neptune", "Mars", "Venus", "Earth",
      "Bitcoin", "Ethereum", "Wallet", "Blockchain",
      "Router", "Firewall", "DNS", "IP"
    ]),
    groups: [
      {
        theme: "Programming Languages",
        words: ["python", "java", "css", "html"]
      },
      {
        theme: "Planets",
        words: ["neptune", "mars", "venus", "earth"]
      },
      {
        theme: "Cryptocurrency",
        words: ["bitcoin", "ethereum", "wallet", "blockchain"]
      },
      {
        theme: "Networking",
        words: ["router", "firewall", "dns", "ip"]
      }
    ]
  };
}

function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

function renderWordGrid(words) {
  wordGrid.innerHTML = "";
  words.forEach(word => {
    const wordElement = document.createElement("div");
    wordElement.className = `word${selectedWords.includes(word) ? " selected" : ""}`;
    wordElement.textContent = word;
    wordElement.addEventListener("click", () => toggleSelection(word));
    wordGrid.appendChild(wordElement);
  });
}

function toggleSelection(word) {
  if (foundGroups.some(g => g.words.includes(word.toLowerCase()))) return;
  
  const index = selectedWords.indexOf(word);
  if (index > -1) {
    selectedWords.splice(index, 1);
  } else if (selectedWords.length < 4) {
    selectedWords.push(word);
  }
  renderWordGrid([...wordGrid.children].map(el => el.textContent));
}

submitButton.addEventListener("click", async () => {
  if (selectedWords.length !== 4) {
    resultMessage.textContent = "Please select exactly 4 words.";
    return;
  }

  const selected = selectedWords.map(w => w.toLowerCase());
  const matchedGroup = correctGroups.find(g => 
    g.words.every(w => selected.includes(w)) &&
    !foundGroups.some(fg => fg.theme === g.theme)
  );

  if (matchedGroup) {
    foundGroups.push(matchedGroup);
    score += 400 - (foundGroups.length - 1) * 100;
    resultMessage.textContent = `Correct! ${matchedGroup.theme}`;
    scoreDisplay.textContent = `Score: ${score}`;
    
    if (foundGroups.length === 4) {
      endGame(true);
    } else {
      renderFoundGroups();
      selectedWords = [];
      renderWordGrid([...wordGrid.children].map(el => el.textContent));
    }
  } else {
    lives--;
    score = Math.max(0, score - 100);
    resultMessage.textContent = `Incorrect! ${4 - foundGroups.length} groups remaining`;
    livesDisplay.textContent = `Lives: ${lives}`;
    selectedWords = [];
    renderWordGrid([...wordGrid.children].map(el => el.textContent));
    
    if (lives <= 0) endGame(false);
  }
});

function renderFoundGroups() {
  groupsContainer.innerHTML = "<h3>Found Groups:</h3>";
  foundGroups.forEach(group => {
    const div = document.createElement("div");
    div.className = "found-group";
    div.innerHTML = `
      <strong>${group.theme}</strong>: 
      ${group.words.join(', ')}
    `;
    groupsContainer.appendChild(div);
  });
}

function endGame(won) {
  submitButton.disabled = true;
  const allGroups = correctGroups.map(g => ({
    ...g,
    found: foundGroups.some(fg => fg.theme === g.theme)
  }));

  groupsContainer.innerHTML = "<h3>All Groups:</h3>";
  allGroups.forEach(group => {
    const div = document.createElement("div");
    div.className = `group ${group.found ? "found" : "missed"}`;
    div.innerHTML = `
      <strong>${group.theme}</strong>: 
      ${group.words.join(', ')}
    `;
    groupsContainer.appendChild(div);
  });

  resultMessage.textContent = won ? 
    "Congratulations! You won!" : 
    `Game Over! Final Score: ${score}`;
    
  if (score > highScore) {
    nameInputContainer.style.display = "block";
  } else {
    setTimeout(() => {
      if (confirm(`${won ? 'You won! ' : ''}Play again?`)) {
        startNewGame();
      }
    }, 1000);
  }
}

// [Keep existing saveNameButton event listener and helper functions]
