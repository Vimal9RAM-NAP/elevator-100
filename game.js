let currentFloor = 1;
const maxFloor = 100;
let isMoving = false;
let hazardActive = false;
let timerInterval = null;
let timeLeft = 0;
let currentAnswer = "";
let monsterDistance = 0;
let hazardFloors = new Set();

// Puzzle state variables
let valvePumpsNeeded = 0;
let currentPumps = 0;
let targetFrequency = 0;

// --- PASSENGER LORE SYSTEM ---
const passengerNotes = [
  "FL 02: 'The buttons stopped taking us down hours ago. Don't press '0'.'",
  "FL 05: 'If you hear scratching inside the shaft walls, hit ASCEND immediately.'",
  "FL 08: 'Found a bloody coat on FL 12. Don't look at the maintenance hatch.'",
  "FL 14: 'It moves faster when the emergency lights flicker.'",
  "FL 19: 'Day 3... or Floor 30? Time doesn't work right in this shaft.'",
  "FL 22: 'Whoever is reading this: do NOT trust the voice over the intercom.'",
  "FL 27: 'I dropped my flash drive down the gap. I saw something catch it.'",
  "FL 31: 'The cables aren't holding the elevator up. Something else is lifting us.'",
  "FL 36: 'Always cut the red wire first... wait, or was it blue?'",
  "FL 42: 'It isn't climbing up from the basement. It lives in the walls.'",
  "FL 48: 'If the radio slider drifts on its own, it means it's listening.'",
  "FL 53: 'Saw Sarah's shoe on FL 51. She tried to pry the doors open. Bad idea.'",
  "FL 59: 'Floor 60 is a dead end? No, just keep going up. Don't stop.'",
  "FL 64: 'The smell of burnt copper means a hazard is triggering next floor.'",
  "FL 71: 'It mimics the sound of the floor chime right before it strikes.'",
  "FL 77: 'Only 23 floors left. I can hear wind from the roof. Please hold on.'",
  "FL 83: 'Don't let the hazard timer run out. That's how it breaches the roof hatch.'",
  "FL 89: 'The air is colder up here. Almost at the top. Don't freeze now.'",
  "FL 95: 'I can see moonlight through the door crack! Just a few more floors!'",
  "FL 03: 'There's a smudge on the glass panel. It looks like a palm print, but with six fingers.'",
  "FL 07: 'Don't count the seconds between floors. The numbers change every time.'",
  "FL 11: 'I tried pressing the emergency stop. The elevator accelerated.'",
  "FL 16: 'If you smell damp soil, close your eyes until the chime rings.'",
  "FL 20: 'Found a flashlight with dead batteries. Someone left a teeth mark on the casing.'",
  "FL 25: 'The display skipped FL 24 entirely. Where did that floor go?'",
  "FL 29: 'It knows when you're looking at the ceiling hatch. Keep your eyes down.'",
  "FL 33: 'I heard a child laughing outside the shaft at FL 33. This building has been abandoned for years.'",
  "FL 38: 'The cables are covered in grease... or black oil. It smells like rot.'",
  "FL 40: 'If the floor indicator flashes yellow, don't step near the doors.'",
  "FL 45: 'I found a compass in my pocket. The needle is spinning in circles.'",
  "FL 50: 'Halfway point. The air feels heavier now. Like breathing underwater.'",
  "FL 55: 'Saw an old ID badge wedged in the door track. Dated 1984. The photo was scratched out.'",
  "FL 57: 'It's not trying to stop the elevator. It's riding with us on top of the car.'",
  "FL 62: 'The buttons are warm to the touch. Like someone's pressing them from the other side.'",
  "FL 67: 'I heard breathing through the speaker panel. Slow and wet.'",
  "FL 70: 'If you hear knocking from inside the wall, knock back twice. It buys time.'",
  "FL 74: 'The elevator dropped three floors in a split second before catching. My legs are shaking.'",
  "FL 79: 'There's a trail of dry salt along the edge of the floor mat. Don't step over it.'",
  "FL 81: 'I can hear rain on the roof... or is that claw marks on the metal sheet?'",
  "FL 85: 'Don't look into the gap when the doors open a crack. You'll see what's waiting in the shaft.'",
  "FL 87: 'Found a torn page from a journal: \"It doesn't like the radio static. Keep the signal clear.\"'",
  "FL 91: 'The temperature inside the car just dropped below freezing. Ice is forming on the display.'",
  "FL 93: 'Whatever you do, don't call out any names. It remembers them.'",
  "FL 97: 'I can see the roof access ladder through the grate! Almost there... almost free.'",
  "FL 98: 'The floor indicator is buzzing violently. It doesn't want us reaching 100.'",
  "FL 99: 'One floor left. It's right on top of the hatch. DON'T LOOK UP.'"
];

function getRandomLoreNote(floor) {
  // Pull relevant note if floor matches, otherwise draw a random entry
  const specificNote = passengerNotes.find(note => note.startsWith(`FL ${floor < 10 ? '0' + floor : floor}`));
  if (specificNote) return specificNote;
  
  const randomEntry = passengerNotes[Math.floor(Math.random() * passengerNotes.length)];
  return randomEntry;
}

// --- WEB AUDIO API SYNTHESIZER SETUP ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

const SFX = {
  click() {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  },

  elevatorMove() {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(50, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(65, ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.9);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.9);
  },

  alarmTick() {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  },

  success() {
    const ctx = getAudioContext();
    const notes = [440, 554.37, 659.25];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.2);
    });
  },

  jumpscare() {
    const ctx = getAudioContext();
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(40, ctx.currentTime);
    subOsc.frequency.linearRampToValueAtTime(20, ctx.currentTime + 1.5);
    subGain.gain.setValueAtTime(0.4, ctx.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start();
    subOsc.stop(ctx.currentTime + 1.5);

    const screechOsc = ctx.createOscillator();
    const screechGain = ctx.createGain();
    screechOsc.type = 'square';
    screechOsc.frequency.setValueAtTime(1200, ctx.currentTime);
    screechOsc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.8);
    screechGain.gain.setValueAtTime(0.3, ctx.currentTime);
    screechGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    screechOsc.connect(screechGain);
    screechGain.connect(ctx.destination);
    screechOsc.start();
    screechOsc.stop(ctx.currentTime + 0.8);
  }
};

// --- DOM ELEMENTS ---
const floorNumEl = document.getElementById('floor-num');
const timerDisplayEl = document.getElementById('timer-display');
const statusLabelEl = document.getElementById('status-label');
const doorStatusEl = document.getElementById('door-status');
const logEl = document.getElementById('log');
const puzzleBoxEl = document.getElementById('puzzle-box');
const puzzleInstructionEl = document.getElementById('puzzle-instruction');
const puzzleInputEl = document.getElementById('puzzle-input');
const submitBtnEl = document.getElementById('submit-btn');
const ascendBtnEl = document.getElementById('ascend-btn');
const viewscreenEl = document.getElementById('viewscreen');
const monsterBarEl = document.getElementById('monster-bar');

function generateHazardFloors() {
  hazardFloors.clear();
  while (hazardFloors.size < 18) {
    let f = Math.floor(Math.random() * 93) + 5;
    hazardFloors.add(f);
  }
}
// --- HIGH SCORE SYSTEM ---
function updateHighScoreDisplay() {
  const savedRecord = localStorage.getItem('elevator100_highscore') || 1;
  const highScoreEl = document.getElementById('high-score-display');
  if (highScoreEl) {
    highScoreEl.textContent = `HIGHEST ASCENT: FL ${savedRecord < 10 ? '0' + savedRecord : savedRecord}`;
  }
}

function checkAndSaveHighScore(floor) {
  const savedRecord = parseInt(localStorage.getItem('elevator100_highscore') || '1', 10);
  if (floor > savedRecord) {
    localStorage.setItem('elevator100_highscore', floor);
    updateHighScoreDisplay();
  }
}
function initGame() {
  currentFloor = 1;
  monsterDistance = 0;
  hazardActive = false;
  clearInterval(timerInterval);
  generateHazardFloors();
  
  updateDisplay();
  logEl.textContent = "You step into Floor 1. Scrawled on the door frame: 'KEEP GOING UP'.";
  timerDisplayEl.textContent = "SAFE";
  timerDisplayEl.style.color = "#fff";
  puzzleBoxEl.style.display = "none";
  logEl.style.display = "block";
  ascendBtnEl.disabled = false;
  viewscreenEl.classList.remove('flicker', 'jumpscare');
  resetPuzzleContainer();
}

function updateDisplay() {
  floorNumEl.textContent = `FL ${currentFloor < 10 ? '0' + currentFloor : currentFloor}`;
  monsterBarEl.style.width = `${monsterDistance}%`;
}

function triggerDeath(reason) {
  clearInterval(timerInterval);
  hazardActive = false;
  ascendBtnEl.disabled = true;
  puzzleBoxEl.style.display = "none";
  logEl.style.display = "block";
  
  // 1. Save record floor reached
  checkAndSaveHighScore(currentFloor);

  // 2. Play Audio & Show ASCII Jump Scare Screen
  SFX.jumpscare();
  const scareOverlay = document.getElementById('jumpscare-overlay');
  if (scareOverlay) scareOverlay.style.display = 'flex';

  // 3. After 1.2s, transition to Start Screen with death log
  setTimeout(() => {
    if (scareOverlay) scareOverlay.style.display = 'none';
    
    gameScreenEl.style.display = "none";
    startScreenEl.style.display = "flex";
    
    logEl.innerHTML = `<strong style="font-size: 1.2rem;">YOU DIED</strong><br><br>${reason}`;
  }, 1200);
}

function startHazardTimer(seconds) {
  timeLeft = seconds;
  statusLabelEl.textContent = "HAZARD TIMER";
  timerDisplayEl.style.color = "var(--accent-red)";
  timerDisplayEl.textContent = `${timeLeft}s`;

  timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplayEl.textContent = `${timeLeft}s`;
    monsterDistance = Math.min(100, monsterDistance + 3);
    updateDisplay();

    SFX.alarmTick();

    if (timeLeft <= 0) {
      triggerDeath("Time ran out. The creature breached the hatch.");
    }
  }, 1000);
}

function resetPuzzleContainer() {
  const dynamicContainer = document.getElementById('dynamic-puzzle-controls');
  if (dynamicContainer) dynamicContainer.remove();
  puzzleInputEl.style.display = "block";
  submitBtnEl.style.display = "block";
}

function generatePuzzle() {
  resetPuzzleContainer();

  const types = ['math', 'code', 'unscramble', 'wires', 'valve', 'frequency', 'flash'];
  const choice = types[Math.floor(Math.random() * types.length)];

  if (choice === 'math') {
    const a = Math.floor(Math.random() * 50) + 10;
    const b = Math.floor(Math.random() * 50) + 10;
    currentAnswer = (a + b).toString();
    puzzleInstructionEl.textContent = `SYSTEM ERROR(ADD): Override Code = ${a} + ${b}`;
    puzzleInputEl.value = "";
    puzzleInputEl.focus();

  } else if (choice === 'code') {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    currentAnswer = code;
    puzzleInstructionEl.textContent = `CRITICAL FAILURE(BE QUICK): Passcode is [ ${code} ]`;
    puzzleInputEl.value = "";
    puzzleInputEl.focus();

  } else if (choice === 'unscramble') {
    const words = [
      { word: "CABIN", hint: "B N C A I" },
      { word: "LIGHT", hint: "G T H I L" },
      { word: "SHADOW", hint: "W D O H A S" },
      { word: "PANIC", hint: "N I C P A" },
      { word: "GHOST", hint: "S O H G T" },
      { word: "BLOOD", hint: "O D L B O" },
      { word: "DEATH", hint: "T H A D E" },
      { word: "STALKER", hint: "K R L A T S" },
      { word: "TERROR", hint: "R O R T R E" },
      { word: "SCREAM", hint: "E R A M S C" },
      { word: "BEAST", hint: "S T E A B" },
      { word: "HAUNT", hint: "N U T A H" },
      { word: "SILENCE", hint: "N C E L I S E" },
      { word: "MURDER", hint: "R E D R U M" },
      { word: "CURSE", hint: "S R U C E" },
      { word: "CORPSE", hint: "S P E C O R" },
      { word: "MONSTER", hint: "T R E N O S M" },
      { word: "PRISON", hint: "N O I S R P" },
      { word: "CRAWL", hint: "R L W A C" },
      { word: "GRAVE", hint: "V R E A G" },
      { word: "HORROR", hint: "R R O O H R" },
      { word: "STATIC", hint: "T C A S T I" },
      { word: "CREAK", hint: "K E C A R" },
      { word: "ABANDON", hint: "D O N A N B A" }
    ];
    const selected = words[Math.floor(Math.random() * words.length)];
    currentAnswer = selected.word;
    puzzleInstructionEl.textContent = `OVERRIDE: Unscramble "${selected.hint}"`;
    puzzleInputEl.value = "";
    puzzleInputEl.focus();

  } else if (choice === 'wires') {
    puzzleInputEl.style.display = "none";
    submitBtnEl.style.display = "none";

    const wireColors = ['RED', 'BLUE', 'YELLOW', 'GREEN'];
    const targetColor = wireColors[Math.floor(Math.random() * wireColors.length)];
    puzzleInstructionEl.textContent = `ELECTRICAL SHORT: CUT THE ${targetColor} WIRE!`;

    const container = document.createElement('div');
    container.id = 'dynamic-puzzle-controls';
    container.style.display = 'flex';
    container.style.gap = '8px';
    container.style.marginTop = '10px';

    wireColors.forEach(color => {
      const btn = document.createElement('button');
      btn.textContent = color;
      btn.style.backgroundColor = color.toLowerCase();
      btn.style.color = color === 'YELLOW' ? '#000' : '#fff';
      btn.style.padding = '10px 14px';
      btn.style.fontSize = '0.8rem';

      btn.addEventListener('click', () => {
        SFX.click();
        if (color === targetColor) {
          resolveHazard();
        } else {
          triggerDeath(`You cut the wrong wire! The elevator short-circuited into darkness.`);
        }
      });
      container.appendChild(btn);
    });
    puzzleBoxEl.appendChild(container);

  } else if (choice === 'valve') {
    puzzleInputEl.style.display = "none";
    submitBtnEl.style.display = "none";

    valvePumpsNeeded = Math.floor(Math.random() * 6) + 10;
    currentPumps = 0;

    puzzleInstructionEl.textContent = `HYDRAULIC FAILURE: PUMP VALVE (${currentPumps}/${valvePumpsNeeded})`;

    const container = document.createElement('div');
    container.id = 'dynamic-puzzle-controls';
    container.style.marginTop = '10px';

    const pumpBtn = document.createElement('button');
    pumpBtn.textContent = 'PUMP VALVE ⚙️';
    pumpBtn.className = 'btn-danger';
    pumpBtn.style.padding = '12px 24px';

    pumpBtn.addEventListener('click', () => {
      SFX.click();
      currentPumps++;
      puzzleInstructionEl.textContent = `HYDRAULIC FAILURE: PUMP VALVE (${currentPumps}/${valvePumpsNeeded})`;
      if (currentPumps >= valvePumpsNeeded) {
        resolveHazard();
      }
    });

    container.appendChild(pumpBtn);
    puzzleBoxEl.appendChild(container);

  } else if (choice === 'frequency') {
    puzzleInputEl.style.display = "none";
    submitBtnEl.style.display = "none";

    targetFrequency = (Math.random() * 40 + 60).toFixed(1);
    puzzleInstructionEl.textContent = `SIGNAL LOST: CALIBRATE RADIO TO ${targetFrequency} MHz`;

    const container = document.createElement('div');
    container.id = 'dynamic-puzzle-controls';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.gap = '10px';
    container.style.marginTop = '10px';
    container.style.width = '80%';

    const freqReadout = document.createElement('div');
    freqReadout.style.fontSize = '1.2rem';
    freqReadout.style.color = 'var(--accent-red)';
    freqReadout.textContent = `CURRENT: 50.0 MHz`;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '50.0';
    slider.max = '100.0';
    slider.step = '0.1';
    slider.value = '50.0';
    slider.style.width = '100%';

    slider.addEventListener('input', (e) => {
      SFX.click();
      const val = parseFloat(e.target.value).toFixed(1);
      freqReadout.textContent = `CURRENT: ${val} MHz`;
      
      if (Math.abs(parseFloat(val) - parseFloat(targetFrequency)) <= 0.2) {
        resolveHazard();
      }
    });

    container.appendChild(freqReadout);
    container.appendChild(slider);
    puzzleBoxEl.appendChild(container);

  } else if (choice === 'flash') {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    currentAnswer = code;

    puzzleInstructionEl.textContent = `MEMORIZE OVERRIDE CODE: [ ${code} ]`;
    puzzleInputEl.value = "";
    puzzleInputEl.style.display = "none";
    submitBtnEl.style.display = "none";

    setTimeout(() => {
      if (hazardActive) {
        puzzleInstructionEl.textContent = `ENTER MEMORIZED PASSCODE:`;
        puzzleInputEl.style.display = "block";
        submitBtnEl.style.display = "block";
        puzzleInputEl.focus();
      }
    }, 1500);
  }

  puzzleBoxEl.style.display = "flex";
  logEl.style.display = "none";
}

function resolveHazard() {
  clearInterval(timerInterval);
  hazardActive = false;
  viewscreenEl.classList.remove('flicker');
  resetPuzzleContainer();
  puzzleBoxEl.style.display = "none";
  logEl.style.display = "block";
  statusLabelEl.textContent = "STATUS";
  timerDisplayEl.textContent = "CLEARED";
  timerDisplayEl.style.color = "var(--accent-green)";
  logEl.textContent = "Power restored! The lift holds momentarily.";
  ascendBtnEl.disabled = false;

  SFX.success();
}

function handleAscend() {
  if (isMoving || hazardActive) return;

  SFX.click();
  SFX.elevatorMove();

  isMoving = true;
  ascendBtnEl.disabled = true;
  doorStatusEl.textContent = "ASCENDING...";
  logEl.textContent = "The elevator rattles as it climbs higher...";

  monsterDistance = Math.min(100, monsterDistance + Math.floor(Math.random() * 2));
  
  setTimeout(() => {
    currentFloor++;
    updateDisplay();
    isMoving = false;

    if (currentFloor >= maxFloor) {
      doorStatusEl.textContent = "TOP FLOOR REACHED";
      logEl.innerHTML = "<strong style='color: var(--accent-green);'>ESCAPE SUCCESSFUL</strong><br><br>The doors open to the roof. You made it.";
      timerDisplayEl.textContent = "SAFE";
      SFX.success();
      return;
    }

    if (hazardFloors.has(currentFloor)) {
      hazardActive = true;
      doorStatusEl.textContent = "ELEVATOR STALLED";
      viewscreenEl.classList.add('flicker');
      logEl.textContent = "POWER FAILURE! Solve the override!";
      generatePuzzle();
      startHazardTimer(10);
    } else {
      doorStatusEl.textContent = "ELEVATOR IDLE";
      timerDisplayEl.textContent = "SAFE";
      timerDisplayEl.style.color = "#fff";
      
      // Display lore note on safe floors
      const loreNote = getRandomLoreNote(currentFloor);
      logEl.innerHTML = `<span style="font-size: 0.85rem; color: #888;">[ PASSENGER SCRATCHING DISCOVERED ]</span><br><br><em>${loreNote}</em>`;
      ascendBtnEl.disabled = false;
    }
  }, 1000);
}

ascendBtnEl.addEventListener('click', handleAscend);
submitBtnEl.addEventListener('click', () => {
  SFX.click();
  if (puzzleInputEl.value.trim().toUpperCase() === currentAnswer) {
    resolveHazard();
  } else {
    puzzleInputEl.value = "";
    puzzleInstructionEl.textContent = "INCORRECT! TRY AGAIN!";
  }
});

puzzleInputEl.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') submitBtnEl.click();
});

const startScreenEl = document.getElementById('start-screen');
const gameScreenEl = document.getElementById('game-container');
const startBtnEl = document.getElementById('start-btn');
const shareBtnEl = document.getElementById('share-btn');
const shareToastEl = document.getElementById('share-toast');

// Load high score on boot
updateHighScoreDisplay();

startBtnEl.addEventListener('click', () => {
  getAudioContext();
  SFX.click();

  startScreenEl.style.display = 'none';
  gameScreenEl.style.display = 'flex';

  initGame();
});

shareBtnEl.addEventListener('click', () => {
  SFX.click();
  
  const shareUrl = `${window.location.origin}${window.location.pathname}?distress_signal=FL${currentFloor}`;
  
  navigator.clipboard.writeText(shareUrl).then(() => {
    shareToastEl.classList.add('toast-visible');
    setTimeout(() => {
      shareToastEl.classList.remove('toast-visible');
    }, 2500);
  }).catch(() => {
    alert(`Distress Signal Link:\n${shareUrl}`);
  });
});