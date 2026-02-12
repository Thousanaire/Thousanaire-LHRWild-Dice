// Basic state
const players = [
  { name: "Thousanaire", chips: 3 },
  { name: "A", chips: 3 },
  { name: "B", chips: 3 },
  { name: "C", chips: 3 }
];

let currentPlayerIndex = 0;
let centerPot = 0;
let wildOwnerIndex = null;
let wildSteals = 0;

const diceFaces = ["L", "R", "C", "DOT", "WILD"];

const rollBtn = document.getElementById("rollBtn");
const resetBtn = document.getElementById("resetBtn");
const centerPotCount = document.getElementById("centerPotCount");
const currentPlayerNameEl = document.getElementById("currentPlayerName");
const rollHistoryEl = document.getElementById("rollHistory");
const wildPanel = document.getElementById("wildPanel");
const wildStatus = document.getElementById("wildStatus");
const wildButtons = document.getElementById("wildButtons");
const diceEls = [
  document.getElementById("die1"),
  document.getElementById("die2"),
  document.getElementById("die3")
];
const playerEls = document.querySelectorAll(".player");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");

// Init
function initGame() {
  centerPot = 0;
  wildOwnerIndex = null;
  wildSteals = 0;
  players.forEach(p => p.chips = 3);
  currentPlayerIndex = 0;
  updateUI();
  rollHistoryEl.innerHTML = "";
  wildStatus.textContent = "No wilds available.";
  wildButtons.innerHTML = "";
  showStatus("Welcome to Thousanaire!");
}

function updateUI() {
  centerPotCount.textContent = centerPot;
  currentPlayerNameEl.textContent = players[currentPlayerIndex].name;

  playerEls.forEach((el, idx) => {
    const chipSpan = el.querySelector(".chip-count");
    chipSpan.textContent = players[idx].chips;
    el.classList.toggle("active", idx === currentPlayerIndex);
    el.classList.toggle("eliminated", players[idx].chips <= 0);
  });

  updateWildPanel();
}

function updateWildPanel() {
  if (wildOwnerIndex === null || wildSteals <= 0) {
    wildStatus.textContent = "No wilds available.";
    wildButtons.innerHTML = "";
    return;
  }

  const ownerName = players[wildOwnerIndex].name;
  wildStatus.innerHTML = `<div class="wild-bubble">${ownerName} has ${wildSteals} steal(s)</div>`;
  wildButtons.innerHTML = "";

  players.forEach((p, idx) => {
    if (idx === wildOwnerIndex || p.chips <= 0) return;
    const btn = document.createElement("button");
    btn.textContent = `Steal from ${p.name}`;
    btn.addEventListener("click", () => handleWildSteal(idx));
    wildButtons.appendChild(btn);
  });

  wildPanel.classList.add("wild-flash");
  setTimeout(() => wildPanel.classList.remove("wild-flash"), 400);
}

function handleWildSteal(targetIndex) {
  const owner = players[wildOwnerIndex];
  const target = players[targetIndex];
  if (wildSteals <= 0 || target.chips <= 0) return;

  target.chips--;
  owner.chips++;
  wildSteals--;

  showStatus(`${owner.name} stole a chip from ${target.name}!`);
  markChipsUpdated(wildOwnerIndex);
  markChipsUpdated(targetIndex);

  if (wildSteals <= 0) {
    wildOwnerIndex = null;
  }

  updateUI();
}

// Dice roll
function rollDice() {
  const current = players[currentPlayerIndex];
  if (current.chips <= 0) {
    nextPlayer();
    return;
  }

  rollBtn.disabled = true;
  applyDiceRollAnimation();

  const results = [];
  for (let i = 0; i < 3; i++) {
    const face = diceFaces[Math.floor(Math.random() * diceFaces.length)];
    results.push(face);
  }

  setTimeout(() => {
    applyDiceBounceAnimation();
    applyDiceFaces(results);
    resolveRoll(results);
    addHistoryEntry(current.name, results);
    checkWinner();
    rollBtn.disabled = false;
  }, 400);
}

function applyDiceFaces(results) {
  results.forEach((r, i) => {
    diceEls[i].textContent = r === "DOT" ? "•" : r;
  });
}

function applyDiceRollAnimation() {
  diceEls.forEach(d => {
    d.classList.remove("dice-bounce");
    d.classList.add("dice-shake");
  });
  setTimeout(() => {
    diceEls.forEach(d => d.classList.remove("dice-shake"));
  }, 400);
}

function applyDiceBounceAnimation() {
  diceEls.forEach(d => {
    d.classList.add("dice-bounce");
    setTimeout(() => d.classList.remove("dice-bounce"), 500);
  });
}

function resolveRoll(results) {
  const idx = currentPlayerIndex;
  const player = players[idx];

  results.forEach(face => {
    if (player.chips <= 0) return;
    switch (face) {
      case "L":
        passChip(idx, getLeftIndex(idx));
        break;
      case "R":
        passChip(idx, getRightIndex(idx));
        break;
      case "C":
        player.chips--;
        centerPot++;
        break;
      case "WILD":
        wildOwnerIndex = idx;
        wildSteals++;
        break;
      case "DOT":
      default:
        break;
    }
  });

  markChipsUpdated(idx);
  updateUI();
  nextPlayer();
}

function passChip(fromIdx, toIdx) {
  if (players[fromIdx].chips <= 0) return;
  players[fromIdx].chips--;
  players[toIdx].chips++;
  markChipsUpdated(fromIdx);
  markChipsUpdated(toIdx);
}

function getLeftIndex(idx) {
  return (idx + players.length - 1) % players.length;
}

function getRightIndex(idx) {
  return (idx + 1) % players.length;
}

function nextPlayer() {
  let attempts = 0;
  do {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    attempts++;
  } while (players[currentPlayerIndex].chips <= 0 && attempts < players.length);

  updateUI();
  showStatus(`It's ${players[currentPlayerIndex].name}'s turn`);
}

function addHistoryEntry(name, results) {
  const div = document.createElement("div");
  div.className = "history-entry";
  div.textContent = `${name} rolled: (${results.join(", ")})`;
  rollHistoryEl.prepend(div);
}

// Chips animation
function markChipsUpdated(playerIndex) {
  const el = playerEls[playerIndex].querySelector(".chips");
  el.classList.add("updated");
  setTimeout(() => el.classList.remove("updated"), 350);
}

// Status bubble
function showStatus(msg) {
  const bubble = document.createElement("div");
  bubble.className = "status-bubble";
  bubble.textContent = msg;
  document.body.appendChild(bubble);
  setTimeout(() => bubble.remove(), 1200);
}

// Winner check
function checkWinner() {
  const active = players.filter(p => p.chips > 0);
  if (active.length === 1) {
    const winner = active[0];
    const winnerIndex = players.indexOf(winner);
    playerEls[winnerIndex].classList.add("winner-spotlight");
    showStatus(`${winner.name} wins the game!`);
    rollBtn.disabled = true;
  }
}

// Chat
sendBtn.addEventListener("click", () => {
  const text = chatInput.value.trim();
  if (!text) return;
  const div = document.createElement("div");
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  chatInput.value = "";
});

// Reset
resetBtn.addEventListener("click", () => {
  playerEls.forEach(el => el.classList.remove("winner-spotlight"));
  initGame();
  rollBtn.disabled = false;
});

// Mobile gestures
let startX = 0;
document.addEventListener("touchstart", e => {
  if (!e.touches[0]) return;
  startX = e.touches[0].clientX;
});

document.addEventListener("touchend", e => {
  if (!e.changedTouches[0]) return;
  const endX = e.changedTouches[0].clientX;
  const diff = endX - startX;
  if (diff > 80) {
    showStatus("Swipe right detected");
  } else if (diff < -80) {
    showStatus("Swipe left detected");
  }
});

// Shake to roll (simple threshold)
window.addEventListener("devicemotion", e => {
  const acc = e.accelerationIncludingGravity;
  if (!acc) return;
  const magnitude = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
  if (magnitude > 45) {
    if (!rollBtn.disabled) rollDice();
  }
});

// Join game (simple name override)
document.getElementById("joinBtn").addEventListener("click", () => {
  const name = document.getElementById("nameInput").value.trim();
  if (name) {
    players[0].name = name;
    playerEls[0].querySelector(".name").textContent = name;
    updateUI();
  }
});

// Roll button
rollBtn.addEventListener("click", rollDice);

// Start
document.addEventListener("DOMContentLoaded", () => {
  initGame();
});
