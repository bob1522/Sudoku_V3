// sudoku-game.js

let sudokuCells; // Define globally
let selectedCell = null;
let undoStack = [];
let solutionGrid = []; // Store the solution grid
let hintsUsed = 0; // Keep track of the number of hints used
let timerInterval;
let elapsedTime = 0; // Time in seconds
let isTimerRunning = false;

function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function startTimer() {
  if (!isTimerRunning) {
    isTimerRunning = true;
    timerInterval = setInterval(() => {
      elapsedTime++;
      document.getElementById('elapsed-time').textContent = formatTime(elapsedTime);
    }, 1000);
  }
}

function stopTimer() {
  clearInterval(timerInterval);
  isTimerRunning = false;
}

function toggleTimer() {
  if (isTimerRunning) {
    stopTimer();
    document.getElementById('timer-toggle-btn').textContent = 'Start Time';
  } else {
    startTimer();
    document.getElementById('timer-toggle-btn').textContent = 'Stop Time';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('timer-toggle-btn').addEventListener('click', toggleTimer);
  //startTimer(); // Start the timer when the game starts
});

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function() {
  // Generate the Sudoku grid (empty)
  generateGrid();

  // Now that the grid is generated, add event listeners
  addCellEventListeners();

  // Event listener for 'New Game' button
  document.getElementById('generate-btn').addEventListener('click', function() {
    const difficulty = document.getElementById('difficulty-select').value;
    generateNewGame(difficulty);
  });

  // Event listener for 'Save Game' button
  document.getElementById('save-btn').addEventListener('click', savePuzzle);
  // Event listener for 'Load Game' button
  document.getElementById('load-btn').addEventListener('click', loadPuzzle);
  // Event listener for 'Print' button
  document.getElementById('print-btn').addEventListener('click', function() {
    window.print();
  });

  // Event listener for 'Undo' button
  document.getElementById('undo-btn').addEventListener('click', function() {
    undoLastMove();
  });

  // Event listener for 'Reset' button
  document.getElementById('reset-btn').addEventListener('click', function() {
    resetGame();
  });

  // Event listener for 'Solve Game' button
  document.getElementById('solve-btn').addEventListener('click', function() {
    solveGame();
  });

  // Event listener for 'Hint' button
  document.getElementById('hint-btn').addEventListener('click', function() {
    provideHint();
  });
});

// Function to generate the Sudoku grid
function generateGrid() {
  const gridContainer = document.getElementById('sudoku-grid');
  // Clear any existing grid
  gridContainer.innerHTML = '';
  for (let row = 0; row < 9; row++) {
    const rowDiv = document.createElement('div');
    rowDiv.classList.add('sudoku-row');
    for (let col = 0; col < 9; col++) {
      const cellInput = document.createElement('input');
      cellInput.type = 'text';
      cellInput.maxLength = '3';
      cellInput.classList.add('sudoku-cell');
      cellInput.contentEditable="true"
      cellInput.id = 'cell-' + (row * 9 + col);

      // Prevent virtual keyboard from appearing
      cellInput.readOnly = true;
      cellInput.inputMode = 'none';

      // Add event listener for cell selection
      cellInput.addEventListener('click', () => selectCell(cellInput));

      rowDiv.appendChild(cellInput);
    }
    gridContainer.appendChild(rowDiv);
  }
  // Update the sudokuCells NodeList after creating the cells
  sudokuCells = document.querySelectorAll('.sudoku-cell');
}

function addCellEventListeners() {
  const numberButtons = document.querySelectorAll('.number-btn');
  numberButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (selectedCell && !selectedCell.classList.contains('prefilled-cell')) {
        const number = button.getAttribute('data-number');

        // Check if the 'Clear' button was clicked (assuming it has a specific data attribute or class)
        if (number === '') {
          addToUndoStack(selectedCell, selectedCell.value); // Save current state before clearing
          selectedCell.value = ''; // Clear the cell's content
          selectedCell.classList.remove('multiple'); // Remove multiple class if present
          return; // Exit the function to prevent further checks
        }

        // Allow adding a number only if it is not already in the cell
        if (selectedCell.value.includes(number)) {
          alert('Number already in cell');
        } else {
          addToUndoStack(selectedCell, selectedCell.value);
          selectedCell.value += number; // Append the number

          // Apply the 'multiple' class if there are multiple numbers
          if (selectedCell.value.length > 1) {
            selectedCell.classList.add('multiple');
          } else {
            selectedCell.classList.remove('multiple');
          }
        }
      }
    });
  });

  // Listen for manual cell edits (keyboard input)
  sudokuCells.forEach(cell => {
    cell.addEventListener('input', () => {
      if (cell.value.length > 1) {
        cell.classList.add('multiple');
      } else {
        cell.classList.remove('multiple');
      }
    });
  });
}


// Function to handle cell selection
function selectCell(cell) {
  if (selectedCell) {
    selectedCell.classList.remove('selected');
  }
  selectedCell = cell;
  selectedCell.classList.add('selected');
}

// Function to add moves to the undo stack
function addToUndoStack(cell, newValue, enteredViaNumberBar = false) {
  const previousValue = cell.value;
  const previousEnteredViaNumberBar = cell.classList.contains('number-bar-input');
  undoStack.push({
    cell: cell,
    previousValue: previousValue,
    previousEnteredViaNumberBar: previousEnteredViaNumberBar,
    enteredViaNumberBar: enteredViaNumberBar,
    previousClasses: Array.from(cell.classList),
  });
}

// Undo the last move
function undoLastMove() {
  if (undoStack.length > 0) {
    const lastMove = undoStack.pop();
    lastMove.cell.value = lastMove.previousValue;
    // Restore previous classes
    lastMove.cell.className = ''; // Clear all classes
    lastMove.previousClasses.forEach((className) => {
      lastMove.cell.classList.add(className);
    });
    // Remove validation classes if any
    lastMove.cell.classList.remove('correct', 'incorrect');
  }
}

// Function to generate a new game
function generateNewGame(difficulty) {
  clearBoard();
  hintsUsed = 0; // Reset hints used
  document.getElementById('hints-used').textContent = 'Hints used: ' + hintsUsed;

  // Generate a new solution and puzzle using the sudoku library
  const bothArrays = structuredClone(generateNewPuzzle(difficulty)); //Contains 2 dimesional solution and the one dimesional puzzle
  console.log("bothArrays :", bothArrays);
  const puzzleArray = structuredClone(bothArrays[1]); //Contains one demisional puzzleArray
  console.log("Final Puzzle Array to Populate Board:", puzzleArray);
  populateBoard(puzzleArray, false);
  // Get the solution and store it
  solutionGrid = structuredClone(bothArrays[0]);
  console.log("solutionGrid", solutionGrid);
  elapsedTime = 0;
  startTimer(); // Start the timer when the game starts
}

// Get the full board
function getBoard() {
    const inputs = document.querySelectorAll('.sudoku-cell');
    const board = [];
    for (let i = 0; i < 9; i++) {
        const row = [];
        for (let j = 0; j < 9; j++) {
            const value = inputs[i * 9 + j].value;
            row.push(value === '' ? 0 : parseInt(value));
        }
        board.push(row);
    }
    //console.log("board:", board);
    return board;
}

// Generate a new Sudoku puzzle
function generateNewPuzzle(difficulty) {
    clearBoard();
    hintsUsed = 0;
    document.getElementById('hints-used').textContent = 'Hints used: ' + hintsUsed;
    let board = Array.from({ length: 9 }, () => Array(9).fill(0));

    if (fillBoard(board)) {
        let solution = structuredClone(board); //Saves the board to a new array solution
        const solutionString = JSON.stringify(solution); // Saves the solution array as a string
        const solutionArray = convertPuzzleStringToArray(solutionString); //Gets a one dimesional solutionArray and returns it to generateNewGame
        
        let puzzle = structuredClone(removeNumbers(board, difficulty)); //Creates a new puzzle (2 dimesional array) from the board given a difficulty level
        const puzzleString = JSON.stringify(puzzle); // Saves the puzzle array as a string
        const puzzleArray = convertPuzzleStringToArray(puzzleString); //Gets a one dimesional puzzleArray and returns it to generateNewGame

        // Check the contents of puzzleArray
        console.log("Generated Puzzle Array:", puzzleArray);

        alert('New puzzle generated!');
        return [solutionArray, puzzleArray];
    } else {
        alert('Failed to generate a new puzzle.');
        return [];
    }
}
        

// Function to remove numbers to create a puzzle of a certain difficulty
function removeNumbers(board, difficulty) {
    let cellsToRemove;
    switch (difficulty) {
        case "Easy":
            cellsToRemove = getRandomInt(35, 45);
            break;
        case "Intermediate":
            cellsToRemove = getRandomInt(46, 50);
            break;
        case "Hard":
            cellsToRemove = getRandomInt(51, 54);
            break;
        case "Extreme":
            cellsToRemove = getRandomInt(56, 58);
            break;
        default:
            cellsToRemove = getRandomInt(35, 54);
    }
    
    while (cellsToRemove > 0) {
        const row = getRandomInt(0, 8);
        const col = getRandomInt(0, 8);
        if (board[row][col] !== 0) {
            const backup = board[row][col];
            board[row][col] = 0;

            // Check if the puzzle still has a unique solution
            const boardCopy = JSON.parse(JSON.stringify(board));
            const solutions = [];
            findAllSolutions(boardCopy, solutions, 2);
            if (solutions.length !== 1) {
                board[row][col] = backup; // Restore the number
            } else {
                cellsToRemove--;
            }
        }
    }
    return board;
}

// Function to fill the board with a valid solution using backtracking
function fillBoard(board) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) {
                const numbers = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                for (let num of numbers) {
                    if (isSafe(board, row, col, num)) {
                        board[row][col] = num;
                        if (fillBoard(board)) {
                            return true;
                        }
                        board[row][col] = 0; // Backtrack
                    }
                }
                return false; // No number fits, need to backtrack
            }
        }
    }
    return true; // Fully filled
}

// Function to shuffle an array (used to randomize numbers for filling the board)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Helper function to check if placing a number is safe
function isSafe(board, row, col, num) {
    for (let x = 0; x < 9; x++) {
        if (board[row][x] === num || board[x][col] === num ||
            board[3 * Math.floor(row / 3) + Math.floor(x / 3)][3 * Math.floor(col / 3) + x % 3] === num) {
            return false;
        }
    }
    return true;
}
//-------------------------------------------------------------------------------------------------------------------------

// Function to solve the game
function solveGame() {
    const board = getBoard();
    if (solveSudokuHelper(board)) {
        //populateBoard(board, isSolving = true)
        setBoard(board);
        alert('Sudoku solved!');
    } else {
        alert('No solution exists.');
    }
}

function solveSudokuHelper(board) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) {
                for (let num = 1; num <= 9; num++) {
                    if (isSafe(board, row, col, num)) {
                        board[row][col] = num;
                        if (solveSudokuHelper(board)) {
                            return true;
                        }
                        board[row][col] = 0; // Backtrack
                    }
                }
                return false;
            }
        }
    }
    return true;
  }


// Function to clear the board
function clearBoard() {
  sudokuCells.forEach((cell) => {
    cell.value = '';
    cell.classList.remove('prefilled-cell', 'user-input', 'number-bar-input', 'correct', 'incorrect', 'hint-cell');
    // Ensure cells remain read-only
    cell.readOnly = true;
  });
}

// Function to populate the board with a puzzle or solution
function populateBoard(puzzleArray, isSolving = false) {
  let index = 0;
  sudokuCells.forEach((cell) => {
    const value = puzzleArray[index];
    if (value !== 0) {
      cell.value = value;
      if (!isSolving) {
        // Cells that are part of the initial puzzle
        cell.classList.add('prefilled-cell');
        cell.classList.remove('user-input', 'number-bar-input', 'hint-cell');
      } else {
        // If solving, don't disable cells, just populate
        if (!cell.classList.contains('prefilled-cell')) {
          cell.classList.add('user-input');
          cell.classList.remove('number-bar-input', 'hint-cell');
        }
      }
    } else {
      if (!isSolving) {
        cell.value = '';
        cell.classList.remove('prefilled-cell', 'user-input', 'number-bar-input', 'hint-cell');
      }
    }
    // Remove validation classes
    cell.classList.remove('correct', 'incorrect');
    index++;
  });
}

// Function to get the current state of the puzzle
function getPuzzleState() {
  let puzzle = '';
  sudokuCells.forEach((cell) => {
    puzzle += cell.value ? cell.value : '.';
  });
  return puzzle;
}

//Function to convert a 2 dimensional array string to a single dimensional array (81 elements)
function convertPuzzleStringToArray(puzzleString) {
    try {
        const puzzleArray = JSON.parse(puzzleString).flat(); // Flatten the array
        return Array.isArray(puzzleArray) ? puzzleArray : [];
    } catch (error) {
        console.error('Invalid JSON string:', error);
        return [];
    }
}

// Update `savePuzzle` to include elapsed time
function savePuzzle() {
  const puzzleState = getCurrentPuzzleState();
  puzzleState.elapsedTime = elapsedTime; // Save elapsed time
  localStorage.setItem('savedPuzzle', JSON.stringify(puzzleState));
  alert('Your game has been saved!');
}

// Function to load the puzzle state from local storage
function loadPuzzle() {
  const savedPuzzle = localStorage.getItem('savedPuzzle');
  if (savedPuzzle) {
    const puzzleState = JSON.parse(savedPuzzle);
    loadPuzzleState(puzzleState);
    alert('Your saved game has been loaded!');
  } else {
    alert('No saved game found.');
  }
}

// Update `loadPuzzle` to resume the timer
function loadPuzzle() {
  const savedPuzzle = localStorage.getItem('savedPuzzle');
  if (savedPuzzle) {
    const puzzleState = JSON.parse(savedPuzzle);
    loadPuzzleState(puzzleState);
    elapsedTime = puzzleState.elapsedTime || 0; // Load saved elapsed time
    document.getElementById('elapsed-time').textContent = formatTime(elapsedTime);
    startTimer(); // Resume the timer
    alert('Your saved game has been loaded!');
  } else {
    alert('No saved game found.');
  }
}

function loadPuzzleState(puzzleState) {
  hintsUsed = puzzleState.hintsUsed || 0;
  solutionGrid = puzzleState.solutionGrid || [];
  document.getElementById('hints-used').textContent = 'Hints used: ' + hintsUsed;
  sudokuCells.forEach((cell, index) => {
    const cellData = puzzleState.cells[index];
    cell.value = cellData.value;
    cell.className = ''; // Reset classes
    cellData.classes.forEach((className) => {
      cell.classList.add(className);
    });
    // Ensure cells remain read-only
    cell.readOnly = true;
  });
}

function getCurrentPuzzleState() {
  let puzzleState = {
    cells: [],
    hintsUsed: hintsUsed,
    solutionGrid: solutionGrid
  };
  sudokuCells.forEach((cell) => {
    const cellData = {
      value: cell.value || '',
      classes: Array.from(cell.classList),
    };
    puzzleState.cells.push(cellData);
  });
  return puzzleState;
}

// Update resetGame function to clear saved puzzle
function resetGame() {
  sudokuCells.forEach((cell) => {
    if (!cell.classList.contains('prefilled-cell')) {
      cell.value = '';
      cell.classList.remove('user-input', 'number-bar-input', 'correct', 'incorrect', 'hint-cell');
    }
  });
  undoStack = [];
  hintsUsed = 0; // Reset hints used
  document.getElementById('hints-used').textContent = 'Hints used: ' + hintsUsed;
  localStorage.removeItem('savedPuzzle');
}

// Function to check if the puzzle is complete
function isPuzzleComplete() {
  for (let cell of sudokuCells) {
    if (cell.value === '') {
      return false;
    }
  }
  return true;
}
// Function to validate the user's solution
function validateSolution() {
  let allCorrect = true;

  sudokuCells.forEach((cell, index) => {
    if (cell.classList.contains('prefilled-cell')) {
      // Skip prefilled cells
      return;
    }
    const userValue = parseInt(cell.value);
    const correctValue = solutionGrid[index];

    // Remove any previous 'correct' or 'incorrect' classes
    cell.classList.remove('correct', 'incorrect');

    if (userValue === correctValue) {
      cell.classList.add('correct');
    } else {
      cell.classList.add('incorrect');
      allCorrect = false;
    }
  });

  if (allCorrect) {
    alert('Congratulations! You have completed the puzzle correctly!\nHints used: ' + hintsUsed);
  } else {
    alert('Some entries are incorrect. Incorrect numbers are highlighted in red.');
  }
}

// Function to provide a hint
function provideHint() {
  if (selectedCell && !selectedCell.classList.contains('prefilled-cell') && selectedCell.value === '') {
    const cellIndex = Array.from(sudokuCells).indexOf(selectedCell);
    const correctValue = solutionGrid[cellIndex];
    if (correctValue) {
      // Add to undo stack
      addToUndoStack(selectedCell, selectedCell.value);
      // Set the cell's value to the correct value
      selectedCell.value = correctValue;
      // Mark the cell as a hint cell
      selectedCell.classList.add('hint-cell');
      // Remove other input-related classes if necessary
      selectedCell.classList.remove('user-input', 'number-bar-input', 'incorrect', 'correct');
      // Increment hintsUsed
      hintsUsed++;
      // Update hints used display
      document.getElementById('hints-used').textContent = 'Hints used: ' + hintsUsed;

      // After providing a hint, check if the puzzle is complete
      if (isPuzzleComplete()) {
        validateSolution();
      }
    }
  } else {
    alert('Please select an empty cell to get a hint.');
  }
}

// Function to find all solutions up to maxSolutions for a given board
function findAllSolutions(board, solutions, maxSolutions) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) {
                for (let num = 1; num <= 9; num++) {
                    if (isSafe(board, row, col, num)) {
                        board[row][col] = num;
                        if (!findAllSolutions(board, solutions, maxSolutions)) {
                            return false;
                        }
                        board[row][col] = 0;
                    }
                }
                return true; // Need to backtrack
            }
        }
    }
    solutions.push(JSON.parse(JSON.stringify(board)));
    return solutions.length < maxSolutions;
}

// Utility function to get a random integer between min and max (inclusive)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function setBoard(board) {
    const inputs = document.querySelectorAll('.sudoku-cell');
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            const index = i * 9 + j;
            if (board[i][j] !== 0) {
                inputs[index].value = board[i][j];
                //console.log("Board cell value :", board[i][j]);
                inputs[index].style.color = 'blue'; // Color for solved numbers
            }
        }
    }
    //console.log("Inputs ", inputs);
}

		
