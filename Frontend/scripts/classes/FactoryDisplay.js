import ResourceManager from "./ResourceManager.js";
import ClickableCanvas from "./ClickableCanvas.js";

class FactoryDisplay extends ClickableCanvas {
    #_factoryId;
    #_tiles;

    constructor(factoryId) {
        super("factory-" + factoryId, 100, 100, ["factoryDisplay"]);
        this.#_factoryId = factoryId;
        this.#_tiles = [];
    };

    #ShouldDrawCell(tileIndex, x, y, w, h) {
        this.CanvasContext.drawImage(ResourceManager.Tiles[this.#_tiles[tileIndex]], x + 2, y + 2, w - 4, h - 4)
    }

    #TileClicked(tileIndex) {
        console.log(this.#_factoryId + " Tile(" + tileIndex + ")");
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
            let row = Math.floor(i / 2);

            let [x, y, w, h] = [cellSize * i - (row * cellSize * 2) + cellSize / 4, row * cellSize + cellSize / 4, cellSize, cellSize];
            // ctx.rect(x, y, w, h);
            this.#ShouldDrawCell(i, x - 1, y - 1, w + 2, h + 2);

            this.RegisterClickableRegion("tile_" + i, x, y, w, h, () => {
                this.#TileClicked(i);
            });
        }

        // End Draw TileFactory

        ctx.stroke(); // Execute the drawing operation
    }

    get Id() {
        return this.#_factoryId;
    }

    set Tiles(tiles) {
        this.#_tiles = tiles;
    }

}

export default FactoryDisplay;