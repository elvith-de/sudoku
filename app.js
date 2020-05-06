"use strict";

var sudokuclassnames = [['top', 'normal', 'bottom'], ['left', '', 'right']];

function generateSudokuTable(userValues, gameData) {
    
    var table = document.createElement('table');
    table.setAttribute('id', 'sudoku_table');
    
    for (let i = 0; i < 9; i++) {
        var tableRow = document.createElement('tr');
        table.appendChild(tableRow);
        for(var j = 0; j < 9; j++) {
            var tableData = document.createElement('td');
            var classname = (sudokuclassnames[0][i%3] +' '+ sudokuclassnames[1][j%3]).trim();
            tableData.setAttribute('class',classname);
            tableRow.appendChild(tableData);
            if(userValues == null && gameData == null) {
                var input = document.createElement('input');
                input.setAttribute('id', i + ',' + j);
                input.setAttribute('class', 'sudokuInput');
                tableData.appendChild(input);
            } else {
                var index = i*9+j;
                tableData.appendChild(document.createTextNode(gameData[index]));
                var attribute = 'bruteForced';
                if(userValues.has(index)){
                    attribute = 'userSupplied';
                } 
                tableData.setAttribute('class',tableData.getAttribute('class') + ' ' + attribute);
            }
        }
    }
    return table;
}

function initGUI(){        
    var appRootElement = document.getElementById('app');
    
    var sudokuContainer = document.createElement('div');
    sudokuContainer.setAttribute('id', 'sudoku_container');
    appRootElement.appendChild(sudokuContainer);
    
    var header = document.createElement('h1');
    header.appendChild(document.createTextNode('Sudoku Solver v0.1'));
    sudokuContainer.appendChild(header);
    
    sudokuContainer.appendChild(generateSudokuTable(null, null));
        
    var solveButton = document.createElement('input');
    solveButton.setAttribute('id','solve');
    solveButton.setAttribute('type','submit');
    solveButton.setAttribute('value','Solve it!');
    solveButton.setAttribute('onClick','solveIt();');
    sudokuContainer.appendChild(solveButton);

}

function isValidSegment(segment){

    var isValid = true;
    
    var containedInputs = new Set();
    
    for (let input of segment){
        if(input != '') {
            isValid &= !isNaN(input) && input > 0 && input < 10;
            if(!containedInputs.has(input+'')){
                containedInputs.add(input+'');
            } else {
                isValid = false;
            }
        }
    }
    return isValid;
}

function isValidSolution(gameData){
    var isValid = true;
    for(var i = 0; i < 9; i++){
        isValid &= isValidSegment(gameData.slice(i*9,i*9+9));
        if(!isValid){
            return false;
        }
    }
    for(var i = 0; i < 9; i++){
        isValid &= isValidSegment(gameData.filter(function (value, index){ return index % 9 == i}));
        if(!isValid){
            return false;
        }
    }
    for(var i = 0; i < 3; i++){
        for(var j = 0; j < 3; j++){
            var baseindex = (i*27)+(j*3)
            var segment = Array(0);
            for (var k = 0; k < 3; k++) {
                segment = segment.concat(gameData.slice(baseindex+k*9,baseindex+3+k*9));
            }
            isValid &= isValidSegment(segment);
            if(!isValid){
                return false;
            }
        }
    }
    return isValid;
}

/*function displayState(pos, currentNumber){
    var y = pos % 9;
    var x = (pos-y)/9;
    document.getElementById(x + ',' + y).value = currentNumber;
    
}*/

function bruteForceSudokuRecurse(inputGameData, currentGameData, pos) {
    
    var solution = {
            isValid: false,
            solution: currentGameData,
        };
        debugger;
    if(pos == 81){
        solution.isValid = isValidSolution(currentGameData);
        return solution; 
    }
    var nextPos = pos + 1;
    
    if(inputGameData.has(pos)){
            return bruteForceSudokuRecurse(inputGameData, currentGameData, nextPos);
    }else{
        var numbersToTry = Array.from(Array(9), (e,i)=>i+1);
        for(let currentNumber of numbersToTry){
            currentGameData[pos] = currentNumber;
            if(isValidSolution(currentGameData)){
                solution = bruteForceSudokuRecurse(inputGameData, currentGameData, nextPos);
                if (solution.isValid){
                    return solution;
                }
            }
        }
        solution.solution[pos] = '';
        return solution;
    }    
}


function solveIt() {
    
    if(!confirm("This may take some time... Are you sure to start?")){
        return;
    }
    var gameData = new Array(81);
    var userInput = new Set();
    
    for (var i = 0; i < 81; i++) {
        var y = i % 9;
        var x = (i-y)/9;
        var input = document.getElementById(x + ',' + y);
        gameData[i] = input.value;
        if(document.getElementById(x + ',' + y).value != ""){
            userInput.add(i);
        }
    }
    console.log('readInput:');
    console.log(gameData);
    console.log(userInput);
    
    var solved = bruteForceSudokuRecurse(userInput,gameData,0);

    console.log(solved);
    
    var container = document.getElementById('sudoku_container');
    container.replaceChild(generateSudokuTable(userInput,solved.solution),document.getElementById('sudoku_table'));
    if (solved.isValid){
        alert('solved!');
    }
    else{
        alert('not solved!');
    }
    
}
document.addEventListener("DOMContentLoaded",initGUI);