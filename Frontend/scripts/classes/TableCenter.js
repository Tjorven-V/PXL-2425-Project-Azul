import ResourceManager from "./ResourceManager.js";
import ClickableCanvas from "./ClickableCanvas.js";

class TableCenter extends ClickableCanvas {
    constructor(id) {
        super("table-center", 600, 200, ["table-center-display"]);
        this.id = id;
        this.tiles = [];
    }

    Clear() {
        this.CanvasContext.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
        this.ClearClickableRegions();
    }

    set Tiles(newTiles) {
        this.tiles = newTiles;
        this.Paint();
    }

    Paint() {
        this.Clear();
        const ctx = this.CanvasContext;

        const tilesPerRow = 8;
        const padding = 10;
        const maxTileSize = (this.Canvas.width - (tilesPerRow - 1) * padding) / tilesPerRow;

        const transX = (this.Canvas.width - (tilesPerRow * maxTileSize + (tilesPerRow - 1) * padding)) / 2;
        const transY = 20;

        ctx.save();
        ctx.translate(transX, transY);

        const filteredTiles = this.tiles.filter(t => t !== 0);

        filteredTiles.forEach((tileType, index) => {
            const row = Math.floor(index / tilesPerRow);
            const col = index % tilesPerRow;

            const x = col * (maxTileSize + padding);
            const y = row * (maxTileSize + padding);

            this.RegisterClickableRegion(
                `tile_${index}`,
                transX + x,
                transY + y,
                maxTileSize,
                maxTileSize,
                () => this.handleTileClick(tileType)
            );

            if (ResourceManager.Tiles[tileType]) {
                ctx.drawImage(
                    ResourceManager.Tiles[tileType],
                    x,
                    y,
                    maxTileSize,
                    maxTileSize
                );
            }
        });

        ctx.restore();
    }

    handleTileClick(tileType) {
        document.dispatchEvent(new CustomEvent('factoryTileSelected', {
            detail: {
                displayId: this.id,
                tileType: tileType,
                tileCount: this.tiles.filter(t => t === tileType).length
            }
        }));
    }
}

export default TableCenter;