import Board from "../scripts/classes/Board.js";
import FactoryDisplay from "../scripts/classes/FactoryDisplay.js";

let remoteBoards = document.getElementById("remote-boards-container");
let factoryDisplaysContainer = document.getElementById("factory-displays-container");
let players = 3;
let factoryDisplays = 5 + (2 * Math.max(players - 2, 0));

for (let i = 0; i < factoryDisplays; i++) {
    let factory = new FactoryDisplay("factory");
    let cvElement = factory.CreateCanvasElement();
    factoryDisplaysContainer.append(cvElement);
    factory.Paint();
}
 for (let i = 0; i < players; i++) {
    let board = new Board("testBoard", i === 1);
    let cvElement = board.CreateCanvasElement();
     if (i === 1) {
        document.body.appendChild(cvElement);
    } else remoteBoards.append(cvElement);
    board.Paint();
}