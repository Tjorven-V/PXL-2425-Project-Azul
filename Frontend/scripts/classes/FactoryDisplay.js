import ResourceManager from "./ResourceManager.js";

class FactoryDisplay {
    #_factoryId;
    #_canvas;
    #_canvasContext;
    #_clickableSpots;
    #_tiles;

    constructor(factoryId) {
        this.#_factoryId = factoryId;
        this.#_clickableSpots = {};
        this.#_tiles = [];
    };

    CreateCanvasElement() {
        this.#_canvas = document.createElement("canvas");
        this.#_canvas.id = this.#_factoryId;
        this.#_canvas.classList.add("factoryDisplay");
        this.#_canvas.addEventListener("click", e => this.#Click(e));

        // reference resolution of 400×400
        // do not change, scale with CSS instead.
        this.#_canvas.width = 100;
        this.#_canvas.height = 100;

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

    #ShouldDrawCell(tileIndex, x, y, w, h) {
        this.#_canvasContext.drawImage(ResourceManager.Tiles[this.#_tiles[tileIndex]], x + 2, y + 2, w - 4, h - 4)
    }

    #TileClicked(tileIndex) {
        console.log(this.#_factoryId + " Tile(" + tileIndex + ")");
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
        let cellSize = cv.width / 2.5;

        ctx.beginPath(); // Start a new drawing operation
        ctx.lineWidth = 2;


        // Start Draw TileFactory

        this.#_canvasContext.drawImage(ResourceManager.FactoryBackground, 0, 0, 100, 100)

        for (let i = 0; i < this.#_tiles.length; i++) {
            let row = Math.floor(i / 2);

            let [x, y, w, h] = [cellSize * i - (row * cellSize * 2) + cellSize / 4, row * cellSize + cellSize / 4, cellSize, cellSize];
            // ctx.rect(x, y, w, h);
            this.#ShouldDrawCell(i, x, y, w, h);

            this.#_clickableSpots["tile_" + i] = {
                x, y, w, h,
                click: () => {
                    this.#TileClicked(i);
                }};
        }

        // End Draw TileFactory

        ctx.stroke(); // Execute the drawing operation
    }

    set Tiles(tiles) {
        this.#_tiles = tiles;
    }

}

export default FactoryDisplay;