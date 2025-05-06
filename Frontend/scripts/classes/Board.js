import ResourceManager from "./ResourceManager.js";
import ClickableCanvas from "./ClickableCanvas.js";

class Board extends  ClickableCanvas{
    #_playerId;
    #_canvas;
    #_canvasContext;
    #_isLocal;
    #_clickableSpots;

    #_playerName;
    #_score;
    #_atTurn;
    #_patternLines;
    #_floorLine;
    #_wall;

    constructor(playerId, playerName, isLocal) {
        let classes = ["board"];
        if (isLocal) {
            classes.push("local-board");
        } else {
            classes.push("remote-board");
        }

        super("board-" + playerId, 1200, 800, classes);
        this.#_playerId = playerId;
        this.#_playerName = playerName;
        this.#_isLocal = isLocal;
        this.#_clickableSpots = {};
        this.#_score = 0;

        this.#_patternLines = [];
        this.#_floorLine = [];
        this.#_wall = [[], [], [], [], []];
    };

    #ShouldDrawCell(cellData, x, y, w, h) {
        let ctx = this.CanvasContext;

        if (cellData.type === "wall") {
            let boardCellData = this.#_wall[cellData.rowIndex][ cellData.colIndex];
            if (boardCellData == null) return;

            if (!boardCellData.hasTile) ctx.globalAlpha = 0.33;
            ctx.drawImage(ResourceManager.Tiles[boardCellData.type], x + 2, y + 2, w - 4, h - 4)
            if (!boardCellData.hasTile) ctx.globalAlpha = 1;
        } else if (cellData.type === "floorLine") {
            let boardCellData = this.#_floorLine[cellData.cellIndex];
            if (boardCellData.type == null && boardCellData.type !== 0 || boardCellData.hasTile === false) return;

            ctx.drawImage(ResourceManager.Tiles[boardCellData.type], x + 2, y + 2, w - 4, h - 4)

        } else if (cellData.type === "patternLine") {
            let boardCellData = this.#_patternLines[cellData.patternLine];
            if (boardCellData.tileType == null) return;

            if (cellData.cell >= boardCellData.numberOfTiles) ctx.globalAlpha = 0.33;
            ctx.drawImage(ResourceManager.Tiles[boardCellData.tileType], x + 2, y + 2, w - 4, h - 4)
            if (!boardCellData.hasTile) ctx.globalAlpha = 1;
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
        this.CanvasContext.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
        this.ClearClickableRegions();
    }

    Paint() {
        this.Clear();

        let cv = this.Canvas;
        let ctx = this.CanvasContext;

        // Tile Cell Size
        let cellSize = cv.width / 11;

        ctx.beginPath(); // Start a new drawing operation
        ctx.lineWidth = 4;

        ctx.drawImage(ResourceManager.BoardBackground, 0, 0, cv.width, cv.height);

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

        for (let patternLine in patternLineLayout) {
            patternLine = parseInt(patternLine);
            for (let cellInLine = 0; cellInLine <= patternLine; cellInLine++) {
                let [x, y, w, h] = [patternLineContainerX + patternLineContainerSize - cellSize * cellInLine, patternLineContainerY + cellSize * patternLine, cellSize, cellSize];
                ctx.rect(x, y, w, h);
                ctx.fillStyle = "#824121";
                ctx.fillRect(x, y, w, h);
                this.#ShouldDrawCell({type: "patternLine", patternLine, cell: patternLine - cellInLine}, x, y, w, h);

                if (!this.#_isLocal) continue;
                this.RegisterClickableRegion("patternLine_" + patternLine + "_" + cellInLine, x, y, w, h, () => {
                    this.#PatternLineClicked(patternLine, patternLine - cellInLine);
                })
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
                ctx.fillStyle = "#824121";
                ctx.fillRect(x, y, w, h);
                this.#ShouldDrawCell({type: "wall", rowIndex, colIndex}, x, y, w, h);

                if (!this.#_isLocal) continue;
                this.RegisterClickableRegion("wall_" + colIndex + "_" + rowIndex, x, y, w, h, () => {
                    this.#WallClicked(colIndex, rowIndex)
                });
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
            ctx.fillStyle = "#824121";
            ctx.fillRect(x, y, w, h);
            this.#ShouldDrawCell({type: "floorLine", cellIndex: floorLineSpotIndex}, x, y, w, h);

            if (!this.#_isLocal) continue;

            this.RegisterClickableRegion("floorLine_" + floorLineSpotIndex, x, y, w, h, () => {
                this.#FloorLineClicked(floorLineSpotIndex)
            });
        }
        // End Draw FloorLine

        ctx.font = "bold 48px arial"

        // Start Draw Name & Score
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(this.#_playerName, 32, 64);
        ctx.fillText("Score: " + this.#_score, 32, 128);
        // End Draw Name & Score

        ctx.stroke(); // Execute the drawing operation
    }

    set AtTurn(toPlay) {
        this.#_atTurn = toPlay;
    }

    get AtTurn() {
        return this.#_atTurn;
    }

    set BoardData(data) {
        let {patternLines, wall, floorLine, score} = data;

        this.#_score = score;
        this.#_wall = wall;
        this.#_patternLines = patternLines;
        this.#_floorLine = floorLine;
    }

    get IsLocal() {
        return this.#_isLocal;
    }

    get OwnerId() {
        return this.#_playerId;
    }
}

export default Board;