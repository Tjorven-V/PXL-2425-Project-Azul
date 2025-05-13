import ResourceManager from "./ResourceManager.js";
import ClickableCanvas from "./ClickableCanvas.js";

class Board extends ClickableCanvas {
    constructor(playerId, playerName, isLocal) {
        super(`board-${playerId}`, 1200, 800, ["board", isLocal ? "local-board" : "remote-board"]);
        this._playerId = playerId;
        this._playerName = playerName;
        this._isLocal = isLocal;
        this.Canvas.id = `board-${playerId}`;
        this.initializeBoard();
    }

    _FloorLineClicked(cellIndex) {
        document.dispatchEvent(new CustomEvent('floorLineSelected', {
            detail: { cellIndex }
        }));
    }

    initializeBoard() {
        this._patternLines = this.createBoardSection(5, (i) => ({
            length: i + 1,
            tileType: null,
            numberOfTiles: 0,
            isComplete: false
        }));

        this._wall = this.createBoardSection(5, () =>
            Array(5).fill({ type: null, hasTile: false })
        );

        this._floorLine = this.createBoardSection(7, () => ({
            type: null,
            hasTile: false
        }));

        this._score = 0;
    }

    createBoardSection(size, callback) {
        return Array(size).fill().map((_, i) => callback(i));
    }

    validateBoardStructure() {
        if (!this._patternLines) {
            this._patternLines = this.createBoardSection(5, (i) => ({
                length: i + 1,
                tileType: null,
                numberOfTiles: 0,
                isComplete: false
            }));
        }
        if (!this._wall) {
            this._wall = this.createBoardSection(5, () =>
                Array(5).fill({ type: null, hasTile: false })
            );
        }
        if (!this._floorLine) {
            this._floorLine = this.createBoardSection(7, () => ({
                type: null,
                hasTile: false
            }));
        }
        this._score = this._score || 0;
    }

    getSafePatternLine(index) {
        this.validateBoardStructure();
        if (index < 0 || index >= this._patternLines.length) {
            console.warn(`Invalid pattern line index: ${index}`);
            return null;
        }
        return this._patternLines[index];
    }

    set BoardData(data) {
        if (!data) return;

        this._score = data.score || this._score;

        if (data.patternLines) {
            this._patternLines = data.patternLines.map((line, i) => ({
                ...this._patternLines[i],
                ...line
            }));
        }

        if (data.wall) {
            this._wall = data.wall.map((row, i) =>
                row.map((cell, j) => ({
                    ...this._wall[i][j],
                    ...cell
                }))
            );
        }

        if (data.floorLine) {
            this._floorLine = data.floorLine.map((cell, i) => ({
                ...this._floorLine[i],
                ...cell
            }));
        }

        this.Paint();
    }

    validateBoardData() {
        if (!this._patternLines || !Array.isArray(this._patternLines)) {
            console.warn("Pattern lines corrupted - reinitializing");
            this._patternLines = Array(5).fill().map((_, i) => ({
                length: i + 1,
                tileType: null,
                numberOfTiles: 0,
                isComplete: false
            }));
        }
    }

    Clear() {
        this.CanvasContext.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
        this.ClearClickableRegions();
    }

    _ShouldDrawCell(cellData, x, y, w, h) {
        let ctx = this.CanvasContext;
        if (!ctx) return;

        try {
            if (cellData.type === "wall") {
                const tile = this._wall[cellData.rowIndex]?.[cellData.colIndex];
                if (!tile?.type || !ResourceManager.Tiles[tile.type]) return;

                ctx.globalAlpha = tile.hasTile ? 1 : 0.33;
                ctx.drawImage(ResourceManager.Tiles[tile.type], x + 2, y + 2, w - 4, h - 4);
                ctx.globalAlpha = 1;
            }
            else if (cellData.type === "floorLine") {
                const tile = this._floorLine[cellData.cellIndex];
                if (tile?.type == null || !ResourceManager.Tiles[tile.type] || !tile.hasTile) return;
                ctx.drawImage(ResourceManager.Tiles[tile.type], x + 2, y + 2, w - 4, h - 4);
            }
            else if (cellData.type === "patternLine") {
                const line = this._patternLines[cellData.patternLine];
                if (!line?.tileType || !ResourceManager.Tiles[line.tileType]) return;

                ctx.globalAlpha = (cellData.cell < line.numberOfTiles) ? 1 : 0.33;
                ctx.drawImage(ResourceManager.Tiles[line.tileType], x + 2, y + 2, w - 4, h - 4);
                ctx.globalAlpha = 1;
            }
        } catch (error) {
            console.warn("Drawing error:", error);
        }
    }

    Paint() {
        this.Clear();

        let cv = this.Canvas;
        let ctx = this.CanvasContext;
        let cellSize = cv.width / 11;

        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.drawImage(ResourceManager.BoardBackground, 0, 0, cv.width, cv.height);

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
                let [x, y, w, h] = [
                    patternLineContainerX + patternLineContainerSize - cellSize * cellInLine,
                    patternLineContainerY + cellSize * patternLine,
                    cellSize,
                    cellSize
                ];

                ctx.rect(x, y, w, h);
                ctx.fillStyle = "#824121";
                ctx.fillRect(x, y, w, h);
                this._ShouldDrawCell({
                    type: "patternLine",
                    patternLine,
                    cell: patternLine - cellInLine
                }, x, y, w, h);

                if (this._isLocal) {
                    this.RegisterClickableRegion(
                        "patternLine_" + patternLine + "_" + cellInLine,
                        x, y, w, h,
                        () => this._PatternLineClicked(patternLine)
                    );
                }
            }
        }

        let wallSize = 5;
        let [wallContainerX, wallContainerY] = [32, 32];
        let wallContainerSize = cellSize * wallSize;
        [wallContainerX, wallContainerY] = [cv.width - wallContainerSize - wallContainerX, wallContainerY];

        ctx.rect(wallContainerX, wallContainerY, wallContainerSize, wallContainerSize);
        for (let rowIndex = 0; rowIndex < wallSize; rowIndex++) {
            for (let colIndex = 0; colIndex < wallSize; colIndex++) {
                let [x, y, w, h] = [
                    wallContainerX + colIndex * cellSize,
                    wallContainerY + rowIndex * cellSize,
                    cellSize,
                    cellSize
                ];

                ctx.rect(x, y, w, h);
                ctx.fillStyle = "#824121";
                ctx.fillRect(x, y, w, h);
                this._ShouldDrawCell({
                    type: "wall",
                    rowIndex,
                    colIndex
                }, x, y, w, h);
            }
        }

        let floorLineSpots = 7;
        let [floorLineWidth, floorLineHeight] = [cellSize * floorLineSpots, cellSize];
        let [floorLineX, floorLineY] = [cv.width / 2 - floorLineWidth / 2, cv.height - floorLineHeight - 32];

        ctx.rect(floorLineX, floorLineY, floorLineWidth, floorLineHeight);
        let floorLineSpotWidth = floorLineWidth / floorLineSpots;

        for (let floorLineSpotIndex = 0; floorLineSpotIndex < floorLineSpots; floorLineSpotIndex++) {
            let [x, y, w, h] = [
                floorLineX + floorLineSpotWidth * floorLineSpotIndex,
                floorLineY,
                floorLineSpotWidth,
                floorLineHeight
            ];

            ctx.rect(x, y, w, h);
            ctx.fillStyle = "#824121";
            ctx.fillRect(x, y, w, h);
            this._ShouldDrawCell({
                type: "floorLine",
                cellIndex: floorLineSpotIndex
            }, x, y, w, h);

            if (this._isLocal) {
                this.RegisterClickableRegion(
                    "floorLine_" + floorLineSpotIndex,
                    x, y, w, h,
                    () => this._FloorLineClicked(floorLineSpotIndex)
                );
            }
        }

        ctx.font = "bold 48px Century Gothic";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(this._playerName, 32, 64);
        ctx.fillText("Score: " + this._score, 32, 128);
        ctx.stroke();

        ctx.beginPath();
        ctx.lineWidth = 24;
        ctx.rect(0, 0, cv.width, cv.height);
        ctx.stroke();

        if (this._isCurrentPlayer) {
            ctx.save();
            ctx.strokeStyle = "#FFFF00";
            ctx.lineWidth = 8;
            ctx.strokeRect(2, 2, cv.width - 4, cv.height - 4);
            ctx.restore();
        }
    }

    set IsCurrentPlayer(isCurrent) {
        this._isCurrentPlayer = isCurrent;
    }

    _PatternLineClicked(patternLineIndex) {
        if (!this._isLocal) return;
        document.dispatchEvent(new CustomEvent('patternLineSelected', {
            detail: { patternLineIndex }
        }));
    }

    clearPatternLineSelection() {
        this.Paint();
    }

    get IsLocal() {
        return this._isLocal;
    }

    get OwnerId() {
        return this._playerId;
    }

    validatePatternLinePlacement(patternLineIndex, tileType) {
        const line = this._patternLines[patternLineIndex];

        if (line.numberOfTiles >= line.length) {
            return { valid: false, error: "Pattern line is full" };
        }

        if (line.tileType && line.tileType !== tileType) {
            return { valid: false, error: "Pattern line contains different color" };
        }

        if (this.isColorInWallRow(patternLineIndex, tileType)) {
            return { valid: false, error: "Color already exists in wall row" };
        }

        return { valid: true };
    }

    isColorInWallRow(rowIndex, tileType) {
        if (!this._wall[rowIndex]) return false;
        return this._wall[rowIndex].some(tile =>
            tile?.type === tileType && tile?.hasTile
        );
    }

}
export default Board;