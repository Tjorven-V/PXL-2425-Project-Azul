const TileImages = [
    "../media/azul/tiles/11.png",
    "../media/azul/tiles/12.png",
    "../media/azul/tiles/13.png",
    "../media/azul/tiles/14.png",
    "../media/azul/tiles/15.png",
];

class Board {
    #_playerId;
    #_canvas;
    #_canvasContext;
    #_isLocal;
    #_clickableSpots;

    constructor(playerId, isLocal) {
        this.#_playerId = playerId;
        this.#_isLocal = isLocal;
        this.#_clickableSpots = {};
        // TODO: Check if this ID is ours. We need to save the logged in player in localStorage
    };

    CreateCanvasElement() {
        this.#_canvas = document.createElement("canvas");
        this.#_canvas.id = this.#_playerId;
        this.#_canvas.classList.add("board");
        this.#_canvas.addEventListener("click", e => this.#Click(e));

        if (this.#_isLocal) {
            this.#_canvas.classList.add("local-board");
        } else {
            this.#_canvas.classList.add("remote-board");
        }

        // reference resolution of 1200×800
        // do not change, scale with CSS instead.
        this.#_canvas.width = 1200;
        this.#_canvas.height = 800;

        this.#_canvasContext = this.#_canvas.getContext("2d");

        return this.#_canvas;
    }

    #Click(event) {
        const rect = event.target.getBoundingClientRect();
        const scaleX = event.target.width / rect.width;
        const scaleY = event.target.height / rect.height;

        const relativeX = (event.clientX - rect.left) * scaleX;
        const relativeY = (event.clientY - rect.top) * scaleY;

        for (let [_, clickRegion] of Object.entries(this.#_clickableSpots)) {
            const isXInside = relativeX >= clickRegion.x && relativeX <= clickRegion.x + clickRegion.w;
            const isYInside = relativeY >= clickRegion.y && relativeY <= clickRegion.y + clickRegion.h;

            if (isXInside && isYInside && typeof clickRegion.click === "function") {
                clickRegion.click();
            }
        }
    }

    #ShouldDrawCell(cellData, x, y, w, h) {
        if (cellData.type === "wall") {
            const offset = (cellData.colIndex - cellData.rowIndex + 5) % 5;

            let isPlaced = Math.random() < 0.333;

            let img = new Image();
            img.src = TileImages[offset];
            img.onload = () => {
                if (!isPlaced) this.#_canvasContext.globalAlpha = 0.2;
                this.#_canvasContext.drawImage(img, x + 2, y + 2, w - 4, h - 4)
                if (!isPlaced) this.#_canvasContext.globalAlpha = 1;
            };
        } else if (cellData.type === "floorLine") {
            console.log("FloorLine is asking if it should draw a cell");
        } else if (cellData.type === "patternLine") {
            console.log(`PatternLine${cellData.patternLine} is asking if it should draw a cell`)
        }
    }

    #PatternLineClicked(patternLineIndex, cellIndex) {
        console.log(`PatternLine(${patternLineIndex}, ${cellIndex})`);
    }

    #WallClicked(colIndex, rowIndex) {
        console.log(`Wall(${colIndex}, ${rowIndex})`);
    }

    #FloorLineClicked(cellIndex) {
        console.log(`FloorLine(${cellIndex})`);
    }

    Clear() {
        this.#_canvasContext.clearRect(0, 0, this.#_canvas.width, this.#_canvas.height);
        this.#_clickableSpots = {};
    }

    Paint() {
        this.Clear();

        let cv = this.#_canvas;
        let ctx = this.#_canvasContext;

        // Tile Cell Size
        let cellSize = cv.width / 11;

        ctx.beginPath(); // Start a new drawing operation
        ctx.lineWidth = 4;

        // Start Draw PatternLines
        let patternLines = 5;
        let [patternLineContainerX, patternLineContainerY] = [32, 32];

        let patternLineContainerSize = cellSize * (patternLines - 1);
        let patternLineLayout = [];
        for (let patternLine = 0; patternLine < patternLines; patternLine++) {
            let line = [];
            for (let cellInLine = 0; cellInLine < patternLine + 1; cellInLine++) {
                line.push(cellInLine + 1);
            }
            patternLineLayout.push(line);
        }

        // ctx.rect(patternLineContainerX, patternLineContainerY, patternLineContainerSize, patternLineContainerSize);
        for (let patternLine in patternLineLayout) {
            patternLine = parseInt(patternLine);
            for (let cellInLine = 0; cellInLine <= patternLine; cellInLine++) {
                let [x, y, w, h] = [patternLineContainerX + patternLineContainerSize - cellSize * cellInLine, patternLineContainerY + cellSize * patternLine, cellSize, cellSize];
                ctx.rect(x, y, w, h);
                this.#ShouldDrawCell({type: "patternLine", patternLine, cell: patternLine - cellInLine}, x, y, w, h);

                if (!this.#_isLocal) continue;
                this.#_clickableSpots["patternLine_" + patternLine + "_" + cellInLine] = {
                    x, y, w, h,
                    click: () => {
                        this.#PatternLineClicked(patternLine, patternLine - cellInLine);
                    }};
            }
        }
        // End Draw PatternLines

        // Start Draw Wall
        let wallSize = 5;
        let [wallContainerX, wallContainerY] = [32, 32]; // X from the right of the board

        let wallContainerSize = cellSize * wallSize;

        [wallContainerX, wallContainerY] = [cv.width - wallContainerSize - wallContainerX, wallContainerY];
        ctx.rect(wallContainerX, wallContainerY, wallContainerSize, wallContainerSize);
        for (let rowIndex = 0; rowIndex < wallSize; rowIndex++) {
            for (let colIndex = 0; colIndex < wallSize; colIndex++) {
                let [x, y, w, h] = [wallContainerX + colIndex * cellSize, wallContainerY + rowIndex * cellSize, cellSize, cellSize];
                ctx.rect(x, y, w, h);
                this.#ShouldDrawCell({type: "wall", rowIndex, colIndex}, x, y, w, h);

                if (!this.#_isLocal) continue;
                this.#_clickableSpots["wall_" + colIndex + "_" + rowIndex] = {
                    x, y, w, h,
                    click: () => this.#WallClicked(colIndex, rowIndex)};
            }
        }
        // End Draw Wall

        // Start Draw FloorLine
        let floorLineSpots = 7;
        let [floorLineWidth, floorLineHeight] = [cellSize * floorLineSpots, cellSize];
        let [floorLineX, floorLineY] = [cv.width / 2 - floorLineWidth / 2, cv.height - floorLineHeight - (32)];

        ctx.rect(floorLineX, floorLineY, floorLineWidth, floorLineHeight);

        let floorLineSpotWidth = floorLineWidth / floorLineSpots;
        for (let floorLineSpotIndex = 0; floorLineSpotIndex < floorLineSpots; floorLineSpotIndex++) {

            let [x, y, w, h] = [floorLineX + floorLineSpotWidth * floorLineSpotIndex, floorLineY, floorLineSpotWidth, floorLineHeight];
            ctx.rect(x, y, w, h);
            this.#ShouldDrawCell({type: "floorLine", cellIndex: floorLineSpotIndex}, x, y, w, h);

            if (!this.#_isLocal) continue;
            this.#_clickableSpots["floorLine_" + floorLineSpotIndex] = {
                x, y, w, h,
                click: () => this.#FloorLineClicked(floorLineSpotIndex)};
        }
        // End Draw FloorLine

        ctx.stroke(); // Execute the drawing operation
    }

    set BoardData(data) {
        let {patternLines, wall, floorLine, score} = data;

    }

    get IsLocal() {
        return this.#_isLocal;
    }

    get OwnerId() {
        return this.#_playerId;
    }

    get Canvas() {
        return this.#_canvas;
    }
}

export default Board;