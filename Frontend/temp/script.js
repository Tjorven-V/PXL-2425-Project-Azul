import Board from "../scripts/classes/Board.js";

for (let i = 0; i < 4; i++) {
    let board = new Board("testBoard", i === 3);
    let cvElement = board.CreateCanvasElement();
    document.body.appendChild(cvElement);

    // cvElement.style.display = "block";
    cvElement.style.margin = "32px";
    cvElement.style.width = i === 3 ? "1200px" : "500px";

    board.Paint();
}