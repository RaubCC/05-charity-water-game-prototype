// Charity: water Pipe Tetris - Fun Edition

const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');

const ROWS = 20, COLS = 10, BLOCK_SIZE = 30;
canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

// Tetris shapes (including a rare Jerry Can wildcard)
const SHAPES = [
    [[1, 1, 1, 1]],                // I (pipe)
    [[2, 2], [2, 2]],              // O
    [[0, 3, 0], [3, 3, 3]],        // T
    [[0, 4, 4], [4, 4, 0]],        // S
    [[5, 5, 0], [0, 5, 5]],        // Z
    [[6, 0, 0], [6, 6, 6]],        // J
    [[0, 0, 7], [7, 7, 7]],        // L
    [[8]],                         // Jerry Can (wildcard)
];
const COLORS = [
    null,
    '#FFC907', // I (yellow pipe)
    '#2E9DF7', // O (blue pipe)
    '#8BD1CB', // T (aqua pipe)
    '#4FCB53', // S (green pipe)
    '#F5402C', // Z (red pipe)
    '#FF902A', // J (orange pipe)
    '#F16061', // L (pink pipe)
    '#FFD700'  // Jerry Can (gold)
];
const PIECE_NAMES = [
    "", "I-pipe", "O-pipe", "T-pipe", "S-pipe", "Z-pipe", "J-pipe", "L-pipe", "Jerry Can"
];

const WATER_FACTS = [
    "Every $1 invested in clean water yields $4–$12 in economic returns.",
    "Women and girls spend 200 million hours every day collecting water.",
    "1 in 10 people on Earth don’t have access to clean water.",
    "Access to clean water reduces global disease and increases education.",
    "Over 2 billion people use a drinking water source contaminated with feces.",
    "Clean water saves lives. You’re helping, line by line.",
    "Diarrhea from unsafe water kills more children than malaria, measles, and HIV/AIDS combined.",
    "Clean water = more time for school, work, and dreams.",
    "You’re not just clearing lines. You’re delivering hope."
];

let board, current, next, pos, liters, dropStart, gameOver, wildReady;
let deliveredDisplay = document.getElementById('water-delivered');
let factPopup = document.getElementById('fact-popup');
let factText = document.getElementById('fact-text');
let closeFact = document.getElementById('close-fact');
let linesCleared = 0;

// Game Over Overlay logic
const gameOverOverlay = document.getElementById('game-over-overlay');
const finalLiters = document.getElementById('final-liters');
const overlayRestart = document.getElementById('overlay-restart');

// Utility
function randomTetromino() {
    // 3% chance of wild Jerry Can
    let index = Math.random() < 0.03 ? 7 : Math.floor(Math.random() * 7);
    return {
        shape: SHAPES[index],
        color: COLORS[index + 1],
        index: index + 1,
        name: PIECE_NAMES[index + 1]
    };
}
function drawBlock(x, y, color, ctx = context) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 2;
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    // Draw can icon if Jerry Can
    if (color === COLORS[8]) {
        ctx.fillStyle = "#FFC907";
        ctx.fillRect(
            x * BLOCK_SIZE + BLOCK_SIZE * 0.2,
            y * BLOCK_SIZE + BLOCK_SIZE * 0.4,
            BLOCK_SIZE * 0.6,
            BLOCK_SIZE * 0.4
        );
        ctx.fillRect(
            x * BLOCK_SIZE + BLOCK_SIZE * 0.35,
            y * BLOCK_SIZE + BLOCK_SIZE * 0.2,
            BLOCK_SIZE * 0.3,
            BLOCK_SIZE * 0.25
        );
    }
}
function drawBoard() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < ROWS; ++y)
        for (let x = 0; x < COLS; ++x)
            if (board[y][x])
                drawBlock(x, y, COLORS[board[y][x]]);
    drawTetromino();
}
function drawTetromino() {
    current.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) drawBlock(pos.x + x, pos.y + y, current.color);
        });
    });
}
function drawNext() {
    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    next.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) drawBlock(x + 1, y + 1, next.color, nextContext);
        });
    });
}
function validMove(offsetX = 0, offsetY = 0, tetromino = current.shape) {
    for (let y = 0; y < tetromino.length; ++y) {
        for (let x = 0; x < tetromino[y].length; ++x) {
            if (!tetromino[y][x]) continue;
            let nx = pos.x + x + offsetX;
            let ny = pos.y + y + offsetY;
            if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
            if (ny < 0) continue;
            if (board[ny][nx]) return false;
        }
    }
    return true;
}
function mergeTetromino() {
    if (current.index === 8) {
        // Jerry Can: clear this row instantly and double liters
        let clearRow = pos.y;
        let toClear = [];
        for (let x = 0; x < COLS; x++) {
            board[clearRow][x] = 0;
        }
        liters += 400;
        showFact("JERRY CAN POWER! Doubled liters for this row!");
    } else {
        current.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) board[pos.y + y][pos.x + x] = current.index;
            });
        });
    }
}
function rotate(matrix) {
    return matrix[0].map((_, i) => matrix.map(row => row[i])).reverse();
}
function clearLines() {
    let lines = 0;
    board = board.filter(row => {
        if (row.every(x => x)) {
            lines++;
            return false;
        }
        return true;
    });
    while (board.length < ROWS) board.unshift(Array(COLS).fill(0));
    return lines;
}
function animateLiters(oldVal, newVal) {
    let step = Math.max(1, Math.floor((newVal - oldVal) / 16));
    let val = oldVal;
    function tick() {
        if (val < newVal) {
            val += step;
            if (val > newVal) val = newVal;
            deliveredDisplay.textContent = `Liters Delivered: ${val}`;
            requestAnimationFrame(tick);
        } else {
            deliveredDisplay.textContent = `Liters Delivered: ${newVal}`;
        }
    }
    tick();
}
const splashEffect = document.getElementById('splash-effect');
function showSplash() {
    const splash = document.createElement('div');
    splash.className = 'splash';
    // Randomize a little for fun
    const offsetX = (Math.random() - 0.5) * 120;
    const offsetY = (Math.random() - 0.5) * 60;
    splash.style.left = `calc(50% + ${offsetX}px)`;
    splash.style.top = `calc(40% + ${offsetY}px)`;
    splashEffect.appendChild(splash);
    setTimeout(() => splash.remove(), 700);
}
function updateLiters(lines) {
    if (lines) {
        showSplash(); // Show water splash when a line is cleared
        let litersOld = liters;
        liters += lines * 200;
        linesCleared += lines;
        animateLiters(litersOld, liters);
        // Show fact every 4 lines
        if (linesCleared % 4 === 0) showFact();
    }
}
function showFact(text) {
    factPopup.style.display = 'block';
    factText.textContent = text || WATER_FACTS[Math.floor(Math.random() * WATER_FACTS.length)];
}
closeFact.onclick = () => { factPopup.style.display = 'none'; };

function showGameOverOverlay() {
    finalLiters.textContent = `You delivered ${liters} liters of clean water!`;
    gameOverOverlay.classList.add('active');
    overlayRestart.focus();
}
function hideGameOverOverlay() {
    gameOverOverlay.classList.remove('active');
}

function drop() {
    if (gameOver) return;
    let now = Date.now(), delta = now - dropStart;
    if (delta > 600) {
        if (validMove(0, 1)) {
            pos.y++;
        } else {
            mergeTetromino();
            let lines = clearLines();
            updateLiters(lines);
            resetTetromino();
            if (!validMove()) {
                showGameOverOverlay();
                gameOver = true;
                return;
            }
        }
        dropStart = Date.now();
    }
    drawBoard();
    if (!gameOver) requestAnimationFrame(drop);
}
function resetTetromino() {
    current = next;
    next = randomTetromino();
    pos = {x: 3, y: 0};
    drawNext();
}
function handleKey(e) {
    if (gameOver && e.key !== "Enter") return;
    if (e.key === "ArrowLeft" && validMove(-1, 0)) pos.x--;
    if (e.key === "ArrowRight" && validMove(1, 0)) pos.x++;
    if (e.key === "ArrowDown" && validMove(0, 1)) pos.y++;
    if (e.key === "ArrowUp") {
        const rotated = rotate(current.shape);
        if (validMove(0, 0, rotated)) current.shape = rotated;
    }
    if (e.key === " ") {
        while (validMove(0, 1)) pos.y++;
    }
    if (e.key === "Enter" && gameOver) {
        startGame();
        factPopup.style.display = 'none';
    }
    drawBoard();
}
document.addEventListener('keydown', function(e) {
    // Prevent arrow keys and space from scrolling the page
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Spacebar"].includes(e.key)) {
        e.preventDefault();
    }
    handleKey(e);
});

function startGame() {
    liters = 0;
    linesCleared = 0;
    board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
    current = randomTetromino();
    next = randomTetromino();
    pos = {x: 3, y: 0};
    gameOver = false;
    drawNext();
    deliveredDisplay.textContent = `Liters Delivered: 0`;
    dropStart = Date.now();
    hideGameOverOverlay();
    drop();
}
document.getElementById('restart').onclick = startGame;

// Overlay restart button
overlayRestart.onclick = () => {
    hideGameOverOverlay();
    startGame();
};

// Also allow Enter key to restart from overlay
overlayRestart.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
        hideGameOverOverlay();
        startGame();
    }
});

// Initial start
startGame();
