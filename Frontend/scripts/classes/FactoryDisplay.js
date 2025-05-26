import ResourceManager from "./ResourceManager.js";
import ClickableCanvas from "./ClickableCanvas.js";
import { gameState } from "../../game/play/script.js";

class FactoryDisplay extends ClickableCanvas {
    #_factoryId;
    #_tiles;
    #selectedTileType = null;

    clearSelection() {
        this.#selectedTileType = null;
        this.Paint();
    }

    constructor(factoryId) {
        super("factory-" + factoryId, 100, 100, ["factoryDisplay"]);
        this.#_factoryId = factoryId;
        this.#_tiles = [];
    };

    #ShouldDrawCell(tileIndex, x, y, w, h) {
        this.CanvasContext.drawImage(ResourceManager.Tiles[this.#_tiles[tileIndex]], x + 2, y + 2, w - 4, h - 4)
    }

    #TileClicked(tileIndex) {
        const tileType = this.#_tiles[tileIndex];
        this.#selectedTileType = tileType;

        document.dispatchEvent(new CustomEvent('factoryTileSelected', {
            detail: {
                displayId: this.#_factoryId,
                tileType: tileType,
                tileCount: this.#_tiles.filter(t => t === tileType).length
            }
        }));

        this.Paint();
    }

    Clear() {
        this.CanvasContext.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
        this.ClearClickableRegions();
    }

    Paint() {
        this.Clear();

        /**
         * @type {Canvas}
         */
        let cv = this.Canvas;

        /**
         * @type {CanvasRenderingContext2D}
         */
        let ctx = this.CanvasContext;

        // Tile Cell Size
        let cellSize = cv.width / 2.5;

        ctx.beginPath(); // Start a new drawing operation
        ctx.lineWidth = 2;


        // Start Draw TileFactory

        ctx.drawImage(ResourceManager.FactoryBackground, 0, 0, 100, 100)

        for (let i = 0; i < this.#_tiles.length; i++) {
            const row = Math.floor(i / 2);
            const col = i % 2;

            let [x, y, w, h] = [
                cellSize * i - (row * cellSize * 2) +
                cellSize / 4, row * cellSize +
                cellSize / 4, cellSize, cellSize
            ];
            // ctx.rect(x, y, w, h);
            this.#ShouldDrawCell(i, x - 1, y - 1, w + 2, h + 2);

            this.RegisterClickableRegion("tile_" + i, x, y, w, h, () => {
                this.#TileClicked(i);
            });
        }

        // End Draw TileFactory

        if (gameState.currentSelection?.displayId === this.#_factoryId) {
            const selectedType = gameState.currentSelection.tileType;
            const selectedTiles = this.#_tiles
                .map((t, i) => ({t, i}))
                .filter(({t}) => t === selectedType);

            selectedTiles.forEach(({i}) => {
                const row = Math.floor(i / 2);
                const [x, y, w, h] = [
                    cellSize * i - (row * cellSize * 2) +
                    cellSize / 4, row * cellSize +
                    cellSize / 4, cellSize, cellSize
                ];
                this.drawTileHighlight(ctx, x, y, w, h);
            });
        }
        if (this.#_tiles.length === 0) {
            this.Clear();
        }
    }

    get Id() {
        return this.#_factoryId;
    }

    set Tiles(tiles) {
        this.#_tiles = tiles;
    }
}

export default FactoryDisplay;