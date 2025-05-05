import Board from "../scripts/classes/Board.js";

let cv = document.getElementById("table");
let ctx = cv.getContext("2d");

for (let i = 0; i < 4; i++) {
    let board = new Board(i.toString(), i === 2);
    board.CreateCanvasElement();

    setTimeout(() => {
        let image = new Image();
        image.id = "pic";
        image.src = board.Canvas.toDataURL();

        ctx.drawImage(image, 256 + 300 * i, 0, 256, 256);
    }, 1000);
}