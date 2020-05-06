/*jslint plusplus: true */


/* used to reference class names when generating the html site*/
var sudokuclassnames = [['top', 'normal', 'bottom'], ['left', '', 'right']];

/**
* generates a <table> element, that represents the sudoku
* if params are {null}, then the table will consist of <input> elements
* otherwise, it will be filled with text
*
* @param {Set} userValues - indices of the data that were provided by the user
* @param {String[81]} gameData - an array holding the solved sudoku
* @returns {Element} the Element to be inserted into the DOM
*/
function generateSudokuTable(userValues, gameData) {
    "use strict";
    
    var i,
        j,
        table,
        tableRow,
        tableData,
        classname,
        input,
        index,
        attribute;
    
    table = document.createElement('table');
    table.setAttribute('id', 'sudoku_table');
    /* nine rows, nine cols */
    for (i = 0; i < 9; i++) {
        tableRow = document.createElement('tr');
        table.appendChild(tableRow);
        for (j = 0; j < 9; j++) {
            tableData = document.createElement('td');
            /* class names from array, those cycle every three rows/cols */
            classname = (sudokuclassnames[0][i % 3] + ' ' + sudokuclassnames[1][j % 3]).trim();
            tableData.setAttribute('class', classname);
            tableRow.appendChild(tableData);
            /* if no data provided -> generate inputs */
            if (userValues === null && gameData === null) {
                input = document.createElement('input');
                input.setAttribute('id', i + ',' + j);
                input.setAttribute('class', 'sudokuInput');
                tableData.appendChild(input);
            /* else show solution */
            } else {
                index = i * 9 + j;
                tableData.appendChild(document.createTextNode(gameData[index]));
                attribute = 'bruteForced';
                if (userValues.has(index)) {
                    attribute = 'userSupplied';
                }
                tableData.setAttribute('class', tableData.getAttribute('class') + ' ' + attribute);
            }
        }
    }
    return table;
}

/**
* generates the HTML for the page
* called, when DOM is ready
*/

function initGUI() {
    "use strict";
    
    var appRootElement,
        sudokuContainer,
        header,
        solveButton;
    
    appRootElement = document.getElementById('app');
    
    sudokuContainer = document.createElement('div');
    sudokuContainer.setAttribute('id', 'sudoku_container');
    appRootElement.appendChild(sudokuContainer);
    
    header = document.createElement('h1');
    header.appendChild(document.createTextNode('Sudoku Solver v0.1'));
    sudokuContainer.appendChild(header);
    
    sudokuContainer.appendChild(generateSudokuTable(null, null));
        
    solveButton = document.createElement('input');
    solveButton.setAttribute('id', 'solve');
    solveButton.setAttribute('type', 'submit');
    solveButton.setAttribute('value', 'Solve it!');
    solveButton.setAttribute('onClick', 'solveIt();');
    sudokuContainer.appendChild(solveButton);

}

/**
* part of the algorithm to generate/solve a sudoku
* checks, if the segment of gameData only contains numbers from 1-9 or are untouched
* and makes sure, that every number occurs only once
*
* @param {Array(9)} segment - The segment of the sudoku to be checked
* @returns {boolean}, whether input is a valid segment
*/

function isValidSegment(segment) {
    "use strict";

    var isValid,
        containedInputs,
        input;
    
    isValid = true;
    
    containedInputs = new Set();
    
    for (input of segment) {
        /* only process values that are already filled (validates partial solutions) */
        if (input !== '') {
            /* check if current value is Numeric and between 1 and 9 */
            isValid = isValid && (!isNaN(input) && input > 0 && input < 10);
            /* checks if current value already occured in the array */
            if (!containedInputs.has(String(input))) {
                containedInputs.add(String(input));
            } else {
                isValid = false;
            }
        }
    }
    /* return result */
    return isValid;
}

/**
* part of the algorithm to generate/solve a sudoku
* checks, if the current state of the gameData is a valid (partial) solution
*
* @param {Array(81)} gameData - The current state to be checked
* @returns {boolean}, whether input is a valid state
*/
function isValidSolution(gameData) {
    "use strict";
    
    var isValid,
        i,
        j,
        k,
        baseindex,
        segment;
    
    isValid = true;
    /* check every row */
    for (i = 0; i < 9; i++) {
        isValid = isValid && isValidSegment(gameData.slice(i * 9, i * 9 + 9));
        if (!isValid) {
            return false;
        }
    }
    /* check every column */
    for (i = 0; i < 9; i++) {
        isValid = isValid && isValidSegment(gameData.filter(function (value, index) { return index % 9 === i; }));
        if (!isValid) {
            return false;
        }
    }
    /* check every 3x3 square */
    for (i = 0; i < 3; i++) {
        for (j = 0; j < 3; j++) {
            baseindex = (i * 27) + (j * 3);
            segment = new Array(0);
            for (k = 0; k < 3; k++) {
                segment = segment.concat(gameData.slice(baseindex + k * 9, baseindex + 3 + k * 9));
            }
            isValid = isValid && isValidSegment(segment);
            if (!isValid) {
                return false;
            }
        }
    }
    /* return the result */
    return isValid;
}

/**
* core part of the sudoku generator / solver
* called recursively for every field in the sudoku
* this function brute forces the solution and uses backtracking to keep
* the state of the sudoku valid.
*
* - if we've completed the sudoku (pos is index 81 - after the array), we return the solution 
*    and whether it's a valid solution or not.
*
* - if the current position is part of the solution that was provided by the user just recurse 
*    to the next field and return the value of the recursion. Nothing to do here
*
* - if the current field is empty, then insert the numbers 1-9 into the field and check
*    whether this results in a valid sudoku state. If it's valid recurse to the next field.
*    If the recursion finds a valid solution, return this solution, otherwise insert the next
*    number in the current field and recurse again.
*    If we inserted all possible numbers and none led to a valid solution OR for the recursion
*    from here led to invalid solutions for all numbers, reset the current field to untouched
*    and return invalid solution (==> backtrack to the field before)
*
* @param {Set()} inputGameData - All indices supplied by the user that should not be touched
* @param {Array(81)} currentGameData - The current state of the sudoku
* @param {Integer} pos - which field we're recusring on
* @returns {boolean, Array(81)}, whether a valid solution was found and the solution (if it exists)
*/
function bruteForceSudokuRecurse(inputGameData, currentGameData, pos) {
    "use strict";
    
    var solution,
        nextPos,
        numbersToTry,
        currentNumber;
    
    solution = {
        isValid: false,
        solution: currentGameData
    };
    
    /* we're beyond the end - stop recursing */
    if (pos === 81) {
        solution.isValid = isValidSolution(currentGameData);
        return solution;
    }
    nextPos = pos + 1;
    
    /* current pos was supplied by user and is part of the solution - recurse to the next field*/
    if (inputGameData.has(pos)) {
        return bruteForceSudokuRecurse(inputGameData, currentGameData, nextPos);
    /* insert numbers and recurse until valid solution or backtrack */
    } else {
        numbersToTry = Array.from(new Array(9), (e, i) => i + 1);
        for (currentNumber of numbersToTry) {
            currentGameData[pos] = currentNumber;
            /* if inserted number makes a valid (partial) solution */
            if (isValidSolution(currentGameData)) {
                /* recurse */
                solution = bruteForceSudokuRecurse(inputGameData, currentGameData, nextPos);
                /* if solution found - return it */
                if (solution.isValid) {
                    return solution;
                }
            }
        }
        /* we're in a dead end. Reset current position, signal invalid path and backtrack */
        solution.solution[pos] = '';
        return solution;
    }    
}

/**
* Start of the solver algorithm
*
* read all inputs, initialize variables and start brute force solver
*
* check result and display the found solution
*/

function solveIt() {
    "use strict";
    
    if(!confirm("This may take some time... Are you sure to start?")){
        return;
    }
    var gameData,
        userInput,
        i,
        x,
        y,
        input,
        solved,
        container;
    
    gameData = new Array(81);
    userInput = new Set();
    
    for (i = 0; i < 81; i++) {
        y = i % 9;
        x = (i - y) / 9;
        input = document.getElementById(x + ',' + y);
        gameData[i] = input.value;
        if(document.getElementById(x + ',' + y).value !== ""){
            userInput.add(i);
        }
    }
    console.log('readInput:');
    console.log(gameData);
    console.log(userInput);
    
    solved = bruteForceSudokuRecurse(userInput, gameData, 0);

    console.log(solved);
    
    container = document.getElementById('sudoku_container');
    container.replaceChild(generateSudokuTable(userInput, solved.solution), document.getElementById('sudoku_table'));
    if (solved.isValid) {
        alert('solved!');
    }
    else {
        alert('not solved!');
    }
    
}
document.addEventListener("DOMContentLoaded",initGUI);