const GEMINI_API_KEY = "AIzaSyAhRpckHInrN1ff2Inqe5OSEyk-ltdMnYc";
const SHEETBEST_URL = "https://api.sheetbest.com/sheets/02dba3c7-be88-437d-99ab-afe0d6bdb427";

// Game state
let score = 0;
let lives = 3;
let highScore = 0;
let highScorePlayer = "Player";
let selectedWords = [];
let allWords = [];
let wordToCategoryMap = new Map(); // Hashmap to store word-category relationships
let foundCategories = new Set();

// DOM Elements
const wordGrid = document.getElementById("word-grid");
const submitButton = document.getElementById("submit-button");
const resultMessage = document.getElementById("result-message");
const scoreDisplay = document.getElementById("score");
const livesDisplay = document.getElementById("lives");
const highScoreDisplay = document.getElementById("high-score");

async function generateCorrectGroups(words) {
  const prompt = `Group these 16 words into 4 categories. For each category:
  - Provide a specific theme name
  - List 4 exact words from: ${words.join(', ')}
  Return JSON in this format:
  {
    "categories": [
      {"name": "Theme1", "words": ["word1","word2","word3","word4"]},
      {"name": "Theme2", "words": ["word5","word6","word7","word8"]},
      {"name": "Theme3", "words": ["word9","word10","word11","word12"]},
      {"name": "Theme4", "words": ["word13","word14","word15","word16"]}
    ]
  }`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    
    const data = await response.json();
    const responseText = data.candidates[0].content.parts[0].text;
    const jsonString = responseText.replace(/```json|```/g, '');
    const result = JSON.parse(jsonString);

    // Validate and build hashmap
    wordToCategoryMap.clear();
    result.categories.forEach(category => {
      category.words.forEach(word => {
        wordToCategoryMap.set(word.trim().toLowerCase(), {
          name: category.name,
          words: new Set(category.words.map(w => w.trim().toLowerCase()))
        });
      });
    });

    return result.categories;
  } catch (error) {
    console.error("Error generating groups:", error);
    return [];
  }
}

function showCorrectGroups() {
  wordGrid.innerHTML = "";
  const categories = new Map();

  // Group words by category using hashmap
  allWords.forEach(word => {
    const category = wordToCategoryMap.get(word.toLowerCase());
    if (category) {
      if (!categories.has(category.name)) {
        categories.set(category.name, {
          name: category.name,
          words: []
        });
      }
      categories.get(category.name).words.push(word);
    }
  });

  // Display categories
  categories.forEach((category, index) => {
    const groupContainer = document.createElement("div");
    groupContainer.classList.add("group-container");
    groupContainer.style.backgroundColor = getGroupColor(index);
    
    const categoryName = document.createElement("div");
    categoryName.classList.add("category-name");
    categoryName.textContent = category.name;
    
    const wordsContainer = document.createElement("div");
    wordsContainer.classList.add("category-words");
    category.words.forEach(word => {
      const wordElement = document.createElement("div");
      wordElement.classList.add("word");
      wordElement.textContent = word;
      wordsContainer.appendChild(wordElement);
    });

    groupContainer.appendChild(categoryName);
    groupContainer.appendChild(wordsContainer);
    wordGrid.appendChild(groupContainer);
  });
}

// Updated checkCorrectGroup function using hashmap
function checkCorrectGroup(selectedWords) {
  const categories = new Set();
  const normalizedSelected = selectedWords.map(w => w.toLowerCase());
  
  // Check all selected words belong to the same category
  for (const word of normalizedSelected) {
    const category = wordToCategoryMap.get(word);
    if (!category) return false;
    categories.add(category.name);
  }

  if (categories.size !== 1) return false;
  
  // Verify all words in category are present
  const [categoryName] = categories.values();
  const categoryWords = wordToCategoryMap.get(normalizedSelected[0]).words;
  return normalizedSelected.every(word => categoryWords.has(word));
}

// Rest of your existing code remains the same with minor adjustments...
