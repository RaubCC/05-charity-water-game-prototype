// Get the canvas elements and their drawing contexts
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');

// Set up the game board size and block size
const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

// Tetromino shapes (pipes style)
const SHAPES = [
    [[1, 1, 1, 1]], // I (pipe)
    [[2, 2], [2, 2]], // O
    [[0, 3, 0], [3, 3, 3]], // T
    [[0, 4, 4], [4, 4, 0]], // S
    [[5, 5, 0], [0, 5, 5]], // Z
    [[6, 0, 0], [6, 6, 6]], // J
    [[0, 0, 7], [7, 7, 7]], // L
];
// Pipe colors
const COLORS = [
    null,
    '#FFC907', // I (yellow pipe)
    '#2E9DF7', // O (blue pipe)
    '#8BD1CB', // T (aqua pipe)
    '#4FCB53', // S (green pipe)
    '#F5402C', // Z (red pipe)
    '#FF902A', // J (orange pipe)
    '#F16061', // L (pink pipe)
];

// Create the game board (2D array)
let board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
let current, next, pos, liters = 0, dropStart = Date.now(), gameOver = false;

// Utility function to get a random tetromino
function randomTetromino() {
    const index = Math.floor(Math.random() * SHAPES.length);
    return {
        shape: SHAPES[index],
        color: COLORS[index + 1],
        index: index + 1,
    };
}
// Draw a single block at (x, y)
function drawBlock(x, y, color, ctx = context) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 2;
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}
// Draw the game board and the current tetromino
function drawBoard() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < ROWS; ++y)
        for (let x = 0; x < COLS; ++x)
            if (board[y][x])
                drawBlock(x, y, COLORS[board[y][x]]);
    drawTetromino();
}
// Draw the current tetromino
function drawTetromino() {
    current.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) drawBlock(pos.x + x, pos.y + y, current.color);
        });
    });
}
// Draw the next tetromino in the preview box
function drawNext() {
    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    next.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) drawBlock(x + 1, y + 1, next.color, nextContext);
        });
    });
}
// Check if a move is valid
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
// Merge the current tetromino into the board
function mergeTetromino() {
    current.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) board[pos.y + y][pos.x + x] = current.index;
        });
    });
}
// Rotate a matrix (tetromino)
function rotate(matrix) {
    return matrix[0].map((_, i) => matrix.map(row => row[i])).reverse();
}
// Clear completed lines and return the number of lines cleared
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
// Update the liters delivered
function updateLiters(lines) {
    if (lines) {
        liters += lines * 200; // Example: 200 liters per line
        document.getElementById('water-delivered').textContent = `Liters Delivered: ${liters}`;
    }
}
// Drop the tetromino down by one row or merge if it can't move
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
                alert('Game Over! You delivered ' + liters + ' liters of clean water!');
                gameOver = true;
            }
        }
        dropStart = Date.now();
    }
    drawBoard();
    if (!gameOver) requestAnimationFrame(drop);
}
// Reset the current tetromino to the next one
function resetTetromino() {
    current = next;
    next = randomTetromino();
    pos = {x: 3, y: 0};
    drawNext();
}
// Handle keyboard input for moving and rotating
function handleKey(e) {
    if (gameOver) return;
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
    drawBoard();
}

document.addEventListener('keydown', handleKey);

// Start or restart the game
function startGame() {
    liters = 0;
    board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
    current = randomTetromino();
    next = randomTetromino();
    pos = {x: 3, y: 0};
    gameOver = false;
    drawNext();
    document.getElementById('water-delivered').textContent = `Liters Delivered: 0`;
    dropStart = Date.now();
    drop();
}
startGame();
